import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from 'jsonwebtoken';
<<<<<<< HEAD
import { pool } from '@shared/database/pool';
import { createLogger } from '@shared/logger';
import { ErrorCode, AppError } from '@shared/error-codes';
=======
import { pool } from '../../../shared/database/pool';
import { createLogger } from '../../../shared/logger';
import { ErrorCode, AppError } from '../../../shared/error-codes';
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665

const logger = createLogger('QualityController');

interface AuthJWTPayload extends JwtPayload {
  id: string;
  username: string;
  organizationId: string;
  role: string;
}

interface RequestWithUser extends Request {
  user?: AuthJWTPayload;
}

export class QualityController {
  public getAllExports = async (_req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const result = await pool.query('SELECT * FROM exports ORDER BY created_at DESC');
      res.json({ success: true, data: result.rows });
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

  public getPendingExports = async (_req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const result = await pool.query(
        'SELECT * FROM exports WHERE status = $1 ORDER BY created_at DESC',
        ['QUALITY_PENDING']
      );
      res.json({ success: true, data: result.rows, count: result.rows.length });
    } catch (error: any) {
      logger.error('Failed to fetch pending inspections', { error: error.message });
      this.handleError(error, res);
    }
  };

  public issueQualityCertificate = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    const client = await pool.connect();
    try {
      const { exportId } = req.params;
      const user = req.user;
<<<<<<< HEAD

=======
      
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
      if (!exportId) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Export ID is required', 400);
      }

      const { qualityGrade, documentCIDs, originCertificateNumber } = req.body;

      if (!qualityGrade) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Quality grade is required', 400);
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

      if (exportData.status !== 'QUALITY_PENDING') {
        throw new AppError(
          ErrorCode.INVALID_STATUS_TRANSITION,
          `Export must be pending quality certification. Current status: ${exportData.status}`,
          400
        );
      }

      await client.query(
        'UPDATE exports SET status = $1, quality_grade = $2, updated_at = NOW() WHERE id = $3',
        ['QUALITY_CERTIFIED', qualityGrade, exportId]
      );

      await client.query(
        `INSERT INTO export_status_history (export_id, old_status, new_status, changed_by, changed_at, notes)
         VALUES ($1, $2, $3, $4, NOW(), $5)`,
        [exportId, 'QUALITY_PENDING', 'QUALITY_CERTIFIED', user?.id, `Quality certified with grade: ${qualityGrade}`]
      );

      if (originCertificateNumber) {
        await client.query(
          `INSERT INTO quality_certificates (export_id, certificate_number, quality_grade, issued_by, issued_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [exportId, originCertificateNumber, qualityGrade, user?.id]
        );
      }

      await client.query('COMMIT');

      logger.info('Quality certificate issued', { exportId, qualityGrade, userId: user?.id });

      res.json({
        success: true,
        message: 'Quality approved and certificate issued',
        exportId,
        qualityGrade
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      logger.error('Failed to approve quality', { error: error.message });
      this.handleError(error, res);
    } finally {
      client.release();
    }
  };

  public rejectQuality = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    const client = await pool.connect();
    try {
      const { exportId } = req.params;
      const user = req.user;
<<<<<<< HEAD

=======
      
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
      if (!exportId) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Export ID is required', 400);
      }

      const { reason } = req.body;

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

      const exportData = exportResult.rows[0];

      if (exportData.status !== 'QUALITY_PENDING') {
        throw new AppError(
          ErrorCode.INVALID_STATUS_TRANSITION,
          `Export must be pending quality certification. Current status: ${exportData.status}`,
          400
        );
      }

      await client.query(
        'UPDATE exports SET status = $1, updated_at = NOW() WHERE id = $2',
        ['QUALITY_REJECTED', exportId]
      );

      await client.query(
        `INSERT INTO export_status_history (export_id, old_status, new_status, changed_by, changed_at, notes)
         VALUES ($1, $2, $3, $4, NOW(), $5)`,
        [exportId, 'QUALITY_PENDING', 'QUALITY_REJECTED', user?.id, reason]
      );

      await client.query('COMMIT');

      logger.info('Quality rejected', { exportId, reason, userId: user?.id });

      res.json({
        success: true,
        message: 'Quality rejected',
        exportId,
        reason
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      logger.error('Failed to reject quality', { error: error.message });
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
