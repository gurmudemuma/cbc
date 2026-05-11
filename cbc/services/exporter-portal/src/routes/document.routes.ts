import { Router } from 'express';
import { DocumentController } from '../controllers/document.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();
const documentController = new DocumentController();

// All routes require authentication
router.use(authenticateToken);

// ============================================================================
// DOCUMENT MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * Get all required documents with their status
 * GET /api/exporter/documents/required
 */
router.get('/required', documentController.getRequiredDocuments);

/**
 * Get document collection status
 * GET /api/exporter/documents/collection-status
 */
router.get('/collection-status', documentController.getCollectionStatus);

/**
 * Request a document from a network member
 * POST /api/exporter/documents/request
 */
router.post('/request', documentController.requestDocument);

/**
 * Request all export documents at once (bulk request)
 * POST /api/exporter/documents/request-all
 */
router.post('/request-all', documentController.requestAllDocuments);

/**
 * Get all document requests for the logged-in exporter
 * GET /api/exporter/documents/requests
 */
router.get('/requests', documentController.getDocumentRequests);

/**
 * Get issued documents for the logged-in exporter
 * GET /api/exporter/documents
 */
router.get('/', documentController.getIssuedDocuments);

/**
 * Get documents for a specific submission
 * GET /api/exporter/documents/by-submission/:submissionId
 */
router.get('/by-submission/:submissionId', documentController.getDocumentsBySubmission);

/**
 * Download an issued document
 * GET /api/exporter/documents/:documentId/download
 */
router.get('/:documentId/download', documentController.downloadDocument);

export default router;
