import { Pool } from 'pg';
import { createLogger } from '../logger';

const logger = createLogger('DatabasePool');

<<<<<<< HEAD
export let pool: any = null;
=======
export let pool: Pool | null = null;
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665

/**
 * Initialize the PostgreSQL connection pool
 * Should be called once at application startup
 */
<<<<<<< HEAD
export function initializePool(): any {
=======
export function initializePool(): Pool {
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
  if (pool) {
    logger.info('Database pool already initialized, returning existing instance');
    return pool;
  }

  // Support both DATABASE_URL and individual connection parameters
  const databaseUrl = process.env.DATABASE_URL;
  
  let poolConfig: any;

  if (databaseUrl) {
    // Use DATABASE_URL if provided
    poolConfig = {
      connectionString: databaseUrl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };
  } else {
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

  pool = new Pool(poolConfig);

<<<<<<< HEAD
  pool.on('error', (err: any) => {
=======
  pool.on('error', (err) => {
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
    logger.error('Unexpected error on idle client', { error: err });
  });

  logger.info('Database pool initialized', {
    maxConnections: 20,
    idleTimeout: 30000,
  });

  return pool;
}

/**
 * Get the existing database pool
 * If pool doesn't exist, initializes it
 */
<<<<<<< HEAD
export function getPool(): any {
=======
export function getPool(): Pool {
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
  if (!pool) {
    return initializePool();
  }
  return pool;
}

/**
 * Close the database pool
 * Should be called during graceful shutdown
 */
export async function closePool(): Promise<void> {
  if (pool) {
    try {
      await pool.end();
      pool = null;
      logger.info('Database pool closed successfully');
    } catch (error) {
      logger.error('Error closing database pool', { error });
      throw error;
    }
  }
}

/**
 * Get pool statistics
 * Useful for monitoring and debugging
 */
export function getPoolStats() {
  if (!pool) {
    return null;
  }

  return {
    totalConnections: pool.totalCount,
    idleConnections: pool.idleCount,
    waitingRequests: pool.waitingCount,
  };
}
