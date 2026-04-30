/**
 * Database Error Handling
 * Custom error classes and error handling utilities
 */

import { createLogger } from '../logger';

const logger = createLogger('DatabaseErrors');

/**
 * Base database error class
 */
export class DatabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

/**
 * Connection error
 */
export class ConnectionError extends DatabaseError {
  constructor(message: string, originalError?: Error) {
    super(message, 'CONNECTION_ERROR', originalError);
    this.name = 'ConnectionError';
  }
}

/**
 * Query error
 */
export class QueryError extends DatabaseError {
  constructor(message: string, originalError?: Error) {
    super(message, 'QUERY_ERROR', originalError);
    this.name = 'QueryError';
  }
}

/**
 * Transaction error
 */
export class TransactionError extends DatabaseError {
  constructor(message: string, originalError?: Error) {
    super(message, 'TRANSACTION_ERROR', originalError);
    this.name = 'TransactionError';
  }
}

/**
 * Validation error
 */
export class ValidationError extends DatabaseError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

/**
 * Not found error
 */
export class NotFoundError extends DatabaseError {
  constructor(message: string) {
    super(message, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

/**
 * Duplicate key error
 */
export class DuplicateKeyError extends DatabaseError {
  constructor(message: string, public constraint?: string) {
    super(message, 'DUPLICATE_KEY');
    this.name = 'DuplicateKeyError';
  }
}

/**
 * Foreign key error
 */
export class ForeignKeyError extends DatabaseError {
  constructor(message: string, public constraint?: string) {
    super(message, 'FOREIGN_KEY_VIOLATION');
    this.name = 'ForeignKeyError';
  }
}

/**
 * Constraint error
 */
export class ConstraintError extends DatabaseError {
  constructor(message: string, public constraint?: string) {
    super(message, 'CONSTRAINT_VIOLATION');
    this.name = 'ConstraintError';
  }
}

/**
 * Timeout error
 */
export class TimeoutError extends DatabaseError {
  constructor(message: string) {
    super(message, 'TIMEOUT');
    this.name = 'TimeoutError';
  }
}

/**
 * Pool exhausted error
 */
export class PoolExhaustedError extends DatabaseError {
  constructor(message: string) {
    super(message, 'POOL_EXHAUSTED');
    this.name = 'PoolExhaustedError';
  }
}

/**
 * Parse error
 */
export class ParseError extends DatabaseError {
  constructor(message: string, originalError?: Error) {
    super(message, 'PARSE_ERROR', originalError);
    this.name = 'ParseError';
  }
}

/**
 * Handle database errors and convert to appropriate error types
 * 
 * @param error - Original error from database
 * @returns Converted database error
 */
export function handleDatabaseError(error: any): DatabaseError {
  // Handle PostgreSQL specific errors
  if (error.code) {
    switch (error.code) {
      case '23505': // Unique violation
        return new DuplicateKeyError(
          `Duplicate key: ${error.detail || error.message}`,
          error.constraint
        );

      case '23503': // Foreign key violation
        return new ForeignKeyError(
          `Foreign key violation: ${error.detail || error.message}`,
          error.constraint
        );

      case '23502': // Not null violation
        return new ConstraintError(
          `Not null constraint violation: ${error.detail || error.message}`,
          error.constraint
        );

      case '23514': // Check constraint violation
        return new ConstraintError(
          `Check constraint violation: ${error.detail || error.message}`,
          error.constraint
        );

      case '42P01': // Undefined table
        return new QueryError(`Table not found: ${error.message}`);

      case '42703': // Undefined column
        return new QueryError(`Column not found: ${error.message}`);

      case '42601': // Syntax error
        return new QueryError(`SQL syntax error: ${error.message}`);

      case '08006': // Connection failure
        return new ConnectionError(`Connection failed: ${error.message}`, error);

      case '08003': // Connection does not exist
        return new ConnectionError(`Connection does not exist: ${error.message}`, error);

      case '57P03': // Cannot execute queries
        return new ConnectionError(`Database is shutting down: ${error.message}`, error);
    }
  }

  // Handle connection errors
  if (error.message && error.message.includes('ECONNREFUSED')) {
    return new ConnectionError('Connection refused - database may be down', error);
  }

  if (error.message && error.message.includes('ETIMEDOUT')) {
    return new TimeoutError('Connection timeout');
  }

  if (error.message && error.message.includes('ENOTFOUND')) {
    return new ConnectionError('Database host not found', error);
  }

  // Handle pool errors
  if (error.message && error.message.includes('no more connections available')) {
    return new PoolExhaustedError('Connection pool exhausted');
  }

  // Handle timeout errors
  if (error.message && error.message.includes('timeout')) {
    return new TimeoutError(`Query timeout: ${error.message}`);
  }

  // Handle transaction errors
  if (error.message && error.message.includes('transaction')) {
    return new TransactionError(`Transaction error: ${error.message}`, error);
  }

  // Default to generic database error
  return new DatabaseError(error.message || 'Unknown database error', 'UNKNOWN', error);
}

/**
 * Check if error is retryable
 * 
 * @param error - Database error
 * @returns true if error is retryable, false otherwise
 */
export function isRetryableError(error: any): boolean {
  // Connection errors are retryable
  if (error instanceof ConnectionError) {
    return true;
  }

  // Timeout errors are retryable
  if (error instanceof TimeoutError) {
    return true;
  }

  // Pool exhausted errors are retryable
  if (error instanceof PoolExhaustedError) {
    return true;
  }

  // PostgreSQL specific retryable errors
  if (error.code) {
    // Serialization failure
    if (error.code === '40001') {
      return true;
    }

    // Deadlock detected
    if (error.code === '40P01') {
      return true;
    }

    // Transaction aborted
    if (error.code === '25P02') {
      return true;
    }

    // Connection failure
    if (error.code === '08006' || error.code === '08003') {
      return true;
    }

    // Cannot execute queries
    if (error.code === '57P03') {
      return true;
    }
  }

  return false;
}

/**
 * Log database error with context
 * 
 * @param error - Database error
 * @param context - Additional context information
 */
export function logDatabaseError(error: any, context?: Record<string, any>): void {
  const dbError = error instanceof DatabaseError ? error : handleDatabaseError(error);

  const logContext = {
    errorName: dbError.name,
    errorCode: dbError.code,
    errorMessage: dbError.message,
    ...context,
  };

  if (isRetryableError(dbError)) {
    logger.warn('Retryable database error', logContext);
  } else {
    logger.error('Database error', logContext);
  }
}

/**
 * Extract error details from database error
 * 
 * @param error - Database error
 * @returns Error details object
 */
export function extractErrorDetails(error: any): {
  message: string;
  code?: string;
  constraint?: string;
  detail?: string;
  hint?: string;
  retryable: boolean;
} {
  const dbError = error instanceof DatabaseError ? error : handleDatabaseError(error);

  return {
    message: dbError.message,
    code: dbError.code,
    constraint: (dbError as any).constraint,
    detail: error.detail,
    hint: error.hint,
    retryable: isRetryableError(dbError),
  };
}

/**
 * Format error for API response
 * 
 * @param error - Database error
 * @returns Formatted error object
 */
export function formatErrorResponse(error: any): {
  status: number;
  code: string;
  message: string;
  details?: any;
} {
  const dbError = error instanceof DatabaseError ? error : handleDatabaseError(error);

  let status = 500;
  let code = 'INTERNAL_SERVER_ERROR';

  if (dbError instanceof ValidationError) {
    status = 400;
    code = 'VALIDATION_ERROR';
  } else if (dbError instanceof NotFoundError) {
    status = 404;
    code = 'NOT_FOUND';
  } else if (dbError instanceof DuplicateKeyError) {
    status = 409;
    code = 'DUPLICATE_KEY';
  } else if (dbError instanceof ForeignKeyError) {
    status = 409;
    code = 'FOREIGN_KEY_VIOLATION';
  } else if (dbError instanceof ConstraintError) {
    status = 409;
    code = 'CONSTRAINT_VIOLATION';
  } else if (dbError instanceof ConnectionError) {
    status = 503;
    code = 'SERVICE_UNAVAILABLE';
  } else if (dbError instanceof TimeoutError) {
    status = 504;
    code = 'GATEWAY_TIMEOUT';
  } else if (dbError instanceof PoolExhaustedError) {
    status = 503;
    code = 'SERVICE_UNAVAILABLE';
  }

  return {
    status,
    code,
    message: dbError.message,
    details: {
      constraint: (dbError as any).constraint,
      field: (dbError as any).field,
    },
  };
}
