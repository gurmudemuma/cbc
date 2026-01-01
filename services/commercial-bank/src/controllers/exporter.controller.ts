import { Request, Response, NextFunction } from 'express';
<<<<<<< HEAD
import { createLogger } from '@shared/logger';
=======
import { createLogger } from '../../../shared/logger';
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665

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
<<<<<<< HEAD

=======
  
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
  public getQualificationStatus = async (req: RequestWithUser, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }
<<<<<<< HEAD

=======
      
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
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

      // For now, return success
      // In a real implementation, this would register the profile with ECTA
<<<<<<< HEAD
      logger.info('Exporter profile registration', {
        userId: user.id,
=======
      logger.info('Exporter profile registration', { 
        userId: user.id, 
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
        organizationId: user.organizationId,
        profileData: { ...profileData, sensitiveData: '[REDACTED]' }
      });

      res.json({
        success: true,
        message: 'Profile registered successfully',
        data: {
          profileId: `profile_${user.organizationId}_${Date.now()}`,
          status: 'PENDING_APPROVAL',
          submittedAt: new Date().toISOString()
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
<<<<<<< HEAD

      // Validate required fields - match Exporter Portal expectations
      const requiredFields = ['eicRegistrationNumber'];
      const missingFields = requiredFields.filter(field => !licenseData[field]);

=======
      
      // Validate required fields - match Exporter Portal expectations
      const requiredFields = ['eicRegistrationNumber'];
      const missingFields = requiredFields.filter(field => !licenseData[field]);
      
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
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
<<<<<<< HEAD

=======
      
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
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
<<<<<<< HEAD

=======
      
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
      // Log the laboratory registration
      logger.info('Laboratory registration submitted', {
        userId: user.id,
        organizationId: user.organizationId,
        laboratoryName: laboratoryData.name
      });

      const registrationId = `lab_reg_${user.organizationId}_${Date.now()}`;
<<<<<<< HEAD

=======
      
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
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
<<<<<<< HEAD

=======
      
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
      // Log the taster registration
      logger.info('Coffee taster registration submitted', {
        userId: user.id,
        organizationId: user.organizationId,
        tasterName: tasterData.name
      });

      const registrationId = `taster_reg_${user.organizationId}_${Date.now()}`;
<<<<<<< HEAD

=======
      
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
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
<<<<<<< HEAD

=======
      
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
      // Log the competence certificate application
      logger.info('Competence certificate application submitted', {
        userId: user.id,
        organizationId: user.organizationId
      });

      const applicationId = `comp_app_${user.organizationId}_${Date.now()}`;
<<<<<<< HEAD

=======
      
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
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
