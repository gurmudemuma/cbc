import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationService } from '../services/notification.service';
import { Pool } from 'pg';

vi.mock('pg', () => ({
  Pool: vi.fn(),
}));

vi.mock('nodemailer', () => ({
  createTransport: vi.fn(() => ({
    sendMail: vi.fn().mockResolvedValue({ messageId: 'msg-123' }),
  })),
}));

describe('NotificationService', () => {
  let notificationService: NotificationService;
  let mockPool: any;

  beforeEach(() => {
    mockPool = {
      query: vi.fn(),
    };
    notificationService = new NotificationService(mockPool);
  });

  describe('createNotification', () => {
    it('should create an in-app notification', async () => {
      const notificationData = {
        recipient_id: 'user-123',
        recipient_email: 'user@example.com',
        notification_type: 'CONTRACT_SENT',
        subject: 'Contract Sent',
        message: 'Your contract has been sent to the buyer',
        action_link: '/contracts/draft-123',
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'notif-123', ...notificationData, is_read: false }],
      });

      const result = await notificationService.createNotification(notificationData);

      expect(result).toBeDefined();
      expect(result.notification_type).toBe('CONTRACT_SENT');
      expect(result.is_read).toBe(false);
      expect(mockPool.query).toHaveBeenCalled();
    });

    it('should throw error when required fields are missing', async () => {
      const incompleteData = {
        recipient_id: 'user-123',
        // Missing other required fields
      };

      mockPool.query.mockRejectedValueOnce(new Error('Missing required fields'));

      await expect(
        notificationService.createNotification(incompleteData as any)
      ).rejects.toThrow();
    });
  });

  describe('getNotifications', () => {
    it('should retrieve all notifications for a user', async () => {
      const mockNotifications = [
        { id: 'notif-1', recipient_id: 'user-123', is_read: false },
        { id: 'notif-2', recipient_id: 'user-123', is_read: true },
      ];

      mockPool.query.mockResolvedValueOnce({ rows: mockNotifications });

      const result = await notificationService.getNotifications('user-123');

      expect(result).toHaveLength(2);
      expect(mockPool.query).toHaveBeenCalledWith(expect.any(String), ['user-123']);
    });

    it('should filter unread notifications only', async () => {
      const mockNotifications = [
        { id: 'notif-1', recipient_id: 'user-123', is_read: false },
      ];

      mockPool.query.mockResolvedValueOnce({ rows: mockNotifications });

      const result = await notificationService.getNotifications('user-123', true);

      expect(result).toHaveLength(1);
      expect(result[0].is_read).toBe(false);
    });

    it('should return empty array when no notifications found', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await notificationService.getNotifications('nonexistent');

      expect(result).toHaveLength(0);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const updatedNotification = {
        id: 'notif-123',
        is_read: true,
        read_at: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({ rows: [updatedNotification] });

      const result = await notificationService.markAsRead('notif-123');

      expect(result.is_read).toBe(true);
      expect(result.read_at).toBeDefined();
      expect(mockPool.query).toHaveBeenCalled();
    });

    it('should throw error when notification not found', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await expect(notificationService.markAsRead('nonexistent')).rejects.toThrow();
    });
  });

  describe('sendEmailNotification', () => {
    it('should send email notification', async () => {
      const emailData = {
        to: 'buyer@example.com',
        subject: 'Contract Sent',
        template: 'CONTRACT_SENT',
        data: {
          buyerName: 'ABC Coffee Imports',
          contractNumber: 'CNT-001',
          exporter: 'Ethiopian Coffee Co',
        },
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'email-123', status: 'SENT' }],
      });

      const result = await notificationService.sendEmailNotification(emailData);

      expect(result).toBeDefined();
      expect(mockPool.query).toHaveBeenCalled();
    });

    it('should handle email sending errors', async () => {
      const emailData = {
        to: 'invalid-email',
        subject: 'Test',
        template: 'CONTRACT_SENT',
        data: {},
      };

      mockPool.query.mockRejectedValueOnce(new Error('Email sending failed'));

      await expect(
        notificationService.sendEmailNotification(emailData)
      ).rejects.toThrow();
    });
  });

  describe('getEmailTemplate', () => {
    it('should return email template for CONTRACT_SENT', () => {
      const template = notificationService.getEmailTemplate('CONTRACT_SENT', {
        buyerName: 'ABC Coffee',
        contractNumber: 'CNT-001',
      });

      expect(template).toBeDefined();
      expect(template.subject).toContain('Contract');
      expect(template.html).toContain('ABC Coffee');
    });

    it('should return email template for CONTRACT_ACCEPTED', () => {
      const template = notificationService.getEmailTemplate('CONTRACT_ACCEPTED', {
        exporterName: 'Ethiopian Coffee Co',
      });

      expect(template).toBeDefined();
      expect(template.subject).toContain('Accepted');
    });

    it('should return email template for CONTRACT_REJECTED', () => {
      const template = notificationService.getEmailTemplate('CONTRACT_REJECTED', {
        reason: 'Price too high',
      });

      expect(template).toBeDefined();
      expect(template.html).toContain('Price too high');
    });

    it('should return email template for CONTRACT_FINALIZED', () => {
      const template = notificationService.getEmailTemplate('CONTRACT_FINALIZED', {
        ecta_reference: 'ECTA-2026-00001',
      });

      expect(template).toBeDefined();
      expect(template.html).toContain('ECTA-2026-00001');
    });

    it('should throw error for unknown template', () => {
      expect(() => {
        notificationService.getEmailTemplate('UNKNOWN_TEMPLATE', {});
      }).toThrow();
    });
  });

  describe('notifyContractSent', () => {
    it('should send contract sent notification', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'notif-123' }],
      });

      const result = await notificationService.notifyContractSent(
        'buyer@example.com',
        'CNT-001',
        'Ethiopian Coffee Co'
      );

      expect(result).toBeDefined();
      expect(mockPool.query).toHaveBeenCalled();
    });
  });

  describe('notifyContractAccepted', () => {
    it('should send contract accepted notification', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'notif-123' }],
      });

      const result = await notificationService.notifyContractAccepted(
        'exporter@example.com',
        'CNT-001'
      );

      expect(result).toBeDefined();
      expect(mockPool.query).toHaveBeenCalled();
    });
  });

  describe('notifyContractRejected', () => {
    it('should send contract rejected notification', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'notif-123' }],
      });

      const result = await notificationService.notifyContractRejected(
        'exporter@example.com',
        'CNT-001',
        'Price too high'
      );

      expect(result).toBeDefined();
      expect(mockPool.query).toHaveBeenCalled();
    });
  });

  describe('notifyContractFinalized', () => {
    it('should send contract finalized notification', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'notif-123' }],
      });

      const result = await notificationService.notifyContractFinalized(
        'buyer@example.com',
        'CNT-001',
        'ECTA-2026-00001'
      );

      expect(result).toBeDefined();
      expect(mockPool.query).toHaveBeenCalled();
    });
  });

  describe('notifyEctaRegistrationFailed', () => {
    it('should send ECTA registration failed notification', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'notif-123' }],
      });

      const result = await notificationService.notifyEctaRegistrationFailed(
        'exporter@example.com',
        'CNT-001'
      );

      expect(result).toBeDefined();
      expect(mockPool.query).toHaveBeenCalled();
    });
  });

  describe('notifyBlockchainSubmissionFailed', () => {
    it('should send blockchain submission failed notification', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'notif-123' }],
      });

      const result = await notificationService.notifyBlockchainSubmissionFailed(
        'exporter@example.com',
        'CNT-001'
      );

      expect(result).toBeDefined();
      expect(mockPool.query).toHaveBeenCalled();
    });
  });
});
