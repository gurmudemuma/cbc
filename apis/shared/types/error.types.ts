/**
 * Unified Error Response Types
 * Single source of truth for error handling across the system
 */

export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',

  // Validation
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_STATUS = 'INVALID_STATUS',
  INVALID_TRANSITION = 'INVALID_TRANSITION',

  // Resource
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',

  // Business Logic
  INSUFFICIENT_QUALIFICATION = 'INSUFFICIENT_QUALIFICATION',
  MISSING_DOCUMENTS = 'MISSING_DOCUMENTS',
  INVALID_OWNERSHIP = 'INVALID_OWNERSHIP',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',

  // Blockchain
  BLOCKCHAIN_ERROR = 'BLOCKCHAIN_ERROR',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  STATE_NOT_FOUND = 'STATE_NOT_FOUND',

  // Database
  DATABASE_ERROR = 'DATABASE_ERROR',
  QUERY_FAILED = 'QUERY_FAILED',

  // IPFS
  IPFS_ERROR = 'IPFS_ERROR',
  UPLOAD_FAILED = 'UPLOAD_FAILED',

  // System
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
}

export interface ErrorDetail {
  code: ErrorCode;
  message: string;
  statusCode: number;
  details?: Record<string, any>;
  timestamp?: string;
  requestId?: string;
  path?: string;
}

export interface ErrorResponse {
  success: false;
  error: ErrorDetail;
}

export interface SuccessResponse<T = any> {
  success: true;
  message?: string;
  data?: T;
  timestamp?: string;
  requestId?: string;
}

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

// Error code to HTTP status code mapping
export const ERROR_STATUS_CODES: Record<ErrorCode, number> = {
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.INVALID_TOKEN]: 401,
  [ErrorCode.TOKEN_EXPIRED]: 401,
  [ErrorCode.INVALID_INPUT]: 400,
  [ErrorCode.MISSING_REQUIRED_FIELD]: 400,
  [ErrorCode.INVALID_STATUS]: 400,
  [ErrorCode.INVALID_TRANSITION]: 400,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.ALREADY_EXISTS]: 409,
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.INSUFFICIENT_QUALIFICATION]: 403,
  [ErrorCode.MISSING_DOCUMENTS]: 400,
  [ErrorCode.INVALID_OWNERSHIP]: 403,
  [ErrorCode.OPERATION_NOT_ALLOWED]: 403,
  [ErrorCode.BLOCKCHAIN_ERROR]: 500,
  [ErrorCode.TRANSACTION_FAILED]: 500,
  [ErrorCode.STATE_NOT_FOUND]: 404,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.QUERY_FAILED]: 500,
  [ErrorCode.IPFS_ERROR]: 500,
  [ErrorCode.UPLOAD_FAILED]: 500,
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,
  [ErrorCode.TIMEOUT]: 504,
};

// Error code to user-friendly message mapping
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.UNAUTHORIZED]: 'You are not authenticated. Please log in.',
  [ErrorCode.FORBIDDEN]: 'You do not have permission to perform this action.',
  [ErrorCode.INVALID_TOKEN]: 'Your authentication token is invalid.',
  [ErrorCode.TOKEN_EXPIRED]: 'Your authentication token has expired. Please log in again.',
  [ErrorCode.INVALID_INPUT]: 'The provided input is invalid.',
  [ErrorCode.MISSING_REQUIRED_FIELD]: 'A required field is missing.',
  [ErrorCode.INVALID_STATUS]: 'The provided status is invalid.',
  [ErrorCode.INVALID_TRANSITION]: 'This status transition is not allowed.',
  [ErrorCode.NOT_FOUND]: 'The requested resource was not found.',
  [ErrorCode.ALREADY_EXISTS]: 'This resource already exists.',
  [ErrorCode.CONFLICT]: 'There is a conflict with the current state.',
  [ErrorCode.INSUFFICIENT_QUALIFICATION]: 'You do not meet the qualification requirements.',
  [ErrorCode.MISSING_DOCUMENTS]: 'Required documents are missing.',
  [ErrorCode.INVALID_OWNERSHIP]: 'You do not own this resource.',
  [ErrorCode.OPERATION_NOT_ALLOWED]: 'This operation is not allowed.',
  [ErrorCode.BLOCKCHAIN_ERROR]: 'A blockchain error occurred.',
  [ErrorCode.TRANSACTION_FAILED]: 'The blockchain transaction failed.',
  [ErrorCode.STATE_NOT_FOUND]: 'The requested state was not found on the blockchain.',
  [ErrorCode.DATABASE_ERROR]: 'A database error occurred.',
  [ErrorCode.QUERY_FAILED]: 'The database query failed.',
  [ErrorCode.IPFS_ERROR]: 'An IPFS error occurred.',
  [ErrorCode.UPLOAD_FAILED]: 'The file upload failed.',
  [ErrorCode.INTERNAL_ERROR]: 'An internal server error occurred.',
  [ErrorCode.SERVICE_UNAVAILABLE]: 'The service is currently unavailable.',
  [ErrorCode.TIMEOUT]: 'The request timed out.',
};

// Helper function to create error response
export function createErrorResponse(
  code: ErrorCode,
  customMessage?: string,
  details?: Record<string, any>,
  requestId?: string
): ErrorResponse {
  const statusCode = ERROR_STATUS_CODES[code];
  const message = customMessage || ERROR_MESSAGES[code];

  return {
    success: false,
    error: {
      code,
      message,
      statusCode,
      details,
      timestamp: new Date().toISOString(),
      requestId,
    },
  };
}

// Helper function to create success response
export function createSuccessResponse<T>(
  data?: T,
  message?: string,
  requestId?: string
): SuccessResponse<T> {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
    requestId,
  };
}
