/**
 * Centralized Logging Service using Winston
 * Provides structured logging with different levels and transports
 */

import winston from 'winston';
import path from 'path';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// Determine log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'info';
};

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format with colors
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    (info) => {
      const { timestamp, level, message, service, ...meta } = info;
      const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
      return `${timestamp} [${service || 'app'}] ${level}: ${message} ${metaStr}`;
    }
  )
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: consoleFormat,
  }),
  // Error log file
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'error.log'),
    level: 'error',
    format,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
  // Combined log file
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'combined.log'),
    format,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
];

// Create logger instance
const Logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  exitOnError: false,
});

/**
 * Create a child logger with service context
 */
export const createLogger = (serviceName: string) => {
  return Logger.child({ service: serviceName });
};

/**
 * Default logger instance
 */
export const logger = Logger;

/**
 * Express middleware for HTTP request logging
 */
export const httpLogger = (serviceName: string) => {
  const serviceLogger = createLogger(serviceName);
  
  return (req: any, res: any, next: any) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const logData = {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
      };
      
      if (res.statusCode >= 400) {
        serviceLogger.warn('HTTP Request', logData);
      } else {
        serviceLogger.http('HTTP Request', logData);
      }
    });
    
    next();
  };
};

/**
 * Log Fabric Gateway operations
 */
export const logFabricOperation = (
  logger: winston.Logger,
  operation: string,
  data?: any
) => {
  logger.info(`Fabric Operation: ${operation}`, {
    operation,
    ...data,
  });
};

/**
 * Log errors with context
 */
export const logError = (
  logger: winston.Logger,
  error: Error,
  context?: any
) => {
  logger.error('Error occurred', {
    message: error.message,
    stack: error.stack,
    ...context,
  });
};

export default logger;
