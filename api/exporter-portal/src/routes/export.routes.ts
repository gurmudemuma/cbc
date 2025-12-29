import { Router } from 'express';
import { ExportController } from '../controllers/export.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();
const exportController = new ExportController();

// All routes require authentication
router.use(authenticateToken);

// Export routes - GET and POST on same path
router.route('/')
  .get(exportController.getMyExports)  // Get all exports (for exporter)
  .post(exportController.createExport); // Create new export request

<<<<<<< HEAD
// Get dashboard statistics (MUST come before /:id routes)
router.get('/stats', exportController.getDashboardStats);

=======
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
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

export default router;
