import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger';
import { notificationService } from '../services/notification.service';

/**
 * Notification Controller
 * Manages user notifications, preferences, and delivery
 */
export class NotificationController {
  /**
   * Get all notifications for user
   */
  public getNotifications = async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      const limit = parseInt(req.query.limit as string) || 50;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const notifications = notificationService.getNotifications(userId, limit);

      logger.info(`📬 Retrieved ${notifications.length} notifications for user ${userId}`);

      res.status(200).json({
        success: true,
        data: notifications,
        count: notifications.length,
      });
    } catch (error: unknown) {
      logger.error('❌ Error fetching notifications:', error);
      const message = error instanceof Error ? error.message : 'Failed to fetch notifications';

      res.status(500).json({
        success: false,
        message,
        error: message,
      });
    }
  };

  /**
   * Get unread notifications count
   */
  public getUnreadCount = async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const unreadNotifications = notificationService.getUnreadNotifications(userId);

      res.status(200).json({
        success: true,
        count: unreadNotifications.length,
        data: unreadNotifications,
      });
    } catch (error: unknown) {
      logger.error('❌ Error fetching unread count:', error);
      const message = error instanceof Error ? error.message : 'Failed to fetch unread count';

      res.status(500).json({
        success: false,
        message,
        error: message,
      });
    }
  };

  /**
   * Mark notification as read
   */
  public markAsRead = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      const { notificationId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      if (!notificationId) {
        res.status(400).json({
          success: false,
          message: 'Notification ID is required',
        });
        return;
      }

      const success = notificationService.markAsRead(userId, notificationId);

      if (success) {
        res.status(200).json({
          success: true,
          message: 'Notification marked as read',
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Notification not found',
        });
      }
    } catch (error: unknown) {
      logger.error('❌ Error marking notification as read:', error);
      const message =
        error instanceof Error ? error.message : 'Failed to mark notification as read';

      res.status(500).json({
        success: false,
        message,
        error: message,
      });
    }
  };

  /**
   * Mark all notifications as read
   */
  public markAllAsRead = async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const count = notificationService.markAllAsRead(userId);

      res.status(200).json({
        success: true,
        message: `Marked ${count} notifications as read`,
        count,
      });
    } catch (error: unknown) {
      logger.error('❌ Error marking all notifications as read:', error);
      const message =
        error instanceof Error ? error.message : 'Failed to mark all notifications as read';

      res.status(500).json({
        success: false,
        message,
        error: message,
      });
    }
  };

  /**
   * Delete notification
   */
  public deleteNotification = async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      const { notificationId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      if (!notificationId) {
        res.status(400).json({
          success: false,
          message: 'Notification ID is required',
        });
        return;
      }

      const success = notificationService.deleteNotification(userId, notificationId);

      if (success) {
        res.status(200).json({
          success: true,
          message: 'Notification deleted',
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Notification not found',
        });
      }
    } catch (error: unknown) {
      logger.error('❌ Error deleting notification:', error);
      const message = error instanceof Error ? error.message : 'Failed to delete notification';

      res.status(500).json({
        success: false,
        message,
        error: message,
      });
    }
  };

  /**
   * Clear all notifications
   */
  public clearAllNotifications = async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const count = notificationService.clearAllNotifications(userId);

      res.status(200).json({
        success: true,
        message: `Cleared ${count} notifications`,
        count,
      });
    } catch (error: unknown) {
      logger.error('❌ Error clearing notifications:', error);
      const message = error instanceof Error ? error.message : 'Failed to clear notifications';

      res.status(500).json({
        success: false,
        message,
        error: message,
      });
    }
  };

  /**
   * Get notification preferences
   */
  public getPreferences = async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const preferences = notificationService.getPreferences(userId);

      res.status(200).json({
        success: true,
        data: preferences,
      });
    } catch (error: unknown) {
      logger.error('❌ Error fetching preferences:', error);
      const message = error instanceof Error ? error.message : 'Failed to fetch preferences';

      res.status(500).json({
        success: false,
        message,
        error: message,
      });
    }
  };

  /**
   * Update notification preferences
   */
  public updatePreferences = async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      const preferences = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const updatedPreferences = notificationService.updatePreferences(userId, preferences);

      logger.info(`⚙️ Updated notification preferences for user ${userId}`);

      res.status(200).json({
        success: true,
        message: 'Preferences updated successfully',
        data: updatedPreferences,
      });
    } catch (error: unknown) {
      logger.error('❌ Error updating preferences:', error);
      const message = error instanceof Error ? error.message : 'Failed to update preferences';

      res.status(500).json({
        success: false,
        message,
        error: message,
      });
    }
  };

  /**
   * Get notification statistics
   */
  public getStatistics = async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const statistics = notificationService.getStatistics(userId);

      res.status(200).json({
        success: true,
        data: statistics,
      });
    } catch (error: unknown) {
      logger.error('❌ Error fetching statistics:', error);
      const message = error instanceof Error ? error.message : 'Failed to fetch statistics';

      res.status(500).json({
        success: false,
        message,
        error: message,
      });
    }
  };
}
