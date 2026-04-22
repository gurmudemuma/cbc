const express = require('express');
const router = express.Router();
const fabricService = require('../services'); // Use service loader for consistent Fabric implementation
const { authenticateToken, requireRole } = require('../middleware/auth');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.POSTGRES_HOST || process.env.DB_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'coffee_export_db',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
});

/**
 * Phase 4: Customs Routes
 * Handles customs declarations and clearance
 */

/**
 * GET /api/customs/declarations
 * Get all customs declarations
 */
router.get('/declarations', authenticateToken, requireRole('customs', 'admin'), async (req, res) => {
  try {
    const query = `
      SELECT 
        export_id,
        exporter_id,
        status,
        coffee_type,
        quantity,
        destination_country,
        created_at,
        updated_at
      FROM exports
      WHERE status IN ('PENDING', 'APPROVED', 'IN_TRANSIT')
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      declarations: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Customs declarations error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create customs declaration
router.post('/declaration', async (req, res) => {
    try {
        const result = await fabricService.createCustomsDeclaration(req.body);
        res.json(result);
    } catch (error) {
        console.error('Error creating customs declaration:', error);
        res.status(500).json({ error: error.message });
    }
});

// Submit customs declaration
router.post('/declaration/:declarationId/submit', async (req, res) => {
    try {
        const { declarationId } = req.params;
        const result = await fabricService.submitCustomsDeclaration(declarationId);
        res.json(result);
    } catch (error) {
        console.error('Error submitting customs declaration:', error);
        res.status(500).json({ error: error.message });
    }
});

// Review customs declaration (Customs officer only)
router.post('/declaration/:declarationId/review', async (req, res) => {
    try {
        const { declarationId } = req.params;
        const result = await fabricService.reviewCustomsDeclaration(declarationId, req.body);
        res.json(result);
    } catch (error) {
        console.error('Error reviewing customs declaration:', error);
        res.status(500).json({ error: error.message });
    }
});

// Clear customs (Customs officer only)
router.post('/declaration/:declarationId/clear', async (req, res) => {
    try {
        const { declarationId } = req.params;
        const result = await fabricService.clearCustoms(declarationId, req.body);
        res.json(result);
    } catch (error) {
        console.error('Error clearing customs:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get customs declaration
router.get('/declaration/:declarationId', async (req, res) => {
    try {
        const { declarationId } = req.params;
        const result = await fabricService.getCustomsDeclaration(declarationId);
        res.json(result);
    } catch (error) {
        console.error('Error getting customs declaration:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
