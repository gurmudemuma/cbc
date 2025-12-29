import { Router } from 'express';
import { ExportController } from '../controllers/export.controller';
<<<<<<< HEAD
import { authMiddleware, requireOrganization, requireAction } from '@shared/middleware/auth.middleware';
import { ExportAction } from '@shared/types';
=======
import { authMiddleware, requireOrganization, requireAction } from '../../../shared/middleware/auth.middleware';
import { ExportAction } from '../../../shared/types';
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665

const router = Router();
const exportController = new ExportController();

// All routes require authentication
router.use(authMiddleware);

// Get all exports - ECTA can view all exports
<<<<<<< HEAD
router.get('/exports',
=======
router.get('/exports', 
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
  requireOrganization(['ecta']),
  exportController.getAllExports
);

// Get single export - ECTA can view all exports
<<<<<<< HEAD
router.get('/exports/:exportId',
=======
router.get('/exports/:exportId', 
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
  requireOrganization(['ecta']),
  exportController.getExport
);

// Get pending quality inspections - ECTA specific action
<<<<<<< HEAD
router.get('/exports/pending/quality',
=======
router.get('/exports/pending/quality', 
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
  requireAction(ExportAction.CONDUCT_QUALITY_INSPECTION),
  exportController.getPendingQualityInspections
);

// Approve quality - ECTA specific action
<<<<<<< HEAD
router.post('/exports/:exportId/quality/approve',
=======
router.post('/exports/:exportId/quality/approve', 
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
  requireAction(ExportAction.APPROVE_QUALITY),
  exportController.approveQuality
);

// Reject quality - ECTA specific action
<<<<<<< HEAD
router.post('/exports/:exportId/quality/reject',
=======
router.post('/exports/:exportId/quality/reject', 
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
  requireAction(ExportAction.REJECT_QUALITY),
  exportController.rejectQuality
);

// Issue quality certificate - ECTA specific action
<<<<<<< HEAD
router.post('/exports/:exportId/quality/certificate',
=======
router.post('/exports/:exportId/quality/certificate', 
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
  requireAction(ExportAction.ISSUE_QUALITY_CERTIFICATE),
  exportController.issueQualityCertificate
);

// License management routes
<<<<<<< HEAD
router.get('/exports/pending/license',
=======
router.get('/exports/pending/license', 
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
  requireAction(ExportAction.ISSUE_LICENSE),
  exportController.getPendingLicenses
);

<<<<<<< HEAD
router.post('/exports/:exportId/license/approve',
=======
router.post('/exports/:exportId/license/approve', 
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
  requireAction(ExportAction.APPROVE_LICENSE),
  exportController.approveLicense
);

<<<<<<< HEAD
router.post('/exports/:exportId/license/reject',
=======
router.post('/exports/:exportId/license/reject', 
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
  requireAction(ExportAction.REJECT_LICENSE),
  exportController.rejectLicense
);

// Contract approval routes
<<<<<<< HEAD
router.get('/exports/pending/contract',
=======
router.get('/exports/pending/contract', 
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
  requireAction(ExportAction.APPROVE_CONTRACT),
  exportController.getPendingContracts
);

<<<<<<< HEAD
router.post('/exports/:exportId/contract/approve',
=======
router.post('/exports/:exportId/contract/approve', 
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
  requireAction(ExportAction.APPROVE_CONTRACT),
  exportController.approveContract
);

<<<<<<< HEAD
router.post('/exports/:exportId/contract/reject',
=======
router.post('/exports/:exportId/contract/reject', 
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
  requireAction(ExportAction.REJECT_CONTRACT),
  exportController.rejectContract
);

export default router;
