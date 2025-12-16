import { Request, Response, NextFunction } from 'express';

/**
 * Comprehensive Error Handling Middleware
 * Implements standardized error responses with detailed error codes
 */

// ============================================================================
// ERROR CODES
// ============================================================================

export enum ErrorCode {
  // Authentication & Authorization (1000-1999)
  UNAUTHORIZED = 'AUTH_001',
  INVALID_TOKEN = 'AUTH_002',
  TOKEN_EXPIRED = 'AUTH_003',
  FORBIDDEN = 'AUTH_004',
  INSUFFICIENT_PERMISSIONS = 'AUTH_005',
  INVALID_CREDENTIALS = 'AUTH_006',

  // Validation (2000-2999)
  VALIDATION_FAILED = 'VAL_001',
  INVALID_INPUT = 'VAL_002',
  MISSING_REQUIRED_FIELD = 'VAL_003',
  INVALID_FORMAT = 'VAL_004',
  INVALID_ENUM_VALUE = 'VAL_005',

  // Resource (3000-3999)
  RESOURCE_NOT_FOUND = 'RES_001',
  RESOURCE_ALREADY_EXISTS = 'RES_002',
  RESOURCE_CONFLICT = 'RES_003',
  RESOURCE_LOCKED = 'RES_004',

  // Business Logic (4000-4999)
  INVALID_STATE_TRANSITION = 'BIZ_001',
  INVALID_WORKFLOW_STATE = 'BIZ_002',
  PREREQUISITE_NOT_MET = 'BIZ_003',
  OPERATION_NOT_ALLOWED = 'BIZ_004',
  INSUFFICIENT_DATA = 'BIZ_005',

  // Blockchain (5000-5999)
  BLOCKCHAIN_ERROR = 'BC_001',
  CHAINCODE_ERROR = 'BC_002',
  TRANSACTION_FAILED = 'BC_003',
  LEDGER_ERROR = 'BC_004',
  MSP_ERROR = 'BC_005',

  // Database (6000-6999)
  DATABASE_ERROR = 'DB_001',
  QUERY_FAILED = 'DB_002',
  CONNECTION_ERROR = 'DB_003',
  TRANSACTION_ERROR = 'DB_004',

  // External Services (7000-7999)
  EXTERNAL_SERVICE_ERROR = 'EXT_001',
  IPFS_ERROR = 'EXT_002',
  EMAIL_SERVICE_ERROR = 'EXT_003',

  // Rate Limiting (8000-8999)
  RATE_LIMIT_EXCEEDED = 'RATE_001',
  TOO_MANY_REQUESTS = 'RATE_002',

  // Server (9000-9999)
  INTERNAL_SERVER_ERROR = 'SRV_001',
  SERVICE_UNAVAILABLE = 'SRV_002',
  TIMEOUT = 'SRV_003',
}

// ============================================================================
// ERROR CLASSES
// ============================================================================

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: ErrorCode,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(400, ErrorCode.VALIDATION_FAILED, message, details);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed', details?: Record<string, any>) {
    super(401, ErrorCode.UNAUTHORIZED, message, details);
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied', details?: Record<string, any>) {
    super(403, ErrorCode.FORBIDDEN, message, details);
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with ID ${id} not found` : `${resource} not found`;
    super(404, ErrorCode.RESOURCE_NOT_FOUND, message);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(409, ErrorCode.RESOURCE_CONFLICT, message, details);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class BusinessLogicError extends AppError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.OPERATION_NOT_ALLOWED,
    details?: Record<string, any>
  ) {
    super(422, code, message, details);
    Object.setPrototypeOf(this, BusinessLogicError.prototype);
  }
}

export class BlockchainError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(500, ErrorCode.BLOCKCHAIN_ERROR, message, details);
    Object.setPrototypeOf(this, BlockchainError.prototype);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(500, ErrorCode.DATABASE_ERROR, message, details);
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter: number) {
    super(429, ErrorCode.RATE_LIMIT_EXCEEDED, 'Rate limit exceeded', { retryAfter });
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

// ============================================================================
// ERROR HANDLER MIDDLEWARE
// ============================================================================

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Log error
  console.error('[ERROR]', {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    statusCode: err.statusCode || 500,
    code: err.code || ErrorCode.INTERNAL_SERVER_ERROR,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Handle AppError instances
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      details: err.details,
      timestamp: new Date().toISOString(),
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      code: ErrorCode.INVALID_TOKEN,
      timestamp: new Date().toISOString(),
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
      code: ErrorCode.TOKEN_EXPIRED,
      timestamp: new Date().toISOString(),
    });
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      code: ErrorCode.VALIDATION_FAILED,
      details: err.details || err.message,
      timestamp: new Date().toISOString(),
    });
  }

  // Handle database errors
  if (err.code && err.code.startsWith('PGERROR')) {
    return res.status(500).json({
      success: false,
      message: 'Database error',
      code: ErrorCode.DATABASE_ERROR,
      timestamp: new Date().toISOString(),
    });
  }

  // Handle blockchain errors
  if (err.message && err.message.includes('fabric')) {
    return res.status(500).json({
      success: false,
      message: 'Blockchain operation failed',
      code: ErrorCode.BLOCKCHAIN_ERROR,
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
      timestamp: new Date().toISOString(),
    });
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  const code = err.code || ErrorCode.INTERNAL_SERVER_ERROR;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    code,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Async error wrapper
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 handler
 */
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    code: ErrorCode.RESOURCE_NOT_FOUND,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Error response builder
 */
export class ErrorResponse {
  static badRequest(message: string, details?: Record<string, any>) {
    return new ValidationError(message, details);
  }

  static unauthorized(message: string = 'Unauthorized', details?: Record<string, any>) {
    return new AuthenticationError(message, details);
  }

  static forbidden(message: string = 'Forbidden', details?: Record<string, any>) {
    return new AuthorizationError(message, details);
  }

  static notFound(resource: string, id?: string) {
    return new NotFoundError(resource, id);
  }

  static conflict(message: string, details?: Record<string, any>) {
    return new ConflictError(message, details);
  }

  static businessLogic(message: string, code?: ErrorCode, details?: Record<string, any>) {
    return new BusinessLogicError(message, code, details);
  }

  static blockchain(message: string, details?: Record<string, any>) {
    return new BlockchainError(message, details);
  }

  static database(message: string, details?: Record<string, any>) {
    return new DatabaseError(message, details);
  }

  static rateLimit(retryAfter: number) {
    return new RateLimitError(retryAfter);
  }

  static internal(message: string = 'Internal server error') {
    return new AppError(500, ErrorCode.INTERNAL_SERVER_ERROR, message);
  }
}
