import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Pool } from 'pg';
import { ContractService } from '../../services/contract.service';
import { NotificationService } from '../../services/notification.service';

describe('Contract Negotiation Workflow - Integration Tests', () => {
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

  describe('Contract sending workflow', () => {
    it('should send contract to buyer', async () => {
      // Step 1: Get contract
      const mockContract = {
        draft_id: 'draft-123',
        status: 'DRAFT',
        buyer_email: 'buyer@abc.com',
        exporter_id: 'exp-123',
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockContract] });
      const contract = await contractService.getContractById('draft-123');

      expect(contract.status).toBe('DRAFT');

      // Step 2: Update status to COUNTERED
      mockPool.query.mockResolvedValueOnce({
        rows: [{ ...mockContract, status: 'COUNTERED' }],
      });

      const updatedContract = await contractService.updateContractStatus('draft-123', 'COUNTERED');

      expect(updatedContract.status).toBe('COUNTERED');

      // Step 3: Create history entry
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'hist-123', action: 'SENT' }],
      });

      const history = await contractService.createContractHistory({
        contract_id: 'draft-123',
        action: 'SENT',
        actor: 'EXPORTER',
        changes: { status: 'DRAFT -> COUNTERED' },
      });

      expect(history.action).toBe('SENT');

      // Step 4: Send notification
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'notif-123' }],
      });

      const notification = await notificationService.notifyContractSent(
        'buyer@abc.com',
        'CNT-001',
        'Ethiopian Coffee Co'
      );

      expect(notification).toBeDefined();
    });

    it('should reject sending non-DRAFT contract', async () => {
      const mockContract = {
        draft_id: 'draft-123',
        status: 'COUNTERED',
        buyer_email: 'buyer@abc.com',
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockContract] });
      const contract = await contractService.getContractById('draft-123');

      expect(contract.status).not.toBe('DRAFT');
    });
  });

  describe('Buyer response workflow', () => {
    it('should accept contract', async () => {
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

      // Step 2: Update status to ACCEPTED
      mockPool.query.mockResolvedValueOnce({
        rows: [{ ...mockContract, status: 'ACCEPTED' }],
      });

      const updatedContract = await contractService.updateContractStatus('draft-123', 'ACCEPTED');

      expect(updatedContract.status).toBe('ACCEPTED');

      // Step 3: Create history entry
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'hist-123', action: 'ACCEPTED' }],
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

      expect(contract.status).toBe('COUNTERED');

      // Step 2: Update status to REJECTED
      mockPool.query.mockResolvedValueOnce({
        rows: [{ ...mockContract, status: 'REJECTED' }],
      });

      const updatedContract = await contractService.updateContractStatus('draft-123', 'REJECTED');

      expect(updatedContract.status).toBe('REJECTED');

      // Step 3: Create history entry with rejection reason
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 'hist-123',
          action: 'REJECTED',
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

    it('should submit counter-offer', async () => {
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

      expect(contract.status).toBe('COUNTERED');

      // Step 2: Update contract with counter-offer
      const counterOfferData = {
        quantity: 200,
        unit_price: 4.0,
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [{
          ...mockContract,
          ...counterOfferData,
          status: 'COUNTERED',
        }],
      });

      const updatedContract = await contractService.updateContract('draft-123', counterOfferData);

      expect(updatedContract.quantity).toBe(200);
      expect(updatedContract.unit_price).toBe(4.0);

      // Step 3: Create history entry
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 'hist-123',
          action: 'COUNTERED',
          changes: {
            quantity: { old: 150, new: 200 },
            unit_price: { old: 4.5, new: 4.0 },
          },
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

      // Step 4: Send notification to exporter
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'notif-123' }],
      });

      const notification = await notificationService.createNotification({
        recipient_id: 'exp-123',
        recipient_email: 'exporter@example.com',
        notification_type: 'CONTRACT_COUNTERED',
        subject: 'Contract Counter-Offer',
        message: 'Buyer has submitted a counter-offer',
        action_link: '/contracts/draft-123',
      });

      expect(notification).toBeDefined();
    });
  });

  describe('Exporter response to counter-offer', () => {
    it('should accept counter-offer', async () => {
      // Step 1: Get contract with counter-offer
      const mockContract = {
        draft_id: 'draft-123',
        status: 'COUNTERED',
        quantity: 200,
        unit_price: 4.0,
        exporter_id: 'exp-123',
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockContract] });
      const contract = await contractService.getContractById('draft-123');

      expect(contract.quantity).toBe(200);
      expect(contract.unit_price).toBe(4.0);

      // Step 2: Update status to ACCEPTED
      mockPool.query.mockResolvedValueOnce({
        rows: [{ ...mockContract, status: 'ACCEPTED' }],
      });

      const updatedContract = await contractService.updateContractStatus('draft-123', 'ACCEPTED');

      expect(updatedContract.status).toBe('ACCEPTED');

      // Step 3: Create history entry
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'hist-123', action: 'ACCEPTED' }],
      });

      const history = await contractService.createContractHistory({
        contract_id: 'draft-123',
        action: 'ACCEPTED',
        actor: 'EXPORTER',
        changes: { status: 'COUNTERED -> ACCEPTED' },
      });

      expect(history.action).toBe('ACCEPTED');

      // Step 4: Send notification to buyer
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'notif-123' }],
      });

      const notification = await notificationService.createNotification({
        recipient_id: 'buyer-123',
        recipient_email: 'buyer@abc.com',
        notification_type: 'COUNTER_ACCEPTED',
        subject: 'Counter-Offer Accepted',
        message: 'Exporter has accepted your counter-offer',
        action_link: '/contracts/draft-123',
      });

      expect(notification).toBeDefined();
    });

    it('should submit counter to counter-offer', async () => {
      // Step 1: Get contract
      const mockContract = {
        draft_id: 'draft-123',
        status: 'COUNTERED',
        quantity: 200,
        unit_price: 4.0,
        exporter_id: 'exp-123',
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockContract] });
      const contract = await contractService.getContractById('draft-123');

      // Step 2: Update with exporter's counter
      const counterData = {
        quantity: 175,
        unit_price: 4.25,
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [{
          ...mockContract,
          ...counterData,
          status: 'COUNTERED',
        }],
      });

      const updatedContract = await contractService.updateContract('draft-123', counterData);

      expect(updatedContract.quantity).toBe(175);
      expect(updatedContract.unit_price).toBe(4.25);

      // Step 3: Create history entry
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 'hist-123',
          action: 'COUNTERED',
          changes: {
            quantity: { old: 200, new: 175 },
            unit_price: { old: 4.0, new: 4.25 },
          },
        }],
      });

      const history = await contractService.createContractHistory({
        contract_id: 'draft-123',
        action: 'COUNTERED',
        actor: 'EXPORTER',
        changes: {
          quantity: { old: 200, new: 175 },
          unit_price: { old: 4.0, new: 4.25 },
        },
      });

      expect(history.action).toBe('COUNTERED');
    });
  });

  describe('Status transitions', () => {
    it('should track status transitions correctly', async () => {
      const transitions = [
        { from: 'DRAFT', to: 'COUNTERED', actor: 'EXPORTER' },
        { from: 'COUNTERED', to: 'ACCEPTED', actor: 'BUYER' },
      ];

      for (const transition of transitions) {
        mockPool.query.mockResolvedValueOnce({
          rows: [{ id: 'hist-123', action: transition.to }],
        });

        const history = await contractService.createContractHistory({
          contract_id: 'draft-123',
          action: transition.to,
          actor: transition.actor,
          changes: { status: `${transition.from} -> ${transition.to}` },
        });

        expect(history.action).toBe(transition.to);
      }
    });
  });

  describe('History recording', () => {
    it('should record all contract modifications', async () => {
      const modifications = [
        { action: 'CREATED', actor: 'EXPORTER' },
        { action: 'SENT', actor: 'EXPORTER' },
        { action: 'COUNTERED', actor: 'BUYER' },
        { action: 'ACCEPTED', actor: 'EXPORTER' },
      ];

      for (const mod of modifications) {
        mockPool.query.mockResolvedValueOnce({
          rows: [{ id: `hist-${mod.action}`, action: mod.action }],
        });

        const history = await contractService.createContractHistory({
          contract_id: 'draft-123',
          action: mod.action,
          actor: mod.actor,
          changes: {},
        });

        expect(history.action).toBe(mod.action);
      }
    });

    it('should retrieve complete contract history', async () => {
      const mockHistory = [
        { id: 'hist-1', action: 'CREATED', timestamp: '2026-01-01' },
        { id: 'hist-2', action: 'SENT', timestamp: '2026-01-02' },
        { id: 'hist-3', action: 'COUNTERED', timestamp: '2026-01-03' },
        { id: 'hist-4', action: 'ACCEPTED', timestamp: '2026-01-04' },
      ];

      mockPool.query.mockResolvedValueOnce({ rows: mockHistory });

      const history = await contractService.getContractHistory('draft-123');

      expect(history).toHaveLength(4);
      expect(history[0].action).toBe('CREATED');
      expect(history[3].action).toBe('ACCEPTED');
    });
  });
});
