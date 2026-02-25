"use strict";
/**
 * Standardized API Response Types
 * Consistent response format across all CBC services
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponse = exports.ApiErrorCode = void 0;
/**
 * Standard error codes used across all services
 */
var ApiErrorCode;
(function (ApiErrorCode) {
    // Authentication & Authorization
    ApiErrorCode["UNAUTHORIZED"] = "UNAUTHORIZED";
    ApiErrorCode["FORBIDDEN"] = "FORBIDDEN";
    ApiErrorCode["TOKEN_EXPIRED"] = "TOKEN_EXPIRED";
    ApiErrorCode["INVALID_TOKEN"] = "INVALID_TOKEN";
    // Validation
    ApiErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ApiErrorCode["INVALID_INPUT"] = "INVALID_INPUT";
    ApiErrorCode["MISSING_REQUIRED_FIELD"] = "MISSING_REQUIRED_FIELD";
    // Business Logic
    ApiErrorCode["RESOURCE_NOT_FOUND"] = "RESOURCE_NOT_FOUND";
    ApiErrorCode["RESOURCE_ALREADY_EXISTS"] = "RESOURCE_ALREADY_EXISTS";
    ApiErrorCode["BUSINESS_RULE_VIOLATION"] = "BUSINESS_RULE_VIOLATION";
    ApiErrorCode["INSUFFICIENT_PERMISSIONS"] = "INSUFFICIENT_PERMISSIONS";
    // External Services
    ApiErrorCode["FABRIC_CONNECTION_ERROR"] = "FABRIC_CONNECTION_ERROR";
    ApiErrorCode["DATABASE_ERROR"] = "DATABASE_ERROR";
    ApiErrorCode["IPFS_ERROR"] = "IPFS_ERROR";
    ApiErrorCode["EMAIL_SERVICE_ERROR"] = "EMAIL_SERVICE_ERROR";
    // System
    ApiErrorCode["INTERNAL_SERVER_ERROR"] = "INTERNAL_SERVER_ERROR";
    ApiErrorCode["SERVICE_UNAVAILABLE"] = "SERVICE_UNAVAILABLE";
    ApiErrorCode["RATE_LIMIT_EXCEEDED"] = "RATE_LIMIT_EXCEEDED";
    ApiErrorCode["FILE_UPLOAD_ERROR"] = "FILE_UPLOAD_ERROR";
})(ApiErrorCode || (exports.ApiErrorCode = ApiErrorCode = {}));
/**
 * Helper functions to create standardized responses
 */
class ApiResponse {
    static success(data, message = 'Operation successful', service = 'CBC-API') {
        return {
            success: true,
            message,
            data,
            timestamp: new Date().toISOString(),
            service,
        };
    }
    static error(message, code = ApiErrorCode.INTERNAL_SERVER_ERROR, details, field, service = 'CBC-API', requestId) {
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
    static paginated(data, pagination, message = 'Data retrieved successfully', service = 'CBC-API') {
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
exports.ApiResponse = ApiResponse;
exports.default = ApiResponse;
//# sourceMappingURL=api-response.types.js.map