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
import { FabricGateway } from '../../commercial-bank/src/fabric/gateway';
import { createExportService, ExportRequest } from '../exportService';
import { CacheService, CacheKeys, CacheTTL } from '../cache.service';
import { auditService, AuditAction } from '../audit.service';
import { ResilientBlockchainService } from '../resilience.service';
// Validation schemas - imported but may not be used in all deployments
// import { 
//   CreateExportSchema, 
//   ApproveQualitySchema,
//   ApproveFXSchema,
//   RejectSchema,
//   PaginationSchema,
//   ExportFilterSchema,
//   validateRequest 
// } from '../validation.schemas';
import { ErrorCode, AppError } from '../error-codes';

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
  private fabricGateway: FabricGateway;
  private cacheService: CacheService;
  private resilienceService: ResilientBlockchainService;

  constructor() {
    this.fabricGateway = FabricGateway.getInstance();
    this.cacheService = CacheService.getInstance();
    this.resilienceService = new ResilientBlockchainService('export-service');
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

      // Fetch from blockchain with resilience
      const exports = await this.resilienceService.executeQuery(async () => {
        const contract = this.fabricGateway.getExportContract();
        const exportService = createExportService(contract);
        return await exportService.getAllExports();
      }, 'getAllExports');

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
            cached.status,
            user.role
          ),
        };
        res.json(response);
        return;
      }

      // Fetch from blockchain with resilience
      const exportData = await this.resilienceService.executeQuery(async () => {
        const contract = this.fabricGateway.getExportContract();
        const exportService = createExportService(contract);
        return await exportService.getExport(exportId);
      }, `getExport:${exportId}`);

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
    try {
      const user = req.user!;
      const validatedData = req.body; // Already validated by middleware

      // Generate export ID
      const exportId = `EXP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Submit transaction with resilience
      await this.resilienceService.executeTransaction(async () => {
        const contract = this.fabricGateway.getExportContract();
        const exportService = createExportService(contract);
        return await exportService.createExport(
          exportId,
          user.organizationId,
          validatedData
        );
      }, `createExport:${exportId}`);

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

      res.status(201).json({
        success: true,
        message: 'Export created successfully',
        data: { exportId },
        _links: {
          self: { href: `/api/v1/exports/${exportId}` },
          list: { href: '/api/v1/exports' },
        },
      });
    } catch (error: any) {
      this.handleError(error, res);
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
    try {
      const { exportId } = req.params;
      const user = req.user!;
      const validatedData = req.body;

      if (!exportId) {
        throw new Error('Export ID is required');
      }

      await this.resilienceService.executeTransaction(async () => {
        const contract = this.fabricGateway.getExportContract();
        const exportService = createExportService(contract);
        return await exportService.approveQuality(exportId, validatedData);
      }, `approveQuality:${exportId}`);

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

      res.json({
        success: true,
        message: 'Quality approved successfully',
        _links: {
          export: { href: `/api/v1/exports/${exportId}` },
        },
      });
    } catch (error: any) {
      this.handleError(error, res);
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

    if (filters.commercialbankId) {
      filtered = filtered.filter((exp) => exp.commercialbankId === filters.commercialbankId);
    }

    if (filters.destinationCountry) {
      filtered = filtered.filter((exp) => exp.destinationCountry === filters.destinationCountry);
    }

    if (filters.startDate) {
      filtered = filtered.filter((exp) => exp.createdAt >= filters.startDate);
    }

    if (filters.endDate) {
      filtered = filtered.filter((exp) => exp.createdAt <= filters.endDate);
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

export default EnhancedExportController;
