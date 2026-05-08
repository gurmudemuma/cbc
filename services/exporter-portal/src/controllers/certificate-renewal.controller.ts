/**
 * Exporter Portal - Universal Certificate Renewal Controller
 * Allows exporters to request renewals for any certificate type
 */

import { Request, Response, NextFunction } from 'express';
import { getPool } from '@shared/database/pool';
import { createLogger } from '@shared/logger';

const pool = getPool();
const logger = createLogger('ExporterCertificateRenewalController');

export class ExporterCertificateRenewalController {
  /**
   * Submit a renewal request
   * POST /api/exporter/certificate/renewal/request
   */
  public submitRenewalRequest = async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const {
        certificateType,
        certificateId,
        entityName,
        currentCertificateNumber,
        currentIssueDate,
        currentExpiryDate,
        newCertificateNumber,
        requestedExpiryDate,
        renewalReason,
        supportingDocuments,
      } = req.body;

      const exporterId = (req as any).user?.organizationId; // organizationId contains the exporter_id for exporters
      const requestedBy = (req as any).user?.username || (req as any).user?.email;

      if (!exporterId) {
        res.status(401).json({
          success: false,
          message: 'Exporter authentication required',
        });
        return;
      }

      // Validate required fields
      if (!certificateType || !certificateId || !currentCertificateNumber || !currentExpiryDate || !requestedExpiryDate) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields',
        });
        return;
      }

      // Validate certificate type
      const validTypes = ['TASTER_PROFICIENCY', 'LABORATORY_CERTIFICATION', 'COMPETENCE_CERTIFICATE', 'EXPORT_LICENSE'];
      if (!validTypes.includes(certificateType)) {
        res.status(400).json({
          success: false,
          message: 'Invalid certificate type',
        });
        return;
      }

      // Verify the certificate belongs to this exporter
      let verificationQuery = '';
      switch (certificateType) {
        case 'TASTER_PROFICIENCY':
          verificationQuery = `SELECT exporter_id FROM coffee_tasters WHERE taster_id = $1`;
          break;
        case 'LABORATORY_CERTIFICATION':
          verificationQuery = `SELECT exporter_id FROM coffee_laboratories WHERE laboratory_id = $1`;
          break;
        case 'COMPETENCE_CERTIFICATE':
          verificationQuery = `SELECT exporter_id FROM competence_certificates WHERE certificate_id = $1`;
          break;
        case 'EXPORT_LICENSE':
          verificationQuery = `SELECT exporter_id FROM export_licenses WHERE license_id = $1`;
          break;
      }

      const verificationResult = await pool.query(verificationQuery, [certificateId]);

      if (verificationResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Certificate not found',
        });
        return;
      }

      if (verificationResult.rows[0].exporter_id !== exporterId) {
        res.status(403).json({
          success: false,
          message: 'You do not have permission to renew this certificate',
        });
        return;
      }

      // Check if there's already a pending request for this certificate
      const existingRequest = await pool.query(
        `SELECT request_id FROM certificate_renewal_requests 
         WHERE certificate_id = $1 AND certificate_type = $2 AND status = 'PENDING'`,
        [certificateId, certificateType]
      );

      if (existingRequest.rows.length > 0) {
        res.status(400).json({
          success: false,
          message: 'A renewal request for this certificate is already pending',
        });
        return;
      }

      // Create the renewal request
      const result = await pool.query(
        `INSERT INTO certificate_renewal_requests (
          exporter_id,
          certificate_type,
          certificate_id,
          entity_name,
          current_certificate_number,
          current_issue_date,
          current_expiry_date,
          new_certificate_number,
          requested_expiry_date,
          renewal_reason,
          supporting_documents,
          requested_by,
          status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'PENDING')
        RETURNING request_id, requested_at`,
        [
          exporterId,
          certificateType,
          certificateId,
          entityName,
          currentCertificateNumber,
          currentIssueDate || null,
          currentExpiryDate,
          newCertificateNumber || null,
          requestedExpiryDate,
          renewalReason || null,
          supportingDocuments ? JSON.stringify(supportingDocuments) : null,
          requestedBy,
        ]
      );

      logger.info(`Certificate renewal request submitted: ${result.rows[0].request_id}`, {
        exporterId,
        certificateType,
        certificateId,
      });

      res.status(201).json({
        success: true,
        message: 'Renewal request submitted successfully',
        data: {
          requestId: result.rows[0].request_id,
          requestedAt: result.rows[0].requested_at,
        },
      });
    } catch (error: any) {
      logger.error('Error submitting renewal request:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit renewal request',
        error: error.message,
      });
    }
  };

  /**
   * Get exporter's renewal requests
   * GET /api/exporter/certificate/renewal/my-requests?status=PENDING
   */
  public getMyRenewalRequests = async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const exporterId = (req as any).user?.organizationId; // organizationId contains the exporter_id for exporters
      const { status } = req.query;

      if (!exporterId) {
        res.status(401).json({
          success: false,
          message: 'Exporter authentication required',
        });
        return;
      }

      let query = `
        SELECT * FROM certificate_renewal_requests
        WHERE exporter_id = $1
      `;

      const params: any[] = [exporterId];

      if (status) {
        query += ` AND status = $2`;
        params.push(status);
      }

      query += ` ORDER BY requested_at DESC`;

      const result = await pool.query(query, params);

      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length,
      });
    } catch (error: any) {
      logger.error('Error fetching renewal requests:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch renewal requests',
        error: error.message,
      });
    }
  };

  /**
   * Cancel a pending renewal request
   * POST /api/exporter/certificate/renewal/:requestId/cancel
   */
  public cancelRenewalRequest = async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const { requestId } = req.params;
      const exporterId = (req as any).user?.organizationId; // organizationId contains the exporter_id for exporters

      if (!exporterId) {
        res.status(401).json({
          success: false,
          message: 'Exporter authentication required',
        });
        return;
      }

      const result = await pool.query(
        `UPDATE certificate_renewal_requests 
         SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP
         WHERE request_id = $1 AND exporter_id = $2 AND status = 'PENDING'
         RETURNING *`,
        [requestId, exporterId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Renewal request not found or cannot be cancelled',
        });
        return;
      }

      logger.info(`Renewal request cancelled: ${requestId}`, { exporterId });

      res.json({
        success: true,
        message: 'Renewal request cancelled',
        data: result.rows[0],
      });
    } catch (error: any) {
      logger.error('Error cancelling renewal request:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel renewal request',
        error: error.message,
      });
    }
  };
}

export default ExporterCertificateRenewalController;
