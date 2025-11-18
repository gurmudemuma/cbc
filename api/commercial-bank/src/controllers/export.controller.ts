import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { FabricGateway } from '../fabric/gateway';
import { createExportService } from '../../../shared/exportService';
import { CacheService, CacheKeys, CacheTTL } from '../../../shared/cache.service';
import { auditService, AuditAction } from '../../../shared/audit.service';
import { ResilientBlockchainService } from '../../../shared/resilience.service';
import { ErrorCode, AppError } from '../../../shared/error-codes';
import { ectaPreRegistrationService } from '../../../shared/services/ecta-preregistration.service';

interface AuthJWTPayload extends JwtPayload {
  id: string;
  username: string;
  organizationId: string;
  role: string;
}

interface RequestWithUser extends Request {
  user?: AuthJWTPayload;
}

export class ExportController {
  private fabricGateway: FabricGateway;
  private cacheService: CacheService;
  private resilienceService: ResilientBlockchainService;

  constructor() {
    this.fabricGateway = FabricGateway.getInstance();
    this.cacheService = CacheService.getInstance();
    this.resilienceService = new ResilientBlockchainService('commercialbank');
  }

  public createExport = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      const exportData = req.body;

      // Validate required fields
      if (!exportData.exporterName || !exportData.coffeeType || !exportData.quantity) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Missing required fields', 400);
      }

      // CRITICAL: Validate exporter pre-registration status
      if (exportData.exporterId) {
        const canExport = await ectaPreRegistrationService.canCreateExportRequest(exportData.exporterId);
        
        if (!canExport.allowed) {
          res.status(403).json({
            success: false,
            message: 'Cannot create export: Exporter not qualified',
            reason: canExport.reason,
            requiredActions: canExport.requiredActions,
            redirectTo: '/pre-registration'
          });
          return;
        }
      }

      // Generate export ID
      const exportId = `EXP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Submit with resilience
      const result = await this.resilienceService.executeTransaction(async () => {
        const contract = this.fabricGateway.getExportContract();
        const exportService = createExportService(contract);
        return await exportService.createExport(
          exportId,
          user.organizationId,
          {
            ...exportData,
            exporterId: user.organizationId,
          }
        );
      }, 'createExport');

      // Audit log
      auditService.logStatusChange(
        user.id,
        result.exportId,
        'NONE',
        'PENDING',
        AuditAction.EXPORT_CREATED,
        {
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        }
      );

      // Invalidate cache
      await this.cacheService.deletePattern('exports:*');

      res.status(201).json({ success: true, data: result, message: 'Export created successfully' });
    } catch (error: any) {
      this.handleError(error, res);
    }
  };

  public getAllExports = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      const cacheKey = `exports:${user.organizationId}:all`;

      // Try cache first
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        res.json({ success: true, data: cached, cached: true });
        return;
      }

      // Fetch with resilience
      const exports = await this.resilienceService.executeQuery(async () => {
        const contract = this.fabricGateway.getExportContract();
        const exportService = createExportService(contract);
        return await exportService.getAllExports();
      }, 'getAllExports');

      // Cache the result
      await this.cacheService.set(cacheKey, exports, CacheTTL.MEDIUM);

      res.json({ success: true, data: exports });
    } catch (error: any) {
      this.handleError(error, res);
    }
  };

  public getExport = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { exportId } = req.params;
      if (!exportId) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Export ID is required', 400);
      }

      // Try cache first
      const cacheKey = CacheKeys.export(exportId);
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        res.json({ success: true, data: cached, cached: true });
        return;
      }

      // Fetch with resilience
      const exportData = await this.resilienceService.executeQuery(async () => {
        const contract = this.fabricGateway.getExportContract();
        const exportService = createExportService(contract);
        return await exportService.getExport(exportId);
      }, `getExport:${exportId}`);

      // Cache the result
      await this.cacheService.set(cacheKey, exportData, CacheTTL.SHORT);

      res.json({ success: true, data: exportData });
    } catch (error: any) {
      this.handleError(error, res);
    }
  };

  /**
   * Get exports pending document verification (Commercial Bank's responsibility)
   */
  public getPendingDocuments = async (_req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const contract = this.fabricGateway.getExportContract();
      const exportService = createExportService(contract);
      const exports = await exportService.getExportsByStatus('ECTA_CONTRACT_APPROVED');
      res.json({ success: true, data: exports, count: exports.length });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch pending documents', error: error.message });
    }
  };

  /**
   * Verify and approve export documents (Commercial Bank's task)
   */
  public approveDocuments = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { exportId } = req.params;
      const user = req.user!;
      if (!exportId) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Export ID is required', 400);
      }

      const { verifiedBy, notes } = req.body;

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
      auditService.logStatusChange(
        user.id,
        exportId,
        'ECTA_CONTRACT_APPROVED',
        'BANK_DOCUMENT_VERIFIED',
        AuditAction.BANKING_APPROVED,
        {
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        }
      );

      // Invalidate cache
      await this.cacheService.delete(CacheKeys.export(exportId));
      await this.cacheService.deletePattern('exports:*');

      res.json({ success: true, message: 'Documents verified successfully' });
    } catch (error: any) {
      this.handleError(error, res);
    }
  };

  /**
   * Reject export documents (Commercial Bank's task)
   */
  public rejectDocuments = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { exportId } = req.params;
      const user = req.user!;
      if (!exportId) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Export ID is required', 400);
      }

      const { rejectedBy, reason, notes } = req.body;

      if (!reason) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Rejection reason is required', 400);
      }

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
      auditService.logStatusChange(
        user.id,
        exportId,
        'ECTA_CONTRACT_APPROVED',
        'BANK_DOCUMENT_REJECTED',
        AuditAction.BANKING_REJECTED,
        {
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          reason,
        }
      );

      // Invalidate cache
      await this.cacheService.delete(CacheKeys.export(exportId));
      await this.cacheService.deletePattern('exports:*');

      res.json({ 
        success: true, 
        message: 'Documents rejected successfully',
        reason,
        status: 'BANK_DOCUMENT_REJECTED'
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  };

  /**
   * Submit FX request to NBE (Commercial Bank's task - after document verification)
   */
  public submitFXApplication = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      const { exportId } = req.params;

      if (!exportId) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Export ID is required', 400);
      }

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
      auditService.logStatusChange(
        user.id,
        exportId,
        'BANK_DOCUMENT_VERIFIED',
        'FX_APPLICATION_PENDING',
        AuditAction.BANKING_APPROVED,
        {
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        }
      );

      // Invalidate cache
      await this.cacheService.delete(CacheKeys.export(exportId));

      res.json({
        success: true,
        message: 'FX application submitted to NBE',
        exportId,
        status: 'FX_APPLICATION_PENDING',
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  };

  /**
   * Get FX application status (Commercial Bank's task)
   */
  public getFXStatus = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { exportId } = req.params;
      if (!exportId) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Export ID is required', 400);
      }

      // Try cache first
      const cacheKey = `fx-status:${exportId}`;
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        res.json({ success: true, data: cached, cached: true });
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
        fxApplicationSubmitted: exportData.status === 'FX_APPLICATION_PENDING' || 
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

      res.json({ success: true, data: fxStatus });
    } catch (error: any) {
      this.handleError(error, res);
    }
  };

  /**
   * Check all required documents status (NEW)
   */
  public verifyAllDocuments = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
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

      res.json({
        success: true,
        exportId,
        valid: verification.valid,
        missing: verification.missing,
        present: verification.present,
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  };

  /**
   * Helper: Check all required documents
   */
  private checkDocuments(exportData: any): { valid: boolean; missing: string[]; present: string[] } {
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
