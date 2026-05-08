import { Request, Response, NextFunction } from "express";
import { JwtPayload } from "jsonwebtoken";
import { getPool } from "@shared/database/pool";
import { createLogger } from "@shared/logger";
import { ErrorCode, AppError } from "@shared/error-codes";

const logger = createLogger('CustomAuthoritiesExportController');

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
  public getAllExports = async (
    _req: RequestWithUser,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    try {
      const pool = getPool();
      if (!pool) {
        throw new AppError(ErrorCode.INTERNAL_SERVER_ERROR, 'Database connection failed', 500);
      }
      const result = await pool.query('SELECT * FROM exports ORDER BY created_at DESC');
      res.json({ success: true, data: result.rows });
    } catch (error: any) {
      logger.error('Failed to fetch exports', { error: error.message });
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

      const pool = getPool();
      if (!pool) {
        throw new AppError(ErrorCode.INTERNAL_SERVER_ERROR, 'Database connection failed', 500);
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

  public getPendingExportCustoms = async (
    _req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    try {
      const pool = getPool();
      if (!pool) {
        throw new AppError(ErrorCode.INTERNAL_SERVER_ERROR, 'Database connection failed', 500);
      }
      const result = await pool.query(
        'SELECT * FROM exports WHERE status = $1 ORDER BY created_at DESC',
        ['CUSTOMS_PENDING']
      );
      res.json({ success: true, data: result.rows, count: result.rows.length });
    } catch (error: any) {
      logger.error('Failed to fetch pending export customs', { error: error.message });
      this.handleError(error, res);
    }
  };

  public getPendingImportCustoms = async (
    _req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    try {
      const pool = getPool();
      if (!pool) {
        throw new AppError(ErrorCode.INTERNAL_SERVER_ERROR, 'Database connection failed', 500);
      }
      const result = await pool.query(
        'SELECT * FROM exports WHERE status = $1 ORDER BY created_at DESC',
        ['IMPORT_CUSTOMS_PENDING']
      );
      res.json({ success: true, data: result.rows, count: result.rows.length });
    } catch (error: any) {
      logger.error('Failed to fetch pending import customs', { error: error.message });
      this.handleError(error, res);
    }
  };

  public clearExportCustoms = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    const client = await getPool().connect();
    try {
      const { exportId } = req.params;
      const user = req.user;
      const { declarationNumber, notes } = req.body;

      if (!exportId || !declarationNumber) {
        throw new AppError(
          ErrorCode.MISSING_REQUIRED_FIELD,
          'Export ID and declaration number are required',
          400
        );
      }

      await client.query('BEGIN');

      const exportResult = await client.query('SELECT * FROM exports WHERE export_id = $1', [exportId]);
      if (exportResult.rows.length === 0) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Export not found', 404);
      }

      await client.query(
        'UPDATE exports SET status = $1, customs_declaration_number = $2, updated_at = NOW() WHERE export_id = $3',
        ['CUSTOMS_CLEARED', declarationNumber, exportId]
      );

      await client.query(
        `INSERT INTO export_status_history (export_id, old_status, new_status, changed_by, changed_at, notes)
         VALUES ($1, $2, $3, $4, NOW(), $5)`,
        [exportId, 'CUSTOMS_PENDING', 'CUSTOMS_CLEARED', user?.id, notes || `Customs cleared with declaration: ${declarationNumber}`]
      );

      await client.query('COMMIT');

      logger.info('Export customs cleared', { exportId, declarationNumber, userId: user?.id });

      res.json({
        success: true,
        message: 'Export customs cleared',
        exportId,
        declarationNumber
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      logger.error('Failed to clear export customs', { error: error.message });
      this.handleError(error, res);
    } finally {
      client.release();
    }
  };

  public rejectExportCustoms = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    const client = await getPool().connect();
    try {
      const { exportId } = req.params;
      const user = req.user;
      const { reason } = req.body;

      if (!exportId || !reason) {
        throw new AppError(
          ErrorCode.MISSING_REQUIRED_FIELD,
          'Export ID and reason are required',
          400
        );
      }

      await client.query('BEGIN');

      const exportResult = await client.query('SELECT * FROM exports WHERE export_id = $1', [exportId]);
      if (exportResult.rows.length === 0) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Export not found', 404);
      }

      await client.query(
        'UPDATE exports SET status = $1, updated_at = NOW() WHERE export_id = $2',
        ['CUSTOMS_REJECTED', exportId]
      );

      await client.query(
        `INSERT INTO export_status_history (export_id, old_status, new_status, changed_by, changed_at, notes)
         VALUES ($1, $2, $3, $4, NOW(), $5)`,
        [exportId, 'CUSTOMS_PENDING', 'CUSTOMS_REJECTED', user?.id, reason]
      );

      await client.query('COMMIT');

      logger.info('Export customs rejected', { exportId, reason, userId: user?.id });

      res.json({
        success: true,
        message: 'Export customs rejected',
        exportId,
        reason
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      logger.error('Failed to reject export customs', { error: error.message });
      this.handleError(error, res);
    } finally {
      client.release();
    }
  };

  public clearImportCustoms = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    const client = await getPool().connect();
    try {
      const { exportId } = req.params;
      const user = req.user;
      const { declarationNumber, notes } = req.body;

      if (!exportId || !declarationNumber) {
        throw new AppError(
          ErrorCode.MISSING_REQUIRED_FIELD,
          'Export ID and declaration number are required',
          400
        );
      }

      await client.query('BEGIN');

      const exportResult = await client.query('SELECT * FROM exports WHERE id = $1', [exportId]);
      if (exportResult.rows.length === 0) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Export not found', 404);
      }

      await client.query(
        'UPDATE exports SET status = $1, import_customs_declaration_number = $2, updated_at = NOW() WHERE export_id = $3',
        ['IMPORT_CUSTOMS_CLEARED', declarationNumber, exportId]
      );

      await client.query(
        `INSERT INTO export_status_history (export_id, old_status, new_status, changed_by, changed_at, notes)
         VALUES ($1, $2, $3, $4, NOW(), $5)`,
        [exportId, 'IMPORT_CUSTOMS_PENDING', 'IMPORT_CUSTOMS_CLEARED', user?.id, notes || `Import customs cleared with declaration: ${declarationNumber}`]
      );

      await client.query('COMMIT');

      logger.info('Import customs cleared', { exportId, declarationNumber, userId: user?.id });

      res.json({
        success: true,
        message: 'Import customs cleared',
        exportId,
        declarationNumber
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      logger.error('Failed to clear import customs', { error: error.message });
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
