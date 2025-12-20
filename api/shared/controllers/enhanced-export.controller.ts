/**
 * Enhanced Export Controller
 * Provides comprehensive export management with PostgreSQL backend
 */

import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { Pool } from 'pg';

import { CacheService, CacheKeys, CacheTTL } from '../cache.service';
import { ErrorCode, AppError } from '../error-codes';
import { createLogger } from '../logger';

const logger = createLogger('EnhancedExportController');

interface AuthJWTPayload extends JwtPayload {
  id: string;
  username: string;
  organizationId: string;
  role: string;
}

interface RequestWithUser extends Request {
  user?: AuthJWTPayload;
}

/**
 * Enhanced Export Controller
 */
export class EnhancedExportController {

  private cacheService: CacheService;
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;

    this.cacheService = CacheService.getInstance();
  }

  /**
   * Get all exports
   */
  public getAllExports = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const user = req.user!;
      const cacheKey = `exports:${user.organizationId}:all`;

      // Try cache first
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        res.json({ success: true, data: cached, cached: true });
        return;
      }

      // Fetch from database
      const result = await this.pool.query('SELECT * FROM exports ORDER BY created_at DESC');

      // Cache the result
      await this.cacheService.set(cacheKey, result.rows, CacheTTL.MEDIUM);

      res.json({ success: true, data: result.rows });
    } catch (error: any) {
      logger.error('Failed to get all exports', { error: error.message });
      this.handleError(error, res);
    }
  };

  /**
   * Get single export
   */
  public getExport = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
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
      const result = await this.pool.query('SELECT * FROM exports WHERE id = $1', [exportId]);

      if (result.rows.length === 0) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Export not found', 404);
      }

      const exportData = result.rows[0];

      // Cache the result
      await this.cacheService.set(cacheKey, exportData, CacheTTL.SHORT);

      res.json({ success: true, data: exportData });
    } catch (error: any) {
      logger.error('Failed to get export', { error: error.message });
      this.handleError(error, res);
    }
  };

  /**
   * Create export
   */
  public createExport = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    const client = await this.pool.connect();
    try {
      const user = req.user!;
      const exportData = req.body;

      // Generate export ID
      const exportId = `EXP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO exports (id, exporter_name, coffee_type, quantity, destination_country, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING *`,
        [exportId, exportData.exporter_name, exportData.coffee_type, exportData.quantity, exportData.destination_country, 'PENDING']
      );

      await client.query('COMMIT');

      // Invalidate cache
      await this.cacheService.deletePattern('exports:*');

      logger.info('Export created', { exportId, userId: user.id });

      res.status(201).json({
        success: true,
        message: 'Export created successfully',
        data: result.rows[0],
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      logger.error('Failed to create export', { error: error.message });
      this.handleError(error, res);
    } finally {
      client.release();
    }
  };

  /**
   * Update export status
   */
  public updateExportStatus = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    const client = await this.pool.connect();
    try {
      const { exportId } = req.params;
      const user = req.user!;
      const { new_status, reason } = req.body;

      if (!exportId || !new_status) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Export ID and new status are required', 400);
      }

      await client.query('BEGIN');

      const result = await client.query(
        'UPDATE exports SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [new_status, exportId]
      );

      if (result.rows.length === 0) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Export not found', 404);
      }

      // Record status change
      await client.query(
        `INSERT INTO export_status_history (export_id, old_status, new_status, changed_by, changed_at, notes)
         VALUES ($1, $2, $3, $4, NOW(), $5)`,
        [exportId, result.rows[0].status, new_status, user.id, reason || '']
      );

      await client.query('COMMIT');

      // Invalidate cache
      await this.cacheService.delete(CacheKeys.export(exportId));
      await this.cacheService.deletePattern('exports:*');

      logger.info('Export status updated', { exportId, new_status, userId: user.id });

      res.json({
        success: true,
        message: 'Export status updated successfully',
        data: result.rows[0],
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      logger.error('Failed to update export status', { error: error.message });
      this.handleError(error, res);
    } finally {
      client.release();
    }
  };

  /**
   * Get export history
   */
  public getExportHistory = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const { exportId } = req.params;

      if (!exportId) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Export ID is required', 400);
      }

      const result = await this.pool.query(
        'SELECT * FROM export_status_history WHERE export_id = $1 ORDER BY changed_at ASC',
        [exportId]
      );

      res.json({ success: true, data: result.rows });
    } catch (error: any) {
      logger.error('Failed to get export history', { error: error.message });
      this.handleError(error, res);
    }
  };

  /**
   * Get exports by status
   */
  public getExportsByStatus = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const { status } = req.params;

      if (!status) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Status is required', 400);
      }

      const result = await this.pool.query(
        'SELECT * FROM exports WHERE status = $1 ORDER BY created_at DESC',
        [status]
      );

      res.json({ success: true, data: result.rows, count: result.rows.length });
    } catch (error: any) {
      logger.error('Failed to get exports by status', { error: error.message });
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
        error: { code: error.code, message: error.message },
      });
      return;
    }

    logger.error('Unexpected error', { error: error.message });

    res.status(500).json({
      success: false,
      error: { code: ErrorCode.INTERNAL_SERVER_ERROR, message: 'An unexpected error occurred' },
    });
  }
}

export default EnhancedExportController;
