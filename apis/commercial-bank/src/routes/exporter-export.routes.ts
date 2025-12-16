import { Router } from 'express';
import { ExportController } from '../controllers/exporter-export.controller';
import { authenticateToken } from '../middleware/exporter-auth.middleware';

const router = Router();
const exportController = new ExportController();

// All routes require authentication
router.use(authenticateToken);

// Export routes - GET and POST on same path
router
  .route('/')
  .get(exportController.getMyExports) // Get all exports (for exporter)
  .post(exportController.createExport); // Create new export request

// Get my exports (alias for backward compatibility)
router.get('/my-exports', exportController.getMyExports);

// Get export by ID
router.get('/:id', exportController.getExportById);

// Get export history
router.get('/:id/history', exportController.getExportHistory);

// Get document status and checklist
router.get('/:id/documents', exportController.getDocumentStatus);

// Submit export to ECX for lot verification
router.post('/:id/submit-to-ecx', exportController.submitToECX);

// Submit export to ECTA for license approval
router.post('/:id/submit-to-ecta', exportController.submitToECTA);

// Submit export to Commercial Bank for document verification
router.post('/:id/submit-to-bank', exportController.submitToBank);

// Request reinspection after quality rejection
router.post('/:id/request-reinspection', exportController.requestReinspection);

// Update rejected export with corrections
router.put('/:id/update-rejected', exportController.updateRejectedExport);

// Resubmit rejected export without changes
router.post('/:id/resubmit-rejected', exportController.resubmitRejectedExport);

export default router;
