/**
 * ECX Controller
 * Handles HTTP requests for ECX operations
 */

import { Request, Response } from 'express';
import { ecxService } from '../services/ecx.service';
import { logger } from '../utils/logger';
import { ECXVerificationRequest, CreateExportRequestPayload } from '../models/ecx.model';

export class ECXController {
  /**
   * Verify ECX lot number
   * POST /api/ecx/verify-lot
   */
  async verifyLot(req: Request, res: Response): Promise<void> {
    try {
      const { lotNumber, warehouseReceiptNumber } = req.body;

      if (!lotNumber || !warehouseReceiptNumber) {
        res.status(400).json({
          success: false,
          message: 'Lot number and warehouse receipt number are required',
        });
        return;
      }

      const lot = await ecxService.verifyLotNumber(lotNumber, warehouseReceiptNumber);

      if (!lot) {
        res.status(404).json({
          success: false,
          message: 'Lot not found or invalid',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Lot verified successfully',
        data: lot,
      });
    } catch (error) {
      logger.error('Error in verifyLot:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify lot',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Verify warehouse receipt
   * POST /api/ecx/verify-receipt
   */
  async verifyReceipt(req: Request, res: Response): Promise<void> {
    try {
      const { receiptNumber } = req.body;

      if (!receiptNumber) {
        res.status(400).json({
          success: false,
          message: 'Receipt number is required',
        });
        return;
      }

      const receipt = await ecxService.verifyWarehouseReceipt(receiptNumber);

      if (!receipt) {
        res.status(404).json({
          success: false,
          message: 'Receipt not found or invalid',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Receipt verified successfully',
        data: receipt,
      });
    } catch (error) {
      logger.error('Error in verifyReceipt:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify receipt',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Process ECX verification and create blockchain record
   * POST /api/ecx/verify-and-create
   */
  async verifyAndCreateExport(req: Request, res: Response): Promise<void> {
    try {
      const verificationRequest: ECXVerificationRequest = {
        exportId: req.body.exportId,
        lotNumber: req.body.lotNumber,
        warehouseReceiptNumber: req.body.warehouseReceiptNumber,
        exporterName: req.body.exporterName,
        exporterTIN: req.body.exporterTIN,
        requestedQuantity: req.body.requestedQuantity,
      };

      // Validate required fields
      if (
        !verificationRequest.exportId ||
        !verificationRequest.lotNumber ||
        !verificationRequest.warehouseReceiptNumber ||
        !verificationRequest.exporterName
      ) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields',
        });
        return;
      }

      const result = await ecxService.processVerificationRequest(verificationRequest);

      if (!result.verified) {
        res.status(400).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      logger.error('Error in verifyAndCreateExport:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify and create export',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Create export request on blockchain
   * POST /api/ecx/create-export
   */
  async createExport(req: Request, res: Response): Promise<void> {
    try {
      const payload: CreateExportRequestPayload = {
        exportId: req.body.exportId,
        commercialbankId: req.body.commercialbankId,
        exporterName: req.body.exporterName,
        exporterTIN: req.body.exporterTIN,
        exportLicenseNumber: req.body.exportLicenseNumber,
        coffeeType: req.body.coffeeType,
        quantity: req.body.quantity,
        destinationCountry: req.body.destinationCountry,
        estimatedValue: req.body.estimatedValue,
        ecxLotNumber: req.body.ecxLotNumber,
        warehouseLocation: req.body.warehouseLocation,
        warehouseReceiptNumber: req.body.warehouseReceiptNumber,
      };

      // Validate required fields
      if (!payload.exportId || !payload.exporterName || !payload.ecxLotNumber) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields',
        });
        return;
      }

      const record = await ecxService.createExportRequest(payload);

      res.status(201).json({
        success: true,
        message: 'Export request created successfully',
        data: record,
      });
    } catch (error) {
      logger.error('Error in createExport:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create export request',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get export request by ID
   * GET /api/ecx/exports/:exportId
   */
  async getExport(req: Request, res: Response): Promise<void> {
    try {
      const { exportId } = req.params;

      if (!exportId) {
        res.status(400).json({
          success: false,
          message: 'Export ID is required',
        });
        return;
      }

      const exportData = await ecxService.getExportRequest(exportId);

      res.status(200).json({
        success: true,
        data: exportData,
      });
    } catch (error) {
      logger.error('Error in getExport:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get export request',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get exports by status
   * GET /api/ecx/exports/status/:status
   */
  async getExportsByStatus(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.params;

      if (!status) {
        res.status(400).json({
          success: false,
          message: 'Status is required',
        });
        return;
      }

      const exports = await ecxService.getExportsByStatus(status);

      res.status(200).json({
        success: true,
        count: exports.length,
        data: exports,
      });
    } catch (error) {
      logger.error('Error in getExportsByStatus:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get exports',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Reject ECX verification
   * POST /api/ecx/reject
   */
  async rejectVerification(req: Request, res: Response): Promise<void> {
    try {
      const { exportId, reason } = req.body;

      if (!exportId || !reason) {
        res.status(400).json({
          success: false,
          message: 'Export ID and reason are required',
        });
        return;
      }

      const txId = await ecxService.rejectVerification(exportId, reason);

      res.status(200).json({
        success: true,
        message: 'Verification rejected successfully',
        txId,
      });
    } catch (error) {
      logger.error('Error in rejectVerification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reject verification',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Health check
   * GET /health
   */
  async healthCheck(_req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      service: 'ECX API',
      status: 'healthy',
      timestamp: new Date().toISOString(),
    });
  }
}

export const ecxController = new ECXController();
