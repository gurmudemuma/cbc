import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware as authenticate } from '../../../shared/middleware/auth.middleware';

interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    organizationId: string;
    role: string;
  };
}

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================================================
// NOTIFICATION ENDPOINTS
// ============================================================================

// Get all notifications for the user
router.get('/', async (req: AuthRequest, res: Response, _next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    // Get notifications from database
    const { Pool } = await import('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    const result = await pool.query(
      `SELECT id, user_id, type, title, message, data, read, created_at 
       FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [userId]
    );
    
    await pool.end();
    
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message,
    });
  }
});

// Get unread notification count
router.get('/unread', async (req: AuthRequest, res: Response, _next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const { Pool } = await import('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND read = false',
      [userId]
    );
    
    await pool.end();

    res.json({
      success: true,
      count: parseInt(result.rows[0].count),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count',
      error: error.message,
    });
  }
});

// Mark notification as read
router.post(
  '/:notificationId/read',
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const { notificationId } = req.params;
      
      const { Pool } = await import('pg');
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      
      await pool.query(
        'UPDATE notifications SET read = true, read_at = NOW() WHERE id = $1 AND user_id = $2',
        [notificationId, userId]
      );
      
      await pool.end();

      res.json({
        success: true,
        message: `Notification ${notificationId} marked as read`,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to mark notification as read',
        error: error.message,
      });
    }
  }
);

// Mark all notifications as read
router.post('/read-all', async (req: AuthRequest, res: Response, _next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const { Pool } = await import('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    await pool.query(
      'UPDATE notifications SET read = true, read_at = NOW() WHERE user_id = $1 AND read = false',
      [userId]
    );
    
    await pool.end();

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message,
    });
  }
});

// Delete a notification
router.delete('/:notificationId', async (req: AuthRequest, res: Response, _next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const { notificationId } = req.params;
    
    const { Pool } = await import('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    await pool.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
      [notificationId, userId]
    );
    
    await pool.end();

    res.json({
      success: true,
      message: `Notification ${notificationId} deleted`,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message,
    });
  }
});

// Clear all notifications
router.post('/clear-all', async (req: AuthRequest, res: Response, _next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const { Pool } = await import('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    await pool.query('DELETE FROM notifications WHERE user_id = $1', [userId]);
    
    await pool.end();

    res.json({
      success: true,
      message: 'All notifications cleared',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to clear notifications',
      error: error.message,
    });
  }
});

// Get notification preferences
router.get('/preferences', async (req: AuthRequest, res: Response, _next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const { Pool } = await import('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    const result = await pool.query(
      'SELECT * FROM notification_preferences WHERE user_id = $1',
      [userId]
    );
    
    await pool.end();
    
    const preferences = result.rows[0] || {
      email_notifications: true,
      in_app_notifications: true,
      notify_on_approval: true,
      notify_on_rejection: true,
      notify_on_update: true,
    };

    res.json({
      success: true,
      data: {
        emailNotifications: preferences.email_notifications,
        inAppNotifications: preferences.in_app_notifications,
        notifyOnApproval: preferences.notify_on_approval,
        notifyOnRejection: preferences.notify_on_rejection,
        notifyOnUpdate: preferences.notify_on_update,
        emailAddress: req.user?.username || 'user@example.com',
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification preferences',
      error: error.message,
    });
  }
});

// Update notification preferences
router.put('/preferences', async (req: AuthRequest, res: Response, _next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const preferences = req.body;
    
    const { Pool } = await import('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    await pool.query(
      `INSERT INTO notification_preferences 
       (user_id, email_notifications, in_app_notifications, notify_on_approval, notify_on_rejection, notify_on_update)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id) DO UPDATE SET
       email_notifications = $2,
       in_app_notifications = $3,
       notify_on_approval = $4,
       notify_on_rejection = $5,
       notify_on_update = $6,
       updated_at = NOW()`,
      [
        userId,
        preferences.emailNotifications,
        preferences.inAppNotifications,
        preferences.notifyOnApproval,
        preferences.notifyOnRejection,
        preferences.notifyOnUpdate,
      ]
    );
    
    await pool.end();

    res.json({
      success: true,
      message: 'Notification preferences updated',
      data: preferences,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update notification preferences',
      error: error.message,
    });
  }
});

export default router;
