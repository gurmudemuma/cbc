/**
 * Database Module
 * Exports all database utilities and functions
 */

// Connection management
export { initializePool, getPool, closePool, getPoolStats } from './pool';

// Transaction management
export {
  withTransaction,
  withRetry,
  withTransactionAndRetry,
  executeBatchQueries,
  executeQueryWithRetry,
  getPoolStats as getTransactionPoolStats,
  checkDatabaseHealth,
  waitForDatabase,
  createSavepoint,
  rollbackToSavepoint,
  releaseSavepoint,
  queryOne,
  queryMany,
  insertOne,
  updateRows,
  deleteRows,
  rowExists,
  countRows,
} from './transaction';

export type { TransactionContext, RetryConfig } from './transaction';

// Query utilities
export {
  QueryBuilder,
  buildPaginatedQuery,
  insertMany,
  updateMany,
  deleteMany,
  upsert,
  getById,
  deleteById,
  existsById,
  getAll,
  count,
  truncate,
  getTableSchema,
  getTableIndexes,
  getTableConstraints,
  analyzeTable,
  vacuumTable,
} from './utils';

export type { PaginationOptions, PaginatedResult } from './utils';

// Error handling
export {
  DatabaseError,
  ConnectionError,
  QueryError,
  TransactionError,
  ValidationError,
  NotFoundError,
  DuplicateKeyError,
  ForeignKeyError,
  ConstraintError,
  TimeoutError,
  PoolExhaustedError,
  ParseError,
  handleDatabaseError,
  isRetryableError,
  logDatabaseError,
  extractErrorDetails,
  formatErrorResponse,
} from './errors';
