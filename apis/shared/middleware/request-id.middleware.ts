/**
 * Request ID Middleware
 * Generates unique request IDs for tracing
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Middleware to add request ID to all requests
 * Useful for tracing requests through logs
 */
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Check if request ID already exists (from upstream proxy)
  const requestId =
    (req.headers['x-request-id'] as string) ||
    (req.headers['x-correlation-id'] as string) ||
    uuidv4();

  // Attach to request
  (req as any).requestId = requestId;

  // Add to response headers
  res.setHeader('X-Request-ID', requestId);

  next();
};
