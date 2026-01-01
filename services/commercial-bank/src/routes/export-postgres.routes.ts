import { Router, Request, Response, NextFunction } from 'express';
import { ExportPostgresController } from '../controllers/export-postgres.controller';
<<<<<<< HEAD
import { authMiddleware } from '@shared/middleware/auth.middleware';
import { inputValidator } from '@shared/input.sanitizer';
=======
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { inputValidator } from '../../../shared/input.sanitizer';
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665

const router = Router();
const exportController = new ExportPostgresController();

/**
 * Middleware to ensure user is authenticated
 */
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  authMiddleware(req, res, next);
};

/**
 * POST /api/exports
 * Create a new export request
 * 
 * Body:
 * {
 *   "exporterName": "string",
 *   "exporterId": "string (optional)",
 *   "coffeeType": "string",
 *   "quantity": "number",
 *   "destinationCountry": "string (optional)"
 * }
 */
router.post(
  '/',
  requireAuth,
  inputValidator.sanitizeBody,
  exportController.createExport
);

/**
 * GET /api/exports
 * Get all exports for the user's organization
 */
router.get(
  '/',
  requireAuth,
  exportController.getAllExports
);

/**
<<<<<<< HEAD
 * GET /api/exports/dashboard/stats
 * Get aggregated dashboard statistics for Commercial Bank
 */
router.get(
  '/dashboard/stats',
  requireAuth,
  exportController.getBankStats
);

/**
=======
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
 * GET /api/exports/:exportId
 * Get a specific export by ID
 */
router.get(
  '/:exportId',
  requireAuth,
  exportController.getExport
);

/**
 * GET /api/exports/pending/fx
 * Get exports pending FX approval
 */
router.get(
  '/pending/fx',
  requireAuth,
  exportController.getPendingFXApprovals
);

/**
 * POST /api/exports/:exportId/approve-fx
 * Approve FX for an export
 * 
 * Body:
 * {
 *   "approvalNotes": "string (optional)"
 * }
 */
router.post(
  '/:exportId/approve-fx',
  requireAuth,
  inputValidator.sanitizeBody,
  exportController.approveFX
);

/**
 * POST /api/exports/:exportId/reject-fx
 * Reject FX for an export
 * 
 * Body:
 * {
 *   "rejectionReason": "string (required)",
 *   "notes": "string (optional)"
 * }
 */
router.post(
  '/:exportId/reject-fx',
  requireAuth,
  inputValidator.sanitizeBody,
  exportController.rejectFX
);

/**
 * GET /api/exports/:exportId/status-history
 * Get status history for an export
 */
router.get(
  '/:exportId/status-history',
  requireAuth,
  exportController.getStatusHistory
);

/**
 * GET /api/exports/:exportId/approvals
 * Get approvals for an export
 */
router.get(
  '/:exportId/approvals',
  requireAuth,
  exportController.getApprovals
);

<<<<<<< HEAD


=======
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
/**
 * GET /api/exports/summary/statistics
 * Get export summary statistics
 */
router.get(
  '/summary/statistics',
  requireAuth,
  exportController.getExportSummary
);

export default router;
