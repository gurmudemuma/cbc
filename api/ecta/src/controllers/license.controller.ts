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

/**
 * License Controller for ECTA
 * 
 * ECTA (Ethiopian Coffee & Tea Authority) is responsible for:
 * - Reviewing export license applications
 * - Verifying exporter credentials
 * - Issuing export licenses
 * - Approving or rejecting license applications
 * 
 * This is the FIRST of three ECTA approval steps:
 * 1. License Approval (this controller)
 * 2. Quality Certification (quality.controller.ts)
 * 3. Contract Approval (contract.controller.ts)
 */
export class LicenseController {
  private fabricGateway: FabricGateway;

  constructor() {
    this.fabricGateway = FabricGateway.getInstance();
  }

  /**
   * Get all exports (ECTA can view all)
   */
  public getAllExports = async (_req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const contract = this.fabricGateway.getExportContract();
      const exportService = createExportService(contract);
      const exports = await exportService.getAllExports();
      res.json({ success: true, data: exports, count: exports.length });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch exports', 
        error: error.message 
      });
    }
  };

  /**
   * Get exports pending license approval
   * Status: ECX_VERIFIED (after ECX lot verification)
   */
  public getPendingLicenses = async (_req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const contract = this.fabricGateway.getExportContract();
      const exportService = createExportService(contract);
      const exports = await exportService.getExportsByStatus('ECX_VERIFIED');
      res.json({ 
        success: true, 
        data: exports, 
        count: exports.length,
        message: 'Exports pending ECTA license approval'
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch pending licenses', 
        error: error.message 
      });
    }
  };

  /**
   * Review license application
   * Check exporter credentials and license validity
   */
  public reviewLicense = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { exportId } = req.params;
      const user = req.user!;
      
      if (!exportId) {
        res.status(400).json({ success: false, message: 'Export ID is required' });
        return;
      }

      const { 
        exporterLicenseNumber,
        licenseExpiryDate,
        exporterTIN,
        reviewedBy,
        notes 
      } = req.body;

      // Validate required fields
      if (!exporterLicenseNumber) {
        res.status(400).json({ 
          success: false, 
          message: 'Exporter license number is required' 
        });
        return;
      }

      // Submit license review to blockchain
      const contract = this.fabricGateway.getExportContract();
      await contract.submitTransaction(
        'ReviewLicense',
        exportId,
        exporterLicenseNumber,
        licenseExpiryDate || '',
        exporterTIN || '',
        reviewedBy || user.username,
        notes || ''
      );

      res.json({ 
        success: true, 
        message: 'License review recorded. Awaiting approval decision.',
        exportId,
        exporterLicenseNumber
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to review license', 
        error: error.message 
      });
    }
  };

  /**
   * Issue export license
   * Generate license number and record in blockchain
   */
  public issueLicense = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { exportId } = req.params;
      const user = req.user!;
      
      if (!exportId) {
        res.status(400).json({ success: false, message: 'Export ID is required' });
        return;
      }

      const { 
        licenseNumber,
        issuedBy,
        validUntil,
        notes 
      } = req.body;

      // Validate required fields
      if (!licenseNumber || !validUntil) {
        res.status(400).json({ 
          success: false, 
          message: 'License number and validity date are required' 
        });
        return;
      }

      // Submit license issuance to blockchain
      const contract = this.fabricGateway.getExportContract();
      await contract.submitTransaction(
        'IssueLicense',
        exportId,
        licenseNumber,
        issuedBy || user.username,
        validUntil,
        notes || ''
      );

      res.json({ 
        success: true, 
        message: 'Export license issued successfully',
        exportId,
        licenseNumber,
        validUntil
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to issue license', 
        error: error.message 
      });
    }
  };

  /**
   * Approve license
   * Status: ECX_VERIFIED → ECTA_LICENSE_APPROVED
   */
  public approveLicense = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { exportId } = req.params;
      const user = req.user!;
      
      if (!exportId) {
        res.status(400).json({ success: false, message: 'Export ID is required' });
        return;
      }

      const { 
        licenseNumber,
        approvedBy, 
        notes 
      } = req.body;

      if (!licenseNumber) {
        res.status(400).json({ 
          success: false, 
          message: 'License number is required for approval' 
        });
        return;
      }

      // Submit license approval to blockchain
      const contract = this.fabricGateway.getExportContract();
      await contract.submitTransaction(
        'ApproveLicense',
        exportId,
        licenseNumber,
        approvedBy || user.username,
        notes || ''
      );

      res.json({ 
        success: true, 
        message: 'License approved. Export can proceed to quality inspection.',
        exportId,
        licenseNumber,
        newStatus: 'ECTA_LICENSE_APPROVED'
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to approve license', 
        error: error.message 
      });
    }
  };

  /**
   * Reject license
   * Status: ECX_VERIFIED → LICENSE_REJECTED
   */
  public rejectLicense = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { exportId } = req.params;
      const user = req.user!;
      
      if (!exportId) {
        res.status(400).json({ success: false, message: 'Export ID is required' });
        return;
      }

      const { reason, rejectedBy } = req.body;

      if (!reason) {
        res.status(400).json({ 
          success: false, 
          message: 'Rejection reason is required' 
        });
        return;
      }

      // Submit license rejection to blockchain
      const contract = this.fabricGateway.getExportContract();
      await contract.submitTransaction(
        'RejectLicense',
        exportId,
        reason,
        rejectedBy || user.username
      );

      res.json({ 
        success: true, 
        message: 'License rejected',
        exportId,
        newStatus: 'LICENSE_REJECTED',
        reason
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to reject license', 
        error: error.message 
      });
    }
  };

  /**
   * Get approved licenses (for reporting)
   */
  public getApprovedLicenses = async (_req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const contract = this.fabricGateway.getExportContract();
      const exportService = createExportService(contract);
      const exports = await exportService.getExportsByStatus('ECTA_LICENSE_APPROVED');
      res.json({ 
        success: true, 
        data: exports, 
        count: exports.length,
        message: 'Exports with approved licenses'
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch approved licenses', 
        error: error.message 
      });
    }
  };

  /**
   * Get rejected licenses (for reporting)
   */
  public getRejectedLicenses = async (_req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const contract = this.fabricGateway.getExportContract();
      const exportService = createExportService(contract);
      const exports = await exportService.getExportsByStatus('LICENSE_REJECTED');
      res.json({ 
        success: true, 
        data: exports, 
        count: exports.length,
        message: 'Rejected license applications'
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch rejected licenses', 
        error: error.message 
      });
    }
  };
}
