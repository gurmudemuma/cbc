import { Request, Response, NextFunction } from "express";
import { pool } from "../../../shared/database/pool";
import { createLogger } from "../../../shared/logger";
import { ErrorCode, AppError } from "../../../shared/error-codes";

const logger = createLogger('FXController');

interface RequestWithUser extends Request {
  user?: any;
}

export class FXController {
  /**
   * Get all exports
   */
  public getAllExports = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const result = await pool.query('SELECT * FROM exports ORDER BY created_at DESC');
      res.json({ success: true, data: result.rows });
    } catch (error: any) {
      logger.error('Failed to fetch exports', { error: error.message });
      res.status(500).json({ success: false, message: 'Failed to fetch exports' });
    }
  };

  /**
   * Get single export
   */
  public getExport = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { exportId } = req.params;
      const result = await pool.query('SELECT * FROM exports WHERE id = $1', [exportId]);
      
      if (result.rows.length === 0) {
        res.status(404).json({ success: false, message: 'Export not found' });
        return;
      }
      
      res.json({ success: true, data: result.rows[0] });
    } catch (error: any) {
      logger.error('Failed to fetch export', { error: error.message });
      res.status(500).json({ success: false, message: 'Failed to fetch export' });
    }
  };

  /**
   * Get pending FX approvals
   */
  public getPendingFXApprovals = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const result = await pool.query(
        'SELECT * FROM exports WHERE status = $1 ORDER BY created_at DESC',
        ['QUALITY_CERTIFIED']
      );
      res.json({ success: true, data: result.rows, count: result.rows.length });
    } catch (error: any) {
      logger.error('Failed to fetch pending FX approvals', { error: error.message });
      res.status(500).json({ success: false, message: 'Failed to fetch pending FX approvals' });
    }
  };

  /**
   * Get exports by status
   */
  public getExportsByStatus = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { status } = req.params;
      const result = await pool.query(
        'SELECT * FROM exports WHERE status = $1 ORDER BY created_at DESC',
        [status]
      );
      res.json({ success: true, data: result.rows, count: result.rows.length });
    } catch (error: any) {
      logger.error('Failed to fetch exports by status', { error: error.message });
      res.status(500).json({ success: false, message: 'Failed to fetch exports by status' });
    }
  };

  public approveFX = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    const client = await pool.connect();
    try {
      const { exportId } = req.params;
      const user = req.user;
      const { approvalNotes } = req.body;

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

      if (exportData.status !== 'QUALITY_CERTIFIED') {
        throw new AppError(
          ErrorCode.INVALID_STATUS_TRANSITION,
          `Export must be quality certified. Current status: ${exportData.status}`,
          400
        );
      }

      await client.query(
        'UPDATE exports SET status = $1, updated_at = NOW() WHERE id = $2',
        ['FX_APPROVED', exportId]
      );

      await client.query(
        `INSERT INTO export_status_history (export_id, old_status, new_status, changed_by, changed_at, notes)
         VALUES ($1, $2, $3, $4, NOW(), $5)`,
        [exportId, 'QUALITY_CERTIFIED', 'FX_APPROVED', user.id, approvalNotes || 'FX approved']
      );

      await client.query(
        `INSERT INTO export_approvals (export_id, organization, approval_type, status, approved_by, approved_at, notes)
         VALUES ($1, $2, $3, $4, $5, NOW(), $6)`,
        [exportId, 'NATIONAL_BANK', 'FX_APPROVAL', 'APPROVED', user.id, approvalNotes]
      );

      await client.query('COMMIT');

      logger.info('FX approved', { exportId, userId: user.id });

      res.json({
        success: true,
        message: 'FX approved successfully',
        exportId,
        status: 'FX_APPROVED'
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      logger.error('FX approval failed', { error: error.message });
      this.handleError(error, res);
    } finally {
      client.release();
    }
  };

  public rejectFX = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    const client = await pool.connect();
    try {
      const { exportId } = req.params;
      const user = req.user;
      const { rejectionReason, notes } = req.body;

      if (!exportId) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Export ID is required', 400);
      }

      if (!rejectionReason) {
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

      const exportData = exportResult.rows[0];

      if (exportData.status !== 'QUALITY_CERTIFIED') {
        throw new AppError(
          ErrorCode.INVALID_STATUS_TRANSITION,
          `Export must be quality certified. Current status: ${exportData.status}`,
          400
        );
      }

      await client.query(
        'UPDATE exports SET status = $1, updated_at = NOW() WHERE id = $2',
        ['FX_REJECTED', exportId]
      );

      await client.query(
        `INSERT INTO export_status_history (export_id, old_status, new_status, changed_by, changed_at, notes)
         VALUES ($1, $2, $3, $4, NOW(), $5)`,
        [exportId, 'QUALITY_CERTIFIED', 'FX_REJECTED', user.id, notes || rejectionReason]
      );

      await client.query(
        `INSERT INTO export_approvals (export_id, organization, approval_type, status, approved_by, approved_at, notes)
         VALUES ($1, $2, $3, $4, $5, NOW(), $6)`,
        [exportId, 'NATIONAL_BANK', 'FX_APPROVAL', 'REJECTED', user.id, `${rejectionReason}: ${notes || ''}`]
      );

      await client.query('COMMIT');

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
      logger.error('FX rejection failed', { error: error.message });
      this.handleError(error, res);
    } finally {
      client.release();
    }
  };

  private handleError(error: any, res: Response): void {
    if (error instanceof AppError) {
      res.status(error.httpStatus).json({
        success: false,
        error: { code: error.code, message: error.message },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: { code: ErrorCode.INTERNAL_SERVER_ERROR, message: 'An unexpected error occurred' },
    });
  }
}
