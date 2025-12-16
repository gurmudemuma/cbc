import { Router } from 'express';
import { ExportController } from '../controllers/export.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  validateRequest,
  ApproveQualitySchema,
  RejectSchema,
} from '../../../shared/validation.schemas';

// Temporary role-based middleware until shared middleware is fully implemented
const requireOrganization = (allowedOrgs: string[]) => {
  return (req: any, res: any, next: any) => {
    const userOrg = req.user?.organizationId?.toLowerCase();
    if (!allowedOrgs.some((org) => org === userOrg || org === userOrg?.replace('-', ''))) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required organizations: ${allowedOrgs.join(', ')}`,
      });
    }
    next();
  };
};

const requireAction = (action: string) => {
  return (req: any, res: any, next: any) => {
    const userOrg = req.user?.organizationId?.toLowerCase();
    const userRole = req.user?.role?.toLowerCase();

    // Commercial Bank specific permissions
    const isCommercialBank = userOrg === 'commercial-bank' || userOrg === 'commercialbank';

    if (!isCommercialBank) {
      return res.status(403).json({
        success: false,
        message: `Action ${action} not permitted for organization: ${userOrg}`,
      });
    }

    next();
  };
};

const router = Router();
const exportController = new ExportController();

// All routes require authentication
router.use(authMiddleware);

// Get all exports - Commercial Bank can view all exports
router.get('/', requireAction('VIEW_ALL_EXPORTS'), exportController.getAllExports);

// Get single export - Commercial Bank can view all exports
router.get('/:exportId', requireAction('VIEW_ALL_EXPORTS'), exportController.getExport);

// ===== COMMERCIAL BANK SPECIFIC TASKS =====

// Get exports pending document verification - Commercial Bank specific
router.get(
  '/pending/documents',
  requireAction('VERIFY_DOCUMENTS'),
  exportController.getPendingDocuments
);

// Verify export documents (Commercial Bank's responsibility)
router.post(
  '/:exportId/documents/verify',
  requireAction('VERIFY_DOCUMENTS'),
  exportController.approveDocuments
);

// Reject documents (Commercial Bank's responsibility)
router.post(
  '/:exportId/documents/reject',
  requireAction('VERIFY_DOCUMENTS'),
  exportController.rejectDocuments
);

// Submit FX request to NBE (after document verification)
router.post(
  '/:exportId/fx/submit',
  requireAction('SUBMIT_FX_REQUEST'),
  exportController.submitFXApplication
);

// Get FX submission status
router.get(
  '/:exportId/fx/status',
  requireOrganization(['commercial-bank']),
  exportController.getFXStatus
);

export default router;
