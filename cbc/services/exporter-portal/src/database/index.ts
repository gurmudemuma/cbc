/**
 * Database Module Index
 * Exports all database utilities for contract workflow
 */

// Connection management
export {
  getDatabaseConfig,
  getContractPool,
  initializeContractPool,
  closeContractPool,
  testDatabaseConnection,
  getDatabaseStats,
  waitForDatabaseReady,
  checkDatabaseHealth,
  verifyContractTables,
  getDatabaseVersion,
  startPoolMonitoring,
  stopPoolMonitoring,
} from './connection';

// Transaction management
export {
  executeContractTransaction,
  executeContractCreationTransaction,
  executeContractUpdateTransaction,
  executeContractStatusChangeTransaction,
  executeContractFinalizationTransaction,
  executeContractDeletionTransaction,
  executeNotificationTransaction,
  executeBatchTransaction,
  executeWithRetry,
  createContractSavepoint,
  rollbackToContractSavepoint,
  releaseContractSavepoint,
  executeWithSavepoint,
  lockContractForUpdate,
  lockContractsForUpdate,
  isContractLocked,
  executeWithLockCheck,
} from './contract-transaction';

// Query utilities
export {
  queryContractById,
  queryContractsByExporter,
  queryContractsByBuyer,
  queryContractByEctaReference,
  queryContractHistory,
  queryLatestContractHistory,
  queryContractNotifications,
  queryUserNotifications,
  queryContractPermissions,
  queryUserContractPermission,
  countContractsByStatus,
  contractExists,
  ectaReferenceExists,
  getNextVersionNumber,
  searchContracts,
  getContractStatistics,
  getContractsExpiringSoon,
  getRecentContractActivity,
} from './contract-queries';

// Schema initialization
export {
  initializeContractSchema,
  dropContractSchema,
} from './init-schema';

// Re-export shared database utilities for convenience
export {
  withTransaction,
  withRetry,
  withTransactionAndRetry,
  executeBatchQueries,
  executeQueryWithRetry,
  getPoolStats as getSharedPoolStats,
  checkDatabaseHealth as checkSharedDatabaseHealth,
  waitForDatabase,
} from '@shared/database/transaction';

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
} from '@shared/database/utils';

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
} from '@shared/database/errors';
