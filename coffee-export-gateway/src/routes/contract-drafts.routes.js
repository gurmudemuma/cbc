const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const postgresService = require('../services/postgres');
const { generateSalesContractCertificate } = require('../utils/sales-contract-certificate');

// Helper function
async function logNegotiationActivity(draftId, actorId, actorType, actionType, message, details) {
  const query = `
    INSERT INTO contract_negotiations (
      draft_id, actor_id, actor_type, action_type, message, changes_made
    ) VALUES ($1, $2, $3, $4, $5, $6)
  `;
  await postgresService.query(query, [draftId, actorId, actorType, actionType, message, details ? JSON.stringify(details) : null]);
}

// Create draft
router.post('/', authenticateToken, requireRole('exporter'), async (req, res) => {
  try {
    const exporterUsername = req.user.id; // username from JWT
    const { buyerId, coffeeType, originRegion, quantity, unitPrice, currency, paymentTerms, paymentMethod, incoterms, deliveryDate, portOfLoading, portOfDischarge, governingLaw, arbitrationLocation, arbitrationRules, contractLanguage, forceMajeureClause, qualityGrade, specialConditions, certificationsRequired } = req.body;
    
    if (!buyerId || !coffeeType || !quantity || !unitPrice) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Validate buyerId is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(buyerId)) {
      return res.status(400).json({ error: 'Invalid buyer ID format. Please select a valid buyer from the registry.' });
    }
    
    // Verify buyer exists in registry
    const buyerCheck = await postgresService.query(
      'SELECT buyer_id FROM buyer_registry WHERE buyer_id = $1 LIMIT 1',
      [buyerId]
    );
    
    if (buyerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Buyer not found in registry. Please select a valid buyer.' });
    }
    
    // Get exporter UUID from username
    const exporterResult = await postgresService.query(
      'SELECT exporter_id FROM exporter_profiles WHERE user_id = $1 LIMIT 1',
      [exporterUsername]
    );
    
    if (exporterResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exporter profile not found' });
    }
    
    const exporterUUID = exporterResult.rows[0].exporter_id;
    const totalValue = quantity * unitPrice;
    const contractNumber = `DRAFT-${Date.now()}`;
    
    const query = `INSERT INTO contract_drafts (contract_number, version, status, exporter_id, buyer_id, coffee_type, origin_region, quantity, unit_price, currency, total_value, payment_terms, payment_method, incoterms, delivery_date, port_of_loading, port_of_discharge, governing_law, arbitration_location, arbitration_rules, contract_language, force_majeure_clause, quality_grade, special_conditions, certifications_required, proposed_by, proposed_by_type, offer_valid_until) VALUES ($1, 1, 'DRAFT', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, CURRENT_TIMESTAMP + INTERVAL '7 days') RETURNING draft_id, contract_number, version, status, created_at`;
    
    const result = await postgresService.query(query, [contractNumber, exporterUUID, buyerId, coffeeType, originRegion, quantity, unitPrice, currency || 'USD', totalValue, paymentTerms, paymentMethod, incoterms, deliveryDate, portOfLoading, portOfDischarge, governingLaw, arbitrationLocation, arbitrationRules, contractLanguage || 'English', forceMajeureClause, qualityGrade, specialConditions, certificationsRequired, exporterUsername, 'EXPORTER']);
    
    await logNegotiationActivity(result.rows[0].draft_id, exporterUsername, 'EXPORTER', 'CREATE', 'Contract draft created', null);
    
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
    const query = `SELECT d.*, b.company_name as buyer_name, b.country as buyer_country, e.business_name as exporter_name FROM contract_drafts d LEFT JOIN buyer_registry b ON d.buyer_id = b.buyer_id LEFT JOIN exporter_profiles e ON d.exporter_id = e.exporter_id WHERE d.draft_id = $1`;
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

// List all drafts for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Get exporter UUID from username
    const exporterResult = await postgresService.query(
      'SELECT exporter_id FROM exporter_profiles WHERE user_id = $1 LIMIT 1',
      [req.user.id]
    );
    
    if (exporterResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exporter profile not found' });
    }
    
    const exporterUUID = exporterResult.rows[0].exporter_id;
    
    const query = `SELECT d.*, b.company_name as buyer_name, b.country as buyer_country FROM contract_drafts d LEFT JOIN buyer_registry b ON d.buyer_id = b.buyer_id WHERE d.exporter_id = $1 ORDER BY d.created_at DESC`;
    const result = await postgresService.query(query, [exporterUUID]);
    
    res.json({ success: true, drafts: result.rows });
  } catch (error) {
    console.error('Drafts fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// List exporter drafts
router.get('/exporter/:exporterId', authenticateToken, async (req, res) => {
  try {
    const { exporterId } = req.params;
    
    // Convert username to exporter UUID
    const exporterResult = await postgresService.query(
      'SELECT exporter_id FROM exporter_profiles WHERE user_id = $1 LIMIT 1',
      [exporterId]
    );
    
    if (exporterResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exporter profile not found' });
    }
    
    const exporterUUID = exporterResult.rows[0].exporter_id;
    
    // Check access - only allow if user is the exporter or admin
    if (req.user.role === 'exporter' && exporterId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const query = `SELECT d.*, b.company_name as buyer_name, b.country as buyer_country FROM contract_drafts d LEFT JOIN buyer_registry b ON d.buyer_id = b.buyer_id WHERE d.exporter_id = $1 ORDER BY d.created_at DESC`;
    const result = await postgresService.query(query, [exporterUUID]);
    
    res.json({ success: true, exporterId, drafts: result.rows });
  } catch (error) {
    console.error('Drafts fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Counter offer
router.post('/:draftId/counter', authenticateToken, async (req, res) => {
  try {
    const { draftId } = req.params;
    const { updates, notes } = req.body;
    const actorUsername = req.user.id; // username
    
    const currentDraft = await postgresService.query(
      'SELECT * FROM contract_drafts WHERE draft_id = $1',
      [draftId]
    );
    
    if (currentDraft.rows.length === 0) {
      return res.status(404).json({ error: 'Draft not found' });
    }
    
    const draft = currentDraft.rows[0];
    const newVersion = draft.version + 1;
    const totalValue = (updates.quantity || draft.quantity) * (updates.unitPrice || draft.unit_price);
    
    const newQuery = `
      INSERT INTO contract_drafts (
        contract_number, version, status, exporter_id, buyer_id, 
        coffee_type, origin_region, quantity, unit_price, currency, total_value,
        payment_terms, payment_method, incoterms, delivery_date, port_of_loading,
        port_of_discharge, governing_law, arbitration_location, arbitration_rules,
        contract_language, force_majeure_clause, quality_grade, special_conditions,
        certifications_required, proposed_by, proposed_by_type, parent_draft_id,
        offer_valid_until
      ) VALUES (
        $1, $2, 'COUNTERED', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27,
        CURRENT_TIMESTAMP + INTERVAL '7 days'
      ) RETURNING draft_id, version, status
    `;
    
    const result = await postgresService.query(newQuery, [
      draft.contract_number, newVersion, actorUsername, draft.buyer_id,
      updates.coffeeType || draft.coffee_type,
      updates.originRegion || draft.origin_region,
      updates.quantity || draft.quantity,
      updates.unitPrice || draft.unit_price,
      updates.currency || draft.currency,
      totalValue,
      updates.paymentTerms || draft.payment_terms,
      updates.paymentMethod || draft.payment_method,
      updates.incoterms || draft.incoterms,
      updates.deliveryDate || draft.delivery_date,
      updates.portOfLoading || draft.port_of_loading,
      updates.portOfDischarge || draft.port_of_discharge,
      updates.governingLaw || draft.governing_law,
      updates.arbitrationLocation || draft.arbitration_location,
      updates.arbitrationRules || draft.arbitration_rules,
      updates.contractLanguage || draft.contract_language,
      updates.forceMajeureClause || draft.force_majeure_clause,
      updates.qualityGrade || draft.quality_grade,
      updates.specialConditions || draft.special_conditions,
      updates.certificationsRequired || draft.certifications_required,
      actorUsername,
      'BUYER',
      draftId
    ]);
    
    await logNegotiationActivity(
      result.rows[0].draft_id,
      actorUsername,
      'BUYER',
      'COUNTER',
      notes || 'Counter offer submitted',
      updates
    );
    
    res.json({
      success: true,
      message: 'Counter offer created',
      draft: result.rows[0]
    });
  } catch (error) {
    console.error('Counter offer error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Accept draft
router.post('/:draftId/accept', authenticateToken, async (req, res) => {
  try {
    const { draftId } = req.params;
    const actorUsername = req.user.id;
    
    const query = `
      UPDATE contract_drafts
      SET status = 'ACCEPTED',
          responded_by = $1,
          responded_by_type = 'BUYER',
          responded_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE draft_id = $2
      RETURNING draft_id, status, responded_at
    `;
    
    const result = await postgresService.query(query, [actorUsername, draftId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Draft not found' });
    }
    
    await logNegotiationActivity(
      draftId,
      actorUsername,
      'BUYER',
      'ACCEPT',
      'Contract draft accepted',
      null
    );
    
    res.json({
      success: true,
      message: 'Contract accepted',
      draft: result.rows[0]
    });
  } catch (error) {
    console.error('Accept error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reject draft
router.post('/:draftId/reject', authenticateToken, async (req, res) => {
  try {
    const { draftId } = req.params;
    const { reason } = req.body;
    const actorUsername = req.user.id;
    
    const query = `
      UPDATE contract_drafts
      SET status = 'REJECTED',
          responded_by = $1,
          responded_by_type = 'BUYER',
          responded_at = CURRENT_TIMESTAMP,
          response_notes = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE draft_id = $3
      RETURNING draft_id, status, responded_at
    `;
    
    const result = await postgresService.query(query, [actorUsername, reason || '', draftId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Draft not found' });
    }
    
    await logNegotiationActivity(
      draftId,
      actorUsername,
      'BUYER',
      'REJECT',
      reason || 'Contract draft rejected',
      null
    );
    
    res.json({
      success: true,
      message: 'Contract rejected',
      draft: result.rows[0]
    });
  } catch (error) {
    console.error('Reject error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get negotiation history
router.get('/:draftId/history', authenticateToken, async (req, res) => {
  try {
    const { draftId } = req.params;
    
    const query = `
      SELECT * FROM contract_negotiations
      WHERE draft_id = $1
      ORDER BY created_at ASC
    `;
    
    const result = await postgresService.query(query, [draftId]);
    
    res.json({
      success: true,
      count: result.rows.length,
      history: result.rows
    });
  } catch (error) {
    console.error('History fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Finalize contract to blockchain
router.post('/:draftId/finalize', authenticateToken, async (req, res) => {
  try {
    const { draftId } = req.params;
    
    // Get draft from database
    const draftQuery = `
      SELECT d.*, b.buyer_id, e.exporter_id 
      FROM contract_drafts d
      LEFT JOIN buyer_registry b ON d.buyer_id = b.buyer_id
      LEFT JOIN exporter_profiles e ON d.exporter_id = e.exporter_id
      WHERE d.draft_id = $1
    `;
    
    const draftResult = await postgresService.query(draftQuery, [draftId]);
    
    if (draftResult.rows.length === 0) {
      return res.status(404).json({ error: 'Draft not found' });
    }
    
    const draft = draftResult.rows[0];
    
    // Only finalize if status is ACCEPTED
    if (draft.status !== 'ACCEPTED') {
      return res.status(400).json({ error: 'Draft must be ACCEPTED before finalization' });
    }
    
    // Prepare contract data for blockchain
    const finalContractData = {
      exporterId: draft.exporter_id,
      buyerId: draft.buyer_id,
      coffeeType: draft.coffee_type,
      quantity: draft.quantity,
      unitPrice: draft.unit_price,
      totalValue: draft.total_value,
      currency: draft.currency,
      paymentTerms: draft.payment_terms,
      paymentMethod: draft.payment_method,
      incoterms: draft.incoterms,
      deliveryDate: draft.delivery_date,
      governingLaw: draft.governing_law,
      arbitrationLocation: draft.arbitration_location,
      arbitrationRules: draft.arbitration_rules,
      forceMajeureClause: draft.force_majeure_clause
    };
    
    // Call blockchain to finalize contract
    const fabricService = require('../services');
    try {
      await fabricService.submitTransaction(
        req.user.id,
        process.env.CHAINCODE_NAME || 'ecta',
        'FinalizeContractFromDraft',
        draftId,
        JSON.stringify(finalContractData)
      );
    } catch (error) {
      console.error('[Contract Finalize] Blockchain error:', error.message);
      throw error;
    }
    
    // Generate contract ID as UUID (since blockchain doesn't return it)
    const crypto = require('crypto');
    const blockchainContractId = crypto.randomUUID();
    
    // Update draft with blockchain contract ID
    const updateQuery = `
      UPDATE contract_drafts
      SET status = 'FINALIZED',
          finalized_contract_id = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE draft_id = $2
      RETURNING draft_id, status, finalized_contract_id
    `;
    
    const updateResult = await postgresService.query(updateQuery, [blockchainContractId, draftId]);
    
    res.json({
      success: true,
      message: 'Contract finalized and recorded on blockchain',
      draft: updateResult.rows[0],
      blockchainContractId: blockchainContractId
    });
  } catch (error) {
    console.error('Finalization error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate and download sales contract certificate
router.get('/:draftId/certificate', authenticateToken, async (req, res) => {
  try {
    const { draftId } = req.params;
    
    // Get draft with all related data
    const query = `
      SELECT 
        d.*,
        b.company_name as buyer_name,
        b.country as buyer_country,
        b.tax_id as buyer_tax_id,
        e.business_name as exporter_name,
        e.tin as exporter_tin
      FROM contract_drafts d
      LEFT JOIN buyer_registry b ON d.buyer_id = b.buyer_id
      LEFT JOIN exporter_profiles e ON d.exporter_id = e.exporter_id
      WHERE d.draft_id = $1
    `;
    
    const result = await postgresService.query(query, [draftId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Draft not found' });
    }
    
    const draft = result.rows[0];
    
    // Only generate certificate for finalized contracts
    if (draft.status !== 'FINALIZED') {
      return res.status(400).json({ error: 'Certificate can only be generated for finalized contracts' });
    }
    
    // Prepare certificate data
    const certificateData = {
      contractId: draft.finalized_contract_id || draft.draft_id,
      exporterId: draft.exporter_id,
      exporterName: draft.exporter_name,
      exporterTIN: draft.exporter_tin,
      buyerId: draft.buyer_id,
      buyerName: draft.buyer_name,
      buyerCountry: draft.buyer_country,
      buyerTaxId: draft.buyer_tax_id,
      coffeeType: draft.coffee_type,
      originRegion: draft.origin_region,
      quantity: draft.quantity,
      unitPrice: draft.unit_price,
      currency: draft.currency,
      totalValue: draft.total_value,
      qualityGrade: draft.quality_grade,
      paymentTerms: draft.payment_terms,
      paymentMethod: draft.payment_method,
      incoterms: draft.incoterms,
      deliveryDate: draft.delivery_date,
      portOfLoading: draft.port_of_loading,
      portOfDischarge: draft.port_of_discharge,
      governingLaw: draft.governing_law,
      arbitrationLocation: draft.arbitration_location,
      arbitrationRules: draft.arbitration_rules,
      contractLanguage: draft.contract_language,
      specialConditions: draft.special_conditions,
      certificationsRequired: draft.certifications_required,
      finalizedAt: draft.updated_at
    };
    
    // Generate PDF
    const pdfBuffer = await generateSalesContractCertificate(certificateData);
    
    // Send PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="sales-contract-${draft.draft_id}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Certificate generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
