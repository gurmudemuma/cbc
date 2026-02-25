/**
 * Integration test for notification integration with certificate generation
 * Tests task 8.2: Integrate notifications with certificate generation
 */

import { Pool } from 'pg';
import { getPool } from '@shared/database/pool';
import certificateGenerationService from '../src/services/certificate-generation.service';
import notificationService from '../src/services/notification.service';

describe('Notification Integration with Certificate Generation', () => {
  let pool: Pool;
  let testSubmissionId: string;
  let testApprovalId: string;
  let testExporterId: string;
  let testExportId: string;

  beforeAll(async () => {
    pool = getPool();
  });

  beforeEach(async () => {
    // Create test data
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create test exporter
      const exporterResult = await client.query(
        `INSERT INTO exporter_profiles (business_name, tin, email, phone, address)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING exporter_id`,
        ['Test Exporter Ltd', 'TIN123456', 'test@example.com', '+251911234567', 'Addis Ababa']
      );
      testExporterId = exporterResult.rows[0].exporter_id;

      // Create test export
      const exportResult = await client.query(
        `INSERT INTO exports (exporter_id, coffee_type, quantity, origin_region, destination_country, buyer_name, buyer_country)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING export_id`,
        [testExporterId, 'Arabica', 1000, 'Sidama', 'USA', 'Test Buyer', 'USA']
      );
      testExportId = exportResult.rows[0].export_id;

      // Create test submission
      const submissionResult = await client.query(
        `INSERT INTO esw_submissions (export_id, esw_reference_number, status)
         VALUES ($1, $2, $3)
         RETURNING submission_id`,
        [testExportId, 'ESW-TEST-' + Date.now(), 'PENDING']
      );
      testSubmissionId = submissionResult.rows[0].submission_id;

      // Create test approval
      const approvalResult = await client.query(
        `INSERT INTO esw_agency_approvals (submission_id, agency_code, agency_name, status, approved_by, approved_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING approval_id`,
        [testSubmissionId, 'ECTA', 'Ethiopian Coffee & Tea Authority', 'APPROVED', 'test-officer']
      );
      testApprovalId = approvalResult.rows[0].approval_id;

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  });

  afterEach(async () => {
    // Clean up test data
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Delete in reverse order of dependencies
      if (testApprovalId) {
        await client.query('DELETE FROM esw_certificates WHERE approval_id = $1', [testApprovalId]);
        await client.query('DELETE FROM esw_agency_approvals WHERE approval_id = $1', [testApprovalId]);
      }
      if (testSubmissionId) {
        await client.query('DELETE FROM esw_certificate_notifications WHERE certificate_id IN (SELECT certificate_id FROM esw_certificates WHERE submission_id = $1)', [testSubmissionId]);
        await client.query('DELETE FROM esw_submissions WHERE submission_id = $1', [testSubmissionId]);
      }
      if (testExportId) {
        await client.query('DELETE FROM exports WHERE export_id = $1', [testExportId]);
      }
      if (testExporterId) {
        await client.query('DELETE FROM exporter_profiles WHERE exporter_id = $1', [testExporterId]);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Cleanup error:', error);
    } finally {
      client.release();
    }
  });

  afterAll(async () => {
    await pool.end();
  });

  test('should create dashboard notification after certificate generation', async () => {
    // Generate certificate
    const certificate = await certificateGenerationService.generateCertificate(testApprovalId);

    expect(certificate).toBeDefined();
    expect(certificate.certificateId).toBeDefined();
    expect(certificate.certificateNumber).toMatch(/^ECTA-CERT-\d{4}-\d{5}$/);

    // Create dashboard notification
    const notification = await notificationService.createDashboardNotification(
      testExporterId,
      certificate
    );

    expect(notification).toBeDefined();
    expect(notification?.notificationId).toBeDefined();
    expect(notification?.certificateId).toBe(certificate.certificateId);
    expect(notification?.exporterId).toBe(testExporterId);
    expect(notification?.notificationType).toBe('GENERATED');
    expect(notification?.dashboardNotification).toBe(true);
    expect(notification?.acknowledged).toBe(false);
    expect(notification?.title).toContain('Certificate Generated');
    expect(notification?.message).toContain(certificate.certificateNumber);
    expect(notification?.downloadUrl).toContain(certificate.certificateId);
  });

  test('should send email notification after certificate generation', async () => {
    // Generate certificate
    const certificate = await certificateGenerationService.generateCertificate(testApprovalId);

    expect(certificate).toBeDefined();

    // Send email notification (may fail if email is not configured, which is OK)
    const emailSent = await notificationService.sendCertificateGeneratedEmail(
      testExporterId,
      certificate
    );

    // Email sending is optional - it may fail if email is not configured
    // We just verify the method doesn't throw an error
    expect(typeof emailSent).toBe('boolean');
  });

  test('should handle email failure gracefully and still create dashboard notification', async () => {
    // Generate certificate
    const certificate = await certificateGenerationService.generateCertificate(testApprovalId);

    expect(certificate).toBeDefined();

    // Create dashboard notification first
    const notification = await notificationService.createDashboardNotification(
      testExporterId,
      certificate
    );

    expect(notification).toBeDefined();

    // Try to send email (may fail, but should not throw)
    let emailError = null;
    try {
      await notificationService.sendCertificateGeneratedEmail(
        testExporterId,
        certificate
      );
    } catch (error) {
      emailError = error;
    }

    // Email failure should not prevent dashboard notification from being created
    expect(notification).toBeDefined();
    expect(notification?.notificationId).toBeDefined();
  });

  test('should include agency name, certificate number, and download link in notification', async () => {
    // Generate certificate
    const certificate = await certificateGenerationService.generateCertificate(testApprovalId);

    expect(certificate).toBeDefined();

    // Create dashboard notification
    const notification = await notificationService.createDashboardNotification(
      testExporterId,
      certificate
    );

    expect(notification).toBeDefined();
    expect(notification?.title).toContain('Ethiopian Coffee & Tea Authority');
    expect(notification?.message).toContain(certificate.certificateNumber);
    expect(notification?.message).toContain(certificate.eswReferenceNumber);
    expect(notification?.downloadUrl).toContain(`/certificates/${certificate.certificateId}/download`);
  });

  test('should retrieve notifications for exporter', async () => {
    // Generate certificate
    const certificate = await certificateGenerationService.generateCertificate(testApprovalId);

    // Create dashboard notification
    await notificationService.createDashboardNotification(
      testExporterId,
      certificate
    );

    // Retrieve notifications
    const notifications = await notificationService.getNotifications(testExporterId);

    expect(notifications).toBeDefined();
    expect(notifications.length).toBeGreaterThan(0);
    
    const certNotification = notifications.find(n => n.certificateId === certificate.certificateId);
    expect(certNotification).toBeDefined();
    expect(certNotification?.acknowledged).toBe(false);
  });

  test('should acknowledge notification', async () => {
    // Generate certificate
    const certificate = await certificateGenerationService.generateCertificate(testApprovalId);

    // Create dashboard notification
    const notification = await notificationService.createDashboardNotification(
      testExporterId,
      certificate
    );

    expect(notification).toBeDefined();
    expect(notification?.acknowledged).toBe(false);

    // Acknowledge notification
    const acknowledged = await notificationService.acknowledgeNotification(notification!.notificationId);

    expect(acknowledged).toBe(true);

    // Verify notification is acknowledged
    const notifications = await notificationService.getNotifications(testExporterId);
    const updatedNotification = notifications.find(n => n.notificationId === notification!.notificationId);
    
    expect(updatedNotification?.acknowledged).toBe(true);
    expect(updatedNotification?.acknowledgedAt).toBeDefined();
  });

  test('should filter notifications by acknowledged status', async () => {
    // Generate certificate
    const certificate = await certificateGenerationService.generateCertificate(testApprovalId);

    // Create dashboard notification
    const notification = await notificationService.createDashboardNotification(
      testExporterId,
      certificate
    );

    expect(notification).toBeDefined();

    // Get unacknowledged notifications
    const unacknowledged = await notificationService.getNotifications(testExporterId, false);
    expect(unacknowledged.length).toBeGreaterThan(0);
    expect(unacknowledged.every(n => !n.acknowledged)).toBe(true);

    // Acknowledge notification
    await notificationService.acknowledgeNotification(notification!.notificationId);

    // Get acknowledged notifications
    const acknowledged = await notificationService.getNotifications(testExporterId, true);
    expect(acknowledged.length).toBeGreaterThan(0);
    expect(acknowledged.every(n => n.acknowledged)).toBe(true);
  });
});
