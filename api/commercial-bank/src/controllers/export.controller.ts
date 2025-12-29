import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { pool } from '@shared/database/pool';
import { createLogger } from '@shared/logger';
import { ErrorCode, AppError } from '@shared/error-codes';

const logger = createLogger('ExportController');

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
  public createExport = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    const client = await pool.connect();
    try {
      const user = req.user!;
      const exportData = req.body;

      // Validate required fields
      if (!exportData.exporterName || !exportData.coffeeType || !exportData.quantity) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Missing required fields', 400);
      }

      // Generate export ID
      const exportId = `EXP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO exports (id, exporter_name, coffee_type, quantity, organization_id, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING *`,
        [exportId, exportData.exporterName, exportData.coffeeType, exportData.quantity, user.organizationId, 'PENDING']
      );

      await client.query(
        `INSERT INTO export_status_history (export_id, old_status, new_status, changed_by, changed_at, notes)
         VALUES ($1, $2, $3, $4, NOW(), $5)`,
        [exportId, 'NONE', 'PENDING', user.id, 'Export created']
      );

      await client.query('COMMIT');

      logger.info('Export created', { exportId, userId: user.id });

      res.status(201).json({ success: true, data: result.rows[0], message: 'Export created successfully' });
    } catch (error: any) {
      await client.query('ROLLBACK');
      logger.error('Export creation failed', { error: error.message });
      this.handleError(error, res);
    } finally {
      client.release();
    }
  };

  public getAllExports = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;

      const result = await pool.query(
        'SELECT * FROM exports WHERE organization_id = $1 ORDER BY created_at DESC',
        [user.organizationId]
      );

      res.json({ success: true, data: result.rows });
    } catch (error: any) {
      logger.error('Failed to fetch exports', { error: error.message });
      this.handleError(error, res);
    }
  };

  public getExport = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { exportId } = req.params;
      if (!exportId) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Export ID is required', 400);
      }

      const result = await pool.query(
        'SELECT * FROM exports WHERE id = $1',
        [exportId]
      );

      if (result.rows.length === 0) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Export not found', 404);
      }

      res.json({ success: true, data: result.rows[0] });
    } catch (error: any) {
      logger.error('Failed to fetch export', { error: error.message });
      this.handleError(error, res);
    }
  };

  /**
   * Get exports pending document verification (Commercial Bank's responsibility)
   */
  public getPendingDocuments = async (_req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const result = await pool.query(
        'SELECT * FROM exports WHERE status = $1 ORDER BY created_at DESC',
        ['ECTA_CONTRACT_APPROVED']
      );

      res.json({ success: true, data: result.rows, count: result.rows.length });
    } catch (error: any) {
      logger.error('Failed to fetch pending documents', { error: error.message });
      this.handleError(error, res);
    }
  };

  /**
   * Verify and approve export documents (Commercial Bank's task)
   */
  public approveDocuments = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    const client = await pool.connect();
    try {
      const { exportId } = req.params;
      const user = req.user!;
      if (!exportId) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Export ID is required', 400);
      }

      const { notes } = req.body;

      await client.query('BEGIN');

      const exportResult = await client.query(
        'SELECT * FROM exports WHERE id = $1',
        [exportId]
      );

      if (exportResult.rows.length === 0) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Export not found', 404);
      }

      await client.query(
        'UPDATE exports SET status = $1, updated_at = NOW() WHERE id = $2',
        ['BANK_DOCUMENT_VERIFIED', exportId]
      );

      await client.query(
        `INSERT INTO export_status_history (export_id, old_status, new_status, changed_by, changed_at, notes)
         VALUES ($1, $2, $3, $4, NOW(), $5)`,
        [exportId, 'ECTA_CONTRACT_APPROVED', 'BANK_DOCUMENT_VERIFIED', user.id, notes || 'Documents verified']
      );

      await client.query('COMMIT');

      logger.info('Documents verified', { exportId, userId: user.id });

      res.json({ success: true, message: 'Documents verified successfully' });
    } catch (error: any) {
      await client.query('ROLLBACK');
      logger.error('Document verification failed', { error: error.message });
      this.handleError(error, res);
    } finally {
      client.release();
    }
  };

  /**
   * Reject export documents (Commercial Bank's task)
   */
  public rejectDocuments = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    const client = await pool.connect();
    try {
      const { exportId } = req.params;
      const user = req.user!;
      if (!exportId) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Export ID is required', 400);
      }

      const { reason, notes } = req.body;

      if (!reason) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Rejection reason is required', 400);
      }

      await client.query('BEGIN');

      const exportResult = await client.query(
        'SELECT * FROM exports WHERE id = $1',
        [exportId]
      );

      if (exportResult.rows.length === 0) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Export not found', 404);
      }

      await client.query(
        'UPDATE exports SET status = $1, updated_at = NOW() WHERE id = $2',
        ['BANK_DOCUMENT_REJECTED', exportId]
      );

      await client.query(
        `INSERT INTO export_status_history (export_id, old_status, new_status, changed_by, changed_at, notes)
         VALUES ($1, $2, $3, $4, NOW(), $5)`,
        [exportId, 'ECTA_CONTRACT_APPROVED', 'BANK_DOCUMENT_REJECTED', user.id, `${reason}: ${notes || ''}`]
      );

      await client.query('COMMIT');

      logger.info('Documents rejected', { exportId, userId: user.id, reason });

      res.json({
        success: true,
        message: 'Documents rejected successfully',
        reason,
        status: 'BANK_DOCUMENT_REJECTED'
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      logger.error('Document rejection failed', { error: error.message });
      this.handleError(error, res);
    } finally {
      client.release();
    }
  };

  /**
   * Submit FX request to NBE (Commercial Bank's task - after document verification)
   */
  public submitFXApplication = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    const client = await pool.connect();
    try {
      const user = req.user!;
      const { exportId } = req.params;

      if (!exportId) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Export ID is required', 400);
      }

      await client.query('BEGIN');

      const exportResult = await client.query(
        'SELECT * FROM exports WHERE id = $1',
        [exportId]
      );

      if (exportResult.rows.length === 0) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Export not found', 404);
      }

      const exportData = exportResult.rows[0];

      // Verify export has document verification completed
      if (exportData.status !== 'BANK_DOCUMENT_VERIFIED') {
        throw new AppError(
          ErrorCode.INVALID_STATUS_TRANSITION,
          `Export must have documents verified. Current status: ${exportData.status}`,
          400
        );
      }

      await client.query(
        'UPDATE exports SET status = $1, updated_at = NOW() WHERE id = $2',
        ['FX_APPLICATION_PENDING', exportId]
      );

      await client.query(
        `INSERT INTO export_status_history (export_id, old_status, new_status, changed_by, changed_at, notes)
         VALUES ($1, $2, $3, $4, NOW(), $5)`,
        [exportId, 'BANK_DOCUMENT_VERIFIED', 'FX_APPLICATION_PENDING', user.id, 'FX application submitted to NBE']
      );

      await client.query('COMMIT');

      logger.info('FX application submitted', { exportId, userId: user.id });

      res.json({
        success: true,
        message: 'FX application submitted to NBE',
        exportId,
        status: 'FX_APPLICATION_PENDING',
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      logger.error('FX application submission failed', { error: error.message });
      this.handleError(error, res);
    } finally {
      client.release();
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

      const result = await pool.query(
        'SELECT * FROM exports WHERE id = $1',
        [exportId]
      );

      if (result.rows.length === 0) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Export not found', 404);
      }

      const exportData = result.rows[0];

      // Extract FX-related information
      const fxStatus = {
        exportId,
        currentStatus: exportData.status,
        fxApplicationSubmitted: ['FX_APPLICATION_PENDING', 'FX_APPROVED', 'FX_REJECTED'].includes(exportData.status),
        fxApproved: exportData.status === 'FX_APPROVED',
        fxRejected: exportData.status === 'FX_REJECTED',
      };

      res.json({ success: true, data: fxStatus });
    } catch (error: any) {
      logger.error('Failed to get FX status', { error: error.message });
      this.handleError(error, res);
    }
  };

  /**
   * Check all required documents status
   */
  public verifyAllDocuments = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { exportId } = req.params;

      if (!exportId) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Export ID is required', 400);
      }

      const result = await pool.query(
        'SELECT * FROM exports WHERE id = $1',
        [exportId]
      );

      if (result.rows.length === 0) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Export not found', 404);
      }

      const exportData = result.rows[0];
      const verification = this.checkDocuments(exportData);

      res.json({
        success: true,
        exportId,
        valid: verification.valid,
        missing: verification.missing,
        present: verification.present,
      });
    } catch (error: any) {
      logger.error('Failed to verify documents', { error: error.message });
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
    if (!exportData.export_license_validated_by) {
      missing.push('ECTA License Validation');
    } else {
      present.push('ECTA License Validation');
    }

    if (!exportData.quality_grade) {
      missing.push('ECTA Quality Certificate');
    } else {
      present.push('ECTA Quality Certificate');
    }

    if (!exportData.origin_certificate_number) {
      missing.push('Certificate of Origin');
    } else {
      present.push('Certificate of Origin');
    }

    if (!exportData.contract_approved_by) {
      missing.push('ECTA Contract Approval');
    } else {
      present.push('ECTA Contract Approval');
    }

    // Check commercial documents (if required)
    if (!exportData.commercial_invoice) {
      missing.push('Commercial Invoice');
    } else {
      present.push('Commercial Invoice');
    }

    if (!exportData.sales_contract) {
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
        },
      });
      return;
    }

    logger.error('Unexpected error', { error: error.message });

    res.status(500).json({
      success: false,
      error: {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'An unexpected error occurred',
      },
    });
  }


  /**
   * Get dashboard statistics for Commercial Bank
   * Aggregates key metrics for the bank's dashboard
   */
  public getBankStats = async (_req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      // Run aggregations for Commercial Bank Dashboard
      // 1. Pending Documents (Status: 'ECTA_CONTRACT_APPROVED')
      const pendingDocsQuery = `
            SELECT COUNT(*) as count 
            FROM exports 
            WHERE status = 'ECTA_CONTRACT_APPROVED'
        `;

      // 2. Pending FX Submission (Status: 'BANK_DOCUMENT_VERIFIED')
      const pendingFxQuery = `
            SELECT COUNT(*) as count 
            FROM exports 
            WHERE status = 'BANK_DOCUMENT_VERIFIED'
        `;

      // 3. Processed (Documents Verified or Rejected)
      const processedQuery = `
            SELECT COUNT(*) as count
            FROM export_status_history
            WHERE new_status IN ('BANK_DOCUMENT_VERIFIED', 'BANK_DOCUMENT_REJECTED', 'FX_APPLICATION_PENDING')
        `;

      const [pendingDocsRes, pendingFxRes, processedRes] = await Promise.all([
        pool.query(pendingDocsQuery),
        pool.query(pendingFxQuery),
        pool.query(processedQuery)
      ]);

      const stats = {
        pendingDocuments: parseInt(pendingDocsRes.rows[0].count, 10),
        pendingFxSubmission: parseInt(pendingFxRes.rows[0].count, 10),
        totalProcessed: parseInt(processedRes.rows[0].count, 10),
      };

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      logger.error('Failed to fetch bank dashboard stats', { error: error.message });
      this.handleError(error, res);
    }
  };
}
