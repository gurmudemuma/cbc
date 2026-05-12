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

// ===== SALES CONTRACT REGISTRATION =====
// New sales contract system endpoints

// Get finalized contracts pending ECTA registration
router.get('/pending-registration', controller.getPendingRegistrations);

// Get registered sales contracts
router.get('/registered', controller.getRegisteredContracts);

// Get registration statistics
router.get('/registration-stats', controller.getRegistrationStats);

// Register a finalized sales contract
router.post('/:draftId/register', controller.registerContract);

export default router;
