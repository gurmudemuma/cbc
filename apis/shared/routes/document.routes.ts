import { Router } from 'express';
import { DocumentController } from '../controllers/document.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const documentController = new DocumentController();

// All routes require authentication
router.use(authMiddleware as any);

/**
 * Document Checklist Routes
 * GET /api/documents/:exportId/checklist - Get document checklist
 * GET /api/documents/:exportId/requirements - Get stage requirements
 * GET /api/documents/:exportId/instructions - Get upload instructions
 * GET /api/documents/:exportId/completion - Get completion status
 * GET /api/documents/:exportId/validate - Validate can proceed
 * GET /api/documents/:exportId/all - Get all documents
 */

// Get document checklist
router.get('/:exportId/checklist', documentController.getDocumentChecklist);

// Get stage-specific requirements
router.get('/:exportId/requirements', documentController.getStageRequirements);

// Get upload instructions
router.get('/:exportId/instructions', documentController.getUploadInstructions);

// Get completion status
router.get('/:exportId/completion', documentController.getCompletionStatus);

// Validate if can proceed to next stage
router.get('/:exportId/validate', documentController.validateCanProceed);

// Get all documents
router.get('/:exportId/all', documentController.getAllDocuments);

export default router;
