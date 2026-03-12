const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const postgresService = require('../services/postgres');

// ==================== Buyer Opportunities ====================

/**
 * Create buyer opportunity
 * POST /api/marketplace/opportunities
 */
router.post('/opportunities', authenticateToken, async (req, res) => {
  try {
    const {
      buyerId, title, description, coffeeType, originPreferences,
      qualityGradeMin, quantityMin, quantityMax, frequency,
      contractDurationMonths, preferredPaymentTerms, preferredIncoterms,
      targetPriceMin, targetPriceMax, currency, certificationsRequired,
      qualityStandardsRequired, preferredDeliveryMonths, destinationPort,
      destinationCountry, visibility, validFrom, validUntil
    } = req.body;

    // Validate required fields
    if (!buyerId || !title || !coffeeType || !quantityMin) {
      return res.status(400).json({ 
        error: 'Missing required fields: buyerId, title, coffeeType, quantityMin' 
      });
    }

    const query = `
      INSERT INTO buyer_opportunities (
        buyer_id, title, description, coffee_type, origin_preferences,
        quality_grade_min, quantity_min, quantity_max, frequency,
        contract_duration_months, preferred_payment_terms, preferred_incoterms,
        target_price_min, target_price_max, currency, certifications_required,
        quality_standards_required, preferred_delivery_months, destination_port,
        destination_country, visibility, valid_from, valid_until
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22, $23
      )
      RETURNING opportunity_id, title, status, created_at
    `;

    const result = await postgresService.query(query, [
      buyerId, title, description, coffeeType, originPreferences,
      qualityGradeMin, quantityMin, quantityMax, frequency,
      contractDurationMonths, preferredPaymentTerms, preferredIncoterms,
      targetPriceMin, targetPriceMax, currency || 'USD', certificationsRequired,
      qualityStandardsRequired, preferredDeliveryMonths, destinationPort,
      destinationCountry, visibility || 'PUBLIC', validFrom || new Date(),
      validUntil || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days default
    ]);

    res.json({
      success: true,
      message: 'Opportunity created',
      opportunity: result.rows[0]
    });
  } catch (error) {
    console.error('Opportunity creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * List opportunities
 * GET /api/marketplace/opportunities
 */
router.get('/opportunities', authenticateToken, async (req, res) => {
  try {
    const { coffeeType, country, status, minQuantity, maxPrice } = req.query;

    let query = 'SELECT * FROM v_active_opportunities WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (coffeeType) {
      query += ` AND coffee_type = $${paramCount}`;
      params.push(coffeeType);
      paramCount++;
    }

    if (country) {
      query += ` AND destination_country = $${paramCount}`;
      params.push(country);
      paramCount++;
    }

    if (status) {
      query += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (minQuantity) {
      query += ` AND quantity_min >= $${paramCount}`;
      params.push(parseFloat(minQuantity));
      paramCount++;
    }

    if (maxPrice) {
      query += ` AND target_price_max <= $${paramCount}`;
      params.push(parseFloat(maxPrice));
      paramCount++;
    }

    // Filter by visibility based on user role
    if (req.user.role === 'exporter') {
      query += ` AND (visibility = 'PUBLIC' OR visibility = 'VERIFIED_ONLY')`;
    }

    query += ' ORDER BY created_at DESC';

    const result = await postgresService.query(query, params);

    res.json({
      success: true,
      count: result.rows.length,
      opportunities: result.rows
    });
  } catch (error) {
    console.error('Opportunities fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get opportunity details
 * GET /api/marketplace/opportunities/:opportunityId
 */
router.get('/opportunities/:opportunityId', authenticateToken, async (req, res) => {
  try {
    const { opportunityId } = req.params;

    const query = `
      SELECT o.*, b.company_name, b.country, b.verification_status, b.reputation_score
      FROM buyer_opportunities o
      LEFT JOIN buyer_registry b ON o.buyer_id = b.buyer_id
      WHERE o.opportunity_id = $1
    `;

    const result = await postgresService.query(query, [opportunityId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    // Increment views count
    await postgresService.query(
      'UPDATE buyer_opportunities SET views_count = views_count + 1 WHERE opportunity_id = $1',
      [opportunityId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Opportunity fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update opportunity
 * PUT /api/marketplace/opportunities/:opportunityId
 */
router.put('/opportunities/:opportunityId', authenticateToken, async (req, res) => {
  try {
    const { opportunityId } = req.params;
    const updates = req.body;

    // Get current opportunity
    const currentOpp = await postgresService.query(
      'SELECT * FROM buyer_opportunities WHERE opportunity_id = $1',
      [opportunityId]
    );

    if (currentOpp.rows.length === 0) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    // Build update query
    const allowedFields = [
      'title', 'description', 'quantity_min', 'quantity_max',
      'target_price_min', 'target_price_max', 'status', 'valid_until'
    ];

    const updateFields = [];
    const values = [];
    let paramCount = 1;

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = $${paramCount}`);
        values.push(updates[field]);
        paramCount++;
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(opportunityId);

    const query = `
      UPDATE buyer_opportunities 
      SET ${updateFields.join(', ')}
      WHERE opportunity_id = $${paramCount}
      RETURNING *
    `;

    const result = await postgresService.query(query, values);

    res.json({
      success: true,
      message: 'Opportunity updated',
      opportunity: result.rows[0]
    });
  } catch (error) {
    console.error('Opportunity update error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Delete opportunity
 * DELETE /api/marketplace/opportunities/:opportunityId
 */
router.delete('/opportunities/:opportunityId', authenticateToken, async (req, res) => {
  try {
    const { opportunityId } = req.params;

    const result = await postgresService.query(
      'DELETE FROM buyer_opportunities WHERE opportunity_id = $1 RETURNING opportunity_id',
      [opportunityId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    res.json({
      success: true,
      message: 'Opportunity deleted'
    });
  } catch (error) {
    console.error('Opportunity deletion error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== Matching System ====================

/**
 * Get matches for exporter
 * GET /api/marketplace/matches/:exporterId
 */
router.get('/matches/:exporterId', authenticateToken, requireRole('exporter', 'admin'), async (req, res) => {
  try {
    const { exporterId } = req.params;

    // Authorization check
    if (req.user.role === 'exporter' && exporterId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const query = `
      SELECT m.*, o.title, o.coffee_type, o.quantity_min, o.quantity_max,
             o.target_price_min, o.target_price_max, o.destination_country,
             b.company_name as buyer_name, b.reputation_score
      FROM exporter_buyer_matches m
      LEFT JOIN buyer_opportunities o ON m.opportunity_id = o.opportunity_id
      LEFT JOIN buyer_registry b ON o.buyer_id = b.buyer_id
      WHERE m.exporter_id = $1
      ORDER BY m.match_score DESC, m.created_at DESC
    `;

    const result = await postgresService.query(query, [exporterId]);

    res.json({
      success: true,
      exporterId,
      matches: result.rows
    });
  } catch (error) {
    console.error('Matches fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Express interest in opportunity
 * POST /api/marketplace/matches/:matchId/interest
 */
router.post('/matches/:matchId/interest', authenticateToken, requireRole('exporter'), async (req, res) => {
  try {
    const { matchId } = req.params;
    const { notes } = req.body;

    const query = `
      UPDATE exporter_buyer_matches
      SET status = 'INTERESTED',
          exporter_notes = $1,
          contacted_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE match_id = $2 AND exporter_id = $3
      RETURNING *
    `;

    const result = await postgresService.query(query, [notes, matchId, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Increment expressions of interest on opportunity
    await postgresService.query(
      `UPDATE buyer_opportunities 
       SET expressions_of_interest = expressions_of_interest + 1
       WHERE opportunity_id = $1`,
      [result.rows[0].opportunity_id]
    );

    res.json({
      success: true,
      message: 'Interest expressed. Buyer will be notified.',
      match: result.rows[0]
    });
  } catch (error) {
    console.error('Interest expression error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Generate matches for an opportunity (Admin/System)
 * POST /api/marketplace/opportunities/:opportunityId/generate-matches
 */
router.post('/opportunities/:opportunityId/generate-matches', 
  authenticateToken, requireRole('admin', 'ecta'), async (req, res) => {
  try {
    const { opportunityId } = req.params;

    // Get opportunity details
    const oppQuery = await postgresService.query(
      'SELECT * FROM buyer_opportunities WHERE opportunity_id = $1',
      [opportunityId]
    );

    if (oppQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    const opportunity = oppQuery.rows[0];

    // Get qualified exporters
    const exportersQuery = await postgresService.query(`
      SELECT exporter_id, company_name, coffee_types, production_capacity
      FROM exporter_profiles
      WHERE status = 'active'
        AND $1 = ANY(coffee_types)
    `, [opportunity.coffee_type]);

    const matches = [];

    for (const exporter of exportersQuery.rows) {
      // Calculate match score (simple algorithm)
      let score = 0.5; // Base score

      // Coffee type match
      if (exporter.coffee_types && exporter.coffee_types.includes(opportunity.coffee_type)) {
        score += 0.3;
      }

      // Capacity match
      if (exporter.production_capacity >= opportunity.quantity_min) {
        score += 0.2;
      }

      // Insert match
      const matchQuery = `
        INSERT INTO exporter_buyer_matches (
          opportunity_id, exporter_id, match_score, match_reasons
        ) VALUES ($1, $2, $3, $4)
        ON CONFLICT (opportunity_id, exporter_id) DO UPDATE
        SET match_score = $3, match_reasons = $4, updated_at = CURRENT_TIMESTAMP
        RETURNING match_id
      `;

      const reasons = [
        'Coffee type match',
        'Production capacity sufficient',
        'Active exporter status'
      ];

      const result = await postgresService.query(matchQuery, [
        opportunityId,
        exporter.exporter_id,
        score,
        reasons
      ]);

      matches.push({
        matchId: result.rows[0].match_id,
        exporterId: exporter.exporter_id,
        exporterName: exporter.company_name,
        score
      });
    }

    res.json({
      success: true,
      message: `Generated ${matches.length} matches`,
      matches
    });
  } catch (error) {
    console.error('Match generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
