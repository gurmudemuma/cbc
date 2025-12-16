/**
 * Standardized API Response Types
 * Ensures consistent response format across all endpoints
 */

export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: Record<string, any>;
  retryable?: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ApiErrorDetail;
  timestamp: string;
  path: string;
  requestId?: string;
}

export class ApiResponseBuilder {
  /**
   * Build a success response
   */
  static success<T>(
    data: T,
    message?: string
  ): Omit<ApiResponse<T>, 'timestamp' | 'path' | 'requestId'> {
    return {
      success: true,
      data,
      message,
    };
  }

  /**
   * Build an error response
   */
  static error(
    code: string,
    message: string,
    details?: any,
    retryable = false
  ): Omit<ApiResponse, 'timestamp' | 'path' | 'requestId'> {
    return {
      success: false,
      error: {
        code,
        message,
        details,
        retryable,
      },
    };
  }

  /**
   * Build a complete response with metadata
   */
  static complete<T>(
    response: Omit<ApiResponse<T>, 'timestamp' | 'path' | 'requestId'>,
    path: string,
    requestId?: string
  ): ApiResponse<T> {
    return {
      ...response,
      timestamp: new Date().toISOString(),
      path,
      requestId,
    };
  }
}
