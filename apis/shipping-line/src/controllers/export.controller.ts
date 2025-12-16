import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { FabricGateway } from '../fabric/gateway';
import { createExportService } from '../../../shared/exportService';

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
  private fabricGateway: FabricGateway;

  constructor() {
    this.fabricGateway = FabricGateway.getInstance();
  }

  public getAllExports = async (
    _req: RequestWithUser,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const contract = this.fabricGateway.getExportContract();
      const exportService = createExportService(contract);
      const exports = await exportService.getAllExports();
      res.json({ success: true, data: exports });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, message: 'Failed to fetch exports', error: error.message });
    }
  };

  public getExport = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const { exportId } = req.params;
      if (!exportId) {
        res.status(400).json({ success: false, message: 'Export ID is required' });
        return;
      }
      const contract = this.fabricGateway.getExportContract();
      const exportService = createExportService(contract);
      const exportData = await exportService.getExport(exportId);
      res.json({ success: true, data: exportData });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, message: 'Failed to fetch export', error: error.message });
    }
  };

  public getReadyForShipment = async (
    _req: RequestWithUser,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const contract = this.fabricGateway.getExportContract();
      const exportService = createExportService(contract);
      const exports = await exportService.getExportsByStatus('CUSTOMS_CLEARED'); // FIXED: Updated status constant
      res.json({ success: true, data: exports, count: exports.length });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, message: 'Failed to fetch ready shipments', error: error.message });
    }
  };

  public scheduleShipment = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const { exportId } = req.params;
      if (!exportId) {
        res.status(400).json({ success: false, message: 'Export ID is required' });
        return;
      }
      const { transportIdentifier, departureDate, arrivalDate, transportMode, documentCIDs } =
        req.body;
      const contract = this.fabricGateway.getExportContract();
      const exportService = createExportService(contract);
      await exportService.scheduleShipment(exportId, {
        transportIdentifier,
        departureDate,
        arrivalDate,
        transportMode,
        documentCIDs,
      });
      res.json({ success: true, message: 'Shipment scheduled' });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, message: 'Failed to schedule shipment', error: error.message });
    }
  };

  public markAsShipped = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const { exportId } = req.params;
      if (!exportId) {
        res.status(400).json({ success: false, message: 'Export ID is required' });
        return;
      }
      const contract = this.fabricGateway.getExportContract();
      const exportService = createExportService(contract);
      await exportService.markAsShipped(exportId);
      res.json({ success: true, message: 'Marked as shipped' });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, message: 'Failed to mark as shipped', error: error.message });
    }
  };

  public markAsArrived = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const { exportId } = req.params;
      if (!exportId) {
        res.status(400).json({ success: false, message: 'Export ID is required' });
        return;
      }
      const { actualArrivalDate } = req.body;
      const contract = this.fabricGateway.getExportContract();
      const exportService = createExportService(contract);
      await exportService.markAsArrived(exportId, actualArrivalDate);
      res.json({ success: true, message: 'Marked as arrived' });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, message: 'Failed to mark as arrived', error: error.message });
    }
  };

  public confirmDelivery = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const { exportId } = req.params;
      if (!exportId) {
        res.status(400).json({ success: false, message: 'Export ID is required' });
        return;
      }
      const { confirmedBy } = req.body;
      const contract = this.fabricGateway.getExportContract();
      const exportService = createExportService(contract);
      await exportService.confirmDelivery(exportId, confirmedBy);
      res.json({ success: true, message: 'Delivery confirmed' });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, message: 'Failed to confirm delivery', error: error.message });
    }
  };
}
