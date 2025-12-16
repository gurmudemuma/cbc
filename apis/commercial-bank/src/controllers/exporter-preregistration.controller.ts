import { Response, NextFunction } from 'express';
import { logger } from '../../../shared/logger';
import axios from 'axios';
import { BusinessType } from '../../../shared/models/ecta-preregistration.model';
import { ectaPreRegistrationService } from '../../../shared/services/ecta-preregistration.service';
import { EctaPreRegistrationRepository } from '../../../shared/database/repositories/ecta-preregistration.repository';
import { AuthenticatedRequest } from '../../../shared/middleware/auth.middleware';
import pool from '../../../shared/database/db.config';
import { config } from '../config';

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
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const {
        businessName,
        tin,
        registrationNumber,
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
      if (!businessName || !tin || !registrationNumber || !businessType) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields',
        });
        return;
      }

      // Validate capital requirement
      const requiredCapital = ectaPreRegistrationService.getMinimumCapitalRequirement(
        businessType as BusinessType
      );

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
        capitalProofDocument,
        officeAddress,
        city,
        region,
        contactPerson,
        email,
        phone,
        status: 'PENDING' as const,
      };

      const profile = await this.repository.createExporterProfile(profileData);

      res.status(201).json({
        success: true,
        message: 'Exporter profile registered. Awaiting ECTA approval.',
        data: profile,
      });
    } catch (error: any) {
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

      res.json({
        success: true,
        data: profile,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch profile',
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
        certificationNumber: '', // Will be assigned by ECTA
        certifiedDate: '',
        expiryDate: '',
        status: 'PENDING' as const,
        equipment: equipment || [],
        hasRoastingFacility: hasRoastingFacility || false,
        hasCuppingRoom: hasCuppingRoom || false,
        hasSampleStorage: hasSampleStorage || false,
        inspectionReports: [],
      };

      const laboratory = await this.repository.createLaboratory(laboratoryData);

      res.status(201).json({
        success: true,
        message: 'Laboratory registered. Awaiting ECTA inspection and certification.',
        data: laboratory,
      });
    } catch (error: any) {
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

      res.status(201).json({
        success: true,
        message: 'Taster registered. Awaiting ECTA verification.',
        data: taster,
      });
    } catch (error: any) {
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

      // TODO: Create application with competence data from req.body
      res.json({
        success: true,
        message:
          'Competence certificate application submitted. ECTA will schedule facility inspection.',
        data: {
          exporterId,
          status: 'PENDING',
          nextSteps: [
            'ECTA will contact you to schedule facility inspection',
            'Prepare all required documentation',
            'Ensure laboratory and storage facilities are ready for inspection',
          ],
        },
      });
    } catch (error: any) {
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

      const { eicRegistrationNumber, requestedCoffeeTypes, requestedOrigins } = req.body;

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

      // Forward application to ECTA API
      try {
        const ectaResponse = await axios.post(
          `${config.ECTA_API}/api/preregistration/license-applications`,
          {
            exporterId,
            eicRegistrationNumber,
            requestedCoffeeTypes: applicationData.requestedCoffeeTypes,
            requestedOrigins: applicationData.requestedOrigins,
            applicantProfile: profile,
            submittedAt: applicationData.applicationDate,
            submittedBy: req.user?.username || 'unknown',
          },
          {
            headers: {
              'Content-Type': 'application/json',
              // TODO: Add authentication headers when available
            },
            timeout: 10000, // 10 second timeout
          }
        );

        // ...

        logger.info('License application forwarded to ECTA', { response: ectaResponse.data });
      } catch (ectaError: any) {
        console.error('Failed to forward application to ECTA:', ectaError.message);
        // Continue with local response even if ECTA forwarding fails
        // In production, you might want to implement retry logic or queue the request
      }

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
}
