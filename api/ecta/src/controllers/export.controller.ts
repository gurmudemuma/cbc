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

  public getExport = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
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

  public getPendingQualityInspections = async (_req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const contract = this.fabricGateway.getExportContract();
      const exportService = createExportService(contract);
      const exports = await exportService.getExportsByStatus('QUALITY_PENDING');
      res.json({ success: true, data: exports, count: exports.length });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch pending inspections', error: error.message });
    }
  };

  public approveQuality = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
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
      res.json({ success: true, message: 'Quality certificate issued successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to issue quality certificate', error: error.message });
    }
  };

  public getPendingLicenses = async (_req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const contract = this.fabricGateway.getExportContract();
      const exportService = createExportService(contract);
      const exports = await exportService.getExportsByStatus('ECTA_LICENSE_PENDING');
      res.json({ success: true, data: exports, count: exports.length });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch pending licenses', error: error.message });
    }
  };

  public approveLicense = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { exportId } = req.params;
      if (!exportId) {
        res.status(400).json({ success: false, message: 'Export ID is required' });
        return;
      }
      const { } = req.body;
      // For now, use a placeholder method since license approval isn't in the shared service
      res.json({ success: true, message: 'License approved successfully (placeholder)' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to approve license', error: error.message });
    }
  };

  public rejectLicense = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { exportId } = req.params;
      if (!exportId) {
        res.status(400).json({ success: false, message: 'Export ID is required' });
        return;
      }
      const { } = req.body;
      // For now, use a placeholder method since license rejection isn't in the shared service
      res.json({ success: true, message: 'License rejected (placeholder)' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to reject license', error: error.message });
    }
  };

  public getPendingContracts = async (_req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const contract = this.fabricGateway.getExportContract();
      const exportService = createExportService(contract);
      const exports = await exportService.getExportsByStatus('ECTA_CONTRACT_PENDING');
      res.json({ success: true, data: exports, count: exports.length });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch pending contracts', error: error.message });
    }
  };

  public approveContract = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { exportId } = req.params;
      if (!exportId) {
        res.status(400).json({ success: false, message: 'Export ID is required' });
        return;
      }
      const { } = req.body;
      // For now, use a placeholder method since contract approval isn't in the shared service
      res.json({ success: true, message: 'Contract approved successfully (placeholder)' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to approve contract', error: error.message });
    }
  };

  public rejectContract = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { exportId } = req.params;
      if (!exportId) {
        res.status(400).json({ success: false, message: 'Export ID is required' });
        return;
      }
      const { } = req.body;
      // For now, use a placeholder method since contract rejection isn't in the shared service
      res.json({ success: true, message: 'Contract rejected (placeholder)' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to reject contract', error: error.message });
    }
  };
}
