
import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { getPool } from '@shared/database/pool';
import { createLogger } from '@shared/logger';
import { ErrorCode, AppError } from '@shared/error-codes';

const logger = createLogger('ECTAContractController');

interface AuthJWTPayload extends JwtPayload {
  id: string;
  username: string;
  organizationId: string;
  role: string;
}

interface RequestWithUser extends Request {
  user?: AuthJWTPayload;
}

export class ContractController {
  public getAllExports = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      
      // ECTA can view all coffee/tea exports for contract approval
      const result = await getPool().query(
        `SELECT e.*, ep.business_name as exporter_name, ep.tin as tin_number
         FROM exports e
         JOIN exporter_profiles ep ON e.exporter_id = ep.exporter_id
         WHERE e.coffee_type IS NOT NULL
         ORDER BY e.created_at DESC`
      );
      
      logger.info('Fetched all coffee exports for ECTA contracts', { 
        userId: user.id, 
        count: result.rows.length 
      });
      
      res.json({ success: true, data: result.rows, count: result.rows.length });
    } catch (error: any) {
      logger.error('Failed to fetch exports', { error: error.message });
      this.handleError(error, res);
    }
  };

  public getPendingContracts = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      
      // ECTA can view all coffee exports pending contract approval
      const result = await getPool().query(
        `SELECT e.*, ep.business_name as exporter_name, ep.tin as tin_number, ep.registration_number as license_number
         FROM exports e
         JOIN exporter_profiles ep ON e.exporter_id = ep.exporter_id
         WHERE e.status IN ($1, $2, $3)
         AND e.coffee_type IS NOT NULL
         ORDER BY e.created_at DESC`,
        ['ECTA_CONTRACT_PENDING', 'QUALITY_CERTIFIED', 'ECTA_QUALITY_APPROVED']
      );
      
      logger.info('Fetched pending contracts for ECTA', { 
        userId: user.id, 
        count: result.rows.length 
      });
      
      res.json({ success: true, data: result.rows, count: result.rows.length });
    } catch (error: any) {
      logger.error('Failed to fetch pending contracts', { error: error.message });
      this.handleError(error, res);
    }
  };

  public reviewContract = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    const client = await getPool().connect();
    try {
      const { exportId } = req.params;
      const user = req.user;
      const { notes } = req.body;

      if (!exportId) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Export ID is required', 400);
      }

      await client.query('BEGIN');

      const exportResult = await client.query('SELECT * FROM exports WHERE export_id = $1', [exportId]);
      if (exportResult.rows.length === 0) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Export not found', 404);
      }

      await client.query(
        `INSERT INTO export_status_history(export_id, old_status, new_status, changed_by, notes)
VALUES($1, $2, $3, $4, $5)`,
        [exportId, 'QUALITY_CERTIFIED', 'CONTRACT_REVIEW', user?.id, notes || 'Contract under review']
      );

      await client.query('COMMIT');

      logger.info('Contract reviewed', { exportId, userId: user?.id });

      res.json({
        success: true,
        message: 'Contract review recorded',
        exportId
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      logger.error('Failed to review contract', { error: error.message });
      this.handleError(error, res);
    } finally {
      client.release();
    }
  };

  public verifyOrigin = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    const client = await getPool().connect();
    try {
      const { exportId } = req.params;
      const user = req.user;
      const { originCertificateNumber } = req.body;

      if (!exportId) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Export ID is required', 400);
      }

      if (!originCertificateNumber) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Origin certificate number is required', 400);
      }

      await client.query('BEGIN');

      const exportResult = await client.query('SELECT * FROM exports WHERE export_id = $1', [exportId]);
      if (exportResult.rows.length === 0) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Export not found', 404);
      }

      await client.query(
        'UPDATE exports SET origin_certificate_number = $1, updated_at = NOW() WHERE export_id = $2',
        [originCertificateNumber, exportId]
      );

      await client.query('COMMIT');

      logger.info('Origin verified', { exportId, originCertificateNumber, userId: user?.id });

      res.json({
        success: true,
        message: 'Origin verified',
        exportId,
        originCertificateNumber
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      logger.error('Failed to verify origin', { error: error.message });
      this.handleError(error, res);
    } finally {
      client.release();
    }
  };

  public approveContract = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    const client = await getPool().connect();
    try {
      const { exportId } = req.params;
      const user = req.user;
      const { contractNumber, originCertificateNumber, notes } = req.body;

      if (!exportId) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Export ID is required', 400);
      }

      await client.query('BEGIN');

      const exportResult = await client.query('SELECT * FROM exports WHERE export_id = $1', [exportId]);
      if (exportResult.rows.length === 0) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Export not found', 404);
      }

      const currentExport = exportResult.rows[0];
      const oldStatus = currentExport.status;

      await client.query(
        `UPDATE exports SET 
          status = $1, 
          contract_approved_by = $2,
          contract_approved_at = NOW(),
          contract_number = $3,
          origin_certificate_number = $4,
          updated_at = NOW() 
        WHERE export_id = $5`,
        ['ECTA_CONTRACT_APPROVED', user?.id, contractNumber, originCertificateNumber, exportId]
      );

      await client.query(
        `INSERT INTO export_status_history(export_id, old_status, new_status, changed_by, notes)
VALUES($1, $2, $3, $4, $5)`,
        [exportId, oldStatus, 'ECTA_CONTRACT_APPROVED', user?.id, notes || 'Contract approved']
      );

      await client.query('COMMIT');

      logger.info('Contract approved', { exportId, userId: user?.id });

      res.json({
        success: true,
        message: 'Contract approved',
        exportId,
        status: 'ECTA_CONTRACT_APPROVED'
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      logger.error('Failed to approve contract', { error: error.message });
      this.handleError(error, res);
    } finally {
      client.release();
    }
  };

  public rejectContract = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    const client = await getPool().connect();
    try {
      const { exportId } = req.params;
      const user = req.user;
      const { reason, category } = req.body;

      if (!exportId) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Export ID is required', 400);
      }

      if (!reason) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Rejection reason is required', 400);
      }

      await client.query('BEGIN');

      const exportResult = await client.query('SELECT * FROM exports WHERE export_id = $1', [exportId]);
      if (exportResult.rows.length === 0) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Export not found', 404);
      }

      const currentExport = exportResult.rows[0];
      const oldStatus = currentExport.status;

      await client.query(
        'UPDATE exports SET status = $1, updated_at = NOW() WHERE export_id = $2',
        ['ECTA_CONTRACT_REJECTED', exportId]
      );

      const rejectionNote = category ? `[${category}] ${reason}` : reason;

      await client.query(
        `INSERT INTO export_status_history(export_id, old_status, new_status, changed_by, notes)
VALUES($1, $2, $3, $4, $5)`,
        [exportId, oldStatus, 'ECTA_CONTRACT_REJECTED', user?.id, rejectionNote]
      );

      await client.query('COMMIT');

      logger.info('Contract rejected', { exportId, reason, category, userId: user?.id });

      res.json({
        success: true,
        message: 'Contract rejected',
        exportId,
        reason,
        status: 'ECTA_CONTRACT_REJECTED'
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      logger.error('Failed to reject contract', { error: error.message });
      this.handleError(error, res);
    } finally {
      client.release();
    }
  };

  public getApprovedContracts = async (_req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const result = await getPool().query(
        'SELECT * FROM exports WHERE status = $1 ORDER BY created_at DESC',
        ['ECTA_CONTRACT_APPROVED']
      );
      res.json({ success: true, data: result.rows, count: result.rows.length });
    } catch (error: any) {
      logger.error('Failed to fetch approved contracts', { error: error.message });
      this.handleError(error, res);
    }
  };

  public getRejectedContracts = async (_req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const result = await getPool().query(
        'SELECT * FROM exports WHERE status = $1 ORDER BY created_at DESC',
        ['CONTRACT_REJECTED']
      );
      res.json({ success: true, data: result.rows, count: result.rows.length });
    } catch (error: any) {
      logger.error('Failed to fetch rejected contracts', { error: error.message });
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
