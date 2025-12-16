import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { FabricGateway } from '../fabric/gateway';
import { v4 as uuidv4 } from 'uuid';
import { createExportService } from '../../../shared/exportService';
import { CacheService, CacheKeys, CacheTTL } from '../../../shared/cache.service';
import { getAuditService } from '../../../shared/auditService';
import { ResilientBlockchainService } from '../../../shared/resilience.service';
import { ErrorCode, AppError } from '../../../shared/error-codes';

const auditService = getAuditService();

interface AuthJWTPayload extends JwtPayload {
  id: string;
  username: string;
  organizationId: string;
  role: string;
}

interface RequestWithUser extends Request {
  user?: AuthJWTPayload;
}

export class ShipmentController {
  private fabricGateway: FabricGateway;
  private cacheService: CacheService;
  private resilienceService: ResilientBlockchainService;

  constructor() {
    this.fabricGateway = FabricGateway.getInstance();
    this.cacheService = CacheService.getInstance();
    this.resilienceService = new ResilientBlockchainService('shipping-line');
  }

  public getReadyExports = async (
    _req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      // Try cache first
      const cacheKey = 'exports:shipment:ready';
      const cached = await this.cacheService.get<any[]>(cacheKey);
      if (cached) {
        res.json({ success: true, data: cached, count: cached.length, cached: true });
        return;
      }

      // Fetch with resilience
      const exports = await this.resilienceService.executeQuery(async () => {
        const contract = this.fabricGateway.getExportContract();
        const exportService = createExportService(contract);
        return await exportService.getExportsByStatus('CUSTOMS_CLEARED'); // UPDATED: New status name
      }, 'getReadyShipments');

      // Cache for short time
      await this.cacheService.set(cacheKey, exports, CacheTTL.SHORT);

      res.json({ success: true, data: exports, count: exports.length });
    } catch (error: any) {
      this.handleError(error, res);
    }
  };

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

      // Fetch with resilience
      const exports = await this.resilienceService.executeQuery(async () => {
        const contract = this.fabricGateway.getExportContract();
        const exportService = createExportService(contract);
        return await exportService.getAllExports();
      }, 'getAllExports');

      // Cache the result
      await this.cacheService.set(cacheKey, exports, CacheTTL.MEDIUM);

      res.json({ success: true, data: exports });
    } catch (error: any) {
      this.handleError(error, res);
    }
  };

  public getExportById = async (
    req: Request,
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

      // Fetch with resilience
      const exportData = await this.resilienceService.executeQuery(async () => {
        const contract = this.fabricGateway.getExportContract();
        const exportService = createExportService(contract);
        return await exportService.getExport(exportId);
      }, `getExport:${exportId}`);

      // Cache the result
      await this.cacheService.set(cacheKey, exportData, CacheTTL.SHORT);

      res.json({ success: true, data: exportData });
    } catch (error: any) {
      this.handleError(error, res);
    }
  };

  public scheduleShipment = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const {
        exportId,
        transportIdentifier,
        departureDate,
        arrivalDate,
        transportMode,
        documentCIDs,
      } = req.body;
      const user = req.user!;
      const shipmentId = `SHIP-${uuidv4()}`;

      // Submit with resilience
      await this.resilienceService.executeTransaction(async () => {
        const contract = this.fabricGateway.getExportContract();
        const exportService = createExportService(contract);
        return await exportService.scheduleShipment(exportId, {
          transportIdentifier,
          departureDate,
          arrivalDate,
          transportMode,
          documentCIDs,
        });
      }, `scheduleShipment:${exportId}`);

      // Audit log
      await auditService.logAction(
        exportId,
        user.id,
        user.organizationId,
        'SCHEDULE_SHIPMENT',
        'SUBMISSION',
        'CUSTOMS_CLEARED',
        'SHIPMENT_SCHEDULED',
        {
          transportIdentifier,
          departureDate,
          arrivalDate,
          transportMode,
        },
        req.ip,
        req.get('user-agent')
      );

      // Invalidate cache
      await this.cacheService.delete(CacheKeys.export(exportId));
      await this.cacheService.deletePattern('exports:*');

      res.json({
        success: true,
        message: 'Shipment scheduled successfully',
        data: { exportId, shipmentId, transportIdentifier },
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  };

  public confirmShipment = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const { exportId } = req.body;
      const user = req.user!;

      // Submit with resilience
      await this.resilienceService.executeTransaction(async () => {
        const contract = this.fabricGateway.getExportContract();
        const exportService = createExportService(contract);
        return await exportService.markAsShipped(exportId);
      }, `confirmShipment:${exportId}`);

      // Audit log
      await auditService.logAction(
        exportId,
        user.id,
        user.organizationId,
        'MARK_SHIPPED',
        'SUBMISSION',
        'SHIPMENT_SCHEDULED',
        'SHIPPED',
        {},
        req.ip,
        req.get('user-agent')
      );

      // Invalidate cache
      await this.cacheService.delete(CacheKeys.export(exportId));
      await this.cacheService.deletePattern('exports:*');

      res.json({
        success: true,
        message: 'Shipment confirmed',
        data: { exportId, status: 'SHIPPED' },
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  };

  /**
   * Reject shipment
   */
  public rejectShipment = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const { exportId, reason, rejectedBy } = req.body;
      const user = req.user!;

      if (!exportId || !reason) {
        throw new AppError(
          ErrorCode.MISSING_REQUIRED_FIELD,
          'Export ID and rejection reason are required',
          400
        );
      }

      if (reason.trim().length < 10) {
        throw new AppError(
          ErrorCode.INVALID_INPUT,
          'Rejection reason must be at least 10 characters',
          400
        );
      }

      // Submit with resilience
      await this.resilienceService.executeTransaction(async () => {
        const contract = this.fabricGateway.getExportContract();
        await contract.submitTransaction(
          'RejectShipment',
          exportId,
          reason,
          rejectedBy || user.username
        );
      }, `rejectShipment:${exportId}`);

      // Audit log
      await auditService.logAction(
        exportId,
        user.id,
        user.organizationId,
        'UPDATE_EXPORT',
        'REJECTION',
        'CUSTOMS_CLEARED',
        'SHIPMENT_REJECTED',
        { reason, rejectedBy: rejectedBy || user.username },
        req.ip,
        req.get('user-agent')
      );

      // Invalidate cache
      await this.cacheService.delete(CacheKeys.export(exportId));
      await this.cacheService.deletePattern('exports:*');

      res.json({
        success: true,
        message: 'Shipment rejected',
        data: { exportId, reason, status: 'SHIPMENT_REJECTED' },
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  };

  /**
   * Notify arrival at destination
   */
  public notifyArrival = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const { exportId, actualArrivalDate } = req.body;
      const user = req.user!;

      if (!exportId || !actualArrivalDate) {
        throw new AppError(
          ErrorCode.MISSING_REQUIRED_FIELD,
          'Export ID and actual arrival date are required',
          400
        );
      }

      // Submit with resilience
      await this.resilienceService.executeTransaction(async () => {
        const contract = this.fabricGateway.getExportContract();
        const exportService = createExportService(contract);
        return await exportService.notifyArrival(exportId, actualArrivalDate);
      }, `notifyArrival:${exportId}`);

      // Audit log
      await auditService.logAction(
        exportId,
        user.id,
        user.organizationId,
        'NOTIFY_ARRIVAL',
        'SUBMISSION',
        'SHIPPED',
        'ARRIVED',
        { actualArrivalDate },
        req.ip,
        req.get('user-agent')
      );

      // Invalidate cache
      await this.cacheService.delete(CacheKeys.export(exportId));
      await this.cacheService.deletePattern('exports:*');

      res.json({
        success: true,
        message: 'Arrival notification recorded',
        data: { exportId, actualArrivalDate, status: 'ARRIVED' },
      });
    } catch (error: any) {
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
