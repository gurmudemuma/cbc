import { Request, Response, NextFunction } from 'express';
import { FabricGateway } from '../fabric/gateway';
import { createExportService } from '../../../shared/exportService';
import { CacheService, CacheKeys, CacheTTL } from '../../../shared/cache.service';
import { getAuditService } from '../../../shared/auditService';
import { ResilientBlockchainService } from '../../../shared/resilience.service';
import { ErrorCode, AppError } from '../../../shared/error-codes';
import { logger } from '../../../shared/logger';
import { getWebSocketService } from '../../../shared/websocket.service';
import ExportStateMachine from '../../../shared/stateMachine';
import { getStatusInfo, getAvailableActions, ExportStatus } from '../../../shared/exportService';

// Type definition for authenticated request
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    organization: string;
    organizationId?: string;
    username?: string;
  };
  requestId?: string;
}

// Response builder helper
class ApiResponseBuilder {
  static success<T>(data: T, message?: string) {
    return {
      success: true,
      data,
      message,
    };
  }

  static complete<T>(response: any, path: string, requestId?: string) {
    return {
      ...response,
      timestamp: new Date().toISOString(),
      path,
      requestId,
    };
  }
}

const auditService = getAuditService();

/**
 * Export Controller for Commercial Bank
 *
 * Commercial Bank is responsible for:
 * - Verifying export documents (after ECTA contract approval)
 * - Submitting FX applications to NBE
 * - Tracking FX approval status
 *
 * Commercial Bank CANNOT:
 * - Create exports (done by Exporter Portal)
 * - Approve ECTA licenses/contracts (done by ECTA)
 * - Clear customs (done by Custom Authorities)
 */
export class ExportController {
  private fabricGateway: FabricGateway;
  private cacheService: CacheService;
  private resilienceService: ResilientBlockchainService;

  constructor() {
    this.fabricGateway = FabricGateway.getInstance();
    this.cacheService = CacheService.getInstance();
    this.resilienceService = new ResilientBlockchainService('commercialbank');
  }

  public getAllExports = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const requestId = (req as any).requestId;
      const user = req.user;

      if (!user || !user.organizationId) {
        throw new AppError(ErrorCode.AUTHENTICATION_FAILED, 'User not authenticated', 401);
      }

      const cacheKey = `exports:${user.organizationId}:all`;

      // Try cache first
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        res
          .status(200)
          .json(
            ApiResponseBuilder.complete(
              ApiResponseBuilder.success(cached, 'Exports retrieved successfully (cached)'),
              req.path,
              requestId
            )
          );
        return;
      }

      logger.info(`[${requestId}] Fetching all exports for organization`, {
        organizationId: user.organizationId,
      });

      // Fetch with resilience
      const exports = await this.resilienceService.executeQuery(async () => {
        const contract = this.fabricGateway.getExportContract();
        const exportService = createExportService(contract);
        return await exportService.getAllExports();
      }, 'getAllExports');

      // Cache the result
      await this.cacheService.set(cacheKey, exports, CacheTTL.MEDIUM);

      // Aggregations for alignment
      const byStatus = (exports as any[]).reduce(
        (acc: Record<string, number>, e: any) => {
          const s = e?.status || 'UNKNOWN';
          acc[s] = (acc[s] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      res
        .status(200)
        .json(
          ApiResponseBuilder.complete(
            ApiResponseBuilder.success(
              { items: exports, count: (exports as any[]).length, byStatus },
              'Exports retrieved successfully'
            ),
            req.path,
            requestId
          )
        );
    } catch (error) {
      next(error);
    }
  };

  public getExport = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const requestId = (req as any).requestId;
      const { exportId } = req.params;

      if (!exportId) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Export ID is required', 400);
      }

      // Try cache first
      const cacheKey = CacheKeys.export(exportId);
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        res
          .status(200)
          .json(
            ApiResponseBuilder.complete(
              ApiResponseBuilder.success(cached, 'Export retrieved successfully (cached)'),
              req.path,
              requestId
            )
          );
        return;
      }

      logger.info(`[${requestId}] Fetching export`, { exportId });

      // Fetch with resilience
      const exportData = await this.resilienceService.executeQuery(async () => {
        const contract = this.fabricGateway.getExportContract();
        const exportService = createExportService(contract);
        return await exportService.getExport(exportId);
      }, `getExport:${exportId}`);

      // Cache the result
      await this.cacheService.set(cacheKey, exportData, CacheTTL.SHORT);

      res
        .status(200)
        .json(
          ApiResponseBuilder.complete(
            ApiResponseBuilder.success(exportData, 'Export retrieved successfully'),
            req.path,
            requestId
          )
        );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get exports pending document verification (Commercial Bank's responsibility)
   */
  public getPendingDocuments = async (
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const requestId = (_req as any).requestId;
      const contract = this.fabricGateway.getExportContract();
      const exportService = createExportService(contract);
      const exports = await exportService.getExportsByStatus('ECTA_CONTRACT_APPROVED');

      res
        .status(200)
        .json(
          ApiResponseBuilder.complete(
            ApiResponseBuilder.success(
              { items: exports, count: (exports as any[]).length },
              'Pending documents retrieved'
            ),
            _req.path,
            requestId
          )
        );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Verify and approve export documents (Commercial Bank's task)
   */
  public approveDocuments = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const requestId = (req as any).requestId;
      const { exportId } = req.params;
      const user = req.user;

      if (!user) {
        throw new AppError(ErrorCode.AUTHENTICATION_FAILED, 'User not authenticated', 401);
      }

      if (!user.organizationId) {
        throw new AppError(ErrorCode.AUTHENTICATION_FAILED, 'User organization not found', 401);
      }

      if (!exportId) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Export ID is required', 400);
      }

      const { verifiedBy, notes } = req.body;

      logger.info(`[${requestId}] Verifying documents for export`, { exportId, userId: user.id });

      // Submit with resilience
      await this.resilienceService.executeTransaction(async () => {
        const contract = this.fabricGateway.getExportContract();
        return await contract.submitTransaction(
          'VerifyDocuments',
          exportId,
          verifiedBy || user.username,
          notes || ''
        );
      }, `verifyDocuments:${exportId}`);

      // Audit log
      await auditService.logAction(
        exportId,
        user.id,
        user.organizationId!,
        'VERIFY_BANKING' as any,
        'APPROVAL',
        'ECTA_CONTRACT_APPROVED',
        'BANK_DOCUMENT_VERIFIED',
        {
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        }
      );

      // Invalidate cache
      await this.cacheService.delete(CacheKeys.export(exportId));
      await this.cacheService.deletePattern('exports:*');
      await this.cacheService.delete(`fx-status:${exportId}`);

      // Real-time updates
      const ws1 = getWebSocketService();
      if (ws1) {
        ws1.emitExportUpdate(exportId, { status: 'BANK_DOCUMENT_VERIFIED' });
      }

      res
        .status(200)
        .json(
          ApiResponseBuilder.complete(
            ApiResponseBuilder.success({ exportId }, 'Documents verified successfully'),
            req.path,
            requestId
          )
        );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Reject export documents (Commercial Bank's task)
   */
  public rejectDocuments = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const requestId = (req as any).requestId;
      const { exportId } = req.params;
      const user = req.user;

      if (!user) {
        throw new AppError(ErrorCode.AUTHENTICATION_FAILED, 'User not authenticated', 401);
      }

      if (!user.organizationId) {
        throw new AppError(ErrorCode.AUTHENTICATION_FAILED, 'User organization not found', 401);
      }

      if (!exportId) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Export ID is required', 400);
      }

      const { rejectedBy, reason, notes } = req.body;

      if (!reason) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Rejection reason is required', 400);
      }

      logger.info(`[${requestId}] Rejecting documents for export`, {
        exportId,
        userId: user.id,
        reason,
      });

      // Submit with resilience
      await this.resilienceService.executeTransaction(async () => {
        const contract = this.fabricGateway.getExportContract();
        return await contract.submitTransaction(
          'RejectDocuments',
          exportId,
          rejectedBy || user.username,
          reason,
          notes || ''
        );
      }, `rejectDocuments:${exportId}`);

      // Audit log
      await auditService.logAction(
        exportId,
        user.id,
        user.organizationId!,
        'REJECT_BANKING' as any,
        'REJECTION',
        'ECTA_CONTRACT_APPROVED',
        'BANK_DOCUMENT_REJECTED',
        {
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          reason,
        }
      );

      // Invalidate cache
      await this.cacheService.delete(CacheKeys.export(exportId));
      await this.cacheService.deletePattern('exports:*');
      await this.cacheService.delete(`fx-status:${exportId}`);

      // Real-time updates
      const ws2 = getWebSocketService();
      if (ws2) {
        ws2.emitExportUpdate(exportId, { status: 'BANK_DOCUMENT_REJECTED', reason });
      }

      res
        .status(200)
        .json(
          ApiResponseBuilder.complete(
            ApiResponseBuilder.success({ exportId, reason }, 'Documents rejected successfully'),
            req.path,
            requestId
          )
        );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Submit FX request to NBE (Commercial Bank's task - after document verification)
   */
  public submitFXApplication = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const requestId = (req as any).requestId;
      const user = req.user;

      if (!user) {
        throw new AppError(ErrorCode.AUTHENTICATION_FAILED, 'User not authenticated', 401);
      }

      if (!user.organizationId) {
        throw new AppError(ErrorCode.AUTHENTICATION_FAILED, 'User organization not found', 401);
      }

      const { exportId } = req.params;

      if (!exportId) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Export ID is required', 400);
      }

      logger.info(`[${requestId}] Submitting FX application for export`, {
        exportId,
        userId: user.id,
      });

      // Get export from blockchain
      const contract = this.fabricGateway.getExportContract();
      const exportService = createExportService(contract);
      const exportData = await exportService.getExport(exportId);

      // Verify export has document verification completed
      if (exportData.status !== 'BANK_DOCUMENT_VERIFIED') {
        throw new AppError(
          ErrorCode.INVALID_STATUS_TRANSITION,
          `Export must have documents verified. Current status: ${exportData.status}`,
          400
        );
      }

      // Verify all required documents
      const verification = this.checkDocuments(exportData);
      if (!verification.valid) {
        throw new AppError(
          ErrorCode.MISSING_REQUIRED_FIELD,
          `Missing required documents: ${verification.missing.join(', ')}`,
          400
        );
      }

      // Submit FX application to NBE via blockchain
      const result = await this.resilienceService.executeTransaction(async () => {
        return await contract.submitTransaction('SubmitForFX', exportId);
      }, 'submitFXApplication');

      // Audit log
      await auditService.logAction(
        exportId,
        user.id,
        user.organizationId!,
        'APPROVE_FX' as any,
        'APPROVAL',
        'BANK_DOCUMENT_VERIFIED',
        'FX_APPLICATION_PENDING',
        {
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        }
      );

      // Invalidate cache
      await this.cacheService.delete(CacheKeys.export(exportId));
      await this.cacheService.delete(`fx-status:${exportId}`);

      // Real-time updates
      const ws3 = getWebSocketService();
      if (ws3) {
        ws3.emitExportUpdate(exportId, { status: 'FX_APPLICATION_PENDING' });
      }

      res
        .status(201)
        .json(
          ApiResponseBuilder.complete(
            ApiResponseBuilder.success(
              { exportId, status: 'FX_APPLICATION_PENDING' },
              'FX application submitted to NBE'
            ),
            req.path,
            requestId
          )
        );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get FX application status (Commercial Bank's task)
   */
  public getFXStatus = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { exportId } = req.params;
      if (!exportId) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Export ID is required', 400);
      }

      // Try cache first
      const cacheKey = `fx-status:${exportId}`;
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        res.status(200).json({
          success: true,
          message: 'FX status retrieved successfully (cached)',
          data: cached,
          cached: true,
        });
        return;
      }

      // Get export from blockchain
      const exportData = await this.resilienceService.executeQuery(async () => {
        const contract = this.fabricGateway.getExportContract();
        const exportService = createExportService(contract);
        return await exportService.getExport(exportId);
      }, `getFXStatus:${exportId}`);

      // Extract FX-related information
      const fxStatus = {
        exportId,
        currentStatus: exportData.status,
        fxApplicationSubmitted:
          exportData.status === 'FX_APPLICATION_PENDING' ||
          exportData.status === 'FX_APPROVED' ||
          exportData.status === 'FX_REJECTED',
        fxApproved: exportData.status === 'FX_APPROVED',
        fxRejected: exportData.status === 'FX_REJECTED',
        fxApprovalId: (exportData as any).fxApprovalId,
        approvedAt: (exportData as any).fxApprovedAt,
        rejectionReason: (exportData as any).fxRejectionReason,
        approvedBy: (exportData as any).fxApprovedBy,
      };

      // Cache the result
      await this.cacheService.set(cacheKey, fxStatus, CacheTTL.SHORT);

      res.status(200).json({
        success: true,
        message: 'FX status retrieved successfully',
        data: fxStatus,
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  };

  /**
   * Check all required documents status
   */
  public verifyAllDocuments = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { exportId } = req.params;

      if (!exportId) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Export ID is required', 400);
      }

      // Get export from blockchain
      const contract = this.fabricGateway.getExportContract();
      const exportService = createExportService(contract);
      const exportData = await exportService.getExport(exportId);

      const verification = this.checkDocuments(exportData);

      res.status(200).json({
        success: true,
        message: 'Document verification completed',
        data: {
          exportId,
          valid: verification.valid,
          missing: verification.missing,
          present: verification.present,
          missingCount: verification.missing.length,
          presentCount: verification.present.length,
          totalRequired: verification.missing.length + verification.present.length,
        },
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  };

  /**
   * Helper: Check all required documents
   */
  private checkDocuments(exportData: any): {
    valid: boolean;
    missing: string[];
    present: string[];
  } {
    const missing: string[] = [];
    const present: string[] = [];

    // Check ECTA documents
    if (!exportData.exportLicenseValidatedBy) {
      missing.push('ECTA License Validation');
    } else {
      present.push('ECTA License Validation');
    }

    if (!exportData.qualityDocuments || exportData.qualityDocuments.length === 0) {
      missing.push('ECTA Quality Certificate');
    } else {
      present.push('ECTA Quality Certificate');
    }

    if (!exportData.originCertificateNumber) {
      missing.push('Certificate of Origin');
    } else {
      present.push('Certificate of Origin');
    }

    if (!exportData.contractApprovedBy) {
      missing.push('ECTA Contract Approval');
    } else {
      present.push('ECTA Contract Approval');
    }

    // Check commercial documents (if required)
    if (!exportData.commercialInvoice) {
      missing.push('Commercial Invoice');
    } else {
      present.push('Commercial Invoice');
    }

    if (!exportData.salesContract) {
      missing.push('Sales Contract');
    } else {
      present.push('Sales Contract');
    }

    return {
      valid: missing.length === 0,
      missing,
      present,
    };
  }

  /**
   * Centralized error handling
   */
  public getCreationFormData = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    // Static and computed options for export creation forms
    const coffeeTypes = ['Arabica', 'Robusta', 'Blend'];
    const transportModes = ['SEA', 'AIR', 'RAIL'];

    const transitions = ExportStateMachine.getAllTransitions();
    const statusOptions = Object.keys(transitions).map((status) => {
      const s = status as ExportStatus;
      const info = getStatusInfo(s);
      return {
        value: s,
        label: info.label,
        color: info.color,
        description: info.description,
        stage: ExportStateMachine.getWorkflowStage(s),
        progress: ExportStateMachine.getProgressPercentage(s),
      };
    });

    res.status(200).json({
      success: true,
      message: 'Form data retrieved',
      data: {
        coffeeTypes,
        transportModes,
        statusOptions,
        validation: {
          minQuantity: 1,
          minEstimatedValue: 0,
        },
      },
    });
  };

  public getWorkflowData = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { exportId } = req.params;
      const user = req.user;

      if (!exportId) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Export ID is required', 400);
      }
      if (!user) {
        throw new AppError(ErrorCode.AUTHENTICATION_FAILED, 'User not authenticated', 401);
      }

      const contract = this.fabricGateway.getExportContract();
      const exportService = createExportService(contract);
      const exportData = await exportService.getExport(exportId);

      const statusInfo = getStatusInfo(exportData.status as ExportStatus);
      const stage = ExportStateMachine.getWorkflowStage(exportData.status as ExportStatus);
      const progress = ExportStateMachine.getProgressPercentage(exportData.status as ExportStatus);
      const nextStatuses = ExportStateMachine.getNextStatuses(exportData.status as ExportStatus);
      const actions = getAvailableActions(
        user.role?.toLowerCase() || 'unknown',
        exportData.status as ExportStatus
      );

      const verification = this.checkDocuments(exportData);

      res.status(200).json({
        success: true,
        message: 'Workflow data bundle retrieved',
        data: {
          export: exportData,
          status: exportData.status,
          statusInfo,
          stage,
          progress,
          nextStatuses,
          allowedActions: actions,
          documents: {
            missing: verification.missing,
            present: verification.present,
            missingCount: verification.missing.length,
            presentCount: verification.present.length,
            totalRequired: verification.missing.length + verification.present.length,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };

  private handleError(error: any, res: Response): void {
    if (error instanceof AppError) {
      res.status(error.httpStatus).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          retryable: error.retryable,
        },
      });
      return;
    }

    // Log unexpected errors
    console.error('Unexpected error:', error);

    res.status(500).json({
      success: false,
      error: {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'An unexpected error occurred',
        retryable: false,
      },
    });
  }
}
