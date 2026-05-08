import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { pool } from '@shared/database/pool';
import { createLogger } from '@shared/logger';
import { ErrorCode, AppError } from '@shared/error-codes';

const logger = createLogger('ECTALicenseController');

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
 */
export class LicenseController {
  /**
   * Get all exports (ECTA can view all coffee/tea exports)
   * ECTA is a regulatory agency with jurisdiction over coffee and tea
   */
  public getAllExports = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      
      // ECTA can view all coffee/tea exports regardless of organization
      // This is because ECTA is a regulatory agency with jurisdiction over coffee
      const result = await pool.query(
        `SELECT e.*, ep.business_name as exporter_name, ep.tin as tin_number
         FROM exports e
         JOIN exporter_profiles ep ON e.exporter_id = ep.exporter_id
         WHERE e.coffee_type IS NOT NULL
         ORDER BY e.created_at DESC`
      );
      
      logger.info('Fetched all coffee exports for ECTA', { 
        userId: user.id, 
        count: result.rows.length 
      });
      
      res.json({ success: true, data: result.rows, count: result.rows.length });
    } catch (error: any) {
      logger.error('Failed to fetch exports', { error: error.message });
      this.handleError(error, res);
    }
  };

  /**
   * Get exports pending license approval
   * Status: ECTA_LICENSE_PENDING (after ECX lot verification)
   * ECTA views all coffee exports pending license approval
   */
  public getPendingLicenses = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      
      // ECTA can view all coffee exports pending license approval
      const result = await pool.query(
        `SELECT e.*, ep.business_name as exporter_name, ep.tin as tin_number, ep.registration_number as license_number
         FROM exports e
         JOIN exporter_profiles ep ON e.exporter_id = ep.exporter_id
         WHERE e.status IN ($1, $2)
         AND e.coffee_type IS NOT NULL
         ORDER BY e.created_at DESC`,
        ['ECTA_LICENSE_PENDING', 'ECX_VERIFIED']
      );
      
      logger.info('Fetched pending licenses for ECTA', { 
        userId: user.id, 
        count: result.rows.length 
      });
      
      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length,
        message: 'Exports pending ECTA license approval'
      });
    } catch (error: any) {
      logger.error('Failed to fetch pending licenses', { error: error.message });
      this.handleError(error, res);
    }
  };

  /**
   * Review license application
   */
  public reviewLicense = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    const client = await pool.connect();
    try {
      const { exportId } = req.params;
      const user = req.user!;

      if (!exportId) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Export ID is required', 400);
      }

      const { exporterLicenseNumber, licenseExpiryDate, notes } = req.body;

      if (!exporterLicenseNumber) {
        throw new AppError(
          ErrorCode.MISSING_REQUIRED_FIELD,
          'Exporter license number is required',
          400
        );
      }

      await client.query('BEGIN');

      const exportResult = await client.query(
        'SELECT * FROM exports WHERE export_id = $1',
        [exportId]
      );

      if (exportResult.rows.length === 0) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Export not found', 404);
      }

      await client.query(
        `UPDATE exports SET export_license_number = $1, license_expiry_date = $2, updated_at = NOW() WHERE export_id = $3`,
        [exporterLicenseNumber, licenseExpiryDate || null, exportId]
      );

      await client.query('COMMIT');

      logger.info('License reviewed', { exportId, exporterLicenseNumber, userId: user.id, notes });

      res.json({
        success: true,
        message: 'License review recorded. Awaiting approval decision.',
        exportId,
        exporterLicenseNumber
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      logger.error('Failed to review license', { error: error.message });
      this.handleError(error, res);
    } finally {
      client.release();
    }
  };

  /**
   * Issue export license
   */
  public issueLicense = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    const client = await pool.connect();
    try {
      const { exportId } = req.params;
      const user = req.user!;

      if (!exportId) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Export ID is required', 400);
      }

      const { licenseNumber, validUntil, notes } = req.body;

      if (!licenseNumber || !validUntil) {
        throw new AppError(
          ErrorCode.MISSING_REQUIRED_FIELD,
          'License number and validity date are required',
          400
        );
      }

      await client.query('BEGIN');

      const exportResult = await client.query(
        'SELECT * FROM exports WHERE export_id = $1',
        [exportId]
      );

      if (exportResult.rows.length === 0) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Export not found', 404);
      }

      await client.query(
        `UPDATE exports SET export_license_number = $1, license_expiry_date = $2, updated_at = NOW() WHERE export_id = $3`,
        [licenseNumber, validUntil, exportId]
      );

      await client.query('COMMIT');

      logger.info('License issued', { exportId, licenseNumber, userId: user.id, notes });

      res.json({
        success: true,
        message: 'Export license issued successfully',
        exportId,
        licenseNumber,
        validUntil
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      logger.error('Failed to issue license', { error: error.message });
      this.handleError(error, res);
    } finally {
      client.release();
    }
  };

  /**
   * Approve license
   */
  public approveLicense = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    const client = await pool.connect();
    try {
      const { exportId } = req.params;
      const user = req.user!;

      if (!exportId) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Export ID is required', 400);
      }

      const { licenseNumber, notes, validUntil } = req.body;

      if (!licenseNumber) {
        throw new AppError(
          ErrorCode.MISSING_REQUIRED_FIELD,
          'License number is required for approval',
          400
        );
      }

      await client.query('BEGIN');

      const exportResult = await client.query(
        'SELECT * FROM exports WHERE export_id = $1',
        [exportId]
      );

      if (exportResult.rows.length === 0) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Export not found', 404);
      }

      const currentExport = exportResult.rows[0];
      const oldStatus = currentExport.status;

      await client.query(
        `UPDATE exports SET 
          status = $1, 
          export_license_number = $2, 
          license_expiry_date = $3,
          license_approved_by = $4,
          license_approved_at = NOW(),
          license_approval_notes = $5,
          updated_at = NOW() 
        WHERE export_id = $6`,
        ['ECTA_LICENSE_APPROVED', licenseNumber, validUntil, user.id, notes, exportId]
      );

      await client.query(
        `INSERT INTO export_status_history (export_id, old_status, new_status, changed_by, notes)
         VALUES ($1, $2, $3, $4, $5)`,
        [exportId, oldStatus, 'ECTA_LICENSE_APPROVED', user.id, notes || 'License approved']
      );

      await client.query('COMMIT');

      logger.info('License approved', { exportId, licenseNumber, userId: user.id });

      res.json({
        success: true,
        message: 'License approved. Export can proceed to quality inspection.',
        exportId,
        licenseNumber,
        newStatus: 'ECTA_LICENSE_APPROVED'
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      logger.error('Failed to approve license', { error: error.message });
      this.handleError(error, res);
    } finally {
      client.release();
    }
  };

  /**
   * Reject license
   */
  public rejectLicense = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    const client = await pool.connect();
    try {
      const { exportId } = req.params;
      const user = req.user!;

      if (!exportId) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Export ID is required', 400);
      }

      const { reason, category } = req.body;

      if (!reason) {
        throw new AppError(
          ErrorCode.MISSING_REQUIRED_FIELD,
          'Rejection reason is required',
          400
        );
      }

      await client.query('BEGIN');

      const exportResult = await client.query(
        'SELECT * FROM exports WHERE export_id = $1',
        [exportId]
      );

      if (exportResult.rows.length === 0) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Export not found', 404);
      }

      const currentExport = exportResult.rows[0];
      const oldStatus = currentExport.status;

      await client.query(
        'UPDATE exports SET status = $1, updated_at = NOW() WHERE export_id = $2',
        ['ECTA_LICENSE_REJECTED', exportId]
      );

      const rejectionNote = category ? `[${category}] ${reason}` : reason;

      await client.query(
        `INSERT INTO export_status_history (export_id, old_status, new_status, changed_by, notes)
         VALUES ($1, $2, $3, $4, $5)`,
        [exportId, oldStatus, 'ECTA_LICENSE_REJECTED', user.id, rejectionNote]
      );

      await client.query('COMMIT');

      logger.info('License rejected', { exportId, reason, category, userId: user.id });

      res.json({
        success: true,
        message: 'License rejected',
        exportId,
        newStatus: 'ECTA_LICENSE_REJECTED',
        reason
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      logger.error('Failed to reject license', { error: error.message });
      this.handleError(error, res);
    } finally {
      client.release();
    }
  };

  /**
   * Get approved licenses
   * ECTA views all approved coffee export licenses
   */
  public getApprovedLicenses = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      
      const result = await pool.query(
        `SELECT e.*, ep.business_name as exporter_name, ep.tin as tin_number, ep.registration_number as license_number
         FROM exports e
         JOIN exporter_profiles ep ON e.exporter_id = ep.exporter_id
         WHERE e.status = $1
         AND e.coffee_type IS NOT NULL
         ORDER BY e.created_at DESC`,
        ['ECTA_LICENSE_APPROVED']
      );
      
      logger.info('Fetched approved licenses for ECTA', { 
        userId: user.id, 
        count: result.rows.length 
      });
      
      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length,
        message: 'Exports with approved licenses'
      });
    } catch (error: any) {
      logger.error('Failed to fetch approved licenses', { error: error.message });
      this.handleError(error, res);
    }
  };

  /**
   * Get rejected licenses
   */
  public getRejectedLicenses = async (_req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const result = await pool.query(
        'SELECT * FROM exports WHERE status = $1 ORDER BY created_at DESC',
        ['LICENSE_REJECTED']
      );
      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length,
        message: 'Rejected license applications'
      });
    } catch (error: any) {
      logger.error('Failed to fetch rejected licenses', { error: error.message });
      this.handleError(error, res);
    }
  };

  /**
   * Get export status history
   */
  public getExportHistory = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { exportId } = req.params;

      if (!exportId) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Export ID is required', 400);
      }

      const result = await pool.query(
        `SELECT 
          history_id,
          export_id,
          old_status,
          new_status,
          changed_by,
          organization,
          notes,
          created_at
        FROM export_status_history 
        WHERE export_id = $1 
        ORDER BY created_at DESC`,
        [exportId]
      );

      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length
      });
    } catch (error: any) {
      logger.error('Failed to fetch export history', { error: error.message });
      this.handleError(error, res);
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
