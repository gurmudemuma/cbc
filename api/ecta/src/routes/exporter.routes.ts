import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware as authenticate } from '../../../shared/middleware/auth.middleware';

interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    organizationId: string;
    role: string;
  };
}

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================================================
// EXPORTER ENDPOINTS (Frontend compatibility)
// ============================================================================

// Get qualification status - proxy to preregistration
router.get('/qualification-status', async (req: AuthRequest, res: Response, _next: NextFunction) => {
  // This endpoint provides compatibility with frontend expectations
  // It returns the overall qualification status for an exporter
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    // Mock qualification status for now
    // In a real implementation, this would check the exporter's status
    // across all ECTA systems (licenses, certificates, etc.)
    res.json({
      success: true,
      data: {
        isQualified: false,
        hasProfile: false,
        hasLaboratory: false,
        hasTaster: false,
        hasCompetenceCertificate: false,
        hasExportLicense: false,
        nextStep: 'Register exporter profile',
        requiredActions: [
          'Complete exporter profile registration',
          'Register certified laboratory',
          'Register qualified coffee taster',
          'Apply for competence certificate',
          'Apply for export license'
        ]
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to get qualification status',
      error: error.message,
    });
  }
});

export default router;
