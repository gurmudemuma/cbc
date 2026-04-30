/**
 * API Endpoint Tests - Contract Action Endpoints
 * Tests for send, accept, reject, counter, and finalize endpoints
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Request, Response } from 'express';
import { ContractController } from '../../controllers/contract.controller';
import { ContractService } from '../../services/contract.service';
import { NotificationService } from '../../services/notification.service';
import { BlockchainService } from '../../services/blockchain.service';
import { ECTAService } from '../../services/ecta.service';

// Mock dependencies
vi.mock('../../services/contract.service');
vi.mock('../../services/notification.service');
vi.mock('../../services/blockchain.service');
vi.mock('../../services/ecta.service');
vi.mock('@shared/database/pool');
vi.mock('@shared/database/transaction');

describe('Contract Action API Endpoints', () => {
  let controller: ContractController;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: any;

  beforeEach(() => {
    controller = new ContractController();
    
    mockReq = {
      user: {
        id: 'user-123',
        email: 'exporter@example.com',
        role: 'EXPORTER',
      },
      params: {},
      body: {},
      query: {},
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/contracts/drafts/:draftId/send - Send to Buyer', () => {
    it('should send contract to buyer successfully', async () => {
      mockReq.params = { draftId: 'draft-123' };
      mockReq.body = { confirmation: true };

      const draft = {
        draft_id: 'draft-123',
        exporter_id: 'user-123',
        status: 'DRAFT',
        buyer_email: 'buyer@example.com',
        buyer_name: 'John Buyer',
      };

      const updatedDraft = {
        ...draft,
        status: 'COUNTERED',
        last_modified_at: new Date(),
      };

      vi.spyOn(ContractService.prototype, 'getDraftById').mockResolvedValue(draft);
      vi.spyOn(ContractService.prototype, 'updateStatus').mockResolvedValue(updatedDraft);
      vi.spyOn(NotificationService.prototype, 'notifyContractSent').mockResolvedValue(true);

      await controller.sendToBuyer(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          message: expect.stringContaining('sent'),
        })
      );
    });

    it('should return 404 if draft not found', async () => {
      mockReq.params = { draftId: 'nonexistent-draft' };
      mockReq.body = { confirmation: true };

      vi.spyOn(ContractService.prototype, 'getDraftById').mockResolvedValue(null);

      await controller.sendToBuyer(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should return 409 if contract is not in DRAFT status', async () => {
      mockReq.params = { draftId: 'draft-123' };
      mockReq.body = { confirmation: true };

      const draft = {
        draft_id: 'draft-123',
        exporter_id: 'user-123',
        status: 'COUNTERED', // Not DRAFT
        buyer_email: 'buyer@example.com',
      };

      vi.spyOn(ContractService.prototype, 'getDraftById').mockResolvedValue(draft);

      await controller.sendToBuyer(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          code: 'CONFLICT',
        })
      );
    });

    it('should return 403 if user is not authorized', async () => {
      mockReq.params = { draftId: 'draft-123' };
      mockReq.user = { id: 'different-user', email: 'other@example.com', role: 'EXPORTER' };
      mockReq.body = { confirmation: true };

      const draft = {
        draft_id: 'draft-123',
        exporter_id: 'user-123', // Different exporter
        status: 'DRAFT',
      };

      vi.spyOn(ContractService.prototype, 'getDraftById').mockResolvedValue(draft);

      await controller.sendToBuyer(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    it('should trigger email notification to buyer', async () => {
      mockReq.params = { draftId: 'draft-123' };
      mockReq.body = { confirmation: true };

      const draft = {
        draft_id: 'draft-123',
        exporter_id: 'user-123',
        status: 'DRAFT',
        buyer_email: 'buyer@example.com',
        buyer_name: 'John Buyer',
      };

      const updatedDraft = { ...draft, status: 'COUNTERED' };

      vi.spyOn(ContractService.prototype, 'getDraftById').mockResolvedValue(draft);
      vi.spyOn(ContractService.prototype, 'updateStatus').mockResolvedValue(updatedDraft);
      const notifySpy = vi.spyOn(NotificationService.prototype, 'notifyContractSent').mockResolvedValue(true);

      await controller.sendToBuyer(mockReq as Request, mockRes as Response, mockNext);

      expect(notifySpy).toHaveBeenCalledWith(
        expect.anything(),
        'draft-123',
        'buyer@example.com',
        'John Buyer',
        expect.any(Object)
      );
    });
  });

  describe('POST /api/contracts/drafts/:draftId/accept - Accept Counter-Offer', () => {
    it('should accept counter-offer successfully', async () => {
      mockReq.params = { draftId: 'draft-123' };
      mockReq.body = { confirmation: true };

      const draft = {
        draft_id: 'draft-123',
        exporter_id: 'user-123',
        status: 'COUNTERED',
        buyer_email: 'buyer@example.com',
      };

      const updatedDraft = {
        ...draft,
        status: 'ACCEPTED',
        last_modified_at: new Date(),
      };

      vi.spyOn(ContractService.prototype, 'getDraftById').mockResolvedValue(draft);
      vi.spyOn(ContractService.prototype, 'updateStatus').mockResolvedValue(updatedDraft);
      vi.spyOn(NotificationService.prototype, 'notifyCounterAccepted').mockResolvedValue(true);

      await controller.acceptCounterOffer(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          message: expect.stringContaining('accepted'),
        })
      );
    });

    it('should return 409 if contract is not in COUNTERED status', async () => {
      mockReq.params = { draftId: 'draft-123' };
      mockReq.body = { confirmation: true };

      const draft = {
        draft_id: 'draft-123',
        exporter_id: 'user-123',
        status: 'DRAFT', // Not COUNTERED
      };

      vi.spyOn(ContractService.prototype, 'getDraftById').mockResolvedValue(draft);

      await controller.acceptCounterOffer(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(409);
    });

    it('should update status to ACCEPTED', async () => {
      mockReq.params = { draftId: 'draft-123' };
      mockReq.body = { confirmation: true };

      const draft = {
        draft_id: 'draft-123',
        exporter_id: 'user-123',
        status: 'COUNTERED',
      };

      const updatedDraft = { ...draft, status: 'ACCEPTED' };

      vi.spyOn(ContractService.prototype, 'getDraftById').mockResolvedValue(draft);
      const updateSpy = vi.spyOn(ContractService.prototype, 'updateStatus').mockResolvedValue(updatedDraft);
      vi.spyOn(NotificationService.prototype, 'notifyCounterAccepted').mockResolvedValue(true);

      await controller.acceptCounterOffer(mockReq as Request, mockRes as Response, mockNext);

      expect(updateSpy).toHaveBeenCalledWith(
        expect.anything(),
        'draft-123',
        'ACCEPTED',
        expect.any(String),
        expect.any(String),
        expect.any(String)
      );
    });
  });

  describe('POST /api/contracts/drafts/:draftId/reject - Reject Contract', () => {
    it('should reject contract with reason', async () => {
      mockReq.params = { draftId: 'draft-123' };
      mockReq.body = { reason: 'Price too high' };

      const draft = {
        draft_id: 'draft-123',
        exporter_id: 'user-123',
        status: 'COUNTERED',
        buyer_email: 'buyer@example.com',
      };

      const updatedDraft = {
        ...draft,
        status: 'REJECTED',
        last_modified_at: new Date(),
      };

      vi.spyOn(ContractService.prototype, 'getDraftById').mockResolvedValue(draft);
      vi.spyOn(ContractService.prototype, 'updateStatus').mockResolvedValue(updatedDraft);
      vi.spyOn(NotificationService.prototype, 'notifyContractRejected').mockResolvedValue(true);

      await controller.rejectContract(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          message: expect.stringContaining('rejected'),
        })
      );
    });

    it('should return 400 if reason is missing', async () => {
      mockReq.params = { draftId: 'draft-123' };
      mockReq.body = {}; // No reason

      const draft = {
        draft_id: 'draft-123',
        exporter_id: 'user-123',
        status: 'COUNTERED',
      };

      vi.spyOn(ContractService.prototype, 'getDraftById').mockResolvedValue(draft);

      await controller.rejectContract(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          code: 'VALIDATION_ERROR',
        })
      );
    });

    it('should store rejection reason in history', async () => {
      mockReq.params = { draftId: 'draft-123' };
      mockReq.body = { reason: 'Price too high' };

      const draft = {
        draft_id: 'draft-123',
        exporter_id: 'user-123',
        status: 'COUNTERED',
      };

      const updatedDraft = { ...draft, status: 'REJECTED' };

      vi.spyOn(ContractService.prototype, 'getDraftById').mockResolvedValue(draft);
      const updateSpy = vi.spyOn(ContractService.prototype, 'updateStatus').mockResolvedValue(updatedDraft);
      vi.spyOn(NotificationService.prototype, 'notifyContractRejected').mockResolvedValue(true);

      await controller.rejectContract(mockReq as Request, mockRes as Response, mockNext);

      expect(updateSpy).toHaveBeenCalledWith(
        expect.anything(),
        'draft-123',
        'REJECTED',
        expect.any(String),
        expect.any(String),
        expect.any(String),
        'Price too high'
      );
    });
  });

  describe('POST /api/contracts/drafts/:draftId/counter - Submit Counter-Offer', () => {
    it('should submit counter-offer with modifications', async () => {
      mockReq.params = { draftId: 'draft-123' };
      mockReq.body = {
        quantity_bags: 120,
        unit_price: 155.00,
      };

      const draft = {
        draft_id: 'draft-123',
        exporter_id: 'user-123',
        status: 'COUNTERED',
        buyer_email: 'buyer@example.com',
      };

      const updatedDraft = {
        ...draft,
        quantity_bags: 120,
        unit_price: 155.00,
        last_modified_at: new Date(),
      };

      vi.spyOn(ContractService.prototype, 'getDraftById').mockResolvedValue(draft);
      vi.spyOn(ContractService.prototype, 'updateDraft').mockResolvedValue(updatedDraft);
      vi.spyOn(ContractService.prototype, 'updateStatus').mockResolvedValue(updatedDraft);
      vi.spyOn(NotificationService.prototype, 'notifyCounterOffer').mockResolvedValue(true);

      await controller.submitCounterOffer(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          message: expect.stringContaining('counter'),
        })
      );
    });

    it('should return 400 if modifications are invalid', async () => {
      mockReq.params = { draftId: 'draft-123' };
      mockReq.body = {
        quantity_bags: -50, // Invalid
      };

      const draft = {
        draft_id: 'draft-123',
        exporter_id: 'user-123',
        status: 'COUNTERED',
      };

      vi.spyOn(ContractService.prototype, 'getDraftById').mockResolvedValue(draft);

      await controller.submitCounterOffer(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should create history entry for counter-offer', async () => {
      mockReq.params = { draftId: 'draft-123' };
      mockReq.body = {
        quantity_bags: 120,
        unit_price: 155.00,
      };

      const draft = {
        draft_id: 'draft-123',
        exporter_id: 'user-123',
        status: 'COUNTERED',
      };

      const updatedDraft = { ...draft, quantity_bags: 120, unit_price: 155.00 };

      vi.spyOn(ContractService.prototype, 'getDraftById').mockResolvedValue(draft);
      vi.spyOn(ContractService.prototype, 'updateDraft').mockResolvedValue(updatedDraft);
      const updateStatusSpy = vi.spyOn(ContractService.prototype, 'updateStatus').mockResolvedValue(updatedDraft);
      vi.spyOn(NotificationService.prototype, 'notifyCounterOffer').mockResolvedValue(true);

      await controller.submitCounterOffer(mockReq as Request, mockRes as Response, mockNext);

      expect(updateStatusSpy).toHaveBeenCalled();
    });
  });

  describe('POST /api/contracts/drafts/:draftId/finalize - Finalize Contract', () => {
    it('should finalize contract to blockchain successfully', async () => {
      mockReq.params = { draftId: 'draft-123' };
      mockReq.body = { confirmation: true };

      const draft = {
        draft_id: 'draft-123',
        exporter_id: 'user-123',
        status: 'ACCEPTED',
        buyer_email: 'buyer@example.com',
        coffee_type: 'Arabica',
        quantity_bags: 100,
        unit_price: 150.50,
      };

      const blockchainTxHash = 'tx-hash-123456';
      const ecta_reference = 'ECTA-2024-000001';

      const finalizedDraft = {
        ...draft,
        status: 'FINALIZED',
        blockchain_tx_hash: blockchainTxHash,
        ecta_reference_number: ecta_reference,
        finalized_at: new Date(),
      };

      vi.spyOn(ContractService.prototype, 'getDraftById').mockResolvedValue(draft);
      vi.spyOn(BlockchainService.prototype, 'submitContract').mockResolvedValue(blockchainTxHash);
      vi.spyOn(ECTAService.prototype, 'registerContract').mockResolvedValue(ecta_reference);
      vi.spyOn(ContractService.prototype, 'updateStatus').mockResolvedValue(finalizedDraft);
      vi.spyOn(NotificationService.prototype, 'notifyContractFinalized').mockResolvedValue(true);

      await controller.finalizeContract(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          message: expect.stringContaining('finalized'),
          data: expect.objectContaining({
            blockchain_tx_hash: blockchainTxHash,
            ecta_reference_number: ecta_reference,
          }),
        })
      );
    });

    it('should return 409 if contract is not in ACCEPTED status', async () => {
      mockReq.params = { draftId: 'draft-123' };
      mockReq.body = { confirmation: true };

      const draft = {
        draft_id: 'draft-123',
        exporter_id: 'user-123',
        status: 'DRAFT', // Not ACCEPTED
      };

      vi.spyOn(ContractService.prototype, 'getDraftById').mockResolvedValue(draft);

      await controller.finalizeContract(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          code: 'CONFLICT',
        })
      );
    });

    it('should submit contract to blockchain', async () => {
      mockReq.params = { draftId: 'draft-123' };
      mockReq.body = { confirmation: true };

      const draft = {
        draft_id: 'draft-123',
        exporter_id: 'user-123',
        status: 'ACCEPTED',
      };

      const blockchainTxHash = 'tx-hash-123456';

      vi.spyOn(ContractService.prototype, 'getDraftById').mockResolvedValue(draft);
      const blockchainSpy = vi.spyOn(BlockchainService.prototype, 'submitContract').mockResolvedValue(blockchainTxHash);
      vi.spyOn(ECTAService.prototype, 'registerContract').mockResolvedValue('ECTA-2024-000001');
      vi.spyOn(ContractService.prototype, 'updateStatus').mockResolvedValue({ ...draft, status: 'FINALIZED' });
      vi.spyOn(NotificationService.prototype, 'notifyContractFinalized').mockResolvedValue(true);

      await controller.finalizeContract(mockReq as Request, mockRes as Response, mockNext);

      expect(blockchainSpy).toHaveBeenCalledWith(draft);
    });

    it('should trigger ECTA registration', async () => {
      mockReq.params = { draftId: 'draft-123' };
      mockReq.body = { confirmation: true };

      const draft = {
        draft_id: 'draft-123',
        exporter_id: 'user-123',
        status: 'ACCEPTED',
      };

      vi.spyOn(ContractService.prototype, 'getDraftById').mockResolvedValue(draft);
      vi.spyOn(BlockchainService.prototype, 'submitContract').mockResolvedValue('tx-hash-123456');
      const ectaSpy = vi.spyOn(ECTAService.prototype, 'registerContract').mockResolvedValue('ECTA-2024-000001');
      vi.spyOn(ContractService.prototype, 'updateStatus').mockResolvedValue({ ...draft, status: 'FINALIZED' });
      vi.spyOn(NotificationService.prototype, 'notifyContractFinalized').mockResolvedValue(true);

      await controller.finalizeContract(mockReq as Request, mockRes as Response, mockNext);

      expect(ectaSpy).toHaveBeenCalledWith(draft, 'tx-hash-123456');
    });

    it('should update status to FINALIZED', async () => {
      mockReq.params = { draftId: 'draft-123' };
      mockReq.body = { confirmation: true };

      const draft = {
        draft_id: 'draft-123',
        exporter_id: 'user-123',
        status: 'ACCEPTED',
      };

      vi.spyOn(ContractService.prototype, 'getDraftById').mockResolvedValue(draft);
      vi.spyOn(BlockchainService.prototype, 'submitContract').mockResolvedValue('tx-hash-123456');
      vi.spyOn(ECTAService.prototype, 'registerContract').mockResolvedValue('ECTA-2024-000001');
      const updateSpy = vi.spyOn(ContractService.prototype, 'updateStatus').mockResolvedValue({
        ...draft,
        status: 'FINALIZED',
      });
      vi.spyOn(NotificationService.prototype, 'notifyContractFinalized').mockResolvedValue(true);

      await controller.finalizeContract(mockReq as Request, mockRes as Response, mockNext);

      expect(updateSpy).toHaveBeenCalledWith(
        expect.anything(),
        'draft-123',
        'FINALIZED',
        expect.any(String),
        expect.any(String),
        expect.any(String)
      );
    });

    it('should retry blockchain submission on failure', async () => {
      mockReq.params = { draftId: 'draft-123' };
      mockReq.body = { confirmation: true };

      const draft = {
        draft_id: 'draft-123',
        exporter_id: 'user-123',
        status: 'ACCEPTED',
      };

      vi.spyOn(ContractService.prototype, 'getDraftById').mockResolvedValue(draft);
      const blockchainSpy = vi
        .spyOn(BlockchainService.prototype, 'submitContract')
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce('tx-hash-123456');

      vi.spyOn(ECTAService.prototype, 'registerContract').mockResolvedValue('ECTA-2024-000001');
      vi.spyOn(ContractService.prototype, 'updateStatus').mockResolvedValue({ ...draft, status: 'FINALIZED' });
      vi.spyOn(NotificationService.prototype, 'notifyContractFinalized').mockResolvedValue(true);

      await controller.finalizeContract(mockReq as Request, mockRes as Response, mockNext);

      // Should retry after first failure
      expect(blockchainSpy).toHaveBeenCalledTimes(2);
    });

    it('should notify exporter on successful finalization', async () => {
      mockReq.params = { draftId: 'draft-123' };
      mockReq.body = { confirmation: true };

      const draft = {
        draft_id: 'draft-123',
        exporter_id: 'user-123',
        status: 'ACCEPTED',
      };

      vi.spyOn(ContractService.prototype, 'getDraftById').mockResolvedValue(draft);
      vi.spyOn(BlockchainService.prototype, 'submitContract').mockResolvedValue('tx-hash-123456');
      vi.spyOn(ECTAService.prototype, 'registerContract').mockResolvedValue('ECTA-2024-000001');
      vi.spyOn(ContractService.prototype, 'updateStatus').mockResolvedValue({ ...draft, status: 'FINALIZED' });
      const notifySpy = vi.spyOn(NotificationService.prototype, 'notifyContractFinalized').mockResolvedValue(true);

      await controller.finalizeContract(mockReq as Request, mockRes as Response, mockNext);

      expect(notifySpy).toHaveBeenCalled();
    });
  });
});
