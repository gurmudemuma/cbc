const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const postgresService = require('../services/postgres');

// Helper function
async function logNegotiationActivity(draftId, actorId, actorType, actionType, message, details) {
  const query = `
    INSERT INTO contract_negotiations (
      draft_id, actor_id, actor_type, action_type, message, changes_made
    ) VALUES ($1, $2, $3, $4, $5, $6)
  `;
  await postgresService.query(query, [draftId, actorId, actorType, actionType, message, details ? JSON.stringify(details) : null]);
}

module.exports = router;

// Create draft
router.post('/', authenticateToken, requireRole('exporter'), async (req, res) => {
  try {
    const exporterId = req.user.id;
    const { buyerId, coffeeType, originRegion, quantity, unitPrice, currency, paymentTerms, paymentMethod, incoterms, deliveryDate, portOfLoading, portOfDischarge, governingLaw, arbitrationLocation, arbitrationRules, contractLanguage, forceMajeureClause, qualityGrade, specialConditions, certificationsRequired } = req.body;
    
    if (!buyerId || !coffeeType || !quantity || !unitPrice) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const totalValue = quantity * unitPrice;
    const contractNumber = `DRAFT-${Date.now()}`;
    
    const query = `INSERT INTO contract_drafts (contract_number, version, status, exporter_id, buyer_id, coffee_type, origin_region, quantity, unit_price, currency, total_value, payment_terms, payment_method, incoterms, delivery_date, port_of_loading, port_of_discharge, governing_law, arbitration_location, arbitration_rules, contract_language, force_majeure_clause, quality_grade, special_conditions, certifications_required, proposed_by, proposed_by_type, offer_valid_until) VALUES ($1, 1, 'DRAFT', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, 'EXPORTER', CURRENT_TIMESTAMP + INTERVAL '7 days') RETURNING draft_id, contract_number, version, status, created_at`;
    
    const result = await postgresService.query(query, [contractNumber, exporterId, buyerId, coffeeType, originRegion, quantity, unitPrice, currency || 'USD', totalValue, paymentTerms, paymentMethod, incoterms, deliveryDate, portOfLoading, portOfDischarge, governingLaw, arbitrationLocation, arbitrationRules, contractLanguage || 'English', forceMajeureClause, qualityGrade, specialConditions, certificationsRequired]);
    
    await logNegotiationActivity( result.rows[0].draft_id, exporterId, 'EXPORTER', 'CREATE', 'Contract draft created', null);
    
    res.json({ success: true, message: 'Contract draft created', draft: result.rows[0] });
  } catch (error) {
    console.error('Draft creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get draft
router.get('/:draftId', authenticateToken, async (req, res) => {
  try {
    const { draftId } = req.params;
    const query = `SELECT d.*, b.company_name as buyer_name, b.country as buyer_country, e.company_name as exporter_name FROM contract_drafts d LEFT JOIN buyer_registry b ON d.buyer_id = b.buyer_id LEFT JOIN exporter_profiles e ON d.exporter_id = e.exporter_id WHERE d.draft_id = $1`;
    const result = await postgresService.query(query, [draftId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Draft not found' });
    }
    
    const draft = result.rows[0];
    if (req.user.role === 'exporter' && draft.exporter_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(draft);
  } catch (error) {
    console.error('Draft fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// List exporter drafts
router.get('/exporter/:exporterId', authenticateToken, async (req, res) => {
  try {
    const { exporterId } = req.params;
    if (req.user.role === 'exporter' && exporterId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const query = `SELECT d.*, b.company_name as buyer_name, b.country as buyer_country FROM contract_drafts d LEFT JOIN buyer_registry b ON d.buyer_id = b.buyer_id WHERE d.exporter_id = $1 ORDER BY d.created_at DESC`;
    const result = await postgresService.query(query, [exporterId]);
    
    res.json({ success: true, exporterId, drafts: result.rows });
  } catch (error) {
    console.error('Drafts fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});
