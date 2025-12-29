import { Request, Response, NextFunction } from "express";
import { JwtPayload } from "jsonwebtoken";
<<<<<<< HEAD
import { pool } from "@shared/database/pool";
import { createLogger } from "@shared/logger";
import { ErrorCode, AppError } from "@shared/error-codes";
=======
import { pool } from "../../../shared/database/pool";
import { createLogger } from "../../../shared/logger";
import { ErrorCode, AppError } from "../../../shared/error-codes";
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665

const logger = createLogger('CommercialBankQualityController');

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
  public getPendingExports = async (
    _req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await pool.query(
        'SELECT * FROM exports WHERE status = $1 ORDER BY created_at DESC',
        ['FX_APPROVED']
      );

      res.status(200).json({
        success: true,
        data: result.rows,
        count: result.rows.length,
      });
    } catch (error: any) {
      logger.error('Failed to get pending exports', { error: error.message });
      this.handleError(error, res);
    }
  };

  public getAllExports = async (
    _req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await pool.query('SELECT * FROM exports ORDER BY created_at DESC');

      res.status(200).json({
        success: true,
        data: result.rows,
        count: result.rows.length,
      });
    } catch (error: any) {
      logger.error('Failed to get all exports', { error: error.message });
      this.handleError(error, res);
    }
  };

  public getExportById = async (
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
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

      res.status(200).json({
        success: true,
        data: result.rows[0],
      });
    } catch (error: any) {
      logger.error('Failed to get export by ID', { error: error.message });
      this.handleError(error, res);
    }
  };

  public issueQualityCertificate = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    const client = await pool.connect();
    try {
      const { exportId, qualityGrade } = req.body;
      const certifiedBy = req.user?.username || 'NCAT Inspector';

      if (!exportId || !qualityGrade) {
        throw new AppError(
          ErrorCode.MISSING_REQUIRED_FIELD,
          'Export ID and quality grade are required',
          400
        );
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
        'UPDATE exports SET quality_grade = $1, updated_at = NOW() WHERE id = $2',
        [qualityGrade, exportId]
      );

      await client.query('COMMIT');

      logger.info('Quality certificate issued', { exportId, qualityGrade, certifiedBy });

      res.status(200).json({
        success: true,
        message: 'Quality certificate issued successfully',
        data: {
          exportId,
          qualityGrade,
          certifiedBy,
          status: 'QUALITY_CERTIFIED',
        },
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      logger.error('Failed to issue quality certificate', { error: error.message });
      this.handleError(error, res);
    } finally {
      client.release();
    }
  };

  public rejectQuality = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    const client = await pool.connect();
    try {
      const { exportId, rejectionReason } = req.body;
      const rejectedBy = req.user?.username || 'NCAT Inspector';

      if (!exportId || !rejectionReason) {
        throw new AppError(
          ErrorCode.MISSING_REQUIRED_FIELD,
          'Export ID and rejection reason are required',
          400
        );
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
        ['QUALITY_REJECTED', exportId]
      );

      await client.query('COMMIT');

      logger.info('Quality rejected', { exportId, rejectionReason, rejectedBy });

      res.status(200).json({
        success: true,
        message: 'Quality rejected successfully',
        data: {
          exportId,
          rejectionReason,
          rejectedBy,
          status: 'QUALITY_REJECTED',
        },
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
