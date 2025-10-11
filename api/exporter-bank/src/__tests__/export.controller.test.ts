/**
 * Export Controller Tests
 * Unit tests for export controller functions
 */

import { ExportController } from '../controllers/export.controller';
import { MockRequest, MockResponse, TestDataGenerator, createMockContract } from '../../../shared/test-setup';
import { FabricGateway } from '../fabric/gateway';

// Mock dependencies
jest.mock('../fabric/gateway');
jest.mock('../../../shared/ipfs.service');
jest.mock('../../../shared/websocket.service');

describe('ExportController', () => {
  let exportController: ExportController;
  let mockContract: any;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Setup mock contract
    mockContract = createMockContract({
      submitTransaction: jest.fn().mockResolvedValue(Buffer.from('{}')),
      evaluateTransaction: jest.fn().mockResolvedValue(Buffer.from('[]')),
    });

    // Mock FabricGateway.getInstance
    (FabricGateway.getInstance as jest.Mock) = jest.fn().mockReturnValue({
      getExportContract: jest.fn().mockReturnValue(mockContract),
    });

    exportController = new ExportController();
  });

  describe('createExport', () => {
    it('should create export request successfully', async () => {
      const exportData = TestDataGenerator.generateExportRequest();
      const user = TestDataGenerator.generateJWT();

      const req = MockRequest.create({
        body: exportData,
        user,
      });
      const res = MockResponse.create();
      const next = jest.fn();

      await exportController.createExport(req, res, next);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('exportId');
      expect(mockContract.submitTransaction).toHaveBeenCalledWith(
        'CreateExportRequest',
        expect.stringMatching(/^EXP-/),
        user.organizationId,
        exportData.exporterName,
        exportData.coffeeType,
        exportData.quantity.toString(),
        exportData.destinationCountry,
        exportData.estimatedValue.toString()
      );
    });

    it('should return 401 if user is not authenticated', async () => {
      const exportData = TestDataGenerator.generateExportRequest();

      const req = MockRequest.create({
        body: exportData,
        // No user
      });
      const res = MockResponse.create();
      const next = jest.fn();

      await exportController.createExport(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.message).toBe('Unauthorized');
    });

    it('should handle fabric errors gracefully', async () => {
      const exportData = TestDataGenerator.generateExportRequest();
      const user = TestDataGenerator.generateJWT();

      mockContract.submitTransaction.mockRejectedValue(new Error('Fabric error'));

      const req = MockRequest.create({
        body: exportData,
        user,
      });
      const res = MockResponse.create();
      const next = jest.fn();

      await exportController.createExport(req, res, next);

      expect(res.statusCode).toBe(500);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error');
    });

    it('should sanitize input data', async () => {
      const maliciousData = {
        exporterName: '<script>alert("xss")</script>Test Company',
        coffeeType: 'Arabica<script>',
        quantity: 5000,
        destinationCountry: 'USA',
        estimatedValue: 75000,
      };
      const user = TestDataGenerator.generateJWT();

      const req = MockRequest.create({
        body: maliciousData,
        user,
      });
      const res = MockResponse.create();
      const next = jest.fn();

      await exportController.createExport(req, res, next);

      // Verify that the script tags were removed
      const submitCall = mockContract.submitTransaction.mock.calls[0];
      expect(submitCall[2]).not.toContain('<script>');
      expect(submitCall[3]).not.toContain('<script>');
    });
  });

  describe('getAllExports', () => {
    it('should return all exports', async () => {
      const mockExports = [
        { exportId: 'EXP-1', status: 'PENDING' },
        { exportId: 'EXP-2', status: 'FX_APPROVED' },
      ];

      mockContract.evaluateTransaction.mockResolvedValue(
        Buffer.from(JSON.stringify(mockExports))
      );

      const req = MockRequest.create();
      const res = MockResponse.create();
      const next = jest.fn();

      await exportController.getAllExports(req, res, next);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toEqual(mockExports);
      expect(res.body.count).toBe(2);
      expect(mockContract.evaluateTransaction).toHaveBeenCalledWith('GetAllExports');
    });

    it('should handle empty export list', async () => {
      mockContract.evaluateTransaction.mockResolvedValue(Buffer.from('[]'));

      const req = MockRequest.create();
      const res = MockResponse.create();
      const next = jest.fn();

      await exportController.getAllExports(req, res, next);

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.count).toBe(0);
    });

    it('should handle fabric query errors', async () => {
      mockContract.evaluateTransaction.mockRejectedValue(new Error('Query failed'));

      const req = MockRequest.create();
      const res = MockResponse.create();
      const next = jest.fn();

      await exportController.getAllExports(req, res, next);

      expect(res.statusCode).toBe(500);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('getExportById', () => {
    it('should return export by ID', async () => {
      const exportId = TestDataGenerator.generateExportId();
      const mockExport = { exportId, status: 'PENDING' };

      mockContract.evaluateTransaction.mockResolvedValue(
        Buffer.from(JSON.stringify(mockExport))
      );

      const req = MockRequest.create({
        params: { exportId },
      });
      const res = MockResponse.create();
      const next = jest.fn();

      await exportController.getExportById(req, res, next);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toEqual(mockExport);
      expect(mockContract.evaluateTransaction).toHaveBeenCalledWith(
        'GetExportRequest',
        exportId
      );
    });

    it('should return 400 if export ID is missing', async () => {
      const req = MockRequest.create({
        params: {},
      });
      const res = MockResponse.create();
      const next = jest.fn();

      await exportController.getExportById(req, res, next);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Export ID is required');
    });

    it('should return 404 if export not found', async () => {
      const exportId = TestDataGenerator.generateExportId();

      mockContract.evaluateTransaction.mockRejectedValue(
        new Error('Export does not exist')
      );

      const req = MockRequest.create({
        params: { exportId },
      });
      const res = MockResponse.create();
      const next = jest.fn();

      await exportController.getExportById(req, res, next);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('success', false);
    });

    it('should sanitize export ID to prevent injection', async () => {
      const maliciousId = "EXP-123'; DROP TABLE exports; --";

      const req = MockRequest.create({
        params: { exportId: maliciousId },
      });
      const res = MockResponse.create();
      const next = jest.fn();

      await exportController.getExportById(req, res, next);

      // Should either sanitize or reject the malicious ID
      expect(res.statusCode).not.toBe(200);
    });
  });

  describe('completeExport', () => {
    it('should complete export successfully', async () => {
      const exportId = TestDataGenerator.generateExportId();

      const req = MockRequest.create({
        params: { exportId },
      });
      const res = MockResponse.create();
      const next = jest.fn();

      await exportController.completeExport(req, res, next);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.message).toBe('Export completed successfully');
      expect(mockContract.submitTransaction).toHaveBeenCalledWith(
        'CompleteExport',
        exportId
      );
    });

    it('should return 400 if export ID is missing', async () => {
      const req = MockRequest.create({
        params: {},
      });
      const res = MockResponse.create();
      const next = jest.fn();

      await exportController.completeExport(req, res, next);

      expect(res.statusCode).toBe(400);
    });
  });

  describe('cancelExport', () => {
    it('should cancel export successfully', async () => {
      const exportId = TestDataGenerator.generateExportId();

      const req = MockRequest.create({
        params: { exportId },
      });
      const res = MockResponse.create();
      const next = jest.fn();

      await exportController.cancelExport(req, res, next);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.message).toBe('Export cancelled successfully');
      expect(mockContract.submitTransaction).toHaveBeenCalledWith(
        'CancelExport',
        exportId
      );
    });
  });

  describe('getExportsByStatus', () => {
    it('should return exports filtered by status', async () => {
      const status = 'PENDING';
      const mockExports = [
        { exportId: 'EXP-1', status: 'PENDING' },
        { exportId: 'EXP-2', status: 'PENDING' },
      ];

      mockContract.evaluateTransaction.mockResolvedValue(
        Buffer.from(JSON.stringify(mockExports))
      );

      const req = MockRequest.create({
        params: { status },
      });
      const res = MockResponse.create();
      const next = jest.fn();

      await exportController.getExportsByStatus(req, res, next);

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toEqual(mockExports);
      expect(mockContract.evaluateTransaction).toHaveBeenCalledWith(
        'GetExportsByStatus',
        status
      );
    });

    it('should return 400 if status is missing', async () => {
      const req = MockRequest.create({
        params: {},
      });
      const res = MockResponse.create();
      const next = jest.fn();

      await exportController.getExportsByStatus(req, res, next);

      expect(res.statusCode).toBe(400);
    });
  });

  describe('getExportHistory', () => {
    it('should return export history', async () => {
      const exportId = TestDataGenerator.generateExportId();
      const mockHistory = [
        { txId: 'tx1', timestamp: '2024-01-01', isDelete: false },
        { txId: 'tx2', timestamp: '2024-01-02', isDelete: false },
      ];

      mockContract.evaluateTransaction.mockResolvedValue(
        Buffer.from(JSON.stringify(mockHistory))
      );

      const req = MockRequest.create({
        params: { exportId },
      });
      const res = MockResponse.create();
      const next = jest.fn();

      await exportController.getExportHistory(req, res, next);

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toEqual(mockHistory);
      expect(mockContract.evaluateTransaction).toHaveBeenCalledWith(
        'GetExportHistory',
        exportId
      );
    });
  });
});
