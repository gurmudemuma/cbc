"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.notFoundHandler = exports.errorHandler = exports.AppError = void 0;
const logger_1 = require("../logger");
const logger = (0, logger_1.createLogger)('ErrorMiddleware');
/**
 * Custom error class with status code
 */
class AppError extends Error {
    constructor(message, statusCode = 500, errors) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        this.errors = errors;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, _next) => {
    const appError = err;
    let statusCode = appError.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    // Log error for debugging
    logger.error('Request error occurred', {
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        statusCode,
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
    // Handle specific error types
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation Error';
    }
    else if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Unauthorized';
    }
    else if (err.name === 'ForbiddenError') {
        statusCode = 403;
        message = 'Forbidden';
    }
    else if (err.name === 'NotFoundError') {
        statusCode = 404;
        message = 'Resource Not Found';
    }
    else if (err.code === 'ECONNREFUSED') {
        statusCode = 503;
        message = 'Service Unavailable';
    }
    // Don't expose internal error details in production
    const response = {
        success: false,
        message,
    };
    // Include error details in development
    if (process.env.NODE_ENV === 'development') {
        response.error = {
            message: err.message,
            stack: err.stack,
            ...(appError.errors && { details: appError.errors }),
        };
    }
    res.status(statusCode).json(response);
};
exports.errorHandler = errorHandler;
/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, _res, next) => {
    const error = new AppError(`Route ${req.originalUrl} not found`, 404);
    next(error);
};
exports.notFoundHandler = notFoundHandler;
/**
 * Async handler wrapper to catch errors in async route handlers
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
//# sourceMappingURL=error.middleware.js.map