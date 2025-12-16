import { Router, Request, Response, NextFunction } from 'express';
import { ExporterController } from '../controllers/exporter.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();
const exporterController = new ExporterController();

/**
 * Temporary role-based middleware
 * The `authenticateToken` already enforces `exporter` role for this service,
 * but keep this middleware to mirror the commercial-bank behavior and to
 * allow future role flexibility.
 */
const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).user?.role?.toString()?.toLowerCase();
    if (!req || !(req as any).user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // If allowedRoles is empty, allow any authenticated user
    if (!allowedRoles || allowedRoles.length === 0) {
      return next();
    }

    if (!userRole || !allowedRoles.map(r => r.toLowerCase()).includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient role.',
      });
    }

    // Proceed
    next();
  };
};

// All exporter routes require authentication (and exporter role via authenticateToken)
router.use(authenticateToken);

// Qualification status
router.get(
  '/qualification-status',
  requireRole(['exporter']),
  exporterController.getQualificationStatus,
);

// Exporter profile registration
router.post(
  '/profile/register',
  requireRole(['exporter']),
  exporterController.registerProfile,
);

// Get own exporter profile
router.get(
  '/profile',
  requireRole(['exporter']),
  exporterController.getProfile,
);

// Apply for export license
router.post(
  '/license/apply',
  requireRole(['exporter']),
  exporterController.applyLicense,
);

// Register laboratory
router.post(
  '/laboratory/register',
  requireRole(['exporter']),
  exporterController.registerLaboratory,
);

// Register coffee taster
router.post(
  '/taster/register',
  requireRole(['exporter']),
  exporterController.registerTaster,
);

// Apply for competence certificate
router.post(
  '/competence/apply',
  requireRole(['exporter']),
  exporterController.applyCompetence,
);

export default router;
