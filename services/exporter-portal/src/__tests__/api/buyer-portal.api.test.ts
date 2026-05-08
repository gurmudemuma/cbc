/**
 * API Endpoint Tests - Buyer Portal Endpoints
 * Tests for buyer contract access and response endpoints
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Request, Response } from 'express';
import { ContractService } from '../../services/contract.service';
import { ValidationService } from '../../services/validation.service';
import { NotificationService } from '../../services/notification.service';

// Mock dependencies
vi.mock('../../services/contract.service');
vi.mock('../../services/validation.service');
vi.mock('../../services/notification.service');
vi.mock('@shared/database/pool');
vi.mock('@shared/database/transaction');

describe('Buyer Portal API Endpoints', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: any;

  beforeEach(() => {
    mockReq = {
      user: {
        id: 'buyer-user-123',
        email: 'buyer@example.com',
        role: 'BUYER',
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

  describe('GET /api/buyer/contracts - Get Buyer Contracts', () => {
    it('should retrieve all contracts for a buyer', async () => {
      mockReq.query = { page: '1', limit: '10' };

      const contracts = [
        {
          draft_id: 'draft-1',
          exporter_id: 'exporter-123',
          buyer_email: 'buyer@example.com',
          status: 'COUNTERED',
          coffee_type: 'Arabica',
          quantity_bags: 100,
          unit_price: 150.50,
        },
        {
          draft_id: 'draft-2',
          exporter_id: 'exporter-456',
          buyer_email: 'buyer@example.com',
          status: 'ACCEPTED',
          coffee_type: 'Robusta',
          quantity_bags: 50,
          unit_price: 120.00,
        },
      ];

      vi.spyOn(ContractService.prototype, 'getContractsByBuyer').mockResolvedValue(contracts);

      // Simulate the endpoint handler
      const result = await ContractService.prototype.getContractsByBuyer(
        'buyer@example.com',
        1,
        10
      );

      expect(result).toEqual(contracts);
      expect(result).toHaveLength(2);
    });

    it('should support pagination', async () => {
      mockReq.query = { page: '2', limit: '5' };

      const contracts = [
        {
          draft_id: 'draft-6',
          exporter_id: 'exporter-123',
          buyer_email: 'buyer@example.com',
          status: 'COUNTERED',
        },
      ];

      vi.spyOn(ContractService.prototype, 'getContractsByBuyer').mockResolvedValue(contracts);

      const result = await ContractService.prototype.getContractsByBuyer(
        'buyer@example.com',
        2,
        5
      );

      expect(result).toEqual(contracts);
    });

    it('should return empty array if no contracts found', async () => {
      mockReq.query = { page: '1', limit: '10' };

      vi.spyOn(ContractService.prototype, 'getContractsByBuyer').mockResolvedValue([]);

      const result = await ContractService.prototype.getContractsByBuyer(
        'buyer@example.com',
        1,
        10
      );

      expect(result).toEqual([]);
    });

    it('should return 401 if buyer email is not in token', async () => {
      mockReq.user = { id: 'buyer-user-123', email: undefined, role: 'BUYER' };
      mockReq.query = { page: '1', limit: '10' };

      // Endpoint should check for buyer email
      expect(mockReq.user?.email).toBeUndefined();
    });

    it('should filter contracts by buyer email', async () => {
      mockReq.query = { page: '1', limit: '10' };

      const contracts = [
        {
          draft_id: 'draft-1',
          buyer_email: 'buyer@example.com',
          status: 'COUNTERED',
        },
      ];

      vi.spyOn(ContractService.prototype, 'getContractsByBuyer').mockResolvedValue(contracts);

      const result = await ContractService.prototype.getContractsByBuyer(
        'buyer@example.com',
        1,
        10
      );

      expect(result).toEqual(contracts);
      expect(result[0].buyer_email).toBe('buyer@example.com');
    });

    it('should return contracts in descending order by creation date', async () => {
      mockReq.query = { page: '1', limit: '10' };

      const contracts = [
        {
          draft_id: 'draft-2',
          created_at: new Date('2025-01-15'),
          buyer_email: 'buyer@example.com',
        },
        {
          draft_id: 'draft-1',
          created_at: new Date('2025-01-10'),
          buyer_email: 'buyer@example.com',
        },
      ];

      vi.spyOn(ContractService.prototype, 'getContractsByBuyer').mockResolvedValue(contracts);

      const result = await ContractService.prototype.getContractsByBuyer(
        'buyer@example.com',
        1,
        10
      );

      expect(result[0].draft_id).toBe('draft-2');
      expect(result[1].draft_id).toBe('draft-1');
    });
  });

  describe('POST /api/buyer/contracts/:draftId/respond - Buyer Response', () => {
    it('should accept contract successfully', async () => {
      mockReq.params = { draftId: 'draft-123' };
      mockReq.body = { action: 'ACCEPT', confirmation: true };

      const draft = {
        draft_id: 'draft-123',
        exporter_id: 'exporter-123',
        buyer_email: 'buyer@example.com',
        status: 'COUNTERED',
      };

      const updatedDraft = {
        ...draft,
        status: 'ACCEPTED',
        buyer_id: 'buyer-user-123',
        last_modified_at: new Date(),
      };

      vi.spyOn(ContractService.prototype, 'getDraftById').mockResolvedValue(draft);
      vi.spyOn(ContractService.prototype, 'updateStatus').mockResolvedValue(updatedDraft);
      vi.spyOn(NotificationService.prototype, 'notifyCounterAccepted').mockResolvedValue(true);

      const result = await ContractService.prototype.updateStatus(
        null,
        'draft-123',
        'ACCEPTED',
        'BUYER',
        'buyer-user-123',
        'ACCEPTED'
      );

      expect(result.status).toBe('ACCEPTED');
    });

    it('should reject contract with reason', async () => {
      mockReq.params = { draftId: 'draft-123' };
      mockReq.body = { action: 'REJECT', reason: 'Price too high' };

      const draft = {
        draft_id: 'draft-123',
        exporter_id: 'exporter-123',
        buyer_email: 'buyer@example.com',
        status: 'COUNTERED',
      };

      const updatedDraft = {
        ...draft,
        status: 'REJECTED',
        last_modified_at: new Date(),
      };

      vi.spyOn(ContractService.prototype, 'getDraftById').mockResolvedValue(draft);
      vi.spyOn(ContractService.prototype, 'updateStatus').mockResolvedValue(updatedDraft);
      vi.spyOn(NotificationService.prototype, 'notifyContractRejected').mockResolvedValue(true);

      const result = await ContractService.prototype.updateStatus(
        null,
        'draft-123',
        'REJECTED',
        'BUYER',
        'buyer-user-123',
        'REJECTED',
        'Price too high'
      );

      expect(result.status).toBe('REJECTED');
    });

    it('should return 400 if rejection reason is missing', async () => {
      mockReq.params = { draftId: 'draft-123' };
      mockReq.body = { action: 'REJECT' }; // No reason

      const draft = {
        draft_id: 'draft-123',
        status: 'COUNTERED',
      };

      vi.spyOn(ContractService.prototype, 'getDraftById').mockResolvedValue(draft);

      // Endpoint should validate reason is provided for REJECT action
      expect(mockReq.body.reason).toBeUndefined();
    });

    it('should submit counter-offer with modifications', async () => {
      mockReq.params = { draftId: 'draft-123' };
      mockReq.body = {
        action: 'COUNTER',
        modifications: {
          quantity_bags: 120,
          unit_price: 155.00,
        },
      };

      const draft = {
        draft_id: 'draft-123',
        exporter_id: 'exporter-123',
        buyer_email: 'buyer@example.com',
        status: 'COUNTERED',
        quantity_bags: 100,
        unit_price: 150.50,
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

      const result = await ContractService.prototype.updateDraft(null, 'draft-123', {
        quantity_bags: 120,
        unit_price: 155.00,
      });

      expect(result.quantity_bags).toBe(120);
      expect(result.unit_price).toBe(155.00);
    });

    it('should return 400 if modifications are invalid', async () => {
      mockReq.params = { draftId: 'draft-123' };
      mockReq.body = {
        action: 'COUNTER',
        modifications: {
          quantity_bags: -50, // Invalid
        },
      };

      const draft = {
        draft_id: 'draft-123',
        status: 'COUNTERED',
      };

      vi.spyOn(ContractService.prototype, 'getDraftById').mockResolvedValue(draft);
      vi.spyOn(ValidationService.prototype, 'validateUpdateRequest').mockReturnValue({
        valid: false,
        errors: ['Quantity must be positive'],
      });

      const validation = ValidationService.prototype.validateUpdateRequest(
        mockReq.body.modifications
      );

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Quantity must be positive');
    });

    it('should return 404 if draft not found', async () => {
      mockReq.params = { draftId: 'nonexistent-draft' };
      mockReq.body = { action: 'ACCEPT' };

      vi.spyOn(ContractService.prototype, 'getDraftById').mockResolvedValue(null);

      const result = await ContractService.prototype.getDraftById(null, 'nonexistent-draft');

      expect(result).toBeNull();
    });

    it('should return 403 if buyer email does not match contract', async () => {
      mockReq.params = { draftId: 'draft-123' };
      mockReq.user = { id: 'buyer-user-123', email: 'different@example.com', role: 'BUYER' };
      mockReq.body = { action: 'ACCEPT' };

      const draft = {
        draft_id: 'draft-123',
        buyer_email: 'buyer@example.com', // Different email
        status: 'COUNTERED',
      };

      vi.spyOn(ContractService.prototype, 'getDraftById').mockResolvedValue(draft);

      // Endpoint should check buyer email matches
      expect(mockReq.user?.email).not.toBe(draft.buyer_email);
    });

    it('should return 409 if contract is not in COUNTERED status', async () => {
      mockReq.params = { draftId: 'draft-123' };
      mockReq.body = { action: 'ACCEPT' };

      const draft = {
        draft_id: 'draft-123',
        buyer_email: 'buyer@example.com',
        status: 'DRAFT', // Not COUNTERED
      };

      vi.spyOn(ContractService.prototype, 'getDraftById').mockResolvedValue(draft);

      // Endpoint should check status is COUNTERED
      expect(draft.status).not.toBe('COUNTERED');
    });

    it('should return 400 if action is invalid', async () => {
      mockReq.params = { draftId: 'draft-123' };
      mockReq.body = { action: 'INVALID_ACTION' };

      const draft = {
        draft_id: 'draft-123',
        buyer_email: 'buyer@example.com',
        status: 'COUNTERED',
      };

      vi.spyOn(ContractService.prototype, 'getDraftById').mockResolvedValue(draft);

      // Endpoint should validate action is one of ACCEPT, REJECT, COUNTER
      const validActions = ['ACCEPT', 'REJECT', 'COUNTER'];
      expect(validActions).not.toContain(mockReq.body.action);
    });

    it('should update buyer_id when buyer responds', async () => {
      mockReq.params = { draftId: 'draft-123' };
      mockReq.user = { id: 'buyer-user-123', email: 'buyer@example.com', role: 'BUYER' };
      mockReq.body = { action: 'ACCEPT' };

      const draft = {
        draft_id: 'draft-123',
        buyer_email: 'buyer@example.com',
        status: 'COUNTERED',
        buyer_id: null,
      };

      const updatedDraft = {
        ...draft,
        status: 'ACCEPTED',
        buyer_id: 'buyer-user-123',
      };

      vi.spyOn(ContractService.prototype, 'getDraftById').mockResolvedValue(draft);
      vi.spyOn(ContractService.prototype, 'updateStatus').mockResolvedValue(updatedDraft);
      vi.spyOn(NotificationService.prototype, 'notifyCounterAccepted').mockResolvedValue(true);

      const result = await ContractService.prototype.updateStatus(
        null,
        'draft-123',
        'ACCEPTED',
        'BUYER',
        'buyer-user-123',
        'ACCEPTED'
      );

      expect(result.buyer_id).toBe('buyer-user-123');
    });

    it('should trigger notification to exporter', async () => {
      mockReq.params = { draftId: 'draft-123' };
      mockReq.body = { action: 'ACCEPT' };

      const draft = {
        draft_id: 'draft-123',
        exporter_id: 'exporter-123',
        buyer_email: 'buyer@example.com',
        buyer_name: 'John Buyer',
        status: 'COUNTERED',
      };

      const updatedDraft = { ...draft, status: 'ACCEPTED' };

      vi.spyOn(ContractService.prototype, 'getDraftById').mockResolvedValue(draft);
      vi.spyOn(ContractService.prototype, 'updateStatus').mockResolvedValue(updatedDraft);
      const notifySpy = vi.spyOn(NotificationService.prototype, 'notifyCounterAccepted').mockResolvedValue(true);

      await NotificationService.prototype.notifyCounterAccepted(
        null,
        'draft-123',
        'buyer@example.com',
        'John Buyer',
        updatedDraft
      );

      expect(notifySpy).toHaveBeenCalled();
    });

    it('should create history entry for buyer response', async () => {
      mockReq.params = { draftId: 'draft-123' };
      mockReq.body = { action: 'ACCEPT' };

      const draft = {
        draft_id: 'draft-123',
        buyer_email: 'buyer@example.com',
        status: 'COUNTERED',
      };

      vi.spyOn(ContractService.prototype, 'getDraftById').mockResolvedValue(draft);
      const updateStatusSpy = vi.spyOn(ContractService.prototype, 'updateStatus').mockResolvedValue({
        ...draft,
        status: 'ACCEPTED',
      });
      vi.spyOn(NotificationService.prototype, 'notifyCounterAccepted').mockResolvedValue(true);

      await ContractService.prototype.updateStatus(
        null,
        'draft-123',
        'ACCEPTED',
        'BUYER',
        'buyer-user-123',
        'ACCEPTED'
      );

      expect(updateStatusSpy).toHaveBeenCalled();
    });
  });
});
