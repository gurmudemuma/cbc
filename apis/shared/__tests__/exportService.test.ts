/// <reference types="jest" />

import { BlockchainExportService, ExportStatus } from '../exportService';
import { Contract } from 'fabric-network';

// Mock the Contract
const mockContract = {
  submitTransaction: jest.fn(),
  evaluateTransaction: jest.fn(),
} as unknown as Contract;

describe('BlockchainExportService', () => {
  let service: BlockchainExportService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    // Reset mock implementations to default
    (mockContract.submitTransaction as jest.Mock).mockResolvedValue(Buffer.from('success'));
    (mockContract.evaluateTransaction as jest.Mock).mockResolvedValue(Buffer.from('{}'));
    service = new BlockchainExportService(mockContract);
  });

  describe('createExport', () => {
    it('should create export with valid data', async () => {
      const exportData = {
        exporterName: 'Test Exporter',
        coffeeType: 'Arabica Grade 1',
        quantity: 1000,
        destinationCountry: 'Germany',
        estimatedValue: 50000,
      };

      const mockExport = {
        exportId: 'EXP-123',
        status: 'FX_PENDING',
        ...exportData,
      };

      (mockContract.evaluateTransaction as jest.Mock).mockResolvedValue(
        Buffer.from(JSON.stringify(mockExport))
      );

      const result = await service.createExport('EXP-123', 'BANK-001', exportData);

      expect(mockContract.submitTransaction).toHaveBeenCalledWith(
        'CreateExportRequest',
        'EXP-123',
        'BANK-001',
        exportData.exporterName,
        exportData.coffeeType,
        exportData.quantity.toString(),
        exportData.destinationCountry,
        exportData.estimatedValue.toString()
      );
      expect(result.exportId).toBe('EXP-123');
      expect(result.status).toBe('FX_PENDING');
    });

    it('should handle creation errors', async () => {
      (mockContract.submitTransaction as jest.Mock).mockRejectedValue(
        new Error('Blockchain error')
      );

      await expect(
        service.createExport('EXP-123', 'BANK-001', {
          exporterName: 'Test',
          coffeeType: 'Arabica',
          quantity: 1000,
          destinationCountry: 'Germany',
          estimatedValue: 50000,
        })
      ).rejects.toThrow('Blockchain error');
    });
  });

  describe('getExport', () => {
    it('should retrieve export by ID', async () => {
      const mockExport = {
        exportId: 'EXP-123',
        status: 'FX_APPROVED',
        exporterName: 'Test Exporter',
      };

      (mockContract.evaluateTransaction as jest.Mock).mockResolvedValue(
        Buffer.from(JSON.stringify(mockExport))
      );

      const result = await service.getExport('EXP-123');

      expect(mockContract.evaluateTransaction).toHaveBeenCalledWith('GetExport', 'EXP-123');
      expect(result.exportId).toBe('EXP-123');
      expect(result.status).toBe('FX_APPROVED');
    });

    it('should handle non-existent export', async () => {
      (mockContract.evaluateTransaction as jest.Mock).mockRejectedValue(
        new Error('Export not found')
      );

      await expect(service.getExport('INVALID-ID')).rejects.toThrow('Export not found');
    });
  });

  describe('getAllExports', () => {
    it('should retrieve all exports', async () => {
      const mockExports = [
        { exportId: 'EXP-1', status: 'FX_PENDING' },
        { exportId: 'EXP-2', status: 'QUALITY_CERTIFIED' },
      ];

      (mockContract.evaluateTransaction as jest.Mock).mockResolvedValue(
        Buffer.from(JSON.stringify(mockExports))
      );

      const result = await service.getAllExports();

      expect(mockContract.evaluateTransaction).toHaveBeenCalledWith('GetAllExports');
      expect(result).toHaveLength(2);
      expect(result[0]?.exportId).toBe('EXP-1');
    });

    it('should return empty array when no exports exist', async () => {
      (mockContract.evaluateTransaction as jest.Mock).mockResolvedValue(
        Buffer.from(JSON.stringify([]))
      );

      const result = await service.getAllExports();

      expect(result).toEqual([]);
    });
  });

  describe('getExportsByStatus', () => {
    it('should filter exports by status', async () => {
      const mockExports = [
        { exportId: 'EXP-1', status: 'FX_PENDING' },
        { exportId: 'EXP-2', status: 'FX_PENDING' },
      ];

      (mockContract.evaluateTransaction as jest.Mock).mockResolvedValue(
        Buffer.from(JSON.stringify(mockExports))
      );

      const result = await service.getExportsByStatus('FX_PENDING' as ExportStatus);

      expect(mockContract.evaluateTransaction).toHaveBeenCalledWith(
        'GetExportsByStatus',
        'FX_PENDING'
      );
      expect(result).toHaveLength(2);
    });
  });

  describe('approveFX', () => {
    it('should approve FX with valid data', async () => {
      const approvalData = {
        fxApprovalID: 'FX-APP-123',
        documentCIDs: ['QmHash1', 'QmHash2'],
      };

      await service.approveFX('EXP-123', approvalData);

      expect(mockContract.submitTransaction).toHaveBeenCalledWith(
        'ApproveFX',
        'EXP-123',
        approvalData.fxApprovalID,
        JSON.stringify(approvalData.documentCIDs)
      );
    });

    it('should handle approval without documents', async () => {
      const approvalData = {
        fxApprovalID: 'FX-APP-123',
      };

      await service.approveFX('EXP-123', approvalData);

      expect(mockContract.submitTransaction).toHaveBeenCalledWith(
        'ApproveFX',
        'EXP-123',
        approvalData.fxApprovalID,
        '[]'
      );
    });
  });

  describe('rejectFX', () => {
    it('should reject FX with reason', async () => {
      await service.rejectFX('EXP-123', 'Invalid documentation');

      expect(mockContract.submitTransaction).toHaveBeenCalledWith(
        'RejectFX',
        'EXP-123',
        'Invalid documentation'
      );
    });
  });

  describe('approveQuality', () => {
    it('should approve quality with certificate', async () => {
      const qualityData = {
        qualityGrade: 'Grade 1',
        certifiedBy: 'NCAT Officer',
        documentCIDs: ['QmCert1'],
        originCertificateNumber: 'CERT-2024-001',
      };

      await service.approveQuality('EXP-123', qualityData);

      expect(mockContract.submitTransaction).toHaveBeenCalledWith(
        'ApproveQuality',
        'EXP-123',
        qualityData.qualityGrade,
        qualityData.certifiedBy,
        JSON.stringify(qualityData.documentCIDs),
        qualityData.originCertificateNumber
      );
    });
  });

  describe('confirmPayment', () => {
    it('should confirm payment receipt', async () => {
      await service.confirmPayment('EXP-123', 'Letter of Credit', 50000);

      expect(mockContract.submitTransaction).toHaveBeenCalledWith(
        'ConfirmPayment',
        'EXP-123',
        'Letter of Credit',
        '50000'
      );
    });

    it('should handle different payment methods', async () => {
      const paymentMethods = ['TT', 'LC', 'DP', 'DA'];

      for (const method of paymentMethods) {
        await service.confirmPayment('EXP-123', method, 50000);
        expect(mockContract.submitTransaction).toHaveBeenCalledWith(
          'ConfirmPayment',
          'EXP-123',
          method,
          '50000'
        );
      }
    });
  });

  describe('confirmFXRepatriation', () => {
    it('should confirm FX repatriation', async () => {
      await service.confirmFXRepatriation('EXP-123', 48000);

      expect(mockContract.submitTransaction).toHaveBeenCalledWith(
        'ConfirmFXRepatriation',
        'EXP-123',
        '48000'
      );
    });
  });

  describe('cancelExport', () => {
    it('should cancel export with reason', async () => {
      await service.cancelExport('EXP-123', 'Customer request');

      expect(mockContract.submitTransaction).toHaveBeenCalledWith(
        'CancelExport',
        'EXP-123',
        'Customer request'
      );
    });
  });
});
