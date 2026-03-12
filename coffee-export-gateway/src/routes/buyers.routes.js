const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const axios = require('axios');
const postgresService = require('../services/postgres');

const VERIFICATION_SERVICE_URL = process.env.VERIFICATION_SERVICE_URL || 'http://buyer-verification:3009';

// ==================== Buyer Registry Endpoints ====================

/**
 * Register new buyer
 * POST /api/buyers/register
 */
router.post('/register', authenticateToken, async (req, res) => {
  try {
    const {
      companyName, country, registrationNumber, taxId, address,
      email, phone, website
    } = req.body;
    
    // Validate required fields
    if (!companyName || !country || !email) {
      return res.status(400).json({ 
        error: 'Missing required fields: companyName, country, email' 
      });
    }
    
    // Insert buyer
    const query = `
      INSERT INTO buyer_registry (
        company_name, country, registration_number, tax_id, address,
        email, phone, website, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING buyer_id, company_name, country, verification_status
    `;
    
    const result = await postgresService.query(query, [
      companyName, country, registrationNumber, taxId, address,
      email, phone, website, req.user.id
    ]);
    
    const buyer = result.rows[0];
    
    res.json({
      success: true,
      message: 'Buyer registered successfully',
      buyer
    });
  } catch (error) {
    console.error('Buyer registration error:', error);
    
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({ 
        error: 'Buyer with this registration number already exists' 
      });
    }
    
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get buyer details
 * GET /api/buyers/:buyerId
 */
router.get('/:buyerId', authenticateToken, async (req, res) => {
  try {
    const { buyerId } = req.params;
    
    const query = 'SELECT * FROM buyer_registry WHERE buyer_id = $1';
    const result = await postgresService.query(query, [buyerId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Buyer not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Buyer fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Search buyers
 * GET /api/buyers/search?country=Germany&verified=true
 */
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { country, verified, minReputation } = req.query;
    
    let query = 'SELECT * FROM buyer_registry WHERE 1=1';
    const params = [];
    let paramCount = 1;
    
    if (country) {
      query += ` AND country = $${paramCount}`;
      params.push(country);
      paramCount++;
    }
    
    if (verified === 'true') {
      query += ` AND verification_status = 'VERIFIED'`;
    }
    
    if (minReputation) {
      query += ` AND reputation_score >= $${paramCount}`;
      params.push(parseFloat(minReputation));
      paramCount++;
    }
    
    query += ' ORDER BY reputation_score DESC NULLS LAST, created_at DESC';
    
    const result = await postgresService.query(query, params);
    
    res.json({
      success: true,
      count: result.rows.length,
      buyers: result.rows
    });
  } catch (error) {
    console.error('Buyer search error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get verified buyers (convenience endpoint)
 * GET /api/buyers/verified
 */
router.get('/verified/list', authenticateToken, async (req, res) => {
  try {
    const query = 'SELECT * FROM v_verified_buyers ORDER BY reputation_score DESC';
    const result = await postgresService.query(query);
    
    res.json({
      success: true,
      count: result.rows.length,
      buyers: result.rows
    });
  } catch (error) {
    console.error('Verified buyers fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== Buyer Verification Endpoints ====================

/**
 * Initiate buyer verification
 * POST /api/buyers/:buyerId/verify
 */
router.post('/:buyerId/verify', authenticateToken, requireRole('ecta', 'admin'), async (req, res) => {
  try {
    const { buyerId } = req.params;
    const { verificationType = 'FULL' } = req.body;
    
    // Check if buyer exists
    const buyerCheck = await postgresService.query(
      'SELECT buyer_id FROM buyer_registry WHERE buyer_id = $1',
      [buyerId]
    );
    
    if (buyerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Buyer not found' });
    }
    
    // Call verification service
    const verificationResponse = await axios.post(
      `${VERIFICATION_SERVICE_URL}/api/verify/buyer/${buyerId}`,
      { verificationType }
    );
    
    res.json({
      success: true,
      buyerId,
      verification: verificationResponse.data
    });
  } catch (error) {
    console.error('Verification initiation error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get buyer verification history
 * GET /api/buyers/:buyerId/verifications
 */
router.get('/:buyerId/verifications', authenticateToken, async (req, res) => {
  try {
    const { buyerId } = req.params;
    
    const query = `
      SELECT * FROM buyer_verification_records 
      WHERE buyer_id = $1 
      ORDER BY verified_at DESC
    `;
    
    const result = await postgresService.query(query, [buyerId]);
    
    res.json({
      success: true,
      buyerId,
      verifications: result.rows
    });
  } catch (error) {
    console.error('Verification history fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Calculate buyer risk score
 * POST /api/buyers/:buyerId/risk-score
 */
router.post('/:buyerId/risk-score', authenticateToken, requireRole('ecta', 'admin'), async (req, res) => {
  try {
    const { buyerId } = req.params;
    
    // Call verification service
    const riskResponse = await axios.post(
      `${VERIFICATION_SERVICE_URL}/api/risk-score/${buyerId}`
    );
    
    res.json({
      success: true,
      buyerId,
      riskScore: riskResponse.data.riskScore
    });
  } catch (error) {
    console.error('Risk score calculation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== Buyer Reviews Endpoints ====================

/**
 * Submit buyer review
 * POST /api/buyers/:buyerId/reviews
 */
router.post('/:buyerId/reviews', authenticateToken, requireRole('exporter'), async (req, res) => {
  try {
    const { buyerId } = req.params;
    const exporterId = req.user.id;
    const {
      contractId, overallRating, paymentPunctuality, communicationQuality,
      disputeResolution, professionalism, comments, wouldTradeAgain
    } = req.body;
    
    // Validate rating
    if (!overallRating || overallRating < 1 || overallRating > 5) {
      return res.status(400).json({ error: 'Overall rating must be between 1 and 5' });
    }
    
    const query = `
      INSERT INTO buyer_reviews (
        buyer_id, exporter_id, contract_id, overall_rating,
        payment_punctuality, communication_quality, dispute_resolution,
        professionalism, comments, would_trade_again
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING review_id, overall_rating, created_at
    `;
    
    const result = await postgresService.query(query, [
      buyerId, exporterId, contractId, overallRating,
      paymentPunctuality, communicationQuality, disputeResolution,
      professionalism, comments, wouldTradeAgain
    ]);
    
    // Update buyer reputation score
    await updateBuyerReputation(pool, buyerId);
    
    res.json({
      success: true,
      message: 'Review submitted successfully',
      review: result.rows[0]
    });
  } catch (error) {
    console.error('Review submission error:', error);
    
    if (error.code === '23505') { // Unique constraint
      return res.status(409).json({ 
        error: 'You have already reviewed this contract' 
      });
    }
    
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get buyer reviews
 * GET /api/buyers/:buyerId/reviews
 */
router.get('/:buyerId/reviews', authenticateToken, async (req, res) => {
  try {
    const { buyerId } = req.params;
    
    const query = `
      SELECT r.*, e.company_name as exporter_name
      FROM buyer_reviews r
      LEFT JOIN exporter_profiles e ON r.exporter_id = e.exporter_id
      WHERE r.buyer_id = $1
      ORDER BY r.created_at DESC
    `;
    
    const result = await postgresService.query(query, [buyerId]);
    
    res.json({
      success: true,
      buyerId,
      reviews: result.rows
    });
  } catch (error) {
    console.error('Reviews fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== Helper Functions ====================

/**
 * Update buyer reputation score based on reviews
 */
async function updateBuyerReputation(pool, buyerId) {
  const query = `
    UPDATE buyer_registry
    SET 
      reputation_score = (
        SELECT AVG(overall_rating)::DECIMAL(3,2)
        FROM buyer_reviews
        WHERE buyer_id = $1
      ),
      total_reviews = (
        SELECT COUNT(*)
        FROM buyer_reviews
        WHERE buyer_id = $1
      ),
      updated_at = CURRENT_TIMESTAMP
    WHERE buyer_id = $1
  `;
  
  await postgresService.query(query, [buyerId]);
}

module.exports = router;
