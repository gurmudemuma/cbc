/**
 * Contract Error Handling Middleware
 * Handles contract-specific errors and returns appropriate responses
 */

import { Request, Response, NextFunction } from 'express';
import { createLogger } from '@shared/logger';
import {
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
  handleDatabaseError,
  formatErrorResponse,
} from '@shared/database/errors';

const logger = createLogger('ContractErrorMiddleware');

/**
 * Contract error handler middleware
 */
export function contractErrorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log the error
  logger.error('Contract error', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  // Handle database errors
  if (error instanceof DatabaseError || error.code) {
    const dbError = error instanceof DatabaseError ? error : handleDatabaseError(error);
    const errorResponse = formatErrorResponse(dbError);

    return res.status(errorResponse.status).json({
      status: 'error',
      code: errorResponse.code,
      message: errorResponse.message,
      details: errorResponse.details,
    });
  }

  // Handle validation errors
  if (error.name === 'ValidationError' || error.code === 'VALIDATION_ERROR') {
    return res.status(400).json({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: error.message || 'Validation failed',
      errors: error.errors || [],
    });
  }

  // Handle authorization errors
  if (error.code === 'FORBIDDEN' || error.name === 'ForbiddenError') {
    return res.status(403).json({
      status: 'error',
      code: 'FORBIDDEN',
      message: error.message || 'You do not have permission to perform this action',
    });
  }

  // Handle not found errors
  if (error.code === 'NOT_FOUND' || error.name === 'NotFoundError') {
    return res.status(404).json({
      status: 'error',
      code: 'NOT_FOUND',
      message: error.message || 'Resource not found',
    });
  }

  // Handle conflict errors
  if (error.code === 'CONFLICT' || error.name === 'ConflictError') {
    return res.status(409).json({
      status: 'error',
      code: 'CONFLICT',
      message: error.message || 'Resource conflict',
    });
  }

  // Handle timeout errors
  if (error.code === 'TIMEOUT' || error.name === 'TimeoutError') {
    return res.status(504).json({
      status: 'error',
      code: 'GATEWAY_TIMEOUT',
      message: 'Request timeout - please try again',
    });
  }

  // Handle service unavailable errors
  if (error.code === 'SERVICE_UNAVAILABLE' || error.name === 'ServiceUnavailableError') {
    return res.status(503).json({
      status: 'error',
      code: 'SERVICE_UNAVAILABLE',
      message: 'Service temporarily unavailable - please try again later',
    });
  }

  // Default error response
  res.status(500).json({
    status: 'error',
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
  });
}

/**
 * Async error wrapper for route handlers
 * Catches errors in async route handlers and passes them to error middleware
 */
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Contract-specific error handler for common scenarios
 */
export function handleContractError(error: any, context?: Record<string, any>) {
  const dbError = error instanceof DatabaseError ? error : handleDatabaseError(error);

  // Log with context
  logger.error('Contract operation failed', {
    errorName: dbError.name,
    errorCode: dbError.code,
    errorMessage: dbError.message,
    ...context,
  });

  // Return formatted error
  return formatErrorResponse(dbError);
}

/**
 * Validate contract exists
 */
export function validateContractExists(contract: any, draftId: string) {
  if (!contract) {
    const error = new NotFoundError(`Contract ${draftId} not found`);
    throw error;
  }
}

/**
 * Validate contract ownership
 */
export function validateContractOwnership(contract: any, userId: string) {
  if (contract.exporter_id !== userId) {
    const error = new Error('You do not have permission to access this contract');
    (error as any).code = 'FORBIDDEN';
    throw error;
  }
}

/**
 * Validate contract status
 */
export function validateContractStatus(contract: any, expectedStatus: string | string[]) {
  const statuses = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];

  if (!statuses.includes(contract.status)) {
    const error = new Error(
      `Contract status must be ${statuses.join(' or ')}, but is ${contract.status}`
    );
    (error as any).code = 'CONFLICT';
    throw error;
  }
}

/**
 * Validate buyer email
 */
export function validateBuyerEmail(contract: any, buyerEmail: string) {
  if (contract.buyer_email !== buyerEmail) {
    const error = new Error('You do not have permission to respond to this contract');
    (error as any).code = 'FORBIDDEN';
    throw error;
  }
}

/**
 * Validate contract can be edited
 */
export function validateContractEditable(contract: any) {
  if (contract.status !== 'DRAFT') {
    const error = new Error('Only DRAFT contracts can be edited');
    (error as any).code = 'CONFLICT';
    throw error;
  }
}

/**
 * Validate contract can be deleted
 */
export function validateContractDeletable(contract: any) {
  if (contract.status !== 'DRAFT') {
    const error = new Error('Only DRAFT contracts can be deleted');
    (error as any).code = 'CONFLICT';
    throw error;
  }
}

/**
 * Validate contract can be sent
 */
export function validateContractSendable(contract: any) {
  if (contract.status !== 'DRAFT') {
    const error = new Error('Only DRAFT contracts can be sent');
    (error as any).code = 'CONFLICT';
    throw error;
  }
}

/**
 * Validate contract can be finalized
 */
export function validateContractFinalizeable(contract: any) {
  if (contract.status !== 'ACCEPTED') {
    const error = new Error('Only ACCEPTED contracts can be finalized');
    (error as any).code = 'CONFLICT';
    throw error;
  }
}

/**
 * Validate contract can receive responses
 */
export function validateContractRespondable(contract: any) {
  if (contract.status !== 'COUNTERED') {
    const error = new Error('Only COUNTERED contracts can receive responses');
    (error as any).code = 'CONFLICT';
    throw error;
  }
}
