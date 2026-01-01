"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPoolStats = exports.closePool = exports.getPool = exports.initializePool = exports.pool = void 0;
const pg_1 = require("pg");
const logger_1 = require("../logger");
const logger = (0, logger_1.createLogger)('DatabasePool');
exports.pool = null;
/**
 * Initialize the PostgreSQL connection pool
 * Should be called once at application startup
 */
function initializePool() {
    if (exports.pool) {
        logger.info('Database pool already initialized, returning existing instance');
        return exports.pool;
    }
    // Support both DATABASE_URL and individual connection parameters
    const databaseUrl = process.env.DATABASE_URL;
    let poolConfig;
    if (databaseUrl) {
        // Use DATABASE_URL if provided
        poolConfig = {
            connectionString: databaseUrl,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        };
    }
    else {
        // Use individual connection parameters
        const dbHost = process.env.DB_HOST || 'localhost';
        const dbPort = parseInt(process.env.DB_PORT || '5432', 10);
        const dbName = process.env.DB_NAME || 'coffee_export_db';
        const dbUser = process.env.DB_USER || 'postgres';
        const dbPassword = process.env.DB_PASSWORD || 'postgres';
        const dbSsl = process.env.DB_SSL === 'true';
        poolConfig = {
            host: dbHost,
            port: dbPort,
            database: dbName,
            user: dbUser,
            password: dbPassword,
            ssl: dbSsl ? { rejectUnauthorized: false } : false,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        };
        logger.info('Database pool configuration', {
            host: dbHost,
            port: dbPort,
            database: dbName,
            user: dbUser,
            ssl: dbSsl,
        });
    }
    exports.pool = new pg_1.Pool(poolConfig);
    exports.pool.on('error', (err) => {
        logger.error('Unexpected error on idle client', { error: err });
    });
    logger.info('Database pool initialized', {
        maxConnections: 20,
        idleTimeout: 30000,
    });
    return exports.pool;
}
exports.initializePool = initializePool;
/**
 * Get the existing database pool
 * If pool doesn't exist, initializes it
 */
function getPool() {
    if (!exports.pool) {
        return initializePool();
    }
    return exports.pool;
}
exports.getPool = getPool;
/**
 * Close the database pool
 * Should be called during graceful shutdown
 */
async function closePool() {
    if (exports.pool) {
        try {
            await exports.pool.end();
            exports.pool = null;
            logger.info('Database pool closed successfully');
        }
        catch (error) {
            logger.error('Error closing database pool', { error });
            throw error;
        }
    }
}
exports.closePool = closePool;
/**
 * Get pool statistics
 * Useful for monitoring and debugging
 */
function getPoolStats() {
    if (!exports.pool) {
        return null;
    }
    return {
        totalConnections: exports.pool.totalCount,
        idleConnections: exports.pool.idleCount,
        waitingRequests: exports.pool.waitingCount,
    };
}
exports.getPoolStats = getPoolStats;
//# sourceMappingURL=pool.js.map