import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { pool } from '../../../shared/database/pool';
import { createLogger } from '../../../shared/logger';
import { ErrorCode, AppError } from '../../../shared/error-codes';

const logger = createLogger('LotVerificationController');

interface AuthJWTPayload extends JwtPayload {
  id: string;
  username: string;
  organizationId: string;
  role: string;
}

interface RequestWithUser extends Request {
  user?: AuthJWTPayload;
}

export class LotVerificationController {
  public getAllExports = async (_req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const result = await pool.query('SELECT * FROM exports ORDER BY created_at DESC');
      res.json({ success: true, data: result.rows, count: result.rows.length });
    } catch (error: any) {
      logger.error('Failed to fetch exports', { error: error.message });
      this.handleError(error, res);
    }
  };

  public getExportById = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { exportId } = req.params;
      if (!exportId) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Export ID is required', 400);
      }

      const result = await pool.query('SELECT * FROM exports WHERE id = $1', [exportId]);
      if (result.rows.length === 0) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Export not found', 404);
      }

      res.json({ success: true, data: result.rows[0] });
    } catch (error: any) {
      logger.error('Failed to fetch export', { error: error.message });
      this.handleError(error, res);
    }
  };

  public getPendingVerifications = async (_req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const result = await pool.query(
        'SELECT * FROM exports WHERE status = $1 ORDER BY created_at DESC',
        ['ECX_PENDING']
      );
      res.json({ success: true, data: result.rows, count: result.rows.length });
    } catch (error: any) {
      logger.error('Failed to fetch pending verifications', { error: error.message });
      this.handleError(error, res);
    }
  };

  public verifyLot = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    const client = await pool.connect();
    try {
      const { exportId } = req.params;
      const user = req.user;
      const { notes } = req.body;

      if (!exportId) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Export ID is required', 400);
      }

      await client.query('BEGIN');

      const exportResult = await client.query('SELECT * FROM exports WHERE id = $1', [exportId]);
      if (exportResult.rows.length === 0) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Export not found', 404);
      }

      await client.query(
        `INSERT INTO export_status_history (export_id, old_status, new_status, changed_by, changed_at, notes)
         VALUES ($1, $2, $3, $4, NOW(), $5)`,
        [exportId, 'ECX_PENDING', 'LOT_VERIFIED', user?.id, notes || 'Lot verified']
      );

      await client.query('COMMIT');

      logger.info('Lot verified', { exportId, userId: user?.id });

      res.json({
        success: true,
        message: 'Lot verification recorded',
        exportId
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      logger.error('Failed to verify lot', { error: error.message });
      this.handleError(error, res);
    } finally {
      client.release();
    }
  };

  public approveLot = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    const client = await pool.connect();
    try {
      const { exportId } = req.params;
      const user = req.user;
      const { notes } = req.body;

      if (!exportId) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Export ID is required', 400);
      }

      await client.query('BEGIN');

      const exportResult = await client.query('SELECT * FROM exports WHERE id = $1', [exportId]);
      if (exportResult.rows.length === 0) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Export not found', 404);
      }

      await client.query(
        'UPDATE exports SET status = $1, updated_at = NOW() WHERE id = $2',
        ['ECX_VERIFIED', exportId]
      );

      await client.query(
        `INSERT INTO export_status_history (export_id, old_status, new_status, changed_by, changed_at, notes)
         VALUES ($1, $2, $3, $4, NOW(), $5)`,
        [exportId, 'LOT_VERIFIED', 'ECX_VERIFIED', user?.id, notes || 'Lot approved']
      );

      await client.query('COMMIT');

      logger.info('Lot approved', { exportId, userId: user?.id });

      res.json({
        success: true,
        message: 'Lot approved',
        exportId,
        status: 'ECX_VERIFIED'
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      logger.error('Failed to approve lot', { error: error.message });
      this.handleError(error, res);
    } finally {
      client.release();
    }
  };

  public rejectLot = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    const client = await pool.connect();
    try {
      const { exportId } = req.params;
      const user = req.user;
      const { reason } = req.body;

      if (!exportId) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Export ID is required', 400);
      }

      if (!reason) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Rejection reason is required', 400);
      }

      await client.query('BEGIN');

      const exportResult = await client.query('SELECT * FROM exports WHERE id = $1', [exportId]);
      if (exportResult.rows.length === 0) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Export not found', 404);
      }

      await client.query(
        'UPDATE exports SET status = $1, updated_at = NOW() WHERE id = $2',
        ['ECX_REJECTED', exportId]
      );

      await client.query(
        `INSERT INTO export_status_history (export_id, old_status, new_status, changed_by, changed_at, notes)
         VALUES ($1, $2, $3, $4, NOW(), $5)`,
        [exportId, 'ECX_PENDING', 'ECX_REJECTED', user?.id, reason]
      );

      await client.query('COMMIT');

      logger.info('Lot rejected', { exportId, reason, userId: user?.id });

      res.json({
        success: true,
        message: 'Lot rejected',
        exportId,
        reason
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      logger.error('Failed to reject lot', { error: error.message });
      this.handleError(error, res);
    } finally {
      client.release();
    }
  };

  public getVerifiedLots = async (_req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const result = await pool.query(
        'SELECT * FROM exports WHERE status = $1 ORDER BY created_at DESC',
        ['ECX_VERIFIED']
      );
      res.json({ success: true, data: result.rows, count: result.rows.length });
    } catch (error: any) {
      logger.error('Failed to fetch verified lots', { error: error.message });
      this.handleError(error, res);
    }
  };

  public getRejectedLots = async (_req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const result = await pool.query(
        'SELECT * FROM exports WHERE status = $1 ORDER BY created_at DESC',
        ['ECX_REJECTED']
      );
      res.json({ success: true, data: result.rows, count: result.rows.length });
    } catch (error: any) {
      logger.error('Failed to fetch rejected lots', { error: error.message });
      this.handleError(error, res);
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
