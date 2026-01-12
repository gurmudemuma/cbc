import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { pool } from '@shared/database/pool';
import { createLogger } from '@shared/logger';
import { ErrorCode, AppError } from '@shared/error-codes';

const logger = createLogger('ESWController');

interface AuthJWTPayload extends JwtPayload {
  id: string;
  username: string;
  organizationId: string;
  role: string;
}

interface RequestWithUser extends Request {
  user?: AuthJWTPayload;
}

export class ESWController {

  /**
   * Submit export to ESW
   * POST /api/esw/submissions
   */
  public submitToESW = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    const client = await pool.connect();
    try {
      const { exportId, notes } = req.body;
      const user = req.user!;

      if (!exportId) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Export ID is required', 400);
      }

      await client.query('BEGIN');

      // Check if export exists
      const exportCheck = await client.query('SELECT * FROM exports WHERE export_id = $1', [exportId]);
      if (exportCheck.rows.length === 0) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Export not found', 404);
      }

      // Generate Reference Number
      const refNum = `ESW-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Create Submission
      const submissionResult = await client.query(
        `INSERT INTO esw_submissions (export_id, esw_reference_number, status, submitted_by, submitted_at)
         VALUES ($1, $2, 'SUBMITTED', $3, NOW())
         RETURNING submission_id, esw_reference_number`,
        [exportId, refNum, user.id]
      );
      const submission = submissionResult.rows[0];

      // Create Agency Approvals for all mandatory agencies
      // We assume esw_agencies table is populated
      const agenciesResult = await client.query('SELECT agency_code FROM esw_agencies WHERE is_active = true');

      for (const agency of agenciesResult.rows) {
        await client.query(
          `INSERT INTO esw_agency_approvals (submission_id, agency_code, status)
           VALUES ($1, $2, 'PENDING')`,
          [submission.submission_id, agency.agency_code]
        );
      }

      await client.query('COMMIT');

      logger.info('ESW Submission created', { submissionId: submission.submission_id, exportId, userId: user.id });

      res.status(201).json({
        success: true,
        message: 'Export submitted to ESW successfully',
        data: submission
      });

    } catch (error: any) {
      await client.query('ROLLBACK');
      logger.error('Failed to submit to ESW', { error: error.message });
      this.handleError(error, res);
    } finally {
      client.release();
    }
  };

  /**
   * Get all ESW submissions
   * GET /api/esw/submissions
   */
  public getSubmissions = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { status, exportId } = req.query;
      let query = `
        SELECT s.*, e.contract_identifier, ep.business_name as exporter_name
        FROM esw_submissions s
        JOIN exports e ON s.export_id = e.export_id
        JOIN exporter_profiles ep ON e.exporter_id = ep.exporter_id
        WHERE 1=1
      `;
      const params: any[] = [];
      let paramCount = 1;

      if (status) {
        query += ` AND s.status = $${paramCount}`;
        params.push(status);
        paramCount++;
      }

      if (exportId) {
        query += ` AND s.export_id = $${paramCount}`;
        params.push(exportId);
        paramCount++;
      }

      query += ` ORDER BY s.submitted_at DESC`;

      const result = await pool.query(query, params);

      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length
      });
    } catch (error: any) {
      logger.error('Failed to get submissions', { error: error.message });
      this.handleError(error, res);
    }
  };

  /**
   * Get ESW submission by ID
   * GET /api/esw/submissions/:submissionId
   */
  public getSubmission = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { submissionId } = req.params;

      const result = await pool.query(
        `SELECT s.*, e.contract_identifier 
         FROM esw_submissions s
         JOIN exports e ON s.export_id = e.export_id
         WHERE s.submission_id = $1`,
        [submissionId]
      );

      if (result.rows.length === 0) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Submission not found', 404);
      }

      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error: any) {
      logger.error('Failed to get submission', { error: error.message });
      this.handleError(error, res);
    }
  };

  /**
   * Get agency approvals for a submission
   * GET /api/esw/submissions/:submissionId/agencies
   */
  public getAgencyApprovals = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { submissionId } = req.params;

      const result = await pool.query(
        `SELECT aa.*, a.agency_name
         FROM esw_agency_approvals aa
         JOIN esw_agencies a ON aa.agency_code = a.agency_code
         WHERE aa.submission_id = $1`,
        [submissionId]
      );

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error: any) {
      logger.error('Failed to get agency approvals', { error: error.message });
      this.handleError(error, res);
    }
  };

  /**
   * Process agency approval/rejection
   * POST /api/esw/submissions/:submissionId/agencies/:agencyCode/approve
   */
  public processAgencyApproval = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    const client = await pool.connect();
    try {
      const { submissionId, agencyCode } = req.params;
      const { status, rejectionReason, notes } = req.body;
      const user = req.user!;

      if (!status || !['APPROVED', 'REJECTED', 'INFO_REQUIRED'].includes(status)) {
        throw new AppError(ErrorCode.INVALID_INPUT, 'Invalid status', 400);
      }

      await client.query('BEGIN');

      // Update agency approval
      const updateResult = await client.query(
        `UPDATE esw_agency_approvals
         SET status = $1, approved_by = $2, approved_at = NOW(), rejection_reason = $3, notes = $4
         WHERE submission_id = $5 AND agency_code = $6
         RETURNING *`,
        [status, user.id, rejectionReason, notes, submissionId, agencyCode]
      );

      if (updateResult.rows.length === 0) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Approval record not found', 404);
      }

      // Check if all agencies have approved
      if (status === 'APPROVED') {
        const remainingResult = await client.query(
          `SELECT COUNT(*) as pending_count 
           FROM esw_agency_approvals 
           WHERE submission_id = $1 AND status != 'APPROVED'`,
          [submissionId]
        );

        if (parseInt(remainingResult.rows[0].pending_count) === 0) {
          // All approved! Update submission status
          await client.query(
            `UPDATE esw_submissions SET status = 'APPROVED', approved_at = NOW() WHERE submission_id = $1`,
            [submissionId]
          );
        }
      } else if (status === 'REJECTED') {
        // One rejection rejects the whole submission
        await client.query(
          `UPDATE esw_submissions SET status = 'REJECTED' WHERE submission_id = $1`,
          [submissionId]
        );
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        message: `Agency ${agencyCode} approval processed`,
        data: updateResult.rows[0]
      });

    } catch (error: any) {
      await client.query('ROLLBACK');
      logger.error('Failed to process agency approval', { error: error.message });
      this.handleError(error, res);
    } finally {
      client.release();
    }
  };

  /**
   * Get ESW submission by export ID
   * GET /api/esw/exports/:exportId/submission
   */
  public getSubmissionByExportId = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { exportId } = req.params;

      const result = await pool.query(
        `SELECT * FROM esw_submissions WHERE export_id = $1`,
        [exportId]
      );

      if (result.rows.length === 0) {
        // It's acceptable to return null/empty if not submitted yet
        res.json({ success: true, data: null });
        return;
      }

      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error: any) {
      logger.error('Failed to get submission by export ID', { error: error.message });
      this.handleError(error, res);
    }
  };

  /**
   * Get all ESW agencies
   * GET /api/esw/agencies
   */
  public getAgencies = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const result = await pool.query('SELECT * FROM esw_agencies ORDER BY agency_name');
      res.json({
        success: true,
        data: result.rows
      });
    } catch (error: any) {
      logger.error('Failed to get agencies', { error: error.message });
      this.handleError(error, res);
    }
  };

  /**
  * Get pending submissions for a specific agency
  * GET /api/esw/agencies/:agencyCode/pending
  */
  public getPendingForAgency = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { agencyCode } = req.params;

      const result = await pool.query(
        `SELECT aa.*, s.esw_reference_number, s.submitted_at
         FROM esw_agency_approvals aa
         JOIN esw_submissions s ON aa.submission_id = s.submission_id
         WHERE aa.agency_code = $1 AND aa.status = 'PENDING'`,
        [agencyCode]
      );

      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length
      });
    } catch (error: any) {
      logger.error('Failed to get pending for agency', { error: error.message });
      this.handleError(error, res);
    }
  };

  /**
   * Get ESW statistics
   * GET /api/esw/stats
   */
  public getStats = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const stats = await pool.query(`
            SELECT 
                COUNT(*) as total_submissions,
                SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approved,
                SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) as rejected,
                SUM(CASE WHEN status = 'SUBMITTED' THEN 1 ELSE 0 END) as pending
            FROM esw_submissions
        `);

      res.json({
        success: true,
        data: stats.rows[0]
      });
    } catch (error: any) {
      logger.error('Failed to get stats', { error: error.message });
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

export default new ESWController();
