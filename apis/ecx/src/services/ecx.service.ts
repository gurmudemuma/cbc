/**
 * ECX Service
 * Business logic for ECX lot verification and export request creation
 */

import { fabricService } from './fabric.service';
import {
  ECXLot,
  ECXLotStatus,
  WarehouseReceipt,
  ECXVerificationRequest,
  ECXVerificationResponse,
  CreateExportRequestPayload,
  ECXExportRecord,
} from '../models/ecx.model';
import { logger } from '../utils/logger';

export class ECXService {
  /**
   * Verify ECX lot number and warehouse receipt
   * In production, this would query ECX's actual database
   * For now, we'll simulate the verification
   */
  async verifyLotNumber(lotNumber: string, warehouseReceiptNumber: string): Promise<ECXLot | null> {
    try {
      logger.info(`Verifying ECX lot: ${lotNumber}, Receipt: ${warehouseReceiptNumber}`);

      // TODO: In production, query ECX database
      // For now, simulate verification
      // This is where you'd integrate with ECX's actual API/database

      // Simulated lot data
      const lot: ECXLot = {
        lotNumber,
        warehouseReceiptNumber,
        coffeeType: 'Arabica Grade 2',
        quantity: 5000,
        grade: 'Grade 2',
        warehouseLocation: 'Addis Ababa Warehouse',
        ownerName: 'Sample Exporter Ltd',
        ownerTIN: 'TIN123456789',
        purchaseDate: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
        status: ECXLotStatus.AVAILABLE,
        verifiedAt: new Date().toISOString(),
        verifiedBy: 'ECX System',
      };

      logger.info(`Lot verified successfully: ${lotNumber}`);
      return lot;
    } catch (error) {
      logger.error('Failed to verify lot number:', error);
      return null;
    }
  }

  /**
   * Verify warehouse receipt
   */
  async verifyWarehouseReceipt(receiptNumber: string): Promise<WarehouseReceipt | null> {
    try {
      logger.info(`Verifying warehouse receipt: ${receiptNumber}`);

      // TODO: In production, query ECX warehouse system
      // Simulated receipt data
      const receipt: WarehouseReceipt = {
        receiptNumber,
        lotNumber: 'LOT-2024-001',
        issueDate: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        warehouseLocation: 'Addis Ababa Warehouse',
        quantity: 5000,
        coffeeType: 'Arabica Grade 2',
        grade: 'Grade 2',
        ownerName: 'Sample Exporter Ltd',
        ownerTIN: 'TIN123456789',
        isValid: true,
      };

      logger.info(`Warehouse receipt verified: ${receiptNumber}`);
      return receipt;
    } catch (error) {
      logger.error('Failed to verify warehouse receipt:', error);
      return null;
    }
  }

  /**
   * Verify ownership of lot
   */
  async verifyOwnership(
    lotNumber: string,
    exporterName: string,
    exporterTIN: string
  ): Promise<boolean> {
    try {
      logger.info(`Verifying ownership: Lot ${lotNumber}, Exporter: ${exporterName}`);

      // TODO: In production, verify against ECX ownership records
      // For now, simulate verification
      const lot = await this.verifyLotNumber(lotNumber, '');

      if (!lot) {
        return false;
      }

      // Check if exporter matches lot owner
      const ownershipVerified = lot.ownerTIN === exporterTIN;

      logger.info(`Ownership verification result: ${ownershipVerified}`);
      return ownershipVerified;
    } catch (error) {
      logger.error('Failed to verify ownership:', error);
      return false;
    }
  }

  /**
   * Process ECX verification request and create blockchain record
   */
  async processVerificationRequest(
    request: ECXVerificationRequest
  ): Promise<ECXVerificationResponse> {
    try {
      logger.info(`Processing ECX verification request for export: ${request.exportId}`);

      // Step 1: Verify lot number
      const lot = await this.verifyLotNumber(request.lotNumber, request.warehouseReceiptNumber);
      if (!lot) {
        return {
          success: false,
          exportId: request.exportId,
          lotNumber: request.lotNumber,
          verified: false,
          message: 'ECX lot number not found or invalid',
        };
      }

      // Step 2: Verify warehouse receipt
      const receipt = await this.verifyWarehouseReceipt(request.warehouseReceiptNumber);
      if (!receipt || !receipt.isValid) {
        return {
          success: false,
          exportId: request.exportId,
          lotNumber: request.lotNumber,
          verified: false,
          message: 'Warehouse receipt not found or invalid',
        };
      }

      // Step 3: Verify ownership
      const ownershipVerified = await this.verifyOwnership(
        request.lotNumber,
        request.exporterName,
        request.exporterTIN
      );
      if (!ownershipVerified) {
        return {
          success: false,
          exportId: request.exportId,
          lotNumber: request.lotNumber,
          verified: false,
          message: 'Exporter is not the owner of this lot',
        };
      }

      // Step 4: Verify quantity
      if (request.requestedQuantity > lot.quantity) {
        return {
          success: false,
          exportId: request.exportId,
          lotNumber: request.lotNumber,
          verified: false,
          message: `Requested quantity (${request.requestedQuantity}kg) exceeds available quantity (${lot.quantity}kg)`,
        };
      }

      // Step 5: Check lot status
      if (lot.status !== ECXLotStatus.AVAILABLE) {
        return {
          success: false,
          exportId: request.exportId,
          lotNumber: request.lotNumber,
          verified: false,
          message: `Lot is not available. Current status: ${lot.status}`,
        };
      }

      // Step 6: Verify on blockchain
      const txId = await fabricService.verifyECXLot(
        request.exportId,
        request.lotNumber,
        request.warehouseReceiptNumber
      );

      logger.info(`ECX verification successful for export: ${request.exportId}`);

      return {
        success: true,
        exportId: request.exportId,
        lotNumber: request.lotNumber,
        verified: true,
        message: 'ECX lot verified successfully',
        lot,
        blockchainTxId: txId,
      };
    } catch (error) {
      logger.error('Failed to process verification request:', error);
      return {
        success: false,
        exportId: request.exportId,
        lotNumber: request.lotNumber,
        verified: false,
        message: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Create export request on blockchain (ECX creates the initial record)
   */
  async createExportRequest(payload: CreateExportRequestPayload): Promise<ECXExportRecord> {
    try {
      logger.info(`Creating export request: ${payload.exportId}`);

      // Verify lot before creating blockchain record
      const verificationRequest: ECXVerificationRequest = {
        exportId: payload.exportId,
        lotNumber: payload.ecxLotNumber,
        warehouseReceiptNumber: payload.warehouseReceiptNumber,
        exporterName: payload.exporterName,
        exporterTIN: payload.exporterTIN,
        requestedQuantity: payload.quantity,
      };

      const verificationResult = await this.processVerificationRequest(verificationRequest);

      if (!verificationResult.verified) {
        throw new Error(verificationResult.message);
      }

      // Create blockchain record
      const txId = await fabricService.createExportRequest(
        payload.exportId,
        payload.commercialBankId, // Changed from commercialbankId
        payload.exporterName,
        payload.exportLicenseNumber,
        payload.coffeeType,
        payload.quantity,
        payload.destinationCountry,
        payload.estimatedValue,
        payload.ecxLotNumber,
        payload.warehouseLocation
      );

      const record: ECXExportRecord = {
        exportId: payload.exportId,
        lotNumber: payload.ecxLotNumber,
        exporterName: payload.exporterName,
        quantity: payload.quantity,
        status: 'ECX_VERIFIED',
        createdAt: new Date().toISOString(),
        verifiedAt: new Date().toISOString(),
        blockchainTxId: txId,
      };

      logger.info(`Export request created successfully: ${payload.exportId}`);

      return record;
    } catch (error) {
      logger.error('Failed to create export request:', error);
      throw error;
    }
  }

  /**
   * Get export request from blockchain
   */
  async getExportRequest(exportId: string): Promise<any> {
    try {
      return await fabricService.getExportRequest(exportId);
    } catch (error) {
      logger.error('Failed to get export request:', error);
      throw error;
    }
  }

  /**
   * Get exports by status
   */
  async getExportsByStatus(status: string): Promise<any[]> {
    try {
      return await fabricService.getExportsByStatus(status);
    } catch (error) {
      logger.error('Failed to get exports by status:', error);
      throw error;
    }
  }

  /**
   * Reject ECX verification
   */
  async rejectVerification(exportId: string, reason: string): Promise<string> {
    try {
      return await fabricService.rejectECXVerification(exportId, reason);
    } catch (error) {
      logger.error('Failed to reject verification:', error);
      throw error;
    }
  }
}

// Singleton instance
export const ecxService = new ECXService();
