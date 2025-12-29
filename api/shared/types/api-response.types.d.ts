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
        stack?: string;
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
export declare enum ApiErrorCode {
    UNAUTHORIZED = "UNAUTHORIZED",
    FORBIDDEN = "FORBIDDEN",
    TOKEN_EXPIRED = "TOKEN_EXPIRED",
    INVALID_TOKEN = "INVALID_TOKEN",
    VALIDATION_ERROR = "VALIDATION_ERROR",
    INVALID_INPUT = "INVALID_INPUT",
    MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",
    RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
    RESOURCE_ALREADY_EXISTS = "RESOURCE_ALREADY_EXISTS",
    BUSINESS_RULE_VIOLATION = "BUSINESS_RULE_VIOLATION",
    INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",
    FABRIC_CONNECTION_ERROR = "FABRIC_CONNECTION_ERROR",
    DATABASE_ERROR = "DATABASE_ERROR",
    IPFS_ERROR = "IPFS_ERROR",
    EMAIL_SERVICE_ERROR = "EMAIL_SERVICE_ERROR",
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
    FILE_UPLOAD_ERROR = "FILE_UPLOAD_ERROR"
}
/**
 * Helper functions to create standardized responses
 */
export declare class ApiResponse {
    static success<T>(data: T, message?: string, service?: string): ApiSuccessResponse<T>;
    static error(message: string, code?: ApiErrorCode, details?: string, field?: string, service?: string, requestId?: string): ApiErrorResponse;
    static paginated<T>(data: T[], pagination: {
        page: number;
        limit: number;
        total: number;
    }, message?: string, service?: string): ApiPaginatedResponse<T>;
}
export default ApiResponse;
//# sourceMappingURL=api-response.types.d.ts.map