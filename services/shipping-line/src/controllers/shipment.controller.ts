import { Request, Response, NextFunction } from "express";
import { JwtPayload } from "jsonwebtoken";
<<<<<<< HEAD
import { pool } from '@shared/database/pool';
import { v4 as uuidv4 } from "uuid";
import { createLogger } from '@shared/logger';
import { ErrorCode, AppError } from '@shared/error-codes';
=======
import { pool } from "../../../shared/database/pool";
import { v4 as uuidv4 } from "uuid";
import { createLogger } from "../../../shared/logger";
import { ErrorCode, AppError } from "../../../shared/error-codes";
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665

const logger = createLogger('ShipmentController');

interface AuthJWTPayload extends JwtPayload {
  id: string;
  username: string;
  organizationId: string;
  role: string;
}

interface RequestWithUser extends Request {
  user?: AuthJWTPayload;
}

export class ShipmentController {
  public getReadyExports = async (
    _req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await pool.query(
        'SELECT * FROM exports WHERE status = $1 ORDER BY created_at DESC',
        ['CUSTOMS_CLEARED']
      );

      res.json({ success: true, data: result.rows, count: result.rows.length });
    } catch (error: any) {
      logger.error('Failed to fetch ready exports', { error: error.message });
      this.handleError(error, res);
    }
  };

  public getAllExports = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await pool.query('SELECT * FROM exports ORDER BY created_at DESC');

      res.json({ success: true, data: result.rows });
    } catch (error: any) {
      logger.error('Failed to fetch exports', { error: error.message });
      this.handleError(error, res);
    }
  };

  public getExportById = async (
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    try {
      const { exportId } = req.params;
      if (!exportId) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Export ID is required', 400);
      }

      const result = await pool.query(
        'SELECT * FROM exports WHERE id = $1',
        [exportId]
      );

      if (result.rows.length === 0) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Export not found', 404);
      }

      res.json({ success: true, data: result.rows[0] });
    } catch (error: any) {
      logger.error('Failed to fetch export', { error: error.message });
      this.handleError(error, res);
    }
  };

  public scheduleShipment = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    const client = await pool.connect();
    try {
      const { exportId, transportIdentifier, departureDate, arrivalDate, transportMode } = req.body;
      const user = req.user!;
      const shipmentId = `SHIP-${uuidv4()}`;

      if (!exportId || !transportIdentifier) {
        throw new AppError(
          ErrorCode.MISSING_REQUIRED_FIELD,
          'Export ID and transport identifier are required',
          400
        );
      }

      await client.query('BEGIN');

      const exportResult = await client.query(
        'SELECT * FROM exports WHERE id = $1',
        [exportId]
      );

      if (exportResult.rows.length === 0) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Export not found', 404);
      }

      const exportData = exportResult.rows[0];

      if (exportData.status !== 'CUSTOMS_CLEARED') {
        throw new AppError(
          ErrorCode.INVALID_STATUS_TRANSITION,
          `Export must be customs cleared. Current status: ${exportData.status}`,
          400
        );
      }

      await client.query(
        `UPDATE exports SET status = $1, transport_identifier = $2, departure_date = $3, 
         arrival_date = $4, transport_mode = $5, updated_at = NOW() WHERE id = $6`,
        ['SHIPMENT_SCHEDULED', transportIdentifier, departureDate, arrivalDate, transportMode, exportId]
      );

      await client.query(
        `INSERT INTO export_status_history (export_id, old_status, new_status, changed_by, changed_at, notes)
         VALUES ($1, $2, $3, $4, NOW(), $5)`,
        [exportId, 'CUSTOMS_CLEARED', 'SHIPMENT_SCHEDULED', user.id, `Shipment scheduled with transport: ${transportIdentifier}`]
      );

      await client.query('COMMIT');

      logger.info('Shipment scheduled', { exportId, shipmentId, userId: user.id });

      res.json({
        success: true,
        message: 'Shipment scheduled successfully',
        data: { exportId, shipmentId, transportIdentifier },
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      logger.error('Shipment scheduling failed', { error: error.message });
      this.handleError(error, res);
    } finally {
      client.release();
    }
  };

  public confirmShipment = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    const client = await pool.connect();
    try {
      const { exportId } = req.body;
      const user = req.user!;

      if (!exportId) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Export ID is required', 400);
      }

      await client.query('BEGIN');

      const exportResult = await client.query(
        'SELECT * FROM exports WHERE id = $1',
        [exportId]
      );

      if (exportResult.rows.length === 0) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Export not found', 404);
      }

      const exportData = exportResult.rows[0];

      if (exportData.status !== 'SHIPMENT_SCHEDULED') {
        throw new AppError(
          ErrorCode.INVALID_STATUS_TRANSITION,
          `Export must have shipment scheduled. Current status: ${exportData.status}`,
          400
        );
      }

      await client.query(
        'UPDATE exports SET status = $1, updated_at = NOW() WHERE id = $2',
        ['SHIPPED', exportId]
      );

      await client.query(
        `INSERT INTO export_status_history (export_id, old_status, new_status, changed_by, changed_at, notes)
         VALUES ($1, $2, $3, $4, NOW(), $5)`,
        [exportId, 'SHIPMENT_SCHEDULED', 'SHIPPED', user.id, 'Shipment confirmed and marked as shipped']
      );

      await client.query('COMMIT');

      logger.info('Shipment confirmed', { exportId, userId: user.id });

      res.json({
        success: true,
        message: 'Shipment confirmed',
        data: { exportId, status: 'SHIPPED' },
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      logger.error('Shipment confirmation failed', { error: error.message });
      this.handleError(error, res);
    } finally {
      client.release();
    }
  };

  /**
   * Reject shipment
   */
  public rejectShipment = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    const client = await pool.connect();
    try {
      const { exportId, reason } = req.body;
      const user = req.user!;

      if (!exportId || !reason) {
        throw new AppError(
          ErrorCode.MISSING_REQUIRED_FIELD,
          'Export ID and rejection reason are required',
          400
        );
      }

      if (reason.trim().length < 10) {
        throw new AppError(
          ErrorCode.INVALID_INPUT,
          'Rejection reason must be at least 10 characters',
          400
        );
      }

      await client.query('BEGIN');

      const exportResult = await client.query(
        'SELECT * FROM exports WHERE id = $1',
        [exportId]
      );

      if (exportResult.rows.length === 0) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Export not found', 404);
      }

      const exportData = exportResult.rows[0];

      if (exportData.status !== 'CUSTOMS_CLEARED') {
        throw new AppError(
          ErrorCode.INVALID_STATUS_TRANSITION,
          `Export must be customs cleared. Current status: ${exportData.status}`,
          400
        );
      }

      await client.query(
        'UPDATE exports SET status = $1, updated_at = NOW() WHERE id = $2',
        ['SHIPMENT_REJECTED', exportId]
      );

      await client.query(
        `INSERT INTO export_status_history (export_id, old_status, new_status, changed_by, changed_at, notes)
         VALUES ($1, $2, $3, $4, NOW(), $5)`,
        [exportId, 'CUSTOMS_CLEARED', 'SHIPMENT_REJECTED', user.id, reason]
      );

      await client.query('COMMIT');

      logger.info('Shipment rejected', { exportId, reason, userId: user.id });

      res.json({
        success: true,
        message: 'Shipment rejected',
        data: { exportId, reason, status: 'SHIPMENT_REJECTED' },
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      logger.error('Shipment rejection failed', { error: error.message });
      this.handleError(error, res);
    } finally {
      client.release();
    }
  };

  /**
   * Centralized error handling
   */
  private handleError(error: any, res: Response): void {
    if (error instanceof AppError) {
      res.status(error.httpStatus).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
      return;
    }

    logger.error('Unexpected error', { error: error.message });

    res.status(500).json({
      success: false,
      error: {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'An unexpected error occurred',
      },
    });
  }
}
