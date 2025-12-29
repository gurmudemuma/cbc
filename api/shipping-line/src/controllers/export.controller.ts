import { Request, Response, NextFunction } from "express";
import { JwtPayload } from "jsonwebtoken";
<<<<<<< HEAD
import { pool } from '@shared/database/pool';
import { createLogger } from '@shared/logger';
import { ErrorCode, AppError } from '@shared/error-codes';
=======
import { pool } from "../../../shared/database/pool";
import { createLogger } from "../../../shared/logger";
import { ErrorCode, AppError } from "../../../shared/error-codes";
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665

const logger = createLogger('ShippingLineExportController');

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

      const result = await pool.query('SELECT * FROM exports WHERE id = $1', [exportId]);
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
      const { exportId } = req.params;
      const user = req.user;
      const { transportIdentifier, departureDate, arrivalDate, transportMode } = req.body;

      if (!exportId || !transportIdentifier) {
        throw new AppError(
          ErrorCode.MISSING_REQUIRED_FIELD,
          'Export ID and transport identifier are required',
          400
        );
      }

      await client.query('BEGIN');

      const exportResult = await client.query('SELECT * FROM exports WHERE id = $1', [exportId]);
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
        [exportId, 'CUSTOMS_CLEARED', 'SHIPMENT_SCHEDULED', user?.id, `Shipment scheduled with transport: ${transportIdentifier}`]
      );

      await client.query('COMMIT');

      logger.info('Shipment scheduled', { exportId, transportIdentifier, userId: user?.id });

      res.json({
        success: true,
        message: 'Shipment scheduled successfully',
        data: { exportId, transportIdentifier },
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      logger.error('Failed to schedule shipment', { error: error.message });
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
      const { exportId } = req.params;
      const user = req.user;

      if (!exportId) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Export ID is required', 400);
      }

      await client.query('BEGIN');

      const exportResult = await client.query('SELECT * FROM exports WHERE id = $1', [exportId]);
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
        [exportId, 'SHIPMENT_SCHEDULED', 'SHIPPED', user?.id, 'Shipment confirmed and marked as shipped']
      );

      await client.query('COMMIT');

      logger.info('Shipment confirmed', { exportId, userId: user?.id });

      res.json({
        success: true,
        message: 'Shipment confirmed',
        data: { exportId, status: 'SHIPPED' },
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      logger.error('Failed to confirm shipment', { error: error.message });
      this.handleError(error, res);
    } finally {
      client.release();
    }
  };

  public markAsArrived = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    const client = await pool.connect();
    try {
      const { exportId } = req.params;
      const user = req.user;
      const { actualArrivalDate } = req.body;

      if (!exportId) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Export ID is required', 400);
      }

      await client.query('BEGIN');

      const exportResult = await client.query('SELECT * FROM exports WHERE id = $1', [exportId]);
      if (exportResult.rows.length === 0) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Export not found', 404);
      }

      await client.query(
        'UPDATE exports SET status = $1, actual_arrival_date = $2, updated_at = NOW() WHERE id = $3',
        ['ARRIVED', actualArrivalDate || new Date().toISOString(), exportId]
      );

      await client.query(
        `INSERT INTO export_status_history (export_id, old_status, new_status, changed_by, changed_at, notes)
         VALUES ($1, $2, $3, $4, NOW(), $5)`,
        [exportId, 'SHIPPED', 'ARRIVED', user?.id, 'Shipment arrived at destination']
      );

      await client.query('COMMIT');

      logger.info('Shipment marked as arrived', { exportId, userId: user?.id });

      res.json({
        success: true,
        message: 'Shipment marked as arrived',
        data: { exportId, status: 'ARRIVED' },
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      logger.error('Failed to mark shipment as arrived', { error: error.message });
      this.handleError(error, res);
    } finally {
      client.release();
    }
  };

  public confirmDelivery = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    const client = await pool.connect();
    try {
      const { exportId } = req.params;
      const user = req.user;
      const { confirmedBy } = req.body;

      if (!exportId) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Export ID is required', 400);
      }

      await client.query('BEGIN');

      const exportResult = await client.query('SELECT * FROM exports WHERE id = $1', [exportId]);
      if (exportResult.rows.length === 0) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Export not found', 404);
      }

      await client.query(
        'UPDATE exports SET status = $1, delivery_confirmed_by = $2, updated_at = NOW() WHERE id = $3',
        ['DELIVERED', confirmedBy || user?.username, exportId]
      );

      await client.query(
        `INSERT INTO export_status_history (export_id, old_status, new_status, changed_by, changed_at, notes)
         VALUES ($1, $2, $3, $4, NOW(), $5)`,
        [exportId, 'ARRIVED', 'DELIVERED', user?.id, 'Delivery confirmed']
      );

      await client.query('COMMIT');

      logger.info('Delivery confirmed', { exportId, userId: user?.id });

      res.json({
        success: true,
        message: 'Delivery confirmed',
        data: { exportId, status: 'DELIVERED' },
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      logger.error('Failed to confirm delivery', { error: error.message });
      this.handleError(error, res);
    } finally {
      client.release();
    }
  };

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
