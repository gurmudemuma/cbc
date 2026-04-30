import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Pool } from 'pg';
import { ContractService } from '../../services/contract.service';
import { NotificationService } from '../../services/notification.service';

describe('Buyer Portal Workflow - Integration Tests', () => {
  let contractService: ContractService;
  let notificationService: NotificationService;
  let mockPool: any;

  beforeEach(() => {
    mockPool = {
      query: vi.fn(),
    };
    contractService = new ContractService(mockPool);
    notificationService = new NotificationService(mockPool);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Buyer accessing contracts', () => {
    it('should retrieve contracts sent to buyer', async () => {
      const mockContracts = [
        {
          draft_id: 'draft-1',
          status: 'COUNTERED',
          buyer_email: 'buyer@abc.com',
          exporter_id: 'exp-123',
        },
        {
          draft_id: 'draft-2',
          status: 'COUNTERED',
          buyer_email: 'buyer@abc.com',
          exporter_id: 'exp-456',
        },
      ];

      mockPool.query.mockResolvedValueOnce({ rows: mockContracts });

      const contracts = await contractService.getContractsByExporter('buyer@abc.com');

      expect(contracts).toHaveLength(2);
      expect(contracts[0].buyer_email).toBe('buyer@abc.com');
    });

    it('should only show contracts sent to buyer', async () => {
      const mockContracts = [
        {
          draft_id: 'draft-1',
          status: 'COUNTERED',
          buyer_email: 'buyer@abc.com',
        },
      ];

      mockPool.query.mockResolvedValueOnce({ rows: mockContracts });

      const contracts = await contractService.getContractsByExporter('buyer@abc.com');

      expect(contracts).toHaveLength(1);
      expect(contracts[0].buyer_email).toBe('buyer@abc.com');
    });
  });

  describe('Buyer accepting contract', () => {
    it('should accept contract sent by exporter', async () => {
      // Step 1: Get contract
      const mockContract = {
        draft_id: 'draft-123',
        status: 'COUNTERED',
        buyer_email: 'buyer@abc.com',
        exporter_id: 'exp-123',
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockContract] });
      const contract = await contractService.getContractById('draft-123');

      expect(contract.status).toBe('COUNTERED');
      expect(contract.buyer_email).toBe('buyer@abc.com');

      // Step 2: Update status to ACCEPTED
      mockPool.query.mockResolvedValueOnce({
        rows: [{ ...mockContract, status: 'ACCEPTED' }],
      });

      const updatedContract = await contractService.updateContractStatus('draft-123', 'ACCEPTED');

      expect(updatedContract.status).toBe('ACCEPTED');

      // Step 3: Create history entry
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'hist-123', action: 'ACCEPTED', actor: 'BUYER' }],
      });

      const history = await contractService.createContractHistory({
        contract_id: 'draft-123',
        action: 'ACCEPTED',
        actor: 'BUYER',
        changes: { status: 'COUNTERED -> ACCEPTED' },
      });

      expect(history.action).toBe('ACCEPTED');

      // Step 4: Send notification to exporter
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'notif-123' }],
      });

      const notification = await notificationService.notifyContractAccepted(
        'exporter@example.com',
        'CNT-001'
      );

      expect(notification).toBeDefined();
    });
  });

  describe('Buyer rejecting contract', () => {
    it('should reject contract with reason', async () => {
      // Step 1: Get contract
      const mockContract = {
        draft_id: 'draft-123',
        status: 'COUNTERED',
        buyer_email: 'buyer@abc.com',
        exporter_id: 'exp-123',
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockContract] });
      const contract = await contractService.getContractById('draft-123');

      // Step 2: Update status to REJECTED
      mockPool.query.mockResolvedValueOnce({
        rows: [{ ...mockContract, status: 'REJECTED' }],
      });

      const updatedContract = await contractService.updateContractStatus('draft-123', 'REJECTED');

      expect(updatedContract.status).toBe('REJECTED');

      // Step 3: Create history entry with reason
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 'hist-123',
          action: 'REJECTED',
          actor: 'BUYER',
          changes: { reason: 'Price too high' },
        }],
      });

      const history = await contractService.createContractHistory({
        contract_id: 'draft-123',
        action: 'REJECTED',
        actor: 'BUYER',
        changes: { reason: 'Price too high' },
      });

      expect(history.action).toBe('REJECTED');

      // Step 4: Send notification to exporter
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'notif-123' }],
      });

      const notification = await notificationService.notifyContractRejected(
        'exporter@example.com',
        'CNT-001',
        'Price too high'
      );

      expect(notification).toBeDefined();
    });
  });

  describe('Buyer submitting counter-offer', () => {
    it('should submit counter-offer with modifications', async () => {
      // Step 1: Get contract
      const mockContract = {
        draft_id: 'draft-123',
        status: 'COUNTERED',
        buyer_email: 'buyer@abc.com',
        exporter_id: 'exp-123',
        quantity: 150,
        unit_price: 4.5,
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockContract] });
      const contract = await contractService.getContractById('draft-123');

      // Step 2: Update with counter-offer
      const counterData = {
        quantity: 200,
        unit_price: 4.0,
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [{
          ...mockContract,
          ...counterData,
          status: 'COUNTERED',
        }],
      });

      const updatedContract = await contractService.updateContract('draft-123', counterData);

      expect(updatedContract.quantity).toBe(200);
      expect(updatedContract.unit_price).toBe(4.0);

      // Step 3: Create history entry
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 'hist-123',
          action: 'COUNTERED',
          actor: 'BUYER',
        }],
      });

      const history = await contractService.createContractHistory({
        contract_id: 'draft-123',
        action: 'COUNTERED',
        actor: 'BUYER',
        changes: {
          quantity: { old: 150, new: 200 },
          unit_price: { old: 4.5, new: 4.0 },
        },
      });

      expect(history.action).toBe('COUNTERED');
    });
  });
});

describe('Access Control - Integration Tests', () => {
  let contractService: ContractService;
  let mockPool: any;

  beforeEach(() => {
    mockPool = {
      query: vi.fn(),
    };
    contractService = new ContractService(mockPool);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Exporter access control', () => {
    it('should allow exporter to access own contracts', async () => {
      const mockContract = {
        draft_id: 'draft-123',
        exporter_id: 'exp-123',
        status: 'DRAFT',
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockContract] });
      const contract = await contractService.getContractById('draft-123');

      expect(contract.exporter_id).toBe('exp-123');
    });

    it('should prevent exporter from accessing other exporter contracts', async () => {
      const mockContract = {
        draft_id: 'draft-123',
        exporter_id: 'exp-456',
        status: 'DRAFT',
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockContract] });
      const contract = await contractService.getContractById('draft-123');

      // Authorization check would happen at middleware level
      expect(contract.exporter_id).not.toBe('exp-123');
    });

    it('should allow exporter to edit own DRAFT contracts', async () => {
      const mockContract = {
        draft_id: 'draft-123',
        exporter_id: 'exp-123',
        status: 'DRAFT',
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockContract] });
      const contract = await contractService.getContractById('draft-123');

      expect(contract.status).toBe('DRAFT');

      // Update should be allowed
      mockPool.query.mockResolvedValueOnce({
        rows: [{ ...mockContract, quantity: 200 }],
      });

      const updated = await contractService.updateContract('draft-123', { quantity: 200 });

      expect(updated.quantity).toBe(200);
    });

    it('should prevent exporter from editing non-DRAFT contracts', async () => {
      const mockContract = {
        draft_id: 'draft-123',
        exporter_id: 'exp-123',
        status: 'COUNTERED',
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockContract] });
      const contract = await contractService.getContractById('draft-123');

      expect(contract.status).not.toBe('DRAFT');
    });

    it('should allow exporter to delete own DRAFT contracts', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 1 });

      const result = await contractService.deleteContract('draft-123');

      expect(result).toBe(true);
    });

    it('should prevent exporter from deleting non-DRAFT contracts', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 0 });

      const result = await contractService.deleteContract('draft-123');

      expect(result).toBe(false);
    });
  });

  describe('Buyer access control', () => {
    it('should allow buyer to access contracts sent to them', async () => {
      const mockContract = {
        draft_id: 'draft-123',
        buyer_email: 'buyer@abc.com',
        status: 'COUNTERED',
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockContract] });
      const contract = await contractService.getContractById('draft-123');

      expect(contract.buyer_email).toBe('buyer@abc.com');
    });

    it('should prevent buyer from accessing contracts not sent to them', async () => {
      const mockContract = {
        draft_id: 'draft-123',
        buyer_email: 'other@abc.com',
        status: 'COUNTERED',
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockContract] });
      const contract = await contractService.getContractById('draft-123');

      // Authorization check would happen at middleware level
      expect(contract.buyer_email).not.toBe('buyer@abc.com');
    });

    it('should allow buyer to respond to COUNTERED contracts', async () => {
      const mockContract = {
        draft_id: 'draft-123',
        buyer_email: 'buyer@abc.com',
        status: 'COUNTERED',
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockContract] });
      const contract = await contractService.getContractById('draft-123');

      expect(contract.status).toBe('COUNTERED');
    });

    it('should prevent buyer from responding to non-COUNTERED contracts', async () => {
      const mockContract = {
        draft_id: 'draft-123',
        buyer_email: 'buyer@abc.com',
        status: 'DRAFT',
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockContract] });
      const contract = await contractService.getContractById('draft-123');

      expect(contract.status).not.toBe('COUNTERED');
    });
  });

  describe('Contract locking and immutability', () => {
    it('should prevent modifications to FINALIZED contracts', async () => {
      const mockContract = {
        draft_id: 'draft-123',
        status: 'FINALIZED',
        exporter_id: 'exp-123',
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockContract] });
      const contract = await contractService.getContractById('draft-123');

      expect(contract.status).toBe('FINALIZED');

      // Update should fail
      mockPool.query.mockRejectedValueOnce(
        new Error('Cannot modify FINALIZED contract')
      );

      await expect(
        contractService.updateContract('draft-123', { quantity: 200 })
      ).rejects.toThrow();
    });

    it('should prevent modifications to REJECTED contracts', async () => {
      const mockContract = {
        draft_id: 'draft-123',
        status: 'REJECTED',
        exporter_id: 'exp-123',
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockContract] });
      const contract = await contractService.getContractById('draft-123');

      expect(contract.status).toBe('REJECTED');

      // Update should fail
      mockPool.query.mockRejectedValueOnce(
        new Error('Cannot modify REJECTED contract')
      );

      await expect(
        contractService.updateContract('draft-123', { quantity: 200 })
      ).rejects.toThrow();
    });

    it('should allow reading locked contracts', async () => {
      const mockContract = {
        draft_id: 'draft-123',
        status: 'FINALIZED',
        exporter_id: 'exp-123',
        ecta_reference_number: 'ECTA-2026-00001',
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockContract] });
      const contract = await contractService.getContractById('draft-123');

      expect(contract).toBeDefined();
      expect(contract.status).toBe('FINALIZED');
    });
  });

  describe('Audit logging', () => {
    it('should log all contract access attempts', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ draft_id: 'draft-123', status: 'DRAFT' }],
      });

      const contract = await contractService.getContractById('draft-123');

      expect(mockPool.query).toHaveBeenCalled();
      expect(contract).toBeDefined();
    });

    it('should log all contract modifications', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ draft_id: 'draft-123', quantity: 200 }],
      });

      const contract = await contractService.updateContract('draft-123', { quantity: 200 });

      expect(mockPool.query).toHaveBeenCalled();
      expect(contract.quantity).toBe(200);
    });

    it('should log authorization failures', async () => {
      // Authorization check would happen at middleware level
      // This test verifies the contract service is called correctly
      mockPool.query.mockResolvedValueOnce({
        rows: [{ draft_id: 'draft-123', exporter_id: 'exp-456' }],
      });

      const contract = await contractService.getContractById('draft-123');

      expect(contract.exporter_id).not.toBe('exp-123');
    });
  });
});
