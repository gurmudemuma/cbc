/**
 * Unified Response Handler Middleware
 * Ensures all API responses follow the same format
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createSuccessResponse, createErrorResponse, ErrorCode } from '../types/error.types';

// Extend Express Response to include custom methods
declare global {
  namespace Express {
    interface Response {
      sendSuccess<T>(data?: T, message?: string, statusCode?: number): void;
      sendError(
        code: ErrorCode,
        customMessage?: string,
        details?: Record<string, any>,
        statusCode?: number
      ): void;
    }
  }
}

/**
 * Add request ID to all requests
 */
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestId = (req.headers['x-request-id'] as string) || uuidv4();
  res.setHeader('x-request-id', requestId);
  (req as any).requestId = requestId;
  next();
};

/**
 * Add response helper methods
 */
export const responseHandlerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestId = (req as any).requestId;

  /**
   * Send success response
   */
  res.sendSuccess = function <T>(data?: T, message?: string, statusCode: number = 200) {
    const response = createSuccessResponse(data, message, requestId);
    this.status(statusCode).json(response);
  };

  /**
   * Send error response
   */
  res.sendError = function (
    code: ErrorCode,
    customMessage?: string,
    details?: Record<string, any>,
    statusCode?: number
  ) {
    const response = createErrorResponse(code, customMessage, details, requestId);
    const status = statusCode || response.error.statusCode;
    this.status(status).json(response);
  };

  next();
};

/**
 * Global error handler
 */
export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const requestId = (req as any).requestId;

  console.error('Error:', {
    requestId,
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    const messages = err.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
    return res.sendError(ErrorCode.INVALID_INPUT, `Validation failed: ${messages}`, {
      errors: err.errors,
    });
  }

  // Handle blockchain errors
  if (err.message?.includes('blockchain') || err.message?.includes('contract')) {
    return res.sendError(
      ErrorCode.BLOCKCHAIN_ERROR,
      'A blockchain error occurred. Please try again.',
      { originalError: err.message }
    );
  }

  // Handle database errors
  if (err.message?.includes('database') || err.message?.includes('query')) {
    return res.sendError(ErrorCode.DATABASE_ERROR, 'A database error occurred. Please try again.', {
      originalError: err.message,
    });
  }

  // Handle IPFS errors
  if (err.message?.includes('ipfs') || err.message?.includes('upload')) {
    return res.sendError(ErrorCode.IPFS_ERROR, 'An IPFS error occurred. Please try again.', {
      originalError: err.message,
    });
  }

  // Handle timeout errors
  if (err.code === 'ETIMEDOUT' || err.message?.includes('timeout')) {
    return res.sendError(ErrorCode.TIMEOUT, 'The request timed out. Please try again.', {
      originalError: err.message,
    });
  }

  // Default error
  res.sendError(ErrorCode.INTERNAL_ERROR, 'An unexpected error occurred. Please try again later.', {
    originalError: err.message,
  });
};

/**
 * 404 handler
 */
export const notFoundHandler = (req: Request, res: Response) => {
  res.sendError(ErrorCode.NOT_FOUND, `The requested resource ${req.path} was not found.`, {
    path: req.path,
    method: req.method,
  });
};

/**
 * Async error wrapper
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Validation middleware factory
 */
export const validateRequest = (schema: any) => {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const messages = error.errors
          .map((e: any) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        return res.sendError(ErrorCode.INVALID_INPUT, `Validation failed: ${messages}`, {
          errors: error.errors,
        });
      }
      next(error);
    }
  });
};

/**
 * Validation middleware factory for query parameters
 */
export const validateQuery = (schema: any) => {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated as any;
      next();
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const messages = error.errors
          .map((e: any) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        return res.sendError(ErrorCode.INVALID_INPUT, `Query validation failed: ${messages}`, {
          errors: error.errors,
        });
      }
      next(error);
    }
  });
};

/**
 * Validation middleware factory for URL parameters
 */
export const validateParams = (schema: any) => {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.params);
      req.params = validated as any;
      next();
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const messages = error.errors
          .map((e: any) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        return res.sendError(ErrorCode.INVALID_INPUT, `Parameter validation failed: ${messages}`, {
          errors: error.errors,
        });
      }
      next(error);
    }
  });
};
