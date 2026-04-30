/**
 * Database Transaction Management
 * Provides transaction wrapper and utility functions for multi-step operations
 */

import { Pool } from 'pg';
import type { PoolClient } from 'pg';
import { createLogger } from '../logger';

const logger = createLogger('DatabaseTransaction');

/**
 * Transaction context for managing database operations
 */
export interface TransactionContext {
  client: PoolClient;
  isActive: boolean;
  startTime: number;
}

/**
 * Retry configuration for failed operations
 */
export interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 100,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
};

/**
 * Execute a function within a database transaction
 * Automatically handles commit/rollback
 * 
 * @param pool - Database connection pool
 * @param callback - Function to execute within transaction
 * @param options - Transaction options
 * @returns Result of the callback function
 */
export async function withTransaction<T>(
  pool: Pool,
  callback: (client: PoolClient) => Promise<T>,
  options?: {
    isolationLevel?: 'READ UNCOMMITTED' | 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE';
    timeout?: number;
  }
): Promise<T> {
  const client = await pool.connect();
  const startTime = Date.now();
  const isolationLevel = options?.isolationLevel || 'READ COMMITTED';

  try {
    logger.debug('Starting transaction', { isolationLevel });

    // Begin transaction with specified isolation level
    await client.query(`BEGIN ISOLATION LEVEL ${isolationLevel}`);

    // Execute the callback
    const result = await callback(client);

    // Commit the transaction
    await client.query('COMMIT');

    const duration = Date.now() - startTime;
    logger.debug('Transaction committed successfully', { duration });

    return result;
  } catch (error) {
    try {
      // Rollback on error
      await client.query('ROLLBACK');
      logger.debug('Transaction rolled back due to error');
    } catch (rollbackError) {
      logger.error('Error during rollback', { error: rollbackError });
    }

    const duration = Date.now() - startTime;
    logger.error('Transaction failed', { error, duration });
    throw error;
  } finally {
    // Release the client back to the pool
    client.release();
  }
}

/**
 * Execute a function with automatic retry on failure
 * Uses exponential backoff strategy
 * 
 * @param callback - Function to execute
 * @param config - Retry configuration
 * @returns Result of the callback function
 */
export async function withRetry<T>(
  callback: () => Promise<T>,
  config?: Partial<RetryConfig>
): Promise<T> {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error | null = null;
  let delay = retryConfig.initialDelayMs;

  for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
    try {
      logger.debug(`Attempt ${attempt}/${retryConfig.maxAttempts}`);
      return await callback();
    } catch (error) {
      lastError = error as Error;

      if (attempt < retryConfig.maxAttempts) {
        logger.warn(`Attempt ${attempt} failed, retrying in ${delay}ms`, {
          error: lastError.message,
        });

        // Wait before retrying
        await sleep(delay);

        // Calculate next delay with exponential backoff
        delay = Math.min(
          delay * retryConfig.backoffMultiplier,
          retryConfig.maxDelayMs
        );
      } else {
        logger.error(`All ${retryConfig.maxAttempts} attempts failed`, {
          error: lastError.message,
        });
      }
    }
  }

  throw lastError;
}

/**
 * Execute a function within a transaction with automatic retry
 * Combines transaction and retry logic
 * 
 * @param pool - Database connection pool
 * @param callback - Function to execute within transaction
 * @param options - Transaction and retry options
 * @returns Result of the callback function
 */
export async function withTransactionAndRetry<T>(
  pool: Pool,
  callback: (client: PoolClient) => Promise<T>,
  options?: {
    isolationLevel?: 'READ UNCOMMITTED' | 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE';
    timeout?: number;
    retryConfig?: Partial<RetryConfig>;
  }
): Promise<T> {
  return withRetry(
    () => withTransaction(pool, callback, { isolationLevel: options?.isolationLevel }),
    options?.retryConfig
  );
}

/**
 * Sleep for specified milliseconds
 * Utility function for delays
 * 
 * @param ms - Milliseconds to sleep
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute multiple queries in a single transaction
 * Useful for batch operations
 * 
 * @param pool - Database connection pool
 * @param queries - Array of query objects with text and values
 * @returns Array of query results
 */
export async function executeBatchQueries(
  pool: Pool,
  queries: Array<{ text: string; values?: any[] }>
): Promise<any[]> {
  return withTransaction(pool, async (client) => {
    const results = [];

    for (const query of queries) {
      const result = await client.query(query.text, query.values);
      results.push(result);
    }

    return results;
  });
}

/**
 * Execute a query with connection error handling and retry
 * 
 * @param pool - Database connection pool
 * @param text - SQL query text
 * @param values - Query parameters
 * @returns Query result
 */
export async function executeQueryWithRetry(
  pool: Pool,
  text: string,
  values?: any[]
): Promise<any> {
  return withRetry(
    () => pool.query(text, values),
    {
      maxAttempts: 3,
      initialDelayMs: 100,
      maxDelayMs: 2000,
    }
  );
}

/**
 * Get connection pool statistics
 * Useful for monitoring and debugging
 * 
 * @param pool - Database connection pool
 * @returns Pool statistics
 */
export function getPoolStats(pool: Pool): {
  totalConnections: number;
  idleConnections: number;
  waitingRequests: number;
} {
  return {
    totalConnections: (pool as any).totalCount || 0,
    idleConnections: (pool as any).idleCount || 0,
    waitingRequests: (pool as any).waitingCount || 0,
  };
}

/**
 * Check database connection health
 * 
 * @param pool - Database connection pool
 * @returns true if connection is healthy, false otherwise
 */
export async function checkDatabaseHealth(pool: Pool): Promise<boolean> {
  try {
    const result = await pool.query('SELECT 1');
    return result.rows.length > 0;
  } catch (error) {
    logger.error('Database health check failed', { error });
    return false;
  }
}

/**
 * Wait for database to be ready
 * Useful during application startup
 * 
 * @param pool - Database connection pool
 * @param maxAttempts - Maximum number of attempts
 * @param delayMs - Delay between attempts in milliseconds
 */
export async function waitForDatabase(
  pool: Pool,
  maxAttempts: number = 10,
  delayMs: number = 1000
): Promise<void> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const isHealthy = await checkDatabaseHealth(pool);
      if (isHealthy) {
        logger.info('Database is ready');
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
 * Create a savepoint within a transaction
 * Allows partial rollback
 * 
 * @param client - Database client
 * @param name - Savepoint name
 */
export async function createSavepoint(client: PoolClient, name: string): Promise<void> {
  await client.query(`SAVEPOINT ${name}`);
  logger.debug(`Savepoint created: ${name}`);
}

/**
 * Rollback to a savepoint
 * 
 * @param client - Database client
 * @param name - Savepoint name
 */
export async function rollbackToSavepoint(client: PoolClient, name: string): Promise<void> {
  await client.query(`ROLLBACK TO SAVEPOINT ${name}`);
  logger.debug(`Rolled back to savepoint: ${name}`);
}

/**
 * Release a savepoint
 * 
 * @param client - Database client
 * @param name - Savepoint name
 */
export async function releaseSavepoint(client: PoolClient, name: string): Promise<void> {
  await client.query(`RELEASE SAVEPOINT ${name}`);
  logger.debug(`Savepoint released: ${name}`);
}

/**
 * Execute a query and return a single row
 * 
 * @param client - Database client
 * @param text - SQL query text
 * @param values - Query parameters
 * @returns Single row or null
 */
export async function queryOne(
  client: PoolClient,
  text: string,
  values?: any[]
): Promise<any | null> {
  const result = await client.query(text, values);
  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Execute a query and return all rows
 * 
 * @param client - Database client
 * @param text - SQL query text
 * @param values - Query parameters
 * @returns Array of rows
 */
export async function queryMany(
  client: PoolClient,
  text: string,
  values?: any[]
): Promise<any[]> {
  const result = await client.query(text, values);
  return result.rows;
}

/**
 * Execute an insert query and return the inserted row
 * 
 * @param client - Database client
 * @param text - SQL query text
 * @param values - Query parameters
 * @returns Inserted row
 */
export async function insertOne(
  client: PoolClient,
  text: string,
  values?: any[]
): Promise<any> {
  const result = await client.query(text, values);
  if (result.rows.length === 0) {
    throw new Error('Insert failed: no rows returned');
  }
  return result.rows[0];
}

/**
 * Execute an update query and return the number of affected rows
 * 
 * @param client - Database client
 * @param text - SQL query text
 * @param values - Query parameters
 * @returns Number of affected rows
 */
export async function updateRows(
  client: PoolClient,
  text: string,
  values?: any[]
): Promise<number> {
  const result = await client.query(text, values);
  return result.rowCount || 0;
}

/**
 * Execute a delete query and return the number of deleted rows
 * 
 * @param client - Database client
 * @param text - SQL query text
 * @param values - Query parameters
 * @returns Number of deleted rows
 */
export async function deleteRows(
  client: PoolClient,
  text: string,
  values?: any[]
): Promise<number> {
  const result = await client.query(text, values);
  return result.rowCount || 0;
}

/**
 * Check if a row exists
 * 
 * @param client - Database client
 * @param text - SQL query text
 * @param values - Query parameters
 * @returns true if row exists, false otherwise
 */
export async function rowExists(
  client: PoolClient,
  text: string,
  values?: any[]
): Promise<boolean> {
  const row = await queryOne(client, text, values);
  return row !== null;
}

/**
 * Count rows matching a condition
 * 
 * @param client - Database client
 * @param text - SQL query text
 * @param values - Query parameters
 * @returns Number of matching rows
 */
export async function countRows(
  client: PoolClient,
  text: string,
  values?: any[]
): Promise<number> {
  const result = await queryOne(client, text, values);
  return result?.count ? parseInt(result.count, 10) : 0;
}
