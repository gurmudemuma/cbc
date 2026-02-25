import { Router } from 'express';
import { ExportController } from '../controllers/export.controller';
import { authMiddleware, requireOrganization, requireAction } from '@shared/middleware/auth.middleware';
import { ExportAction } from '@shared/types';

const router = Router();
const exportController = new ExportController();

// All routes require authentication
router.use(authMiddleware);

// Get all exports - ECTA can view all exports
router.get('/exports',
  requireOrganization(['ecta']),
  exportController.getAllExports
);

// Get single export - ECTA can view all exports
router.get('/exports/:exportId',
  requireOrganization(['ecta']),
  exportController.getExport
);

// Get pending quality inspections - ECTA specific action
router.get('/exports/pending/quality',
  requireAction(ExportAction.CONDUCT_QUALITY_INSPECTION),
  exportController.getPendingQualityInspections
);

// Approve quality - ECTA specific action
router.post('/exports/:exportId/quality/approve',
  requireAction(ExportAction.APPROVE_QUALITY),
  exportController.approveQuality
);

// Reject quality - ECTA specific action
router.post('/exports/:exportId/quality/reject',
  requireAction(ExportAction.REJECT_QUALITY),
  exportController.rejectQuality
);

// Issue quality certificate - ECTA specific action
router.post('/exports/:exportId/quality/certificate',
  requireAction(ExportAction.ISSUE_QUALITY_CERTIFICATE),
  exportController.issueQualityCertificate
);

// License management routes
router.get('/exports/pending/license',
  requireAction(ExportAction.ISSUE_LICENSE),
  exportController.getPendingLicenses
);

router.post('/exports/:exportId/license/approve',
  requireAction(ExportAction.APPROVE_LICENSE),
  exportController.approveLicense
);

router.post('/exports/:exportId/license/reject',
  requireAction(ExportAction.REJECT_LICENSE),
  exportController.rejectLicense
);

// Contract approval routes
router.get('/exports/pending/contract',
  requireAction(ExportAction.APPROVE_CONTRACT),
  exportController.getPendingContracts
);

router.post('/exports/:exportId/contract/approve',
  requireAction(ExportAction.APPROVE_CONTRACT),
  exportController.approveContract
);

router.post('/exports/:exportId/contract/reject',
  requireAction(ExportAction.REJECT_CONTRACT),
  exportController.rejectContract
);

export default router;
