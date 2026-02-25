const nodemailer = require('nodemailer');

class NotificationService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
        console.log('Email notifications disabled - SMTP not configured');
        return;
      }
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      });
      this.initialized = true;
      console.log('Email notification service initialized');
    } catch (error) {
      console.error('Failed to initialize email service:', error.message);
    }
  }

  async sendEmail(to, subject, html) {
    if (!this.initialized) {
      console.log('Email not sent (service not initialized):', subject);
      return { success: false, reason: 'not_configured' };
    }
    try {
      const fromEmail = process.env.SMTP_USER || 'noreply@ecta.gov.et';
      const info = await this.transporter.sendMail({
        from: '"ECTA System" <' + fromEmail + '>',
        to: to,
        subject: subject,
        html: html
      });
      console.log('Email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Failed to send email:', error.message);
      return { success: false, error: error.message };
    }
  }

  async notifyRegistrationSubmitted(user) {
    const subject = 'Registration Submitted - ECTA Coffee Export System';
    const html = '<p>Dear ' + (user.contactPerson || user.companyName) + ',</p><p>Your registration has been submitted successfully.</p>';
    return await this.sendEmail(user.email, subject, html);
  }

  async notifyProfileApproved(user, approvedBy) {
    console.log('Profile approved for ' + user.username + ' by ' + approvedBy);
    return { success: true, reason: 'not_configured' };
  }

  async notifyProfileRejected(user, rejectedBy, reason) {
    console.log('Profile rejected for ' + user.username + ' by ' + rejectedBy + ': ' + reason);
    return { success: true, reason: 'not_configured' };
  }

  async notifyQualificationApproved(user, stage, details) {
    console.log('Qualification approved for ' + user.username + ', stage: ' + stage);
    return { success: true, reason: 'not_configured' };
  }

  async notifyLicenseExpiring(user, daysUntilExpiry, licenseNumber, expiryDate) {
    console.log('License expiring for ' + user.username + ': ' + daysUntilExpiry + ' days');
    return { success: true, reason: 'not_configured' };
  }
}

module.exports = new NotificationService();
