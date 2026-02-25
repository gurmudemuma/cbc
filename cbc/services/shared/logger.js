"use strict";
/**
 * Centralized Logging Service using Winston
 * Provides structured logging with different levels and transports
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logError = exports.logFabricOperation = exports.httpLogger = exports.logger = exports.createLogger = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
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
winston_1.default.addColors(colors);
// Determine log level based on environment
const level = () => {
    const env = process.env.NODE_ENV || 'development';
    const isDevelopment = env === 'development';
    return isDevelopment ? 'debug' : 'info';
};
// Define log format
const format = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.splat(), winston_1.default.format.json());
// Console format with colors
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.colorize({ all: true }), winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.printf((info) => {
    const { timestamp, level, message, service, ...meta } = info;
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${service || 'app'}] ${level}: ${message} ${metaStr}`;
}));
// Define transports
const transports = [
    // Console transport
    new winston_1.default.transports.Console({
        format: consoleFormat,
    }),
    // Error log file
    new winston_1.default.transports.File({
        filename: path_1.default.join(process.cwd(), 'logs', 'error.log'),
        level: 'error',
        format,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    }),
    // Combined log file
    new winston_1.default.transports.File({
        filename: path_1.default.join(process.cwd(), 'logs', 'combined.log'),
        format,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    }),
];
// Create logger instance
const Logger = winston_1.default.createLogger({
    level: level(),
    levels,
    format,
    transports,
    exitOnError: false,
});
/**
 * Create a child logger with service context
 */
const createLogger = (serviceName) => {
    return Logger.child({ service: serviceName });
};
exports.createLogger = createLogger;
/**
 * Default logger instance
 */
exports.logger = Logger;
/**
 * Express middleware for HTTP request logging
 */
const httpLogger = (serviceName) => {
    const serviceLogger = (0, exports.createLogger)(serviceName);
    return (req, res, next) => {
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
            }
            else {
                serviceLogger.http('HTTP Request', logData);
            }
        });
        next();
    };
};
exports.httpLogger = httpLogger;
/**
 * Log Fabric Gateway operations
 */
const logFabricOperation = (logger, operation, data) => {
    logger.info(`Fabric Operation: ${operation}`, {
        operation,
        ...data,
    });
};
exports.logFabricOperation = logFabricOperation;
/**
 * Log errors with context
 */
const logError = (logger, error, context) => {
    logger.error('Error occurred', {
        message: error.message,
        stack: error.stack,
        ...context,
    });
};
exports.logError = logError;
exports.default = exports.logger;
//# sourceMappingURL=logger.js.map