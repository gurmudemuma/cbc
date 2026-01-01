import { Router } from 'express';
import { ExportController } from '../controllers/export.controller';
import { authMiddleware } from '../middleware/auth.middleware';
<<<<<<< HEAD
import { validateRequest, ApproveQualitySchema, RejectSchema } from '@shared/validation.schemas';
=======
import { validateRequest, ApproveQualitySchema, RejectSchema } from '../../../shared/validation.schemas';
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665

// Temporary role-based middleware until shared middleware is fully implemented
const requireOrganization = (allowedOrgs: string[]) => {
  return (req: any, res: any, next: any) => {
    const userOrg = req.user?.organizationId?.toLowerCase();
    if (!allowedOrgs.some(org => org === userOrg || org === userOrg?.replace('-', ''))) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required organizations: ${allowedOrgs.join(', ')}`
      });
    }
    next();
  };
};

const requireAction = (action: string) => {
  return (req: any, res: any, next: any) => {
    const userOrg = req.user?.organizationId?.toLowerCase();
    const userRole = req.user?.role?.toLowerCase();
<<<<<<< HEAD

    // Commercial Bank specific permissions
    const isCommercialBank = userOrg === 'commercial-bank' || userOrg === 'commercialbank' || userOrg === 'commercial_bank';

=======
    
    // Commercial Bank specific permissions
    const isCommercialBank = userOrg === 'commercial-bank' || userOrg === 'commercialbank';
    
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
    if (!isCommercialBank) {
      return res.status(403).json({
        success: false,
        message: `Action ${action} not permitted for organization: ${userOrg}`
      });
    }
<<<<<<< HEAD

=======
    
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
    next();
  };
};

const router = Router();
const exportController = new ExportController();

// All routes require authentication
router.use(authMiddleware);

// Create new export - Commercial Bank can create exports on behalf of exporters
<<<<<<< HEAD
router.post('/',
=======
router.post('/', 
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
  requireAction('CREATE_EXPORT'),
  exportController.createExport
);

// Get all exports - Commercial Bank can view all exports
<<<<<<< HEAD
router.get('/',
=======
router.get('/', 
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
  requireAction('VIEW_ALL_EXPORTS'),
  exportController.getAllExports
);

<<<<<<< HEAD
// Get dashboard stats
router.get('/dashboard/stats',
  requireAction('VIEW_ALL_EXPORTS'),
  exportController.getBankStats
);

// Get single export - Commercial Bank can view all exports
router.get('/:exportId',
=======
// Get single export - Commercial Bank can view all exports
router.get('/:exportId', 
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
  requireAction('VIEW_ALL_EXPORTS'),
  exportController.getExport
);

// ===== COMMERCIAL BANK SPECIFIC TASKS =====

// Get exports pending document verification - Commercial Bank specific
<<<<<<< HEAD
router.get('/pending/documents',
=======
router.get('/pending/documents', 
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
  requireAction('VERIFY_DOCUMENTS'),
  exportController.getPendingDocuments
);

// Verify export documents (Commercial Bank's responsibility)
router.post('/:exportId/documents/verify',
  requireAction('VERIFY_DOCUMENTS'),
  exportController.approveDocuments
);

// Reject documents (Commercial Bank's responsibility)
router.post('/:exportId/documents/reject',
  requireAction('VERIFY_DOCUMENTS'),
  exportController.rejectDocuments
);

// Submit FX request to NBE (after document verification)
router.post('/:exportId/fx/submit',
  requireAction('SUBMIT_FX_REQUEST'),
  exportController.submitFXApplication
);

// Get FX submission status
router.get('/:exportId/fx/status',
  requireOrganization(['commercial-bank']),
  exportController.getFXStatus
);

export default router;
