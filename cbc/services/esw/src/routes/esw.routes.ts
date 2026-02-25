/**
 * ESW (Electronic Single Window) Routes
 * Handles ESW submission and agency approval endpoints
 */

import { Router } from 'express';
import controller from '../controllers/esw.controller';
import { authMiddleware as authenticate } from '@shared/middleware/auth.middleware';
import {
    requireAgencyUser,
    requireAgency,
    requireAgencyPermission
} from '@shared/middleware/agency-auth.middleware';

const router = Router();

// ============================================================================
// PUBLIC ROUTES (No authentication required)
// ============================================================================

/**
 * Verify certificate by certificate number (PUBLIC)
 * GET /api/esw/certificates/verify/:certificateNumber
 * No authentication required - allows customs officers and third parties to verify certificates
 */
router.get('/certificates/verify/:certificateNumber', controller.verifyCertificate);

// ============================================================================
// AUTHENTICATED ROUTES
// ============================================================================

// All routes below require authentication
router.use(authenticate);

// ============================================================================
// ESW SUBMISSIONS
// ============================================================================

/**
 * Submit export to ESW
 * POST /api/esw/submissions
 * Body: { exportId, documents: [], certificates: [], notes }
 */
router.post('/submissions', controller.submitToESW);

/**
 * Get all ESW submissions (with optional filters)
 * GET /api/esw/submissions?status=SUBMITTED&exportId=xxx&fromDate=2025-01-01&toDate=2025-01-31
 */
router.get('/submissions', controller.getSubmissions);

/**
 * Get ESW submission by ID
 * GET /api/esw/submissions/:submissionId
 */
router.get('/submissions/:submissionId', controller.getSubmission);

/**
 * Get agency approvals for a submission
 * GET /api/esw/submissions/:submissionId/agencies
 */
router.get('/submissions/:submissionId/agencies', controller.getAgencyApprovals);

/**
 * Get all certificates for a submission
 * GET /api/esw/submissions/:submissionId/certificates
 */
router.get('/submissions/:submissionId/certificates', controller.getSubmissionCertificates);

/**
 * Process agency approval/rejection
 * POST /api/esw/submissions/:submissionId/agencies/:agencyCode/approve
 * Body: { status: 'APPROVED'|'REJECTED'|'INFO_REQUIRED', rejectionReason?, additionalInfoRequest?, notes? }
 * 
 * REQUIRES: User must belong to the specified agency and have 'approve_submissions' permission
 */
router.post(
    '/submissions/:submissionId/agencies/:agencyCode/approve',
    requireAgency(), // Validates user belongs to the agency specified in :agencyCode
    requireAgencyPermission('approve_submissions'), // Validates user has approval permission
    controller.processAgencyApproval
);

// ============================================================================
// EXPORT-SPECIFIC ROUTES
// ============================================================================

/**
 * Get ESW submission by export ID
 * GET /api/esw/exports/:exportId/submission
 */
router.get('/exports/:exportId/submission', controller.getSubmissionByExportId);

// ============================================================================
// AGENCIES
// ============================================================================

/**
 * Get all ESW agencies
 * GET /api/esw/agencies?activeOnly=true
 */
router.get('/agencies', controller.getAgencies);

/**
 * Get pending submissions for a specific agency
 * GET /api/esw/agencies/:agencyCode/pending
 * 
 * REQUIRES: User must belong to the specified agency
 */
router.get(
    '/agencies/:agencyCode/pending',
    requireAgency(), // Validates user belongs to the agency
    controller.getPendingForAgency
);

/**
 * Get agency-specific statistics
 * GET /api/esw/agencies/:agencyCode/stats
 * 
 * REQUIRES: User must belong to the specified agency
 */
router.get(
    '/agencies/:agencyCode/stats',
    requireAgency(), // Validates user belongs to the agency
    controller.getAgencyStats
);

/**
 * Get user's agencies
 * GET /api/esw/agencies/my/list
 * Returns all agencies the authenticated user belongs to
 */
router.get(
    '/agencies/my/list',
    requireAgencyUser, // Validates user belongs to at least one agency
    controller.getMyAgencies
);

// ============================================================================
// CERTIFICATES
// ============================================================================

/**
 * Get certificate metadata
 * GET /api/esw/certificates/:certificateId
 */
router.get('/certificates/:certificateId', controller.getCertificate);

/**
 * Download certificate PDF
 * GET /api/esw/certificates/:certificateId/download
 */
router.get('/certificates/:certificateId/download', controller.downloadCertificate);

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get ESW statistics
 * GET /api/esw/stats
 * GET /api/esw/statistics (alias)
 */
router.get('/stats', controller.getStats);
router.get('/statistics', controller.getStats);

export default router;


