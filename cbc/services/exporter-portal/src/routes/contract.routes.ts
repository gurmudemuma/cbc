/**
 * Sales Contract Workflow Routes
 * Handles all contract-related API endpoints
 */

import { Router } from 'express';
import { createLogger } from '../../../shared/logger';
import authMiddleware from '../../../shared/middleware/auth.middleware';
import { requireFullyQualified } from '../middleware/qualification-check.middleware';
import { ContractController } from '../controllers/contract.controller';

const router = Router();
const logger = createLogger('ContractRoutes');

// Initialize controller
const contractController = new ContractController();

/**
 * POST /api/contracts/drafts
 * Create a new draft contract (requires FULLY_QUALIFIED)
 */
router.post('/drafts', authMiddleware, requireFullyQualified, contractController.createDraft);

/**
 * GET /api/contracts/drafts
 * Get all draft contracts (with optional status filter)
 */
router.get('/drafts', authMiddleware, async (req, res) => {
  try {
    const { status } = req.query;
    const userId = (req as any).user?.id;
    const username = (req as any).user?.username;
    const { getPool } = require('../../../shared/database/pool');
    const pool = getPool();
    
    // Look up exporter_id for this user - try both numeric ID and username
    let exporterQuery = 'SELECT exporter_id FROM exporter_profiles WHERE user_id = $1';
    let exporterResult = await pool.query(exporterQuery, [String(userId)]);
    
    // If not found by numeric ID, try username
    if (exporterResult.rows.length === 0 && username) {
      exporterResult = await pool.query(exporterQuery, [username]);
    }
    
    if (exporterResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Exporter profile not found for this user'
      });
    }
    
    const exporterId = exporterResult.rows[0].exporter_id;
    
    // Get contracts for this exporter
    let query = `
      SELECT cd.*, br.company_name as buyer_name, br.email as buyer_email
      FROM contract_drafts cd
      LEFT JOIN buyer_registry br ON cd.buyer_id = br.buyer_id
      WHERE cd.exporter_id = $1
    `;
    const params: any[] = [exporterId];
    
    if (status) {
      query += ' AND cd.status = $2';
      params.push(status);
    }
    
    query += ' ORDER BY cd.created_at DESC';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      drafts: result.rows,
      contracts: result.rows,
      message: 'Contracts retrieved successfully'
    });
  } catch (error: any) {
    logger.error('Error getting contracts', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve contracts',
      error: error.message
    });
  }
});

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
