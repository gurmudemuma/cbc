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
 * Contract Controller for ECTA
 * 
 * ECTA (Ethiopian Coffee & Tea Authority) is responsible for:
 * - Reviewing export contracts
 * - Verifying contract terms
 * - Checking buyer information
 * - Verifying origin certificates
 * - Approving or rejecting export contracts
 * 
 * This is the THIRD of three ECTA approval steps:
 * 1. License Approval (license.controller.ts)
 * 2. Quality Certification (quality.controller.ts)
 * 3. Contract Approval (this controller)
 */
export class ContractController {
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
   * Get exports pending contract approval
   * Status: ECTA_QUALITY_APPROVED (after quality certification)
   */
  public getPendingContracts = async (_req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const contract = this.fabricGateway.getExportContract();
      const exportService = createExportService(contract);
      const exports = await exportService.getExportsByStatus('ECTA_QUALITY_APPROVED');
      res.json({ 
        success: true, 
        data: exports, 
        count: exports.length,
        message: 'Exports pending ECTA contract approval'
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch pending contracts', 
        error: error.message 
      });
    }
  };

  /**
   * Review export contract
   * Check contract terms, buyer info, and payment terms
   */
  public reviewContract = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { exportId } = req.params;
      const user = req.user!;
      
      if (!exportId) {
        res.status(400).json({ success: false, message: 'Export ID is required' });
        return;
      }

      const { 
        contractNumber,
        buyerName,
        buyerCountry,
        contractValue,
        paymentTerms,
        reviewedBy,
        notes 
      } = req.body;

      // Validate required fields
      if (!contractNumber || !buyerName) {
        res.status(400).json({ 
          success: false, 
          message: 'Contract number and buyer name are required' 
        });
        return;
      }

      // Submit contract review to blockchain
      const contract = this.fabricGateway.getExportContract();
      await contract.submitTransaction(
        'ReviewContract',
        exportId,
        contractNumber,
        buyerName,
        buyerCountry || '',
        contractValue?.toString() || '0',
        paymentTerms || '',
        reviewedBy || user.username,
        notes || ''
      );

      res.json({ 
        success: true, 
        message: 'Contract review recorded. Awaiting approval decision.',
        exportId,
        contractNumber
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to review contract', 
        error: error.message 
      });
    }
  };

  /**
   * Verify origin certificate
   * Confirm coffee origin and authenticity
   */
  public verifyOrigin = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { exportId } = req.params;
      const user = req.user!;
      
      if (!exportId) {
        res.status(400).json({ success: false, message: 'Export ID is required' });
        return;
      }

      const { 
        originCertificateNumber,
        originRegion,
        verifiedBy,
        notes 
      } = req.body;

      // Validate required fields
      if (!originCertificateNumber || !originRegion) {
        res.status(400).json({ 
          success: false, 
          message: 'Origin certificate number and region are required' 
        });
        return;
      }

      // Submit origin verification to blockchain
      const contract = this.fabricGateway.getExportContract();
      await contract.submitTransaction(
        'VerifyOrigin',
        exportId,
        originCertificateNumber,
        originRegion,
        verifiedBy || user.username,
        notes || ''
      );

      res.json({ 
        success: true, 
        message: 'Origin certificate verified successfully',
        exportId,
        originCertificateNumber,
        originRegion
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to verify origin', 
        error: error.message 
      });
    }
  };

  /**
   * Approve contract
   * Status: ECTA_QUALITY_APPROVED → ECTA_CONTRACT_APPROVED
   */
  public approveContract = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { exportId } = req.params;
      const user = req.user!;
      
      if (!exportId) {
        res.status(400).json({ success: false, message: 'Export ID is required' });
        return;
      }

      const { 
        contractNumber,
        originCertificateNumber,
        approvedBy, 
        notes 
      } = req.body;

      if (!contractNumber || !originCertificateNumber) {
        res.status(400).json({ 
          success: false, 
          message: 'Contract number and origin certificate number are required for approval' 
        });
        return;
      }

      // Submit contract approval to blockchain
      const contract = this.fabricGateway.getExportContract();
      await contract.submitTransaction(
        'ApproveContract',
        exportId,
        contractNumber,
        originCertificateNumber,
        approvedBy || user.username,
        notes || ''
      );

      res.json({ 
        success: true, 
        message: 'Contract approved. Export can proceed to Commercial Bank for document verification.',
        exportId,
        contractNumber,
        newStatus: 'ECTA_CONTRACT_APPROVED'
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to approve contract', 
        error: error.message 
      });
    }
  };

  /**
   * Reject contract
   * Status: ECTA_QUALITY_APPROVED → CONTRACT_REJECTED
   */
  public rejectContract = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
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

      // Submit contract rejection to blockchain
      const contract = this.fabricGateway.getExportContract();
      await contract.submitTransaction(
        'RejectContract',
        exportId,
        reason,
        rejectedBy || user.username
      );

      res.json({ 
        success: true, 
        message: 'Contract rejected',
        exportId,
        newStatus: 'CONTRACT_REJECTED',
        reason
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to reject contract', 
        error: error.message 
      });
    }
  };

  /**
   * Get approved contracts (for reporting)
   */
  public getApprovedContracts = async (_req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const contract = this.fabricGateway.getExportContract();
      const exportService = createExportService(contract);
      const exports = await exportService.getExportsByStatus('ECTA_CONTRACT_APPROVED');
      res.json({ 
        success: true, 
        data: exports, 
        count: exports.length,
        message: 'Exports with approved contracts'
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch approved contracts', 
        error: error.message 
      });
    }
  };

  /**
   * Get rejected contracts (for reporting)
   */
  public getRejectedContracts = async (_req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const contract = this.fabricGateway.getExportContract();
      const exportService = createExportService(contract);
      const exports = await exportService.getExportsByStatus('CONTRACT_REJECTED');
      res.json({ 
        success: true, 
        data: exports, 
        count: exports.length,
        message: 'Rejected export contracts'
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch rejected contracts', 
        error: error.message 
      });
    }
  };
}
