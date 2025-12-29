/**
 * Notification Service - Enterprise-grade notification management
 * Handles toast notifications, notification center, and real-time alerts
 */

import { useSnackbar, VariantType } from 'notistack';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number; // milliseconds, 0 = persistent
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isOpen: boolean;
}

// Notification store (in production, use Redux/Zustand)
let notificationStore: Notification[] = [];
let listeners: ((state: NotificationState) => void)[] = [];

const generateId = () => `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const notifyListeners = () => {
  const state: NotificationState = {
    notifications: notificationStore,
    unreadCount: notificationStore.filter(n => !n.read).length,
    isOpen: notificationStore.length > 0,
  };
  listeners.forEach(listener => listener(state));
};

export const notificationService = {
  /**
   * Show a toast notification
   */
  toast: (
    type: NotificationType,
    title: string,
    message: string,
    options?: {
      duration?: number;
      action?: { label: string; onClick: () => void };
    }
  ) => {
    const notification: Notification = {
      id: generateId(),
      type,
      title,
      message,
      priority: 'medium',
      timestamp: new Date(),
      read: false,
      action: options?.action,
      duration: options?.duration ?? 5000,
    };

    // Add to store
    notificationStore.push(notification);
    notifyListeners();

    // Auto-remove after duration
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        notificationService.remove(notification.id);
      }, notification.duration);
    }

    return notification.id;
  },

  /**
   * Show success notification
   */
  success: (title: string, message: string, options?: any) => {
    return notificationService.toast('success', title, message, options);
  },

  /**
   * Show error notification
   */
  error: (title: string, message: string, options?: any) => {
    return notificationService.toast('error', title, message, {
      ...options,
      duration: options?.duration ?? 7000,
    });
  },

  /**
   * Show warning notification
   */
  warning: (title: string, message: string, options?: any) => {
    return notificationService.toast('warning', title, message, options);
  },

  /**
   * Show info notification
   */
  info: (title: string, message: string, options?: any) => {
    return notificationService.toast('info', title, message, options);
  },

  /**
   * Add persistent notification to center
   */
  addPersistent: (
    type: NotificationType,
    title: string,
    message: string,
    priority: NotificationPriority = 'medium',
    action?: { label: string; onClick: () => void }
  ): string => {
    const notification: Notification = {
      id: generateId(),
      type,
      title,
      message,
      priority,
      timestamp: new Date(),
      read: false,
      action,
      duration: 0, // Persistent
    };

    notificationStore.unshift(notification); // Add to beginning
    notifyListeners();
    return notification.id;
  },

  /**
   * Mark notification as read
   */
  markAsRead: (id: string) => {
    const notification = notificationStore.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      notifyListeners();
    }
  },

  /**
   * Mark all as read
   */
  markAllAsRead: () => {
    notificationStore.forEach(n => (n.read = true));
    notifyListeners();
  },

  /**
   * Remove notification
   */
  remove: (id: string) => {
    notificationStore = notificationStore.filter(n => n.id !== id);
    notifyListeners();
  },

  /**
   * Clear all notifications
   */
  clearAll: () => {
    notificationStore = [];
    notifyListeners();
  },

  /**
   * Get all notifications
   */
  getAll: (): Notification[] => {
    return [...notificationStore];
  },

  /**
   * Get unread count
   */
  getUnreadCount: (): number => {
    return notificationStore.filter(n => !n.read).length;
  },

  /**
   * Subscribe to notification changes
   */
  subscribe: (listener: (state: NotificationState) => void) => {
    listeners.push(listener);
    // Return unsubscribe function
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  },

  /**
   * Get current state
   */
  getState: (): NotificationState => {
    return {
      notifications: notificationStore,
      unreadCount: notificationStore.filter(n => !n.read).length,
      isOpen: notificationStore.length > 0,
    };
  },
};

export default notificationService;
