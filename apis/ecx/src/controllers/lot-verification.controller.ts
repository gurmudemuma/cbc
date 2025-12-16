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
 * Lot Verification Controller for ECX
 *
 * ECX (Ethiopian Commodity Exchange) is responsible for:
 * - Verifying ECX lot numbers
 * - Verifying warehouse receipt numbers
 * - Confirming coffee quality from warehouse
 * - Creating blockchain record for verified lots
 * - Approving or rejecting lot verification
 *
 * ECX does NOT:
 * - Issue quality certificates (that's ECTA)
 * - Approve FX (that's NBE)
 * - Clear customs (that's Customs)
 */
export class LotVerificationController {
  private fabricGateway: FabricGateway;

  constructor() {
    this.fabricGateway = FabricGateway.getInstance();
  }

  /**
   * Get all exports (ECX can view all)
   */
  public getAllExports = async (
    _req: RequestWithUser,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const contract = this.fabricGateway.getExportContract();
      const exportService = createExportService(contract);
      const exports = await exportService.getAllExports();
      res.json({ success: true, data: exports, count: exports.length });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch exports',
        error: error.message,
      });
    }
  };

  /**
   * Get single export by ID
   */
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
      res.status(500).json({
        success: false,
        message: 'Failed to fetch export',
        error: error.message,
      });
    }
  };

  /**
   * Get exports pending ECX lot verification
   * Status: PENDING (newly created exports)
   */
  public getPendingVerification = async (
    _req: RequestWithUser,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const contract = this.fabricGateway.getExportContract();
      const exportService = createExportService(contract);
      const exports = await exportService.getExportsByStatus('PENDING');
      res.json({
        success: true,
        data: exports,
        count: exports.length,
        message: 'Exports pending ECX lot verification',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch pending verifications',
        error: error.message,
      });
    }
  };

  /**
   * Verify lot - Check lot number and warehouse receipt
   * This is ECX's primary task
   */
  public verifyLot = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const { exportId } = req.params;
      const user = req.user!;

      if (!exportId) {
        res.status(400).json({ success: false, message: 'Export ID is required' });
        return;
      }

      const { lotNumber, warehouseReceiptNumber, warehouseLocation, verifiedBy, notes } = req.body;

      // Validate required fields
      if (!lotNumber || !warehouseReceiptNumber) {
        res.status(400).json({
          success: false,
          message: 'Lot number and warehouse receipt number are required',
        });
        return;
      }

      // Submit verification to blockchain
      const contract = this.fabricGateway.getExportContract();
      await contract.submitTransaction(
        'VerifyLot',
        exportId,
        lotNumber,
        warehouseReceiptNumber,
        warehouseLocation || '',
        verifiedBy || user.username,
        notes || ''
      );

      res.json({
        success: true,
        message: 'Lot verification recorded. Awaiting approval.',
        exportId,
        lotNumber,
        warehouseReceiptNumber,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to verify lot',
        error: error.message,
      });
    }
  };

  /**
   * Approve lot verification
   * Status: PENDING → ECX_VERIFIED
   */
  public approveLot = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const { exportId } = req.params;
      const user = req.user!;

      if (!exportId) {
        res.status(400).json({ success: false, message: 'Export ID is required' });
        return;
      }

      const { approvedBy, notes } = req.body;

      // Submit approval to blockchain
      const contract = this.fabricGateway.getExportContract();
      await contract.submitTransaction(
        'ApproveLotVerification',
        exportId,
        approvedBy || user.username,
        notes || ''
      );

      res.json({
        success: true,
        message: 'Lot verification approved. Export can proceed to ECTA.',
        exportId,
        newStatus: 'ECX_VERIFIED',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to approve lot verification',
        error: error.message,
      });
    }
  };

  /**
   * Reject lot verification
   * Status: PENDING → ECX_REJECTED
   */
  public rejectLot = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
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
          message: 'Rejection reason is required',
        });
        return;
      }

      // Submit rejection to blockchain
      const contract = this.fabricGateway.getExportContract();
      await contract.submitTransaction(
        'RejectLotVerification',
        exportId,
        reason,
        rejectedBy || user.username
      );

      res.json({
        success: true,
        message: 'Lot verification rejected',
        exportId,
        newStatus: 'ECX_REJECTED',
        reason,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to reject lot verification',
        error: error.message,
      });
    }
  };

  /**
   * Get verified lots (for reporting)
   */
  public getVerifiedLots = async (
    _req: RequestWithUser,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const contract = this.fabricGateway.getExportContract();
      const exportService = createExportService(contract);
      const exports = await exportService.getExportsByStatus('ECX_VERIFIED');
      res.json({
        success: true,
        data: exports,
        count: exports.length,
        message: 'Exports with verified lots',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch verified lots',
        error: error.message,
      });
    }
  };

  /**
   * Get rejected lots (for reporting)
   */
  public getRejectedLots = async (
    _req: RequestWithUser,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const contract = this.fabricGateway.getExportContract();
      const exportService = createExportService(contract);
      const exports = await exportService.getExportsByStatus('ECX_REJECTED');
      res.json({
        success: true,
        data: exports,
        count: exports.length,
        message: 'Rejected lot verifications',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch rejected lots',
        error: error.message,
      });
    }
  };
}
