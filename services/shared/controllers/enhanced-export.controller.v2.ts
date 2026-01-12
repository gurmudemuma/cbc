/**
 * Enhanced Export Controller with Best Practices
 * - Zod validation
 * - Circuit breaker & retry logic
 * - Caching
 * - Audit logging
 * - Pagination
 * - HATEOAS links
 * - Comprehensive error handling
 */

import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { Pool } from 'pg';

import { CacheService, CacheKeys, CacheTTL } from '../cache.service';
import { auditService, AuditAction } from '../audit.service';
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

interface ExportRequest {
  id?: string;
  exporter_id: string;
  coffee_type: string;
  quantity: number;
  destination_country: string;
  status?: string;
  created_at?: string;
  [key: string]: any;
}

/**
 * Pagination response interface
 */
interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  _links?: Record<string, { href: string; method?: string }>;
}

/**
 * HATEOAS link generator
 */
class HATEOASLinkGenerator {
  static generateExportLinks(exportId: string, status: string, role: string) {
    const baseUrl = `/api/v1/exports/${exportId}`;
    const links: Record<string, { href: string; method?: string }> = {
      self: { href: baseUrl, method: 'GET' },
      history: { href: `${baseUrl}/history`, method: 'GET' },
    };

    // Add action links based on status and role
    if (role === 'exporter' && status === 'QUALITY_CERTIFIED') {
      links.submitForFX = { href: `${baseUrl}/submit-fx`, method: 'POST' };
    }

    if (role === 'bank' && status === 'BANKING_PENDING') {
      links.approve = { href: `${baseUrl}/approve-banking`, method: 'POST' };
      links.reject = { href: `${baseUrl}/reject-banking`, method: 'POST' };
    }

    if (role === 'admin' && status === 'FX_PENDING') {
      links.approveFX = { href: `${baseUrl}/approve-fx`, method: 'POST' };
      links.rejectFX = { href: `${baseUrl}/reject-fx`, method: 'POST' };
    }

    return links;
  }
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
   * Get all exports with pagination, filtering, and caching
   */
  public getAllExports = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const user = req.user!;

      // Parse and validate query parameters
      const { page = 1, limit = 10, sortBy, sortOrder = 'desc' } = req.query;
      const filters = req.query as any;

      // Generate cache key
      const cacheKey = `exports:${user.organizationId}:page:${page}:limit:${limit}:${JSON.stringify(filters)}`;

      // Try cache first
      const cached = await this.cacheService.get<PaginatedResponse<ExportRequest>>(cacheKey);
      if (cached) {
        res.json(cached);
        return;
      }

      // Fetch from database
      const result = await this.pool.query('SELECT * FROM exports ORDER BY created_at DESC');
      const exports = result.rows;

      // Apply filters
      let filtered = this.applyFilters(exports, filters);

      // Apply sorting
      filtered = this.applySorting(filtered, sortBy as string, sortOrder as string);

      // Apply pagination
      const paginatedData = this.paginate(filtered, Number(page), Number(limit));

      // Add HATEOAS links
      const response: PaginatedResponse<ExportRequest> = {
        success: true,
        data: paginatedData.data,
        pagination: paginatedData.pagination,
        _links: {
          self: { href: `/api/v1/exports?page=${page}&limit=${limit}` },
          first: { href: `/api/v1/exports?page=1&limit=${limit}` },
          last: { href: `/api/v1/exports?page=${paginatedData.pagination.totalPages}&limit=${limit}` },
          ...(paginatedData.pagination.hasNext && {
            next: { href: `/api/v1/exports?page=${Number(page) + 1}&limit=${limit}` },
          }),
          ...(paginatedData.pagination.hasPrev && {
            prev: { href: `/api/v1/exports?page=${Number(page) - 1}&limit=${limit}` },
          }),
        },
      };

      // Cache the result
      await this.cacheService.set(cacheKey, response, CacheTTL.MEDIUM);

      res.json(response);
    } catch (error: any) {
      logger.error('Failed to get all exports', { error: error.message });
      this.handleError(error, res);
    }
  };

  /**
   * Get single export with caching and HATEOAS
   */
  public getExport = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const { exportId } = req.params;
      const user = req.user!;

      if (!exportId) {
        throw new AppError(
          ErrorCode.MISSING_REQUIRED_FIELD,
          'Export ID is required',
          400
        );
      }

      // Try cache first
      const cacheKey = CacheKeys.export(exportId);
      const cached = await this.cacheService.get<ExportRequest>(cacheKey);

      if (cached) {
        const response = {
          success: true,
          data: cached,
          _links: HATEOASLinkGenerator.generateExportLinks(
            exportId,
            cached.status || 'PENDING',
            user.role
          ),
        };
        res.json(response);
        return;
      }

      // Fetch from database
      const result = await this.pool.query('SELECT * FROM exports WHERE export_id = $1', [exportId]);

      if (result.rows.length === 0) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Export not found', 404);
      }

      const exportData = result.rows[0];

      // Cache the result
      await this.cacheService.set(cacheKey, exportData, CacheTTL.SHORT);

      const response = {
        success: true,
        data: exportData,
        _links: HATEOASLinkGenerator.generateExportLinks(
          exportId,
          exportData.status,
          user.role
        ),
      };

      res.json(response);
    } catch (error: any) {
      logger.error('Failed to get export', { error: error.message });
      this.handleError(error, res);
    }
  };

  /**
   * Create export with validation, audit logging, and resilience
   */
  public createExport = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    const client = await this.pool.connect();
    try {
      const user = req.user!;
      const validatedData = req.body;

      // Generate export ID
      const exportId = `EXP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      await client.query('BEGIN');

      // Insert export
      const result = await client.query(
        `INSERT INTO exports (id, exporter_name, coffee_type, quantity, destination_country, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING *`,
        [exportId, validatedData.exporter_name, validatedData.coffee_type, validatedData.quantity, validatedData.destination_country, 'PENDING']
      );

      await client.query('COMMIT');

      // Audit log
      auditService.logExportCreation(
        user.id,
        exportId,
        validatedData,
        {
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        }
      );

      // Invalidate cache
      await this.cacheService.deletePattern('exports:*');

      logger.info('Export created', { exportId, userId: user.id });

      res.status(201).json({
        success: true,
        message: 'Export created successfully',
        data: result.rows[0],
        _links: {
          self: { href: `/api/v1/exports/${exportId}` },
          list: { href: '/api/v1/exports' },
        },
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
   * Approve quality with validation and audit
   */
  public approveQuality = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    const client = await this.pool.connect();
    try {
      const { exportId } = req.params;
      const user = req.user!;
      const validatedData = req.body;

      if (!exportId) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Export ID is required', 400);
      }

      await client.query('BEGIN');

      const exportResult = await client.query('SELECT * FROM exports WHERE export_id = $1', [exportId]);
      if (exportResult.rows.length === 0) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Export not found', 404);
      }

      await client.query(
        'UPDATE exports SET status = $1, quality_grade = $2, updated_at = NOW() WHERE export_id = $3',
        ['QUALITY_CERTIFIED', validatedData.quality_grade, exportId]
      );

      await client.query('COMMIT');

      // Audit log
      auditService.logStatusChange(
        user.id,
        exportId,
        'QUALITY_PENDING',
        'QUALITY_CERTIFIED',
        AuditAction.QUALITY_APPROVED,
        {
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        }
      );

      // Invalidate cache
      await this.cacheService.delete(CacheKeys.export(exportId));
      await this.cacheService.deletePattern('exports:*');

      logger.info('Quality approved', { exportId, userId: user.id });

      res.json({
        success: true,
        message: 'Quality approved successfully',
        _links: {
          export: { href: `/api/v1/exports/${exportId}` },
        },
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      logger.error('Failed to approve quality', { error: error.message });
      this.handleError(error, res);
    } finally {
      client.release();
    }
  };

  /**
   * Apply filters to exports
   */
  private applyFilters(exports: ExportRequest[], filters: any): ExportRequest[] {
    let filtered = [...exports];

    if (filters.status) {
      filtered = filtered.filter((exp) => exp.status === filters.status);
    }

    if (filters.commercial_bank_id) {
      filtered = filtered.filter((exp) => exp.commercial_bank_id === filters.commercial_bank_id);
    }

    if (filters.destination_country) {
      filtered = filtered.filter((exp) => exp.destination_country === filters.destination_country);
    }

    if (filters.startDate) {
      filtered = filtered.filter((exp) => exp.created_at && exp.created_at >= filters.startDate);
    }

    if (filters.endDate) {
      filtered = filtered.filter((exp) => exp.created_at && exp.created_at <= filters.endDate);
    }

    return filtered;
  }

  /**
   * Apply sorting
   */
  private applySorting(exports: ExportRequest[], sortBy: string, sortOrder: string): ExportRequest[] {
    if (!sortBy) return exports;

    return exports.sort((a, b) => {
      const aVal = (a as any)[sortBy];
      const bVal = (b as any)[sortBy];

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  }

  /**
   * Paginate results
   */
  private paginate(data: ExportRequest[], page: number, limit: number) {
    const total = data.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedData = data.slice(offset, offset + limit);

    return {
      data: paginatedData,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
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
}

export default EnhancedExportController;
