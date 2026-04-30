import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContractService } from '../services/contract.service';
import { Pool } from 'pg';

// Mock the Pool
vi.mock('pg', () => ({
  Pool: vi.fn(),
}));

describe('ContractService', () => {
  let contractService: ContractService;
  let mockPool: any;

  beforeEach(() => {
    mockPool = {
      query: vi.fn(),
    };
    contractService = new ContractService(mockPool);
  });

  describe('createContract', () => {
    it('should create a contract with valid data', async () => {
      const contractData = {
        exporter_id: 'exp-123',
        buyer_name: 'ABC Coffee Imports',
        buyer_email: 'buyer@abc.com',
        coffee_type: 'Arabica Grade 1',
        quantity: 150,
        unit_price: 4.5,
        currency: 'USD',
        payment_terms: 'Net 30',
        delivery_date: '2026-06-01',
        port_of_discharge: 'Hamburg',
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [{ draft_id: 'draft-123', ...contractData, status: 'DRAFT' }],
      });

      const result = await contractService.createContract(contractData);

      expect(result).toBeDefined();
      expect(result.draft_id).toBe('draft-123');
      expect(result.status).toBe('DRAFT');
      expect(mockPool.query).toHaveBeenCalled();
    });

    it('should throw error when required fields are missing', async () => {
      const incompleteData = {
        exporter_id: 'exp-123',
        buyer_name: 'ABC Coffee Imports',
        // Missing other required fields
      };

      mockPool.query.mockRejectedValueOnce(new Error('Missing required fields'));

      await expect(contractService.createContract(incompleteData as any)).rejects.toThrow();
    });
  });

  describe('getContractById', () => {
    it('should retrieve a contract by ID', async () => {
      const mockContract = {
        draft_id: 'draft-123',
        status: 'DRAFT',
        exporter_id: 'exp-123',
        buyer_name: 'ABC Coffee Imports',
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockContract] });

      const result = await contractService.getContractById('draft-123');

      expect(result).toEqual(mockContract);
      expect(mockPool.query).toHaveBeenCalledWith(expect.any(String), ['draft-123']);
    });

    it('should return null when contract not found', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await contractService.getContractById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateContract', () => {
    it('should update a contract with valid data', async () => {
      const updateData = {
        quantity: 200,
        unit_price: 5.0,
      };

      const updatedContract = {
        draft_id: 'draft-123',
        status: 'DRAFT',
        ...updateData,
      };

      mockPool.query.mockResolvedValueOnce({ rows: [updatedContract] });

      const result = await contractService.updateContract('draft-123', updateData);

      expect(result).toEqual(updatedContract);
      expect(mockPool.query).toHaveBeenCalled();
    });

    it('should throw error when updating non-DRAFT contract', async () => {
      mockPool.query.mockRejectedValueOnce(
        new Error('Cannot update non-DRAFT contract')
      );

      await expect(
        contractService.updateContract('draft-123', { quantity: 200 })
      ).rejects.toThrow();
    });
  });

  describe('deleteContract', () => {
    it('should delete a DRAFT contract', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 1 });

      const result = await contractService.deleteContract('draft-123');

      expect(result).toBe(true);
      expect(mockPool.query).toHaveBeenCalled();
    });

    it('should return false when contract not found', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 0 });

      const result = await contractService.deleteContract('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('getContractsByExporter', () => {
    it('should retrieve all contracts for an exporter', async () => {
      const mockContracts = [
        { draft_id: 'draft-1', exporter_id: 'exp-123', status: 'DRAFT' },
        { draft_id: 'draft-2', exporter_id: 'exp-123', status: 'COUNTERED' },
      ];

      mockPool.query.mockResolvedValueOnce({ rows: mockContracts });

      const result = await contractService.getContractsByExporter('exp-123');

      expect(result).toHaveLength(2);
      expect(result).toEqual(mockContracts);
    });

    it('should filter contracts by status', async () => {
      const mockContracts = [
        { draft_id: 'draft-1', exporter_id: 'exp-123', status: 'DRAFT' },
      ];

      mockPool.query.mockResolvedValueOnce({ rows: mockContracts });

      const result = await contractService.getContractsByExporter('exp-123', 'DRAFT');

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('DRAFT');
    });

    it('should return empty array when no contracts found', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await contractService.getContractsByExporter('nonexistent');

      expect(result).toHaveLength(0);
    });
  });

  describe('updateContractStatus', () => {
    it('should update contract status', async () => {
      const updatedContract = {
        draft_id: 'draft-123',
        status: 'ACCEPTED',
      };

      mockPool.query.mockResolvedValueOnce({ rows: [updatedContract] });

      const result = await contractService.updateContractStatus('draft-123', 'ACCEPTED');

      expect(result.status).toBe('ACCEPTED');
      expect(mockPool.query).toHaveBeenCalled();
    });

    it('should throw error when contract not found', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await expect(
        contractService.updateContractStatus('nonexistent', 'ACCEPTED')
      ).rejects.toThrow();
    });
  });

  describe('createContractHistory', () => {
    it('should create a history entry for contract modification', async () => {
      const historyData = {
        contract_id: 'draft-123',
        action: 'SENT',
        actor: 'EXPORTER',
        changes: { status: 'DRAFT -> COUNTERED' },
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'hist-123', ...historyData }],
      });

      const result = await contractService.createContractHistory(historyData);

      expect(result).toBeDefined();
      expect(result.action).toBe('SENT');
      expect(mockPool.query).toHaveBeenCalled();
    });
  });

  describe('getContractHistory', () => {
    it('should retrieve contract history', async () => {
      const mockHistory = [
        { id: 'hist-1', action: 'CREATED', timestamp: '2026-01-01' },
        { id: 'hist-2', action: 'SENT', timestamp: '2026-01-02' },
      ];

      mockPool.query.mockResolvedValueOnce({ rows: mockHistory });

      const result = await contractService.getContractHistory('draft-123');

      expect(result).toHaveLength(2);
      expect(result[0].action).toBe('CREATED');
    });

    it('should return empty array when no history found', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await contractService.getContractHistory('nonexistent');

      expect(result).toHaveLength(0);
    });
  });

  describe('validateContractTerms', () => {
    it('should validate valid contract terms', async () => {
      const contractData = {
        quantity: 150,
        unit_price: 4.5,
        delivery_date: '2026-06-01',
        payment_terms: 'Net 30',
        currency: 'USD',
        coffee_type: 'Arabica Grade 1',
        port_of_discharge: 'Hamburg',
      };

      const result = await contractService.validateContractTerms(contractData);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid quantity', async () => {
      const contractData = {
        quantity: 0,
        unit_price: 4.5,
        delivery_date: '2026-06-01',
        payment_terms: 'Net 30',
        currency: 'USD',
        coffee_type: 'Arabica Grade 1',
        port_of_discharge: 'Hamburg',
      };

      const result = await contractService.validateContractTerms(contractData);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject invalid unit price', async () => {
      const contractData = {
        quantity: 150,
        unit_price: -1,
        delivery_date: '2026-06-01',
        payment_terms: 'Net 30',
        currency: 'USD',
        coffee_type: 'Arabica Grade 1',
        port_of_discharge: 'Hamburg',
      };

      const result = await contractService.validateContractTerms(contractData);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject past delivery date', async () => {
      const contractData = {
        quantity: 150,
        unit_price: 4.5,
        delivery_date: '2020-01-01',
        payment_terms: 'Net 30',
        currency: 'USD',
        coffee_type: 'Arabica Grade 1',
        port_of_discharge: 'Hamburg',
      };

      const result = await contractService.validateContractTerms(contractData);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('getContractByReference', () => {
    it('should retrieve contract by ECTA reference number', async () => {
      const mockContract = {
        draft_id: 'draft-123',
        ecta_reference_number: 'ECTA-2026-00001',
        status: 'FINALIZED',
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockContract] });

      const result = await contractService.getContractByReference('ECTA-2026-00001');

      expect(result).toEqual(mockContract);
      expect(mockPool.query).toHaveBeenCalledWith(expect.any(String), ['ECTA-2026-00001']);
    });

    it('should return null when reference not found', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await contractService.getContractByReference('INVALID');

      expect(result).toBeNull();
    });
  });
});
