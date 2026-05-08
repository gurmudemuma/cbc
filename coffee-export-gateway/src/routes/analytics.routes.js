/**
 * Analytics Routes
 * Leverages PostgreSQL for fast analytics and reporting
 */

const express = require('express');
const router = express.Router();
const postgresService = require('../services/postgres');
const { authenticateToken } = require('../middleware/auth');

/**
 * Dashboard statistics
 * GET /api/analytics/dashboard
 */
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const stats = await postgresService.getDashboardStats();
    res.json({
      success: true,
      data: stats,
      source: 'postgresql',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Analytics] Dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard statistics'
    });
  }
});

/**
 * Registration trends
 * GET /api/analytics/trends/registrations?days=30
 */
router.get('/trends/registrations', authenticateToken, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const trends = await postgresService.getRegistrationTrends(days);
    
    res.json({
      success: true,
      data: trends,
      period: `${days} days`,
      source: 'postgresql',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Analytics] Registration trends error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch registration trends'
    });
  }
});

/**
 * User activity summary
 * GET /api/analytics/users/activity
 */
router.get('/users/activity', authenticateToken, async (req, res) => {
  try {
    const activity = await postgresService.getUserActivitySummary();
    
    res.json({
      success: true,
      data: activity,
      source: 'postgresql',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Analytics] User activity error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user activity'
    });
  }
});

/**
 * Database health and statistics
 * GET /api/analytics/database/health
 */
router.get('/database/health', authenticateToken, async (req, res) => {
  try {
    const health = await postgresService.healthCheck();
    const stats = await postgresService.getDatabaseStats();
    
    res.json({
      success: true,
      health,
      statistics: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Analytics] Database health error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch database health'
    });
  }
});

/**
 * Performance comparison
 * GET /api/analytics/performance/compare
 * Compares query performance between PostgreSQL and Fabric
 */
router.get('/performance/compare', authenticateToken, async (req, res) => {
  try {
    const username = req.query.username || 'admin';
    
    // Time PostgreSQL query
    const pgStart = Date.now();
    const pgUser = await postgresService.getUser(username);
    const pgDuration = Date.now() - pgStart;
    
    // Time Fabric query
    const fabricService = require('../services/fabric');
    const fabricStart = Date.now();
    let fabricUser, fabricDuration;
    try {
      fabricUser = await fabricService.getUser(username);
      fabricDuration = Date.now() - fabricStart;
    } catch (error) {
      fabricDuration = 'error';
    }
    
    res.json({
      success: true,
      comparison: {
        postgresql: {
          duration_ms: pgDuration,
          found: !!pgUser
        },
        fabric: {
          duration_ms: fabricDuration,
          found: !!fabricUser
        },
        speedup: fabricDuration !== 'error' ? 
          `${(fabricDuration / pgDuration).toFixed(1)}x faster` : 
          'N/A'
      },
      recommendation: 'Use PostgreSQL for read operations',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Analytics] Performance comparison error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to compare performance'
    });
  }
});

/**
 * Custom query endpoint (admin only)
 * POST /api/analytics/query
 * Body: { query: "SELECT ...", params: [] }
 */
router.post('/query', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    const { query, params = [] } = req.body;
    
    // Security: Only allow SELECT queries
    if (!query.trim().toUpperCase().startsWith('SELECT')) {
      return res.status(400).json({
        success: false,
        error: 'Only SELECT queries are allowed'
      });
    }
    
    const result = await postgresService.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      rowCount: result.rowCount,
      source: 'postgresql',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Analytics] Custom query error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
