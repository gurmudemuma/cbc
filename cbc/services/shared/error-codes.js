"use strict";
/**
 * Standardized Error Codes
 * Best Practice: Consistent error handling across the application
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createError = exports.AppError = exports.ErrorCode = void 0;
var ErrorCode;
(function (ErrorCode) {
    // Validation Errors (1000-1999)
    ErrorCode["VALIDATION_FAILED"] = "ERR_1000";
    ErrorCode["INVALID_INPUT"] = "ERR_1001";
    ErrorCode["MISSING_REQUIRED_FIELD"] = "ERR_1002";
    // Authentication Errors (2000-2999)
    ErrorCode["AUTHENTICATION_FAILED"] = "ERR_2000";
    ErrorCode["INVALID_CREDENTIALS"] = "ERR_2001";
    ErrorCode["TOKEN_EXPIRED"] = "ERR_2002";
    ErrorCode["TOKEN_INVALID"] = "ERR_2003";
    // Authorization Errors (3000-3999)
    ErrorCode["UNAUTHORIZED"] = "ERR_3000";
    ErrorCode["INSUFFICIENT_PERMISSIONS"] = "ERR_3001";
    // Resource Errors (4000-4999)
    ErrorCode["NOT_FOUND"] = "ERR_4001";
    // Blockchain Errors (5000-5999)
    ErrorCode["BLOCKCHAIN_UNAVAILABLE"] = "ERR_4000";
    ErrorCode["TRANSACTION_FAILED"] = "ERR_4002";
    ErrorCode["MVCC_CONFLICT"] = "ERR_4005";
    // Export Business Rules (5000-5999)
    ErrorCode["EXPORT_NOT_FOUND"] = "ERR_5000";
    ErrorCode["EXPORT_ALREADY_EXISTS"] = "ERR_5001";
    ErrorCode["INVALID_STATUS_TRANSITION"] = "ERR_5002";
    // System Errors (11000-11999)
    ErrorCode["INTERNAL_SERVER_ERROR"] = "ERR_11000";
    ErrorCode["SERVICE_UNAVAILABLE"] = "ERR_11001";
    ErrorCode["CIRCUIT_BREAKER_OPEN"] = "ERR_11007";
})(ErrorCode || (exports.ErrorCode = ErrorCode = {}));
class AppError extends Error {
    constructor(code, message, httpStatus = 500, retryable = false, details) {
        super(message);
        this.code = code;
        this.message = message;
        this.httpStatus = httpStatus;
        this.retryable = retryable;
        this.details = details;
        this.name = 'AppError';
    }
}
exports.AppError = AppError;
const createError = (code, message, httpStatus = 500, retryable = false) => {
    return new AppError(code, message, httpStatus, retryable);
};
exports.createError = createError;
//# sourceMappingURL=error-codes.js.map