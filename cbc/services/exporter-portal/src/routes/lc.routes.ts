/**
 * Letter of Credit (LC) Routes
 * API endpoints for LC issuance, tracking, and lifecycle management
 */

import { Router } from 'express';
import { LCController } from '../controllers/lc.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { requireFullyQualified } from '../middleware/qualification-check.middleware';

const router = Router();

// All LC routes require authentication
router.use(authMiddleware);

/**
 * @route   POST /api/lc/create
 * @desc    Create new LC record (Bank/CBE only - when receiving MT700 from issuing bank)
 * @access  Private (Bank/CBE role only)
 */
router.post('/create', LCController.createLC);

/**
 * @route   GET /api/lc/contract/:contractId
 * @desc    Get LC by contract ID
 * @access  Private (Authenticated)
 */
router.get('/contract/:contractId', LCController.getLCByContractId);

/**
 * @route   GET /api/lc/:lcId
 * @desc    Get LC details by LC ID
 * @access  Private (Authenticated)
 */
router.get('/:lcId', LCController.getLCById);

/**
 * @route   PUT /api/lc/:lcId/accept
 * @desc    Exporter accepts LC terms
 * @access  Private (Authenticated, FULLY_QUALIFIED)
 */
router.put('/:lcId/accept', requireFullyQualified, LCController.acceptLC);

/**
 * @route   PUT /api/lc/:lcId/reject
 * @desc    Exporter rejects LC terms
 * @access  Private (Authenticated, FULLY_QUALIFIED)
 */
router.put('/:lcId/reject', requireFullyQualified, LCController.rejectLC);

/**
 * @route   POST /api/lc/:lcId/nbe-approval
 * @desc    Request NBE forex approval
 * @access  Private (Authenticated)
 */
router.post('/:lcId/nbe-approval', LCController.requestNBEApproval);

/**
 * @route   PUT /api/lc/:lcId/nbe-decision
 * @desc    Record NBE approval decision (NBE role only)
 * @access  Private (Authenticated, NBE role)
 */
router.put('/:lcId/nbe-decision', LCController.recordNBEDecision);

/**
 * @route   POST /api/lc/:lcId/present-docs
 * @desc    Present documents against LC
 * @access  Private (Authenticated, FULLY_QUALIFIED)
 */
router.post('/:lcId/present-docs', requireFullyQualified, LCController.presentDocuments);

/**
 * @route   POST /api/lc/:lcId/payment
 * @desc    Record LC payment (Bank role only)
 * @access  Private (Authenticated, Bank role)
 */
router.post('/:lcId/payment', LCController.recordPayment);

/**
 * @route   GET /api/lc/:lcId/history
 * @desc    Get LC history/audit trail
 * @access  Private (Authenticated)
 */
router.get('/:lcId/history', LCController.getLCHistory);

/**
 * @route   GET /api/lc/exporter/:exporterId
 * @desc    Get all LCs for an exporter
 * @access  Private (Authenticated)
 */
router.get('/exporter/:exporterId', LCController.getLCsByExporter);

/**
 * @route   GET /api/lc
 * @desc    Get all LCs for authenticated exporter
 * @access  Private (Authenticated)
 */
router.get('/', LCController.getMyLCs);

export default router;
