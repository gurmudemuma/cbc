/**
 * ESW (Electronic Single Window) Routes
 * Handles ESW submission and agency approval endpoints
 */

import { Router } from 'express';
import controller from '../controllers/esw.controller';
import { authMiddleware as authenticate } from '@shared/middleware/auth.middleware';

const router = Router();

// All routes require authentication
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
 * Process agency approval/rejection
 * POST /api/esw/submissions/:submissionId/agencies/:agencyCode/approve
 * Body: { status: 'APPROVED'|'REJECTED'|'INFO_REQUIRED', rejectionReason?, additionalInfoRequest?, notes? }
 */
router.post('/submissions/:submissionId/agencies/:agencyCode/approve', controller.processAgencyApproval);

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
 */
router.get('/agencies/:agencyCode/pending', controller.getPendingForAgency);

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

