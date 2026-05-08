const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const postgresService = require('../services/postgres');

// ==================== Legal Frameworks ====================

/**
 * Get all legal frameworks
 * GET /api/legal/frameworks
 */
router.get('/frameworks', authenticateToken, async (req, res) => {
  try {
    const query = 'SELECT * FROM legal_frameworks WHERE is_active = true ORDER BY framework_name';
    const result = await postgresService.query(query);
    
    res.json({
      success: true,
      count: result.rows.length,
      frameworks: result.rows
    });
  } catch (error) {
    console.error('Frameworks fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get legal framework details
 * GET /api/legal/frameworks/:frameworkId
 */
router.get('/frameworks/:frameworkId', authenticateToken, async (req, res) => {
  try {
    const { frameworkId } = req.params;
    
    const query = 'SELECT * FROM legal_frameworks WHERE framework_id = $1';
    const result = await postgresService.query(query, [frameworkId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Framework not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Framework fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== Contract Clauses ====================

/**
 * Get contract clauses by type
 * GET /api/legal/clauses?type=FORCE_MAJEURE
 */
router.get('/clauses', authenticateToken, async (req, res) => {
  try {
    const { type, framework } = req.query;
    
    let query = 'SELECT * FROM contract_clauses WHERE is_active = true';
    const params = [];
    let paramCount = 1;
    
    if (type) {
      query += ` AND clause_type = $${paramCount}`;
      params.push(type);
      paramCount++;
    }
    
    if (framework) {
      query += ` AND legal_framework_id = $${paramCount}`;
      params.push(framework);
      paramCount++;
    }
    
    query += ' ORDER BY clause_name';
    
    const result = await postgresService.query(query, params);
    
    res.json({
      success: true,
      count: result.rows.length,
      clauses: result.rows
    });
  } catch (error) {
    console.error('Clauses fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get specific clause
 * GET /api/legal/clauses/:clauseId
 */
router.get('/clauses/:clauseId', authenticateToken, async (req, res) => {
  try {
    const { clauseId } = req.params;
    
    const query = 'SELECT * FROM contract_clauses WHERE clause_id = $1';
    const result = await postgresService.query(query, [clauseId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Clause not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Clause fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== Contract Templates ====================

/**
 * Get contract templates
 * GET /api/legal/templates
 */
router.get('/templates', authenticateToken, async (req, res) => {
  try {
    const query = 'SELECT * FROM contract_templates WHERE is_active = true ORDER BY template_name';
    const result = await postgresService.query(query);
    
    res.json({
      success: true,
      count: result.rows.length,
      templates: result.rows
    });
  } catch (error) {
    console.error('Templates fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get template details
 * GET /api/legal/templates/:templateId
 */
router.get('/templates/:templateId', authenticateToken, async (req, res) => {
  try {
    const { templateId } = req.params;
    
    const query = 'SELECT * FROM contract_templates WHERE template_id = $1';
    const result = await postgresService.query(query, [templateId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Template fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== Dispute Resolution ====================

/**
 * Create dispute
 * POST /api/legal/disputes
 */
router.post('/disputes', authenticateToken, async (req, res) => {
  try {
    const {
      contractId, contractNumber, raisedAgainst, disputeType, severity,
      title, description, evidenceDocuments, claimedAmount, currency
    } = req.body;
    
    if (!contractId || !raisedAgainst || !disputeType || !title) {
      return res.status(400).json({ 
        error: 'Missing required fields: contractId, raisedAgainst, disputeType, title' 
      });
    }
    
    const query = `
      INSERT INTO contract_disputes (
        contract_id, contract_number, raised_by, raised_by_type, raised_against,
        dispute_type, severity, title, description, evidence_documents,
        claimed_amount, currency, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'OPEN')
      RETURNING dispute_id, contract_id, status, created_at
    `;
    
    const result = await postgresService.query(query, [
      contractId, contractNumber, req.user.id, 'EXPORTER', raisedAgainst,
      disputeType, severity || 'MEDIUM', title, description,
      evidenceDocuments || [], claimedAmount, currency || 'USD'
    ]);
    
    res.json({
      success: true,
      message: 'Dispute created',
      dispute: result.rows[0]
    });
  } catch (error) {
    console.error('Dispute creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get dispute details
 * GET /api/legal/disputes/:disputeId
 */
router.get('/disputes/:disputeId', authenticateToken, async (req, res) => {
  try {
    const { disputeId } = req.params;
    
    const query = `
      SELECT d.*, 
             (SELECT COUNT(*) FROM dispute_activities WHERE dispute_id = d.dispute_id) as activity_count
      FROM contract_disputes d
      WHERE d.dispute_id = $1
    `;
    
    const result = await postgresService.query(query, [disputeId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dispute not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Dispute fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * List disputes for user
 * GET /api/legal/disputes
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, type } = req.query;
    
    let query = `
      SELECT * FROM contract_disputes 
      WHERE raised_by = $1 OR raised_against = $1
    `;
    const params = [req.user.id];
    let paramCount = 2;
    
    if (status) {
      query += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    if (type) {
      query += ` AND dispute_type = $${paramCount}`;
      params.push(type);
      paramCount++;
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await postgresService.query(query, params);
    
    res.json({
      success: true,
      count: result.rows.length,
      disputes: result.rows
    });
  } catch (error) {
    console.error('Disputes fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Add comment to dispute
 * POST /api/legal/disputes/:disputeId/comments
 */
router.post('/disputes/:disputeId/comments', authenticateToken, async (req, res) => {
  try {
    const { disputeId } = req.params;
    const { message, attachments } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    const query = `
      INSERT INTO dispute_activities (
        dispute_id, actor_id, actor_type, activity_type, description, attachments
      ) VALUES ($1, $2, $3, 'COMMENT', $4, $5)
      RETURNING activity_id, created_at
    `;
    
    const result = await postgresService.query(query, [
      disputeId, req.user.id, 'EXPORTER', message, attachments || []
    ]);
    
    res.json({
      success: true,
      message: 'Comment added',
      activity: result.rows[0]
    });
  } catch (error) {
    console.error('Comment addition error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update dispute status
 * PUT /api/legal/disputes/:disputeId/status
 */
router.put('/disputes/:disputeId/status', authenticateToken, requireRole('admin', 'ecta'), async (req, res) => {
  try {
    const { disputeId } = req.params;
    const { status, resolutionMethod, resolutionNotes, awardedAmount, awardedTo } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    const query = `
      UPDATE contract_disputes
      SET 
        status = $1,
        resolution_method = COALESCE($2, resolution_method),
        resolution_notes = COALESCE($3, resolution_notes),
        awarded_amount = COALESCE($4, awarded_amount),
        awarded_to = COALESCE($5, awarded_to),
        resolution_date = CASE WHEN $1 IN ('RESOLVED', 'CLOSED') THEN CURRENT_TIMESTAMP ELSE resolution_date END,
        updated_at = CURRENT_TIMESTAMP
      WHERE dispute_id = $6
      RETURNING dispute_id, status, resolution_date
    `;
    
    const result = await postgresService.query(query, [
      status, resolutionMethod, resolutionNotes, awardedAmount, awardedTo, disputeId
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dispute not found' });
    }
    
    res.json({
      success: true,
      message: 'Dispute status updated',
      dispute: result.rows[0]
    });
  } catch (error) {
    console.error('Dispute update error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get dispute activity history
 * GET /api/legal/disputes/:disputeId/activities
 */
router.get('/disputes/:disputeId/activities', authenticateToken, async (req, res) => {
  try {
    const { disputeId } = req.params;
    
    const query = `
      SELECT * FROM dispute_activities 
      WHERE dispute_id = $1 
      ORDER BY created_at DESC
    `;
    
    const result = await postgresService.query(query, [disputeId]);
    
    res.json({
      success: true,
      count: result.rows.length,
      activities: result.rows
    });
  } catch (error) {
    console.error('Activities fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
