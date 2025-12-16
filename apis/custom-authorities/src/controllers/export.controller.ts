import { Request, Response } from 'express';
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

  public getAllExports = async (_req: RequestWithUser, res: Response): Promise<void> => {
    try {
      const contract = this.fabricGateway.getExportContract();
      const exportService = createExportService(contract);
      const exports = await exportService.getAllExports();
      res.status(200).json({
        success: true,
        message: 'Exports retrieved successfully',
        data: exports,
        count: exports.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch exports',
        error: error.message,
      });
    }
  };

  public getExport = async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
      const { exportId } = req.params;
      if (!exportId) {
        res.status(400).json({
          success: false,
          message: 'Export ID is required',
        });
        return;
      }
      const contract = this.fabricGateway.getExportContract();
      const exportService = createExportService(contract);
      const exportData = await exportService.getExport(exportId);
      res.status(200).json({
        success: true,
        message: 'Export retrieved successfully',
        data: exportData,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch export',
        error: error.message,
      });
    }
  };

  public getPendingExportCustoms = async (_req: RequestWithUser, res: Response): Promise<void> => {
    try {
      const contract = this.fabricGateway.getExportContract();
      const exportService = createExportService(contract);
      const exports = await exportService.getExportsByStatus('EXPORT_CUSTOMS_PENDING');
      res.status(200).json({
        success: true,
        message: 'Pending export customs retrieved',
        data: exports,
        count: exports.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch pending export customs',
        error: error.message,
      });
    }
  };

  public getPendingImportCustoms = async (_req: RequestWithUser, res: Response): Promise<void> => {
    try {
      const contract = this.fabricGateway.getExportContract();
      const exportService = createExportService(contract);
      const exports = await exportService.getExportsByStatus('IMPORT_CUSTOMS_PENDING');
      res.status(200).json({
        success: true,
        message: 'Pending import customs retrieved',
        data: exports,
        count: exports.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch pending import customs',
        error: error.message,
      });
    }
  };

  public clearExportCustoms = async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
      const { exportId } = req.params;
      if (!exportId) {
        res.status(400).json({
          success: false,
          message: 'Export ID is required',
        });
        return;
      }
      const { declarationNumber, clearedBy, documentCIDs } = req.body;
      const contract = this.fabricGateway.getExportContract();
      const exportService = createExportService(contract);
      await exportService.clearExportCustoms(exportId, {
        declarationNumber,
        clearedBy,
        documentCIDs,
      });
      res.status(200).json({
        success: true,
        message: 'Export customs cleared successfully',
        data: { exportId },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to clear export customs',
        error: error.message,
      });
    }
  };

  public rejectExportCustoms = async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
      const { exportId } = req.params;
      if (!exportId) {
        res.status(400).json({
          success: false,
          message: 'Export ID is required',
        });
        return;
      }
      const { reason, rejectedBy } = req.body;
      const contract = this.fabricGateway.getExportContract();
      const exportService = createExportService(contract);
      await exportService.rejectExportCustoms(exportId, reason, rejectedBy);
      res.status(200).json({
        success: true,
        message: 'Export customs rejected',
        data: { exportId, reason },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to reject export customs',
        error: error.message,
      });
    }
  };

  public clearImportCustoms = async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
      const { exportId } = req.params;
      if (!exportId) {
        res.status(400).json({
          success: false,
          message: 'Export ID is required',
        });
        return;
      }
      const { declarationNumber, clearedBy, documentCIDs } = req.body;
      const contract = this.fabricGateway.getExportContract();
      const exportService = createExportService(contract);
      await exportService.clearImportCustoms(exportId, {
        declarationNumber,
        clearedBy,
        documentCIDs,
      });
      res.status(200).json({
        success: true,
        message: 'Import customs cleared successfully',
        data: { exportId },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to clear import customs',
        error: error.message,
      });
    }
  };
}
