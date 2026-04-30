import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Pool } from 'pg';
import { ContractService } from '../../services/contract.service';
import { BlockchainService } from '../../services/blockchain.service';
import { ECTAService } from '../../services/ecta.service';
import { NotificationService } from '../../services/notification.service';

describe('Contract Finalization Workflow - Integration Tests', () => {
  let contractService: ContractService;
  let blockchainService: BlockchainService;
  let ectaService: ECTAService;
  let notificationService: NotificationService;
  let mockPool: any;

  beforeEach(() => {
    mockPool = {
      query: vi.fn(),
    };
    contractService = new ContractService(mockPool);
    blockchainService = new BlockchainService();
    ectaService = new ECTAService(mockPool);
    notificationService = new NotificationService(mockPool);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('End-to-end contract finalization', () => {
    it('should finalize contract to blockchain', async () => {
      // Step 1: Get contract
      const mockContract = {
        draft_id: 'draft-123',
        status: 'ACCEPTED',
        exporter_id: 'exp-123',
        buyer_email: 'buyer@abc.com',
        coffee_type: 'Arabica Grade 1',
        quantity: 150,
        unit_price: 4.5,
        total_value: 675,
        delivery_date: '2026-06-01',
        port_of_discharge: 'Hamburg',
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockContract] });
      const contract = await contractService.getContractById('draft-123');

      expect(contract.status).toBe('ACCEPTED');

      // Step 2: Validate contract is ready for finalization
      const validation = await ectaService.validateContractForRegistration(contract);
      expect(validation.valid).toBe(true);

      // Step 3: Create blockchain transaction
      const transaction = await blockchainService.createTransaction(contract);

      expect(transaction).toBeDefined();
      expect(transaction.transactionHash).toBeDefined();
      expect(transaction.status).toBe('SUBMITTED');

      // Step 4: Submit to blockchain
      const blockchainResult = await blockchainService.submitTransaction({
        transactionHash: transaction.transactionHash,
        contractData: contract,
      });

      expect(blockchainResult.success).toBe(true);
      expect(blockchainResult.blockchainHash).toBeDefined();

      // Step 5: Update contract status to FINALIZED
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          ...mockContract,
          status: 'FINALIZED',
          blockchain_tx_hash: blockchainResult.blockchainHash,
        }],
      });

      const finalizedContract = await contractService.updateContractStatus('draft-123', 'FINALIZED');

      expect(finalizedContract.status).toBe('FINALIZED');
      expect(finalizedContract.blockchain_tx_hash).toBe(blockchainResult.blockchainHash);

      // Step 6: Create history entry
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 'hist-123',
          action: 'FINALIZED',
          changes: { blockchain_tx_hash: blockchainResult.blockchainHash },
        }],
      });

      const history = await contractService.createContractHistory({
        contract_id: 'draft-123',
        action: 'FINALIZED',
        actor: 'SYSTEM',
        changes: { blockchain_tx_hash: blockchainResult.blockchainHash },
      });

      expect(history.action).toBe('FINALIZED');

      // Step 7: Register with ECTA
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          ...finalizedContract,
          ecta_reference_number: 'ECTA-2026-00001',
        }],
      });

      const registeredContract = await ectaService.updateRegistrationStatus(
        'draft-123',
        'ECTA-2026-00001'
      );

      expect(registeredContract.ecta_reference_number).toBe('ECTA-2026-00001');

      // Step 8: Send notification to buyer
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'notif-123' }],
      });

      const notification = await notificationService.notifyContractFinalized(
        'buyer@abc.com',
        'CNT-001',
        'ECTA-2026-00001'
      );

      expect(notification).toBeDefined();
    });

    it('should validate contract before finalization', async () => {
      const mockContract = {
        draft_id: 'draft-123',
        status: 'ACCEPTED',
        exporter_id: 'exp-123',
        buyer_email: 'buyer@abc.com',
        coffee_type: 'Arabica Grade 1',
        quantity: 150,
        unit_price: 4.5,
        total_value: 675,
        delivery_date: '2026-06-01',
        port_of_discharge: 'Hamburg',
        blockchain_tx_hash: 'tx-hash-123',
      };

      const validation = await ectaService.validateContractForRegistration(mockContract);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should reject finalization of non-ACCEPTED contract', async () => {
      const mockContract = {
        draft_id: 'draft-123',
        status: 'DRAFT',
        exporter_id: 'exp-123',
        buyer_email: 'buyer@abc.com',
        coffee_type: 'Arabica Grade 1',
        quantity: 150,
        unit_price: 4.5,
        total_value: 675,
        delivery_date: '2026-06-01',
        port_of_discharge: 'Hamburg',
      };

      const validation = await ectaService.validateContractForRegistration(mockContract);

      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('FINALIZED'))).toBe(true);
    });

    it('should handle blockchain submission failure', async () => {
      const mockContract = {
        draft_id: 'draft-123',
        status: 'ACCEPTED',
        exporter_id: 'exp-123',
        buyer_email: 'buyer@abc.com',
        coffee_type: 'Arabica Grade 1',
        quantity: 150,
        unit_price: 4.5,
        total_value: 675,
        delivery_date: '2026-06-01',
        port_of_discharge: 'Hamburg',
      };

      // Create transaction
      const transaction = await blockchainService.createTransaction(mockContract);

      expect(transaction).toBeDefined();
      expect(transaction.transactionHash).toBeDefined();
    });

    it('should record blockchain transaction hash', async () => {
      const mockContract = {
        draft_id: 'draft-123',
        status: 'ACCEPTED',
        exporter_id: 'exp-123',
        buyer_email: 'buyer@abc.com',
        coffee_type: 'Arabica Grade 1',
        quantity: 150,
        unit_price: 4.5,
        total_value: 675,
        delivery_date: '2026-06-01',
        port_of_discharge: 'Hamburg',
      };

      const transaction = await blockchainService.createTransaction(mockContract);
      const blockchainResult = await blockchainService.submitTransaction({
        transactionHash: transaction.transactionHash,
        contractData: mockContract,
      });

      mockPool.query.mockResolvedValueOnce({
        rows: [{
          ...mockContract,
          status: 'FINALIZED',
          blockchain_tx_hash: blockchainResult.blockchainHash,
        }],
      });

      const finalizedContract = await contractService.updateContractStatus('draft-123', 'FINALIZED');

      expect(finalizedContract.blockchain_tx_hash).toBe(blockchainResult.blockchainHash);
    });
  });

  describe('ECTA registration workflow', () => {
    it('should register finalized contract with ECTA', async () => {
      const mockContract = {
        draft_id: 'draft-123',
        status: 'FINALIZED',
        exporter_id: 'exp-123',
        buyer_email: 'buyer@abc.com',
        coffee_type: 'Arabica Grade 1',
        quantity: 150,
        unit_price: 4.5,
        total_value: 675,
        delivery_date: '2026-06-01',
        port_of_discharge: 'Hamburg',
        blockchain_tx_hash: 'tx-hash-123',
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [{
          ...mockContract,
          ecta_reference_number: 'ECTA-2026-00001',
          ecta_registered_at: new Date(),
        }],
      });

      const registeredContract = await ectaService.updateRegistrationStatus(
        'draft-123',
        'ECTA-2026-00001'
      );

      expect(registeredContract.ecta_reference_number).toBe('ECTA-2026-00001');
      expect(registeredContract.ecta_registered_at).toBeDefined();
    });

    it('should generate unique ECTA reference numbers', () => {
      const refNum1 = ectaService.generateReferenceNumber();
      const refNum2 = ectaService.generateReferenceNumber();

      expect(refNum1).toMatch(/^ECTA-\d{4}-\d{6}$/);
      expect(refNum2).toMatch(/^ECTA-\d{4}-\d{6}$/);
      expect(refNum1).not.toBe(refNum2);
    });

    it('should verify contract is registered', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ ecta_reference_number: 'ECTA-2026-00001' }],
      });

      const isRegistered = await ectaService.isContractRegistered('draft-123');

      expect(isRegistered).toBe(true);
    });
  });

  describe('Notification delivery', () => {
    it('should send contract finalized notification', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'notif-123' }],
      });

      const notification = await notificationService.notifyContractFinalized(
        'buyer@abc.com',
        'CNT-001',
        'ECTA-2026-00001'
      );

      expect(notification).toBeDefined();
      expect(mockPool.query).toHaveBeenCalled();
    });

    it('should send ECTA registration notification', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'notif-123' }],
      });

      const notification = await notificationService.createNotification({
        recipient_id: 'exp-123',
        recipient_email: 'exporter@example.com',
        notification_type: 'ECTA_REGISTERED',
        subject: 'ECTA Registration Complete',
        message: 'Your contract has been registered with ECTA',
        action_link: '/contracts/draft-123',
      });

      expect(notification).toBeDefined();
    });
  });

  describe('Contract locking', () => {
    it('should prevent modifications to finalized contracts', async () => {
      const mockContract = {
        draft_id: 'draft-123',
        status: 'FINALIZED',
        exporter_id: 'exp-123',
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockContract] });
      const contract = await contractService.getContractById('draft-123');

      expect(contract.status).toBe('FINALIZED');

      // Attempting to update should fail
      mockPool.query.mockRejectedValueOnce(
        new Error('Cannot modify FINALIZED contract')
      );

      await expect(
        contractService.updateContract('draft-123', { quantity: 200 })
      ).rejects.toThrow();
    });

    it('should allow reading finalized contracts', async () => {
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
      expect(contract.ecta_reference_number).toBe('ECTA-2026-00001');
    });
  });
});
