/**
 * ECTA Universal Certificate Renewal Controller
 * Handles approval and processing of ALL certificate renewals
 */

import { Request, Response, NextFunction } from 'express';
import { getPool } from '@shared/database/pool';
import { createLogger } from '@shared/logger';

const pool = getPool();
const logger = createLogger('CertificateRenewalController');

export class ECTACertificateRenewalController {
  /**
   * Get all pending renewal requests (all types or filtered by type)
   * GET /services/ecta/certificate/renewal/pending?type=TASTER_PROFICIENCY
   */
  public getPendingRenewals = async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const { type } = req.query;

      let query = `
        SELECT 
          crr.*,
          ep.business_name as exporter_name,
          ep.email as exporter_email,
          ep.phone as exporter_phone
        FROM certificate_renewal_requests crr
        INNER JOIN exporter_profiles ep ON crr.exporter_id = ep.exporter_id
        WHERE crr.status = 'PENDING'
      `;

      const params: any[] = [];
      if (type) {
        query += ` AND crr.certificate_type = $1`;
        params.push(type);
      }

      query += ` ORDER BY crr.requested_at ASC`;

      const result = await pool.query(query, params);

      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length,
      });
    } catch (error: any) {
      logger.error('Error fetching pending renewals:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch pending renewals',
        error: error.message,
      });
    }
  };

  /**
   * Get renewal history (all statuses)
   * GET /services/ecta/certificate/renewal/history?type=TASTER_PROFICIENCY&status=APPROVED
   */
  public getRenewalHistory = async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const { type, status, limit = '50' } = req.query;

      let query = `
        SELECT 
          crr.*,
          ep.business_name as exporter_name,
          ep.email as exporter_email
        FROM certificate_renewal_requests crr
        INNER JOIN exporter_profiles ep ON crr.exporter_id = ep.exporter_id
        WHERE 1=1
      `;

      const params: any[] = [];
      let paramCount = 0;

      if (type) {
        paramCount++;
        query += ` AND crr.certificate_type = $${paramCount}`;
        params.push(type);
      }

      if (status) {
        paramCount++;
        query += ` AND crr.status = $${paramCount}`;
        params.push(status);
      }

      query += ` ORDER BY crr.requested_at DESC LIMIT $${paramCount + 1}`;
      params.push(parseInt(limit as string));

      const result = await pool.query(query, params);

      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length,
      });
    } catch (error: any) {
      logger.error('Error fetching renewal history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch renewal history',
        error: error.message,
      });
    }
  };

  /**
   * Approve a renewal request
   * POST /services/ecta/certificate/renewal/:requestId/approve
   */
  public approveRenewal = async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    const client = await pool.connect();
    
    try {
      const { requestId } = req.params;
      const { 
        finalCertificateNumber, 
        finalIssueDate, 
        finalExpiryDate, 
        approvalNotes 
      } = req.body;
      const approvedBy = (req as any).user?.username || 'ECTA Admin';

      await client.query('BEGIN');

      // Get the renewal request
      const requestResult = await client.query(
        `SELECT * FROM certificate_renewal_requests WHERE request_id = $1`,
        [requestId]
      );

      if (requestResult.rows.length === 0) {
        await client.query('ROLLBACK');
        res.status(404).json({
          success: false,
          message: 'Renewal request not found',
        });
        return;
      }

      const request = requestResult.rows[0];

      if (request.status !== 'PENDING') {
        await client.query('ROLLBACK');
        res.status(400).json({
          success: false,
          message: `Cannot approve request with status: ${request.status}`,
        });
        return;
      }

      // Update the renewal request
      await client.query(
        `UPDATE certificate_renewal_requests 
         SET status = 'APPROVED',
             approved_by = $1,
             approved_at = CURRENT_TIMESTAMP,
             approval_notes = $2,
             final_certificate_number = $3,
             final_issue_date = $4,
             final_expiry_date = $5,
             updated_at = CURRENT_TIMESTAMP
         WHERE request_id = $6`,
        [
          approvedBy,
          approvalNotes,
          finalCertificateNumber || request.new_certificate_number || request.current_certificate_number,
          finalIssueDate || request.requested_issue_date || new Date(),
          finalExpiryDate || request.requested_expiry_date,
          requestId,
        ]
      );

      // Update the actual certificate based on type
      const certNumber = finalCertificateNumber || request.new_certificate_number || request.current_certificate_number;
      const issueDate = finalIssueDate || request.requested_issue_date || new Date();
      const expiryDate = finalExpiryDate || request.requested_expiry_date;

      let pdfGenerated = false;
      let pdfPath: string | null = null;

      switch (request.certificate_type) {
        case 'TASTER_PROFICIENCY':
          await client.query(
            `UPDATE coffee_tasters 
             SET proficiency_certificate_number = $1,
                 certificate_issue_date = $2,
                 certificate_expiry_date = $3,
                 updated_at = CURRENT_TIMESTAMP
             WHERE taster_id = $4`,
            [certNumber, issueDate, expiryDate, request.certificate_id]
          );
          
          // Generate PDF for taster certificate
          try {
            const { default: pdfService } = await import('../services/pdf-generation.service');
            
            const tasterData = await client.query(
              `SELECT ct.*, ep.business_name, ep.business_type, ep.tin, ep.email, ep.phone 
               FROM coffee_tasters ct
               INNER JOIN exporter_profiles ep ON ct.exporter_id = ep.exporter_id
               WHERE ct.taster_id = $1`,
              [request.certificate_id]
            );
            
            if (tasterData.rows.length > 0) {
              const taster = tasterData.rows[0];
              const pdfResult = await pdfService.generateTasterProficiencyPDF(
                request.certificate_id,
                {
                  certificateNumber: certNumber,
                  issuedDate: new Date(issueDate),
                  expiryDate: new Date(expiryDate),
                  tasterName: taster.full_name,
                  dateOfBirth: taster.date_of_birth,
                  nationalId: taster.national_id,
                  qualificationLevel: taster.qualification_level,
                  businessName: taster.business_name,
                  businessType: taster.business_type,
                  tin: taster.tin,
                  employmentStartDate: new Date(taster.employment_start_date),
                  isExclusiveEmployee: taster.is_exclusive_employee,
                  email: taster.email,
                  phone: taster.phone,
                  approvedBy,
                  approvedAt: new Date()
                }
              );
              
              // Update taster with PDF path
              await client.query(
                `UPDATE coffee_tasters 
                 SET pdf_path = $1, pdf_generated_at = CURRENT_TIMESTAMP
                 WHERE taster_id = $2`,
                [pdfResult.filePath, request.certificate_id]
              );
              
              pdfGenerated = true;
              pdfPath = pdfResult.filePath;
              logger.info('Taster proficiency certificate PDF generated successfully', {
                tasterId: request.certificate_id,
                pdfPath: pdfResult.filePath
              });
            }
          } catch (pdfError: any) {
            logger.error('Failed to generate taster certificate PDF', { error: pdfError.message });
            // Don't fail the approval if PDF generation fails
          }
          break;

        case 'LABORATORY_CERTIFICATION':
          await client.query(
            `UPDATE coffee_laboratories 
             SET certification_number = $1,
                 certified_date = $2,
                 expiry_date = $3,
                 updated_at = CURRENT_TIMESTAMP
             WHERE laboratory_id = $4`,
            [certNumber, issueDate, expiryDate, request.certificate_id]
          );
          
          // Generate PDF for laboratory certificate
          try {
            const { default: pdfService } = await import('../services/pdf-generation.service');
            
            const labData = await client.query(
              `SELECT cl.*, ep.business_name, ep.business_type, ep.tin, ep.email, ep.phone 
               FROM coffee_laboratories cl
               INNER JOIN exporter_profiles ep ON cl.exporter_id = ep.exporter_id
               WHERE cl.laboratory_id = $1`,
              [request.certificate_id]
            );
            
            if (labData.rows.length > 0) {
              const lab = labData.rows[0];
              const pdfResult = await pdfService.generateLaboratoryCertificationPDF(
                request.certificate_id,
                {
                  certificationNumber: certNumber,
                  certifiedDate: new Date(issueDate),
                  expiryDate: new Date(expiryDate),
                  laboratoryName: lab.laboratory_name,
                  address: lab.address,
                  city: lab.city,
                  region: lab.region,
                  businessName: lab.business_name,
                  businessType: lab.business_type,
                  tin: lab.tin,
                  hasRoastingFacility: lab.has_roasting_facility,
                  hasCuppingRoom: lab.has_cupping_room,
                  hasSampleStorage: lab.has_sample_storage,
                  lastInspectionDate: lab.last_inspection_date,
                  inspectedBy: lab.inspected_by,
                  email: lab.email,
                  phone: lab.phone,
                  approvedBy,
                  approvedAt: new Date()
                }
              );
              
              // Update laboratory with PDF path
              await client.query(
                `UPDATE coffee_laboratories 
                 SET pdf_path = $1, pdf_generated_at = CURRENT_TIMESTAMP
                 WHERE laboratory_id = $2`,
                [pdfResult.filePath, request.certificate_id]
              );
              
              pdfGenerated = true;
              pdfPath = pdfResult.filePath;
              logger.info('Laboratory certification PDF generated successfully', {
                laboratoryId: request.certificate_id,
                pdfPath: pdfResult.filePath
              });
            }
          } catch (pdfError: any) {
            logger.error('Failed to generate laboratory certificate PDF', { error: pdfError.message });
            // Don't fail the approval if PDF generation fails
          }
          break;

        case 'COMPETENCE_CERTIFICATE':
          await client.query(
            `UPDATE competence_certificates 
             SET certificate_number = $1,
                 issued_date = $2,
                 expiry_date = $3,
                 updated_at = CURRENT_TIMESTAMP
             WHERE certificate_id = $4`,
            [certNumber, issueDate, expiryDate, request.certificate_id]
          );
          
          // Generate PDF for competence certificate
          try {
            const { default: pdfService } = await import('../services/pdf-generation.service');
            
            const certData = await client.query(
              `SELECT 
                cc.*,
                ep.business_name,
                ep.business_type,
                ep.tin,
                ep.registration_number,
                ep.city as exporter_city,
                ep.region as exporter_region,
                ep.office_address,
                ep.contact_person,
                ep.email,
                ep.phone,
                cl.laboratory_name,
                cl.city as laboratory_city,
                cl.region as laboratory_region,
                cl.address as laboratory_address,
                cl.certification_number as laboratory_cert_number,
                ct.full_name as taster_name,
                ct.proficiency_certificate_number as taster_cert_number,
                ct.qualification as taster_qualification
              FROM competence_certificates cc
              INNER JOIN exporter_profiles ep ON cc.exporter_id = ep.exporter_id
              LEFT JOIN coffee_laboratories cl ON cc.laboratory_id = cl.laboratory_id
              LEFT JOIN coffee_tasters ct ON cc.taster_id = ct.taster_id
              WHERE cc.certificate_id = $1`,
              [request.certificate_id]
            );
            
            if (certData.rows.length > 0) {
              const cert = certData.rows[0];
              const pdfResult = await pdfService.generateCompetenceCertificatePDF(
                request.certificate_id,
                {
                  certificateNumber: certNumber,
                  issuedDate: new Date(issueDate),
                  expiryDate: new Date(expiryDate),
                  businessName: cert.business_name,
                  businessType: cert.business_type,
                  tin: cert.tin,
                  registrationNumber: cert.registration_number,
                  exporterCity: cert.exporter_city,
                  exporterRegion: cert.exporter_region,
                  officeAddress: cert.office_address,
                  contactPerson: cert.contact_person,
                  email: cert.email,
                  phone: cert.phone,
                  laboratoryName: cert.laboratory_name,
                  laboratoryCity: cert.laboratory_city,
                  laboratoryRegion: cert.laboratory_region,
                  laboratoryAddress: cert.laboratory_address,
                  laboratoryCertNumber: cert.laboratory_cert_number,
                  tasterName: cert.taster_name,
                  tasterCertNumber: cert.taster_cert_number,
                  tasterQualification: cert.taster_qualification,
                  facilityInspectionDate: cert.facility_inspection_date,
                  inspectionPassed: cert.inspection_passed,
                  hasQualityManagementSystem: cert.has_quality_management_system,
                  storageCapacity: cert.storage_capacity,
                  approvedBy,
                  approvedAt: new Date()
                }
              );
              
              // Update certificate with PDF path
              await client.query(
                `UPDATE competence_certificates 
                 SET pdf_path = $1, pdf_generated_at = CURRENT_TIMESTAMP
                 WHERE certificate_id = $2`,
                [pdfResult.filePath, request.certificate_id]
              );
              
              pdfGenerated = true;
              pdfPath = pdfResult.filePath;
              logger.info('Competence certificate PDF generated successfully', {
                certificateId: request.certificate_id,
                pdfPath: pdfResult.filePath
              });
            }
          } catch (pdfError: any) {
            logger.error('Failed to generate competence certificate PDF', { error: pdfError.message });
            // Don't fail the approval if PDF generation fails
          }
          break;

        case 'EXPORT_LICENSE':
          await client.query(
            `UPDATE export_licenses 
             SET license_number = $1,
                 issued_date = $2,
                 expiry_date = $3,
                 updated_at = CURRENT_TIMESTAMP
             WHERE license_id = $4`,
            [certNumber, issueDate, expiryDate, request.certificate_id]
          );
          
          // Generate PDF for export license
          try {
            const { default: pdfService } = await import('../services/pdf-generation.service');
            
            const licenseData = await client.query(
              `SELECT 
                el.*,
                ep.business_name,
                ep.business_type,
                ep.tin,
                cc.certificate_number as competence_certificate_number
              FROM export_licenses el
              INNER JOIN exporter_profiles ep ON el.exporter_id = ep.exporter_id
              LEFT JOIN competence_certificates cc ON el.competence_certificate_id = cc.certificate_id
              WHERE el.license_id = $1`,
              [request.certificate_id]
            );
            
            if (licenseData.rows.length > 0) {
              const license = licenseData.rows[0];
              const pdfResult = await pdfService.generateExportLicensePDF(
                request.certificate_id,
                {
                  licenseNumber: certNumber,
                  issuedDate: new Date(issueDate),
                  expiryDate: new Date(expiryDate),
                  businessName: license.business_name,
                  businessType: license.business_type,
                  tin: license.tin,
                  competenceCertificateNumber: license.competence_certificate_number,
                  eicRegistrationNumber: license.eic_registration_number || 'N/A',
                  authorizedCoffeeTypes: license.authorized_coffee_types || [],
                  authorizedOrigins: license.authorized_origins || [],
                  annualQuota: license.annual_quota,
                  approvedBy,
                  approvedAt: new Date()
                }
              );
              
              // Update license with PDF path
              await client.query(
                `UPDATE export_licenses 
                 SET pdf_path = $1, pdf_generated_at = CURRENT_TIMESTAMP
                 WHERE license_id = $2`,
                [pdfResult.filePath, request.certificate_id]
              );
              
              pdfGenerated = true;
              pdfPath = pdfResult.filePath;
              logger.info('Export license PDF generated successfully', {
                licenseId: request.certificate_id,
                pdfPath: pdfResult.filePath
              });
            }
          } catch (pdfError: any) {
            logger.error('Failed to generate export license PDF', { error: pdfError.message });
            // Don't fail the approval if PDF generation fails
          }
          break;
      }

      await client.query('COMMIT');

      logger.info(`Certificate renewal approved: ${requestId} by ${approvedBy}`, {
        certificateType: request.certificate_type,
        pdfGenerated
      });

      res.json({
        success: true,
        message: 'Renewal request approved successfully',
        data: {
          requestId,
          certificateType: request.certificate_type,
          finalCertificateNumber: certNumber,
          finalExpiryDate: expiryDate,
          pdfGenerated,
          pdfPath
        },
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      logger.error('Error approving renewal:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to approve renewal request',
        error: error.message,
      });
    } finally {
      client.release();
    }
  };

  /**
   * Reject a renewal request
   * POST /services/ecta/certificate/renewal/:requestId/reject
   */
  public rejectRenewal = async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const { requestId } = req.params;
      const { rejectionReason } = req.body;
      const rejectedBy = (req as any).user?.username || 'ECTA Admin';

      if (!rejectionReason) {
        res.status(400).json({
          success: false,
          message: 'Rejection reason is required',
        });
        return;
      }

      const result = await pool.query(
        `UPDATE certificate_renewal_requests 
         SET status = 'REJECTED',
             rejected_by = $1,
             rejected_at = CURRENT_TIMESTAMP,
             rejection_reason = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE request_id = $3 AND status = 'PENDING'
         RETURNING *`,
        [rejectedBy, rejectionReason, requestId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Renewal request not found or already processed',
        });
        return;
      }

      logger.info(`Certificate renewal rejected: ${requestId} by ${rejectedBy}`);

      res.json({
        success: true,
        message: 'Renewal request rejected',
        data: result.rows[0],
      });
    } catch (error: any) {
      logger.error('Error rejecting renewal:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reject renewal request',
        error: error.message,
      });
    }
  };

  /**
   * Get expiring certificates (from view)
   * GET /services/ecta/certificate/expiring?type=TASTER_PROFICIENCY&days=30
   */
  public getExpiringCertificates = async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const { type, days = '90' } = req.query;

      let query = `
        SELECT * FROM expiring_certificates
        WHERE days_until_expiry <= $1
      `;

      const params: any[] = [parseInt(days as string)];

      if (type) {
        query += ` AND certificate_type = $2`;
        params.push(type);
      }

      query += ` ORDER BY days_until_expiry ASC`;

      const result = await pool.query(query, params);

      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length,
      });
    } catch (error: any) {
      logger.error('Error fetching expiring certificates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch expiring certificates',
        error: error.message,
      });
    }
  };
}

export default ECTACertificateRenewalController;
