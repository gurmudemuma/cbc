/**
 * Standardized Error Codes
 * Best Practice: Consistent error handling across the application
 */

export enum ErrorCode {
  // Validation Errors (1000-1999)
  VALIDATION_FAILED = 'ERR_1000',
  INVALID_INPUT = 'ERR_1001',
  MISSING_REQUIRED_FIELD = 'ERR_1002',
  
  // Authentication Errors (2000-2999)
  AUTHENTICATION_FAILED = 'ERR_2000',
  INVALID_CREDENTIALS = 'ERR_2001',
  TOKEN_EXPIRED = 'ERR_2002',
  TOKEN_INVALID = 'ERR_2003',
  
  // Authorization Errors (3000-3999)
  UNAUTHORIZED = 'ERR_3000',
  INSUFFICIENT_PERMISSIONS = 'ERR_3001',
  
  // Blockchain Errors (4000-4999)
  BLOCKCHAIN_UNAVAILABLE = 'ERR_4000',
  TRANSACTION_FAILED = 'ERR_4002',
  MVCC_CONFLICT = 'ERR_4005',
  
  // Export Business Rules (5000-5999)
  EXPORT_NOT_FOUND = 'ERR_5000',
  EXPORT_ALREADY_EXISTS = 'ERR_5001',
  INVALID_STATUS_TRANSITION = 'ERR_5002',
  
  // System Errors (11000-11999)
  INTERNAL_SERVER_ERROR = 'ERR_11000',
  SERVICE_UNAVAILABLE = 'ERR_11001',
  CIRCUIT_BREAKER_OPEN = 'ERR_11007',
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public override message: string,
    public httpStatus: number = 500,
    public retryable: boolean = false,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const createError = (
  code: ErrorCode,
  message: string,
  httpStatus: number = 500,
  retryable: boolean = false
): AppError => {
  return new AppError(code, message, httpStatus, retryable);
};
