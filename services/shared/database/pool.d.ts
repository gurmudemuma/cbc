export declare let pool: any;
/**
 * Initialize the PostgreSQL connection pool
 * Should be called once at application startup
 */
export declare function initializePool(): any;
/**
 * Get the existing database pool
 * If pool doesn't exist, initializes it
 */
export declare function getPool(): any;
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
    totalConnections: any;
    idleConnections: any;
    waitingRequests: any;
};
//# sourceMappingURL=pool.d.ts.map