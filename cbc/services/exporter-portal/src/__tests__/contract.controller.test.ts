/**
 * Contract Controller Unit Tests
 * Tests for contract CRUD endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { ContractController } from '../controllers/contract.controller';
import { ContractService } from '../services/contract.service';
import { ValidationService } from '../services/validation.service';
import { ContractStatus } from '../types/contract.types';

// Mock dependencies
jest.mock('@shared/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  }),
}));

jest.mock('@shared/database/pool', () => ({
  getPool: jest.fn(() => ({
    query: jest.fn(),
    connect: jest.fn(),
  })),
}));

jest.mock('../services/contract.service');
jest.mock('../services/validation.service');

describe('ContractController', () => {
  let controller: ContractController;
  let mockContractService: jest.Mocked<ContractService>;
  let mockValidationService: jest.Mocked<ValidationService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create controller instance
    controller = new ContractController();

    // Get mocked service instances
    mockContractService = (controller as any).contractService;
    mockValidationService = (controller as any).validationService;

    // Setup mock request and response
    mockRequest = {
      params: {},
      body: {},
      query: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('createDraft', () => {
    it('should create a draft contract successfully', async () => {
      const exporterId = 'exporter-123';
      const requestBody = {
        buyer_name: 'Test Buyer',
        buyer_email: 'buyer@example.com',
        coffee_type: 'Arabica',
        quantity_bags: 100,
        unit_price: 50.0,
        currency: 'USD',
        payment_terms: 'Letter of Credit',
        delivery_location: 'Port Said',
        delivery_date: '2025-12-31',
      };

      const mockDraft = {
        draft_id: 'draft-123',
        exporter_id: exporterId,
        ...requestBody,
        status: ContractStatus.DRAFT,
        created_at: new Date(),
        last_modified_at: new Date(),
      };

      mockRequest.body = requestBody;
      (mockRequest as any).user = { id: exporterId };

      mockValidationService.validateCreateRequest.mockReturnValue({
        isValid: true,
        errors: [],
      });

      mockContractService.createDraft.mockResolvedValue(mockDraft as any);

      await controller.createDraft(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockValidationService.validateCreateRequest).toHaveBeenCalledWith(requestBody);
      expect(mockContractService.createDraft).toHaveBeenCalledWith(
        exporterId,
        expect.objectContaining({
          buyer_name: requestBody.buyer_name,
          buyer_email: requestBody.buyer_email,
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Draft contract created successfully',
        data: mockDraft,
      });
    });

    it('should return 401 if exporter ID is missing', async () => {
      mockRequest.body = { buyer_name: 'Test' };
      (mockRequest as any).user = {};

      await controller.createDraft(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        code: 'UNAUTHORIZED',
        message: 'Exporter ID not found in authentication token',
      });
    });

    it('should return 400 if validation fails', async () => {
      const exporterId = 'exporter-123';
      mockRequest.body = { buyer_name: '' };
      (mockRequest as any).user = { id: exporterId };

      mockValidationService.validateCreateRequest.mockReturnValue({
        isValid: false,
        errors: [{ field: 'buyer_name', message: 'Buyer name is required' }],
      });

      await controller.createDraft(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        errors: [{ field: 'buyer_name', message: 'Buyer name is required' }],
      });
    });
  });

  describe('getDraftById', () => {
    it('should retrieve a draft contract by ID', async () => {
      const draftId = 'draft-123';
      const userId = 'exporter-123';
      const mockDraft = {
        draft_id: draftId,
        exporter_id: userId,
        buyer_email: 'buyer@example.com',
        status: ContractStatus.DRAFT,
      };

      mockRequest.params = { draftId };
      (mockRequest as any).user = { id: userId, email: 'exporter@example.com' };

      mockContractService.getDraftById.mockResolvedValue(mockDraft as any);

      await controller.getDraftById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockContractService.getDraftById).toHaveBeenCalledWith(draftId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockDraft,
      });
    });

    it('should return 404 if draft not found', async () => {
      const draftId = 'draft-123';
      mockRequest.params = { draftId };
      (mockRequest as any).user = { id: 'exporter-123' };

      mockContractService.getDraftById.mockResolvedValue(null);

      await controller.getDraftById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        code: 'NOT_FOUND',
        message: 'Draft contract not found',
      });
    });

    it('should return 403 if user is not authorized', async () => {
      const draftId = 'draft-123';
      const mockDraft = {
        draft_id: draftId,
        exporter_id: 'other-exporter',
        buyer_email: 'other-buyer@example.com',
        status: ContractStatus.DRAFT,
      };

      mockRequest.params = { draftId };
      (mockRequest as any).user = { id: 'exporter-123', email: 'exporter@example.com' };

      mockContractService.getDraftById.mockResolvedValue(mockDraft as any);

      await controller.getDraftById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        code: 'FORBIDDEN',
        message: 'You do not have permission to access this contract',
      });
    });

    it('should allow buyer to access contract', async () => {
      const draftId = 'draft-123';
      const buyerEmail = 'buyer@example.com';
      const mockDraft = {
        draft_id: draftId,
        exporter_id: 'exporter-123',
        buyer_email: buyerEmail,
        status: ContractStatus.DRAFT,
      };

      mockRequest.params = { draftId };
      (mockRequest as any).user = { id: 'buyer-123', email: buyerEmail };

      mockContractService.getDraftById.mockResolvedValue(mockDraft as any);

      await controller.getDraftById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockDraft,
      });
    });
  });

  describe('updateDraft', () => {
    it('should update a draft contract successfully', async () => {
      const draftId = 'draft-123';
      const userId = 'exporter-123';
      const mockDraft = {
        draft_id: draftId,
        exporter_id: userId,
        status: ContractStatus.DRAFT,
      };

      const updateData = {
        quantity_bags: 150,
        unit_price: 55.0,
      };

      mockRequest.params = { draftId };
      mockRequest.body = updateData;
      (mockRequest as any).user = { id: userId };

      mockContractService.getDraftById.mockResolvedValue(mockDraft as any);
      mockValidationService.validateUpdateRequest.mockReturnValue({
        isValid: true,
        errors: [],
      });
      mockContractService.updateDraft.mockResolvedValue({
        ...mockDraft,
        ...updateData,
      } as any);

      await controller.updateDraft(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockContractService.updateDraft).toHaveBeenCalledWith(
        draftId,
        expect.objectContaining(updateData)
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Draft contract updated successfully',
        data: expect.objectContaining(updateData),
      });
    });

    it('should return 409 if contract status is not DRAFT', async () => {
      const draftId = 'draft-123';
      const userId = 'exporter-123';
      const mockDraft = {
        draft_id: draftId,
        exporter_id: userId,
        status: ContractStatus.ACCEPTED,
      };

      mockRequest.params = { draftId };
      mockRequest.body = { quantity_bags: 150 };
      (mockRequest as any).user = { id: userId };

      mockContractService.getDraftById.mockResolvedValue(mockDraft as any);

      await controller.updateDraft(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        code: 'CONFLICT',
        message: `Cannot edit contract with status ${ContractStatus.ACCEPTED}. Only DRAFT contracts can be edited.`,
      });
    });
  });

  describe('deleteDraft', () => {
    it('should delete a draft contract successfully', async () => {
      const draftId = 'draft-123';
      const userId = 'exporter-123';
      const mockDraft = {
        draft_id: draftId,
        exporter_id: userId,
        status: ContractStatus.DRAFT,
      };

      mockRequest.params = { draftId };
      (mockRequest as any).user = { id: userId };

      mockContractService.getDraftById.mockResolvedValue(mockDraft as any);
      mockContractService.deleteDraft.mockResolvedValue(undefined);

      await controller.deleteDraft(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockContractService.deleteDraft).toHaveBeenCalledWith(draftId);
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should return 409 if contract status is not DRAFT', async () => {
      const draftId = 'draft-123';
      const userId = 'exporter-123';
      const mockDraft = {
        draft_id: draftId,
        exporter_id: userId,
        status: ContractStatus.FINALIZED,
      };

      mockRequest.params = { draftId };
      (mockRequest as any).user = { id: userId };

      mockContractService.getDraftById.mockResolvedValue(mockDraft as any);

      await controller.deleteDraft(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        code: 'CONFLICT',
        message: `Cannot delete contract with status ${ContractStatus.FINALIZED}. Only DRAFT contracts can be deleted.`,
      });
    });
  });

  describe('getContractsByExporter', () => {
    it('should retrieve all contracts for an exporter', async () => {
      const exporterId = 'exporter-123';
      const mockContracts = [
        { draft_id: 'draft-1', exporter_id: exporterId },
        { draft_id: 'draft-2', exporter_id: exporterId },
      ];

      mockRequest.params = { exporterId };
      mockRequest.query = { page: '1', limit: '10' };
      (mockRequest as any).user = { id: exporterId };

      mockContractService.getContractsByExporter.mockResolvedValue({
        contracts: mockContracts as any,
        total: 2,
      });

      await controller.getContractsByExporter(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockContractService.getContractsByExporter).toHaveBeenCalledWith(
        exporterId,
        undefined,
        1,
        10
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: {
          contracts: mockContracts,
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
    });

    it('should return 403 if user tries to access other exporter contracts', async () => {
      const exporterId = 'exporter-123';
      const userId = 'other-exporter';

      mockRequest.params = { exporterId };
      (mockRequest as any).user = { id: userId };

      await controller.getContractsByExporter(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        code: 'FORBIDDEN',
        message: 'You do not have permission to view these contracts',
      });
    });

    it('should filter contracts by status', async () => {
      const exporterId = 'exporter-123';
      const mockContracts = [
        { draft_id: 'draft-1', exporter_id: exporterId, status: ContractStatus.DRAFT },
      ];

      mockRequest.params = { exporterId };
      mockRequest.query = { status: 'DRAFT', page: '1', limit: '10' };
      (mockRequest as any).user = { id: exporterId };

      mockContractService.getContractsByExporter.mockResolvedValue({
        contracts: mockContracts as any,
        total: 1,
      });

      await controller.getContractsByExporter(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockContractService.getContractsByExporter).toHaveBeenCalledWith(
        exporterId,
        'DRAFT',
        1,
        10
      );
    });
  });
});
