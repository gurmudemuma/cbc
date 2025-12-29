import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from 'jsonwebtoken';
<<<<<<< HEAD
import { pool } from '@shared/database/pool';
import { createLogger } from '@shared/logger';
import { ErrorCode, AppError } from '@shared/error-codes';
=======
import { pool } from '../../../shared/database/pool';
import { createLogger } from '../../../shared/logger';
import { ErrorCode, AppError } from '../../../shared/error-codes';
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665

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
   * Get all exports (ECTA can view all)
   */
  public getAllExports = async (_req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const result = await pool.query('SELECT * FROM exports ORDER BY created_at DESC');
      res.json({ success: true, data: result.rows, count: result.rows.length });
    } catch (error: any) {
      logger.error('Failed to fetch exports', { error: error.message });
      this.handleError(error, res);
    }
  };

  /**
   * Get exports pending license approval
   * Status: ECX_VERIFIED (after ECX lot verification)
   */
  public getPendingLicenses = async (_req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const result = await pool.query(
        'SELECT * FROM exports WHERE status = $1 ORDER BY created_at DESC',
        ['ECX_VERIFIED']
      );
<<<<<<< HEAD
      res.json({
        success: true,
        data: result.rows,
=======
      res.json({ 
        success: true, 
        data: result.rows, 
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
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
<<<<<<< HEAD

=======
      
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
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
        'SELECT * FROM exports WHERE id = $1',
        [exportId]
      );

      if (exportResult.rows.length === 0) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Export not found', 404);
      }

      await client.query(
        `UPDATE exports SET export_license_number = $1, license_expiry_date = $2, updated_at = NOW() WHERE id = $3`,
        [exporterLicenseNumber, licenseExpiryDate || null, exportId]
      );

      await client.query('COMMIT');

      logger.info('License reviewed', { exportId, exporterLicenseNumber, userId: user.id });

<<<<<<< HEAD
      res.json({
        success: true,
=======
      res.json({ 
        success: true, 
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
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
<<<<<<< HEAD

=======
      
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
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
        'SELECT * FROM exports WHERE id = $1',
        [exportId]
      );

      if (exportResult.rows.length === 0) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Export not found', 404);
      }

      await client.query(
        `UPDATE exports SET export_license_number = $1, license_expiry_date = $2, updated_at = NOW() WHERE id = $3`,
        [licenseNumber, validUntil, exportId]
      );

      await client.query('COMMIT');

      logger.info('License issued', { exportId, licenseNumber, userId: user.id });

<<<<<<< HEAD
      res.json({
        success: true,
=======
      res.json({ 
        success: true, 
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
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
<<<<<<< HEAD

=======
      
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
      if (!exportId) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Export ID is required', 400);
      }

      const { licenseNumber, notes } = req.body;

      if (!licenseNumber) {
        throw new AppError(
          ErrorCode.MISSING_REQUIRED_FIELD,
          'License number is required for approval',
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

      await client.query(
        'UPDATE exports SET status = $1, export_license_number = $2, updated_at = NOW() WHERE id = $3',
        ['ECTA_LICENSE_APPROVED', licenseNumber, exportId]
      );

      await client.query(
        `INSERT INTO export_status_history (export_id, old_status, new_status, changed_by, changed_at, notes)
         VALUES ($1, $2, $3, $4, NOW(), $5)`,
        [exportId, 'ECX_VERIFIED', 'ECTA_LICENSE_APPROVED', user.id, notes || 'License approved']
      );

      await client.query('COMMIT');

      logger.info('License approved', { exportId, licenseNumber, userId: user.id });

<<<<<<< HEAD
      res.json({
        success: true,
=======
      res.json({ 
        success: true, 
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
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
<<<<<<< HEAD

=======
      
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
      if (!exportId) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Export ID is required', 400);
      }

      const { reason } = req.body;

      if (!reason) {
        throw new AppError(
          ErrorCode.MISSING_REQUIRED_FIELD,
          'Rejection reason is required',
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

      await client.query(
        'UPDATE exports SET status = $1, updated_at = NOW() WHERE id = $2',
<<<<<<< HEAD
        ['ECTA_LICENSE_REJECTED', exportId]
=======
        ['LICENSE_REJECTED', exportId]
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
      );

      await client.query(
        `INSERT INTO export_status_history (export_id, old_status, new_status, changed_by, changed_at, notes)
         VALUES ($1, $2, $3, $4, NOW(), $5)`,
<<<<<<< HEAD
        [exportId, 'ECX_VERIFIED', 'ECTA_LICENSE_REJECTED', user.id, reason]
=======
        [exportId, 'ECX_VERIFIED', 'LICENSE_REJECTED', user.id, reason]
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
      );

      await client.query('COMMIT');

      logger.info('License rejected', { exportId, reason, userId: user.id });

<<<<<<< HEAD
      res.json({
        success: true,
=======
      res.json({ 
        success: true, 
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
        message: 'License rejected',
        exportId,
        newStatus: 'LICENSE_REJECTED',
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
   */
  public getApprovedLicenses = async (_req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const result = await pool.query(
        'SELECT * FROM exports WHERE status = $1 ORDER BY created_at DESC',
        ['ECTA_LICENSE_APPROVED']
      );
<<<<<<< HEAD
      res.json({
        success: true,
        data: result.rows,
=======
      res.json({ 
        success: true, 
        data: result.rows, 
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
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
<<<<<<< HEAD
      res.json({
        success: true,
        data: result.rows,
=======
      res.json({ 
        success: true, 
        data: result.rows, 
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
        count: result.rows.length,
        message: 'Rejected license applications'
      });
    } catch (error: any) {
      logger.error('Failed to fetch rejected licenses', { error: error.message });
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
