/**
 * Frontend Logging Utility
 * Provides structured logging with environment-aware behavior
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
    level: LogLevel;
    message: string;
    data?: any;
    timestamp: string;
}

class Logger {
    private isDevelopment: boolean;
    private serviceName: string;

    constructor(serviceName: string = 'CBC-Frontend') {
        this.isDevelopment = process.env.NODE_ENV === 'development' || false;
        this.serviceName = serviceName;
    }

    private log(level: LogLevel, message: string, data?: any): void {
        // Only log in development mode
        if (!this.isDevelopment && level !== 'error') {
            return;
        }

        const entry: LogEntry = {
            level,
            message,
            data,
            timestamp: new Date().toISOString(),
        };

        const prefix = `[${this.serviceName}] [${level.toUpperCase()}]`;

        switch (level) {
            case 'debug':
                console.debug(prefix, message, data || '');
                break;
            case 'info':
                console.info(prefix, message, data || '');
                break;
            case 'warn':
                console.warn(prefix, message, data || '');
                break;
            case 'error':
                console.error(prefix, message, data || '');
                // In production, could send to error tracking service
                if (!this.isDevelopment) {
                    // TODO: Send to error tracking service
                }
                break;
        }
    }

    /**
     * Log debug information (development only)
     */
    debug(message: string, data?: any): void {
        this.log('debug', message, data);
    }

    /**
     * Log informational messages (development only)
     */
    info(message: string, data?: any): void {
        this.log('info', message, data);
    }

    /**
     * Log warnings (development only)
     */
    warn(message: string, data?: any): void {
        this.log('warn', message, data);
    }

    /**
     * Log errors (always logged, even in production)
     */
    error(message: string, error?: any): void {
        this.log('error', message, error);
    }
}

// Export singleton instance
export const logger = new Logger();

// Export factory for creating named loggers
export function createLogger(name: string): Logger {
    return new Logger(name);
}

export default logger;
