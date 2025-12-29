import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import {
  ExporterProfile,
  CoffeeLaboratory,
  CompetenceCertificate,
  ExportLicense,
} from '@shared/models/ecta-preregistration.model';
import { ectaPreRegistrationService } from '@shared/services/ecta-preregistration.service';
import { pool } from '@shared/database/pool';
import { createLogger } from '@shared/logger';

const logger = createLogger('PreRegistrationController');

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
 * ECTA Pre-Registration Controller
 * Handles exporter qualification, licensing, and certification
 * Based on real-world ECTA processes and Directive 1106/2025
 */
export class PreRegistrationController {
  /**
   * Get all exporter profiles (ECTA view)
   */
  public getAllExporters = async (
    _req: RequestWithUser,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const result = await pool.query('SELECT * FROM exporter_profiles ORDER BY created_at DESC');
      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length,
      });
    } catch (error: any) {
      logger.error('Failed to fetch exporters', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch exporters',
        error: error.message,
      });
    }
  };

  /**
   * Get pending exporter applications
   */
  public getPendingApplications = async (
    _req: RequestWithUser,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const result = await pool.query(
        'SELECT * FROM exporter_profiles WHERE status = $1 ORDER BY created_at DESC',
        ['PENDING_APPROVAL']
      );
      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length,
        message: 'Exporter applications pending ECTA approval',
      });
    } catch (error: any) {
      logger.error('Failed to fetch pending applications', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch pending applications',
        error: error.message,
      });
    }
  };

  /**
   * Approve exporter profile
   */
  public approveExporter = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const { exporterId } = req.params;
      const user = req.user!;

      if (!exporterId) {
        res.status(400).json({
          success: false,
          message: 'Exporter ID is required',
        });
        return;
      }

      const now = new Date().toISOString();
      const result = await pool.query(
        `UPDATE exporter_profiles 
         SET status = $1, approved_by = $2, approved_at = $3, updated_at = $4
         WHERE exporter_id = $5
         RETURNING *`,
        ['ACTIVE', user.username, now, now, exporterId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Exporter not found',
        });
        return;
      }

      logger.info('Exporter profile approved', { exporterId, approvedBy: user.username });

      res.json({
        success: true,
        message: 'Exporter profile approved',
        data: result.rows[0],
      });
    } catch (error: any) {
      logger.error('Failed to approve exporter', { error: error.message, exporterId: req.params.exporterId });
      res.status(500).json({
        success: false,
        message: 'Failed to approve exporter',
        error: error.message,
      });
    }
  };

  /**
   * Reject exporter profile
   */
  public rejectExporter = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const { exporterId } = req.params;
      const { reason } = req.body;
      const user = req.user!;

      if (!exporterId || !reason) {
        res.status(400).json({
          success: false,
          message: 'Exporter ID and rejection reason are required',
        });
        return;
      }

      const now = new Date().toISOString();

      // Get current profile to append to rejection history
      const currentProfile = await pool.query(
        'SELECT rejection_history FROM exporter_profiles WHERE exporter_id = $1',
        [exporterId]
      );

      if (currentProfile.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Exporter not found',
        });
        return;
      }

      // Build rejection history entry
      const rejectionEntry = {
        rejectedBy: user.username,
        rejectedAt: now,
        reason: reason,
      };

      // Append to existing history
      const currentHistory = currentProfile.rows[0].rejection_history || [];
      const updatedHistory = [...currentHistory, rejectionEntry];

      const result = await pool.query(
        `UPDATE exporter_profiles 
         SET status = $1, 
             rejection_reason = $2, 
             rejected_by = $3, 
             rejected_at = $4, 
             rejection_history = $5,
             updated_at = $6
         WHERE exporter_id = $7
         RETURNING *`,
        ['REJECTED', reason, user.username, now, JSON.stringify(updatedHistory), now, exporterId]
      );

      logger.info('Exporter profile rejected', { exporterId, rejectedBy: user.username, reason });

      res.json({
        success: true,
        message: 'Exporter profile rejected',
        data: result.rows[0],
      });
    } catch (error: any) {
      logger.error('Failed to reject exporter', { error: error.message, exporterId: req.params.exporterId });
      res.status(500).json({
        success: false,
        message: 'Failed to reject exporter',
        error: error.message,
      });
    }
  };

  /**
   * Resubmit exporter profile after rejection
   */
  public resubmitProfile = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const { exporterId } = req.params;
      const user = req.user!;

      if (!exporterId) {
        res.status(400).json({
          success: false,
          message: 'Exporter ID is required',
        });
        return;
      }

      // Verify current status is REJECTED
      const currentProfile = await pool.query(
        'SELECT status, resubmission_count FROM exporter_profiles WHERE exporter_id = $1',
        [exporterId]
      );

      if (currentProfile.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Exporter not found',
        });
        return;
      }

      if (currentProfile.rows[0].status !== 'REJECTED') {
        res.status(400).json({
          success: false,
          message: 'Only rejected profiles can be resubmitted',
          currentStatus: currentProfile.rows[0].status,
        });
        return;
      }

      const now = new Date().toISOString();
      const resubmissionCount = (currentProfile.rows[0].resubmission_count || 0) + 1;

      const result = await pool.query(
        `UPDATE exporter_profiles 
         SET status = $1, 
             rejection_reason = NULL, 
             rejected_by = NULL, 
             rejected_at = NULL,
             resubmission_count = $2,
             last_resubmitted_at = $3,
             updated_at = $4
         WHERE exporter_id = $5
         RETURNING *`,
        ['PENDING_APPROVAL', resubmissionCount, now, now, exporterId]
      );

      logger.info('Exporter profile resubmitted', {
        exporterId,
        resubmittedBy: user.username,
        resubmissionCount
      });

      res.json({
        success: true,
        message: 'Profile resubmitted successfully. Awaiting ECTA review.',
        data: result.rows[0],
      });
    } catch (error: any) {
      logger.error('Failed to resubmit profile', { error: error.message, exporterId: req.params.exporterId });
      res.status(500).json({
        success: false,
        message: 'Failed to resubmit profile',
        error: error.message,
      });
    }
  };

  /**
   * Reject laboratory certification
   */
  public rejectLaboratory = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const { laboratoryId } = req.params;
      const { reason } = req.body;
      const user = req.user!;

      if (!laboratoryId || !reason) {
        res.status(400).json({
          success: false,
          message: 'Laboratory ID and rejection reason are required',
        });
        return;
      }

      const now = new Date().toISOString();

      // Get current laboratory to append to rejection history
      const currentLab = await pool.query(
        'SELECT rejection_history FROM coffee_laboratories WHERE laboratory_id = $1',
        [laboratoryId]
      );

      if (currentLab.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Laboratory not found',
        });
        return;
      }

      const rejectionEntry = {
        rejectedBy: user.username,
        rejectedAt: now,
        reason: reason,
      };

      const currentHistory = currentLab.rows[0].rejection_history || [];
      const updatedHistory = [...currentHistory, rejectionEntry];

      const result = await pool.query(
        `UPDATE coffee_laboratories 
         SET status = $1, 
             rejection_reason = $2, 
             rejected_by = $3, 
             rejected_at = $4, 
             rejection_history = $5,
             updated_at = $6
         WHERE laboratory_id = $7
         RETURNING *`,
        ['REJECTED', reason, user.username, now, JSON.stringify(updatedHistory), now, laboratoryId]
      );

      logger.info('Laboratory rejected', { laboratoryId, rejectedBy: user.username, reason });

      res.json({
        success: true,
        message: 'Laboratory certification rejected',
        data: result.rows[0],
      });
    } catch (error: any) {
      logger.error('Failed to reject laboratory', { error: error.message, laboratoryId: req.params.laboratoryId });
      res.status(500).json({
        success: false,
        message: 'Failed to reject laboratory',
        error: error.message,
      });
    }
  };

  /**
   * Resubmit laboratory after rejection
   */
  public resubmitLaboratory = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const { laboratoryId } = req.params;
      const user = req.user!;

      if (!laboratoryId) {
        res.status(400).json({
          success: false,
          message: 'Laboratory ID is required',
        });
        return;
      }

      const currentLab = await pool.query(
        'SELECT status, resubmission_count FROM coffee_laboratories WHERE laboratory_id = $1',
        [laboratoryId]
      );

      if (currentLab.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Laboratory not found',
        });
        return;
      }

      if (currentLab.rows[0].status !== 'REJECTED') {
        res.status(400).json({
          success: false,
          message: 'Only rejected laboratories can be resubmitted',
          currentStatus: currentLab.rows[0].status,
        });
        return;
      }

      const now = new Date().toISOString();
      const resubmissionCount = (currentLab.rows[0].resubmission_count || 0) + 1;

      const result = await pool.query(
        `UPDATE coffee_laboratories 
         SET status = $1, 
             rejection_reason = NULL, 
             rejected_by = NULL, 
             rejected_at = NULL,
             resubmission_count = $2,
             last_resubmitted_at = $3,
             updated_at = $4
         WHERE laboratory_id = $5
         RETURNING *`,
        ['PENDING', resubmissionCount, now, now, laboratoryId]
      );

      logger.info('Laboratory resubmitted', {
        laboratoryId,
        resubmittedBy: user.username,
        resubmissionCount
      });

      res.json({
        success: true,
        message: 'Laboratory resubmitted successfully. Awaiting ECTA certification.',
        data: result.rows[0],
      });
    } catch (error: any) {
      logger.error('Failed to resubmit laboratory', { error: error.message, laboratoryId: req.params.laboratoryId });
      res.status(500).json({
        success: false,
        message: 'Failed to resubmit laboratory',
        error: error.message,
      });
    }
  };
  public getPendingLaboratories = async (
    _req: RequestWithUser,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      // Join with exporter_profiles to get exporter name and details
      const query = `
        SELECT 
          cl.*,
          ep.business_name as exporter_name,
          ep.tin as exporter_tin,
          ep.city as exporter_city,
          ep.region as exporter_region
        FROM coffee_laboratories cl
        LEFT JOIN exporter_profiles ep ON cl.exporter_id = ep.exporter_id
        WHERE cl.status = $1
        ORDER BY cl.created_at DESC
      `;

      const result = await pool.query(query, ['PENDING']);

      // Map to frontend-friendly format
      const laboratories = result.rows.map(row => ({
        id: row.laboratory_id,
        laboratoryId: row.laboratory_id,
        exporterId: row.exporter_id,
        laboratoryName: row.laboratory_name,
        exporterName: row.exporter_name || 'Unknown',
        address: row.address,
        city: row.city || row.exporter_city || '',
        region: row.region || row.exporter_region || '',
        hasRoastingFacility: row.has_roasting_facility,
        hasCuppingRoom: row.has_cupping_room,
        hasSampleStorage: row.has_sample_storage,
        equipment: row.equipment || [],
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      res.json({
        success: true,
        data: laboratories,
        count: laboratories.length,
        message: 'Laboratory certifications pending inspection',
      });
    } catch (error: any) {
      logger.error('Failed to fetch pending laboratories', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch pending laboratories',
        error: error.message,
      });
    }
  };

  /**
   * Certify laboratory
   */
  public certifyLaboratory = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const { laboratoryId } = req.params;
      const {
        certificationNumber,
        inspectionPassed,
        validityYears = 1,
      } = req.body;
      const user = req.user!;

      if (!laboratoryId || !certificationNumber) {
        res.status(400).json({
          success: false,
          message: 'Laboratory ID and certification number are required',
        });
        return;
      }

      if (!inspectionPassed) {
        res.status(400).json({
          success: false,
          message: 'Laboratory inspection must pass before certification',
        });
        return;
      }

      const now = new Date();
      const expiryDate = new Date(now);
      expiryDate.setFullYear(expiryDate.getFullYear() + validityYears);

      // TODO: Update laboratory certification
      // laboratory.certificationNumber = certificationNumber;
      // laboratory.certifiedDate = now.toISOString();
      // laboratory.expiryDate = expiryDate.toISOString();
      // laboratory.status = 'ACTIVE';
      // laboratory.inspectedBy = user.username;

      res.json({
        success: true,
        message: 'Laboratory certified successfully',
        data: {
          laboratoryId,
          certificationNumber,
          validUntil: expiryDate.toISOString(),
          certifiedBy: user.username,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to certify laboratory',
        error: error.message,
      });
    }
  };

  /**
   * Get pending competence certificate applications
   */
  public getPendingCompetenceCertificates = async (
    _req: RequestWithUser,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const result = await pool.query(
        `SELECT cc.*, ep.business_name, ep.business_type, ep.tin,
                (SELECT status = 'ACTIVE' FROM coffee_laboratories cl WHERE cl.exporter_id = ep.exporter_id LIMIT 1) as laboratory_certified,
                (SELECT status = 'ACTIVE' FROM coffee_tasters ct WHERE ct.exporter_id = ep.exporter_id LIMIT 1) as taster_verified
         FROM competence_certificates cc
         JOIN exporter_profiles ep ON cc.exporter_id = ep.exporter_id
         WHERE cc.status = $1
         ORDER BY cc.created_at DESC`,
        ['PENDING']
      );

      const mappedData = result.rows.map(row => ({
        id: row.certificate_id,
        exporterId: row.exporter_id,
        businessName: row.business_name,
        businessType: row.business_type,
        tin: row.tin,
        status: row.status,
        applicationDate: row.application_date || row.created_at,
        laboratoryCertified: row.laboratory_certified,
        tasterVerified: row.taster_verified,
        applicationReason: row.application_reason
      }));

      res.json({
        success: true,
        data: mappedData,
        count: mappedData.length,
        message: 'Competence certificate applications pending review',
      });
    } catch (error: any) {
      logger.error('Failed to fetch pending certificates', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch pending certificates',
        error: error.message,
      });
    }
  };

  /**
   * Issue competence certificate
   */
  public issueCompetenceCertificate = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const { exporterId } = req.params;
      const {
        certificateNumber,
        laboratoryId,
        tasterId,
        facilityInspectionPassed,
        inspectionReport,
        validityYears = 1,
      } = req.body;
      const user = req.user!;

      if (!exporterId || !certificateNumber || !laboratoryId || !tasterId) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields',
        });
        return;
      }

      if (!facilityInspectionPassed) {
        res.status(400).json({
          success: false,
          message: 'Facility inspection must pass before issuing certificate',
        });
        return;
      }

      // Validate exporter has certified lab and qualified taster
      const validation = await ectaPreRegistrationService.validateExporter(exporterId);

      if (!validation.hasCertifiedLaboratory) {
        res.status(400).json({
          success: false,
          message: 'Exporter must have ECTA-certified laboratory',
        });
        return;
      }

      if (!validation.hasQualifiedTaster) {
        res.status(400).json({
          success: false,
          message: 'Exporter must have qualified taster',
        });
        return;
      }

      const now = new Date();
      const expiryDate = new Date(now);
      expiryDate.setFullYear(expiryDate.getFullYear() + validityYears);

      // TODO: Create competence certificate
      const certificate: Partial<CompetenceCertificate> = {
        certificateId: uuidv4(),
        exporterId,
        certificateNumber,
        issuedDate: now.toISOString(),
        expiryDate: expiryDate.toISOString(),
        status: 'ACTIVE',
        laboratoryId,
        tasterId,
        facilityInspectionDate: now.toISOString(),
        inspectionReport,
        inspectedBy: user.username,
        inspectionPassed: true,
        approvedBy: user.username,
        approvedAt: now.toISOString(),
        renewalHistory: [],
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      res.json({
        success: true,
        message: 'Competence certificate issued successfully',
        data: certificate,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to issue competence certificate',
        error: error.message,
      });
    }
  };

  /**
   * Receive license application from Exporter Portal
   */
  public receiveLicenseApplication = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const {
        exporterId,
        eicRegistrationNumber,
        requestedCoffeeTypes,
        requestedOrigins,
        applicantProfile,
        submittedAt,
        submittedBy,
      } = req.body;

      if (!exporterId || !eicRegistrationNumber) {
        res.status(400).json({
          success: false,
          message: 'Exporter ID and EIC registration number are required',
        });
        return;
      }

      // TODO: Store application in ECTA database
      const applicationId = uuidv4();
      const application = {
        applicationId,
        exporterId,
        eicRegistrationNumber,
        requestedCoffeeTypes: requestedCoffeeTypes || ['ARABICA'],
        requestedOrigins: requestedOrigins || [],
        applicantProfile,
        status: 'PENDING_REVIEW',
        submittedAt: submittedAt || new Date().toISOString(),
        submittedBy: submittedBy || 'Unknown',
        receivedAt: new Date().toISOString(),
        reviewedBy: null,
        reviewedAt: null,
        reviewNotes: null,
      };

      console.log('License application received from Exporter Portal:', {
        applicationId,
        exporterId,
        eicRegistrationNumber,
        submittedBy,
      });

      res.status(201).json({
        success: true,
        message: 'License application received and queued for ECTA review',
        data: {
          applicationId,
          status: 'PENDING_REVIEW',
          receivedAt: application.receivedAt,
          nextSteps: [
            'ECTA will review the application',
            'Exporter will be notified of the decision',
            'License will be issued if approved',
          ],
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to receive license application',
        error: error.message,
      });
    }
  };

  /**
   * Get pending export license applications
   */
  public getPendingLicenses = async (
    _req: RequestWithUser,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const result = await pool.query(
        `SELECT el.*, ep.business_name, ep.business_type, ep.tin, ep.capital_verified,
                (SELECT status = 'ACTIVE' FROM competence_certificates cc WHERE cc.exporter_id = ep.exporter_id LIMIT 1) as has_competence_certificate
         FROM export_licenses el
         JOIN exporter_profiles ep ON el.exporter_id = ep.exporter_id
         WHERE el.status = $1
         ORDER BY el.created_at DESC`,
        ['PENDING_REVIEW']
      );

      const mappedData = result.rows.map(row => ({
        id: row.license_id,
        exporterId: row.exporter_id,
        businessName: row.business_name,
        businessType: row.business_type,
        tin: row.tin,
        status: row.status,
        applicationDate: row.application_date || row.created_at,
        capitalVerified: row.capital_verified,
        hasCompetenceCertificate: row.has_competence_certificate,
        eicRegistrationNumber: row.eic_registration_number,
        requestedCoffeeTypes: row.requested_coffee_types
      }));

      res.json({
        success: true,
        data: mappedData,
        count: mappedData.length,
        message: 'Export license applications pending review',
      });
    } catch (error: any) {
      logger.error('Failed to fetch pending licenses', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch pending licenses',
        error: error.message,
      });
    }
  };

  /**
   * Issue export license
   */
  public issueExportLicense = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const { exporterId } = req.params;
      const {
        licenseNumber,
        competenceCertificateId,
        eicRegistrationNumber,
        authorizedCoffeeTypes,
        authorizedOrigins,
        annualQuota,
        validityYears = 1,
      } = req.body;
      const user = req.user!;

      if (!exporterId || !licenseNumber || !competenceCertificateId || !eicRegistrationNumber) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields',
        });
        return;
      }

      // Validate exporter has valid competence certificate
      const validation = await ectaPreRegistrationService.validateExporter(exporterId);

      if (!validation.hasCompetenceCertificate) {
        res.status(400).json({
          success: false,
          message: 'Exporter must have valid competence certificate',
          requiredActions: validation.requiredActions,
        });
        return;
      }

      const now = new Date();
      const expiryDate = new Date(now);
      expiryDate.setFullYear(expiryDate.getFullYear() + validityYears);

      // TODO: Create export license
      const license: Partial<ExportLicense> = {
        licenseId: uuidv4(),
        exporterId,
        licenseNumber,
        issuedDate: now.toISOString(),
        expiryDate: expiryDate.toISOString(),
        status: 'ACTIVE',
        competenceCertificateId,
        eicRegistrationNumber,
        authorizedCoffeeTypes: authorizedCoffeeTypes || ['Arabica'],
        authorizedOrigins: authorizedOrigins || [],
        annualQuota,
        approvedBy: user.username,
        approvedAt: now.toISOString(),
        renewalHistory: [],
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      res.json({
        success: true,
        message: 'Export license issued successfully',
        data: license,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to issue export license',
        error: error.message,
      });
    }
  };

  // ============================================================================
  // TASTER VERIFICATION
  // ============================================================================

  /**
   * Get pending taster verifications
   */
  public getPendingTasters = async (
    _req: RequestWithUser,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const query = `
        SELECT 
          ct.*,
          ep.business_name as exporter_name,
          ep.tin as exporter_tin
        FROM coffee_tasters ct
        LEFT JOIN exporter_profiles ep ON ct.exporter_id = ep.exporter_id
        WHERE ct.status = $1
        ORDER BY ct.created_at DESC
      `;

      const result = await pool.query(query, ['PENDING']);

      const tasters = result.rows.map(row => ({
        id: row.taster_id,
        tasterId: row.taster_id,
        exporterId: row.exporter_id,
        exporterName: row.exporter_name || 'Unknown',
        fullName: row.full_name,
        proficiencyCertificateNumber: row.proficiency_certificate_number,
        certificateIssueDate: row.certificate_issue_date,
        certificateExpiryDate: row.certificate_expiry_date,
        qualificationLevel: row.qualification_level,
        isExclusiveEmployee: row.is_exclusive_employee,
        status: row.status,
        createdAt: row.created_at,
      }));

      res.json({
        success: true,
        data: tasters,
        count: tasters.length,
        message: 'Taster verifications pending review',
      });
    } catch (error: any) {
      logger.error('Failed to fetch pending tasters', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch pending tasters',
        error: error.message,
      });
    }
  };

  /**
   * Verify taster credentials
   */
  public verifyTaster = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const { tasterId } = req.params;
      const user = req.user!;

      if (!tasterId) {
        res.status(400).json({
          success: false,
          message: 'Taster ID is required',
        });
        return;
      }

      const now = new Date().toISOString();
      const result = await pool.query(
        `UPDATE coffee_tasters 
         SET status = $1, verified_by = $2, verified_at = $3, updated_at = $4
         WHERE taster_id = $5
         RETURNING *`,
        ['ACTIVE', user.username, now, now, tasterId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Taster not found',
        });
        return;
      }

      logger.info('Taster verified', { tasterId, verifiedBy: user.username });

      res.json({
        success: true,
        message: 'Taster verified successfully',
        data: result.rows[0],
      });
    } catch (error: any) {
      logger.error('Failed to verify taster', { error: error.message, tasterId: req.params.tasterId });
      res.status(500).json({
        success: false,
        message: 'Failed to verify taster',
        error: error.message,
      });
    }
  };

  /**
   * Reject taster verification
   */
  public rejectTaster = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const { tasterId } = req.params;
      const { reason } = req.body;
      const user = req.user!;

      if (!tasterId || !reason) {
        res.status(400).json({
          success: false,
          message: 'Taster ID and rejection reason are required',
        });
        return;
      }

      const now = new Date().toISOString();
      const result = await pool.query(
        `UPDATE coffee_tasters 
         SET status = $1, rejection_reason = $2, rejected_by = $3, rejected_at = $4, updated_at = $5
         WHERE taster_id = $6
         RETURNING *`,
        ['REJECTED', reason, user.username, now, now, tasterId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Taster not found',
        });
        return;
      }

      logger.info('Taster rejected', { tasterId, rejectedBy: user.username, reason });

      res.json({
        success: true,
        message: 'Taster verification rejected',
        data: result.rows[0],
      });
    } catch (error: any) {
      logger.error('Failed to reject taster', { error: error.message, tasterId: req.params.tasterId });
      res.status(500).json({
        success: false,
        message: 'Failed to reject taster',
        error: error.message,
      });
    }
  };

  // ============================================================================
  // COMPETENCE CERTIFICATE REJECTION
  // ============================================================================

  /**
   * Reject competence certificate application
   */
  public rejectCompetenceCertificate = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const { exporterId } = req.params;
      const { reason } = req.body;
      const user = req.user!;

      if (!exporterId || !reason) {
        res.status(400).json({
          success: false,
          message: 'Exporter ID and rejection reason are required',
        });
        return;
      }

      const now = new Date().toISOString();
      const result = await pool.query(
        `UPDATE competence_certificates 
         SET status = $1, rejection_reason = $2, rejected_by = $3, rejected_at = $4, updated_at = $5
         WHERE exporter_id = $6 AND status = 'PENDING'
         RETURNING *`,
        ['REJECTED', reason, user.username, now, now, exporterId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Competence certificate application not found or already processed',
        });
        return;
      }

      logger.info('Competence certificate rejected', { exporterId, rejectedBy: user.username, reason });

      res.json({
        success: true,
        message: 'Competence certificate application rejected',
        data: result.rows[0],
      });
    } catch (error: any) {
      logger.error('Failed to reject competence certificate', { error: error.message, exporterId: req.params.exporterId });
      res.status(500).json({
        success: false,
        message: 'Failed to reject competence certificate',
        error: error.message,
      });
    }
  };

  // ============================================================================
  // EXPORT LICENSE REJECTION
  // ============================================================================

  /**
   * Reject export license application
   */
  public rejectExportLicense = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const { exporterId } = req.params;
      const { reason } = req.body;
      const user = req.user!;

      if (!exporterId || !reason) {
        res.status(400).json({
          success: false,
          message: 'Exporter ID and rejection reason are required',
        });
        return;
      }

      const now = new Date().toISOString();
      const result = await pool.query(
        `UPDATE export_licenses 
         SET status = $1, rejection_reason = $2, rejected_by = $3, rejected_at = $4, updated_at = $5
         WHERE exporter_id = $6 AND status IN ('PENDING', 'PENDING_REVIEW')
         RETURNING *`,
        ['REJECTED', reason, user.username, now, now, exporterId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Export license application not found or already processed',
        });
        return;
      }

      logger.info('Export license rejected', { exporterId, rejectedBy: user.username, reason });

      res.json({
        success: true,
        message: 'Export license application rejected',
        data: result.rows[0],
      });
    } catch (error: any) {
      logger.error('Failed to reject export license', { error: error.message, exporterId: req.params.exporterId });
      res.status(500).json({
        success: false,
        message: 'Failed to reject export license',
        error: error.message,
      });
    }
  };

  /**
   * Validate exporter qualification
   */
  public validateExporter = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const { exporterId } = req.params;

      if (!exporterId) {
        res.status(400).json({
          success: false,
          message: 'Exporter ID is required',
        });
        return;
      }

      const validation = await ectaPreRegistrationService.validateExporter(exporterId);

      res.json({
        success: true,
        data: validation,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to validate exporter',
        error: error.message,
      });
    }
  };
}
