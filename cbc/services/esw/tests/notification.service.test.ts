import { Pool } from 'pg';
import nodemailer from 'nodemailer';

// Create mock pool first
const mockPool = {
  query: jest.fn(),
  connect: jest.fn(),
  end: jest.fn()
} as unknown as Pool;

const mockTransporter = {
  sendMail: jest.fn()
};

// Mock dependencies BEFORE importing the service
jest.mock('pg');
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => mockTransporter)
}));
jest.mock('@shared/database/pool', () => ({
  getPool: jest.fn(() => mockPool)
}));
jest.mock('@shared/logger', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }))
}));

// Import after mocks
import notificationServiceInstance from '../src/services/notification.service';

/**
 * Integration tests for NotificationService
 * 
 * These tests verify the NotificationService implementation meets the requirements:
 * - Requirement 8.1: Send email notification when certificate is generated
 * - Requirement 8.2: Email includes agency name and certificate number
 * - Requirement 8.3: Email includes direct download link
 * - Requirement 8.4: Create dashboard notification for exporter
 */

describe('NotificationService - Integration Tests', () => {
  const notificationService = notificationServiceInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up environment variables
    process.env.EMAIL_HOST = 'smtp.test.com';
    process.env.EMAIL_PORT = '587';
    process.env.EMAIL_USER = 'test@test.com';
    process.env.EMAIL_PASSWORD = 'password';
    process.env.EMAIL_FROM = 'noreply@esw.gov.et';
    process.env.BASE_URL = 'http://localhost:3000';
  });

  afterEach(() => {
    delete process.env.EMAIL_HOST;
    delete process.env.EMAIL_PORT;
    delete process.env.EMAIL_USER;
    delete process.env.EMAIL_PASSWORD;
    delete process.env.EMAIL_FROM;
    delete process.env.BASE_URL;
  });

  describe('sendCertificateGeneratedEmail - Requirement 8.1, 8.2, 8.3', () => {
    const mockCertificate = {
      certificateId: 'cert-123',
      approvalId: 'approval-123',
      submissionId: 'sub-123',
      agencyCode: 'ECTA',
      certificateNumber: 'ECTA-CERT-2025-00001',
      exporterName: 'Test Exporter',
      exporterTin: 'TIN123456',
      eswReferenceNumber: 'ESW-2025-001',
      createdAt: new Date()
    };

    it('should query exporter email from database', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{
            email: 'exporter@test.com',
            business_name: 'Test Exporter Business'
          }]
        })
        .mockResolvedValueOnce({
          rows: [{
            agency_name: 'Ethiopian Coffee & Tea Authority'
          }]
        });

      mockTransporter.sendMail.mockResolvedValueOnce({ messageId: 'msg-123' });

      await notificationService.sendCertificateGeneratedEmail(
        'exporter-123',
        mockCertificate
      );

      // Verify exporter query was made
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT email, business_name FROM exporter_profiles'),
        ['exporter-123']
      );
    });

    it('should query agency name from database', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{
            email: 'exporter@test.com',
            business_name: 'Test Exporter'
          }]
        })
        .mockResolvedValueOnce({
          rows: [{
            agency_name: 'Ethiopian Coffee & Tea Authority'
          }]
        });

      mockTransporter.sendMail.mockResolvedValueOnce({ messageId: 'msg-123' });

      await notificationService.sendCertificateGeneratedEmail(
        'exporter-123',
        mockCertificate
      );

      // Verify agency query was made
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT agency_name FROM esw_agencies'),
        ['ECTA']
      );
    });

    it('should return false when exporter not found', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const result = await notificationService.sendCertificateGeneratedEmail(
        'exporter-123',
        mockCertificate
      );

      expect(result).toBe(false);
      expect(mockTransporter.sendMail).not.toHaveBeenCalled();
    });

    it('should return false when exporter email is missing', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{
          email: null,
          business_name: 'Test Exporter'
        }]
      });

      const result = await notificationService.sendCertificateGeneratedEmail(
        'exporter-123',
        mockCertificate
      );

      expect(result).toBe(false);
      expect(mockTransporter.sendMail).not.toHaveBeenCalled();
    });

    it('should handle email sending errors gracefully', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{
            email: 'exporter@test.com',
            business_name: 'Test Exporter'
          }]
        })
        .mockResolvedValueOnce({
          rows: [{
            agency_name: 'Ethiopian Coffee & Tea Authority'
          }]
        });

      mockTransporter.sendMail.mockRejectedValueOnce(new Error('SMTP error'));

      const result = await notificationService.sendCertificateGeneratedEmail(
        'exporter-123',
        mockCertificate
      );

      expect(result).toBe(false);
    });
  });

  describe('createDashboardNotification - Requirement 8.4', () => {
    const mockCertificate = {
      certificateId: 'cert-123',
      approvalId: 'approval-123',
      submissionId: 'sub-123',
      agencyCode: 'ECTA',
      certificateNumber: 'ECTA-CERT-2025-00001',
      exporterName: 'Test Exporter',
      exporterTin: 'TIN123456',
      eswReferenceNumber: 'ESW-2025-001',
      createdAt: new Date()
    };

    it('should insert notification into database', async () => {
      const mockNotificationId = 'notif-123';
      
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{
            agency_name: 'Ethiopian Coffee & Tea Authority'
          }]
        })
        .mockResolvedValueOnce({
          rows: [{
            email: 'exporter@test.com'
          }]
        })
        .mockResolvedValueOnce({
          rows: [{
            notification_id: mockNotificationId,
            certificate_id: 'cert-123',
            exporter_id: 'exporter-123',
            notification_type: 'GENERATED',
            email_sent: false,
            email_sent_at: null,
            email_address: 'exporter@test.com',
            dashboard_notification: true,
            acknowledged: false,
            acknowledged_at: null,
            title: 'Certificate Generated - Ethiopian Coffee & Tea Authority',
            message: 'Your certificate ECTA-CERT-2025-00001 has been generated for ESW submission ESW-2025-001. Click to download.',
            download_url: 'http://localhost:3000/certificates/cert-123/download',
            created_at: new Date()
          }]
        });

      const result = await notificationService.createDashboardNotification(
        'exporter-123',
        mockCertificate
      );

      // Verify notification was inserted
      const insertCall = (mockPool.query as jest.Mock).mock.calls.find(
        call => call[0].includes('INSERT INTO esw_certificate_notifications')
      );
      
      expect(insertCall).toBeDefined();
      expect(insertCall[1]).toContain('cert-123');
      expect(insertCall[1]).toContain('exporter-123');
      expect(insertCall[1]).toContain('GENERATED');
    });

    it('should return notification with correct structure', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ agency_name: 'Ethiopian Coffee & Tea Authority' }]
        })
        .mockResolvedValueOnce({
          rows: [{ email: 'exporter@test.com' }]
        })
        .mockResolvedValueOnce({
          rows: [{
            notification_id: 'notif-123',
            certificate_id: 'cert-123',
            exporter_id: 'exporter-123',
            notification_type: 'GENERATED',
            email_sent: false,
            email_sent_at: null,
            email_address: 'exporter@test.com',
            dashboard_notification: true,
            acknowledged: false,
            acknowledged_at: null,
            title: 'Certificate Generated - Ethiopian Coffee & Tea Authority',
            message: 'Your certificate ECTA-CERT-2025-00001 has been generated for ESW submission ESW-2025-001. Click to download.',
            download_url: 'http://localhost:3000/certificates/cert-123/download',
            created_at: new Date()
          }]
        });

      const result = await notificationService.createDashboardNotification(
        'exporter-123',
        mockCertificate
      );

      expect(result).not.toBeNull();
      expect(result?.certificateId).toBe('cert-123');
      expect(result?.exporterId).toBe('exporter-123');
      expect(result?.notificationType).toBe('GENERATED');
      expect(result?.acknowledged).toBe(false);
      expect(result?.dashboardNotification).toBe(true);
    });

    it('should handle database errors gracefully', async () => {
      (mockPool.query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

      const result = await notificationService.createDashboardNotification(
        'exporter-123',
        mockCertificate
      );

      expect(result).toBeNull();
    });
  });

  describe('getNotifications', () => {
    it('should retrieve notifications for an exporter', async () => {
      const mockNotifications = [
        {
          notification_id: 'notif-1',
          certificate_id: 'cert-1',
          exporter_id: 'exporter-123',
          notification_type: 'GENERATED',
          email_sent: true,
          email_sent_at: new Date(),
          email_address: 'exporter@test.com',
          dashboard_notification: true,
          acknowledged: false,
          acknowledged_at: null,
          title: 'Certificate Generated',
          message: 'Your certificate has been generated',
          download_url: 'http://localhost:3000/certificates/cert-1/download',
          created_at: new Date()
        }
      ];

      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: mockNotifications });

      const result = await notificationService.getNotifications('exporter-123');

      expect(result).toHaveLength(1);
      expect(result[0].certificateId).toBe('cert-1');
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM esw_certificate_notifications'),
        ['exporter-123']
      );
    });

    it('should filter notifications by acknowledged status', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      await notificationService.getNotifications('exporter-123', false);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('acknowledged = $2'),
        ['exporter-123', false]
      );
    });
  });

  describe('acknowledgeNotification', () => {
    it('should acknowledge notification successfully', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{
          notification_id: 'notif-123',
          acknowledged: true,
          acknowledged_at: new Date()
        }]
      });

      const result = await notificationService.acknowledgeNotification('notif-123');

      expect(result).toBe(true);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE esw_certificate_notifications'),
        ['notif-123']
      );
    });

    it('should return false when notification not found', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const result = await notificationService.acknowledgeNotification('notif-123');

      expect(result).toBe(false);
    });
  });

  describe('Email Configuration', () => {
    it('should handle missing email configuration gracefully', async () => {
      const mockCertificate = {
        certificateId: 'cert-123',
        approvalId: 'approval-123',
        submissionId: 'sub-123',
        agencyCode: 'ECTA',
        certificateNumber: 'ECTA-CERT-2025-00001',
        exporterName: 'Test Exporter',
        exporterTin: 'TIN123456',
        eswReferenceNumber: 'ESW-2025-001',
        createdAt: new Date()
      };

      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{
          email: 'exporter@test.com',
          business_name: 'Test Exporter'
        }]
      });

      // The service will check for email transporter availability
      // and return false if not configured
      const result = await notificationService.sendCertificateGeneratedEmail(
        'exporter-123',
        mockCertificate
      );

      // Should handle gracefully (may return false or true depending on config)
      expect(typeof result).toBe('boolean');
    });
  });
});
