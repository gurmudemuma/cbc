/**
 * Contract Controller
 * Handles HTTP requests for contract CRUD operations
 */

import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../../../shared/logger';
import { getPool } from '../../../shared/database/pool';
import { ContractService } from '../services/contract.service';
import { ValidationService } from '../services/validation.service';
import { NotificationService } from '../services/notification.service';
import { BlockchainService } from '../services/blockchain.service';
import {
  CreateContractDraftRequest,
  UpdateContractDraftRequest,
  ContractStatus,
  ActorType,
  ContractHistoryAction,
} from '../types/contract.types';

const logger = createLogger('ContractController');

export class ContractController {
  private contractService: ContractService;
  private validationService: ValidationService;
  private notificationService: NotificationService;
  private blockchainService: BlockchainService;

  constructor() {
    const pool = getPool();
    this.contractService = new ContractService(pool);
    this.validationService = new ValidationService();
    this.notificationService = new NotificationService(pool);
    this.blockchainService = new BlockchainService();
  }

  /**
   * Helper method to get exporter_id from user credentials
   */
  private async getExporterIdFromUser(userId: number, username?: string): Promise<string | null> {
    const pool = getPool();
    const exporterQuery = 'SELECT exporter_id FROM exporter_profiles WHERE user_id = $1';
    const exporterResult = await pool.query(exporterQuery, [username || userId.toString()]);
    
    if (exporterResult.rows.length === 0) {
      return null;
    }
    
    return exporterResult.rows[0].exporter_id;
  }

  /**
   * POST /api/contracts/drafts
   * Create a new draft contract
   */
  createDraft = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      const username = (req as any).user?.username;

      if (!userId) {
        res.status(401).json({
          status: 'error',
          code: 'UNAUTHORIZED',
          message: 'User ID not found in authentication token',
        });
        return;
      }

      // Look up the exporter_id from exporter_profiles using username (not numeric user_id)
      const pool = getPool();
      const exporterQuery = 'SELECT exporter_id FROM exporter_profiles WHERE user_id = $1';
      const exporterResult = await pool.query(exporterQuery, [username || userId.toString()]);

      if (exporterResult.rows.length === 0) {
        res.status(404).json({
          status: 'error',
          code: 'NOT_FOUND',
          message: 'Exporter profile not found for this user',
        });
        return;
      }

      const exporterId = exporterResult.rows[0].exporter_id;

      // Validate request body
      const validation = this.validationService.validateCreateRequest(req.body);
      if (!validation.isValid) {
        res.status(400).json({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          errors: validation.errors,
        });
        return;
      }

      // Create draft contract
      const createRequest: CreateContractDraftRequest = {
        buyer_name: req.body.buyer_name,
        buyer_email: req.body.buyer_email,
        coffee_type: req.body.coffee_type,
        quantity_bags: req.body.quantity_bags,
        unit_price: req.body.unit_price,
        currency: req.body.currency,
        payment_terms: req.body.payment_terms,
        delivery_location: req.body.delivery_location,
        delivery_date: new Date(req.body.delivery_date),
      };

      const draft = await this.contractService.createDraft(exporterId, createRequest);

      logger.info(`Draft contract created: ${draft.draft_id} by exporter ${exporterId}`);

      res.status(201).json({
        status: 'success',
        message: 'Draft contract created successfully',
        data: draft,
      });
    } catch (error) {
      logger.error('Error creating draft contract', { error });
      next(error);
    }
  };

  /**
   * GET /api/contracts/drafts/:draftId
   * Retrieve a draft contract by ID
   */
  getDraftById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { draftId } = req.params;
      const userId = (req as any).user?.id;
      const username = (req as any).user?.username;
      const userEmail = (req as any).user?.email;

      const draft = await this.contractService.getDraftById(draftId);

      if (!draft) {
        res.status(404).json({
          status: 'error',
          code: 'NOT_FOUND',
          message: 'Draft contract not found',
        });
        return;
      }

      // Look up exporter_id for authorization check
      const exporterId = await this.getExporterIdFromUser(userId, username);

      // Authorization: exporter owns contract OR buyer email matches
      if (draft.exporter_id !== exporterId && draft.buyer_email !== userEmail) {
        res.status(403).json({
          status: 'error',
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this contract',
        });
        return;
      }

      res.status(200).json({
        status: 'success',
        data: draft,
      });
    } catch (error) {
      logger.error('Error retrieving draft contract', { error });
      next(error);
    }
  };

  /**
   * PUT /api/contracts/drafts/:draftId
   * Update a draft contract
   */
  updateDraft = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { draftId } = req.params;
      const userId = (req as any).user?.id;
      const username = (req as any).user?.username;

      // Get existing draft
      const draft = await this.contractService.getDraftById(draftId);

      if (!draft) {
        res.status(404).json({
          status: 'error',
          code: 'NOT_FOUND',
          message: 'Draft contract not found',
        });
        return;
      }

      // Look up exporter_id for authorization check
      const exporterId = await this.getExporterIdFromUser(userId, username);

      if (!exporterId) {
        res.status(404).json({
          status: 'error',
          code: 'NOT_FOUND',
          message: 'Exporter profile not found for this user',
        });
        return;
      }

      // Authorization: only exporter can edit
      if (draft.exporter_id !== exporterId) {
        res.status(403).json({
          status: 'error',
          code: 'FORBIDDEN',
          message: 'You do not have permission to edit this contract',
        });
        return;
      }

      // Verify status is DRAFT
      if (draft.status !== ContractStatus.DRAFT) {
        res.status(409).json({
          status: 'error',
          code: 'CONFLICT',
          message: `Cannot edit contract with status ${draft.status}. Only DRAFT contracts can be edited.`,
        });
        return;
      }

      // Validate update request
      const validation = this.validationService.validateUpdateRequest(req.body);
      if (!validation.isValid) {
        res.status(400).json({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          errors: validation.errors,
        });
        return;
      }

      // Build update request
      const updateRequest: UpdateContractDraftRequest = {};
      if (req.body.buyer_name !== undefined) updateRequest.buyer_name = req.body.buyer_name;
      if (req.body.buyer_email !== undefined) updateRequest.buyer_email = req.body.buyer_email;
      if (req.body.coffee_type !== undefined) updateRequest.coffee_type = req.body.coffee_type;
      if (req.body.quantity_bags !== undefined) updateRequest.quantity_bags = req.body.quantity_bags;
      if (req.body.unit_price !== undefined) updateRequest.unit_price = req.body.unit_price;
      if (req.body.currency !== undefined) updateRequest.currency = req.body.currency;
      if (req.body.payment_terms !== undefined) updateRequest.payment_terms = req.body.payment_terms;
      if (req.body.delivery_location !== undefined) updateRequest.delivery_location = req.body.delivery_location;
      if (req.body.delivery_date !== undefined) updateRequest.delivery_date = new Date(req.body.delivery_date);

      // Update draft
      const updatedDraft = await this.contractService.updateDraft(draftId, updateRequest);

      logger.info(`Draft contract updated: ${draftId} by user ${userId}`);

      res.status(200).json({
        status: 'success',
        message: 'Draft contract updated successfully',
        data: updatedDraft,
      });
    } catch (error) {
      logger.error('Error updating draft contract', { error });
      next(error);
    }
  };

  /**
   * DELETE /api/contracts/drafts/:draftId
   * Delete a draft contract
   */
  deleteDraft = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { draftId } = req.params;
      const userId = (req as any).user?.id;
      const username = (req as any).user?.username;

      // Get existing draft
      const draft = await this.contractService.getDraftById(draftId);

      if (!draft) {
        res.status(404).json({
          status: 'error',
          code: 'NOT_FOUND',
          message: 'Draft contract not found',
        });
        return;
      }

      // Look up exporter_id for authorization check
      const exporterId = await this.getExporterIdFromUser(userId, username);

      if (!exporterId) {
        res.status(404).json({
          status: 'error',
          code: 'NOT_FOUND',
          message: 'Exporter profile not found for this user',
        });
        return;
      }

      // Authorization: only exporter can delete
      if (draft.exporter_id !== exporterId) {
        res.status(403).json({
          status: 'error',
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this contract',
        });
        return;
      }

      // Verify status is DRAFT
      if (draft.status !== ContractStatus.DRAFT) {
        res.status(409).json({
          status: 'error',
          code: 'CONFLICT',
          message: `Cannot delete contract with status ${draft.status}. Only DRAFT contracts can be deleted.`,
        });
        return;
      }

      // Delete draft
      await this.contractService.deleteDraft(draftId);

      logger.info(`Draft contract deleted: ${draftId} by user ${userId}`);

      res.status(204).send();
    } catch (error) {
      logger.error('Error deleting draft contract', { error });
      next(error);
    }
  };

  /**
   * GET /api/contracts/drafts/exporter/:exporterId
   * Get all contracts for an exporter
   */
  getContractsByExporter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { exporterId } = req.params;
      const userId = (req as any).user?.id;
      const { status, page = '1', limit = '10' } = req.query;

      // Authorization: verify the user owns this exporter profile
      // Look up the exporter_id for this user_id
      const authQuery = `
        SELECT exporter_id FROM exporter_profiles WHERE user_id = $1
      `;
      const pool = getPool();
      const authResult = await pool.query(authQuery, [userId]);
      
      if (authResult.rows.length === 0) {
        res.status(404).json({
          status: 'error',
          code: 'NOT_FOUND',
          message: 'Exporter profile not found for this user',
        });
        return;
      }
      
      const userExporterId = authResult.rows[0].exporter_id;
      
      // Check if the requested exporterId matches the user's exporterId
      if (exporterId !== userExporterId) {
        res.status(403).json({
          status: 'error',
          code: 'FORBIDDEN',
          message: 'You do not have permission to view these contracts',
        });
        return;
      }

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const statusFilter = status as ContractStatus | undefined;

      const result = await this.contractService.getContractsByExporter(
        exporterId,
        statusFilter,
        pageNum,
        limitNum
      );

      res.status(200).json({
        status: 'success',
        data: {
          contracts: result.contracts,
          total: result.total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(result.total / limitNum),
        },
      });
    } catch (error) {
      logger.error('Error retrieving exporter contracts', { error });
      next(error);
    }
  };

  /**
   * POST /api/contracts/drafts/:draftId/send
   * Send contract to buyer
   */
  sendToBuyer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { draftId } = req.params;
      const userId = (req as any).user?.id;
      const username = (req as any).user?.username;
      const { confirmation } = req.body;

      if (!confirmation) {
        res.status(400).json({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: 'Confirmation is required to send contract to buyer',
        });
        return;
      }

      // Look up the exporter_id from exporter_profiles using username
      const pool = getPool();
      const exporterQuery = 'SELECT exporter_id FROM exporter_profiles WHERE user_id = $1';
      const exporterResult = await pool.query(exporterQuery, [username || userId.toString()]);

      if (exporterResult.rows.length === 0) {
        res.status(404).json({
          status: 'error',
          code: 'NOT_FOUND',
          message: 'Exporter profile not found for this user',
        });
        return;
      }

      const exporterId = exporterResult.rows[0].exporter_id;

      // Get existing draft
      const draft = await this.contractService.getDraftById(draftId);

      if (!draft) {
        res.status(404).json({
          status: 'error',
          code: 'NOT_FOUND',
          message: 'Draft contract not found',
        });
        return;
      }

      // Authorization: only exporter can send
      if (draft.exporter_id !== exporterId) {
        res.status(403).json({
          status: 'error',
          code: 'FORBIDDEN',
          message: 'You do not have permission to send this contract',
        });
        return;
      }

      // Verify status is DRAFT
      if (draft.status !== ContractStatus.DRAFT) {
        res.status(409).json({
          status: 'error',
          code: 'CONFLICT',
          message: `Cannot send contract with status ${draft.status}. Only DRAFT contracts can be sent.`,
        });
        return;
      }

      // Update status to COUNTERED
      const updatedContract = await this.contractService.updateStatus(
        draftId,
        ContractStatus.COUNTERED,
        ActorType.EXPORTER,
        userId,
        ContractHistoryAction.SENT
      );

      // Send notification to buyer
      const buyerPortalLink = `${process.env.BUYER_PORTAL_URL || 'http://localhost:3000/buyer'}/contracts/${draftId}`;
      await this.notificationService.notifyContractSent(updatedContract, buyerPortalLink);

      logger.info(`Contract sent to buyer: ${draftId} by exporter ${userId}`);

      res.status(200).json({
        status: 'success',
        message: 'Contract sent to buyer successfully',
        data: updatedContract,
      });
    } catch (error) {
      logger.error('Error sending contract to buyer', { error });
      next(error);
    }
  };

  /**
   * POST /api/contracts/drafts/:draftId/accept
   * Accept counter-offer
   */
  acceptCounterOffer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { draftId } = req.params;
      const userId = (req as any).user?.id;
      const username = (req as any).user?.username;
      const { confirmation } = req.body;

      if (!confirmation) {
        res.status(400).json({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: 'Confirmation is required to accept counter-offer',
        });
        return;
      }

      // Look up the exporter_id from exporter_profiles using username
      const pool = getPool();
      const exporterQuery = 'SELECT exporter_id FROM exporter_profiles WHERE user_id = $1';
      const exporterResult = await pool.query(exporterQuery, [username || userId.toString()]);

      if (exporterResult.rows.length === 0) {
        res.status(404).json({
          status: 'error',
          code: 'NOT_FOUND',
          message: 'Exporter profile not found for this user',
        });
        return;
      }

      const exporterId = exporterResult.rows[0].exporter_id;

      // Get existing draft
      const draft = await this.contractService.getDraftById(draftId);

      if (!draft) {
        res.status(404).json({
          status: 'error',
          code: 'NOT_FOUND',
          message: 'Draft contract not found',
        });
        return;
      }

      // Authorization: only exporter can accept
      if (draft.exporter_id !== exporterId) {
        res.status(403).json({
          status: 'error',
          code: 'FORBIDDEN',
          message: 'You do not have permission to accept this counter-offer',
        });
        return;
      }

      // Verify status is COUNTERED
      if (draft.status !== ContractStatus.COUNTERED) {
        logger.warn(`Cannot accept contract with status ${draft.status}`, { draftId, currentStatus: draft.status });
        res.status(409).json({
          status: 'error',
          code: 'INVALID_STATUS',
          message: `Cannot accept counter-offer for contract with status ${draft.status}. Only COUNTERED contracts can be accepted.`,
          currentStatus: draft.status,
        });
        return;
      }

      // Update status to ACCEPTED
      const updatedContract = await this.contractService.updateStatus(
        draftId,
        ContractStatus.ACCEPTED,
        ActorType.EXPORTER,
        userId,
        ContractHistoryAction.ACCEPTED
      );

      // Send notification to buyer
      await this.notificationService.notifyCounterOfferAccepted(updatedContract, draft.buyer_email);

      logger.info(`Counter-offer accepted: ${draftId} by exporter ${userId}`);

      res.status(200).json({
        status: 'success',
        message: 'Counter-offer accepted successfully',
        data: updatedContract,
      });
    } catch (error) {
      logger.error('Error accepting counter-offer', { error });
      next(error);
    }
  };

  /**
   * POST /api/contracts/drafts/:draftId/reject
   * Reject contract
   */
  rejectContract = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { draftId } = req.params;
      const userId = (req as any).user?.id;
      const username = (req as any).user?.username;
      const { reason } = req.body;

      if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
        res.status(400).json({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: 'Rejection reason is required',
        });
        return;
      }

      // Get existing draft
      const draft = await this.contractService.getDraftById(draftId);

      if (!draft) {
        res.status(404).json({
          status: 'error',
          code: 'NOT_FOUND',
          message: 'Draft contract not found',
        });
        return;
      }

      // Look up exporter_id for authorization check
      const exporterId = await this.getExporterIdFromUser(userId, username);

      if (!exporterId) {
        res.status(404).json({
          status: 'error',
          code: 'NOT_FOUND',
          message: 'Exporter profile not found for this user',
        });
        return;
      }

      // Authorization: only exporter can reject
      if (draft.exporter_id !== exporterId) {
        res.status(403).json({
          status: 'error',
          code: 'FORBIDDEN',
          message: 'You do not have permission to reject this contract',
        });
        return;
      }

      // Verify status is COUNTERED
      if (draft.status !== ContractStatus.COUNTERED) {
        res.status(409).json({
          status: 'error',
          code: 'CONFLICT',
          message: `Cannot reject contract with status ${draft.status}. Only COUNTERED contracts can be rejected.`,
        });
        return;
      }

      // Update status to REJECTED with reason
      const changes = { rejection_reason: reason };
      const updatedContract = await this.contractService.updateStatus(
        draftId,
        ContractStatus.REJECTED,
        ActorType.EXPORTER,
        userId,
        ContractHistoryAction.REJECTED,
        changes
      );

      // Send notification to buyer
      const exporterEmail = (req as any).user?.email || '';
      await this.notificationService.notifyContractRejected(
        updatedContract,
        draft.buyer_email,
        '', // buyer_id not available
        reason
      );

      logger.info(`Contract rejected: ${draftId} by exporter ${userId}, reason: ${reason}`);

      res.status(200).json({
        status: 'success',
        message: 'Contract rejected successfully',
        data: updatedContract,
      });
    } catch (error) {
      logger.error('Error rejecting contract', { error });
      next(error);
    }
  };

  /**
   * POST /api/contracts/drafts/:draftId/counter
   * Submit counter-offer
   */
  submitCounterOffer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { draftId } = req.params;
      const userId = (req as any).user?.id;
      const username = (req as any).user?.username;
      const { modifications } = req.body;

      if (!modifications || typeof modifications !== 'object' || Object.keys(modifications).length === 0) {
        res.status(400).json({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: 'Modifications are required for counter-offer',
        });
        return;
      }

      // Get existing draft
      const draft = await this.contractService.getDraftById(draftId);

      if (!draft) {
        res.status(404).json({
          status: 'error',
          code: 'NOT_FOUND',
          message: 'Draft contract not found',
        });
        return;
      }

      // Look up exporter_id for authorization check
      const exporterId = await this.getExporterIdFromUser(userId, username);

      if (!exporterId) {
        res.status(404).json({
          status: 'error',
          code: 'NOT_FOUND',
          message: 'Exporter profile not found for this user',
        });
        return;
      }

      // Authorization: only exporter can submit counter-offer
      if (draft.exporter_id !== exporterId) {
        res.status(403).json({
          status: 'error',
          code: 'FORBIDDEN',
          message: 'You do not have permission to submit counter-offer for this contract',
        });
        return;
      }

      // Verify status is COUNTERED
      if (draft.status !== ContractStatus.COUNTERED) {
        res.status(409).json({
          status: 'error',
          code: 'CONFLICT',
          message: `Cannot submit counter-offer for contract with status ${draft.status}. Only COUNTERED contracts can be countered.`,
        });
        return;
      }

      // Validate modifications
      const validation = this.validationService.validateCounterOfferModifications(modifications);
      if (!validation.isValid) {
        res.status(400).json({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: 'Invalid modifications',
          errors: validation.errors,
        });
        return;
      }

      // Apply modifications to contract
      const updateRequest: UpdateContractDraftRequest = {};
      if (modifications.buyer_email !== undefined) updateRequest.buyer_email = modifications.buyer_email;
      if (modifications.coffee_type !== undefined) updateRequest.coffee_type = modifications.coffee_type;
      if (modifications.quantity_bags !== undefined) updateRequest.quantity_bags = modifications.quantity_bags;
      if (modifications.unit_price !== undefined) updateRequest.unit_price = modifications.unit_price;
      if (modifications.currency !== undefined) updateRequest.currency = modifications.currency;
      if (modifications.payment_terms !== undefined) updateRequest.payment_terms = modifications.payment_terms;
      if (modifications.delivery_location !== undefined) updateRequest.delivery_location = modifications.delivery_location;
      if (modifications.delivery_date !== undefined) updateRequest.delivery_date = new Date(modifications.delivery_date);

      // Update contract with modifications
      const updatedContract = await this.contractService.updateDraft(draftId, updateRequest);

      // Create history entry for counter-offer
      await this.contractService.updateStatus(
        draftId,
        ContractStatus.COUNTERED,
        ActorType.EXPORTER,
        userId,
        ContractHistoryAction.COUNTERED,
        modifications
      );

      // Send notification to buyer
      await this.notificationService.notifyCounterOffer(
        updatedContract,
        draft.buyer_email,
        '', // buyer_id not available
        modifications
      );

      logger.info(`Counter-offer submitted: ${draftId} by exporter ${userId}`);

      res.status(200).json({
        status: 'success',
        message: 'Counter-offer submitted successfully',
        data: updatedContract,
      });
    } catch (error) {
      logger.error('Error submitting counter-offer', { error });
      next(error);
    }
  };

  /**
   * POST /api/contracts/drafts/:draftId/finalize
   * Finalize contract to blockchain
   */
  finalizeContract = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { draftId } = req.params;
      const userId = (req as any).user?.id;
      const username = (req as any).user?.username;
      const { confirmation } = req.body;

      if (!confirmation) {
        res.status(400).json({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: 'Confirmation is required to finalize contract',
        });
        return;
      }

      // Get existing draft
      const draft = await this.contractService.getDraftById(draftId);

      if (!draft) {
        res.status(404).json({
          status: 'error',
          code: 'NOT_FOUND',
          message: 'Draft contract not found',
        });
        return;
      }

      // Look up exporter_id for authorization check
      const exporterId = await this.getExporterIdFromUser(userId, username);

      if (!exporterId) {
        res.status(404).json({
          status: 'error',
          code: 'NOT_FOUND',
          message: 'Exporter profile not found for this user',
        });
        return;
      }

      // Authorization: only exporter can finalize
      if (draft.exporter_id !== exporterId) {
        res.status(403).json({
          status: 'error',
          code: 'FORBIDDEN',
          message: 'You do not have permission to finalize this contract',
        });
        return;
      }

      // Verify status is ACCEPTED
      if (draft.status !== ContractStatus.ACCEPTED) {
        res.status(409).json({
          status: 'error',
          code: 'CONFLICT',
          message: `Cannot finalize contract with status ${draft.status}. Only ACCEPTED contracts can be finalized.`,
        });
        return;
      }

      // Validate all required fields are populated
      const validation = this.validationService.validateFinalizationRequirements(draft);
      if (!validation.isValid) {
        res.status(400).json({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: 'Contract validation failed',
          errors: validation.errors,
        });
        return;
      }

      // Submit to blockchain (with retry logic)
      let blockchainTxHash: string | null = null;
      let lastError: Error | null = null;
      const maxRetries = 3;
      const backoffDelays = [1000, 2000, 4000]; // 1s, 2s, 4s

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          // Submit to blockchain using BlockchainService
          const transaction = await this.blockchainService.submitContract(draft);
          blockchainTxHash = transaction.txHash;
          logger.info(`Blockchain submission successful on attempt ${attempt + 1}: ${blockchainTxHash}`);
          break;
        } catch (error) {
          lastError = error as Error;
          logger.warn(`Blockchain submission failed on attempt ${attempt + 1}: ${lastError.message}`);

          if (attempt < maxRetries - 1) {
            // Wait before retrying
            await new Promise((resolve) => setTimeout(resolve, backoffDelays[attempt]));
          }
        }
      }

      if (!blockchainTxHash) {
        logger.error(`Blockchain submission failed after ${maxRetries} attempts`, { error: lastError });
        res.status(503).json({
          status: 'error',
          code: 'BLOCKCHAIN_ERROR',
          message: 'Failed to submit contract to blockchain. Please try again later.',
          details: lastError?.message,
        });
        return;
      }

      // Update contract with blockchain hash and status
      const updatedContract = await this.contractService.updateBlockchainHash(draftId, blockchainTxHash);

      // Update status to FINALIZED
      const finalizedContract = await this.contractService.updateStatus(
        draftId,
        ContractStatus.FINALIZED,
        ActorType.EXPORTER,
        userId,
        ContractHistoryAction.FINALIZED,
        { blockchain_tx_hash: blockchainTxHash }
      );

      // Trigger ECTA registration (async, don't wait for completion)
      this.triggerEctaRegistration(draftId, finalizedContract).catch((error) => {
        logger.error(`Error triggering ECTA registration for ${draftId}`, { error });
      });

      // Send notification to buyer (skip if fails due to schema issues)
      try {
        await this.notificationService.notifyContractFinalized(
          finalizedContract,
          draft.buyer_email,
          blockchainTxHash
        );
      } catch (notifError) {
        logger.warn(`Failed to send notification (non-critical): ${notifError}`);
      }

      logger.info(`Contract finalized: ${draftId} by exporter ${userId}, tx_hash: ${blockchainTxHash}`);

      res.status(200).json({
        status: 'success',
        message: 'Contract finalized successfully',
        data: {
          ...finalizedContract,
          blockchain_tx_hash: blockchainTxHash,
        },
      });
    } catch (error) {
      logger.error('Error finalizing contract', { error });
      next(error);
    }
  };

  /**
   * Private helper method to trigger ECTA registration
   */
  private async triggerEctaRegistration(draftId: string, contract: any): Promise<void> {
    // TODO: Implement ECTA registration trigger
    // This should be called asynchronously after blockchain finalization
    logger.info(`ECTA registration triggered for contract ${draftId}`);
  }

  /**
   * GET /api/contracts/:referenceNumber
   * Get contract by ECTA reference number (public endpoint)
   */
  getContractByReference = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { referenceNumber } = req.params;

      if (!referenceNumber || typeof referenceNumber !== 'string' || referenceNumber.trim().length === 0) {
        res.status(400).json({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: 'Reference number is required',
        });
        return;
      }

      const contract = await this.contractService.getContractByEctaReference(referenceNumber);

      if (!contract) {
        res.status(404).json({
          status: 'error',
          code: 'NOT_FOUND',
          message: 'Contract not found with the provided reference number',
        });
        return;
      }

      logger.info(`Contract retrieved by reference: ${referenceNumber}`);

      res.status(200).json({
        status: 'success',
        data: contract,
      });
    } catch (error) {
      logger.error('Error retrieving contract by reference', { error });
      next(error);
    }
  };
}
