/**
 * Reconciliation Service
 * Detects and corrects data inconsistencies between Fabric and CBC
 */

import cron from 'node-cron';
import { logger } from '../utils/logger';
import { FabricClient } from '../clients/fabric-client';
import { CBCClient } from '../clients/cbc-client';
import pool from '../database';

interface Mismatch {
  type: string;
  entityId: string;
  fabricValue: any;
  cbcValue: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class ReconciliationService {
  private static cronJob: cron.ScheduledTask | null = null;

  static async start(): Promise<void> {
    // Run reconciliation daily at 2 AM
    this.cronJob = cron.schedule('0 2 * * *', async () => {
      logger.info('Starting scheduled reconciliation');
      await this.runReconciliation();
    });

    logger.info('Reconciliation Service started (scheduled for 2 AM daily)');
  }

  static async runReconciliation(): Promise<void> {
    try {
      logger.info('Running reconciliation...');
      const startTime = Date.now();

      const mismatches: Mismatch[] = [];

      // Check exporter statuses
      mismatches.push(...await this.reconcileExporterStatuses());

      // Check license validity
      mismatches.push(...await this.reconcileLicenses());

      // Check certificate statuses
      mismatches.push(...await this.reconcileCertificates());

      // Check shipment statuses
      mismatches.push(...await this.reconcileShipments());

      const duration = Date.now() - startTime;
      logger.info(`Reconciliation completed in ${duration}ms. Found ${mismatches.length} mismatches`);

      // Handle mismatches
      await this.handleMismatches(mismatches);

      // Record reconciliation
      await this.recordReconciliation(mismatches.length, duration);
    } catch (error) {
      logger.error('Reconciliation failed:', error);
      throw error;
    }
  }

  private static async reconcileExporterStatuses(): Promise<Mismatch[]> {
    const mismatches: Mismatch[] = [];
    
    try {
      // Get all exporters from CBC
      const cbcExporters = await CBCClient.getAllExporters();

      for (const cbcExporter of cbcExporters) {
        try {
          // Get exporter from Fabric
          const fabricExporter = await FabricClient.getExporter(cbcExporter.exporterId);

          // Compare statuses
          if (fabricExporter.status !== cbcExporter.status) {
            mismatches.push({
              type: 'exporter_status',
              entityId: cbcExporter.exporterId,
              fabricValue: fabricExporter.status,
              cbcValue: cbcExporter.status,
              severity: 'high'
            });
          }
        } catch (error) {
          logger.warn(`Exporter ${cbcExporter.exporterId} not found in Fabric`);
        }
      }
    } catch (error) {
      logger.error('Error reconciling exporter statuses:', error);
    }

    return mismatches;
  }

  private static async reconcileLicenses(): Promise<Mismatch[]> {
    const mismatches: Mismatch[] = [];
    
    try {
      const cbcLicenses = await CBCClient.getAllLicenses();

      for (const cbcLicense of cbcLicenses) {
        try {
          const fabricLicense = await FabricClient.getLicense(cbcLicense.licenseId);

          if (fabricLicense.status !== cbcLicense.status) {
            mismatches.push({
              type: 'license_status',
              entityId: cbcLicense.licenseId,
              fabricValue: fabricLicense.status,
              cbcValue: cbcLicense.status,
              severity: 'critical'
            });
          }

          if (fabricLicense.expiryDate !== cbcLicense.expiryDate) {
            mismatches.push({
              type: 'license_expiry',
              entityId: cbcLicense.licenseId,
              fabricValue: fabricLicense.expiryDate,
              cbcValue: cbcLicense.expiryDate,
              severity: 'medium'
            });
          }
        } catch (error) {
          logger.warn(`License ${cbcLicense.licenseId} not found in Fabric`);
        }
      }
    } catch (error) {
      logger.error('Error reconciling licenses:', error);
    }

    return mismatches;
  }

  private static async reconcileCertificates(): Promise<Mismatch[]> {
    const mismatches: Mismatch[] = [];
    
    try {
      const cbcCertificates = await CBCClient.getAllCertificates();

      for (const cbcCert of cbcCertificates) {
        try {
          const fabricCert = await FabricClient.getCertificate(cbcCert.certificateId);

          if (fabricCert.status !== cbcCert.status) {
            mismatches.push({
              type: 'certificate_status',
              entityId: cbcCert.certificateId,
              fabricValue: fabricCert.status,
              cbcValue: cbcCert.status,
              severity: 'high'
            });
          }
        } catch (error) {
          logger.warn(`Certificate ${cbcCert.certificateId} not found in Fabric`);
        }
      }
    } catch (error) {
      logger.error('Error reconciling certificates:', error);
    }

    return mismatches;
  }

  private static async reconcileShipments(): Promise<Mismatch[]> {
    const mismatches: Mismatch[] = [];
    
    try {
      const cbcShipments = await CBCClient.getAllShipments();

      for (const cbcShipment of cbcShipments) {
        try {
          const fabricShipment = await FabricClient.getShipment(cbcShipment.shipmentId);

          if (fabricShipment.status !== cbcShipment.status) {
            mismatches.push({
              type: 'shipment_status',
              entityId: cbcShipment.shipmentId,
              fabricValue: fabricShipment.status,
              cbcValue: cbcShipment.status,
              severity: 'medium'
            });
          }
        } catch (error) {
          logger.warn(`Shipment ${cbcShipment.shipmentId} not found in Fabric`);
        }
      }
    } catch (error) {
      logger.error('Error reconciling shipments:', error);
    }

    return mismatches;
  }

  private static async handleMismatches(mismatches: Mismatch[]): Promise<void> {
    for (const mismatch of mismatches) {
      try {
        logger.warn(`Mismatch detected: ${mismatch.type} for ${mismatch.entityId}`);
        
        // Apply resolution strategy based on type
        switch (mismatch.type) {
          case 'exporter_status':
          case 'license_status':
          case 'certificate_status':
          case 'shipment_status':
            // Fabric wins for state changes
            await this.resolveFabricWins(mismatch);
            break;
          
          default:
            // Log for manual review
            await this.logForManualReview(mismatch);
        }
      } catch (error) {
        logger.error(`Failed to handle mismatch for ${mismatch.entityId}:`, error);
      }
    }
  }

  private static async resolveFabricWins(mismatch: Mismatch): Promise<void> {
    logger.info(`Resolving mismatch (Fabric wins): ${mismatch.type} for ${mismatch.entityId}`);
    
    // Update CBC to match Fabric
    await CBCClient.updateEntity(mismatch.type, mismatch.entityId, {
      status: mismatch.fabricValue
    });
  }

  private static async logForManualReview(mismatch: Mismatch): Promise<void> {
    await pool.query(
      'INSERT INTO reconciliation_issues (type, entity_id, fabric_value, cbc_value, severity, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [mismatch.type, mismatch.entityId, JSON.stringify(mismatch.fabricValue), JSON.stringify(mismatch.cbcValue), mismatch.severity, new Date()]
    );
  }

  private static async recordReconciliation(mismatchCount: number, duration: number): Promise<void> {
    await pool.query(
      'INSERT INTO reconciliation_log (mismatches_found, duration_ms, run_at) VALUES ($1, $2, $3)',
      [mismatchCount, duration, new Date()]
    );
  }

  static async stop(): Promise<void> {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }
    logger.info('Reconciliation Service stopped');
  }
}
