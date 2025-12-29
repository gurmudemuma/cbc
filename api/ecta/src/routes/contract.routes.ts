import { Router } from 'express';
import { ContractController } from '../controllers/contract.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const controller = new ContractController();

// Enable authentication for all routes
router.use(authMiddleware);

// ===== ECTA CONTRACT APPROVAL TASKS =====
// This is STEP 3 of ECTA's 3-step approval process

// Get all exports
router.get('/exports', controller.getAllExports);

// Get exports pending contract approval (status: ECTA_QUALITY_APPROVED)
router.get('/pending', controller.getPendingContracts);

// Get approved contracts (status: ECTA_CONTRACT_APPROVED)
router.get('/approved', controller.getApprovedContracts);

// Get rejected contracts (status: CONTRACT_REJECTED)
router.get('/rejected', controller.getRejectedContracts);

// Review export contract
router.post('/:exportId/review', controller.reviewContract);

// Verify origin certificate
router.post('/:exportId/verify-origin', controller.verifyOrigin);

// Approve contract (ECTA_QUALITY_APPROVED → ECTA_CONTRACT_APPROVED)
router.post('/:exportId/approve', controller.approveContract);

// Reject contract (ECTA_QUALITY_APPROVED → CONTRACT_REJECTED)
router.post('/:exportId/reject', controller.rejectContract);

export default router;
