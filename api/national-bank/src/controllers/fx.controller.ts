/**
 * FX Controller for National Bank
 * Handles Foreign Exchange approval/rejection with best practices
 */

import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { FabricGateway } from '../fabric/gateway';
import { createExportService } from '../../../shared/exportService';
import { CacheService, CacheKeys, CacheTTL } from '../../../shared/cache.service';
import { auditService, AuditAction } from '../../../shared/audit.service';
import { ResilientBlockchainService } from '../../../shared/resilience.service';
import { ErrorCode, AppError } from '../../../shared/error-codes';

interface AuthJWTPayload extends JwtPayload {
  id: string;
  username: string;
  organizationId: string;
  role: string;
}

interface RequestWithUser extends Request {
  user?: AuthJWTPayload;
}

export class FXController {
  private fabricGateway: FabricGateway;
  private cacheService: CacheService;
  private resilienceService: ResilientBlockchainService;

  constructor() {
    this.fabricGateway = FabricGateway.getInstance();
    this.cacheService = CacheService.getInstance();
    this.resilienceService = new ResilientBlockchainService('national-bank');
  }

  /**
   * Get all exports (with caching)
   */
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

  /**
   * Get single export by ID
   */
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
   * Get exports pending FX approval
   */
  public getPendingFXApprovals = async (_req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      // Try cache first
      const cacheKey = 'exports:fx:pending';
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        const count = Array.isArray(cached) ? cached.length : 0;
        res.json({ success: true, data: cached, count, cached: true });
        return;
      }

      // Fetch with resilience
      const exports = await this.resilienceService.executeQuery(async () => {
        const contract = this.fabricGateway.getExportContract();
        const exportService = createExportService(contract);
        return await exportService.getExportsByStatus('FX_PENDING');
      }, 'getPendingFX');

      // Cache for short time (1 minute)
      await this.cacheService.set(cacheKey, exports, CacheTTL.SHORT);

      res.json({ success: true, data: exports, count: exports.length });
    } catch (error: any) {
      this.handleError(error, res);
    }
  };

  /**
   * Approve FX for an export
   */
  public approveFX = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { exportId } = req.params;
      const user = req.user!;
      
      if (!exportId) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Export ID is required', 400);
      }

      const { fxApprovalID, approvedBy, documentCIDs } = req.body;

      // Submit with resilience
      await this.resilienceService.executeTransaction(async () => {
        const contract = this.fabricGateway.getExportContract();
        const exportService = createExportService(contract);
        return await exportService.approveFX(exportId, {
          fxApprovalID,
          documentCIDs,
        });
      }, `approveFX:${exportId}`);

      // Audit log
      auditService.logFXApproval(
        user.id,
        user.username,
        user.organizationId,
        exportId,
        true,
        undefined,
        {
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        }
      );

      // Invalidate cache
      await this.cacheService.delete(CacheKeys.export(exportId));
      await this.cacheService.deletePattern('exports:*');

      res.json({
        success: true,
        message: 'FX approved successfully',
        data: { exportId, fxApprovalID },
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  };

  /**
   * Reject FX for an export
   */
  public rejectFX = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { exportId } = req.params;
      const user = req.user!;
      
      if (!exportId) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Export ID is required', 400);
      }

      const { reason, rejectedBy } = req.body;

      if (!reason || reason.trim().length < 10) {
        throw new AppError(
          ErrorCode.INVALID_INPUT,
          'Rejection reason must be at least 10 characters',
          400
        );
      }

      // Submit with resilience
      await this.resilienceService.executeTransaction(async () => {
        const contract = this.fabricGateway.getExportContract();
        const exportService = createExportService(contract);
        return await exportService.rejectFX(exportId, reason);
      }, `rejectFX:${exportId}`);

      // Audit log
      auditService.logFXApproval(
        user.id,
        user.username,
        user.organizationId,
        exportId,
        false,
        reason,
        {
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        }
      );

      // Invalidate cache
      await this.cacheService.delete(CacheKeys.export(exportId));
      await this.cacheService.deletePattern('exports:*');

      res.json({
        success: true,
        message: 'FX rejected',
        data: { exportId, reason },
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  };

  /**
   * Get exports by status
   */
  public getExportsByStatus = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { status } = req.params;
      
      if (!status) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Status is required', 400);
      }

      // Try cache first
      const cacheKey = CacheKeys.exportsByStatus(status);
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        const count = Array.isArray(cached) ? cached.length : 0;
        res.json({ success: true, data: cached, count, cached: true });
        return;
      }

      // Fetch with resilience
      const exports = await this.resilienceService.executeQuery(async () => {
        const contract = this.fabricGateway.getExportContract();
        const exportService = createExportService(contract);
        return await exportService.getExportsByStatus(status as any);
      }, `getExportsByStatus:${status}`);

      // Cache the result
      await this.cacheService.set(cacheKey, exports, CacheTTL.MEDIUM);

      res.json({ success: true, data: exports, count: exports.length });
    } catch (error: any) {
      this.handleError(error, res);
    }
  };

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
