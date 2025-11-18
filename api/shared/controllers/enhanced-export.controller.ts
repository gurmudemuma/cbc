import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from 'jsonwebtoken';
// Note: This controller is currently unused and needs to be integrated with a specific service
// The FabricGateway should be injected from the service that uses this controller
import { createExportService } from '../exportService';
import { CacheService, CacheKeys, CacheTTL } from '../cache.service';
import { searchService, SearchCriteria } from '../search.service';
import { monitoringService } from '../monitoring.service';
import { auditService } from '../audit.service';
import { notificationService } from '../notification.service';

// Placeholder interface - actual FabricGateway should be injected from service
interface FabricGateway {
  getExportContract(): any;
  getInstance?(): FabricGateway;
}

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
 * Enhanced Export Controller with caching, monitoring, and pagination
 */
export class EnhancedExportController {
  private fabricGateway: FabricGateway;
  private cacheService: CacheService;

  constructor(fabricGateway: FabricGateway) {
    this.fabricGateway = fabricGateway;
    this.cacheService = CacheService.getInstance();
  }

  /**
   * Create export with monitoring and notifications
   */
  public createExport = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const user = req.user!;
      const exportData = req.body;

      // Validate required fields
      if (!exportData.exporterName || !exportData.coffeeType || !exportData.quantity) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Missing required fields', 400);
      }

      // Generate export ID
      const exportId = `EXP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Submit with resilience
      const result = await this.resilienceService.executeTransaction(async () => {
        const contract = this.fabricGateway.getExportContract();
        const exportService = createExportService(contract);
        const commercialBankId = user.organizationId; // Changed from exporterBankId
        return await exportService.createExport(
          exportId,
          commercialBankId,
          {
            ...exportData,
          }
        );
      }, 'createExport');

      // Audit log
      auditService.logStatusChange(
        user.id,
        result.exportId,
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

      res.status(201).json({ success: true, data: result, message: 'Export created successfully' });
    } catch (error: any) {
      this.handleError(error, res);
    }
  };

  public getAllExports = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    const startTime = Date.now();

    try {
      // Build search criteria from query parameters
      const criteria: SearchCriteria = searchService.buildCriteriaFromParams(req.query);

      // Try to get from cache first
      const cacheKey = `exports:search:${JSON.stringify(criteria)}`;
      const cached = await this.cacheService.get(cacheKey);

      if (cached) {
        monitoringService.recordMetric({
          type: 'api_response_time' as any,
          value: Date.now() - startTime,
          timestamp: new Date(),
          tags: { endpoint: 'getAllExports', cached: 'true' },
        });

        res.json(cached);
        return;
      }

      // Fetch from blockchain
      const contract = this.fabricGateway.getExportContract();
      const exportService = createExportService(contract);
      const allExports = await exportService.getAllExports();

      // Apply search and pagination
      const result = searchService.searchExports(allExports, criteria);

      // Get facets for filtering UI
      const facets = searchService.getFacets(allExports);

      const response = {
        success: true,
        data: result.data,
        pagination: result.pagination,
        facets,
        executionTime: result.executionTime,
      };

      // Cache the result
      await this.cacheService.set(cacheKey, response, CacheTTL.MEDIUM);

      // Track metrics
      monitoringService.recordMetric({
        type: 'api_response_time' as any,
        value: Date.now() - startTime,
        timestamp: new Date(),
        tags: { endpoint: 'getAllExports', cached: 'false' },
      });

      res.json(response);
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      monitoringService.trackBlockchainTransaction(
        'getAllExports',
        duration,
        false
      );

      res.status(500).json({
        success: false,
        message: 'Failed to fetch exports',
        error: error.message,
      });
    }
  };

  public getExport = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    const startTime = Date.now();

    try {
      const { exportId } = req.params;

      if (!exportId) {
        res.status(400).json({
          success: false,
          message: 'Export ID is required',
        });
        return;
      }

      // Try cache first
      const cacheKey = CacheKeys.export(exportId);
      const cached = await this.cacheService.get(cacheKey);

      if (cached) {
        res.json({ success: true, data: cached });
        return;
      }

      // Fetch from blockchain
      const contract = this.fabricGateway.getExportContract();
      const exportService = createExportService(contract);
      const exportData = await exportService.getExport(exportId);

      // Cache the result
      await this.cacheService.set(cacheKey, exportData, CacheTTL.MEDIUM);

      monitoringService.trackBlockchainTransaction(
        'getExport',
        Date.now() - startTime,
        true
      );

      res.json({ success: true, data: exportData });
    } catch (error: any) {
      monitoringService.trackBlockchainTransaction(
        'getExport',
        Date.now() - startTime,
        false
      );

      res.status(500).json({
        success: false,
        message: 'Failed to fetch export',
        error: error.message,
      });
    }
  };

  /**
   * Get exports by commercial bank ID
   */
  public getExportsByCommercialBank = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { commercialBankId } = req.params; // Changed from exporterBankId
      if (!commercialBankId) {
        res.status(400).json({ success: false, message: 'Commercial bank ID is required' });
        return;
      }

      const contract = this.fabricGateway.getExportContract();
      const exportService = createExportService(contract);
      const allExports = await exportService.getAllExports();
      
      // Filter exports by commercial bank ID
      const exports = allExports.filter(exp => exp.commercialBankId === commercialBankId);
      
      res.json({ success: true, data: exports, count: exports.length });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch exports', error: error.message });
    }
  };

  /**
   * Approve banking/financial documents (Commercial Bank)
   */
  public approveBanking = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { exportId } = req.params;
      const user = req.user!;
      if (!exportId) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Export ID is required', 400);
      }

      const { bankingApprovalID, notes, documentCIDs } = req.body;

      // Submit with resilience
      await this.resilienceService.executeTransaction(async () => {
        const contract = this.fabricGateway.getExportContract();
        return await contract.submitTransaction(
          'ApproveBanking',
          exportId,
          bankingApprovalID || user.username,
          notes || '',
          documentCIDs ? JSON.stringify(documentCIDs) : '[]'
        );
      }, `approveBanking:${exportId}`);

      // Audit log
      auditService.logStatusChange(
        user.id,
        exportId,
        'BANK_DOCUMENT_PENDING',
        'BANK_DOCUMENT_VERIFIED',
        AuditAction.BANKING_APPROVED,
        {
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          notes,
        }
      );

      // Invalidate cache
      await this.cacheService.deletePattern(`export:${exportId}`);
      await this.cacheService.deletePattern('exports:*');

      res.json({ success: true, message: 'Banking approved successfully' });
    } catch (error: any) {
      this.handleError(error, res);
    }
  };

  /**
   * Approve FX with SLA tracking
   */
  public approveFX = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const { exportId } = req.params;
      const { fxApprovalID, documentCIDs } = req.body;

      if (!exportId) {
        res.status(400).json({ success: false, message: 'Export ID is required' });
        return;
      }

      const contract = this.fabricGateway.getExportContract();
      const exportService = createExportService(contract);

      // Get export to check SLA
      const exportData = await exportService.getExport(exportId);
      const createdAt = new Date(exportData.createdAt);
      const now = new Date();

      // Check SLA compliance
      monitoringService.checkSLACompliance(
        exportId,
        'fxApproval',
        createdAt,
        now
      );

      // Approve FX
      await exportService.approveFX(exportId, { fxApprovalID, documentCIDs });

      // Invalidate cache
      await this.cacheService.delete(CacheKeys.export(exportId));
      await this.cacheService.deletePattern('exports:*');

      // Track metrics
      monitoringService.trackExportDecision(exportId, 'FX', true);

      // Audit log
      auditService.logFXApproval(
        req.user!.id,
        req.user!.username,
        req.user!.organizationId,
        exportId,
        true,
        undefined,
        {
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        }
      );

      // Send notification
      await notificationService.notifyFXDecision(
        exportId,
        true,
        exportData.commercialBankId, // Changed from exportData.exporterBankId
        undefined,
        undefined
      );

      res.json({ success: true, message: 'FX approved successfully' });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to approve FX',
        error: error.message,
      });
    }
  };

  /**
   * Export search results to CSV
   */
  public exportToCSV = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const criteria: SearchCriteria = searchService.buildCriteriaFromParams(req.query);

      const contract = this.fabricGateway.getExportContract();
      const exportService = createExportService(contract);
      const allExports = await exportService.getAllExports();

      const result = searchService.searchExports(allExports, criteria);
      const csv = searchService.exportToCSV(result.data);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=exports.csv');
      res.send(csv);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to export CSV',
        error: error.message,
      });
    }
  };

  /**
   * Get export statistics
   */
  public getStatistics = async (
    _req: RequestWithUser,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const contract = this.fabricGateway.getExportContract();
      const exportService = createExportService(contract);
      const allExports = await exportService.getAllExports();

      const facets = searchService.getFacets(allExports);

      const statistics = {
        total: allExports.length,
        byStatus: facets.statuses,
        byCountry: facets.countries,
        byQualityGrade: facets.qualityGrades,
        byValueRange: facets.valueRanges,
        totalValue: allExports.reduce((sum, exp) => sum + exp.estimatedValue, 0),
        averageValue: allExports.length > 0
          ? allExports.reduce((sum, exp) => sum + exp.estimatedValue, 0) / allExports.length
          : 0,
      };

      res.json({ success: true, data: statistics });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to get statistics',
        error: error.message,
      });
    }
  };
}
