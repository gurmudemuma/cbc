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

  public getPendingQualityInspections = async (
    _req: RequestWithUser,
    res: Response
  ): Promise<void> => {
    try {
      const contract = this.fabricGateway.getExportContract();
      const exportService = createExportService(contract);
      const exports = await exportService.getExportsByStatus('ECTA_QUALITY_PENDING');
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

  public approveQuality = async (req: RequestWithUser, res: Response): Promise<void> => {
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
        moistureContent: moistureContent || 0,
        defectCount: defectCount || 0,
      });
      res.status(200).json({
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
        moistureContent: moistureContent || 0,
        defectCount: defectCount || 0,
      });
      res.status(201).json({
        success: true,
        message: 'Quality certificate issued successfully',
        data: { exportId },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to issue quality certificate',
        error: error.message,
      });
    }
  };

  public getPendingLicenses = async (_req: RequestWithUser, res: Response): Promise<void> => {
    try {
      const contract = this.fabricGateway.getExportContract();
      const exportService = createExportService(contract);
      const exports = await exportService.getExportsByStatus('ECTA_LICENSE_PENDING');
      res.status(200).json({
        success: true,
        message: 'Pending licenses retrieved',
        data: exports,
        count: exports.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch pending licenses',
        error: error.message,
      });
    }
  };

  public approveLicense = async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
      const { exportId } = req.params;
      if (!exportId) {
        res.status(400).json({
          success: false,
          message: 'Export ID is required',
        });
        return;
      }
      const { licenseNumber, approvedBy, notes } = req.body;
      if (!licenseNumber || !approvedBy) {
        res.status(400).json({
          success: false,
          message: 'License number and approved by are required',
        });
        return;
      }

      const contract = this.fabricGateway.getExportContract();
      const exportService = createExportService(contract);

      // Validate current export status
      const currentExport = await exportService.getExport(exportId);
      if (currentExport.status !== 'ECTA_LICENSE_PENDING') {
        res.status(400).json({
          success: false,
          message: `Cannot approve license. Current status: ${currentExport.status}. Expected: ECTA_LICENSE_PENDING`,
        });
        return;
      }

      // Submit blockchain transaction
      await contract.submitTransaction(
        'ApproveLicense',
        exportId,
        licenseNumber,
        approvedBy,
        notes || ''
      );

      res.status(200).json({
        success: true,
        message: 'License approved successfully',
        data: { exportId, licenseNumber },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to approve license',
        error: error.message,
      });
    }
  };

  public rejectLicense = async (req: RequestWithUser, res: Response): Promise<void> => {
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
      if (!reason || !rejectedBy) {
        res.status(400).json({
          success: false,
          message: 'Reason and rejected by are required',
        });
        return;
      }

      const contract = this.fabricGateway.getExportContract();
      const exportService = createExportService(contract);

      // Validate current export status
      const currentExport = await exportService.getExport(exportId);
      if (currentExport.status !== 'ECTA_LICENSE_PENDING') {
        res.status(400).json({
          success: false,
          message: `Cannot reject license. Current status: ${currentExport.status}. Expected: ECTA_LICENSE_PENDING`,
        });
        return;
      }

      // Submit blockchain transaction
      await contract.submitTransaction('RejectLicense', exportId, reason, rejectedBy);

      res.status(200).json({
        success: true,
        message: 'License rejected',
        data: { exportId, reason },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to reject license',
        error: error.message,
      });
    }
  };

  public getPendingContracts = async (_req: RequestWithUser, res: Response): Promise<void> => {
    try {
      const contract = this.fabricGateway.getExportContract();
      const exportService = createExportService(contract);
      const exports = await exportService.getExportsByStatus('ECTA_CONTRACT_PENDING');
      res.status(200).json({
        success: true,
        message: 'Pending contracts retrieved',
        data: exports,
        count: exports.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch pending contracts',
        error: error.message,
      });
    }
  };

  public approveContract = async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
      const { exportId } = req.params;
      if (!exportId) {
        res.status(400).json({
          success: false,
          message: 'Export ID is required',
        });
        return;
      }
      const { contractNumber, approvedBy, notes } = req.body;
      if (!contractNumber || !approvedBy) {
        res.status(400).json({
          success: false,
          message: 'Contract number and approved by are required',
        });
        return;
      }

      const contract = this.fabricGateway.getExportContract();
      const exportService = createExportService(contract);

      // Validate current export status
      const currentExport = await exportService.getExport(exportId);
      if (currentExport.status !== 'ECTA_CONTRACT_PENDING') {
        res.status(400).json({
          success: false,
          message: `Cannot approve contract. Current status: ${currentExport.status}. Expected: ECTA_CONTRACT_PENDING`,
        });
        return;
      }

      // Submit blockchain transaction
      await contract.submitTransaction(
        'ApproveContract',
        exportId,
        contractNumber,
        approvedBy,
        notes || ''
      );

      res.status(200).json({
        success: true,
        message: 'Contract approved successfully',
        data: { exportId, contractNumber },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to approve contract',
        error: error.message,
      });
    }
  };

  public rejectContract = async (req: RequestWithUser, res: Response): Promise<void> => {
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
      if (!reason || !rejectedBy) {
        res.status(400).json({
          success: false,
          message: 'Reason and rejected by are required',
        });
        return;
      }

      const contract = this.fabricGateway.getExportContract();
      const exportService = createExportService(contract);

      // Validate current export status
      const currentExport = await exportService.getExport(exportId);
      if (currentExport.status !== 'ECTA_CONTRACT_PENDING') {
        res.status(400).json({
          success: false,
          message: `Cannot reject contract. Current status: ${currentExport.status}. Expected: ECTA_CONTRACT_PENDING`,
        });
        return;
      }

      // Submit blockchain transaction
      await contract.submitTransaction('RejectContract', exportId, reason, rejectedBy);

      res.status(200).json({
        success: true,
        message: 'Contract rejected',
        data: { exportId, reason },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to reject contract',
        error: error.message,
      });
    }
  };
}
