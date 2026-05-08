/**
 * Database Connection Management for Sales Contract Workflow
 * Provides connection pool configuration and health monitoring
 */

import { Pool } from 'pg';
import { createLogger } from '@shared/logger';
import { getPool, initializePool, closePool, getPoolStats } from '@shared/database/pool';

const logger = createLogger('ContractDatabaseConnection');

/**
 * Contract-specific database configuration
 */
export interface ContractDatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl: boolean;
  poolMin: number;
  poolMax: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
}

/**
 * Get database configuration from environment variables
 */
export function getDatabaseConfig(): ContractDatabaseConfig {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'coffee_export_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: process.env.DB_SSL === 'true',
    poolMin: parseInt(process.env.DB_POOL_MIN || '2', 10),
    poolMax: parseInt(process.env.DB_POOL_MAX || '10', 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
}

/**
 * Get the database connection pool
 * Uses the shared pool from @shared/database/pool
 */
export function getContractPool(): Pool {
  return getPool();
}

/**
 * Initialize the database connection pool
 * Uses the shared pool initialization
 */
export function initializeContractPool(): Pool {
  logger.info('Initializing contract database connection pool');
  const pool = initializePool();
  logger.info('Contract database connection pool initialized');
  return pool;
}

/**
 * Close the database connection pool
 * Uses the shared pool closure
 */
export async function closeContractPool(): Promise<void> {
  logger.info('Closing contract database connection pool');
  await closePool();
  logger.info('Contract database connection pool closed');
}

/**
 * Test database connection
 * Verifies that the database is accessible and responsive
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const pool = getContractPool();
    const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');
    
    if (result.rows.length > 0) {
      logger.info('Database connection test successful', {
        currentTime: result.rows[0].current_time,
        postgresVersion: result.rows[0].pg_version,
      });
      return true;
    }
    
    logger.error('Database connection test failed: no rows returned');
    return false;
  } catch (error) {
    logger.error('Database connection test failed', { error });
    return false;
  }
}

/**
 * Get database connection statistics
 * Useful for monitoring and debugging
 */
export function getDatabaseStats() {
  const stats = getPoolStats();
  
  if (!stats) {
    logger.warn('Database pool not initialized');
    return null;
  }
  
  logger.debug('Database connection statistics', stats);
  return stats;
}

/**
 * Wait for database to be ready
 * Retries connection until successful or max attempts reached
 */
export async function waitForDatabaseReady(
  maxAttempts: number = 10,
  delayMs: number = 1000
): Promise<void> {
  logger.info('Waiting for database to be ready', { maxAttempts, delayMs });
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const isReady = await testDatabaseConnection();
      
      if (isReady) {
        logger.info('Database is ready', { attempt });
        return;
      }
    } catch (error) {
      logger.warn(`Database not ready (attempt ${attempt}/${maxAttempts})`, { error });
    }
    
    if (attempt < maxAttempts) {
      await sleep(delayMs);
    }
  }
  
  throw new Error(`Database did not become ready after ${maxAttempts} attempts`);
}

/**
 * Check database health
 * Returns detailed health information
 */
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  responseTime: number;
  poolStats: any;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    const pool = getContractPool();
    await pool.query('SELECT 1');
    const responseTime = Date.now() - startTime;
    const poolStats = getDatabaseStats();
    
    return {
      healthy: true,
      responseTime,
      poolStats,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error('Database health check failed', { error, responseTime });
    
    return {
      healthy: false,
      responseTime,
      poolStats: getDatabaseStats(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Verify contract tables exist
 * Checks that all required tables are present in the database
 */
export async function verifyContractTables(): Promise<{
  allTablesExist: boolean;
  existingTables: string[];
  missingTables: string[];
}> {
  const requiredTables = [
    'contract_drafts',
    'contract_history',
    'contract_notifications',
    'contract_permissions',
  ];
  
  try {
    const pool = getContractPool();
    const query = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ANY($1)
    `;
    
    const result = await pool.query(query, [requiredTables]);
    const existingTables = result.rows.map((row) => row.table_name);
    const missingTables = requiredTables.filter((table) => !existingTables.includes(table));
    
    const allTablesExist = missingTables.length === 0;
    
    if (allTablesExist) {
      logger.info('All contract tables exist', { tables: existingTables });
    } else {
      logger.warn('Some contract tables are missing', { missingTables });
    }
    
    return {
      allTablesExist,
      existingTables,
      missingTables,
    };
  } catch (error) {
    logger.error('Error verifying contract tables', { error });
    throw error;
  }
}

/**
 * Get database version information
 */
export async function getDatabaseVersion(): Promise<{
  version: string;
  majorVersion: number;
}> {
  try {
    const pool = getContractPool();
    const result = await pool.query('SELECT version()');
    const versionString = result.rows[0].version;
    
    // Extract major version number (e.g., "PostgreSQL 14.5" -> 14)
    const match = versionString.match(/PostgreSQL (\d+)/);
    const majorVersion = match ? parseInt(match[1], 10) : 0;
    
    return {
      version: versionString,
      majorVersion,
    };
  } catch (error) {
    logger.error('Error getting database version', { error });
    throw error;
  }
}

/**
 * Sleep utility function
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Monitor database connection pool
 * Logs pool statistics at regular intervals
 */
export function startPoolMonitoring(intervalMs: number = 60000): NodeJS.Timeout {
  logger.info('Starting database pool monitoring', { intervalMs });
  
  return setInterval(() => {
    const stats = getDatabaseStats();
    
    if (stats) {
      logger.info('Database pool statistics', stats);
      
      // Warn if pool is getting exhausted
      if (stats.totalConnections >= 8) {
        logger.warn('Database pool is nearing capacity', stats);
      }
      
      // Warn if there are waiting requests
      if (stats.waitingRequests > 0) {
        logger.warn('Database pool has waiting requests', stats);
      }
    }
  }, intervalMs);
}

/**
 * Stop database pool monitoring
 */
export function stopPoolMonitoring(monitoringInterval: NodeJS.Timeout): void {
  clearInterval(monitoringInterval);
  logger.info('Database pool monitoring stopped');
}
