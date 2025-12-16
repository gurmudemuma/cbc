import { Router, Request, Response, NextFunction } from 'express';
import { logger } from '../../../shared/logger';
import { ExporterController } from '../controllers/exporter.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const exporterController = new ExporterController();

// Temporary role-based middleware until shared middleware is fully implemented
const requireRole = (allowedRoles: string[]) => {
  return (req: any, res: any, next: any) => {
    const userRole = req.user?.role?.toLowerCase();
    // For now, allow any authenticated user to access exporter endpoints
    // TODO: Implement proper role-based access control
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // ...

    logger.debug('Checking role access', { userRole, requiredRoles: allowedRoles });
    next();
  };
};

// All routes require authentication
router.use(authMiddleware);

// Exporter qualification status
router.get(
  '/qualification-status',
  requireRole(['exporter']),
  exporterController.getQualificationStatus
);

// Exporter profile registration
router.post('/profile/register', requireRole(['exporter']), exporterController.registerProfile);

// Get exporter profile
router.get('/profile', requireRole(['exporter']), exporterController.getProfile);

// Apply for export license
router.post('/license/apply', requireRole(['exporter']), exporterController.applyLicense);

// Register laboratory
router.post(
  '/laboratory/register',
  requireRole(['exporter']),
  exporterController.registerLaboratory
);

// Register coffee taster
router.post('/taster/register', requireRole(['exporter']), exporterController.registerTaster);

// Apply for competence certificate
router.post('/competence/apply', requireRole(['exporter']), exporterController.applyCompetence);

export default router;
