import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ECTAService } from '../services/ecta.service';
import { Pool } from 'pg';

vi.mock('pg', () => ({
  Pool: vi.fn(),
}));

vi.mock('../services/ecta-client.service', () => ({
  ECTAClientService: vi.fn(() => ({
    registerContract: vi.fn().mockResolvedValue({
      success: true,
      referenceNumber: 'ECTA-2026-00001',
    }),
  })),
}));

describe('ECTAService', () => {
  let ectaService: ECTAService;
  let mockPool: any;

  beforeEach(() => {
    mockPool = {
      query: vi.fn(),
    };
    ectaService = new ECTAService(mockPool);
  });

  describe('registerContract', () => {
    it('should register contract with ECTA', async () => {
      const contractData = {
        draft_id: 'draft-123',
        exporter_id: 'exp-123',
        buyer_name: 'ABC Coffee Imports',
        coffee_type: 'Arabica Grade 1',
        quantity: 150,
        unit_price: 4.5,
        total_value: 675,
        delivery_date: '2026-06-01',
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [{
          draft_id: 'draft-123',
          ecta_reference_number: 'ECTA-2026-00001',
          status: 'FINALIZED',
        }],
      });

      const result = await ectaService.registerContract(contractData);

      expect(result).toBeDefined();
      expect(result.ecta_reference_number).toBe('ECTA-2026-00001');
      expect(mockPool.query).toHaveBeenCalled();
    });

    it('should throw error when contract not found', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await expect(
        ectaService.registerContract({
          draft_id: 'nonexistent',
          exporter_id: 'exp-123',
          buyer_name: 'ABC',
          coffee_type: 'Arabica',
          quantity: 150,
          unit_price: 4.5,
          total_value: 675,
          delivery_date: '2026-06-01',
        })
      ).rejects.toThrow();
    });
  });

  describe('generateReferenceNumber', () => {
    it('should generate reference number in correct format', () => {
      const refNum = ectaService.generateReferenceNumber();

      expect(refNum).toMatch(/^ECTA-\d{4}-\d{6}$/);
    });

    it('should generate unique reference numbers', () => {
      const refNum1 = ectaService.generateReferenceNumber();
      const refNum2 = ectaService.generateReferenceNumber();

      expect(refNum1).not.toBe(refNum2);
    });

    it('should include current year in reference number', () => {
      const currentYear = new Date().getFullYear();
      const refNum = ectaService.generateReferenceNumber();

      expect(refNum).toContain(currentYear.toString());
    });
  });

  describe('validateContractForRegistration', () => {
    it('should validate contract ready for registration', async () => {
      const contractData = {
        draft_id: 'draft-123',
        status: 'FINALIZED',
        exporter_id: 'exp-123',
        buyer_name: 'ABC Coffee Imports',
        buyer_email: 'buyer@abc.com',
        coffee_type: 'Arabica Grade 1',
        quantity: 150,
        unit_price: 4.5,
        total_value: 675,
        delivery_date: '2026-06-01',
        port_of_discharge: 'Hamburg',
        blockchain_tx_hash: 'tx-hash-123',
      };

      const result = await ectaService.validateContractForRegistration(contractData);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject non-finalized contracts', async () => {
      const contractData = {
        draft_id: 'draft-123',
        status: 'DRAFT',
        exporter_id: 'exp-123',
        buyer_name: 'ABC Coffee Imports',
        buyer_email: 'buyer@abc.com',
        coffee_type: 'Arabica Grade 1',
        quantity: 150,
        unit_price: 4.5,
        total_value: 675,
        delivery_date: '2026-06-01',
        port_of_discharge: 'Hamburg',
        blockchain_tx_hash: 'tx-hash-123',
      };

      const result = await ectaService.validateContractForRegistration(contractData);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject contracts without blockchain hash', async () => {
      const contractData = {
        draft_id: 'draft-123',
        status: 'FINALIZED',
        exporter_id: 'exp-123',
        buyer_name: 'ABC Coffee Imports',
        buyer_email: 'buyer@abc.com',
        coffee_type: 'Arabica Grade 1',
        quantity: 150,
        unit_price: 4.5,
        total_value: 675,
        delivery_date: '2026-06-01',
        port_of_discharge: 'Hamburg',
        blockchain_tx_hash: null,
      };

      const result = await ectaService.validateContractForRegistration(contractData);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('blockchain'))).toBe(true);
    });

    it('should reject contracts with missing required fields', async () => {
      const contractData = {
        draft_id: 'draft-123',
        status: 'FINALIZED',
        exporter_id: 'exp-123',
        // Missing other required fields
      };

      const result = await ectaService.validateContractForRegistration(contractData as any);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('getRegistrationStatus', () => {
    it('should retrieve registration status', async () => {
      const mockStatus = {
        draft_id: 'draft-123',
        ecta_reference_number: 'ECTA-2026-00001',
        status: 'FINALIZED',
        ecta_registered_at: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockStatus] });

      const result = await ectaService.getRegistrationStatus('draft-123');

      expect(result).toEqual(mockStatus);
      expect(mockPool.query).toHaveBeenCalledWith(expect.any(String), ['draft-123']);
    });

    it('should return null when contract not found', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await ectaService.getRegistrationStatus('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateRegistrationStatus', () => {
    it('should update registration status', async () => {
      const updatedContract = {
        draft_id: 'draft-123',
        ecta_reference_number: 'ECTA-2026-00001',
        ecta_registered_at: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({ rows: [updatedContract] });

      const result = await ectaService.updateRegistrationStatus(
        'draft-123',
        'ECTA-2026-00001'
      );

      expect(result.ecta_reference_number).toBe('ECTA-2026-00001');
      expect(mockPool.query).toHaveBeenCalled();
    });

    it('should throw error when contract not found', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await expect(
        ectaService.updateRegistrationStatus('nonexistent', 'ECTA-2026-00001')
      ).rejects.toThrow();
    });
  });

  describe('isContractRegistered', () => {
    it('should return true for registered contracts', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ ecta_reference_number: 'ECTA-2026-00001' }],
      });

      const result = await ectaService.isContractRegistered('draft-123');

      expect(result).toBe(true);
    });

    it('should return false for unregistered contracts', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ ecta_reference_number: null }],
      });

      const result = await ectaService.isContractRegistered('draft-123');

      expect(result).toBe(false);
    });

    it('should return false when contract not found', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await ectaService.isContractRegistered('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('getRegisteredContracts', () => {
    it('should retrieve all registered contracts for exporter', async () => {
      const mockContracts = [
        { draft_id: 'draft-1', ecta_reference_number: 'ECTA-2026-00001' },
        { draft_id: 'draft-2', ecta_reference_number: 'ECTA-2026-00002' },
      ];

      mockPool.query.mockResolvedValueOnce({ rows: mockContracts });

      const result = await ectaService.getRegisteredContracts('exp-123');

      expect(result).toHaveLength(2);
      expect(result[0].ecta_reference_number).toBe('ECTA-2026-00001');
    });

    it('should return empty array when no registered contracts found', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await ectaService.getRegisteredContracts('exp-123');

      expect(result).toHaveLength(0);
    });
  });

  describe('formatContractForECTA', () => {
    it('should format contract data for ECTA submission', () => {
      const contractData = {
        draft_id: 'draft-123',
        exporter_id: 'exp-123',
        buyer_name: 'ABC Coffee Imports',
        coffee_type: 'Arabica Grade 1',
        quantity: 150,
        unit_price: 4.5,
        total_value: 675,
        delivery_date: '2026-06-01',
        port_of_discharge: 'Hamburg',
        blockchain_tx_hash: 'tx-hash-123',
      };

      const formatted = ectaService.formatContractForECTA(contractData);

      expect(formatted).toBeDefined();
      expect(formatted.contractNumber).toBeDefined();
      expect(formatted.exporterInfo).toBeDefined();
      expect(formatted.buyerInfo).toBeDefined();
      expect(formatted.coffeeDetails).toBeDefined();
      expect(formatted.deliveryTerms).toBeDefined();
      expect(formatted.blockchainHash).toBe('tx-hash-123');
    });
  });
});
