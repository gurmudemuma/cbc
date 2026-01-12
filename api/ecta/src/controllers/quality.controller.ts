import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { pool } from '@shared/database/pool';
import { createLogger } from '@shared/logger';
import { ErrorCode, AppError } from '@shared/error-codes';

const logger = createLogger('QualityController');

interface AuthJWTPayload extends JwtPayload {
  id: string;
  username: string;
  organizationId: string;
  role: string;
}

interface RequestWithUser extends Request {
  user?: AuthJWTPayload;
}

export class QualityController {
  public getAllExports = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      
      // ECTA can view all coffee/tea exports for quality certification
      const result = await pool.query(
        `SELECT e.*, ep.business_name as exporter_name, ep.tin as tin_number
         FROM exports e
         JOIN exporter_profiles ep ON e.exporter_id = ep.exporter_id
         WHERE e.coffee_type IS NOT NULL
         ORDER BY e.created_at DESC`
      );
      
      logger.info('Fetched all coffee exports for ECTA quality', { 
        userId: user.id, 
        count: result.rows.length 
      });
      
      res.json({ success: true, data: result.rows });
    } catch (error: any) {
      logger.error('Failed to fetch exports', { error: error.message });
      this.handleError(error, res);
    }
  };

  public getExportById = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { exportId } = req.params;
      if (!exportId) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Export ID is required', 400);
      }
      const result = await pool.query('SELECT * FROM exports WHERE export_id = $1', [exportId]);
      if (result.rows.length === 0) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Export not found', 404);
      }
      res.json({ success: true, data: result.rows[0] });
    } catch (error: any) {
      logger.error('Failed to fetch export', { error: error.message });
      this.handleError(error, res);
    }
  };

  public getPendingExports = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      
      // ECTA can view all coffee exports pending quality inspection
      const result = await pool.query(
        `SELECT e.*, ep.business_name as exporter_name, ep.tin as tin_number, ep.registration_number as license_number
         FROM exports e
         JOIN exporter_profiles ep ON e.exporter_id = ep.exporter_id
         WHERE e.status IN ($1, $2, $3)
         AND e.coffee_type IS NOT NULL
         ORDER BY e.created_at DESC`,
        ['ECTA_QUALITY_PENDING', 'QUALITY_PENDING', 'ECTA_LICENSE_APPROVED']
      );
      
      logger.info('Fetched pending quality inspections for ECTA', { 
        userId: user.id, 
        count: result.rows.length 
      });
      
      res.json({ success: true, data: result.rows, count: result.rows.length });
    } catch (error: any) {
      logger.error('Failed to fetch pending inspections', { error: error.message });
      this.handleError(error, res);
    }
  };

  public issueQualityCertificate = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    const client = await pool.connect();
    try {
      const { exportId } = req.params;
      const user = req.user;

      if (!exportId) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Export ID is required', 400);
      }

      const { qualityGrade, qualityCertNumber, moistureContent, defectCount, cupScore, inspectionNotes, documentCIDs, originCertificateNumber } = req.body;

      if (!qualityGrade) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Quality grade is required', 400);
      }

      await client.query('BEGIN');

      const exportResult = await client.query(
        'SELECT * FROM exports WHERE export_id = $1',
        [exportId]
      );

      if (exportResult.rows.length === 0) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Export not found', 404);
      }

      const exportData = exportResult.rows[0];
      const oldStatus = exportData.status;

      // Accept multiple valid statuses for quality certification
      const validStatuses = ['QUALITY_PENDING', 'ECTA_QUALITY_PENDING', 'ECTA_LICENSE_APPROVED'];
      if (!validStatuses.includes(exportData.status)) {
        throw new AppError(
          ErrorCode.INVALID_STATUS_TRANSITION,
          `Export must be pending quality certification. Current status: ${exportData.status}`,
          400
        );
      }

      // Store ALL quality data in exports table
      await client.query(
        `UPDATE exports SET 
          status = $1, 
          quality_grade = $2,
          moisture_content = $3,
          defect_count = $4,
          cup_score = $5,
          inspection_notes = $6,
          quality_approved_by = $7,
          quality_approved_at = NOW(),
          updated_at = NOW() 
        WHERE export_id = $8`,
        ['ECTA_QUALITY_APPROVED', qualityGrade, moistureContent, defectCount, cupScore, inspectionNotes, user?.id, exportId]
      );

      await client.query(
        `INSERT INTO export_status_history (export_id, old_status, new_status, changed_by, notes)
         VALUES ($1, $2, $3, $4, $5)`,
        [exportId, oldStatus, 'ECTA_QUALITY_APPROVED', user?.id, inspectionNotes || `Quality certified with grade: ${qualityGrade}`]
      );

      if (qualityCertNumber || originCertificateNumber) {
        await client.query(
          `INSERT INTO quality_certificates (
            export_id, certificate_number, quality_grade, issued_by,
            moisture_content, defect_count, cup_score, inspection_notes
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (export_id) DO UPDATE SET 
            certificate_number = EXCLUDED.certificate_number,
            quality_grade = EXCLUDED.quality_grade,
            issued_by = EXCLUDED.issued_by,
            moisture_content = EXCLUDED.moisture_content,
            defect_count = EXCLUDED.defect_count,
            cup_score = EXCLUDED.cup_score,
            inspection_notes = EXCLUDED.inspection_notes,
            updated_at = NOW()`,
          [exportId, qualityCertNumber || originCertificateNumber, qualityGrade, user?.id, moistureContent, defectCount, cupScore, inspectionNotes]
        );
      }

      await client.query('COMMIT');

      logger.info('Quality certificate issued', { exportId, qualityGrade, userId: user?.id, documentCIDs });

      res.json({
        success: true,
        message: 'Quality approved and certificate issued',
        exportId,
        qualityGrade,
        status: 'ECTA_QUALITY_APPROVED'
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      logger.error('Failed to approve quality', { error: error.message });
      this.handleError(error, res);
    } finally {
      client.release();
    }
  };

  public rejectQuality = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    const client = await pool.connect();
    try {
      const { exportId } = req.params;
      const user = req.user;

      if (!exportId) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Export ID is required', 400);
      }

      const { reason, category } = req.body;

      if (!reason) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Rejection reason is required', 400);
      }

      await client.query('BEGIN');

      const exportResult = await client.query(
        'SELECT * FROM exports WHERE export_id = $1',
        [exportId]
      );

      if (exportResult.rows.length === 0) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Export not found', 404);
      }

      const exportData = exportResult.rows[0];
      const oldStatus = exportData.status;

      // Accept multiple valid statuses for quality rejection
      const validStatuses = ['QUALITY_PENDING', 'ECTA_QUALITY_PENDING', 'ECTA_LICENSE_APPROVED'];
      if (!validStatuses.includes(exportData.status)) {
        throw new AppError(
          ErrorCode.INVALID_STATUS_TRANSITION,
          `Export must be pending quality certification. Current status: ${exportData.status}`,
          400
        );
      }

      await client.query(
        'UPDATE exports SET status = $1, updated_at = NOW() WHERE export_id = $2',
        ['ECTA_QUALITY_REJECTED', exportId]
      );

      const rejectionNote = category ? `[${category}] ${reason}` : reason;

      await client.query(
        `INSERT INTO export_status_history (export_id, old_status, new_status, changed_by, notes)
         VALUES ($1, $2, $3, $4, $5)`,
        [exportId, oldStatus, 'ECTA_QUALITY_REJECTED', user?.id, rejectionNote]
      );

      await client.query('COMMIT');

      logger.info('Quality rejected', { exportId, reason, category, userId: user?.id });

      res.json({
        success: true,
        message: 'Quality rejected',
        exportId,
        reason,
        status: 'ECTA_QUALITY_REJECTED'
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      logger.error('Failed to reject quality', { error: error.message });
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
