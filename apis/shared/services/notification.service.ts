/**
 * Notification Service
 * Manages notifications for export status changes, rejections, and approvals
 */

import { EventEmitter } from 'events';
import { logger } from '../logger';

export type NotificationType =
  | 'APPROVED'
  | 'REJECTED'
  | 'PENDING'
  | 'COMPLETED'
  | 'ACTION_REQUIRED'
  | 'INFO';

export interface Notification {
  id: string;
  userId: string;
  exportId: string;
  type: NotificationType;
  title: string;
  message: string;
  actor: string;
  actorRole: string;
  timestamp: string;
  read: boolean;
  actionRequired?: boolean;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: {
    oldStatus?: string;
    newStatus?: string;
    rejectionReason?: string;
    approvalNotes?: string;
  };
}

export interface NotificationPreferences {
  userId: string;
  emailNotifications: boolean;
  inAppNotifications: boolean;
  notifyOnApproval: boolean;
  notifyOnRejection: boolean;
  notifyOnPending: boolean;
  notifyOnCompletion: boolean;
  emailAddress?: string;
}

/**
 * Notification Service - Manages all notifications
 */
export class NotificationService extends EventEmitter {
  private notifications: Map<string, Notification[]> = new Map();
  private preferences: Map<string, NotificationPreferences> = new Map();

  constructor() {
    super();
    this.setupEventListeners();
  }

  /**
   * Setup event listeners for export status changes
   */
  private setupEventListeners(): void {
    // Listen for export status changes
    this.on('exportStatusChanged', (data) => {
      this.handleStatusChange(data);
    });

    // Listen for rejections
    this.on('exportRejected', (data) => {
      this.handleRejection(data);
    });

    // Listen for approvals
    this.on('exportApproved', (data) => {
      this.handleApproval(data);
    });

    // Listen for action required
    this.on('actionRequired', (data) => {
      this.handleActionRequired(data);
    });
  }

  /**
   * Handle export status change
   */
  private handleStatusChange(data: {
    exportId: string;
    userId: string;
    oldStatus: string;
    newStatus: string;
    actor: string;
    actorRole: string;
  }): void {
    const notification: Notification = {
      id: `notif-${Date.now()}-${Math.random()}`,
      userId: data.userId,
      exportId: data.exportId,
      type: 'PENDING',
      title: `Export Status Updated`,
      message: `Your export ${data.exportId} status changed from ${data.oldStatus} to ${data.newStatus}`,
      actor: data.actor,
      actorRole: data.actorRole,
      timestamp: new Date().toISOString(),
      read: false,
      metadata: {
        oldStatus: data.oldStatus,
        newStatus: data.newStatus,
      },
    };

    this.addNotification(notification);
    this.emitNotification(notification);
  }

  /**
   * Handle export rejection
   */
  private handleRejection(data: {
    exportId: string;
    userId: string;
    stage: string;
    reason: string;
    actor: string;
    actorRole: string;
  }): void {
    const notification: Notification = {
      id: `notif-${Date.now()}-${Math.random()}`,
      userId: data.userId,
      exportId: data.exportId,
      type: 'REJECTED',
      title: `Export Rejected at ${data.stage}`,
      message: `Your export ${data.exportId} was rejected at the ${data.stage} stage. Reason: ${data.reason}`,
      actor: data.actor,
      actorRole: data.actorRole,
      timestamp: new Date().toISOString(),
      read: false,
      actionRequired: true,
      actionUrl: `/exports/${data.exportId}/resubmit`,
      actionLabel: 'Review & Resubmit',
      metadata: {
        rejectionReason: data.reason,
      },
    };

    this.addNotification(notification);
    this.emitNotification(notification);
  }

  /**
   * Handle export approval
   */
  private handleApproval(data: {
    exportId: string;
    userId: string;
    stage: string;
    notes?: string;
    actor: string;
    actorRole: string;
  }): void {
    const notification: Notification = {
      id: `notif-${Date.now()}-${Math.random()}`,
      userId: data.userId,
      exportId: data.exportId,
      type: 'APPROVED',
      title: `Export Approved at ${data.stage}`,
      message: `Your export ${data.exportId} was approved at the ${data.stage} stage by ${data.actor}`,
      actor: data.actor,
      actorRole: data.actorRole,
      timestamp: new Date().toISOString(),
      read: false,
      actionUrl: `/exports/${data.exportId}`,
      actionLabel: 'View Export',
      metadata: {
        approvalNotes: data.notes,
      },
    };

    this.addNotification(notification);
    this.emitNotification(notification);
  }

  /**
   * Handle action required notifications
   */
  private handleActionRequired(data: {
    exportId: string;
    userId: string;
    action: string;
    description: string;
    actor: string;
    actorRole: string;
  }): void {
    const notification: Notification = {
      id: `notif-${Date.now()}-${Math.random()}`,
      userId: data.userId,
      exportId: data.exportId,
      type: 'ACTION_REQUIRED',
      title: `Action Required: ${data.action}`,
      message: data.description,
      actor: data.actor,
      actorRole: data.actorRole,
      timestamp: new Date().toISOString(),
      read: false,
      actionRequired: true,
      actionUrl: `/exports/${data.exportId}`,
      actionLabel: 'Take Action',
    };

    this.addNotification(notification);
    this.emitNotification(notification);
  }

  /**
   * Add notification to user's notification list
   */
  private addNotification(notification: Notification): void {
    const userNotifications = this.notifications.get(notification.userId) || [];
    userNotifications.unshift(notification); // Add to beginning
    this.notifications.set(notification.userId, userNotifications);

    logger.info(`📬 Notification created for user ${notification.userId}: ${notification.title}`);
  }

  /**
   * Emit notification event (for real-time updates via WebSocket, etc.)
   */
  private emitNotification(notification: Notification): void {
    this.emit('notificationCreated', notification);
  }

  /**
   * Get all notifications for a user
   */
  public getNotifications(userId: string, limit: number = 50): Notification[] {
    const userNotifications = this.notifications.get(userId) || [];
    return userNotifications.slice(0, limit);
  }

  /**
   * Get unread notifications for a user
   */
  public getUnreadNotifications(userId: string): Notification[] {
    const userNotifications = this.notifications.get(userId) || [];
    return userNotifications.filter((n) => !n.read);
  }

  /**
   * Mark notification as read
   */
  public markAsRead(userId: string, notificationId: string): boolean {
    const userNotifications = this.notifications.get(userId) || [];
    const notification = userNotifications.find((n) => n.id === notificationId);

    if (notification) {
      notification.read = true;
      logger.info(`✓ Notification ${notificationId} marked as read`);
      return true;
    }

    return false;
  }

  /**
   * Mark all notifications as read
   */
  public markAllAsRead(userId: string): number {
    const userNotifications = this.notifications.get(userId) || [];
    let count = 0;

    userNotifications.forEach((n) => {
      if (!n.read) {
        n.read = true;
        count++;
      }
    });

    logger.info(`✓ Marked ${count} notifications as read for user ${userId}`);
    return count;
  }

  /**
   * Delete notification
   */
  public deleteNotification(userId: string, notificationId: string): boolean {
    const userNotifications = this.notifications.get(userId) || [];
    const index = userNotifications.findIndex((n) => n.id === notificationId);

    if (index !== -1) {
      userNotifications.splice(index, 1);
      logger.info(`🗑️ Notification ${notificationId} deleted`);
      return true;
    }

    return false;
  }

  /**
   * Clear all notifications for a user
   */
  public clearAllNotifications(userId: string): number {
    const userNotifications = this.notifications.get(userId) || [];
    const count = userNotifications.length;
    this.notifications.set(userId, []);
    logger.info(`🗑️ Cleared ${count} notifications for user ${userId}`);
    return count;
  }

  /**
   * Get notification preferences for a user
   */
  public getPreferences(userId: string): NotificationPreferences {
    return (
      this.preferences.get(userId) || {
        userId,
        emailNotifications: true,
        inAppNotifications: true,
        notifyOnApproval: true,
        notifyOnRejection: true,
        notifyOnPending: true,
        notifyOnCompletion: true,
      }
    );
  }

  /**
   * Update notification preferences
   */
  public updatePreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): NotificationPreferences {
    const currentPrefs = this.getPreferences(userId);
    const updatedPrefs = { ...currentPrefs, ...preferences, userId };
    this.preferences.set(userId, updatedPrefs);
    logger.info(`⚙️ Notification preferences updated for user ${userId}`);
    return updatedPrefs;
  }

  /**
   * Notify export status change
   */
  public notifyStatusChange(data: {
    exportId: string;
    userId: string;
    oldStatus: string;
    newStatus: string;
    actor: string;
    actorRole: string;
  }): void {
    const prefs = this.getPreferences(data.userId);
    if (prefs.inAppNotifications) {
      this.emit('exportStatusChanged', data);
    }
  }

  /**
   * Notify export rejection
   */
  public notifyRejection(data: {
    exportId: string;
    userId: string;
    stage: string;
    reason: string;
    actor: string;
    actorRole: string;
  }): void {
    const prefs = this.getPreferences(data.userId);
    if (prefs.inAppNotifications && prefs.notifyOnRejection) {
      this.emit('exportRejected', data);
    }
  }

  /**
   * Notify export approval
   */
  public notifyApproval(data: {
    exportId: string;
    userId: string;
    stage: string;
    notes?: string;
    actor: string;
    actorRole: string;
  }): void {
    const prefs = this.getPreferences(data.userId);
    if (prefs.inAppNotifications && prefs.notifyOnApproval) {
      this.emit('exportApproved', data);
    }
  }

  /**
   * Notify action required
   */
  public notifyActionRequired(data: {
    exportId: string;
    userId: string;
    action: string;
    description: string;
    actor: string;
    actorRole: string;
  }): void {
    const prefs = this.getPreferences(data.userId);
    if (prefs.inAppNotifications) {
      this.emit('actionRequired', data);
    }
  }

  /**
   * Get notification statistics for a user
   */
  public getStatistics(userId: string): {
    total: number;
    unread: number;
    byType: { [key in NotificationType]: number };
  } {
    const userNotifications = this.notifications.get(userId) || [];
    const unread = userNotifications.filter((n) => !n.read).length;

    const byType: { [key in NotificationType]: number } = {
      APPROVED: 0,
      REJECTED: 0,
      PENDING: 0,
      COMPLETED: 0,
      ACTION_REQUIRED: 0,
      INFO: 0,
    };

    userNotifications.forEach((n) => {
      byType[n.type]++;
    });

    return {
      total: userNotifications.length,
      unread,
      byType,
    };
  }
}

/**
 * Create singleton instance
 */
export const notificationService = new NotificationService();

export default notificationService;
