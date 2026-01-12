import { Response, NextFunction } from 'express';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import {
  BusinessType,
} from '@shared/models/ecta-preregistration.model';
import { ectaPreRegistrationService } from '@shared/services/ecta-preregistration.service';
import { EctaPreRegistrationRepository } from '@shared/database/repositories/ecta-preregistration.repository';
import { AuthenticatedRequest } from '@shared/middleware/auth.middleware';
import { getPool } from '@shared/database/pool';
import { createLogger } from '@shared/logger';
import { config } from '../config';

const pool = getPool();
const logger = createLogger('ExporterPreRegistrationController');

// Retry configuration for inter-service calls
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second


/**
 * Exporter Pre-Registration Controller
 * Handles exporter's own registration and qualification process
 */
export class ExporterPreRegistrationController {
  private repository: EctaPreRegistrationRepository;

  constructor() {
    this.repository = new EctaPreRegistrationRepository(pool);
  }

  /**
   * Register exporter profile
   */
  public registerProfile = async (
    req: AuthenticatedRequest,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      let userId: string = req.user?.id || '';
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      // Admin override: Register on behalf of another user
      if (req.user?.role === 'admin' && req.body.targetUserId) {
        userId = String(req.body.targetUserId);
        logger.info(`Admin ${req.user.id} registering profile on behalf of user ${userId}`);
      }

      const {
        businessName,
        tin,
        // registrationNumber, // Removed from user input
        businessType,
        minimumCapital,
        capitalProofDocument,
        officeAddress,
        city,
        region,
        contactPerson,
        email,
        phone,
      } = req.body;

      // Validate required fields
      if (!businessName || !tin || !businessType) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields',
        });
        return;
      }

      // Generate System-Standard Registration Number
      // Format: ECTA-{TYPE}-{YEAR}-{RANDOM}
      const typePrefixMap: Record<string, string> = {
        'PRIVATE': 'PVT',
        'TRADE_ASSOCIATION': 'ASSN',
        'JOINT_STOCK': 'JS',
        'LLC': 'LLC',
        'FARMER': 'FRM'
      };
      const prefix = typePrefixMap[businessType as string] || 'GEN';
      const year = new Date().getFullYear();
      const sequence = Math.floor(1000 + Math.random() * 9000); // Simple 4-digit random for now to avoid collision without sequence lock
      const registrationNumber = `ECTA-${prefix}-${year}-${sequence}`;


      // Check if profile already exists for this user
      // Skip this check for admins unless they're registering for a specific targetUserId
      const existingProfile = await this.repository.getExporterProfileByUserId(userId);
      if (existingProfile && req.user?.role !== 'admin') {
        res.status(409).json({
          success: false,
          message: 'Exporter profile already exists for this user',
          data: existingProfile
        });
        return;
      }

      // Validate capital requirement safely
      let requiredCapital = 0;
      try {
        requiredCapital = ectaPreRegistrationService.getMinimumCapitalRequirement(
          businessType as BusinessType
        );
      } catch (e) {
        logger.warn(`Invalid business type: ${businessType}`);
      }

      // If business type is invalid or unknown, requiredCapital might be undefined if the service doesn't handle it.
      // EctaPreRegistrationService keys are strict. Safely handle undefined.
      if (requiredCapital === undefined) {
        res.status(400).json({
          success: false,
          message: `Invalid business type: ${businessType}`,
        });
        return;
      }

      if (businessType !== 'FARMER' && minimumCapital < requiredCapital) {
        res.status(400).json({
          success: false,
          message: `Minimum capital requirement not met. Required: ETB ${requiredCapital.toLocaleString()}`,
          requiredCapital,
        });
        return;
      }

      // Save to database
      const profileData = {
        userId,
        businessName,
        tin,
        registrationNumber,
        businessType,
        minimumCapital: minimumCapital || 0,
        capitalVerified: false,
        capitalProofDocument: capitalProofDocument || null,
        officeAddress,
        city,
        region,
        contactPerson,
        email,
        phone,
        status: 'PENDING_APPROVAL' as const,
      };

      const profile = await this.repository.createExporterProfile(profileData);

      logger.info('Exporter profile registered', { userId, businessName, tin });

      res.status(201).json({
        success: true,
        message: 'Exporter profile registered. Awaiting ECTA approval.',
        data: profile,
      });
    } catch (error: any) {
      logger.error('Failed to register profile', { error: error.message, userId: req.user?.id });
      res.status(500).json({
        success: false,
        message: 'Failed to register profile',
        error: error.message,
      });
    }
  };

  /**
   * Get own exporter profile
   */
  public getMyProfile = async (
    req: AuthenticatedRequest,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      // Query database by userId
      const profile = await this.repository.getExporterProfileByUserId(userId);

      if (!profile) {
        res.status(404).json({
          success: false,
          message: 'Exporter profile not found. Please register first.',
        });
        return;
      }

      logger.info('Exporter profile retrieved', { userId });

      res.json({
        success: true,
        data: profile,
      });
    } catch (error: any) {
      logger.error('Failed to fetch profile', { error: error.message, userId: req.user?.id });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch profile',
        error: error.message,
      });
    }
  };

  /**
   * Update own exporter profile
   */
  public updateProfile = async (
    req: AuthenticatedRequest,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      // Get current profile
      const profile = await this.repository.getExporterProfileByUserId(userId);
      if (!profile) {
        res.status(404).json({
          success: false,
          message: 'Exporter profile not found. Please register first.',
        });
        return;
      }

      // Update profile with allowed fields
      const updatedProfile = await this.repository.updateExporterProfile(
        profile.exporterId,
        req.body
      );

      logger.info('Exporter profile updated', { userId, exporterId: profile.exporterId });

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedProfile,
      });
    } catch (error: any) {
      logger.error('Failed to update profile', { error: error.message, userId: req.user?.id });
      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        error: error.message,
      });
    }
  };

  /**
   * Register laboratory for certification
   */
  public registerLaboratory = async (
    req: AuthenticatedRequest,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      // Get exporterId from userId
      const profile = await this.repository.getExporterProfileByUserId(userId);
      if (!profile) {
        res.status(404).json({
          success: false,
          message: 'Exporter profile not found. Please register first.',
        });
        return;
      }
      const exporterId = profile.exporterId;

      const {
        laboratoryName,
        address,
        equipment,
        hasRoastingFacility,
        hasCuppingRoom,
        hasSampleStorage,
      } = req.body;

      if (!laboratoryName || !address) {
        res.status(400).json({
          success: false,
          message: 'Laboratory name and address are required',
        });
        return;
      }

      // Save to database
      const laboratoryData = {
        exporterId,
        laboratoryName,
        address,
        certificationNumber: null as any, // Will be assigned by ECTA
        certifiedDate: null as any,
        expiryDate: null as any,
        status: 'PENDING' as const,
        equipment: equipment || [],
        hasRoastingFacility: hasRoastingFacility || false,
        hasCuppingRoom: hasCuppingRoom || false,
        hasSampleStorage: hasSampleStorage || false,
        inspectionReports: [],
      };

      const laboratory = await this.repository.createLaboratory(laboratoryData);

      logger.info('Laboratory registered', { exporterId, laboratoryName });

      res.status(201).json({
        success: true,
        message: 'Laboratory registered. Awaiting ECTA inspection and certification.',
        data: laboratory,
      });
    } catch (error: any) {
      logger.error('Failed to register laboratory', { error: error.message, userId: req.user?.id });
      res.status(500).json({
        success: false,
        message: 'Failed to register laboratory',
        error: error.message,
      });
    }
  };

  /**
   * Register coffee taster
   */
  public registerTaster = async (
    req: AuthenticatedRequest,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      // Get exporterId from userId
      const profile = await this.repository.getExporterProfileByUserId(userId);
      if (!profile) {
        res.status(404).json({
          success: false,
          message: 'Exporter profile not found. Please register first.',
        });
        return;
      }
      const exporterId = profile.exporterId;

      const {
        fullName,
        dateOfBirth,
        nationalId,
        qualificationLevel,
        qualificationDocument,
        proficiencyCertificateNumber,
        certificateIssueDate,
        certificateExpiryDate,
        employmentStartDate,
        employmentContract,
      } = req.body;

      if (!fullName || !proficiencyCertificateNumber) {
        res.status(400).json({
          success: false,
          message: 'Taster name and proficiency certificate number are required',
        });
        return;
      }

      // Save to database
      const tasterData = {
        exporterId,
        fullName,
        dateOfBirth,
        nationalId,
        qualificationLevel,
        qualificationDocument,
        proficiencyCertificateNumber,
        certificateIssueDate,
        certificateExpiryDate,
        employmentStartDate,
        employmentContract,
        isExclusiveEmployee: true,
        status: 'PENDING' as const,
      };

      const taster = await this.repository.createTaster(tasterData);

      logger.info('Coffee taster registered', { exporterId, fullName });

      res.status(201).json({
        success: true,
        message: 'Taster registered. Awaiting ECTA verification.',
        data: taster,
      });
    } catch (error: any) {
      logger.error('Failed to register taster', { error: error.message, userId: req.user?.id });
      res.status(500).json({
        success: false,
        message: 'Failed to register taster',
        error: error.message,
      });
    }
  };

  /**
   * Apply for competence certificate
   */
  public applyForCompetenceCertificate = async (
    req: AuthenticatedRequest,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      // Get exporterId from userId
      const profile = await this.repository.getExporterProfileByUserId(userId);
      if (!profile) {
        res.status(404).json({
          success: false,
          message: 'Exporter profile not found. Please register first.',
        });
        return;
      }
      const exporterId = profile.exporterId;

      // Validate prerequisites
      const validation = await ectaPreRegistrationService.validateExporter(exporterId);

      if (!validation.hasCertifiedLaboratory) {
        res.status(400).json({
          success: false,
          message: 'Cannot apply for competence certificate without certified laboratory',
          requiredActions: ['Register and certify laboratory with ECTA'],
        });
        return;
      }

      if (!validation.hasQualifiedTaster) {
        res.status(400).json({
          success: false,
          message: 'Cannot apply for competence certificate without qualified taster',
          requiredActions: ['Register qualified taster with valid proficiency certificate'],
        });
        return;
      }

      const {
        applicationReason,
        additionalDocuments,
        facilityDescription,
      } = req.body;

      // Create application with competence data from req.body
      const applicationData = {
        exporterId,
        applicationReason: applicationReason || null,
        additionalDocuments: additionalDocuments || [],
        facilityDescription: facilityDescription || null,
        status: 'PENDING_REVIEW' as const,
        applicationDate: new Date().toISOString(),
        applicantUserId: userId,
      };

      const application = await this.repository.createCompetenceApplication(applicationData);

      logger.info('Competence certificate application submitted', { exporterId, applicationId: application.id });

      res.status(201).json({
        success: true,
        message: 'Competence certificate application submitted. ECTA will schedule facility inspection.',
        data: {
          applicationId: application.id,
          exporterId,
          status: 'PENDING_REVIEW',
          submittedAt: applicationData.applicationDate,
          nextSteps: [
            'ECTA will contact you to schedule facility inspection',
            'Prepare all required documentation',
            'Ensure laboratory and storage facilities are ready for inspection',
          ],
        },
      });
    } catch (error: any) {
      logger.error('Failed to apply for competence certificate', { error: error.message, userId: req.user?.id });
      res.status(500).json({
        success: false,
        message: 'Failed to apply for competence certificate',
        error: error.message,
      });
    }
  };

  /**
   * Apply for export license
   */
  public applyForExportLicense = async (
    req: AuthenticatedRequest,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      // Get exporterId from userId
      const profile = await this.repository.getExporterProfileByUserId(userId);
      if (!profile) {
        res.status(404).json({
          success: false,
          message: 'Exporter profile not found. Please register first.',
        });
        return;
      }
      const exporterId = profile.exporterId;

      // Validate prerequisites
      const validation = await ectaPreRegistrationService.validateExporter(exporterId);

      if (!validation.hasCompetenceCertificate) {
        res.status(400).json({
          success: false,
          message: 'Cannot apply for export license without competence certificate',
          requiredActions: validation.requiredActions,
        });
        return;
      }

      const {
        eicRegistrationNumber,
        requestedCoffeeTypes,
        requestedOrigins,
      } = req.body;

      if (!eicRegistrationNumber) {
        res.status(400).json({
          success: false,
          message: 'EIC registration number is required',
        });
        return;
      }

      // Create license application in local database
      const applicationData = {
        exporterId,
        eicRegistrationNumber,
        requestedCoffeeTypes: requestedCoffeeTypes || ['ARABICA', 'ROBUSTA'],
        requestedOrigins: requestedOrigins || ['SIDAMA', 'YIRGACHEFFE', 'HARRAR'],
        status: 'PENDING' as const,
        applicationDate: new Date().toISOString(),
        applicantUserId: userId,
      };

      // Store application in database
      await this.repository.createLicenseApplication(applicationData);

      // Forward application to ECTA API with retry logic
      await this.forwardLicenseApplicationWithRetry(
        exporterId,
        eicRegistrationNumber,
        applicationData,
        profile,
        req.user?.username || 'unknown'
      );

      logger.info('Export license application submitted', { exporterId, eicRegistrationNumber });

      res.json({
        success: true,
        message: 'Export license application submitted. Awaiting ECTA review.',
        data: {
          exporterId,
          eicRegistrationNumber,
          requestedCoffeeTypes: applicationData.requestedCoffeeTypes,
          requestedOrigins: applicationData.requestedOrigins,
          status: 'PENDING',
          submittedAt: applicationData.applicationDate,
          nextSteps: [
            'ECTA will review your application',
            'Ensure all documents are up to date',
            'License will be issued upon approval',
          ],
        },
      });
    } catch (error: any) {
      logger.error('Failed to apply for export license', { error: error.message, userId: req.user?.id });
      res.status(500).json({
        success: false,
        message: 'Failed to apply for export license',
        error: error.message,
      });
    }
  };

  /**
   * Check qualification status
   */
  public checkQualificationStatus = async (
    req: AuthenticatedRequest,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      // Get exporterId from userId
      const profile = await this.repository.getExporterProfileByUserId(userId);
      if (!profile) {
        res.status(404).json({
          success: false,
          message: 'Exporter profile not found. Please register first.',
        });
        return;
      }
      const exporterId = profile.exporterId;

      const validation = await ectaPreRegistrationService.validateExporter(exporterId);
      const canExport = await ectaPreRegistrationService.canCreateExportRequest(exporterId);

      res.json({
        success: true,
        data: {
          validation,
          canCreateExportRequest: canExport.allowed,
          reason: canExport.reason,
          requiredActions: canExport.requiredActions,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to check qualification status',
        error: error.message,
      });
    }
  };

  /**
   * Get my dashboard (360-degree view)
   */
  public getMyDashboard = async (
    req: AuthenticatedRequest,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      // Get exporterId from userId
      const profile = await this.repository.getExporterProfileByUserId(userId);
      if (!profile) {
        res.status(404).json({
          success: false,
          message: 'Exporter profile not found. Please register first.',
        });
        return;
      }

      // Get all related data
      const validation = await ectaPreRegistrationService.validateExporter(profile.exporterId);
      const laboratories = await pool.query(
        'SELECT * FROM coffee_laboratories WHERE exporter_id = $1',
        [profile.exporterId]
      );
      const tasters = await pool.query(
        'SELECT * FROM coffee_tasters WHERE exporter_id = $1',
        [profile.exporterId]
      );
      const competenceCerts = await pool.query(
        'SELECT * FROM competence_certificates WHERE exporter_id = $1',
        [profile.exporterId]
      );
      const licenses = await pool.query(
        'SELECT * FROM export_licenses WHERE exporter_id = $1',
        [profile.exporterId]
      );

      const laboratory = laboratories.rows[0] || null;
      const taster = tasters.rows[0] || null;
      const competenceCert = competenceCerts.rows[0] || null;
      const license = licenses.rows[0] || null;

      // Build dashboard response
      const dashboard = {
        identity: {
          exporterId: profile.exporterId,
          businessName: profile.businessName,
          tin: profile.tin,
          registrationNumber: profile.registrationNumber,
          businessType: profile.businessType,
        },
        contact: {
          contactPerson: profile.contactPerson,
          email: profile.email,
          phone: profile.phone,
          officeAddress: profile.officeAddress,
          city: profile.city,
          region: profile.region,
        },
        compliance: {
          profileStatus: profile.status,
          profileApproved: profile.status === 'ACTIVE',
          capitalVerified: profile.capitalVerified,
          laboratoryStatus: laboratory?.status || null,
          laboratoryApproved: laboratory?.status === 'ACTIVE',
          tasterStatus: taster?.status || null,
          tasterApproved: taster?.status === 'ACTIVE',
          competenceStatus: competenceCert?.status || null,
          competenceApproved: competenceCert?.status === 'ACTIVE',
          licenseStatus: license?.status || null,
          licenseApproved: license?.status === 'ACTIVE',
          isFullyQualified: validation.isValid,
        },
        documents: {
          registrationNumber: profile.registrationNumber,
          laboratoryCertificationNumber: laboratory?.certificationNumber || null,
          tasterCertificateNumber: taster?.proficiencyCertificateNumber || null,
          competenceCertificateNumber: competenceCert?.certificateNumber || null,
          exportLicenseNumber: license?.licenseNumber || null,
          eicRegistrationNumber: license?.eicRegistrationNumber || null,
        },
        validation: {
          isValid: validation.isValid,
          issues: validation.issues,
          requiredActions: validation.requiredActions,
        },
        metadata: {
          lastUpdated: profile.updatedAt || profile.createdAt,
          createdAt: profile.createdAt,
        },
      };

      res.json({
        success: true,
        data: dashboard,
      });
    } catch (error: any) {
      logger.error('Failed to get dashboard', { error: error.message, userId: req.user?.id });
      res.status(500).json({
        success: false,
        message: 'Failed to get dashboard',
        error: error.message,
      });
    }
  };

  /**
   * Forward license application to ECTA with retry logic
   */
  private async forwardLicenseApplicationWithRetry(
    exporterId: string,
    eicRegistrationNumber: string,
    applicationData: any,
    profile: any,
    submittedBy: string
  ): Promise<void> {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const serviceToken = process.env.SERVICE_AUTH_TOKEN || '';
        const serviceId = process.env.SERVICE_ID || 'exporter-portal';

        await axios.post(
          `${config.ECTA_API}/api/preregistration/license-applications`,
          {
            exporterId,
            eicRegistrationNumber,
            requestedCoffeeTypes: applicationData.requestedCoffeeTypes,
            requestedOrigins: applicationData.requestedOrigins,
            applicantProfile: profile,
            submittedAt: applicationData.applicationDate,
            submittedBy,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${serviceToken}`,
              'X-Service-ID': serviceId,
              'X-Request-ID': uuidv4(),
            },
            timeout: 10000,
          }
        );

        logger.info('License application forwarded to ECTA', {
          exporterId,
          eicRegistrationNumber,
          attempt,
        });
        return;
      } catch (error: any) {
        logger.warn('Failed to forward application to ECTA', {
          error: error.message,
          attempt,
          exporterId
        });
        if (attempt === MAX_RETRIES) {
          throw error; // Propagate error on final attempt
        }
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    }
  }

  /**
   * Get all applications for the current exporter
   * Aggregates Profile, Lab, Taster, Competence, and License applications
   */
  public getMyApplications = async (
    req: AuthenticatedRequest,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      // Get exporterId from userId
      const profile = await this.repository.getExporterProfileByUserId(userId);
      if (!profile) {
        // If no profile, returns empty list (conceptually correct as they haven't applied for anything yet)
        res.json({
          success: true,
          data: [],
        });
        return;
      }
      const exporterId = profile.exporterId;

      // Parallel fetch of all related records
      const [laboratories, tasters, competenceCerts, licenses] = await Promise.all([
        pool.query('SELECT * FROM coffee_laboratories WHERE exporter_id = $1', [exporterId]),
        pool.query('SELECT * FROM coffee_tasters WHERE exporter_id = $1', [exporterId]),
        pool.query('SELECT * FROM competence_certificates WHERE exporter_id = $1', [exporterId]),
        pool.query('SELECT * FROM export_licenses WHERE exporter_id = $1', [exporterId]),
      ]);

      const applications: any[] = [];

      // Helper to determine progress based on status
      const getProgress = (status: string) => {
        switch (status) {
          case 'APPROVED': return 100;
          case 'REJECTED': return 100;
          case 'ACTIVE': return 100;
          case 'PENDING_APPROVAL': return 50;
          case 'PENDING_REVIEW': return 50;
          case 'UNDER_REVIEW': return 75;
          case 'PENDING': return 25;
          default: return 0;
        }
      };

      // 1. Profile Application
      applications.push({
        id: profile.registrationNumber || 'PROFILE-INIT',
        type: 'Exporter Registration',
        status: profile.status === 'ACTIVE' ? 'APPROVED' : (profile.status === 'PENDING_APPROVAL' ? 'PENDING' : profile.status),
        submittedDate: new Date(profile.createdAt).toISOString().split('T')[0],
        progress: getProgress(profile.status),
        reviewer: 'ECTA Authority',
        documents: profile.capitalProofDocument ? ['Capital Proof'] : [],
        comments: profile.rejectionReason ? (profile.rejectionReason || 'Profile application rejected') : 'Exporter profile registration',
      });

      // 2. Laboratories
      laboratories.rows.forEach(lab => {
        applications.push({
          id: lab.certification_number || `LAB-${lab.laboratory_id.substring(0, 8)}`,
          type: 'Laboratory Certification',
          status: lab.status === 'ACTIVE' ? 'APPROVED' : lab.status,
          submittedDate: new Date(lab.created_at).toISOString().split('T')[0],
          progress: getProgress(lab.status),
          reviewer: 'ECTA Inspection Team',
          documents: ['Lab Layout', 'Equipment List'],
          comments: lab.status === 'REJECTED' ? (lab.rejection_reason || 'Lab certification rejected') : `Laboratory: ${lab.laboratory_name}`,
        });
      });

      // 3. Tasters
      tasters.rows.forEach(taster => {
        applications.push({
          id: taster.proficiency_certificate_number || `TASTER-${taster.taster_id.substring(0, 8)}`,
          type: 'Coffee Taster Registration',
          status: taster.status === 'ACTIVE' ? 'APPROVED' : taster.status,
          submittedDate: new Date(taster.created_at).toISOString().split('T')[0],
          progress: getProgress(taster.status),
          reviewer: 'ECTA Certification',
          documents: [taster.qualification_document].filter(Boolean),
          comments: taster.status === 'REJECTED' ? (taster.rejection_reason || 'Taster registration rejected') : `Taster: ${taster.full_name}`,
        });
      });

      // 4. Competence Certificates
      competenceCerts.rows.forEach(cert => {
        applications.push({
          id: cert.certificate_number || `COMP-${cert.certificate_id.substring(0, 8)}`,
          type: 'Competence Certificate',
          status: cert.status === 'ACTIVE' ? 'APPROVED' : cert.status,
          submittedDate: new Date(cert.created_at).toISOString().split('T')[0],
          progress: getProgress(cert.status),
          reviewer: 'ECTA Official',
          documents: cert.additional_documents || [],
          comments: cert.status === 'REJECTED' ? (cert.rejection_reason || 'Competence certificate rejected') : 'Competence Certificate Application',
        });
      });

      // 5. Export Licenses
      licenses.rows.forEach(license => {
        applications.push({
          id: license.license_number || `LIC-${license.license_id.substring(0, 8)}`,
          type: 'Export License',
          status: license.status === 'ACTIVE' ? 'APPROVED' : license.status,
          submittedDate: new Date(license.created_at).toISOString().split('T')[0],
          progress: getProgress(license.status),
          reviewer: 'ECTA Licensing Dept',
          documents: ['EIC Registration'],
          comments: license.status === 'REJECTED' ? (license.rejection_reason || 'License application rejected') : 'Annual Export License',
        });
      });

      // Sort by date descending
      applications.sort((a, b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime());

      res.json({
        success: true,
        data: applications,
      });

    } catch (error: any) {
      logger.error('Failed to get applications', { error: error.message, userId: req.user?.id });
      res.status(500).json({
        success: false,
        message: 'Failed to get applications',
        error: error.message,
      });
    }
  };


  /**
   * Get my laboratories
   */
  public getMyLaboratories = async (
    req: AuthenticatedRequest,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const profile = await this.repository.getExporterProfileByUserId(userId);
      if (!profile) {
        res.status(404).json({ success: false, message: 'Exporter profile not found' });
        return;
      }

      const result = await pool.query(
        'SELECT * FROM coffee_laboratories WHERE exporter_id = $1 ORDER BY created_at DESC',
        [profile.exporterId]
      );

      res.json({ success: true, data: result.rows });
    } catch (error: any) {
      logger.error('Failed to get laboratories', { error: error.message });
      res.status(500).json({ success: false, message: 'Failed to get laboratories' });
    }
  };

  /**
   * Get my tasters
   */
  public getMyTasters = async (
    req: AuthenticatedRequest,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const profile = await this.repository.getExporterProfileByUserId(userId);
      if (!profile) {
        res.status(404).json({ success: false, message: 'Exporter profile not found' });
        return;
      }

      const result = await pool.query(
        'SELECT * FROM coffee_tasters WHERE exporter_id = $1 ORDER BY created_at DESC',
        [profile.exporterId]
      );

      res.json({ success: true, data: result.rows });
    } catch (error: any) {
      logger.error('Failed to get tasters', { error: error.message });
      res.status(500).json({ success: false, message: 'Failed to get tasters' });
    }
  };

  /**
   * Get my competence certificates
   */
  public getMyCompetenceCertificates = async (
    req: AuthenticatedRequest,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const profile = await this.repository.getExporterProfileByUserId(userId);
      if (!profile) {
        res.status(404).json({ success: false, message: 'Exporter profile not found' });
        return;
      }

      const result = await pool.query(
        'SELECT * FROM competence_certificates WHERE exporter_id = $1 ORDER BY created_at DESC',
        [profile.exporterId]
      );

      res.json({ success: true, data: result.rows });
    } catch (error: any) {
      logger.error('Failed to get competence certificates', { error: error.message });
      res.status(500).json({ success: false, message: 'Failed to get competence certificates' });
    }
  };

  /**
   * Get my export licenses
   */
  public getMyExportLicenses = async (
    req: AuthenticatedRequest,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const profile = await this.repository.getExporterProfileByUserId(userId);
      if (!profile) {
        res.status(404).json({ success: false, message: 'Exporter profile not found' });
        return;
      }

      const result = await pool.query(
        'SELECT * FROM export_licenses WHERE exporter_id = $1 ORDER BY created_at DESC',
        [profile.exporterId]
      );

      res.json({ success: true, data: result.rows });
    } catch (error: any) {
      logger.error('Failed to get export licenses', { error: error.message });
      res.status(500).json({ success: false, message: 'Failed to get export licenses' });
    }
  };
}
