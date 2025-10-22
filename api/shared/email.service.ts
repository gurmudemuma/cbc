import nodemailer, { Transporter } from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private transporter: Transporter;
  private from: string;

  constructor() {
    const config: EmailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
      }
    };

    this.from = process.env.SMTP_FROM || 'noreply@coffeeexport.com';

    // Create transporter
    this.transporter = nodemailer.createTransport(config);

    // Verify connection
    this.verifyConnection();
  }

  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      console.log('Email service is ready to send messages');
    } catch (error) {
      console.error('Email service connection error:', error);
    }
  }

  private async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html)
      });

      console.log('Email sent successfully:', info.messageId);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }

  private getEmailTemplate(title: string, content: string, actionUrl?: string, actionText?: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
            color: #000;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            padding: 30px;
          }
          .content h2 {
            color: #FFD700;
            margin-top: 0;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background: #FFD700;
            color: #000;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
          }
          .footer {
            background: #f8f8f8;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
          .info-box {
            background: #f8f8f8;
            border-left: 4px solid #FFD700;
            padding: 15px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>☕ Coffee Export Consortium</h1>
          </div>
          <div class="content">
            <h2>${title}</h2>
            ${content}
            ${actionUrl && actionText ? `
              <div style="text-align: center;">
                <a href="${actionUrl}" class="button">${actionText}</a>
              </div>
            ` : ''}
          </div>
          <div class="footer">
            <p>This is an automated message from the Coffee Export Consortium Blockchain System.</p>
            <p>Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} Coffee Export Consortium. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Export Created Notification
  public async sendExportCreatedNotification(email: string, exportData: any): Promise<boolean> {
    const content = `
      <p>A new export request has been created successfully.</p>
      <div class="info-box">
        <p><strong>Export ID:</strong> ${exportData.exportID}</p>
        <p><strong>Exporter:</strong> ${exportData.exporterName}</p>
        <p><strong>Coffee Type:</strong> ${exportData.coffeeType}</p>
        <p><strong>Quantity:</strong> ${exportData.quantity} kg</p>
        <p><strong>Destination:</strong> ${exportData.destinationCountry}</p>
        <p><strong>Estimated Value:</strong> $${exportData.estimatedValue.toLocaleString()}</p>
        <p><strong>Status:</strong> ${exportData.status}</p>
      </div>
      <p>The export request is now pending approval from the National Bank.</p>
    `;

    return this.sendEmail({
      to: email,
      subject: `Export Request Created - ${exportData.exportID}`,
      html: this.getEmailTemplate(
        'Export Request Created',
        content,
        `${process.env.FRONTEND_URL}/exports/${exportData.exportID}`,
        'View Export Details'
      )
    });
  }

  // FX Approved Notification
  public async sendFXApprovedNotification(email: string, exportData: any): Promise<boolean> {
    const content = `
      <p>Great news! The foreign exchange (FX) for your export has been approved.</p>
      <div class="info-box">
        <p><strong>Export ID:</strong> ${exportData.exportID}</p>
        <p><strong>Approval ID:</strong> ${exportData.fxApprovalID}</p>
        <p><strong>Approved By:</strong> ${exportData.fxApprovedBy}</p>
        <p><strong>Approved At:</strong> ${new Date(exportData.fxApprovedAt).toLocaleString()}</p>
      </div>
      <p>Your export is now ready for quality certification by NCAT.</p>
    `;

    return this.sendEmail({
      to: email,
      subject: `FX Approved - ${exportData.exportID}`,
      html: this.getEmailTemplate(
        'FX Approval Granted',
        content,
        `${process.env.FRONTEND_URL}/exports/${exportData.exportID}`,
        'View Export Details'
      )
    });
  }

  // FX Rejected Notification
  public async sendFXRejectedNotification(email: string, exportData: any): Promise<boolean> {
    const content = `
      <p>Unfortunately, the foreign exchange (FX) request for your export has been rejected.</p>
      <div class="info-box">
        <p><strong>Export ID:</strong> ${exportData.exportID}</p>
        <p><strong>Rejection Reason:</strong> ${exportData.fxRejectionReason}</p>
        <p><strong>Status:</strong> ${exportData.status}</p>
      </div>
      <p>Please review the rejection reason and contact the National Bank for more information.</p>
    `;

    return this.sendEmail({
      to: email,
      subject: `FX Rejected - ${exportData.exportID}`,
      html: this.getEmailTemplate(
        'FX Request Rejected',
        content,
        `${process.env.FRONTEND_URL}/exports/${exportData.exportID}`,
        'View Export Details'
      )
    });
  }

  // Quality Certified Notification
  public async sendQualityCertifiedNotification(email: string, exportData: any): Promise<boolean> {
    const content = `
      <p>Excellent! Your coffee export has been quality certified by NCAT.</p>
      <div class="info-box">
        <p><strong>Export ID:</strong> ${exportData.exportID}</p>
        <p><strong>Certificate ID:</strong> ${exportData.qualityCertID}</p>
        <p><strong>Quality Grade:</strong> ${exportData.qualityGrade}</p>
        <p><strong>Certified By:</strong> ${exportData.qualityCertifiedBy}</p>
        <p><strong>Certified At:</strong> ${new Date(exportData.qualityCertifiedAt).toLocaleString()}</p>
      </div>
      <p>Your export is now ready for shipment scheduling.</p>
    `;

    return this.sendEmail({
      to: email,
      subject: `Quality Certified - ${exportData.exportID}`,
      html: this.getEmailTemplate(
        'Quality Certification Issued',
        content,
        `${process.env.FRONTEND_URL}/exports/${exportData.exportID}`,
        'View Export Details'
      )
    });
  }

  // Quality Rejected Notification
  public async sendQualityRejectedNotification(email: string, exportData: any): Promise<boolean> {
    const content = `
      <p>Unfortunately, your coffee export has failed quality certification.</p>
      <div class="info-box">
        <p><strong>Export ID:</strong> ${exportData.exportID}</p>
        <p><strong>Rejection Reason:</strong> ${exportData.qualityRejectionReason}</p>
        <p><strong>Status:</strong> ${exportData.status}</p>
      </div>
      <p>Please review the rejection reason and contact NCAT for more information.</p>
    `;

    return this.sendEmail({
      to: email,
      subject: `Quality Certification Failed - ${exportData.exportID}`,
      html: this.getEmailTemplate(
        'Quality Certification Rejected',
        content,
        `${process.env.FRONTEND_URL}/exports/${exportData.exportID}`,
        'View Export Details'
      )
    });
  }

  // Shipment Scheduled Notification
  public async sendShipmentScheduledNotification(email: string, exportData: any): Promise<boolean> {
    const content = `
      <p>Your export shipment has been scheduled!</p>
      <div class="info-box">
        <p><strong>Export ID:</strong> ${exportData.exportID}</p>
        <p><strong>Shipment ID:</strong> ${exportData.shipmentID}</p>
        <p><strong>Vessel Name:</strong> ${exportData.vesselName}</p>
        <p><strong>Departure Date:</strong> ${new Date(exportData.departureDate).toLocaleDateString()}</p>
        <p><strong>Expected Arrival:</strong> ${new Date(exportData.arrivalDate).toLocaleDateString()}</p>
        <p><strong>Shipping Line:</strong> ${exportData.shippingLineID}</p>
      </div>
      <p>Your export is scheduled for departure. You will be notified when the shipment is confirmed.</p>
    `;

    return this.sendEmail({
      to: email,
      subject: `Shipment Scheduled - ${exportData.exportID}`,
      html: this.getEmailTemplate(
        'Shipment Scheduled',
        content,
        `${process.env.FRONTEND_URL}/exports/${exportData.exportID}`,
        'Track Shipment'
      )
    });
  }

  // Shipment Confirmed Notification
  public async sendShipmentConfirmedNotification(email: string, exportData: any): Promise<boolean> {
    const content = `
      <p>Your export has been shipped!</p>
      <div class="info-box">
        <p><strong>Export ID:</strong> ${exportData.exportID}</p>
        <p><strong>Shipment ID:</strong> ${exportData.shipmentID}</p>
        <p><strong>Vessel Name:</strong> ${exportData.vesselName}</p>
        <p><strong>Shipped At:</strong> ${new Date(exportData.shippedAt).toLocaleString()}</p>
        <p><strong>Expected Arrival:</strong> ${new Date(exportData.arrivalDate).toLocaleDateString()}</p>
      </div>
      <p>Your coffee is now on its way to ${exportData.destinationCountry}!</p>
    `;

    return this.sendEmail({
      to: email,
      subject: `Shipment Confirmed - ${exportData.exportID}`,
      html: this.getEmailTemplate(
        'Shipment Confirmed',
        content,
        `${process.env.FRONTEND_URL}/exports/${exportData.exportID}`,
        'Track Shipment'
      )
    });
  }

  // Export Completed Notification
  public async sendExportCompletedNotification(email: string, exportData: any): Promise<boolean> {
    const content = `
      <p>Congratulations! Your export has been completed successfully.</p>
      <div class="info-box">
        <p><strong>Export ID:</strong> ${exportData.exportID}</p>
        <p><strong>Exporter:</strong> ${exportData.exporterName}</p>
        <p><strong>Coffee Type:</strong> ${exportData.coffeeType}</p>
        <p><strong>Quantity:</strong> ${exportData.quantity} kg</p>
        <p><strong>Destination:</strong> ${exportData.destinationCountry}</p>
        <p><strong>Final Value:</strong> $${exportData.estimatedValue.toLocaleString()}</p>
        <p><strong>Completed At:</strong> ${new Date(exportData.updatedAt).toLocaleString()}</p>
      </div>
      <p>Thank you for using the Coffee Export Consortium Blockchain System.</p>
    `;

    return this.sendEmail({
      to: email,
      subject: `Export Completed - ${exportData.exportID}`,
      html: this.getEmailTemplate(
        'Export Completed Successfully',
        content,
        `${process.env.FRONTEND_URL}/exports/${exportData.exportID}`,
        'View Final Report'
      )
    });
  }

  // Export Cancelled Notification
  public async sendExportCancelledNotification(email: string, exportData: any): Promise<boolean> {
    const content = `
      <p>Your export request has been cancelled.</p>
      <div class="info-box">
        <p><strong>Export ID:</strong> ${exportData.exportID}</p>
        <p><strong>Exporter:</strong> ${exportData.exporterName}</p>
        <p><strong>Status:</strong> ${exportData.status}</p>
        <p><strong>Cancelled At:</strong> ${new Date(exportData.updatedAt).toLocaleString()}</p>
      </div>
      <p>If you have any questions, please contact support.</p>
    `;

    return this.sendEmail({
      to: email,
      subject: `Export Cancelled - ${exportData.exportID}`,
      html: this.getEmailTemplate(
        'Export Cancelled',
        content,
        `${process.env.FRONTEND_URL}/exports`,
        'View All Exports'
      )
    });
  }

  // Pending Action Reminder
  public async sendPendingActionReminder(email: string, exportData: any, action: string): Promise<boolean> {
    const content = `
      <p>This is a reminder that an export requires your attention.</p>
      <div class="info-box">
        <p><strong>Export ID:</strong> ${exportData.exportID}</p>
        <p><strong>Exporter:</strong> ${exportData.exporterName}</p>
        <p><strong>Current Status:</strong> ${exportData.status}</p>
        <p><strong>Required Action:</strong> ${action}</p>
      </div>
      <p>Please take action at your earliest convenience.</p>
    `;

    return this.sendEmail({
      to: email,
      subject: `Action Required - ${exportData.exportID}`,
      html: this.getEmailTemplate(
        'Pending Action Reminder',
        content,
        `${process.env.FRONTEND_URL}/exports/${exportData.exportID}`,
        'Take Action'
      )
    });
  }

  // Welcome Email
  public async sendWelcomeEmail(email: string, username: string, organization: string): Promise<boolean> {
    const content = `
      <p>Welcome to the Coffee Export Consortium Blockchain System!</p>
      <p>Your account has been successfully created.</p>
      <div class="info-box">
        <p><strong>Username:</strong> ${username}</p>
        <p><strong>Organization:</strong> ${organization}</p>
        <p><strong>Email:</strong> ${email}</p>
      </div>
      <p>You can now log in and start managing your coffee exports on our secure blockchain platform.</p>
      <p>If you have any questions, please don't hesitate to contact our support team.</p>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Welcome to Coffee Export Consortium',
      html: this.getEmailTemplate(
        'Welcome Aboard!',
        content,
        `${process.env.FRONTEND_URL}/login`,
        'Login Now'
      )
    });
  }

  // Password Reset Email
  public async sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const content = `
      <p>You have requested to reset your password.</p>
      <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
      <div class="info-box">
        <p><strong>Important:</strong> If you did not request this password reset, please ignore this email and your password will remain unchanged.</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Password Reset Request',
      html: this.getEmailTemplate(
        'Reset Your Password',
        content,
        resetUrl,
        'Reset Password'
      )
    });
  }
}

// Singleton instance
let emailService: EmailService | null = null;

export const getEmailService = (): EmailService => {
  if (!emailService) {
    emailService = new EmailService();
  }
  return emailService;
};
