import { Router } from 'express';
import { LotVerificationController } from '../controllers/lot-verification.controller';
<<<<<<< HEAD
import { authMiddleware } from '@shared/middleware/auth.middleware';
=======
import { authMiddleware } from '../../shared/middleware/auth.middleware';
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665

const router = Router();
const controller = new LotVerificationController();

// Enable authentication for all routes
router.use(authMiddleware);

// ===== ECX LOT VERIFICATION TASKS =====

// Get exports pending ECX verification (specific routes first)
router.get('/pending/verification', controller.getPendingVerifications);

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

// Get single export (generic routes last)
router.get('/:exportId', controller.getExportById);

// Get all exports
router.get('/', controller.getAllExports);

export default router;
