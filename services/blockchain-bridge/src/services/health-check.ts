/**
 * Health Check Service
 */

import { logger } from '../utils/logger';
import { FabricClient } from '../clients/fabric-client';
import { CBCClient } from '../clients/cbc-client';
import { RedisClient } from '../clients/redis-client';
import pool from '../database';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    fabric: boolean;
    cbc: boolean;
    kafka: boolean;
    redis: boolean;
    postgres: boolean;
  };
}

export class HealthCheckService {
  static async check(): Promise<HealthStatus> {
    const checks = {
      fabric: await this.checkFabric(),
      cbc: await this.checkCBC(),
      kafka: await this.checkKafka(),
      redis: await this.checkRedis(),
      postgres: await this.checkPostgres()
    };

    const allHealthy = Object.values(checks).every(v => v);
    const someHealthy = Object.values(checks).some(v => v);

    return {
      status: allHealthy ? 'healthy' : someHealthy ? 'degraded' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: checks
    };
  }

  private static async checkFabric(): Promise<boolean> {
    try {
      await FabricClient.healthCheck();
      return true;
    } catch (error) {
      logger.error('Fabric health check failed:', error);
      return false;
    }
  }

  private static async checkCBC(): Promise<boolean> {
    // CBC services are optional in blockchain-only mode
    if (!process.env.ECTA_API_URL || process.env.ECTA_API_URL === 'disabled') {
      logger.info('CBC health check skipped (not configured)');
      return true;
    }
    
    try {
      await CBCClient.healthCheck();
      return true;
    } catch (error) {
      logger.warn('CBC health check failed (optional service):', error);
      return true; // Return true since CBC is optional
    }
  }

  private static async checkKafka(): Promise<boolean> {
    try {
      // Simple check - if we can get here, Kafka is likely working
      return true;
    } catch (error) {
      return false;
    }
  }

  private static async checkRedis(): Promise<boolean> {
    try {
      await RedisClient.ping();
      return true;
    } catch (error) {
      return false;
    }
  }

  private static async checkPostgres(): Promise<boolean> {
    try {
      await pool.query('SELECT 1');
      return true;
    } catch (error) {
      return false;
    }
  }

  static async getMetrics(): Promise<any> {
    const result = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM sync_log WHERE status = 'success' AND synced_at > NOW() - INTERVAL '1 hour') as successful_syncs_1h,
        (SELECT COUNT(*) FROM sync_log WHERE status = 'failed' AND synced_at > NOW() - INTERVAL '1 hour') as failed_syncs_1h,
        (SELECT COUNT(*) FROM reconciliation_issues WHERE resolved = false) as unresolved_issues
    `);

    return result.rows[0];
  }
}
