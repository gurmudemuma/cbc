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

export class QualityController {
  private fabricGateway: FabricGateway;

  constructor() {
    this.fabricGateway = FabricGateway.getInstance();
  }

  public getAllExports = async (_req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const contract = this.fabricGateway.getExportContract();
      const exportService = createExportService(contract);
      const exports = await exportService.getAllExports();
      res.json({ success: true, data: exports });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch exports', error: error.message });
    }
  };

  public getExportById = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
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
      res.status(500).json({ success: false, message: 'Failed to fetch export', error: error.message });
    }
  };

  public getPendingExports = async (_req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const contract = this.fabricGateway.getExportContract();
      const exportService = createExportService(contract);
      const exports = await exportService.getExportsByStatus('QUALITY_PENDING');
      res.json({ success: true, data: exports, count: exports.length });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch pending inspections', error: error.message });
    }
  };

  public issueQualityCertificate = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { exportId } = req.params;
      if (!exportId) {
        res.status(400).json({ success: false, message: 'Export ID is required' });
        return;
      }
      const { qualityGrade, certifiedBy, documentCIDs, originCertificateNumber } = req.body;
      const contract = this.fabricGateway.getExportContract();
      const exportService = createExportService(contract);
      await exportService.approveQuality(exportId, { qualityGrade, certifiedBy, documentCIDs, originCertificateNumber });
      res.json({ success: true, message: 'Quality approved and certificate issued' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to approve quality', error: error.message });
    }
  };

  public rejectQuality = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { exportId } = req.params;
      if (!exportId) {
        res.status(400).json({ success: false, message: 'Export ID is required' });
        return;
      }
      const { reason, rejectedBy } = req.body;
      const contract = this.fabricGateway.getExportContract();
      const exportService = createExportService(contract);
      await exportService.rejectQuality(exportId, reason, rejectedBy);
      res.json({ success: true, message: 'Quality rejected' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to reject quality', error: error.message });
    }
  };
}
