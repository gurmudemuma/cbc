
import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { pool } from '@shared/database/pool';
import { CacheService, CacheKeys, CacheTTL } from '@shared/cache.service';
import { auditService, AuditAction } from '@shared/audit.service';
import { ErrorCode, AppError } from '@shared/error-codes';
import { ectaPreRegistrationService } from '@shared/services/ecta-preregistration.service';
import { createLogger } from '@shared/logger';
import { ExportService } from '@shared/services/export.service';

const logger = createLogger('ExportPostgresController');
const exportService = new ExportService(pool);

interface AuthJWTPayload extends JwtPayload {
  id: string;
  username: string;
  organizationId: string;
  role: string;
}

interface RequestWithUser extends Request {
  user?: AuthJWTPayload;
}

export class ExportPostgresController {
  private cacheService: CacheService;

  constructor() {
    this.cacheService = CacheService.getInstance();
  }

  /**
   * Create a new export request
   */
  public createExport = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    const client = await pool.connect();
    try {
      const user = req.user!;
      const exportData = req.body;

      // Validate required fields
      if (!exportData.coffeeType || !exportData.quantity) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Missing required fields: coffeeType and quantity are required', 400);
      }

      // Validate exporter pre-registration status
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

      // Fetch Exporter TIN
      const exporterId = exportData.exporterId || user.organizationId;
      const profileResult = await pool.query(
        'SELECT tin FROM exporter_profiles WHERE exporter_id = $1',
        [exporterId]
      );
      const exporterTin = profileResult.rows[0]?.tin || null;

      // Generate export ID (Standardized Format)
      const exportId = await exportService.generateExportId();

      // Start transaction
      await client.query('BEGIN');

      // Insert export record - matching actual database schema
      const insertResult = await client.query(
        `INSERT INTO exports(
  export_id, exporter_id, exporter_tin, coffee_type, quantity,
  destination_country, buyer_name, estimated_value, status
) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING * `,
        [
          exportId,
          exporterId,
          exporterTin,
          exportData.coffeeType,
          exportData.quantity,
          exportData.destinationCountry || 'Unknown',
          exportData.buyerName || exportData.exporterName || 'Unknown',
          exportData.estimatedValue || 0,
          'PENDING'
        ]
      );

      const createdExport = insertResult.rows[0];

      // Insert initial status history
      await client.query(
        `INSERT INTO export_status_history(
  export_id, old_status, new_status, changed_by, reason
) VALUES($1, $2, $3, $4, $5)`,
        [exportId, 'NONE', 'PENDING', user.id, 'Export created']
      );

      // Commit transaction
      await client.query('COMMIT');

      // Audit log
      await auditService.logStatusChange(
        user.id,
        exportId,
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

      logger.info('Export created successfully', { exportId, userId: user.id });

      res.status(201).json({
        success: true,
        data: createdExport,
        message: 'Export created successfully'
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      this.handleError(error, res);
    } finally {
      client.release();
    }
  };

  /**
   * Get all exports for the user's organization
   */
  public getAllExports = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      const cacheKey = `exports:${user.organizationId}: all`;

      // Try cache first
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        res.json({ success: true, data: cached, cached: true });
        return;
      }

      // Fetch from database
      const result = await pool.query(
        `SELECT * FROM exports 
         WHERE exporter_id = $1 OR created_by = $2
         ORDER BY created_at DESC`,
        [user.organizationId, user.id]
      );

      const exports = result.rows;

      // Cache the result
      await this.cacheService.set(cacheKey, exports, CacheTTL.MEDIUM);

      logger.info('Fetched all exports', { userId: user.id, count: exports.length });

      res.json({ success: true, data: exports });
    } catch (error: any) {
      this.handleError(error, res);
    }
  };

  /**
   * Get a specific export by ID
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

      // Fetch from database
      const result = await pool.query(
        `SELECT * FROM exports WHERE id = $1`,
        [exportId]
      );

      if (result.rows.length === 0) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Export not found', 404);
      }

      const exportData = result.rows[0];

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
      const result = await pool.query(
        `SELECT * FROM exports 
         WHERE status = 'QUALITY_CERTIFIED'
         ORDER BY created_at ASC`
      );

      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  };

  /**
   * Approve FX for an export
   */
  public approveFX = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    const client = await pool.connect();
    try {
      const { exportId } = req.params;
      const user = req.user!;
      const { approvalNotes } = req.body;

      if (!exportId) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Export ID is required', 400);
      }

      // Start transaction
      await client.query('BEGIN');

      // Get current export
      const exportResult = await client.query(
        `SELECT * FROM exports WHERE id = $1`,
        [exportId]
      );

      if (exportResult.rows.length === 0) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Export not found', 404);
      }

      const exportData = exportResult.rows[0];

      // Verify status
      if (exportData.status !== 'QUALITY_CERTIFIED') {
        throw new AppError(
          ErrorCode.INVALID_STATUS_TRANSITION,
          `Export must be quality certified.Current status: ${exportData.status} `,
          400
        );
      }

      // Update export status
      await client.query(
        `UPDATE exports 
         SET status = $1, updated_at = NOW()
         WHERE id = $2`,
        ['FX_APPROVED', exportId]
      );

      // Insert status history
      await client.query(
        `INSERT INTO export_status_history(
  export_id, old_status, new_status, changed_by, changed_at, notes
) VALUES($1, $2, $3, $4, NOW(), $5)`,
        [exportId, 'QUALITY_CERTIFIED', 'FX_APPROVED', user.id, approvalNotes || 'FX approved']
      );

      // Insert approval record
      await client.query(
        `INSERT INTO export_approvals(
  export_id, organization, approval_type, status, approved_by, approved_at, notes
) VALUES($1, $2, $3, $4, $5, NOW(), $6)`,
        [exportId, 'NATIONAL_BANK', 'FX_APPROVAL', 'APPROVED', user.id, approvalNotes]
      );

      // Commit transaction
      await client.query('COMMIT');

      // Audit log
      await auditService.logStatusChange(
        user.id,
        exportId,
        'QUALITY_CERTIFIED',
        'FX_APPROVED',
        AuditAction.BANKING_APPROVED,
        {
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        }
      );

      // Invalidate cache
      await this.cacheService.delete(CacheKeys.export(exportId));
      await this.cacheService.deletePattern('exports:*');

      logger.info('FX approved', { exportId, userId: user.id });

      res.json({
        success: true,
        message: 'FX approved successfully',
        exportId,
        status: 'FX_APPROVED'
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      this.handleError(error, res);
    } finally {
      client.release();
    }
  };

  /**
   * Reject FX for an export
   */
  public rejectFX = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    const client = await pool.connect();
    try {
      const { exportId } = req.params;
      const user = req.user!;
      const { rejectionReason, notes } = req.body;

      if (!exportId) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Export ID is required', 400);
      }

      if (!rejectionReason) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Rejection reason is required', 400);
      }

      // Start transaction
      await client.query('BEGIN');

      // Get current export
      const exportResult = await client.query(
        `SELECT * FROM exports WHERE id = $1`,
        [exportId]
      );

      if (exportResult.rows.length === 0) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Export not found', 404);
      }

      const exportData = exportResult.rows[0];

      // Verify status
      if (exportData.status !== 'QUALITY_CERTIFIED') {
        throw new AppError(
          ErrorCode.INVALID_STATUS_TRANSITION,
          `Export must be quality certified.Current status: ${exportData.status} `,
          400
        );
      }

      // Update export status
      await client.query(
        `UPDATE exports 
         SET status = $1, updated_at = NOW()
         WHERE id = $2`,
        ['FX_REJECTED', exportId]
      );

      // Insert status history
      await client.query(
        `INSERT INTO export_status_history(
  export_id, old_status, new_status, changed_by, changed_at, notes
) VALUES($1, $2, $3, $4, NOW(), $5)`,
        [exportId, 'QUALITY_CERTIFIED', 'FX_REJECTED', user.id, notes || rejectionReason]
      );

      // Insert approval record
      await client.query(
        `INSERT INTO export_approvals(
  export_id, organization, approval_type, status, approved_by, approved_at, notes
) VALUES($1, $2, $3, $4, $5, NOW(), $6)`,
        [exportId, 'NATIONAL_BANK', 'FX_APPROVAL', 'REJECTED', user.id, `${rejectionReason}: ${notes || ''} `]
      );

      // Commit transaction
      await client.query('COMMIT');

      // Audit log
      await auditService.logStatusChange(
        user.id,
        exportId,
        'QUALITY_CERTIFIED',
        'FX_REJECTED',
        AuditAction.BANKING_REJECTED,
        {
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          reason: rejectionReason,
        }
      );

      // Invalidate cache
      await this.cacheService.delete(CacheKeys.export(exportId));
      await this.cacheService.deletePattern('exports:*');

      logger.info('FX rejected', { exportId, userId: user.id, reason: rejectionReason });

      res.json({
        success: true,
        message: 'FX rejected successfully',
        exportId,
        status: 'FX_REJECTED',
        reason: rejectionReason
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      this.handleError(error, res);
    } finally {
      client.release();
    }
  };

  /**
   * Get export status history
   */
  public getStatusHistory = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { exportId } = req.params;

      if (!exportId) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Export ID is required', 400);
      }

      const result = await pool.query(
        `SELECT * FROM export_status_history 
         WHERE export_id = $1
         ORDER BY changed_at DESC`,
        [exportId]
      );

      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  };

  /**
   * Get export approvals
   */
  public getApprovals = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { exportId } = req.params;

      if (!exportId) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Export ID is required', 400);
      }

      const result = await pool.query(
        `SELECT * FROM export_approvals 
         WHERE export_id = $1
         ORDER BY approved_at DESC`,
        [exportId]
      );

      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  };

  /**
   * Get export summary statistics
   */
  public getExportSummary = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;

      const result = await pool.query(
        `SELECT
status,
  COUNT(*) as count,
  SUM(quantity) as total_quantity
         FROM exports
         WHERE exporter_id = $1 OR created_by = $2
         GROUP BY status
         ORDER BY status`,
        [user.organizationId, user.id]
      );

      const summary = {
        total: 0,
        byStatus: {}
      };

      result.rows.forEach(row => {
        summary.byStatus[row.status] = {
          count: parseInt(row.count),
          totalQuantity: parseFloat(row.total_quantity || 0)
        };
        summary.total += parseInt(row.count);
      });

      res.json({
        success: true,
        data: summary
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  };

  /**
   * Centralized error handling
   */
  private handleError(error: any, res: Response): void {
    if (error instanceof AppError) {
      logger.error('AppError', { code: error.code, message: error.message });
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
    logger.error('Unexpected error', { error: error.message, stack: error.stack });

    res.status(500).json({
      success: false,
      error: {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'An unexpected error occurred',
        retryable: false,
      },
    });
  }

  /**
   * Get dashboard statistics for Commercial Bank
   * Aggregates key metrics for the bank's dashboard
   */
  public getBankStats = async (_req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      // Run aggregations in parallel
      const queries = {
        pendingFx: `
          SELECT COUNT(*) as count 
          FROM exports 
          WHERE status = 'QUALITY_CERTIFIED'
  `,
        approvedFx: `
          SELECT COUNT(*) as count,
  COALESCE(MIN(approved_at), NOW()) as first_approval,
  COALESCE(MAX(approved_at), NOW()) as last_approval
          FROM export_approvals 
          WHERE approval_type = 'FX_APPROVAL' AND status = 'APPROVED'
  `,
        rejectedFx: `
          SELECT COUNT(*) as count 
          FROM export_approvals 
          WHERE approval_type = 'FX_APPROVAL' AND status = 'REJECTED'
  `,
        totalProcessed: `
            SELECT COUNT(*) as count
            FROM export_status_history
            WHERE new_status = 'FX_APPROVED' 
               OR new_status = 'FX_REJECTED'
  `
      };

      const [pendingRes, approvedRes, rejectedRes, processedRes] = await Promise.all([
        pool.query(queries.pendingFx),
        pool.query(queries.approvedFx),
        pool.query(queries.rejectedFx),
        pool.query(queries.totalProcessed)
      ]);

      const stats = {
        pendingFxApprovals: parseInt(pendingRes.rows[0].count, 10),
        totalFxApproved: parseInt(approvedRes.rows[0].count, 10),
        totalFxRejected: parseInt(rejectedRes.rows[0].count, 10),
        totalProcessed: parseInt(processedRes.rows[0].count, 10),
        approvalRate: 0,
        activityRange: {
          start: approvedRes.rows[0].first_approval,
          end: approvedRes.rows[0].last_approval
        }
      };

      // Calculate approval rate safely
      const totalDecisions = stats.totalFxApproved + stats.totalFxRejected;
      stats.approvalRate = totalDecisions > 0
        ? Math.round((stats.totalFxApproved / totalDecisions) * 100)
        : 0;

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  };
}
