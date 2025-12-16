/**
 * Standardized API Response Types
 * Consistent response format across all CBC services
 */

export interface ApiSuccessResponse<T = any> {
  success: true;
  message: string;
  data: T;
  timestamp: string;
  service: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  error: {
    code: string;
    details?: string;
    field?: string;
    stack?: string; // Only in development
  };
  timestamp: string;
  service: string;
  requestId?: string;
}

export interface ApiPaginatedResponse<T = any> extends ApiSuccessResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Standard error codes used across all services
 */
export enum ApiErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',

  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Business Logic
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

  // External Services
  FABRIC_CONNECTION_ERROR = 'FABRIC_CONNECTION_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  IPFS_ERROR = 'IPFS_ERROR',
  EMAIL_SERVICE_ERROR = 'EMAIL_SERVICE_ERROR',

  // System
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  FILE_UPLOAD_ERROR = 'FILE_UPLOAD_ERROR',
}

/**
 * Helper functions to create standardized responses
 */
export class ApiResponse {
  static success<T>(
    data: T,
    message: string = 'Operation successful',
    service: string = 'CBC-API'
  ): ApiSuccessResponse<T> {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
      service,
    };
  }

  static error(
    message: string,
    code: ApiErrorCode = ApiErrorCode.INTERNAL_SERVER_ERROR,
    details?: string,
    field?: string,
    service: string = 'CBC-API',
    requestId?: string
  ): ApiErrorResponse {
    return {
      success: false,
      message,
      error: {
        code,
        details,
        field,
        stack: process.env.NODE_ENV === 'development' ? new Error().stack : undefined,
      },
      timestamp: new Date().toISOString(),
      service,
      requestId,
    };
  }

  static paginated<T>(
    data: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
    },
    message: string = 'Data retrieved successfully',
    service: string = 'CBC-API'
  ): ApiPaginatedResponse<T> {
    const totalPages = Math.ceil(pagination.total / pagination.limit);

    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
      service,
      pagination: {
        ...pagination,
        totalPages,
        hasNext: pagination.page < totalPages,
        hasPrev: pagination.page > 1,
      },
    };
  }
}

export default ApiResponse;
