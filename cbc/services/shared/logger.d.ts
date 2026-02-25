/**
 * Centralized Logging Service using Winston
 * Provides structured logging with different levels and transports
 */
import winston from 'winston';
/**
 * Create a child logger with service context
 */
export declare const createLogger: (serviceName: string) => winston.Logger;
/**
 * Default logger instance
 */
export declare const logger: winston.Logger;
/**
 * Express middleware for HTTP request logging
 */
export declare const httpLogger: (serviceName: string) => (req: any, res: any, next: any) => void;
/**
 * Log Fabric Gateway operations
 */
export declare const logFabricOperation: (logger: winston.Logger, operation: string, data?: any) => void;
/**
 * Log errors with context
 */
export declare const logError: (logger: winston.Logger, error: Error, context?: any) => void;
export default logger;
//# sourceMappingURL=logger.d.ts.map