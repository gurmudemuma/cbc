import { Router } from 'express';
import { LicenseController } from '../controllers/license.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const controller = new LicenseController();

// Enable authentication for all routes
router.use(authMiddleware);

// ===== ECTA LICENSE APPROVAL TASKS =====
// This is STEP 1 of ECTA's 3-step approval process

// Get all exports
router.get('/exports', controller.getAllExports);

// Get exports pending license approval (status: ECX_VERIFIED)
router.get('/pending', controller.getPendingLicenses);

// Get approved licenses (status: ECTA_LICENSE_APPROVED)
router.get('/approved', controller.getApprovedLicenses);

// Get rejected licenses (status: LICENSE_REJECTED)
router.get('/rejected', controller.getRejectedLicenses);

// Review license application
router.post('/:exportId/review', controller.reviewLicense);

// Issue export license
router.post('/:exportId/issue', controller.issueLicense);

// Approve license (ECX_VERIFIED → ECTA_LICENSE_APPROVED)
router.post('/:exportId/approve', controller.approveLicense);

// Reject license (ECX_VERIFIED → LICENSE_REJECTED)
router.post('/:exportId/reject', controller.rejectLicense);

export default router;
