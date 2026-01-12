/**
 * Error handling middleware for Express applications
 */
import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../logger';

const logger = createLogger('ErrorMiddleware');

/**
 * Custom error class with status code
 */
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  errors?: Record<string, any>;

  constructor(message: string, statusCode: number = 500, errors?: Record<string, any>) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const appError = err as AppError;
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
  } else if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Unauthorized';
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403;
    message = 'Forbidden';
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    message = 'Resource Not Found';
  } else if ((err as any).code === 'ECONNREFUSED') {
    statusCode = 503;
    message = 'Service Unavailable';
  }

  // Don't expose internal error details in production
  const response: Record<string, any> = {
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

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
