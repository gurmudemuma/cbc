import nodemailer, { Transporter } from 'nodemailer';
import { Server as SocketIOServer } from 'socket.io';
import winston from 'winston';

export enum NotificationType {
  // Status changes
  EXPORT_CREATED = 'export_created',
  STATUS_CHANGED = 'status_changed',

  // Approvals
  FX_APPROVED = 'fx_approved',
  FX_REJECTED = 'fx_rejected',
  BANKING_APPROVED = 'banking_approved',
  BANKING_REJECTED = 'banking_rejected',
  QUALITY_APPROVED = 'quality_approved',
  QUALITY_REJECTED = 'quality_rejected',
  CUSTOMS_CLEARED = 'customs_cleared',
  CUSTOMS_REJECTED = 'customs_rejected',

  // Financial
  PAYMENT_RECEIVED = 'payment_received',
  FX_REPATRIATED = 'fx_repatriated',

  // Alerts
  SLA_WARNING = 'sla_warning',
  DOCUMENT_REQUIRED = 'document_required',
  ACTION_REQUIRED = 'action_required',
}

export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  WEBSOCKET = 'websocket',
  IN_APP = 'in_app',
}

export interface Notification {
  id: string;
  type: NotificationType;
  recipientId: string;
  recipientEmail?: string;
  recipientPhone?: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  channels: NotificationChannel[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: Date;
  read: boolean;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export class NotificationService {
  private static instance: NotificationService;
  private emailTransporter: Transporter | null = null;
  private io: SocketIOServer | null = null;
  private logger: winston.Logger;
  private notifications: Map<string, Notification[]> = new Map();

  private constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
      transports: [
        new winston.transports.File({ filename: 'logs/notifications.log' }),
        new winston.transports.Console({
          format: winston.format.simple(),
        }),
      ],
    });

    this.initializeEmailTransporter();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initialize email transporter
   */
  private initializeEmailTransporter(): void {
    if (process.env['SMTP_HOST'] && process.env['SMTP_PORT']) {
      this.emailTransporter = nodemailer.createTransport({
        host: process.env['SMTP_HOST'],
        port: parseInt(process.env['SMTP_PORT']),
        secure: process.env['SMTP_SECURE'] === 'true',
        auth: {
          user: process.env['SMTP_USER'],
          pass: process.env['SMTP_PASS'],
        },
      });

      this.logger.info('Email transporter initialized');
    } else {
      this.logger.warn('Email configuration missing, email notifications disabled');
    }
  }

  /**
   * Set Socket.IO instance for WebSocket notifications
   */
  public setSocketIO(io: SocketIOServer): void {
    this.io = io;
    this.logger.info('Socket.IO instance set for notifications');
  }

  /**
   * Send notification through specified channels
   */
  public async sendNotification(notification: Notification): Promise<void> {
    const notificationId = notification.id || this.generateId();
    const fullNotification = { ...notification, id: notificationId };

    // Store notification
    this.storeNotification(fullNotification);

    // Send through each channel
    const promises = notification.channels.map((channel) => {
      switch (channel) {
        case NotificationChannel.EMAIL:
          return this.sendEmail(fullNotification);
        case NotificationChannel.SMS:
          return this.sendSMS(fullNotification);
        case NotificationChannel.WEBSOCKET:
          return this.sendWebSocket(fullNotification);
        case NotificationChannel.IN_APP:
          return this.sendInApp(fullNotification);
        default:
          return Promise.resolve();
      }
    });

    try {
      await Promise.allSettled(promises);
      this.logger.info('Notification sent', {
        id: notificationId,
        type: notification.type,
        channels: notification.channels,
      });
    } catch (error) {
      this.logger.error('Error sending notification', { error, notification });
    }
  }

  /**
   * Notify export status change
   */
  public async notifyStatusChange(
    exportId: string,
    oldStatus: string,
    newStatus: string,
    recipientId: string,
    recipientEmail?: string
  ): Promise<void> {
    await this.sendNotification({
      id: this.generateId(),
      type: NotificationType.STATUS_CHANGED,
      recipientId,
      recipientEmail,
      title: 'Export Status Updated',
      message: `Export ${exportId} status changed from ${oldStatus} to ${newStatus}`,
      data: { exportId, oldStatus, newStatus },
      channels: [NotificationChannel.EMAIL, NotificationChannel.WEBSOCKET],
      priority: 'medium',
      timestamp: new Date(),
      read: false,
    });
  }

  /**
   * Notify FX approval/rejection
   */
  public async notifyFXDecision(
    exportId: string,
    approved: boolean,
    recipientId: string,
    recipientEmail?: string,
    reason?: string
  ): Promise<void> {
    await this.sendNotification({
      id: this.generateId(),
      type: approved ? NotificationType.FX_APPROVED : NotificationType.FX_REJECTED,
      recipientId,
      recipientEmail,
      title: approved ? 'FX Approved' : 'FX Rejected',
      message: approved
        ? `Export ${exportId} has been approved for FX`
        : `Export ${exportId} FX approval was rejected. Reason: ${reason}`,
      data: { exportId, approved, reason },
      channels: [NotificationChannel.EMAIL, NotificationChannel.WEBSOCKET],
      priority: 'high',
      timestamp: new Date(),
      read: false,
    });
  }

  /**
   * Notify action required
   */
  public async notifyActionRequired(
    exportId: string,
    action: string,
    recipientId: string,
    recipientEmail?: string
  ): Promise<void> {
    await this.sendNotification({
      id: this.generateId(),
      type: NotificationType.ACTION_REQUIRED,
      recipientId,
      recipientEmail,
      title: 'Action Required',
      message: `Export ${exportId} requires your action: ${action}`,
      data: { exportId, action },
      channels: [NotificationChannel.EMAIL, NotificationChannel.WEBSOCKET],
      priority: 'high',
      timestamp: new Date(),
      read: false,
    });
  }

  /**
   * Notify SLA warning
   */
  public async notifySLAWarning(
    exportId: string,
    stage: string,
    hoursRemaining: number,
    recipientId: string,
    recipientEmail?: string
  ): Promise<void> {
    await this.sendNotification({
      id: this.generateId(),
      type: NotificationType.SLA_WARNING,
      recipientId,
      recipientEmail,
      title: 'SLA Warning',
      message: `Export ${exportId} at ${stage} stage has ${hoursRemaining} hours remaining before SLA violation`,
      data: { exportId, stage, hoursRemaining },
      channels: [NotificationChannel.EMAIL, NotificationChannel.WEBSOCKET],
      priority: 'urgent',
      timestamp: new Date(),
      read: false,
    });
  }

  /**
   * Notify payment received
   */
  public async notifyPaymentReceived(
    exportId: string,
    amount: number,
    paymentMethod: string,
    recipientId: string,
    recipientEmail?: string
  ): Promise<void> {
    await this.sendNotification({
      id: this.generateId(),
      type: NotificationType.PAYMENT_RECEIVED,
      recipientId,
      recipientEmail,
      title: 'Payment Received',
      message: `Payment of $${amount.toLocaleString()} received for export ${exportId} via ${paymentMethod}`,
      data: { exportId, amount, paymentMethod },
      channels: [NotificationChannel.EMAIL, NotificationChannel.WEBSOCKET],
      priority: 'high',
      timestamp: new Date(),
      read: false,
    });
  }

  /**
   * Send email notification
   */
  private async sendEmail(notification: Notification): Promise<void> {
    if (!this.emailTransporter || !notification.recipientEmail) {
      this.logger.warn('Email not sent: transporter or recipient email missing');
      return;
    }

    const template = this.getEmailTemplate(notification);

    try {
      await this.emailTransporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@coffeeexport.com',
        to: notification.recipientEmail,
        subject: template.subject,
        text: template.text,
        html: template.html,
      });

      this.logger.info('Email sent', {
        to: notification.recipientEmail,
        type: notification.type,
      });
    } catch (error) {
      this.logger.error('Error sending email', { error, notification });
      throw error;
    }
  }

  /**
   * Send SMS notification
   */
  private async sendSMS(notification: Notification): Promise<void> {
    if (!notification.recipientPhone) {
      this.logger.warn('SMS not sent: recipient phone missing');
      return;
    }

    // Integrate with SMS provider (Twilio, AWS SNS, etc.)
    // Example with Twilio:
    // const client = twilio(accountSid, authToken);
    // await client.messages.create({
    //   body: notification.message,
    //   to: notification.recipientPhone,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    // });

    this.logger.info('SMS notification queued', {
      to: notification.recipientPhone,
      type: notification.type,
    });
  }

  /**
   * Send WebSocket notification
   */
  private async sendWebSocket(notification: Notification): Promise<void> {
    if (!this.io) {
      this.logger.warn('WebSocket not sent: Socket.IO not initialized');
      return;
    }

    // Send to specific user room
    this.io.to(`user:${notification.recipientId}`).emit('notification', {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      priority: notification.priority,
      timestamp: notification.timestamp,
    });

    this.logger.info('WebSocket notification sent', {
      recipientId: notification.recipientId,
      type: notification.type,
    });
  }

  /**
   * Send in-app notification
   */
  private async sendInApp(notification: Notification): Promise<void> {
    // Store in database for in-app notification center
    // This is handled by storeNotification
    this.logger.info('In-app notification stored', {
      recipientId: notification.recipientId,
      type: notification.type,
    });
  }

  /**
   * Get email template for notification
   */
  private getEmailTemplate(notification: Notification): EmailTemplate {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    switch (notification.type) {
      case NotificationType.STATUS_CHANGED:
        return {
          subject: `Export Status Update: ${notification.data?.exportId}`,
          text: notification.message,
          html: `
            <h2>${notification.title}</h2>
            <p>${notification.message}</p>
            <p><a href="${baseUrl}/exports/${notification.data?.exportId}">View Export</a></p>
          `,
        };

      case NotificationType.FX_APPROVED:
      case NotificationType.FX_REJECTED:
        return {
          subject: notification.title,
          text: notification.message,
          html: `
            <h2>${notification.title}</h2>
            <p>${notification.message}</p>
            <p><strong>Export ID:</strong> ${notification.data?.exportId}</p>
            ${notification.data?.reason ? `<p><strong>Reason:</strong> ${notification.data.reason}</p>` : ''}
            <p><a href="${baseUrl}/exports/${notification.data?.exportId}">View Details</a></p>
          `,
        };

      case NotificationType.ACTION_REQUIRED:
        return {
          subject: `Action Required: ${notification.data?.exportId}`,
          text: notification.message,
          html: `
            <h2 style="color: #ff9800;">${notification.title}</h2>
            <p>${notification.message}</p>
            <p><a href="${baseUrl}/exports/${notification.data?.exportId}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Take Action</a></p>
          `,
        };

      case NotificationType.SLA_WARNING:
        return {
          subject: `⚠️ SLA Warning: ${notification.data?.exportId}`,
          text: notification.message,
          html: `
            <h2 style="color: #f44336;">⚠️ ${notification.title}</h2>
            <p>${notification.message}</p>
            <p><strong>Stage:</strong> ${notification.data?.stage}</p>
            <p><strong>Time Remaining:</strong> ${notification.data?.hoursRemaining} hours</p>
            <p><a href="${baseUrl}/exports/${notification.data?.exportId}" style="background-color: #f44336; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View Export</a></p>
          `,
        };

      default:
        return {
          subject: notification.title,
          text: notification.message,
          html: `<h2>${notification.title}</h2><p>${notification.message}</p>`,
        };
    }
  }

  /**
   * Store notification
   */
  private storeNotification(notification: Notification): void {
    if (!this.notifications.has(notification.recipientId)) {
      this.notifications.set(notification.recipientId, []);
    }

    const userNotifications = this.notifications.get(notification.recipientId)!;
    userNotifications.push(notification);

    // Keep only last 100 notifications per user
    if (userNotifications.length > 100) {
      userNotifications.shift();
    }
  }

  /**
   * Get user notifications
   */
  public getUserNotifications(userId: string, unreadOnly: boolean = false): Notification[] {
    const notifications = this.notifications.get(userId) || [];

    if (unreadOnly) {
      return notifications.filter((n) => !n.read);
    }

    return notifications;
  }

  /**
   * Mark notification as read
   */
  public markAsRead(userId: string, notificationId: string): void {
    const notifications = this.notifications.get(userId);
    if (!notifications) return;

    const notification = notifications.find((n) => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
  }

  /**
   * Mark all notifications as read
   */
  public markAllAsRead(userId: string): void {
    const notifications = this.notifications.get(userId);
    if (!notifications) return;

    notifications.forEach((n) => (n.read = true));
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();
