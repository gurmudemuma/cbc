import { Router } from 'express';
import { DocumentController } from '../controllers/document.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();
const documentController = new DocumentController();

// ============================================================================
// TEST ENDPOINT (NO AUTH) - REMOVE IN PRODUCTION
// ============================================================================
/**
 * TEST: Get pending document requests WITHOUT authentication
 * GET /api/exporter/documents/test/pending
 */
router.get('/test/pending', async (req, res) => {
  try {
    const { getPool } = require('@shared/database/pool');
    const pool = getPool();
    
    const query = `
      SELECT 
        dr.request_id,
        dr.exporter_id,
        dr.document_type,
        dr.request_status as status,
        dr.request_notes as request_notes,
        dr.requested_at,
        dr.priority,
        dr.contract_reference as ecta_reference_number,
        dr.required_data,
        dr.issuer_agency,
        ep.business_name as exporter_name,
        ep.tin as exporter_tin,
        ep.email as exporter_email,
        ep.contact_person as exporter_contact_person,
        ep.phone as exporter_phone,
        ep.status as profile_status
      FROM document_requests dr
      LEFT JOIN exporter_profiles ep ON dr.exporter_id = ep.exporter_id
      WHERE dr.request_status = 'PENDING'
      ORDER BY 
        CASE dr.priority
          WHEN 'URGENT' THEN 1
          WHEN 'HIGH' THEN 2
          WHEN 'MEDIUM' THEN 3
          WHEN 'LOW' THEN 4
          ELSE 5
        END,
        dr.requested_at ASC
      LIMIT 10
    `;

    const result = await pool.query(query);
    
    const requests = result.rows.map(row => ({
      request_id: row.request_id,
      exporter_id: row.exporter_id,
      exporter_name: row.exporter_name || 'Unknown Exporter',
      exporter_tin: row.exporter_tin || 'N/A',
      exporter_email: row.exporter_email || 'N/A',
      exporter_contact_person: row.exporter_contact_person,
      exporter_phone: row.exporter_phone,
      document_type: row.document_type,
      priority: row.priority || 'MEDIUM',
      request_status: row.status,
      request_notes: row.request_notes,
      requested_at: row.requested_at,
      ecta_reference_number: row.ecta_reference_number,
      required_data: row.required_data,
      issuer_agency: row.issuer_agency,
      exporter_qualification: {
        profile_status: row.profile_status || 'PENDING_APPROVAL',
        license_status: 'UNKNOWN',
        competence_status: 'UNKNOWN',
        laboratory_status: 'UNKNOWN',
        taster_status: 'UNKNOWN',
      },
    }));

    res.json({
      success: true,
      data: requests,
      count: requests.length,
      message: 'TEST ENDPOINT - Real data from database'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database query failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// All routes below require authentication
router.use(authenticateToken);

// ============================================================================
// DOCUMENT ISSUANCE ENDPOINTS (for Network Members)
// ============================================================================

/**
 * Get pending document requests for network members to issue
 * GET /api/document-issuance/document-requests/pending
 */
router.get('/issuance/document-requests/pending', documentController.getPendingRequestsForIssuance);

/**
 * Issue a document (for network members)
 * POST /api/document-issuance/documents/issue
 */
router.post('/issuance/documents/issue', documentController.issueDocument);

/**
 * Reject a document request (for network members)
 * POST /api/document-issuance/document-requests/:requestId/reject
 */
router.post('/issuance/document-requests/:requestId/reject', documentController.rejectDocumentRequest);

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
 * Get registered contracts for document requests
 * GET /api/exporter/documents/registered-contracts
 */
router.get('/registered-contracts', documentController.getRegisteredContracts);

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
