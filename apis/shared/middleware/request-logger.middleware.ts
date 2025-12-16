/// <reference path="../../types/express.d.ts" />
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../logger';

/**
 * Request Logging Middleware
 * Logs all API requests and responses for monitoring and debugging
 */

export interface RequestLog {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  query: Record<string, any>;
  headers: Record<string, string>;
  body: Record<string, any>;
  userId?: string;
  username?: string;
  ip: string;
  userAgent: string;
  statusCode: number;
  responseTime: number;
  responseSize: number;
  error?: string;
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `${Date.now()} -${Math.random().toString(36).substr(2, 9)} `;
}

/**
 * Request logging middleware
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const requestId = generateRequestId();
  const startTime = Date.now();

  // Store request ID in request object
  req.id = requestId;

  // Log request
  const requestLog: Partial<RequestLog> = {
    id: requestId,
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    query: req.query,
    headers: sanitizeHeaders(req.headers),
    body: sanitizeBody(req.body),
    userId: req.user?.id,
    username: req.user?.username,
    ip: (req.ip || (req.connection && req.connection.remoteAddress) || '') as string,
    userAgent: req.get('user-agent') || 'Unknown',
  };

  logger.info('REQUEST', requestLog);

  // Intercept response
  const originalSend = res.send;
  let responseBody: any;

  res.send = function (data: any) {
    responseBody = data;
    return originalSend.call(this, data);
  };

  // Log response
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    const responseSize = Buffer.byteLength(JSON.stringify(responseBody || ''));

    const responseLog: RequestLog = {
      id: requestId,
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      query: req.query,
      headers: sanitizeHeaders(req.headers),
      body: sanitizeBody(req.body),
      userId: req.user?.id,
      username: req.user?.username,
      ip: (req.ip || (req.connection && req.connection.remoteAddress) || '') as string,
      userAgent: req.get('user-agent') || 'Unknown',
      statusCode: res.statusCode,
      responseTime,
      responseSize,
    };

    // Add error if status code indicates error
    if (res.statusCode >= 400) {
      try {
        const parsed = typeof responseBody === 'string' ? JSON.parse(responseBody) : responseBody;
        responseLog.error = parsed.message || parsed.error;
      } catch (e) {
        responseLog.error = responseBody;
      }
    }

    logger.info('RESPONSE', responseLog);

    // Log slow requests
    if (responseTime > 5000) {
      console.warn('[SLOW_REQUEST]', {
        id: requestId,
        method: req.method,
        path: req.path,
        responseTime: `${responseTime} ms`,
      });
    }
  });

  next();
};

/**
 * Sanitize headers for logging
 */
function sanitizeHeaders(headers: Record<string, any>): Record<string, string> {
  const sanitized: Record<string, string> = {};
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];

  Object.keys(headers).forEach((key) => {
    if (sensitiveHeaders.includes(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = String(headers[key]);
    }
  });

  return sanitized;
}

/**
 * Sanitize body for logging
 */
function sanitizeBody(body: Record<string, any>): Record<string, any> {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sanitized = { ...body };
  const sensitiveFields = [
    'password',
    'pin',
    'token',
    'secret',
    'apiKey',
    'creditCard',
    'ssn',
    'tin',
  ];

  Object.keys(sanitized).forEach((key) => {
    if (sensitiveFields.some((field) => key.toLowerCase().includes(field.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    }
  });

  return sanitized;
}

/**
 * Error logging middleware
 */
export const errorLogger = (err: any, req: Request, res: Response, next: NextFunction) => {
  const errorLog = {
    id: req.id || generateRequestId(),
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    userId: req.user?.id,
    username: req.user?.username,
    ip: req.ip,
    error: {
      message: err.message,
      code: err.code,
      statusCode: err.statusCode || 500,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    },
  };

  console.error('[ERROR]', JSON.stringify(errorLog));

  next(err);
};

/**
 * Performance logging middleware
 */
export const performanceLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = process.hrtime.bigint();

  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

    const performanceLog = {
      id: req.id || generateRequestId(),
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      duration: `${duration.toFixed(2)} ms`,
      statusCode: res.statusCode,
      userId: req.user?.id,
    };

    // Log if duration exceeds threshold
    if (duration > 1000) {
      console.warn('[PERFORMANCE]', JSON.stringify(performanceLog));
    }
  });

  next();
};

/**
 * Request ID middleware
 */
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestId = req.get('x-request-id') || generateRequestId();
  req.id = requestId;
  res.setHeader('x-request-id', requestId);
  next();
};

/**
 * Audit trail middleware
 */
export const auditTrailMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Only log state-changing operations
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const auditLog = {
      id: req.id || generateRequestId(),
      timestamp: new Date().toISOString(),
      operation: req.method,
      path: req.path,
      userId: req.user?.id,
      username: req.user?.username,
      ip: req.ip,
      body: sanitizeBody(req.body),
    };

    logger.info('AUDIT', auditLog);
  }

  next();
};

/**
 * Security logging middleware
 */
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  // Log authentication attempts
  if (req.path.includes('/auth/login') || req.path.includes('/auth/register')) {
    const securityLog = {
      id: req.id || generateRequestId(),
      timestamp: new Date().toISOString(),
      event: req.path.includes('/login') ? 'LOGIN_ATTEMPT' : 'REGISTRATION_ATTEMPT',
      ip: req.ip,
      userAgent: req.get('user-agent'),
      username: req.body?.username,
    };

    logger.warn('SECURITY', securityLog);
  }

  // Log failed authentication
  res.on('finish', () => {
    if (res.statusCode === 401 || res.statusCode === 403) {
      const securityLog = {
        id: req.id || generateRequestId(),
        timestamp: new Date().toISOString(),
        event: res.statusCode === 401 ? 'AUTH_FAILED' : 'FORBIDDEN_ACCESS',
        method: req.method,
        path: req.path,
        ip: req.ip,
        userId: req.user?.id,
        statusCode: res.statusCode,
      };

      console.warn('[SECURITY]', JSON.stringify(securityLog));
    }
  });

  next();
};

/**
 * Combine all logging middleware
 */
export const setupLogging = () => {
  return [
    requestIdMiddleware,
    requestLogger,
    performanceLogger,
    auditTrailMiddleware,
    securityLogger,
  ];
};
