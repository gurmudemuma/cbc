import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const notificationController = new NotificationController();

// All routes require authentication
router.use(authMiddleware as any);

/**
 * Notification Routes
 * GET    /api/notifications - Get all notifications
 * GET    /api/notifications/unread - Get unread count
 * POST   /api/notifications/:id/read - Mark as read
 * POST   /api/notifications/read-all - Mark all as read
 * DELETE /api/notifications/:id - Delete notification
 * POST   /api/notifications/clear-all - Clear all notifications
 * GET    /api/notifications/preferences - Get preferences
 * PUT    /api/notifications/preferences - Update preferences
 * GET    /api/notifications/statistics - Get statistics
 */

// Get all notifications
router.get('/', notificationController.getNotifications);

// Get unread count
router.get('/unread', notificationController.getUnreadCount);

// Get statistics
router.get('/statistics', notificationController.getStatistics);

// Mark notification as read
router.post('/:notificationId/read', notificationController.markAsRead);

// Mark all as read
router.post('/read-all', notificationController.markAllAsRead);

// Delete notification
router.delete('/:notificationId', notificationController.deleteNotification);

// Clear all notifications
router.post('/clear-all', notificationController.clearAllNotifications);

// Get preferences
router.get('/preferences', notificationController.getPreferences);

// Update preferences
router.put('/preferences', notificationController.updatePreferences);

export default router;
