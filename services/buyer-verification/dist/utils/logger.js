"use strict";
/**
 * Logger utility for buyer-verification service
 * Uses shared logger pattern consistent with the monorepo
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.logger = {
    info: (message, ...args) => {
        console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...args);
    },
    error: (message, ...args) => {
        console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, ...args);
    },
    warn: (message, ...args) => {
        console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...args);
    },
    debug: (message, ...args) => {
        if (process.env.NODE_ENV === 'development' || process.env.LOG_LEVEL === 'debug') {
            console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, ...args);
        }
    },
};
exports.default = exports.logger;
//# sourceMappingURL=logger.js.map