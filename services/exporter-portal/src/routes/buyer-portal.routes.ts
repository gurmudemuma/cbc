/**
 * Buyer Portal Routes
 * Handles buyer access to contracts and responses
 */

import { Router, Request, Response, NextFunction } from 'express';
import { createLogger } from '@shared/logger';
import { getPool } from '@shared/database/pool';
import { withTransaction } from '@shared/database/transaction';
import { handleDatabaseError, formatErrorResponse } from '@shared/database/errors';
import { ContractService } from '../services/contract.service';
import { ValidationService } from '../services/validation.service';
import { NotificationService } from '../services/notification.service';
import authMiddleware from '@shared/middleware/auth.middleware';

const router = Router();
const logger = createLogger('BuyerPortalRoutes');

// Initialize services
const contractService = new ContractService();
const validationService = new ValidationService();
const notificationService = new NotificationService();

/**
 * GET /api/buyer/contracts
 * Get all contracts for a buyer
 */
router.get('/contracts', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pool = getPool();
    const buyerEmail = (req as any).user?.email;
    const { page = 1, limit = 10 } = req.query;

    if (!buyerEmail) {
      return res.status(401).json({
        status: 'error',
        code: 'UNAUTHORIZED',
        message: 'Buyer email not found in token',
      });
    }

    // Get contracts for buyer
    const query = `
      SELECT * FROM contract_drafts
      WHERE buyer_email = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const countQuery = `
      SELECT COUNT(*) as total FROM contract_drafts
      WHERE buyer_email = $1
    `;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const offset = (pageNum - 1) * limitNum;

    const [contractsResult, countResult] = await Promise.all([
      pool.query(query, [buyerEmail, limitNum, offset]),
      pool.query(countQuery, [buyerEmail]),
    ]);

    const total = parseInt(countResult.rows[0].total, 10);
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      status: 'success',
      data: contractsResult.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
      },
    });
  } catch (error) {
    logger.error('Error retrieving buyer contracts', { error });
    const dbError = handleDatabaseError(error);
    const errorResponse = formatErrorResponse(dbError);
    res.status(errorResponse.status).json({
      status: 'error',
      code: errorResponse.code,
      message: errorResponse.message,
    });
  }
});

/**
 * POST /api/buyer/contracts/:draftId/respond
 * Buyer response to contract (accept, reject, or counter)
 */
router.post('/contracts/:draftId/respond', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pool = getPool();
    const { draftId } = req.params;
    const buyerEmail = (req as any).user?.email;
    const buyerId = (req as any).user?.id;
    const { action, reason, modifications } = req.body;

    if (!buyerEmail) {
      return res.status(401).json({
        status: 'error',
        code: 'UNAUTHORIZED',
        message: 'Buyer email not found in token',
      });
    }

    // Validate action
    if (!['ACCEPT', 'REJECT', 'COUNTER'].includes(action)) {
      return res.status(400).json({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: 'Invalid action. Must be ACCEPT, REJECT, or COUNTER',
      });
    }

    // Get existing draft
    const draft = await contractService.getDraftById(pool, draftId);

    if (!draft) {
      return res.status(404).json({
        status: 'error',
        code: 'NOT_FOUND',
        message: 'Draft contract not found',
      });
    }

    // Check authorization
    if (draft.buyer_email !== buyerEmail) {
      return res.status(403).json({
        status: 'error',
        code: 'FORBIDDEN',
        message: 'You do not have permission to respond to this contract',
      });
    }

    // Check status
    if (draft.status !== 'COUNTERED') {
      return res.status(409).json({
        status: 'error',
        code: 'CONFLICT',
        message: 'Only COUNTERED contracts can receive responses',
      });
    }

    // Handle different actions
    let updatedDraft;

    if (action === 'ACCEPT') {
      updatedDraft = await withTransaction(pool, async (client) => {
        const updated = await contractService.updateStatus(
          client,
          draftId,
          'ACCEPTED',
          'BUYER',
          buyerId,
          'ACCEPTED'
        );

        // Update buyer_id
        await client.query(
          'UPDATE contract_drafts SET buyer_id = $1 WHERE draft_id = $2',
          [buyerId, draftId]
        );

        // Send notification to exporter
        await notificationService.notifyContractAccepted(
          client,
          draftId,
          draft.buyer_email,
          draft.buyer_name,
          updated
        );

        return updated;
      });

      logger.info('Contract accepted by buyer', { draftId, buyerEmail });
    } else if (action === 'REJECT') {
      if (!reason) {
        return res.status(400).json({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: 'Rejection reason is required',
        });
      }

      updatedDraft = await withTransaction(pool, async (client) => {
        const updated = await contractService.updateStatus(
          client,
          draftId,
          'REJECTED',
          'BUYER',
          buyerId,
          'REJECTED',
          reason
        );

        // Send notification to exporter
        await notificationService.notifyContractRejected(
          client,
          draftId,
          draft.buyer_email,
          draft.buyer_name,
          reason
        );

        return updated;
      });

      logger.info('Contract rejected by buyer', { draftId, buyerEmail });
    } else if (action === 'COUNTER') {
      if (!modifications) {
        return res.status(400).json({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: 'Modifications are required for counter-offer',
        });
      }

      // Validate modifications
      const validation = validationService.validateUpdateRequest(modifications);
      if (!validation.isValid) {
        return res.status(400).json({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          errors: validation.errors,
        });
      }

      updatedDraft = await withTransaction(pool, async (client) => {
        // Update contract with modifications
        const updated = await contractService.updateDraft(client, draftId, {
          ...modifications,
          last_modified_at: new Date(),
        });

        // Create history entry for counter-offer
        await contractService.updateStatus(
          client,
          draftId,
          'COUNTERED',
          'BUYER',
          buyerId,
          'COUNTERED'
        );

        // Update buyer_id
        await client.query(
          'UPDATE contract_drafts SET buyer_id = $1 WHERE draft_id = $2',
          [buyerId, draftId]
        );

        // Send notification to exporter
        await notificationService.notifyCounterOffer(
          client,
          draftId,
          draft.buyer_email,
          draft.buyer_name,
          updated
        );

        return updated;
      });

      logger.info('Counter-offer submitted by buyer', { draftId, buyerEmail });
    }

    res.json({
      status: 'success',
      message: `Contract ${action.toLowerCase()} successfully`,
      data: updatedDraft,
    });
  } catch (error) {
    logger.error('Error processing buyer response', { error });
    const dbError = handleDatabaseError(error);
    const errorResponse = formatErrorResponse(dbError);
    res.status(errorResponse.status).json({
      status: 'error',
      code: errorResponse.code,
      message: errorResponse.message,
    });
  }
});

export default router;
