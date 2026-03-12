/**
 * Data Sync Service
 * Synchronizes CBC data to Hyperledger Fabric
 */

import { logger } from '../utils/logger';
import { KafkaConsumer } from './kafka-consumer';
import { FabricClient } from '../clients/fabric-client';
import { RedisClient } from '../clients/redis-client';
import pool from '../database';

interface SyncStatus {
  lastSyncTime: string;
  pendingSyncs: number;
  failedSyncs: number;
  successfulSyncs: number;
}

export class DataSyncService {
  private static isRunning = false;
  private static syncInterval: NodeJS.Timeout | null = null;

  static async start(): Promise<void> {
    this.isRunning = true;
    
    // Subscribe to CBC events from Kafka
    await KafkaConsumer.subscribe('cbc.exporter.updates', this.handleExporterUpdate.bind(this));
    await KafkaConsumer.subscribe('cbc.license.updates', this.handleLicenseUpdate.bind(this));
    await KafkaConsumer.subscribe('cbc.certificate.issued', this.handleCertificateIssued.bind(this));
    await KafkaConsumer.subscribe('cbc.inspection.completed', this.handleInspectionCompleted.bind(this));
    await KafkaConsumer.subscribe('cbc.approval.granted', this.handleApprovalGranted.bind(this));
    await KafkaConsumer.subscribe('user.status.updated', this.handleUserStatusUpdate.bind(this));

    // Start the Kafka consumer
    await KafkaConsumer.start();

    // Start periodic sync check
    this.syncInterval = setInterval(() => this.checkPendingSyncs(), 60000); // Every minute

    logger.info('Data Sync Service started');
  }

  static async handleExporterUpdate(message: any): Promise<void> {
    try {
      const { exporterId, updates } = message;
      logger.info(`Syncing exporter update to Fabric: ${exporterId}`);

      await FabricClient.updateExporter(exporterId, updates);
      await this.recordSyncSuccess('exporter_update', exporterId);
    } catch (error) {
      logger.error('Failed to sync exporter update:', error);
      await this.recordSyncFailure('exporter_update', message, error);
    }
  }

  static async handleLicenseUpdate(message: any): Promise<void> {
    try {
      const { licenseId, status, updates } = message;
      logger.info(`Syncing license update to Fabric: ${licenseId}`);

      if (status === 'REVOKED') {
        await FabricClient.revokeLicense(licenseId, updates.reason);
      } else {
        await FabricClient.updateLicense(licenseId, updates);
      }
      
      await this.recordSyncSuccess('license_update', licenseId);
    } catch (error) {
      logger.error('Failed to sync license update:', error);
      await this.recordSyncFailure('license_update', message, error);
    }
  }

  static async handleCertificateIssued(message: any): Promise<void> {
    try {
      const { certificateId, certificateType, data } = message;
      logger.info(`Syncing certificate issuance to Fabric: ${certificateId}`);

      await FabricClient.issueCertificate(certificateId, certificateType, data);
      await this.recordSyncSuccess('certificate_issued', certificateId);
    } catch (error) {
      logger.error('Failed to sync certificate issuance:', error);
      await this.recordSyncFailure('certificate_issued', message, error);
    }
  }

  static async handleInspectionCompleted(message: any): Promise<void> {
    try {
      const { certificateId, inspectionData } = message;
      logger.info(`Syncing inspection completion to Fabric: ${certificateId}`);

      await FabricClient.updateCertificateInspection(certificateId, inspectionData);
      await this.recordSyncSuccess('inspection_completed', certificateId);
    } catch (error) {
      logger.error('Failed to sync inspection:', error);
      await this.recordSyncFailure('inspection_completed', message, error);
    }
  }

  static async handleApprovalGranted(message: any): Promise<void> {
    try {
      const { submissionId, agencyName, approvalData } = message;
      logger.info(`Syncing approval to Fabric: ${submissionId} by ${agencyName}`);

      await FabricClient.recordApproval(submissionId, agencyName, approvalData);
      await this.recordSyncSuccess('approval_granted', submissionId);
    } catch (error) {
      logger.error('Failed to sync approval:', error);
      await this.recordSyncFailure('approval_granted', message, error);
    }
  }

  static async handleUserStatusUpdate(message: any): Promise<void> {
    try {
      const { username, status, approvedBy, comments } = message;
      logger.info(`Syncing user status update to Fabric: ${username} -> ${status}`);

      await FabricClient.updateUserStatus(username, { status, approvedBy, comments });
      await this.recordSyncSuccess('user_status_update', username);
    } catch (error) {
      logger.error('Failed to sync user status update:', error);
      await this.recordSyncFailure('user_status_update', message, error);
    }
  }

  static async checkPendingSyncs(): Promise<void> {
    try {
      const failedSyncs = await this.getFailedSyncs();
      
      for (const sync of failedSyncs) {
        if (sync.retryCount < 5) {
          await this.retryFailedSync(sync.id);
        }
      }
    } catch (error) {
      logger.error('Error checking pending syncs:', error);
    }
  }

  static async retryFailedSync(syncId: string): Promise<void> {
    logger.info(`Retrying failed sync: ${syncId}`);
    // Implementation for retry logic
  }

  static async getStatus(): Promise<SyncStatus> {
    const stats = await RedisClient.get('sync:stats');
    return stats || {
      lastSyncTime: new Date().toISOString(),
      pendingSyncs: 0,
      failedSyncs: 0,
      successfulSyncs: 0
    };
  }

  private static async recordSyncSuccess(type: string, entityId: string): Promise<void> {
    await pool.query(
      'INSERT INTO sync_log (sync_type, entity_id, status, synced_at) VALUES ($1, $2, $3, $4)',
      [type, entityId, 'success', new Date()]
    );
  }

  private static async recordSyncFailure(type: string, data: any, error: any): Promise<void> {
    await pool.query(
      'INSERT INTO sync_log (sync_type, entity_id, status, error_message, data, synced_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [type, data.id || 'unknown', 'failed', error.message, JSON.stringify(data), new Date()]
    );
  }

  private static async getFailedSyncs(): Promise<any[]> {
    const result = await pool.query(
      'SELECT * FROM sync_log WHERE status = $1 AND retry_count < 5 ORDER BY synced_at ASC LIMIT 100',
      ['failed']
    );
    return result.rows;
  }

  static async stop(): Promise<void> {
    this.isRunning = false;
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    logger.info('Data Sync Service stopped');
  }
}
