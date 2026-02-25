import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { pool } from '@shared/database/pool';
import { createLogger } from '@shared/logger';
import { ErrorCode, AppError } from '@shared/error-codes';
import certificateGenerationService from '../services/certificate-generation.service';
import certificateDownloadService from '../services/certificate-download.service';
import certificateVerificationService from '../services/certificate-verification.service';
import notificationService from '../services/notification.service';

const logger = createLogger('ESWController');

interface AuthJWTPayload extends JwtPayload {
  id: string;
  username: string;
  organizationId: string;
  role: string;
  exporterId?: string;  // Added to match exporter-portal auth
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
      const { exportId, exporterInfo, licenseInfo, documents, certificates, notes } = req.body;
      const user = req.user!;

      await client.query('BEGIN');

      let finalExportId = exportId;

      // If no exportId provided, get exporter_id from exporterInfo
      if (!finalExportId && exporterInfo) {
        // Get exporter_id from TIN
        const exporterResult = await client.query(
          'SELECT exporter_id FROM exporter_profiles WHERE tin = $1',
          [exporterInfo.tin]
        );

        if (exporterResult.rows.length === 0) {
          throw new AppError(ErrorCode.NOT_FOUND, 'Exporter not found with provided TIN', 404);
        }

        const exporterId = exporterResult.rows[0].exporter_id;

        // Create a placeholder export record for ESW submission
        const exportResult = await client.query(
          `INSERT INTO exports (
            exporter_id, 
            coffee_type, 
            origin_region, 
            quantity, 
            destination_country,
            buyer_name,
            buyer_country,
            buyer_email,
            export_license_number,
            status,
            created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PENDING', NOW())
          RETURNING export_id`,
          [
            exporterId,
            'Arabica', // Default, can be updated later
            'Ethiopia', // Default
            0, // Placeholder quantity
            'TBD', // To be determined
            'TBD',
            'TBD',
            'tbd@example.com',
            licenseInfo?.licenseNumber || 'PENDING'
          ]
        );

        finalExportId = exportResult.rows[0].export_id;
        logger.info('Created placeholder export for ESW submission', { exportId: finalExportId, exporterId });
      }

      if (!finalExportId) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Export ID or Exporter Info is required', 400);
      }

      // Check if export exists and validate ownership for exporters
      let exportCheck;
      if (user.role === 'exporter' && user.exporterId) {
        exportCheck = await client.query(
          'SELECT * FROM exports WHERE export_id = $1 AND exporter_id = $2',
          [finalExportId, user.exporterId]
        );
        if (exportCheck.rows.length === 0) {
          throw new AppError(ErrorCode.INSUFFICIENT_PERMISSIONS, 'You can only submit your own exports', 403);
        }
      } else {
        exportCheck = await client.query('SELECT * FROM exports WHERE export_id = $1', [finalExportId]);
        if (exportCheck.rows.length === 0) {
          throw new AppError(ErrorCode.NOT_FOUND, 'Export not found', 404);
        }
      }

      // Generate Reference Number
      const refNum = `ESW-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Create Submission
      const submissionResult = await client.query(
        `INSERT INTO esw_submissions (export_id, esw_reference_number, status, submitted_by, submitted_at, notes)
         VALUES ($1, $2, 'SUBMITTED', $3, NOW(), $4)
         RETURNING submission_id, esw_reference_number`,
        [finalExportId, refNum, user.id, notes || null]
      );
      const submission = submissionResult.rows[0];

      // Store documents if provided (for future reference)
      if (documents && documents.length > 0) {
        logger.info('Documents submitted', { submissionId: submission.submission_id, documentCount: documents.length });
        // TODO: Store documents in a separate table if needed
      }

      // Store certificates if provided
      if (certificates && certificates.length > 0) {
        logger.info('Certificates submitted', { submissionId: submission.submission_id, certificateCount: certificates.length });
        // TODO: Store certificates in a separate table if needed
      }

      // Create Agency Approvals for all mandatory agencies
      const agenciesResult = await client.query('SELECT agency_code, agency_name FROM esw_agencies WHERE is_active = true');

      for (const agency of agenciesResult.rows) {
        await client.query(
          `INSERT INTO esw_agency_approvals (submission_id, agency_code, agency_name, status)
           VALUES ($1, $2, $3, 'PENDING')`,
          [submission.submission_id, agency.agency_code, agency.agency_name]
        );
      }

      await client.query('COMMIT');

      logger.info('ESW Submission created', {
        submissionId: submission.submission_id,
        exportId: finalExportId,
        userId: user.id,
        referenceNumber: submission.esw_reference_number
      });

      res.status(201).json({
        success: true,
        message: 'Export submitted to ESW successfully',
        data: {
          submission_id: submission.submission_id,
          esw_reference_number: submission.esw_reference_number,
          eswReferenceNumber: submission.esw_reference_number, // Alias for frontend compatibility
          export_id: finalExportId,
          status: 'SUBMITTED'
        }
      });

    } catch (error: any) {
      await client.query('ROLLBACK');
      logger.error('Failed to submit to ESW', { error: error.message, stack: error.stack });
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
      const user = req.user!;

      let query = `
        SELECT s.*, 
               e.coffee_type, e.origin_region, e.quantity, e.destination_country,
               ep.business_name as exporter_name
        FROM esw_submissions s
        JOIN exports e ON s.export_id = e.export_id
        JOIN exporter_profiles ep ON e.exporter_id = ep.exporter_id
        WHERE 1=1
      `;
      const params: any[] = [];
      let paramCount = 1;

      // Filter by exporter for exporter users (data isolation)
      if (user.role === 'exporter' && (user.exporterId || user.organizationId)) {
        query += ` AND e.exporter_id = $${paramCount}`;
        params.push(user.exporterId || user.organizationId);
        paramCount++;
      }

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

      // Transform snake_case to camelCase for frontend compatibility
      const transformedData = result.rows.map(row => ({
        ...row,
        submissionId: row.submission_id,
        exportId: row.export_id,
        eswReferenceNumber: row.esw_reference_number,
        submittedBy: row.submitted_by,
        submittedAt: row.submitted_at,
        approvedAt: row.approved_at,
        approvedBy: row.approved_by,
        rejectedAt: row.rejected_at,
        rejectionReason: row.rejection_reason,
        additionalInfoRequest: row.additional_info_request,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        coffeeType: row.coffee_type,
        originRegion: row.origin_region,
        destinationCountry: row.destination_country,
        exporterName: row.exporter_name
      }));

      res.json({
        success: true,
        data: transformedData,
        count: transformedData.length
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
        `SELECT s.*, 
                e.export_id, e.coffee_type, e.origin_region, e.quantity, 
                e.destination_country, e.buyer_name, e.buyer_country,
                ep.business_name as exporter_name, ep.tin as exporter_tin
         FROM esw_submissions s
         JOIN exports e ON s.export_id = e.export_id
         LEFT JOIN exporter_profiles ep ON e.exporter_id = ep.exporter_id
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

      const approval = updateResult.rows[0];
      let certificate = null;

      // Generate certificate if approved
      if (status === 'APPROVED') {
        try {
          logger.info('Generating certificate for approval', {
            approvalId: approval.approval_id,
            agencyCode,
            submissionId
          });

          // Pass the client to share the same transaction
          certificate = await certificateGenerationService.generateCertificateWithClient(
            approval.approval_id,
            client
          );

          logger.info('Certificate generated successfully', {
            certificateId: certificate.certificateId,
            certificateNumber: certificate.certificateNumber,
            approvalId: approval.approval_id
          });
        } catch (certError: any) {
          // Log error but don't fail the approval
          logger.error('Failed to generate certificate', {
            error: certError.message,
            approvalId: approval.approval_id,
            stack: certError.stack
          });

          // Rollback and re-throw to ensure transaction consistency
          await client.query('ROLLBACK');
          throw new AppError(
            ErrorCode.INTERNAL_SERVER_ERROR,
            `Approval succeeded but certificate generation failed: ${certError.message}`,
            500
          );
        }
      }

      // Check if all agencies have completed their review (APPROVED or REJECTED)
      const reviewStatusResult = await client.query(
        `SELECT 
          COUNT(*) as total_agencies,
          SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approved_count,
          SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) as rejected_count,
          SUM(CASE WHEN status IN ('PENDING', 'INFO_REQUIRED') THEN 1 ELSE 0 END) as pending_count
         FROM esw_agency_approvals 
         WHERE submission_id = $1`,
        [submissionId]
      );

      const reviewStatus = reviewStatusResult.rows[0];
      const totalAgencies = parseInt(reviewStatus.total_agencies);
      const approvedCount = parseInt(reviewStatus.approved_count);
      const rejectedCount = parseInt(reviewStatus.rejected_count);
      const pendingCount = parseInt(reviewStatus.pending_count);

      // Update submission status based on all agency reviews
      if (pendingCount === 0) {
        // All agencies have completed their review
        if (rejectedCount > 0) {
          // At least one rejection - submission is rejected
          await client.query(
            `UPDATE esw_submissions 
             SET status = 'REJECTED', rejected_at = NOW() 
             WHERE submission_id = $1`,
            [submissionId]
          );
        } else if (approvedCount === totalAgencies) {
          // All agencies approved - submission is approved
          await client.query(
            `UPDATE esw_submissions 
             SET status = 'APPROVED', approved_at = NOW() 
             WHERE submission_id = $1`,
            [submissionId]
          );
        }
      }

      await client.query('COMMIT');

      // Send notifications after successful certificate generation
      if (certificate) {
        try {
          // Get exporter_id from the submission
          const exporterResult = await pool.query(
            `SELECT e.exporter_id 
             FROM esw_submissions s
             JOIN exports e ON s.export_id = e.export_id
             WHERE s.submission_id = $1`,
            [submissionId]
          );

          if (exporterResult.rows.length > 0 && exporterResult.rows[0].exporter_id) {
            const exporterId = exporterResult.rows[0].exporter_id;

            // Create dashboard notification (always succeeds)
            const notification = await notificationService.createDashboardNotification(
              exporterId,
              certificate
            );

            // Send email notification (may fail, but we continue)
            try {
              const emailSent = await notificationService.sendCertificateGeneratedEmail(
                exporterId,
                certificate
              );

              // Update notification record if email was sent
              if (emailSent && notification) {
                await notificationService.markEmailAsSent(notification.notificationId);
              }

              logger.info('Certificate notifications sent', {
                certificateId: certificate.certificateId,
                exporterId,
                emailSent,
                dashboardNotification: !!notification
              });
            } catch (emailError: any) {
              // Log email error but continue - dashboard notification is already created
              logger.error('Failed to send certificate email notification', {
                error: emailError.message,
                certificateId: certificate.certificateId,
                exporterId
              });
            }
          } else {
            logger.warn('Exporter ID not found for notification', { submissionId });
          }
        } catch (notificationError: any) {
          // Log notification error but don't fail the approval
          logger.error('Failed to send certificate notifications', {
            error: notificationError.message,
            certificateId: certificate.certificateId,
            submissionId
          });
        }
      }

      // Prepare response with certificate metadata if generated
      const responseData: any = {
        ...approval,
        approvalId: approval.approval_id,
        submissionId: approval.submission_id,
        agencyCode: approval.agency_code,
        agencyName: approval.agency_name,
        approvedBy: approval.approved_by,
        approvedAt: approval.approved_at,
        rejectionReason: approval.rejection_reason
      };

      if (certificate) {
        responseData.certificate = {
          certificateId: certificate.certificateId,
          certificateNumber: certificate.certificateNumber,
          issuedAt: certificate.issuedAt
        };
      }

      res.json({
        success: true,
        message: `Agency ${agencyCode} approval processed${certificate ? ' and certificate generated' : ''}`,
        data: responseData
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
      const user = req.user!;

      // Validate ownership for exporters
      if (user.role === 'exporter' && user.exporterId) {
        const ownershipCheck = await pool.query(
          'SELECT 1 FROM exports WHERE export_id = $1 AND exporter_id = $2',
          [exportId, user.exporterId]
        );
        if (ownershipCheck.rows.length === 0) {
          throw new AppError(ErrorCode.INSUFFICIENT_PERMISSIONS, 'Access denied', 403);
        }
      }

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
        `SELECT aa.*, 
                s.esw_reference_number, 
                s.submitted_at,
                s.export_id,
                ep.business_name as exporter_name
         FROM esw_agency_approvals aa
         JOIN esw_submissions s ON aa.submission_id = s.submission_id
         LEFT JOIN exports e ON s.export_id = e.export_id
         LEFT JOIN exporter_profiles ep ON e.exporter_id = ep.exporter_id
         WHERE aa.agency_code = $1 AND aa.status = 'PENDING'
         ORDER BY s.submitted_at DESC`,
        [agencyCode]
      );

      // Transform snake_case to camelCase for frontend compatibility
      const transformedData = result.rows.map(row => ({
        ...row,
        submissionId: row.submission_id,
        eswReferenceNumber: row.esw_reference_number,
        submittedAt: row.submitted_at,
        exportId: row.export_id,
        exporterName: row.exporter_name,
        agencyCode: row.agency_code,
        agencyName: row.agency_name,
        approvalId: row.approval_id,
        approvedBy: row.approved_by,
        approvedAt: row.approved_at,
        rejectionReason: row.rejection_reason,
        additionalInfoRequest: row.additional_info_request,
        responseDeadline: row.response_deadline,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      res.json({
        success: true,
        data: transformedData,
        count: transformedData.length
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

      const result = stats.rows[0];

      res.json({
        success: true,
        data: {
          totalSubmissions: parseInt(result.total_submissions) || 0,
          approved: parseInt(result.approved) || 0,
          rejected: parseInt(result.rejected) || 0,
          pending: parseInt(result.pending) || 0,
        }
      });
    } catch (error: any) {
      logger.error('Failed to get stats', { error: error.message });
      this.handleError(error, res);
    }
  };

  /**
   * Get agency-specific statistics
   * GET /api/esw/agencies/:agencyCode/stats
   */
  public getAgencyStats = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { agencyCode } = req.params;

      const stats = await pool.query(`
        SELECT 
          COUNT(*) as total_approvals,
          SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approved,
          SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) as rejected,
          SUM(CASE WHEN status = 'INFO_REQUIRED' THEN 1 ELSE 0 END) as info_required
        FROM esw_agency_approvals
        WHERE agency_code = $1
      `, [agencyCode]);

      const result = stats.rows[0];

      res.json({
        success: true,
        data: {
          agencyCode,
          totalApprovals: parseInt(result.total_approvals) || 0,
          pending: parseInt(result.pending) || 0,
          approved: parseInt(result.approved) || 0,
          rejected: parseInt(result.rejected) || 0,
          infoRequired: parseInt(result.info_required) || 0,
        }
      });
    } catch (error: any) {
      logger.error('Failed to get agency stats', { error: error.message });
      this.handleError(error, res);
    }
  };

  /**
   * Get certificate metadata
   * GET /api/esw/certificates/:certificateId
   */
  public getCertificate = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { certificateId } = req.params;
      const user = req.user!;

      const certificate = await certificateDownloadService.getCertificateMetadata(
        certificateId,
        user.id,
        user.role,
        user.exporterId
      );

      res.json({
        success: true,
        data: certificate
      });
    } catch (error: any) {
      logger.error('Failed to get certificate', { error: error.message });
      this.handleError(error, res);
    }
  };

  /**
   * Download certificate PDF
   * GET /api/esw/certificates/:certificateId/download
   */
  public downloadCertificate = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { certificateId } = req.params;
      const user = req.user!;

      const pdfBuffer = await certificateDownloadService.downloadCertificate(
        certificateId,
        user.id,
        user.role,
        user.exporterId
      );

      // Get certificate metadata for filename
      const certificate = await certificateDownloadService.getCertificateMetadata(
        certificateId,
        user.id,
        user.role,
        user.exporterId
      );

      // Set appropriate headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${certificate.certificateNumber}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      res.send(pdfBuffer);
    } catch (error: any) {
      logger.error('Failed to download certificate', { error: error.message });
      this.handleError(error, res);
    }
  };

  /**
   * Get all certificates for a submission
   * GET /api/esw/submissions/:submissionId/certificates
   */
  public getSubmissionCertificates = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { submissionId } = req.params;
      const user = req.user!;

      const certificates = await certificateDownloadService.getCertificatesBySubmission(
        submissionId,
        user.id,
        user.role,
        user.exporterId
      );

      res.json({
        success: true,
        data: certificates,
        count: certificates.length
      });
    } catch (error: any) {
      logger.error('Failed to get submission certificates', { error: error.message });
      this.handleError(error, res);
    }
  };

  /**
   * Verify certificate by certificate number (PUBLIC - no authentication required)
   * GET /api/esw/certificates/verify/:certificateNumber
   */
  public verifyCertificate = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { certificateNumber } = req.params;

      // Get IP address and user agent for audit logging
      const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
      const userAgent = req.get('user-agent') || 'unknown';

      // Verify certificate
      const verificationResult = await certificateVerificationService.verifyCertificate(certificateNumber);

      // Log verification attempt
      await certificateVerificationService.logVerificationAttempt(
        certificateNumber,
        ipAddress,
        userAgent,
        {
          status: verificationResult.status,
          isValid: verificationResult.isValid
        }
      );

      res.json({
        success: true,
        data: verificationResult
      });
    } catch (error: any) {
      logger.error('Failed to verify certificate', { error: error.message });
      this.handleError(error, res);
    }
  };

  /**
   * Get user's agencies
   * GET /api/esw/agencies/my/list
   */
  public getMyAgencies = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;

      // First, try to get explicit agency assignments from agency_users table
      const explicitResult = await pool.query(
        `SELECT 
          au.id,
          au.agency_code,
          ea.agency_name,
          au.organization_id,
          au.role,
          au.permissions,
          au.is_active,
          au.assigned_at
        FROM agency_users au
        JOIN esw_agencies ea ON au.agency_code = ea.agency_code
        WHERE au.user_id = $1 AND au.is_active = true
        ORDER BY ea.agency_name`,
        [user.id]
      );

      if (explicitResult.rows.length > 0) {
        res.json({
          success: true,
          data: explicitResult.rows.map(row => ({
            id: row.id,
            code: row.agency_code,
            name: row.agency_name,
            organizationId: row.organization_id,
            role: row.role,
            permissions: row.permissions || [],
            isActive: row.is_active,
            assignedAt: row.assigned_at
          })),
          count: explicitResult.rows.length
        });
        return;
      }

      // If no explicit assignments, check if user's organization_id matches an agency_code
      const userResult = await pool.query(
        `SELECT id, organization_id, role FROM users WHERE id = $1 AND is_active = true`,
        [user.id]
      );

      if (userResult.rows.length === 0 || !userResult.rows[0].organization_id) {
        res.json({
          success: true,
          data: [],
          count: 0
        });
        return;
      }

      const userOrgId = userResult.rows[0].organization_id;
      const userRole = userResult.rows[0].role;

      // Check if user's organization_id matches an agency_code
      const agencyResult = await pool.query(
        `SELECT 
          agency_id as id,
          agency_code,
          agency_name,
          is_active
        FROM esw_agencies
        WHERE agency_code = $1 AND is_active = true`,
        [userOrgId]
      );

      if (agencyResult.rows.length === 0) {
        res.json({
          success: true,
          data: [],
          count: 0
        });
        return;
      }

      // Return implicit agency assignment
      res.json({
        success: true,
        data: agencyResult.rows.map(row => ({
          id: row.id,
          code: row.agency_code,
          name: row.agency_name,
          organizationId: userOrgId,
          role: userRole || 'APPROVER',
          permissions: ['approve_submissions', 'reject_submissions', 'view_submissions', 'add_notes'],
          isActive: row.is_active,
          assignedAt: new Date()
        })),
        count: agencyResult.rows.length
      });
    } catch (error: any) {
      logger.error('Failed to get user agencies', { error: error.message });
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
