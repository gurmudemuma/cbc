/**
 * Sales Contract Workflow Routes
 * Handles all contract-related API endpoints
 */

import { Router } from 'express';
import { createLogger } from '../../../shared/logger';
import authMiddleware from '../../../shared/middleware/auth.middleware';
import { ContractController } from '../controllers/contract.controller';

const router = Router();
const logger = createLogger('ContractRoutes');

// Initialize controller
const contractController = new ContractController();

/**
 * POST /api/contracts/drafts
 * Create a new draft contract
 */
router.post('/drafts', authMiddleware, contractController.createDraft);

/**
 * GET /api/contracts/drafts/:draftId
 * Retrieve a draft contract by ID
 */
router.get('/drafts/:draftId', authMiddleware, contractController.getDraftById);

/**
 * PUT /api/contracts/drafts/:draftId
 * Update a draft contract
 */
router.put('/drafts/:draftId', authMiddleware, contractController.updateDraft);

/**
 * DELETE /api/contracts/drafts/:draftId
 * Delete a draft contract
 */
router.delete('/drafts/:draftId', authMiddleware, contractController.deleteDraft);

/**
 * GET /api/contracts/drafts/exporter/:exporterId
 * Get all contracts for an exporter
 */
router.get('/drafts/exporter/:exporterId', authMiddleware, contractController.getContractsByExporter);

/**
 * POST /api/contracts/drafts/:draftId/send
 * Send contract to buyer
 */
router.post('/drafts/:draftId/send', authMiddleware, contractController.sendToBuyer);

/**
 * POST /api/contracts/drafts/:draftId/accept
 * Accept counter-offer
 */
router.post('/drafts/:draftId/accept', authMiddleware, contractController.acceptCounterOffer);

/**
 * POST /api/contracts/drafts/:draftId/reject
 * Reject contract
 */
router.post('/drafts/:draftId/reject', authMiddleware, contractController.rejectContract);

/**
 * POST /api/contracts/drafts/:draftId/counter
 * Submit counter-offer
 */
router.post('/drafts/:draftId/counter', authMiddleware, contractController.submitCounterOffer);

/**
 * POST /api/contracts/drafts/:draftId/finalize
 * Finalize contract to blockchain
 */
router.post('/drafts/:draftId/finalize', authMiddleware, contractController.finalizeContract);

/**
 * GET /api/contracts
 * Base contracts endpoint - returns API information
 */
router.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Contracts API',
    endpoints: {
      createDraft: 'POST /api/contracts/drafts',
      getDraft: 'GET /api/contracts/drafts/:draftId',
      updateDraft: 'PUT /api/contracts/drafts/:draftId',
      deleteDraft: 'DELETE /api/contracts/drafts/:draftId',
      getExporterContracts: 'GET /api/contracts/drafts/exporter/:exporterId',
      sendToBuyer: 'POST /api/contracts/drafts/:draftId/send',
      acceptCounterOffer: 'POST /api/contracts/drafts/:draftId/accept',
      rejectContract: 'POST /api/contracts/drafts/:draftId/reject',
      submitCounterOffer: 'POST /api/contracts/drafts/:draftId/counter',
      finalizeContract: 'POST /api/contracts/drafts/:draftId/finalize',
      getByReference: 'GET /api/contracts/:referenceNumber'
    },
    note: 'All endpoints except getByReference require authentication'
  });
});

/**
 * GET /api/contracts/:referenceNumber
 * Get contract by contract number/reference (public endpoint)
 * IMPORTANT: This must be LAST to avoid matching other routes
 */
router.get('/:referenceNumber', contractController.getContractByReference);

export default router;
