/**
 * ECX Controller
 * Handles HTTP requests for ECX operations with PostgreSQL backend
 */

import { Request, Response } from 'express';
<<<<<<< HEAD
import { pool } from '@shared/database/pool';
import { createLogger } from '@shared/logger';
import { ErrorCode, AppError } from '@shared/error-codes';
=======
import { pool } from '../../../shared/database/pool';
import { createLogger } from '../../../shared/logger';
import { ErrorCode, AppError } from '../../../shared/error-codes';
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665

const logger = createLogger('ECXController');

export class ECXController {
  /**
   * Verify ECX lot number
   * POST /api/ecx/verify-lot
   */
  async verifyLot(req: Request, res: Response): Promise<void> {
    try {
      const { lotNumber, warehouseReceiptNumber } = req.body;

      if (!lotNumber || !warehouseReceiptNumber) {
        throw new AppError(
          ErrorCode.MISSING_REQUIRED_FIELD,
          'Lot number and warehouse receipt number are required',
          400
        );
      }

      const result = await pool.query(
        'SELECT * FROM ecx_lots WHERE lot_number = $1 AND warehouse_receipt_number = $2',
        [lotNumber, warehouseReceiptNumber]
      );

      if (result.rows.length === 0) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Lot not found or invalid', 404);
      }

      res.status(200).json({
        success: true,
        message: 'Lot verified successfully',
        data: result.rows[0]
      });
    } catch (error) {
      logger.error('Error in verifyLot:', { error: error instanceof Error ? error.message : 'Unknown error' });
      this.handleError(error, res);
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
        throw new AppError(
          ErrorCode.MISSING_REQUIRED_FIELD,
          'Receipt number is required',
          400
        );
      }

      const result = await pool.query(
        'SELECT * FROM warehouse_receipts WHERE receipt_number = $1',
        [receiptNumber]
      );

      if (result.rows.length === 0) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Receipt not found or invalid', 404);
      }

      res.status(200).json({
        success: true,
        message: 'Receipt verified successfully',
        data: result.rows[0]
      });
    } catch (error) {
      logger.error('Error in verifyReceipt:', { error: error instanceof Error ? error.message : 'Unknown error' });
      this.handleError(error, res);
    }
  }

  /**
   * Process ECX verification and create database record
   * POST /api/ecx/verify-and-create
   */
  async verifyAndCreateExport(req: Request, res: Response): Promise<void> {
    const client = await pool.connect();
    try {
      const {
        exportId,
        lotNumber,
        warehouseReceiptNumber,
        exporterName,
        exporterTIN,
        requestedQuantity
      } = req.body;

      // Validate required fields
      if (!exportId || !lotNumber || !warehouseReceiptNumber || !exporterName) {
        throw new AppError(
          ErrorCode.MISSING_REQUIRED_FIELD,
          'Missing required fields',
          400
        );
      }

      await client.query('BEGIN');

      // Verify lot exists
      const lotResult = await client.query(
        'SELECT * FROM ecx_lots WHERE lot_number = $1 AND warehouse_receipt_number = $2',
        [lotNumber, warehouseReceiptNumber]
      );

      if (lotResult.rows.length === 0) {
        throw new AppError(ErrorCode.NOT_FOUND, 'ECX lot not found', 404);
      }

      const lot = lotResult.rows[0];

      // Verify ownership
      if (lot.owner_tin !== exporterTIN) {
        throw new AppError(
          ErrorCode.UNAUTHORIZED,
          'Exporter is not the owner of this lot',
          403
        );
      }

      // Verify quantity
      if (requestedQuantity > lot.quantity) {
        throw new AppError(
          ErrorCode.INVALID_INPUT,
          `Requested quantity exceeds available quantity`,
          400
        );
      }

      // Create export record
      const exportResult = await client.query(
        `INSERT INTO exports (id, exporter_name, exporter_tin, ecx_lot_number, warehouse_receipt_number, 
         quantity, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         RETURNING *`,
        [exportId, exporterName, exporterTIN, lotNumber, warehouseReceiptNumber, requestedQuantity, 'ECX_VERIFIED']
      );

      await client.query('COMMIT');

      res.status(200).json({
        success: true,
        verified: true,
        message: 'Export verified and created successfully',
        data: exportResult.rows[0]
      });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error in verifyAndCreateExport:', { error: error instanceof Error ? error.message : 'Unknown error' });
      this.handleError(error, res);
    } finally {
      client.release();
    }
  }

  /**
   * Create export request in database
   * POST /api/ecx/create-export
   */
  async createExport(req: Request, res: Response): Promise<void> {
    const client = await pool.connect();
    try {
      const {
        exportId,
        commercialBankId,
        exporterName,
        exporterTIN,
        exportLicenseNumber,
        coffeeType,
        quantity,
        destinationCountry,
        estimatedValue,
        ecxLotNumber,
        warehouseLocation,
        warehouseReceiptNumber
      } = req.body;

      // Validate required fields
      if (!exportId || !exporterName || !ecxLotNumber) {
        throw new AppError(
          ErrorCode.MISSING_REQUIRED_FIELD,
          'Missing required fields',
          400
        );
      }

      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO exports (id, commercial_bank_id, exporter_name, exporter_tin, export_license_number,
         coffee_type, quantity, destination_country, estimated_value, ecx_lot_number, warehouse_location,
         warehouse_receipt_number, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
         RETURNING *`,
        [exportId, commercialBankId, exporterName, exporterTIN, exportLicenseNumber, coffeeType,
<<<<<<< HEAD
          quantity, destinationCountry, estimatedValue, ecxLotNumber, warehouseLocation,
          warehouseReceiptNumber, 'ECX_CREATED']
=======
         quantity, destinationCountry, estimatedValue, ecxLotNumber, warehouseLocation,
         warehouseReceiptNumber, 'ECX_CREATED']
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
      );

      await client.query('COMMIT');

      res.status(201).json({
        success: true,
        message: 'Export request created successfully',
        data: result.rows[0]
      });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error in createExport:', { error: error instanceof Error ? error.message : 'Unknown error' });
      this.handleError(error, res);
    } finally {
      client.release();
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
        throw new AppError(
          ErrorCode.MISSING_REQUIRED_FIELD,
          'Export ID is required',
          400
        );
      }

      const result = await pool.query(
        'SELECT * FROM exports WHERE id = $1',
        [exportId]
      );

      if (result.rows.length === 0) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Export not found', 404);
      }

      res.status(200).json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      logger.error('Error in getExport:', { error: error instanceof Error ? error.message : 'Unknown error' });
      this.handleError(error, res);
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
        throw new AppError(
          ErrorCode.MISSING_REQUIRED_FIELD,
          'Status is required',
          400
        );
      }

      const result = await pool.query(
        'SELECT * FROM exports WHERE status = $1 ORDER BY created_at DESC',
        [status]
      );

      res.status(200).json({
        success: true,
        count: result.rows.length,
        data: result.rows
      });
    } catch (error) {
      logger.error('Error in getExportsByStatus:', { error: error instanceof Error ? error.message : 'Unknown error' });
      this.handleError(error, res);
    }
  }

  /**
   * Reject ECX verification
   * POST /api/ecx/reject
   */
  async rejectVerification(req: Request, res: Response): Promise<void> {
    const client = await pool.connect();
    try {
      const { exportId, reason } = req.body;

      if (!exportId || !reason) {
        throw new AppError(
          ErrorCode.MISSING_REQUIRED_FIELD,
          'Export ID and reason are required',
          400
        );
      }

      await client.query('BEGIN');

      const result = await client.query(
        'SELECT * FROM exports WHERE id = $1',
        [exportId]
      );

      if (result.rows.length === 0) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Export not found', 404);
      }

      await client.query(
        'UPDATE exports SET status = $1, updated_at = NOW() WHERE id = $2',
        ['ECX_REJECTED', exportId]
      );

      await client.query(
        `INSERT INTO export_status_history (export_id, old_status, new_status, changed_at, notes)
         VALUES ($1, $2, $3, NOW(), $4)`,
        [exportId, result.rows[0].status, 'ECX_REJECTED', reason]
      );

      await client.query('COMMIT');

      res.status(200).json({
        success: true,
        message: 'Verification rejected successfully',
        exportId
      });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error in rejectVerification:', { error: error instanceof Error ? error.message : 'Unknown error' });
      this.handleError(error, res);
    } finally {
      client.release();
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
      timestamp: new Date().toISOString()
    });
  }

  private handleError(error: any, res: Response): void {
    if (error instanceof AppError) {
      res.status(error.httpStatus).json({
        success: false,
        error: { code: error.code, message: error.message },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: { code: ErrorCode.INTERNAL_SERVER_ERROR, message: 'An unexpected error occurred' },
    });
  }
}

export const ecxController = new ECXController();
