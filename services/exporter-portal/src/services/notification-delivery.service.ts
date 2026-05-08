/**
 * Notification Delivery Service
 * Handles notification delivery tracking and retry logic
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '../../../shared/logger';

const logger = createLogger('NotificationDeliveryService');

export interface NotificationDeliveryLog {
  id: string;
  notification_id: string;
  delivery_status: 'PENDING' | 'SENT' | 'DELIVERED' | 'BOUNCED' | 'FAILED';
  delivery_attempts: number;
  sent_at?: Date;
  delivered_at?: Date;
  bounced_at?: Date;
  opened_at?: Date;
  error_message?: string;
  created_at: Date;
  updated_at: Date;
}

export class NotificationDeliveryService {
  private pool: Pool;
  private maxRetries = 3;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Create delivery log entry
   */
  async createDeliveryLog(notificationId: string): Promise<NotificationDeliveryLog> {
    try {
      const id = uuidv4();
      const now = new Date();

      const query = `
        INSERT INTO notification_delivery_log (
          id, notification_id, delivery_status, delivery_attempts, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const values = [id, notificationId, 'PENDING', 0, now, now];

      const result = await this.pool.query(query, values);

      logger.info(`Created delivery log: ${id} for notification ${notificationId}`);

      return this.mapRowToDeliveryLog(result.rows[0]);
    } catch (error) {
      logger.error(`Error creating delivery log for notification ${notificationId}`, { error });
      throw error;
    }
  }

  /**
   * Mark as sent
   */
  async markAsSent(notificationId: string): Promise<NotificationDeliveryLog> {
    try {
      const now = new Date();

      const query = `
        UPDATE notification_delivery_log
        SET delivery_status = $1, sent_at = $2, delivery_attempts = delivery_attempts + 1, updated_at = $3
        WHERE notification_id = $4
        RETURNING *
      `;

      const result = await this.pool.query(query, ['SENT', now, now, notificationId]);

      if (result.rows.length === 0) {
        throw new Error(`Delivery log not found for notification ${notificationId}`);
      }

      logger.info(`Marked as sent: ${notificationId}`);

      return this.mapRowToDeliveryLog(result.rows[0]);
    } catch (error) {
      logger.error(`Error marking notification as sent: ${notificationId}`, { error });
      throw error;
    }
  }

  /**
   * Mark as delivered
   */
  async markAsDelivered(notificationId: string): Promise<NotificationDeliveryLog> {
    try {
      const now = new Date();

      const query = `
        UPDATE notification_delivery_log
        SET delivery_status = $1, delivered_at = $2, updated_at = $3
        WHERE notification_id = $4
        RETURNING *
      `;

      const result = await this.pool.query(query, ['DELIVERED', now, now, notificationId]);

      if (result.rows.length === 0) {
        throw new Error(`Delivery log not found for notification ${notificationId}`);
      }

      logger.info(`Marked as delivered: ${notificationId}`);

      return this.mapRowToDeliveryLog(result.rows[0]);
    } catch (error) {
      logger.error(`Error marking notification as delivered: ${notificationId}`, { error });
      throw error;
    }
  }

  /**
   * Mark as bounced
   */
  async markAsBounced(notificationId: string, errorMessage?: string): Promise<NotificationDeliveryLog> {
    try {
      const now = new Date();

      const query = `
        UPDATE notification_delivery_log
        SET delivery_status = $1, bounced_at = $2, error_message = $3, updated_at = $4
        WHERE notification_id = $5
        RETURNING *
      `;

      const result = await this.pool.query(query, ['BOUNCED', now, errorMessage || null, now, notificationId]);

      if (result.rows.length === 0) {
        throw new Error(`Delivery log not found for notification ${notificationId}`);
      }

      logger.info(`Marked as bounced: ${notificationId}`);

      return this.mapRowToDeliveryLog(result.rows[0]);
    } catch (error) {
      logger.error(`Error marking notification as bounced: ${notificationId}`, { error });
      throw error;
    }
  }

  /**
   * Mark as opened
   */
  async markAsOpened(notificationId: string): Promise<NotificationDeliveryLog> {
    try {
      const now = new Date();

      const query = `
        UPDATE notification_delivery_log
        SET opened_at = $1, updated_at = $2
        WHERE notification_id = $3
        RETURNING *
      `;

      const result = await this.pool.query(query, [now, now, notificationId]);

      if (result.rows.length === 0) {
        throw new Error(`Delivery log not found for notification ${notificationId}`);
      }

      logger.info(`Marked as opened: ${notificationId}`);

      return this.mapRowToDeliveryLog(result.rows[0]);
    } catch (error) {
      logger.error(`Error marking notification as opened: ${notificationId}`, { error });
      throw error;
    }
  }

  /**
   * Mark as failed
   */
  async markAsFailed(notificationId: string, errorMessage: string): Promise<NotificationDeliveryLog> {
    try {
      const now = new Date();

      const query = `
        UPDATE notification_delivery_log
        SET delivery_status = $1, error_message = $2, updated_at = $3
        WHERE notification_id = $4
        RETURNING *
      `;

      const result = await this.pool.query(query, ['FAILED', errorMessage, now, notificationId]);

      if (result.rows.length === 0) {
        throw new Error(`Delivery log not found for notification ${notificationId}`);
      }

      logger.info(`Marked as failed: ${notificationId}`);

      return this.mapRowToDeliveryLog(result.rows[0]);
    } catch (error) {
      logger.error(`Error marking notification as failed: ${notificationId}`, { error });
      throw error;
    }
  }

  /**
   * Get delivery log
   */
  async getDeliveryLog(notificationId: string): Promise<NotificationDeliveryLog | null> {
    try {
      const query = `
        SELECT * FROM notification_delivery_log
        WHERE notification_id = $1
      `;

      const result = await this.pool.query(query, [notificationId]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToDeliveryLog(result.rows[0]);
    } catch (error) {
      logger.error(`Error retrieving delivery log for notification ${notificationId}`, { error });
      throw error;
    }
  }

  /**
   * Get pending deliveries
   */
  async getPendingDeliveries(): Promise<NotificationDeliveryLog[]> {
    try {
      const query = `
        SELECT * FROM notification_delivery_log
        WHERE delivery_status = 'PENDING' OR (delivery_status = 'SENT' AND delivery_attempts < $1)
        ORDER BY created_at ASC
        LIMIT 100
      `;

      const result = await this.pool.query(query, [this.maxRetries]);

      return result.rows.map((row) => this.mapRowToDeliveryLog(row));
    } catch (error) {
      logger.error('Error retrieving pending deliveries', { error });
      throw error;
    }
  }

  /**
   * Get delivery metrics
   */
  async getDeliveryMetrics(): Promise<{
    total: number;
    sent: number;
    delivered: number;
    bounced: number;
    failed: number;
    pending: number;
    deliveryRate: number;
  }> {
    try {
      const query = `
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN delivery_status = 'SENT' THEN 1 ELSE 0 END) as sent,
          SUM(CASE WHEN delivery_status = 'DELIVERED' THEN 1 ELSE 0 END) as delivered,
          SUM(CASE WHEN delivery_status = 'BOUNCED' THEN 1 ELSE 0 END) as bounced,
          SUM(CASE WHEN delivery_status = 'FAILED' THEN 1 ELSE 0 END) as failed,
          SUM(CASE WHEN delivery_status = 'PENDING' THEN 1 ELSE 0 END) as pending
        FROM notification_delivery_log
      `;

      const result = await this.pool.query(query);
      const row = result.rows[0];

      const total = parseInt(row.total, 10);
      const delivered = parseInt(row.delivered || 0, 10);
      const deliveryRate = total > 0 ? (delivered / total) * 100 : 0;

      return {
        total,
        sent: parseInt(row.sent || 0, 10),
        delivered,
        bounced: parseInt(row.bounced || 0, 10),
        failed: parseInt(row.failed || 0, 10),
        pending: parseInt(row.pending || 0, 10),
        deliveryRate: Math.round(deliveryRate * 100) / 100,
      };
    } catch (error) {
      logger.error('Error retrieving delivery metrics', { error });
      throw error;
    }
  }

  /**
   * Map database row to NotificationDeliveryLog
   */
  private mapRowToDeliveryLog(row: any): NotificationDeliveryLog {
    return {
      id: row.id,
      notification_id: row.notification_id,
      delivery_status: row.delivery_status,
      delivery_attempts: row.delivery_attempts,
      sent_at: row.sent_at,
      delivered_at: row.delivered_at,
      bounced_at: row.bounced_at,
      opened_at: row.opened_at,
      error_message: row.error_message,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
