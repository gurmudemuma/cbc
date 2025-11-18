import { Router } from 'express';
import { LotVerificationController } from '../controllers/lot-verification.controller';
// TODO: Add authentication middleware
// import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const controller = new LotVerificationController();

// TODO: Enable authentication when middleware is created
// router.use(authMiddleware);

// ===== ECX LOT VERIFICATION TASKS =====

// Get all exports
router.get('/', controller.getAllExports);

// Get single export
router.get('/:exportId', controller.getExport);

// Get exports pending ECX verification
router.get('/pending/verification', controller.getPendingVerification);

// Get verified lots
router.get('/status/verified', controller.getVerifiedLots);

// Get rejected lots
router.get('/status/rejected', controller.getRejectedLots);

// Verify lot (record lot number and warehouse receipt)
router.post('/:exportId/verify', controller.verifyLot);

// Approve lot verification (PENDING → ECX_VERIFIED)
router.post('/:exportId/approve', controller.approveLot);

// Reject lot verification (PENDING → ECX_REJECTED)
router.post('/:exportId/reject', controller.rejectLot);

export default router;
