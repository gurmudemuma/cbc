import { Router } from 'express';
import { ExportController } from '../controllers/export.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const exportController = new ExportController();

// Get all exports
router.get('/exports', authMiddleware, exportController.getAllExports);

// Get single export
router.get('/exports/:exportId', authMiddleware, exportController.getExport);

// Get pending export customs clearances
router.get(
  '/exports/pending/export-customs',
  authMiddleware,
  exportController.getPendingExportCustoms
);

// Get pending import customs clearances
router.get(
  '/exports/pending/import-customs',
  authMiddleware,
  exportController.getPendingImportCustoms
);

// Clear export customs
router.post(
  '/exports/:exportId/export-customs/clear',
  authMiddleware,
  exportController.clearExportCustoms
);

// Reject export customs
router.post(
  '/exports/:exportId/export-customs/reject',
  authMiddleware,
  exportController.rejectExportCustoms
);

// Clear import customs
router.post(
  '/exports/:exportId/import-customs/clear',
  authMiddleware,
  exportController.clearImportCustoms
);

export default router;
