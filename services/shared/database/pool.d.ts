import { Pool } from 'pg';
export declare let pool: Pool | null;
/**
 * Initialize the PostgreSQL connection pool
 * Should be called once at application startup
 */
export declare function initializePool(): Pool;
/**
 * Get the existing database pool
 * If pool doesn't exist, initializes it
 */
export declare function getPool(): Pool;
/**
 * Close the database pool
 * Should be called during graceful shutdown
 */
export declare function closePool(): Promise<void>;
/**
 * Get pool statistics
 * Useful for monitoring and debugging
 */
export declare function getPoolStats(): {
    totalConnections: number;
    idleConnections: number;
    waitingRequests: number;
};
//# sourceMappingURL=pool.d.ts.map