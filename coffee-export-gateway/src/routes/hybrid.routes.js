/**
 * Hybrid Data Service Routes
 * Provides endpoints for monitoring and managing hybrid PostgreSQL + Blockchain operations
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const hybridDataService = require('../services/hybrid-data-service');

/**
 * GET /api/hybrid/status
 * Get hybrid service status
 */
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const stats = hybridDataService.getStats();
    
    res.json({
      status: 'operational',
      service: 'hybrid-data-service',
      stats: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Hybrid status error:', error);
    res.status(500).json({ 
      status: 'error',
      error: error.message 
    });
  }
});

/**
 * Get hybrid service statistics
 * Shows write/read counts and sync status
 */
router.get('/stats', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const stats = hybridDataService.getStats();
    
    // Get actual record counts from database
    const postgresService = require('../services/postgres');
    const userCountResult = await postgresService.query('SELECT COUNT(*) as count FROM users');
    const postgresRecords = parseInt(userCountResult.rows[0].count);
    
    res.json({
      success: true,
      postgresRecords: postgresRecords,
      blockchainRecords: stats.blockchainWrites, // Approximate based on writes
      stats: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Hybrid Stats] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Trigger background sync for missing records
 * Syncs PostgreSQL records to blockchain
 */
router.post('/sync/:entityType', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { entityType } = req.params;
    
    // Validate entity type
    const validTypes = ['users', 'contracts', 'documents', 'submissions'];
    if (!validTypes.includes(entityType)) {
      return res.status(400).json({ 
        error: 'Invalid entity type',
        validTypes: validTypes
      });
    }
    
    console.log(`[Hybrid Sync] Starting sync for ${entityType}...`);
    
    // Trigger sync
    const results = await hybridDataService.syncMissingRecords(entityType);
    
    res.json({
      success: true,
      entityType: entityType,
      results: results,
      message: `Synced ${results.synced} records, skipped ${results.skipped}, failed ${results.failed}`
    });
  } catch (error) {
    console.error('[Hybrid Sync] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Read user with optional blockchain verification
 * Demonstrates smart read routing
 */
router.get('/user/:username', authenticateToken, async (req, res) => {
  try {
    const { username } = req.params;
    const { verify } = req.query; // ?verify=true to check blockchain
    
    // Temporarily override read source if verification requested
    const originalReadSource = hybridDataService.readSource;
    if (verify === 'true') {
      hybridDataService.readSource = 'both';
    }
    
    const userData = await hybridDataService.readUser(username);
    
    // Restore original setting
    hybridDataService.readSource = originalReadSource;
    
    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      success: true,
      user: userData,
      verified: verify === 'true'
    });
  } catch (error) {
    console.error('[Hybrid Read] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Health check for hybrid service
 */
router.get('/health', async (req, res) => {
  try {
    const stats = hybridDataService.getStats();
    const postgresService = require('../services/postgres');
    
    // Test PostgreSQL connection
    let postgresStatus = 'unknown';
    try {
      await postgresService.query('SELECT 1');
      postgresStatus = 'healthy';
    } catch (error) {
      postgresStatus = 'unhealthy';
    }
    
    // Test Blockchain connection (basic check)
    let blockchainStatus = 'unknown';
    try {
      // If we've had successful blockchain writes, assume healthy
      if (stats.blockchainWrites > 0) {
        blockchainStatus = 'healthy';
      } else {
        blockchainStatus = 'unknown';
      }
    } catch (error) {
      blockchainStatus = 'unhealthy';
    }
    
    const health = {
      status: 'healthy',
      postgres: {
        status: postgresStatus,
        writes: stats.postgresWrites,
        reads: stats.postgresReads
      },
      blockchain: {
        status: blockchainStatus,
        writes: stats.blockchainWrites,
        reads: stats.blockchainReads
      },
      config: stats.config,
      operations: {
        totalWrites: stats.postgresWrites + stats.blockchainWrites,
        totalReads: stats.postgresReads + stats.blockchainReads,
        syncOperations: stats.syncOperations,
        errors: stats.errors
      },
      errorRate: stats.errors / (stats.postgresWrites + stats.blockchainWrites + 1),
      timestamp: new Date().toISOString()
    };
    
    // Determine overall health status
    if (postgresStatus === 'unhealthy' || health.errorRate > 0.5) {
      health.status = 'degraded';
    } else if (health.errorRate > 0.8) {
      health.status = 'unhealthy';
    }
    
    res.json(health);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

module.exports = router;
