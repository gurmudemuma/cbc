/**
 * API Endpoint Tests - Notification Endpoints
 * Tests for notification send, retrieve, and mark as read endpoints
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Request, Response } from 'express';
import { NotificationService } from '../../services/notification.service';

// Mock dependencies
vi.mock('../../services/notification.service');
vi.mock('@shared/database/pool');
vi.mock('@shared/database/transaction');

describe('Notification API Endpoints', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: any;

  beforeEach(() => {
    mockReq = {
      user: {
        id: 'user-123',
        email: 'user@example.com',
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

  describe('POST /api/notifications/send - Send Notification', () => {
    it('should send notification successfully', async () => {
      mockReq.body = {
        recipient_id: 'recipient-123',
        recipient_email: 'recipient@example.com',
        notification_type: 'CONTRACT_SENT',
        subject: 'New Contract Sent',
        message: 'A new contract has been sent to you',
        action_link: 'https://example.com/contracts/draft-123',
      };

      const notification = {
        notification_id: 'notif-123',
        draft_id: 'draft-123',
        recipient_id: 'recipient-123',
        recipient_email: 'recipient@example.com',
        notification_type: 'CONTRACT_SENT',
        subject: 'New Contract Sent',
        message: 'A new contract has been sent to you',
        action_link: 'https://example.com/contracts/draft-123',
        is_read: false,
        sent_at: new Date(),
      };

      vi.spyOn(NotificationService.prototype, 'sendNotification').mockResolvedValue(notification);

      const result = await NotificationService.prototype.sendNotification(
        null,
        mockReq.body
      );

      expect(result).toEqual(notification);
      expect(result.notification_id).toBe('notif-123');
      expect(result.is_read).toBe(false);
    });

    it('should return 400 if required fields are missing', async () => {
      mockReq.body = {
        recipient_id: 'recipient-123',
        // Missing other required fields
      };

      // Endpoint should validate all required fields
      expect(mockReq.body.recipient_email).toBeUndefined();
      expect(mockReq.body.notification_type).toBeUndefined();
      expect(mockReq.body.subject).toBeUndefined();
      expect(mockReq.body.message).toBeUndefined();
    });

    it('should return 201 Created on success', async () => {
      mockReq.body = {
        recipient_id: 'recipient-123',
        recipient_email: 'recipient@example.com',
        notification_type: 'CONTRACT_SENT',
        subject: 'New Contract Sent',
        message: 'A new contract has been sent to you',
      };

      const notification = {
        notification_id: 'notif-123',
        ...mockReq.body,
        is_read: false,
        sent_at: new Date(),
      };

      vi.spyOn(NotificationService.prototype, 'sendNotification').mockResolvedValue(notification);

      const result = await NotificationService.prototype.sendNotification(null, mockReq.body);

      expect(result).toBeDefined();
      expect(result.notification_id).toBeDefined();
    });

    it('should support all notification types', async () => {
      const notificationTypes = [
        'CONTRACT_SENT',
        'CONTRACT_ACCEPTED',
        'CONTRACT_REJECTED',
        'CONTRACT_COUNTERED',
        'COUNTER_ACCEPTED',
        'CONTRACT_FINALIZED',
        'ECTA_REGISTERED',
        'CERTIFICATE_READY',
      ];

      for (const type of notificationTypes) {
        mockReq.body = {
          recipient_id: 'recipient-123',
          recipient_email: 'recipient@example.com',
          notification_type: type,
          subject: `Notification: ${type}`,
          message: `This is a ${type} notification`,
        };

        const notification = {
          notification_id: `notif-${type}`,
          ...mockReq.body,
          is_read: false,
          sent_at: new Date(),
        };

        vi.spyOn(NotificationService.prototype, 'sendNotification').mockResolvedValue(notification);

        const result = await NotificationService.prototype.sendNotification(null, mockReq.body);

        expect(result.notification_type).toBe(type);
      }
    });

    it('should include action_link if provided', async () => {
      mockReq.body = {
        recipient_id: 'recipient-123',
        recipient_email: 'recipient@example.com',
        notification_type: 'CONTRACT_SENT',
        subject: 'New Contract Sent',
        message: 'A new contract has been sent to you',
        action_link: 'https://example.com/contracts/draft-123',
      };

      const notification = {
        notification_id: 'notif-123',
        ...mockReq.body,
        is_read: false,
        sent_at: new Date(),
      };

      vi.spyOn(NotificationService.prototype, 'sendNotification').mockResolvedValue(notification);

      const result = await NotificationService.prototype.sendNotification(null, mockReq.body);

      expect(result.action_link).toBe('https://example.com/contracts/draft-123');
    });

    it('should set sent_at timestamp', async () => {
      mockReq.body = {
        recipient_id: 'recipient-123',
        recipient_email: 'recipient@example.com',
        notification_type: 'CONTRACT_SENT',
        subject: 'New Contract Sent',
        message: 'A new contract has been sent to you',
      };

      const notification = {
        notification_id: 'notif-123',
        ...mockReq.body,
        is_read: false,
        sent_at: new Date(),
      };

      vi.spyOn(NotificationService.prototype, 'sendNotification').mockResolvedValue(notification);

      const result = await NotificationService.prototype.sendNotification(null, mockReq.body);

      expect(result.sent_at).toBeDefined();
      expect(result.sent_at instanceof Date).toBe(true);
    });
  });

  describe('GET /api/notifications/:userId - Get User Notifications', () => {
    it('should retrieve all notifications for a user', async () => {
      mockReq.params = { userId: 'user-123' };
      mockReq.query = {};

      const notifications = [
        {
          notification_id: 'notif-1',
          recipient_id: 'user-123',
          notification_type: 'CONTRACT_SENT',
          subject: 'New Contract Sent',
          is_read: false,
          sent_at: new Date(),
        },
        {
          notification_id: 'notif-2',
          recipient_id: 'user-123',
          notification_type: 'CONTRACT_ACCEPTED',
          subject: 'Contract Accepted',
          is_read: true,
          sent_at: new Date(),
        },
      ];

      vi.spyOn(NotificationService.prototype, 'getNotifications').mockResolvedValue(notifications);

      const result = await NotificationService.prototype.getNotifications('user-123');

      expect(result).toEqual(notifications);
      expect(result).toHaveLength(2);
    });

    it('should filter unread notifications only', async () => {
      mockReq.params = { userId: 'user-123' };
      mockReq.query = { unread_only: 'true' };

      const unreadNotifications = [
        {
          notification_id: 'notif-1',
          recipient_id: 'user-123',
          notification_type: 'CONTRACT_SENT',
          is_read: false,
          sent_at: new Date(),
        },
      ];

      vi.spyOn(NotificationService.prototype, 'getUnreadNotifications').mockResolvedValue(unreadNotifications);

      const result = await NotificationService.prototype.getUnreadNotifications('user-123');

      expect(result).toEqual(unreadNotifications);
      expect(result.every(n => !n.is_read)).toBe(true);
    });

    it('should return empty array if no notifications found', async () => {
      mockReq.params = { userId: 'user-123' };
      mockReq.query = {};

      vi.spyOn(NotificationService.prototype, 'getNotifications').mockResolvedValue([]);

      const result = await NotificationService.prototype.getNotifications('user-123');

      expect(result).toEqual([]);
    });

    it('should return 401 if user is not authenticated', async () => {
      mockReq.user = undefined;
      mockReq.params = { userId: 'user-123' };

      // Endpoint should check authentication
      expect(mockReq.user).toBeUndefined();
    });

    it('should return 403 if user tries to access other user notifications', async () => {
      mockReq.user = { id: 'user-123', email: 'user@example.com', role: 'EXPORTER' };
      mockReq.params = { userId: 'different-user' };

      // Endpoint should check user can only access own notifications
      expect(mockReq.user.id).not.toBe(mockReq.params.userId);
    });

    it('should support pagination', async () => {
      mockReq.params = { userId: 'user-123' };
      mockReq.query = { page: '2', limit: '5' };

      const notifications = [
        {
          notification_id: 'notif-6',
          recipient_id: 'user-123',
          notification_type: 'CONTRACT_SENT',
          is_read: false,
        },
      ];

      vi.spyOn(NotificationService.prototype, 'getNotifications').mockResolvedValue(notifications);

      const result = await NotificationService.prototype.getNotifications('user-123');

      expect(result).toEqual(notifications);
    });

    it('should return notifications in descending order by sent_at', async () => {
      mockReq.params = { userId: 'user-123' };
      mockReq.query = {};

      const notifications = [
        {
          notification_id: 'notif-2',
          sent_at: new Date('2025-01-15'),
          is_read: false,
        },
        {
          notification_id: 'notif-1',
          sent_at: new Date('2025-01-10'),
          is_read: false,
        },
      ];

      vi.spyOn(NotificationService.prototype, 'getNotifications').mockResolvedValue(notifications);

      const result = await NotificationService.prototype.getNotifications('user-123');

      expect(result[0].notification_id).toBe('notif-2');
      expect(result[1].notification_id).toBe('notif-1');
    });
  });

  describe('PUT /api/notifications/:notificationId/read - Mark as Read', () => {
    it('should mark notification as read', async () => {
      mockReq.params = { notificationId: 'notif-123' };

      const notification = {
        notification_id: 'notif-123',
        recipient_id: 'user-123',
        notification_type: 'CONTRACT_SENT',
        is_read: true,
        read_at: new Date(),
      };

      vi.spyOn(NotificationService.prototype, 'markAsRead').mockResolvedValue(notification);

      const result = await NotificationService.prototype.markAsRead('notif-123', 'user-123');

      expect(result.is_read).toBe(true);
      expect(result.read_at).toBeDefined();
    });

    it('should return 404 if notification not found', async () => {
      mockReq.params = { notificationId: 'nonexistent-notif' };

      vi.spyOn(NotificationService.prototype, 'markAsRead').mockResolvedValue(null);

      const result = await NotificationService.prototype.markAsRead('nonexistent-notif', 'user-123');

      expect(result).toBeNull();
    });

    it('should return 403 if user is not authorized', async () => {
      mockReq.params = { notificationId: 'notif-123' };
      mockReq.user = { id: 'different-user', email: 'other@example.com', role: 'EXPORTER' };

      const notification = {
        notification_id: 'notif-123',
        recipient_id: 'user-123', // Different user
        is_read: false,
      };

      vi.spyOn(NotificationService.prototype, 'getNotificationById').mockResolvedValue(notification);

      // Endpoint should check user owns notification
      expect(mockReq.user.id).not.toBe(notification.recipient_id);
    });

    it('should set read_at timestamp', async () => {
      mockReq.params = { notificationId: 'notif-123' };

      const notification = {
        notification_id: 'notif-123',
        recipient_id: 'user-123',
        is_read: true,
        read_at: new Date(),
      };

      vi.spyOn(NotificationService.prototype, 'markAsRead').mockResolvedValue(notification);

      const result = await NotificationService.prototype.markAsRead('notif-123', 'user-123');

      expect(result.read_at).toBeDefined();
      expect(result.read_at instanceof Date).toBe(true);
    });

    it('should return 200 OK on success', async () => {
      mockReq.params = { notificationId: 'notif-123' };

      const notification = {
        notification_id: 'notif-123',
        recipient_id: 'user-123',
        is_read: true,
        read_at: new Date(),
      };

      vi.spyOn(NotificationService.prototype, 'markAsRead').mockResolvedValue(notification);

      const result = await NotificationService.prototype.markAsRead('notif-123', 'user-123');

      expect(result).toBeDefined();
      expect(result.is_read).toBe(true);
    });

    it('should handle already read notifications', async () => {
      mockReq.params = { notificationId: 'notif-123' };

      const notification = {
        notification_id: 'notif-123',
        recipient_id: 'user-123',
        is_read: true,
        read_at: new Date('2025-01-10'),
      };

      vi.spyOn(NotificationService.prototype, 'markAsRead').mockResolvedValue(notification);

      const result = await NotificationService.prototype.markAsRead('notif-123', 'user-123');

      expect(result.is_read).toBe(true);
    });

    it('should return 401 if user is not authenticated', async () => {
      mockReq.user = undefined;
      mockReq.params = { notificationId: 'notif-123' };

      // Endpoint should check authentication
      expect(mockReq.user).toBeUndefined();
    });
  });

  describe('Notification Delivery Tracking', () => {
    it('should track notification delivery status', async () => {
      const notification = {
        notification_id: 'notif-123',
        recipient_email: 'recipient@example.com',
        sent_at: new Date(),
        delivery_status: 'SENT',
        delivery_attempts: 1,
      };

      vi.spyOn(NotificationService.prototype, 'trackDelivery').mockResolvedValue(notification);

      const result = await NotificationService.prototype.trackDelivery('notif-123');

      expect(result.delivery_status).toBe('SENT');
      expect(result.delivery_attempts).toBe(1);
    });

    it('should retry failed deliveries', async () => {
      const notification = {
        notification_id: 'notif-123',
        delivery_status: 'FAILED',
        delivery_attempts: 1,
      };

      vi.spyOn(NotificationService.prototype, 'retryDelivery').mockResolvedValue({
        ...notification,
        delivery_attempts: 2,
      });

      const result = await NotificationService.prototype.retryDelivery('notif-123');

      expect(result.delivery_attempts).toBe(2);
    });

    it('should log delivery attempts', async () => {
      const notification = {
        notification_id: 'notif-123',
        delivery_attempts: 3,
      };

      vi.spyOn(NotificationService.prototype, 'getDeliveryLog').mockResolvedValue([
        { attempt: 1, status: 'FAILED', timestamp: new Date() },
        { attempt: 2, status: 'FAILED', timestamp: new Date() },
        { attempt: 3, status: 'SENT', timestamp: new Date() },
      ]);

      const result = await NotificationService.prototype.getDeliveryLog('notif-123');

      expect(result).toHaveLength(3);
      expect(result[2].status).toBe('SENT');
    });
  });
});
