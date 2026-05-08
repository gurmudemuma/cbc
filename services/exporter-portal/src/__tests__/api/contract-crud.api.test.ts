/**
 * API Endpoint Tests - Contract CRUD Operations
 * Tests for POST, GET, PUT, DELETE endpoints
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Request, Response } from 'express';
import { ContractController } from '../../controllers/contract.controller';
import { ContractService } from '../../services/contract.service';
import { ValidationService } from '../../services/validation.service';

// Mock dependencies
vi.mock('../../services/contract.service');
vi.mock('../../services/validation.service');
vi.mock('@shared/database/pool');
vi.mock('@shared/database/transaction');

describe('Contract CRUD API Endpoints', () => {
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

  describe('POST /api/contracts/drafts - Create Draft', () => {
    it('should create a draft contract with valid data', async () => {
      const draftData = {
        buyer_name: 'John Buyer',
        buyer_email: 'buyer@example.com',
        coffee_type: 'Arabica',
        quantity_bags: 100,
        unit_price: 150.50,
        currency: 'USD',
        payment_terms: 'LC_AT_SIGHT',
        delivery_location: 'Port of Djibouti',
        delivery_date: '2025-06-15',
      };

      mockReq.body = draftData;

      const expectedDraft = {
        draft_id: 'draft-123',
        exporter_id: 'user-123',
        status: 'DRAFT',
        ...draftData,
        created_at: new Date(),
        last_modified_at: new Date(),
      };

      vi.spyOn(ContractService.prototype, 'createDraft').mockResolvedValue(expectedDraft);

      await controller.createDraft(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: expect.objectContaining({
            draft_id: 'draft-123',
            status: 'DRAFT',
          }),
        })
      );
    });

    it('should return 400 for missing required fields', async () => {
      mockReq.body = {
        buyer_name: 'John Buyer',
        // Missing other required fields
      };

      await controller.createDraft(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          code: 'VALIDATION_ERROR',
        })
      );
    });

    it('should return 400 for invalid delivery date (past date)', async () => {
      const draftData = {
        buyer_name: 'John Buyer',
        buyer_email: 'buyer@example.com',
        coffee_type: 'Arabica',
        quantity_bags: 100,
        unit_price: 150.50,
        currency: 'USD',
        payment_terms: 'LC_AT_SIGHT',
        delivery_location: 'Port of Djibouti',
        delivery_date: '2020-06-15', // Past date
      };

      mockReq.body = draftData;

      await controller.createDraft(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          code: 'VALIDATION_ERROR',
        })
      );
    });

    it('should return 400 for invalid quantity (zero or negative)', async () => {
      const draftData = {
        buyer_name: 'John Buyer',
        buyer_email: 'buyer@example.com',
        coffee_type: 'Arabica',
        quantity_bags: 0, // Invalid
        unit_price: 150.50,
        currency: 'USD',
        payment_terms: 'LC_AT_SIGHT',
        delivery_location: 'Port of Djibouti',
        delivery_date: '2025-06-15',
      };

      mockReq.body = draftData;

      await controller.createDraft(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for invalid unit price (zero or negative)', async () => {
      const draftData = {
        buyer_name: 'John Buyer',
        buyer_email: 'buyer@example.com',
        coffee_type: 'Arabica',
        quantity_bags: 100,
        unit_price: -50, // Invalid
        currency: 'USD',
        payment_terms: 'LC_AT_SIGHT',
        delivery_location: 'Port of Djibouti',
        delivery_date: '2025-06-15',
      };

      mockReq.body = draftData;

      await controller.createDraft(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for invalid currency code', async () => {
      const draftData = {
        buyer_name: 'John Buyer',
        buyer_email: 'buyer@example.com',
        coffee_type: 'Arabica',
        quantity_bags: 100,
        unit_price: 150.50,
        currency: 'INVALID', // Invalid ISO 4217 code
        payment_terms: 'LC_AT_SIGHT',
        delivery_location: 'Port of Djibouti',
        delivery_date: '2025-06-15',
      };

      mockReq.body = draftData;

      await controller.createDraft(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 401 if user is not authenticated', async () => {
      mockReq.user = undefined;

      await controller.createDraft(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('GET /api/contracts/drafts/:draftId - Get Draft', () => {
    it('should retrieve a draft contract by ID', async () => {
      mockReq.params = { draftId: 'draft-123' };

      const expectedDraft = {
        draft_id: 'draft-123',
        exporter_id: 'user-123',
        buyer_email: 'buyer@example.com',
        status: 'DRAFT',
        coffee_type: 'Arabica',
        quantity_bags: 100,
        unit_price: 150.50,
        currency: 'USD',
        payment_terms: 'LC_AT_SIGHT',
        delivery_location: 'Port of Djibouti',
        delivery_date: '2025-06-15',
        created_at: new Date(),
        last_modified_at: new Date(),
      };

      vi.spyOn(ContractService.prototype, 'getDraftById').mockResolvedValue(expectedDraft);

      await controller.getDraftById(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: expectedDraft,
        })
      );
    });

    it('should return 404 if draft not found', async () => {
      mockReq.params = { draftId: 'nonexistent-draft' };

      vi.spyOn(ContractService.prototype, 'getDraftById').mockResolvedValue(null);

      await controller.getDraftById(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          code: 'NOT_FOUND',
        })
      );
    });

    it('should return 403 if user is not authorized to view draft', async () => {
      mockReq.params = { draftId: 'draft-123' };
      mockReq.user = { id: 'different-user', email: 'other@example.com', role: 'EXPORTER' };

      const draft = {
        draft_id: 'draft-123',
        exporter_id: 'user-123', // Different exporter
        buyer_email: 'buyer@example.com',
        status: 'DRAFT',
      };

      vi.spyOn(ContractService.prototype, 'getDraftById').mockResolvedValue(draft);

      await controller.getDraftById(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          code: 'FORBIDDEN',
        })
      );
    });

    it('should allow buyer to view draft if buyer email matches', async () => {
      mockReq.params = { draftId: 'draft-123' };
      mockReq.user = { id: 'buyer-user', email: 'buyer@example.com', role: 'BUYER' };

      const draft = {
        draft_id: 'draft-123',
        exporter_id: 'user-123',
        buyer_email: 'buyer@example.com', // Matches buyer email
        status: 'DRAFT',
      };

      vi.spyOn(ContractService.prototype, 'getDraftById').mockResolvedValue(draft);

      await controller.getDraftById(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('PUT /api/contracts/drafts/:draftId - Update Draft', () => {
    it('should update a draft contract with valid data', async () => {
      mockReq.params = { draftId: 'draft-123' };
      mockReq.body = {
        quantity_bags: 150,
        unit_price: 160.00,
      };

      const updatedDraft = {
        draft_id: 'draft-123',
        exporter_id: 'user-123',
        status: 'DRAFT',
        quantity_bags: 150,
        unit_price: 160.00,
        last_modified_at: new Date(),
      };

      vi.spyOn(ContractService.prototype, 'getDraftById').mockResolvedValue({
        draft_id: 'draft-123',
        exporter_id: 'user-123',
        status: 'DRAFT',
      });

      vi.spyOn(ContractService.prototype, 'updateDraft').mockResolvedValue(updatedDraft);

      await controller.updateDraft(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: updatedDraft,
        })
      );
    });

    it('should return 409 if trying to update non-DRAFT contract', async () => {
      mockReq.params = { draftId: 'draft-123' };
      mockReq.body = { quantity_bags: 150 };

      vi.spyOn(ContractService.prototype, 'getDraftById').mockResolvedValue({
        draft_id: 'draft-123',
        exporter_id: 'user-123',
        status: 'COUNTERED', // Not DRAFT
      });

      await controller.updateDraft(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          code: 'CONFLICT',
        })
      );
    });

    it('should return 403 if user is not authorized to update draft', async () => {
      mockReq.params = { draftId: 'draft-123' };
      mockReq.user = { id: 'different-user', email: 'other@example.com', role: 'EXPORTER' };
      mockReq.body = { quantity_bags: 150 };

      vi.spyOn(ContractService.prototype, 'getDraftById').mockResolvedValue({
        draft_id: 'draft-123',
        exporter_id: 'user-123', // Different exporter
        status: 'DRAFT',
      });

      await controller.updateDraft(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    it('should return 400 for invalid update data', async () => {
      mockReq.params = { draftId: 'draft-123' };
      mockReq.body = {
        quantity_bags: -50, // Invalid
      };

      vi.spyOn(ContractService.prototype, 'getDraftById').mockResolvedValue({
        draft_id: 'draft-123',
        exporter_id: 'user-123',
        status: 'DRAFT',
      });

      await controller.updateDraft(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('DELETE /api/contracts/drafts/:draftId - Delete Draft', () => {
    it('should delete a DRAFT contract', async () => {
      mockReq.params = { draftId: 'draft-123' };

      vi.spyOn(ContractService.prototype, 'getDraftById').mockResolvedValue({
        draft_id: 'draft-123',
        exporter_id: 'user-123',
        status: 'DRAFT',
      });

      vi.spyOn(ContractService.prototype, 'deleteDraft').mockResolvedValue(true);

      await controller.deleteDraft(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(204);
    });

    it('should return 409 if trying to delete non-DRAFT contract', async () => {
      mockReq.params = { draftId: 'draft-123' };

      vi.spyOn(ContractService.prototype, 'getDraftById').mockResolvedValue({
        draft_id: 'draft-123',
        exporter_id: 'user-123',
        status: 'COUNTERED', // Not DRAFT
      });

      await controller.deleteDraft(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          code: 'CONFLICT',
        })
      );
    });

    it('should return 403 if user is not authorized to delete draft', async () => {
      mockReq.params = { draftId: 'draft-123' };
      mockReq.user = { id: 'different-user', email: 'other@example.com', role: 'EXPORTER' };

      vi.spyOn(ContractService.prototype, 'getDraftById').mockResolvedValue({
        draft_id: 'draft-123',
        exporter_id: 'user-123', // Different exporter
        status: 'DRAFT',
      });

      await controller.deleteDraft(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    it('should return 404 if draft not found', async () => {
      mockReq.params = { draftId: 'nonexistent-draft' };

      vi.spyOn(ContractService.prototype, 'getDraftById').mockResolvedValue(null);

      await controller.deleteDraft(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('GET /api/contracts/drafts/exporter/:exporterId - Get Exporter Contracts', () => {
    it('should retrieve all contracts for an exporter', async () => {
      mockReq.params = { exporterId: 'user-123' };
      mockReq.query = { page: '1', limit: '10' };

      const contracts = [
        {
          draft_id: 'draft-1',
          exporter_id: 'user-123',
          status: 'DRAFT',
        },
        {
          draft_id: 'draft-2',
          exporter_id: 'user-123',
          status: 'COUNTERED',
        },
      ];

      vi.spyOn(ContractService.prototype, 'getContractsByExporter').mockResolvedValue(contracts);

      await controller.getContractsByExporter(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: contracts,
        })
      );
    });

    it('should filter contracts by status', async () => {
      mockReq.params = { exporterId: 'user-123' };
      mockReq.query = { status: 'DRAFT', page: '1', limit: '10' };

      const draftContracts = [
        {
          draft_id: 'draft-1',
          exporter_id: 'user-123',
          status: 'DRAFT',
        },
      ];

      vi.spyOn(ContractService.prototype, 'getContractsByExporter').mockResolvedValue(draftContracts);

      await controller.getContractsByExporter(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: draftContracts,
        })
      );
    });

    it('should support pagination', async () => {
      mockReq.params = { exporterId: 'user-123' };
      mockReq.query = { page: '2', limit: '5' };

      const contracts = [];

      vi.spyOn(ContractService.prototype, 'getContractsByExporter').mockResolvedValue(contracts);

      await controller.getContractsByExporter(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          pagination: expect.objectContaining({
            page: 2,
            limit: 5,
          }),
        })
      );
    });

    it('should return 401 if user is not authenticated', async () => {
      mockReq.user = undefined;
      mockReq.params = { exporterId: 'user-123' };

      await controller.getContractsByExporter(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('GET /api/contracts/:referenceNumber - Get by Reference', () => {
    it('should retrieve contract by ECTA reference number', async () => {
      mockReq.params = { referenceNumber: 'ECTA-2024-000001' };

      const contract = {
        draft_id: 'draft-123',
        ecta_reference_number: 'ECTA-2024-000001',
        status: 'FINALIZED',
        exporter_id: 'user-123',
      };

      vi.spyOn(ContractService.prototype, 'getContractByReference').mockResolvedValue(contract);

      await controller.getContractByReference(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: contract,
        })
      );
    });

    it('should return 404 if reference number not found', async () => {
      mockReq.params = { referenceNumber: 'ECTA-2024-999999' };

      vi.spyOn(ContractService.prototype, 'getContractByReference').mockResolvedValue(null);

      await controller.getContractByReference(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          code: 'NOT_FOUND',
        })
      );
    });

    it('should not require authentication (public endpoint)', async () => {
      mockReq.user = undefined;
      mockReq.params = { referenceNumber: 'ECTA-2024-000001' };

      const contract = {
        draft_id: 'draft-123',
        ecta_reference_number: 'ECTA-2024-000001',
        status: 'FINALIZED',
      };

      vi.spyOn(ContractService.prototype, 'getContractByReference').mockResolvedValue(contract);

      await controller.getContractByReference(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });
});
