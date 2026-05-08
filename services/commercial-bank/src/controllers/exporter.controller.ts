import { Request, Response, NextFunction } from 'express';
import { createLogger } from '@shared/logger';
import { EctaPreRegistrationRepository } from '@shared/database/repositories/ecta-preregistration.repository';
import { pool } from '@shared/database/pool';

const logger = createLogger('ExporterController');

interface AuthJWTPayload {
  id: string;
  username: string;
  organizationId: string;
  role: string;
  email?: string;
}

interface RequestWithUser extends Request {
  user?: AuthJWTPayload;
}

export class ExporterController {

  public getQualificationStatus = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      // For now, return a basic qualification status
      // In a real implementation, this would check ECTA pre-registration status
      const qualificationStatus = {
        canCreateExportRequest: true,
        isQualified: true,
        reason: 'Exporter is qualified to create export requests',
        requiredActions: [],
        lastUpdated: new Date().toISOString(),
        exporter: {
          id: user.organizationId,
          name: user.username,
          status: 'APPROVED'
        }
      };

      res.json({
        success: true,
        data: qualificationStatus
      });
    } catch (error: any) {
      logger.error('Failed to get qualification status', { error: error.message, userId: req.user?.id });
      res.status(500).json({
        success: false,
        message: 'Failed to get qualification status',
        error: error.message
      });
    }
  };

  public registerProfile = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }
      const profileData = req.body;

      // Create the profile in the database using the repository
      const repository = new EctaPreRegistrationRepository(pool);

      // Check if profile already exists
      const existingProfile = await repository.getExporterProfileByUserId(user.id);
      
      if (existingProfile) {
        logger.info('Exporter profile already exists', {
          userId: user.id,
          exporterId: existingProfile.exporterId,
          businessName: existingProfile.businessName
        });

        res.json({
          success: true,
          message: 'Profile already registered',
          data: {
            id: existingProfile.exporterId,
            profileId: existingProfile.exporterId,
            status: existingProfile.status,
            submittedAt: existingProfile.createdAt
          }
        });
        return;
      }

      const profile = await repository.createExporterProfile({
        userId: user.id,
        businessName: profileData.businessName,
        tin: profileData.tinNumber || `TIN-${Date.now()}`,
        registrationNumber: profileData.registrationNumber || `REG-${Date.now()}`,
        businessType: profileData.businessType || 'PRIVATE',
        minimumCapital: profileData.minimumCapital || 0,
        capitalVerified: false,
        capitalVerificationDate: null,
        capitalProofDocument: profileData.capitalVerificationDocument || null,
        officeAddress: profileData.address || '',
        city: profileData.city || '',
        region: profileData.region || '',
        contactPerson: profileData.contactPerson || '',
        email: profileData.email || user.email || '',
        phone: profileData.phone || '',
        status: 'PENDING_APPROVAL'
      });

      logger.info('Exporter profile created in database', {
        userId: user.id,
        exporterId: profile.exporterId,
        businessName: profile.businessName
      });

      res.json({
        success: true,
        message: 'Profile registered successfully',
        data: {
          id: profile.exporterId,
          profileId: profile.exporterId,
          status: profile.status,
          submittedAt: profile.createdAt
        }
      });
    } catch (error: any) {
      logger.error('Failed to register profile', { error: error.message, userId: req.user?.id });
      res.status(500).json({
        success: false,
        message: 'Failed to register profile',
        error: error.message
      });
    }
  };

  public getProfile = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      // For now, return a basic profile
      // In a real implementation, this would fetch from ECTA database
      const profile = {
        id: user.organizationId,
        name: user.username,
        email: user.email || `${user.username}@example.com`,
        organizationId: user.organizationId,
        status: 'APPROVED',
        registeredAt: '2024-01-01T00:00:00Z',
        lastUpdated: new Date().toISOString()
      };

      res.json({
        success: true,
        data: profile
      });
    } catch (error: any) {
      logger.error('Failed to get profile', { error: error.message, userId: req.user?.id });
      res.status(500).json({
        success: false,
        message: 'Failed to get profile',
        error: error.message
      });
    }
  };

  public applyLicense = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const licenseData = req.body;

      // Validate required fields - match Exporter Portal expectations
      const requiredFields = ['eicRegistrationNumber'];
      const missingFields = requiredFields.filter(field => !licenseData[field]);

      if (missingFields.length > 0) {
        res.status(400).json({
          success: false,
          message: 'EIC registration number is required',
          missingFields
        });
        return;
      }

      // Log the license application
      logger.info('Export license application submitted', {
        userId: user.id,
        organizationId: user.organizationId,
        eicRegistrationNumber: licenseData.eicRegistrationNumber,
        licenseType: licenseData.licenseType,
        annualExportVolume: licenseData.annualExportVolume
      });

      // In a real implementation, this would:
      // 1. Validate the application data
      // 2. Submit to ECTA for review
      // 3. Store in database
      // 4. Send notifications

      const applicationId = `license_app_${user.organizationId}_${Date.now()}`;

      res.json({
        success: true,
        message: 'Export license application submitted. Awaiting ECTA review.',
        data: {
          exporterId: user.organizationId,
          eicRegistrationNumber: licenseData.eicRegistrationNumber,
          requestedCoffeeTypes: licenseData.requestedCoffeeTypes,
          requestedOrigins: licenseData.requestedOrigins,
          status: 'PENDING',
          applicationId,
          submittedAt: new Date().toISOString(),
          nextSteps: [
            'ECTA will review your application',
            'Ensure all documents are up to date',
            'License will be issued upon approval'
          ]
        }
      });
    } catch (error: any) {
      logger.error('Failed to apply for license', { error: error.message, userId: req.user?.id });
      res.status(500).json({
        success: false,
        message: 'Failed to apply for export license',
        error: error.message
      });
    }
  };

  public registerLaboratory = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const laboratoryData = req.body;

      // Log the laboratory registration
      logger.info('Laboratory registration submitted', {
        userId: user.id,
        organizationId: user.organizationId,
        laboratoryName: laboratoryData.name
      });

      const registrationId = `lab_reg_${user.organizationId}_${Date.now()}`;

      res.json({
        success: true,
        message: 'Laboratory registration submitted successfully',
        data: {
          registrationId,
          status: 'PENDING_VERIFICATION',
          submittedAt: new Date().toISOString(),
          estimatedProcessingTime: '3-7 business days'
        }
      });
    } catch (error: any) {
      logger.error('Failed to register laboratory', { error: error.message, userId: req.user?.id });
      res.status(500).json({
        success: false,
        message: 'Failed to submit laboratory registration',
        error: error.message
      });
    }
  };

  public registerTaster = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const tasterData = req.body;

      // Log the taster registration
      logger.info('Coffee taster registration submitted', {
        userId: user.id,
        organizationId: user.organizationId,
        tasterName: tasterData.name
      });

      const registrationId = `taster_reg_${user.organizationId}_${Date.now()}`;

      res.json({
        success: true,
        message: 'Coffee taster registration submitted successfully',
        data: {
          registrationId,
          status: 'PENDING_CERTIFICATION',
          submittedAt: new Date().toISOString(),
          estimatedProcessingTime: '2-5 business days'
        }
      });
    } catch (error: any) {
      logger.error('Failed to register taster', { error: error.message, userId: req.user?.id });
      res.status(500).json({
        success: false,
        message: 'Failed to submit taster registration',
        error: error.message
      });
    }
  };

  public applyCompetence = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const competenceData = req.body;

      // Log the competence certificate application
      logger.info('Competence certificate application submitted', {
        userId: user.id,
        organizationId: user.organizationId
      });

      const applicationId = `comp_app_${user.organizationId}_${Date.now()}`;

      res.json({
        success: true,
        message: 'Competence certificate application submitted successfully',
        data: {
          applicationId,
          status: 'PENDING_REVIEW',
          submittedAt: new Date().toISOString(),
          estimatedProcessingTime: '7-14 business days',
          nextSteps: [
            'Application will be reviewed by ECTA',
            'Site inspection may be scheduled',
            'Certificate will be issued upon approval'
          ]
        }
      });
    } catch (error: any) {
      logger.error('Failed to apply for competence certificate', { error: error.message, userId: req.user?.id });
      res.status(500).json({
        success: false,
        message: 'Failed to submit competence certificate application',
        error: error.message
      });
    }
  };
}
