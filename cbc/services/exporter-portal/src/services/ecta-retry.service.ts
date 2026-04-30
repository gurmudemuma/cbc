/**
 * ECTA Retry Service
 * Handles retry logic and fallback for ECTA registration failures
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '../../../shared/logger';
import { ECTAService } from './ecta.service';
import { ContractService } from './contract.service';
import { NotificationService } from './notification.service';

const logger = createLogger('ECTARetryService');

export interface ECTARetryQueueItem {
  id: string;
  draft_id: string;
  blockchain_tx_hash: string;
  attempt: number;
  max_attempts: number;
  next_retry_at: Date;
  error_message: string;
  created_at: Date;
  updated_at: Date;
}

export class ECTARetryService {
  private ectaService: ECTAService;
  private contractService: ContractService;
  private notificationService: NotificationService;
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
    this.ectaService = new ECTAService(pool);
    this.contractService = new ContractService(pool);
    this.notificationService = new NotificationService(pool);
  }

  /**
   * Add failed registration to retry queue
   */
  async addToRetryQueue(
    draftId: string,
    blockchainTxHash: string,
    errorMessage: string,
    maxAttempts: number = 3
  ): Promise<ECTARetryQueueItem> {
    try {
      const id = uuidv4();
      const now = new Date();
      const nextRetryAt = this.calculateNextRetryTime(1);

      const query = `
        INSERT INTO ecta_retry_queue (
          id, draft_id, blockchain_tx_hash, attempt, max_attempts, next_retry_at, error_message, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const values = [id, draftId, blockchainTxHash, 1, maxAttempts, nextRetryAt, errorMessage, now, now];

      const result = await this.pool.query(query, values);
      const item = result.rows[0];

      logger.info(`Added to ECTA retry queue: ${draftId}`, { attempt: 1, nextRetryAt });

      return this.mapRowToRetryQueueItem(item);
    } catch (error) {
      logger.error(`Error adding to ECTA retry queue: ${draftId}`, { error });
      throw error;
    }
  }

  /**
   * Get pending retry items
   */
  async getPendingRetries(): Promise<ECTARetryQueueItem[]> {
    try {
      const query = `
        SELECT * FROM ecta_retry_queue
        WHERE next_retry_at <= NOW() AND attempt < max_attempts
        ORDER BY next_retry_at ASC
        LIMIT 10
      `;

      const result = await this.pool.query(query);
      return result.rows.map((row) => this.mapRowToRetryQueueItem(row));
    } catch (error) {
      logger.error('Error retrieving pending ECTA retries', { error });
      throw error;
    }
  }

  /**
   * Process retry item
   */
  async processRetry(item: ECTARetryQueueItem): Promise<boolean> {
    try {
      logger.info(`Processing ECTA retry: ${item.draft_id}, attempt ${item.attempt}/${item.max_attempts}`);

      // Get contract
      const contract = await this.contractService.getDraftById(item.draft_id);

      if (!contract) {
        logger.warn(`Contract not found for ECTA retry: ${item.draft_id}`);
        await this.removeFromRetryQueue(item.id);
        return false;
      }

      // Attempt ECTA registration
      try {
        const referenceNumber = await this.ectaService.registerContract(contract, item.blockchain_tx_hash);

        logger.info(`ECTA retry successful: ${item.draft_id}, reference: ${referenceNumber}`);

        // Remove from retry queue
        await this.removeFromRetryQueue(item.id);

        return true;
      } catch (error) {
        logger.warn(`ECTA retry failed: ${item.draft_id}, attempt ${item.attempt}`, { error });

        // Check if max attempts reached
        if (item.attempt >= item.max_attempts) {
          logger.error(`Max ECTA retries reached for ${item.draft_id}`, { maxAttempts: item.max_attempts });

          // Generate manual registration link
          const manualRegistrationLink = this.generateManualRegistrationLink(item.draft_id);

          // Send failure notification with manual registration instructions
          await this.notificationService.notifyEctaRegistrationFailed(
            contract,
            (error as Error).message,
            manualRegistrationLink
          );

          // Remove from retry queue
          await this.removeFromRetryQueue(item.id);

          return false;
        }

        // Update retry queue with next attempt
        await this.updateRetryAttempt(item.id, (error as Error).message);

        return false;
      }
    } catch (error) {
      logger.error(`Error processing ECTA retry: ${item.draft_id}`, { error });
      throw error;
    }
  }

  /**
   * Update retry attempt
   */
  async updateRetryAttempt(id: string, errorMessage: string): Promise<void> {
    try {
      const query = `
        SELECT attempt FROM ecta_retry_queue WHERE id = $1
      `;

      const result = await this.pool.query(query, [id]);

      if (result.rows.length === 0) {
        throw new Error(`ECTA retry queue item not found: ${id}`);
      }

      const currentAttempt = result.rows[0].attempt;
      const nextAttempt = currentAttempt + 1;
      const nextRetryAt = this.calculateNextRetryTime(nextAttempt);
      const now = new Date();

      const updateQuery = `
        UPDATE ecta_retry_queue
        SET attempt = $1, next_retry_at = $2, error_message = $3, updated_at = $4
        WHERE id = $5
      `;

      await this.pool.query(updateQuery, [nextAttempt, nextRetryAt, errorMessage, now, id]);

      logger.info(`Updated ECTA retry attempt: ${id}, next attempt: ${nextAttempt}, next retry: ${nextRetryAt}`);
    } catch (error) {
      logger.error(`Error updating ECTA retry attempt: ${id}`, { error });
      throw error;
    }
  }

  /**
   * Remove from retry queue
   */
  async removeFromRetryQueue(id: string): Promise<void> {
    try {
      const query = 'DELETE FROM ecta_retry_queue WHERE id = $1';
      await this.pool.query(query, [id]);

      logger.info(`Removed from ECTA retry queue: ${id}`);
    } catch (error) {
      logger.error(`Error removing from ECTA retry queue: ${id}`, { error });
      throw error;
    }
  }

  /**
   * Get retry queue status
   */
  async getRetryQueueStatus(): Promise<{
    total: number;
    pending: number;
    failed: number;
  }> {
    try {
      const totalQuery = 'SELECT COUNT(*) as count FROM ecta_retry_queue';
      const pendingQuery = `
        SELECT COUNT(*) as count FROM ecta_retry_queue
        WHERE next_retry_at <= NOW() AND attempt < max_attempts
      `;
      const failedQuery = `
        SELECT COUNT(*) as count FROM ecta_retry_queue
        WHERE attempt >= max_attempts
      `;

      const [totalResult, pendingResult, failedResult] = await Promise.all([
        this.pool.query(totalQuery),
        this.pool.query(pendingQuery),
        this.pool.query(failedQuery),
      ]);

      return {
        total: parseInt(totalResult.rows[0].count, 10),
        pending: parseInt(pendingResult.rows[0].count, 10),
        failed: parseInt(failedResult.rows[0].count, 10),
      };
    } catch (error) {
      logger.error('Error getting ECTA retry queue status', { error });
      throw error;
    }
  }

  /**
   * Start retry processor (runs periodically)
   */
  startRetryProcessor(intervalMs: number = 300000): NodeJS.Timer {
    logger.info(`Starting ECTA retry processor with interval ${intervalMs}ms`);

    return setInterval(async () => {
      try {
        const pendingRetries = await this.getPendingRetries();

        if (pendingRetries.length === 0) {
          logger.debug('No pending ECTA retries');
          return;
        }

        logger.info(`Processing ${pendingRetries.length} pending ECTA retries`);

        for (const item of pendingRetries) {
          try {
            await this.processRetry(item);
          } catch (error) {
            logger.error(`Error processing ECTA retry item: ${item.id}`, { error });
          }
        }
      } catch (error) {
        logger.error('Error in ECTA retry processor', { error });
      }
    }, intervalMs);
  }

  /**
   * Generate manual registration link
   */
  private generateManualRegistrationLink(draftId: string): string {
    const baseUrl = process.env.MANUAL_REGISTRATION_URL || 'https://console.ecta.gov.et';
    return `${baseUrl}/manual-register?contract_id=${draftId}`;
  }

  /**
   * Calculate next retry time with exponential backoff
   * Attempt 1: 5 minutes
   * Attempt 2: 15 minutes
   * Attempt 3: 30 minutes
   */
  private calculateNextRetryTime(attempt: number): Date {
    const now = new Date();
    let delayMinutes = 5;

    if (attempt === 2) {
      delayMinutes = 15;
    } else if (attempt === 3) {
      delayMinutes = 30;
    }

    return new Date(now.getTime() + delayMinutes * 60 * 1000);
  }

  /**
   * Map database row to ECTARetryQueueItem
   */
  private mapRowToRetryQueueItem(row: any): ECTARetryQueueItem {
    return {
      id: row.id,
      draft_id: row.draft_id,
      blockchain_tx_hash: row.blockchain_tx_hash,
      attempt: row.attempt,
      max_attempts: row.max_attempts,
      next_retry_at: row.next_retry_at,
      error_message: row.error_message,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
