import { Pool, PoolClient } from 'pg';
import { getPool } from '@shared/database/pool';
import { createLogger } from '@shared/logger';
import nodemailer, { Transporter } from 'nodemailer';

const logger = createLogger('NotificationService');

interface Certificate {
  certificateId: string;
  approvalId: string;
  submissionId: string;
  agencyCode: string;
  certificateNumber: string;
  exporterName: string;
  exporterTin: string;
  eswReferenceNumber: string;
  agencyName?: string;
  createdAt: Date;
}

interface NotificationRecord {
  notificationId: string;
  certificateId: string;
  exporterId: string;
  notificationType: 'GENERATED' | 'REVOKED';
  emailSent: boolean;
  emailSentAt?: Date;
  emailAddress?: string;
  dashboardNotification: boolean;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  title: string;
  message: string;
  downloadUrl?: string;
  createdAt: Date;
}

export class NotificationService {
  private pool: Pool;
  private emailTransporter: Transporter | null = null;

  constructor() {
    this.pool = getPool();
    this.initializeEmailTransporter();
  }

  /**
   * Initialize email transporter with configuration from environment
   */
  private initializeEmailTransporter(): void {
    try {
      // Check if email configuration is available
      const emailHost = process.env.EMAIL_HOST;
      const emailPort = process.env.EMAIL_PORT;
      const emailUser = process.env.EMAIL_USER;
      const emailPassword = process.env.EMAIL_PASSWORD;

      if (emailHost && emailPort && emailUser && emailPassword) {
        this.emailTransporter = nodemailer.createTransport({
          host: emailHost,
          port: parseInt(emailPort),
          secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
          auth: {
            user: emailUser,
            pass: emailPassword
          }
        });

        logger.info('Email transporter initialized successfully');
      } else {
        logger.warn('Email configuration not found. Email notifications will be disabled.');
      }
    } catch (error: any) {
      logger.error('Failed to initialize email transporter', { error: error.message });
    }
  }

  /**
   * Send email notification when certificate is generated
   */
  public async sendCertificateGeneratedEmail(
    exporterId: string,
    certificate: Certificate
  ): Promise<boolean> {
    try {
      // Get exporter email address
      const exporterResult = await this.pool.query(
        `SELECT email, business_name FROM exporter_profiles WHERE exporter_id = $1`,
        [exporterId]
      );

      if (exporterResult.rows.length === 0) {
        logger.warn('Exporter not found', { exporterId });
        return false;
      }

      const exporter = exporterResult.rows[0];
      const emailAddress = exporter.email;

      if (!emailAddress) {
        logger.warn('Exporter email address not found', { exporterId });
        return false;
      }

      // Check if email transporter is available
      if (!this.emailTransporter) {
        logger.warn('Email transporter not available. Skipping email notification.');
        return false;
      }

      // Get agency name
      const agencyResult = await this.pool.query(
        `SELECT agency_name FROM esw_agencies WHERE agency_code = $1`,
        [certificate.agencyCode]
      );

      const agencyName = agencyResult.rows.length > 0 
        ? agencyResult.rows[0].agency_name 
        : certificate.agencyCode;

      // Prepare email content
      const downloadUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/certificates/${certificate.certificateId}/download`;
      
      const subject = `Certificate Generated - ${agencyName}`;
      const htmlContent = this.generateCertificateEmailTemplate({
        exporterName: exporter.business_name || certificate.exporterName,
        agencyName,
        certificateNumber: certificate.certificateNumber,
        eswReferenceNumber: certificate.eswReferenceNumber,
        downloadUrl
      });

      // Send email
      await this.emailTransporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@esw.gov.et',
        to: emailAddress,
        subject,
        html: htmlContent
      });

      logger.info('Certificate generated email sent successfully', {
        exporterId,
        certificateId: certificate.certificateId,
        emailAddress
      });

      return true;
    } catch (error: any) {
      logger.error('Failed to send certificate generated email', {
        error: error.message,
        exporterId,
        certificateId: certificate.certificateId
      });
      return false;
    }
  }

  /**
   * Create dashboard notification for certificate generation
   */
  public async createDashboardNotification(
    exporterId: string,
    certificate: Certificate,
    client?: PoolClient
  ): Promise<NotificationRecord | null> {
    const dbClient = client || this.pool;

    try {
      // Get agency name
      const agencyResult = await dbClient.query(
        `SELECT agency_name FROM esw_agencies WHERE agency_code = $1`,
        [certificate.agencyCode]
      );

      const agencyName = agencyResult.rows.length > 0 
        ? agencyResult.rows[0].agency_name 
        : certificate.agencyCode;

      // Get exporter email for notification record
      const exporterResult = await dbClient.query(
        `SELECT email FROM exporter_profiles WHERE exporter_id = $1`,
        [exporterId]
      );

      const emailAddress = exporterResult.rows.length > 0 
        ? exporterResult.rows[0].email 
        : null;

      // Prepare notification content
      const downloadUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/certificates/${certificate.certificateId}/download`;
      const title = `Certificate Generated - ${agencyName}`;
      const message = `Your certificate ${certificate.certificateNumber} has been generated for ESW submission ${certificate.eswReferenceNumber}. Click to download.`;

      // Create notification record
      const result = await dbClient.query(
        `INSERT INTO esw_certificate_notifications (
          certificate_id, exporter_id, notification_type,
          email_sent, email_address,
          dashboard_notification, acknowledged,
          title, message, download_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          certificate.certificateId,
          exporterId,
          'GENERATED',
          false, // email_sent will be updated separately
          emailAddress,
          true, // dashboard_notification
          false, // acknowledged
          title,
          message,
          downloadUrl
        ]
      );

      const notification: NotificationRecord = {
        notificationId: result.rows[0].notification_id,
        certificateId: result.rows[0].certificate_id,
        exporterId: result.rows[0].exporter_id,
        notificationType: result.rows[0].notification_type,
        emailSent: result.rows[0].email_sent,
        emailSentAt: result.rows[0].email_sent_at,
        emailAddress: result.rows[0].email_address,
        dashboardNotification: result.rows[0].dashboard_notification,
        acknowledged: result.rows[0].acknowledged,
        acknowledgedAt: result.rows[0].acknowledged_at,
        title: result.rows[0].title,
        message: result.rows[0].message,
        downloadUrl: result.rows[0].download_url,
        createdAt: result.rows[0].created_at
      };

      logger.info('Dashboard notification created successfully', {
        notificationId: notification.notificationId,
        exporterId,
        certificateId: certificate.certificateId
      });

      return notification;
    } catch (error: any) {
      logger.error('Failed to create dashboard notification', {
        error: error.message,
        exporterId,
        certificateId: certificate.certificateId
      });
      return null;
    }
  }

  /**
   * Update notification record to mark email as sent
   */
  public async markEmailAsSent(
    notificationId: string,
    client?: PoolClient
  ): Promise<void> {
    const dbClient = client || this.pool;

    try {
      await dbClient.query(
        `UPDATE esw_certificate_notifications 
         SET email_sent = true, email_sent_at = NOW()
         WHERE notification_id = $1`,
        [notificationId]
      );

      logger.info('Notification marked as email sent', { notificationId });
    } catch (error: any) {
      logger.error('Failed to mark email as sent', {
        error: error.message,
        notificationId
      });
    }
  }

  /**
   * Send certificate revocation email
   */
  public async sendRevocationEmail(
    exporterId: string,
    certificate: Certificate,
    reason: string
  ): Promise<boolean> {
    try {
      // Get exporter email address
      const exporterResult = await this.pool.query(
        `SELECT email, business_name FROM exporter_profiles WHERE exporter_id = $1`,
        [exporterId]
      );

      if (exporterResult.rows.length === 0) {
        logger.warn('Exporter not found', { exporterId });
        return false;
      }

      const exporter = exporterResult.rows[0];
      const emailAddress = exporter.email;

      if (!emailAddress) {
        logger.warn('Exporter email address not found', { exporterId });
        return false;
      }

      // Check if email transporter is available
      if (!this.emailTransporter) {
        logger.warn('Email transporter not available. Skipping email notification.');
        return false;
      }

      // Get agency name
      const agencyResult = await this.pool.query(
        `SELECT agency_name FROM esw_agencies WHERE agency_code = $1`,
        [certificate.agencyCode]
      );

      const agencyName = agencyResult.rows.length > 0 
        ? agencyResult.rows[0].agency_name 
        : certificate.agencyCode;

      // Prepare email content
      const subject = `Certificate Revoked - ${agencyName}`;
      const htmlContent = this.generateRevocationEmailTemplate({
        exporterName: exporter.business_name || certificate.exporterName,
        agencyName,
        certificateNumber: certificate.certificateNumber,
        eswReferenceNumber: certificate.eswReferenceNumber,
        reason
      });

      // Send email
      await this.emailTransporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@esw.gov.et',
        to: emailAddress,
        subject,
        html: htmlContent
      });

      logger.info('Certificate revocation email sent successfully', {
        exporterId,
        certificateId: certificate.certificateId,
        emailAddress
      });

      return true;
    } catch (error: any) {
      logger.error('Failed to send certificate revocation email', {
        error: error.message,
        exporterId,
        certificateId: certificate.certificateId
      });
      return false;
    }
  }

  /**
   * Create dashboard notification for certificate revocation
   */
  public async createRevocationNotification(
    exporterId: string,
    certificate: Certificate,
    reason: string,
    client?: PoolClient
  ): Promise<NotificationRecord | null> {
    const dbClient = client || this.pool;

    try {
      // Get agency name
      const agencyResult = await dbClient.query(
        `SELECT agency_name FROM esw_agencies WHERE agency_code = $1`,
        [certificate.agencyCode]
      );

      const agencyName = agencyResult.rows.length > 0 
        ? agencyResult.rows[0].agency_name 
        : certificate.agencyCode;

      // Get exporter email for notification record
      const exporterResult = await dbClient.query(
        `SELECT email FROM exporter_profiles WHERE exporter_id = $1`,
        [exporterId]
      );

      const emailAddress = exporterResult.rows.length > 0 
        ? exporterResult.rows[0].email 
        : null;

      // Prepare notification content
      const title = `Certificate Revoked - ${agencyName}`;
      const message = `Your certificate ${certificate.certificateNumber} for ESW submission ${certificate.eswReferenceNumber} has been revoked. Reason: ${reason}`;

      // Create notification record
      const result = await dbClient.query(
        `INSERT INTO esw_certificate_notifications (
          certificate_id, exporter_id, notification_type,
          email_sent, email_address,
          dashboard_notification, acknowledged,
          title, message, download_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          certificate.certificateId,
          exporterId,
          'REVOKED',
          false, // email_sent will be updated separately
          emailAddress,
          true, // dashboard_notification
          false, // acknowledged
          title,
          message,
          null // no download URL for revoked certificates
        ]
      );

      const notification: NotificationRecord = {
        notificationId: result.rows[0].notification_id,
        certificateId: result.rows[0].certificate_id,
        exporterId: result.rows[0].exporter_id,
        notificationType: result.rows[0].notification_type,
        emailSent: result.rows[0].email_sent,
        emailSentAt: result.rows[0].email_sent_at,
        emailAddress: result.rows[0].email_address,
        dashboardNotification: result.rows[0].dashboard_notification,
        acknowledged: result.rows[0].acknowledged,
        acknowledgedAt: result.rows[0].acknowledged_at,
        title: result.rows[0].title,
        message: result.rows[0].message,
        downloadUrl: result.rows[0].download_url,
        createdAt: result.rows[0].created_at
      };

      logger.info('Revocation notification created successfully', {
        notificationId: notification.notificationId,
        exporterId,
        certificateId: certificate.certificateId
      });

      return notification;
    } catch (error: any) {
      logger.error('Failed to create revocation notification', {
        error: error.message,
        exporterId,
        certificateId: certificate.certificateId
      });
      return null;
    }
  }

  /**
   * Generate HTML email template for certificate generation
   */
  private generateCertificateEmailTemplate(data: {
    exporterName: string;
    agencyName: string;
    certificateNumber: string;
    eswReferenceNumber: string;
    downloadUrl: string;
  }): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificate Generated</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #2c5f2d;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
        }
        .content {
            background-color: #f9f9f9;
            padding: 30px;
            border: 1px solid #ddd;
            border-top: none;
        }
        .certificate-info {
            background-color: white;
            padding: 15px;
            margin: 20px 0;
            border-left: 4px solid #2c5f2d;
        }
        .download-button {
            display: inline-block;
            background-color: #2c5f2d;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Certificate Generated</h1>
    </div>
    <div class="content">
        <p>Dear ${data.exporterName},</p>
        
        <p>We are pleased to inform you that your export approval certificate has been generated by <strong>${data.agencyName}</strong>.</p>
        
        <div class="certificate-info">
            <p><strong>Certificate Number:</strong> ${data.certificateNumber}</p>
            <p><strong>ESW Reference:</strong> ${data.eswReferenceNumber}</p>
            <p><strong>Agency:</strong> ${data.agencyName}</p>
        </div>
        
        <p>You can download your certificate using the button below:</p>
        
        <center>
            <a href="${data.downloadUrl}" class="download-button">Download Certificate</a>
        </center>
        
        <p>This certificate is required for customs clearance and shipping. Please keep it safe and provide it to the relevant authorities when requested.</p>
        
        <p>If you have any questions, please contact the ${data.agencyName} or visit your ESW dashboard.</p>
        
        <p>Best regards,<br>
        Ethiopian Electronic Single Window System</p>
    </div>
    <div class="footer">
        <p>This is an automated message. Please do not reply to this email.</p>
    </div>
</body>
</html>
    `;
  }

  /**
   * Generate HTML email template for certificate revocation
   */
  private generateRevocationEmailTemplate(data: {
    exporterName: string;
    agencyName: string;
    certificateNumber: string;
    eswReferenceNumber: string;
    reason: string;
  }): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificate Revoked</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #c41e3a;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
        }
        .content {
            background-color: #f9f9f9;
            padding: 30px;
            border: 1px solid #ddd;
            border-top: none;
        }
        .certificate-info {
            background-color: white;
            padding: 15px;
            margin: 20px 0;
            border-left: 4px solid #c41e3a;
        }
        .warning {
            background-color: #fff3cd;
            border: 1px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Certificate Revoked</h1>
    </div>
    <div class="content">
        <p>Dear ${data.exporterName},</p>
        
        <p>This is to inform you that your export approval certificate has been <strong>REVOKED</strong> by <strong>${data.agencyName}</strong>.</p>
        
        <div class="certificate-info">
            <p><strong>Certificate Number:</strong> ${data.certificateNumber}</p>
            <p><strong>ESW Reference:</strong> ${data.eswReferenceNumber}</p>
            <p><strong>Agency:</strong> ${data.agencyName}</p>
            <p><strong>Revocation Reason:</strong> ${data.reason}</p>
        </div>
        
        <div class="warning">
            <strong>⚠️ Important:</strong> This certificate is no longer valid and cannot be used for customs clearance or shipping. Any attempt to use this certificate may result in legal consequences.
        </div>
        
        <p>If you believe this revocation was made in error or if you need further clarification, please contact the ${data.agencyName} immediately.</p>
        
        <p>You may need to resubmit your export application or take corrective action as advised by the agency.</p>
        
        <p>Best regards,<br>
        Ethiopian Electronic Single Window System</p>
    </div>
    <div class="footer">
        <p>This is an automated message. Please do not reply to this email.</p>
    </div>
</body>
</html>
    `;
  }

  /**
   * Get notifications for an exporter
   */
  public async getNotifications(
    exporterId: string,
    acknowledgedFilter?: boolean
  ): Promise<NotificationRecord[]> {
    try {
      let query = `
        SELECT * FROM esw_certificate_notifications
        WHERE exporter_id = $1
      `;
      const params: any[] = [exporterId];

      if (acknowledgedFilter !== undefined) {
        query += ` AND acknowledged = $2`;
        params.push(acknowledgedFilter);
      }

      query += ` ORDER BY created_at DESC`;

      const result = await this.pool.query(query, params);

      return result.rows.map(row => ({
        notificationId: row.notification_id,
        certificateId: row.certificate_id,
        exporterId: row.exporter_id,
        notificationType: row.notification_type,
        emailSent: row.email_sent,
        emailSentAt: row.email_sent_at,
        emailAddress: row.email_address,
        dashboardNotification: row.dashboard_notification,
        acknowledged: row.acknowledged,
        acknowledgedAt: row.acknowledged_at,
        title: row.title,
        message: row.message,
        downloadUrl: row.download_url,
        createdAt: row.created_at
      }));
    } catch (error: any) {
      logger.error('Failed to get notifications', {
        error: error.message,
        exporterId
      });
      return [];
    }
  }

  /**
   * Acknowledge a notification
   */
  public async acknowledgeNotification(notificationId: string): Promise<boolean> {
    try {
      const result = await this.pool.query(
        `UPDATE esw_certificate_notifications 
         SET acknowledged = true, acknowledged_at = NOW()
         WHERE notification_id = $1
         RETURNING *`,
        [notificationId]
      );

      if (result.rows.length === 0) {
        logger.warn('Notification not found', { notificationId });
        return false;
      }

      logger.info('Notification acknowledged', { notificationId });
      return true;
    } catch (error: any) {
      logger.error('Failed to acknowledge notification', {
        error: error.message,
        notificationId
      });
      return false;
    }
  }
}

export default new NotificationService();
