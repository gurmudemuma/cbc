/**
 * Contract-Specific Transaction Management
 * Provides transaction wrappers for multi-step contract operations
 */

import { Pool } from 'pg';
import { createLogger } from '@shared/logger';

// PoolClient type workaround for pg@8.x
type PoolClient = any;
import {
  withTransaction,
  withRetry,
  withTransactionAndRetry,
  RetryConfig,
} from '@shared/database/transaction';
import { getContractPool } from './connection';

const logger = createLogger('ContractTransaction');

/**
 * Contract transaction options
 */
export interface ContractTransactionOptions {
  isolationLevel?: 'READ UNCOMMITTED' | 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE';
  timeout?: number;
  retryOnFailure?: boolean;
  retryConfig?: Partial<RetryConfig>;
}

/**
 * Default transaction options for contract operations
 */
const DEFAULT_CONTRACT_TRANSACTION_OPTIONS: ContractTransactionOptions = {
  isolationLevel: 'READ COMMITTED',
  timeout: 5000,
  retryOnFailure: true,
  retryConfig: {
    maxAttempts: 3,
    initialDelayMs: 100,
    maxDelayMs: 2000,
    backoffMultiplier: 2,
  },
};

/**
 * Execute a contract operation within a transaction
 * Automatically handles commit/rollback and optional retry logic
 * 
 * @param callback - Function to execute within transaction
 * @param options - Transaction options
 * @returns Result of the callback function
 */
export async function executeContractTransaction<T>(
  callback: (client: PoolClient) => Promise<T>,
  options?: ContractTransactionOptions
): Promise<T> {
  const pool = getContractPool();
  const opts = { ...DEFAULT_CONTRACT_TRANSACTION_OPTIONS, ...options };
  
  logger.debug('Starting contract transaction', {
    isolationLevel: opts.isolationLevel,
    retryOnFailure: opts.retryOnFailure,
  });
  
  try {
    if (opts.retryOnFailure) {
      return await withTransactionAndRetry(
        pool,
        callback,
        {
          isolationLevel: opts.isolationLevel,
          timeout: opts.timeout,
          retryConfig: opts.retryConfig,
        }
      );
    } else {
      return await withTransaction(
        pool,
        callback,
        {
          isolationLevel: opts.isolationLevel,
          timeout: opts.timeout,
        }
      );
    }
  } catch (error) {
    logger.error('Contract transaction failed', { error });
    throw error;
  }
}

/**
 * Execute a contract creation transaction
 * Creates a draft contract and initial history entry
 * 
 * @param callback - Function to execute within transaction
 * @returns Result of the callback function
 */
export async function executeContractCreationTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  logger.debug('Starting contract creation transaction');
  
  return executeContractTransaction(callback, {
    isolationLevel: 'READ COMMITTED',
    retryOnFailure: true,
  });
}

/**
 * Execute a contract update transaction
 * Updates a contract and creates a history entry
 * 
 * @param callback - Function to execute within transaction
 * @returns Result of the callback function
 */
export async function executeContractUpdateTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  logger.debug('Starting contract update transaction');
  
  return executeContractTransaction(callback, {
    isolationLevel: 'READ COMMITTED',
    retryOnFailure: true,
  });
}

/**
 * Execute a contract status change transaction
 * Updates contract status and creates a history entry
 * 
 * @param callback - Function to execute within transaction
 * @returns Result of the callback function
 */
export async function executeContractStatusChangeTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  logger.debug('Starting contract status change transaction');
  
  return executeContractTransaction(callback, {
    isolationLevel: 'READ COMMITTED',
    retryOnFailure: true,
  });
}

/**
 * Execute a contract finalization transaction
 * Finalizes contract, updates blockchain hash, and triggers ECTA registration
 * Uses SERIALIZABLE isolation to prevent concurrent modifications
 * 
 * @param callback - Function to execute within transaction
 * @returns Result of the callback function
 */
export async function executeContractFinalizationTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  logger.debug('Starting contract finalization transaction');
  
  return executeContractTransaction(callback, {
    isolationLevel: 'SERIALIZABLE',
    retryOnFailure: true,
    retryConfig: {
      maxAttempts: 3,
      initialDelayMs: 200,
      maxDelayMs: 3000,
      backoffMultiplier: 2,
    },
  });
}

/**
 * Execute a contract deletion transaction
 * Deletes contract and all related records (history, notifications, permissions)
 * 
 * @param callback - Function to execute within transaction
 * @returns Result of the callback function
 */
export async function executeContractDeletionTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  logger.debug('Starting contract deletion transaction');
  
  return executeContractTransaction(callback, {
    isolationLevel: 'READ COMMITTED',
    retryOnFailure: false, // Don't retry deletions
  });
}

/**
 * Execute a notification creation transaction
 * Creates a notification record
 * 
 * @param callback - Function to execute within transaction
 * @returns Result of the callback function
 */
export async function executeNotificationTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  logger.debug('Starting notification transaction');
  
  return executeContractTransaction(callback, {
    isolationLevel: 'READ COMMITTED',
    retryOnFailure: true,
  });
}

/**
 * Execute a batch operation transaction
 * Executes multiple operations in a single transaction
 * 
 * @param callback - Function to execute within transaction
 * @returns Result of the callback function
 */
export async function executeBatchTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  logger.debug('Starting batch transaction');
  
  return executeContractTransaction(callback, {
    isolationLevel: 'READ COMMITTED',
    retryOnFailure: true,
  });
}

/**
 * Execute a query with automatic retry on connection errors
 * Useful for read-only queries that don't need transactions
 * 
 * @param callback - Function to execute
 * @param retryConfig - Retry configuration
 * @returns Result of the callback function
 */
export async function executeWithRetry<T>(
  callback: () => Promise<T>,
  retryConfig?: Partial<RetryConfig>
): Promise<T> {
  const config = {
    maxAttempts: 3,
    initialDelayMs: 100,
    maxDelayMs: 2000,
    backoffMultiplier: 2,
    ...retryConfig,
  };
  
  logger.debug('Executing with retry', { config });
  
  return withRetry(callback, config);
}

/**
 * Create a savepoint within a transaction
 * Allows partial rollback
 * 
 * @param client - Database client
 * @param name - Savepoint name
 */
export async function createContractSavepoint(
  client: PoolClient,
  name: string
): Promise<void> {
  await client.query(`SAVEPOINT ${name}`);
  logger.debug(`Contract savepoint created: ${name}`);
}

/**
 * Rollback to a savepoint
 * 
 * @param client - Database client
 * @param name - Savepoint name
 */
export async function rollbackToContractSavepoint(
  client: PoolClient,
  name: string
): Promise<void> {
  await client.query(`ROLLBACK TO SAVEPOINT ${name}`);
  logger.debug(`Rolled back to contract savepoint: ${name}`);
}

/**
 * Release a savepoint
 * 
 * @param client - Database client
 * @param name - Savepoint name
 */
export async function releaseContractSavepoint(
  client: PoolClient,
  name: string
): Promise<void> {
  await client.query(`RELEASE SAVEPOINT ${name}`);
  logger.debug(`Contract savepoint released: ${name}`);
}

/**
 * Execute a contract operation with savepoint support
 * Allows partial rollback on error
 * 
 * @param client - Database client
 * @param savepointName - Savepoint name
 * @param callback - Function to execute
 * @returns Result of the callback function
 */
export async function executeWithSavepoint<T>(
  client: PoolClient,
  savepointName: string,
  callback: () => Promise<T>
): Promise<T> {
  await createContractSavepoint(client, savepointName);
  
  try {
    const result = await callback();
    await releaseContractSavepoint(client, savepointName);
    return result;
  } catch (error) {
    await rollbackToContractSavepoint(client, savepointName);
    throw error;
  }
}

/**
 * Lock a contract row for update
 * Prevents concurrent modifications
 * 
 * @param client - Database client
 * @param draftId - Contract draft ID
 * @returns Contract row or null if not found
 */
export async function lockContractForUpdate(
  client: PoolClient,
  draftId: string
): Promise<any | null> {
  const query = `
    SELECT * FROM contract_drafts
    WHERE draft_id = $1
    FOR UPDATE
  `;
  
  const result = await client.query(query, [draftId]);
  
  if (result.rows.length === 0) {
    logger.warn(`Contract not found for locking: ${draftId}`);
    return null;
  }
  
  logger.debug(`Contract locked for update: ${draftId}`);
  return result.rows[0];
}

/**
 * Lock multiple contracts for update
 * Prevents concurrent modifications on multiple contracts
 * 
 * @param client - Database client
 * @param draftIds - Array of contract draft IDs
 * @returns Array of contract rows
 */
export async function lockContractsForUpdate(
  client: PoolClient,
  draftIds: string[]
): Promise<any[]> {
  if (draftIds.length === 0) {
    return [];
  }
  
  const query = `
    SELECT * FROM contract_drafts
    WHERE draft_id = ANY($1)
    FOR UPDATE
  `;
  
  const result = await client.query(query, [draftIds]);
  
  logger.debug(`Locked ${result.rows.length} contracts for update`);
  return result.rows;
}

/**
 * Check if a contract is locked by another transaction
 * Uses FOR UPDATE NOWAIT to detect locks
 * 
 * @param client - Database client
 * @param draftId - Contract draft ID
 * @returns true if locked, false otherwise
 */
export async function isContractLocked(
  client: PoolClient,
  draftId: string
): Promise<boolean> {
  try {
    const query = `
      SELECT 1 FROM contract_drafts
      WHERE draft_id = $1
      FOR UPDATE NOWAIT
    `;
    
    await client.query(query, [draftId]);
    return false; // Not locked
  } catch (error: any) {
    // Error code 55P03 indicates lock not available
    if (error.code === '55P03') {
      logger.debug(`Contract is locked: ${draftId}`);
      return true;
    }
    throw error;
  }
}

/**
 * Execute a contract operation with lock check
 * Throws error if contract is locked
 * 
 * @param client - Database client
 * @param draftId - Contract draft ID
 * @param callback - Function to execute
 * @returns Result of the callback function
 */
export async function executeWithLockCheck<T>(
  client: PoolClient,
  draftId: string,
  callback: () => Promise<T>
): Promise<T> {
  const isLocked = await isContractLocked(client, draftId);
  
  if (isLocked) {
    throw new Error(`Contract ${draftId} is locked by another transaction`);
  }
  
  return callback();
}
