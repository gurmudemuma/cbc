import { Request, Response, NextFunction } from 'express';
import { EctaPreRegistrationRepository } from '../database/repositories/ecta-preregistration.repository';
import pool from '../database/db.config';
import { ectaPreRegistrationService } from '../services/ecta-preregistration.service';
import { logger } from '../logger';

/**
 * Shared Exporter Controller
 * Centralized implementation for exporter-related endpoints used by
 * both Exporter Portal and Commercial Bank APIs.
 */
export class SharedExporterController {
  private repository: EctaPreRegistrationRepository;

  constructor() {
    this.repository = new EctaPreRegistrationRepository(pool);
  }

  public getQualificationStatus = async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const profile = await this.repository.getExporterProfileByUserId(userId);
      if (!profile) {
        res
          .status(404)
          .json({ success: false, message: 'Exporter profile not found. Please register first.' });
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
      logger.error('Failed to check qualification status', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to check qualification status',
        error: error.message,
      });
    }
  };

  public registerProfile = async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
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
      } = req.body as any;

      if (!businessName || !tin || !registrationNumber || !businessType) {
        res.status(400).json({ success: false, message: 'Missing required fields' });
        return;
      }

      const requiredCapital = ectaPreRegistrationService.getMinimumCapitalRequirement(businessType);

      if (businessType !== 'FARMER' && (minimumCapital || 0) < requiredCapital) {
        res.status(400).json({
          success: false,
          message: `Minimum capital requirement not met. Required: ETB ${requiredCapital.toLocaleString()}`,
          requiredCapital,
        });
        return;
      }

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
        status: 'PENDING_APPROVAL' as const,
      };

      const profile = await this.repository.createExporterProfile(profileData as any);

      res.status(201).json({
        success: true,
        message: 'Exporter profile registered. Awaiting ECTA approval.',
        data: profile,
      });
    } catch (error: any) {
      logger.error('Failed to register profile', { error: error.message });
      res
        .status(500)
        .json({ success: false, message: 'Failed to register profile', error: error.message });
    }
  };

  public getProfile = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const profile = await this.repository.getExporterProfileByUserId(userId);
      if (!profile) {
        res
          .status(404)
          .json({ success: false, message: 'Exporter profile not found. Please register first.' });
        return;
      }

      res.json({ success: true, data: profile });
    } catch (error: any) {
      logger.error('Failed to get profile', { error: error.message });
      res
        .status(500)
        .json({ success: false, message: 'Failed to get profile', error: error.message });
    }
  };

  public applyLicense = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const profile = await this.repository.getExporterProfileByUserId(userId);
      if (!profile) {
        res
          .status(404)
          .json({ success: false, message: 'Exporter profile not found. Please register first.' });
        return;
      }
      const exporterId = profile.exporterId;

      const validation = await ectaPreRegistrationService.validateExporter(exporterId);
      if (!validation.hasCompetenceCertificate) {
        res.status(400).json({
          success: false,
          message: 'Cannot apply for export license without competence certificate',
          requiredActions: validation.requiredActions,
        });
        return;
      }

      const { eicRegistrationNumber, requestedCoffeeTypes, requestedOrigins } = req.body as any;
      if (!eicRegistrationNumber) {
        res.status(400).json({ success: false, message: 'EIC registration number is required' });
        return;
      }

      const applicationData = {
        exporterId,
        eicRegistrationNumber,
        requestedCoffeeTypes: requestedCoffeeTypes || ['ARABICA', 'ROBUSTA'],
        requestedOrigins: requestedOrigins || ['SIDAMA', 'YIRGACHEFFE', 'HARRAR'],
        status: 'PENDING' as const,
        applicationDate: new Date().toISOString(),
        applicantUserId: userId,
      };

      await this.repository.createLicenseApplication(applicationData as any);

      // Forward application to ECTA API if exporter-portal config is present (the portal adapter used to do this)
      // The portal-level controller can opt to forward; shared controller keeps core persistence and returns success.

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
        },
      });
    } catch (error: any) {
      logger.error('Failed to apply for export license', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to apply for export license',
        error: error.message,
      });
    }
  };

  public registerLaboratory = async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const profile = await this.repository.getExporterProfileByUserId(userId);
      if (!profile) {
        res
          .status(404)
          .json({ success: false, message: 'Exporter profile not found. Please register first.' });
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
      } = req.body as any;
      if (!laboratoryName || !address) {
        res
          .status(400)
          .json({ success: false, message: 'Laboratory name and address are required' });
        return;
      }

      const laboratoryData = {
        exporterId,
        laboratoryName,
        address,
        certificationNumber: '',
        certifiedDate: '',
        expiryDate: '',
        status: 'PENDING' as const,
        equipment: equipment || [],
        hasRoastingFacility: hasRoastingFacility || false,
        hasCuppingRoom: hasCuppingRoom || false,
        hasSampleStorage: hasSampleStorage || false,
        inspectionReports: [],
      };

      const laboratory = await this.repository.createLaboratory(laboratoryData as any);
      res.status(201).json({
        success: true,
        message: 'Laboratory registered. Awaiting ECTA inspection and certification.',
        data: laboratory,
      });
    } catch (error: any) {
      logger.error('Failed to register laboratory', { error: error.message });
      res
        .status(500)
        .json({ success: false, message: 'Failed to register laboratory', error: error.message });
    }
  };

  public registerTaster = async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const profile = await this.repository.getExporterProfileByUserId(userId);
      if (!profile) {
        res
          .status(404)
          .json({ success: false, message: 'Exporter profile not found. Please register first.' });
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
      } = req.body as any;

      if (!fullName || !proficiencyCertificateNumber) {
        res.status(400).json({
          success: false,
          message: 'Taster name and proficiency certificate number are required',
        });
        return;
      }

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

      const taster = await this.repository.createTaster(tasterData as any);
      res.status(201).json({
        success: true,
        message: 'Taster registered. Awaiting ECTA verification.',
        data: taster,
      });
    } catch (error: any) {
      logger.error('Failed to register taster', { error: error.message });
      res
        .status(500)
        .json({ success: false, message: 'Failed to register taster', error: error.message });
    }
  };

  public applyCompetence = async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const profile = await this.repository.getExporterProfileByUserId(userId);
      if (!profile) {
        res
          .status(404)
          .json({ success: false, message: 'Exporter profile not found. Please register first.' });
        return;
      }
      const exporterId = profile.exporterId;

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
      logger.error('Failed to apply for competence certificate', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to apply for competence certificate',
        error: error.message,
      });
    }
  };
}

export default SharedExporterController;
