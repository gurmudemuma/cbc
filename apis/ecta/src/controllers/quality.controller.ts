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

export class QualityController {
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

  public getExportById = async (req: RequestWithUser, res: Response): Promise<void> => {
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

  public getPendingExports = async (_req: RequestWithUser, res: Response): Promise<void> => {
    try {
      const contract = this.fabricGateway.getExportContract();
      const exportService = createExportService(contract);
      const exports = await exportService.getExportsByStatus('QUALITY_PENDING');
      res.status(200).json({
        success: true,
        message: 'Pending quality inspections retrieved',
        data: exports,
        count: exports.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch pending inspections',
        error: error.message,
      });
    }
  };

  public issueQualityCertificate = async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
      const { exportId } = req.params;
      if (!exportId) {
        res.status(400).json({
          success: false,
          message: 'Export ID is required',
        });
        return;
      }
      const {
        qualityGrade,
        certifiedBy,
        documentCIDs,
        originCertificateNumber,
        moistureContent,
        defectCount,
      } = req.body;
      const contract = this.fabricGateway.getExportContract();
      const exportService = createExportService(contract);
      await exportService.approveQuality(exportId, {
        qualityGrade,
        certifiedBy,
        documentCIDs,
        originCertificateNumber,
        moistureContent: Number(moistureContent),
        defectCount: Number(defectCount),
      });
      res.status(201).json({
        success: true,
        message: 'Quality approved and certificate issued',
        data: { exportId },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to approve quality',
        error: error.message,
      });
    }
  };

  public rejectQuality = async (req: RequestWithUser, res: Response): Promise<void> => {
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
      await exportService.rejectQuality(exportId, reason, rejectedBy);
      res.status(200).json({
        success: true,
        message: 'Quality rejected',
        data: { exportId, reason },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to reject quality',
        error: error.message,
      });
    }
  };

  public requestReinspection = async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
      const { exportId } = req.params;
      if (!exportId) {
        res.status(400).json({
          success: false,
          message: 'Export ID is required',
        });
        return;
      }
      const { notes } = req.body;
      const contract = this.fabricGateway.getExportContract();
      const exportService = createExportService(contract);
      await exportService.requestReinspection(exportId, notes || 'Reinspection requested');
      res.status(200).json({
        success: true,
        message: 'Reinspection requested successfully',
        data: { exportId },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to request reinspection',
        error: error.message,
      });
    }
  };

  public issueOriginCertificate = async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
      const { exportId } = req.params;
      if (!exportId) {
        res.status(400).json({
          success: false,
          message: 'Export ID is required',
        });
        return;
      }
      const { certificateNumber, certificateCID, issuedBy } = req.body;
      const contract = this.fabricGateway.getExportContract();
      const exportService = createExportService(contract);
      await exportService.issueOriginCertificate(
        exportId,
        certificateNumber,
        certificateCID,
        issuedBy
      );
      res.status(201).json({
        success: true,
        message: 'Certificate of origin issued successfully',
        data: { exportId, certificateNumber },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to issue origin certificate',
        error: error.message,
      });
    }
  };
}
