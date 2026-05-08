/**
 * Standardized Error Codes
 * Best Practice: Consistent error handling across the application
 */
export declare enum ErrorCode {
    VALIDATION_FAILED = "ERR_1000",
    INVALID_INPUT = "ERR_1001",
    MISSING_REQUIRED_FIELD = "ERR_1002",
    AUTHENTICATION_FAILED = "ERR_2000",
    INVALID_CREDENTIALS = "ERR_2001",
    TOKEN_EXPIRED = "ERR_2002",
    TOKEN_INVALID = "ERR_2003",
    UNAUTHORIZED = "ERR_3000",
    INSUFFICIENT_PERMISSIONS = "ERR_3001",
    NOT_FOUND = "ERR_4001",
    BLOCKCHAIN_UNAVAILABLE = "ERR_4000",
    TRANSACTION_FAILED = "ERR_4002",
    MVCC_CONFLICT = "ERR_4005",
    EXPORT_NOT_FOUND = "ERR_5000",
    EXPORT_ALREADY_EXISTS = "ERR_5001",
    INVALID_STATUS_TRANSITION = "ERR_5002",
    INTERNAL_SERVER_ERROR = "ERR_11000",
    SERVICE_UNAVAILABLE = "ERR_11001",
    CIRCUIT_BREAKER_OPEN = "ERR_11007"
}
export declare class AppError extends Error {
    code: ErrorCode;
    message: string;
    httpStatus: number;
    retryable: boolean;
    details?: any;
    constructor(code: ErrorCode, message: string, httpStatus?: number, retryable?: boolean, details?: any);
}
export declare const createError: (code: ErrorCode, message: string, httpStatus?: number, retryable?: boolean) => AppError;
//# sourceMappingURL=error-codes.d.ts.map