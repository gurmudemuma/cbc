/**
 * PostgreSQL Service
 * Fast query layer for read operations
 * Fabric/CouchDB remains source of truth for writes
 */

const { Pool } = require('pg');

// Connection pool configuration
const pool = new Pool({
  host: process.env.POSTGRES_HOST || process.env.DB_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'coffee_export_db',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return error after 10 seconds if connection not available
  statement_timeout: 30000, // Statement timeout 30 seconds
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

/**
 * Generic query function
 */
async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`[PostgreSQL] Query executed in ${duration}ms`);
    return result;
  } catch (error) {
    console.error('[PostgreSQL] Query error:', error);
    throw error;
  }
}

// ==================== User Management ====================

/**
 * Get user by username (FAST)
 */
async function getUser(username) {
  const result = await query(
    'SELECT * FROM users WHERE username = $1',
    [username]
  );
  return result.rows[0];
}

/**
 * Get user by email
 */
async function getUserByEmail(email) {
  const result = await query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0];
}

/**
 * Get users by role
 */
async function getUsersByRole(role) {
  const result = await query(
    'SELECT * FROM users WHERE role = $1 ORDER BY created_at DESC',
    [role]
  );
  return result.rows;
}

/**
 * Get users by status
 */
async function getUsersByStatus(status) {
  const result = await query(
    'SELECT * FROM users WHERE status = $1 ORDER BY created_at DESC',
    [status]
  );
  return result.rows;
}

/**
 * Get pending users (for approval)
 */
async function getPendingUsers() {
  const result = await query(
    `SELECT * FROM users 
     WHERE status = 'pending_approval' 
     ORDER BY created_at ASC`
  );
  return result.rows;
}

/**
 * Search users (for admin dashboard)
 */
async function searchUsers(searchTerm) {
  const result = await query(
    `SELECT * FROM users 
     WHERE username ILIKE $1 
        OR email ILIKE $1 
        OR company_name ILIKE $1
     ORDER BY created_at DESC
     LIMIT 50`,
    [`%${searchTerm}%`]
  );
  return result.rows;
}

// ==================== Analytics ====================

/**
 * Get dashboard statistics
 */
async function getDashboardStats() {
  const result = await query(`
    SELECT 
      COUNT(*) as total_users,
      COUNT(*) FILTER (WHERE status = 'approved') as approved_users,
      COUNT(*) FILTER (WHERE status = 'pending_approval') as pending_users,
      COUNT(*) FILTER (WHERE status = 'rejected') as rejected_users,
      COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as new_this_week,
      COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_this_month,
      COUNT(*) FILTER (WHERE role = 'exporter') as total_exporters,
      COUNT(*) FILTER (WHERE role = 'admin') as total_admins
    FROM users
  `);
  return result.rows[0];
}

/**
 * Get user registration trends
 */
async function getRegistrationTrends(days = 30) {
  const result = await query(`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as registrations,
      COUNT(*) FILTER (WHERE status = 'approved') as approved,
      COUNT(*) FILTER (WHERE status = 'pending_approval') as pending
    FROM users
    WHERE created_at > NOW() - INTERVAL '${days} days'
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `);
  return result.rows;
}

/**
 * Get user activity summary
 */
async function getUserActivitySummary() {
  const result = await query(`
    SELECT 
      role,
      status,
      COUNT(*) as count
    FROM users
    GROUP BY role, status
    ORDER BY role, status
  `);
  return result.rows;
}

// ==================== Shipment Queries ====================

/**
 * Get shipments by exporter
 */
async function getShipmentsByExporter(exporterId, limit = 50) {
  const result = await query(
    `SELECT * FROM shipments 
     WHERE exporter_id = $1 
     ORDER BY created_at DESC 
     LIMIT $2`,
    [exporterId, limit]
  );
  return result.rows;
}

/**
 * Get shipment by ID
 */
async function getShipment(shipmentId) {
  const result = await query(
    'SELECT * FROM shipments WHERE id = $1',
    [shipmentId]
  );
  return result.rows[0];
}

/**
 * Get shipments by status
 */
async function getShipmentsByStatus(status, limit = 100) {
  const result = await query(
    `SELECT * FROM shipments 
     WHERE status = $1 
     ORDER BY created_at DESC 
     LIMIT $2`,
    [status, limit]
  );
  return result.rows;
}

// ==================== Health Check ====================

/**
 * Check PostgreSQL connection health
 */
async function healthCheck() {
  try {
    const result = await query('SELECT NOW() as current_time');
    return {
      status: 'healthy',
      timestamp: result.rows[0].current_time,
      pool: {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}

/**
 * Get database statistics
 */
async function getDatabaseStats() {
  const result = await query(`
    SELECT 
      schemaname,
      tablename,
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
      n_live_tup as row_count
    FROM pg_stat_user_tables
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
  `);
  return result.rows;
}

// ==================== Graceful Shutdown ====================

/**
 * Close pool connections
 */
async function close() {
  await pool.end();
  console.log('[PostgreSQL] Connection pool closed');
}

// Handle process termination
process.on('SIGTERM', close);
process.on('SIGINT', close);

module.exports = {
  query,
  // User management
  getUser,
  getUserByEmail,
  getUsersByRole,
  getUsersByStatus,
  getPendingUsers,
  searchUsers,
  // Analytics
  getDashboardStats,
  getRegistrationTrends,
  getUserActivitySummary,
  // Shipments
  getShipmentsByExporter,
  getShipment,
  getShipmentsByStatus,
  // Health
  healthCheck,
  getDatabaseStats,
  close
};
