/**
 * Hybrid Data Service Routes
 * Provides endpoints for monitoring and managing hybrid PostgreSQL + Blockchain operations
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const hybridDataService = require('../services/hybrid-data-service');

/**
 * Get hybrid service statistics
 * Shows write/read counts and sync status
 */
router.get('/stats', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const stats = hybridDataService.getStats();
    
    res.json({
      success: true,
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
    
    const health = {
      status: 'healthy',
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
    
    // Determine health status
    if (health.errorRate > 0.5) {
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
