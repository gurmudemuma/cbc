const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const postgresService = require('../services/postgres');
const fabricService = require('../services/fabric-cli-final');

/**
 * Get sales contract statistics
 * GET /api/contracts/drafts/stats
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Get exporter UUID if user is an exporter
    let exporterId = null;
    if (userRole === 'exporter') {
      const exporterQuery = await postgresService.query(
        'SELECT exporter_id FROM exporter_profiles WHERE user_id = $1',
        [userId]
      );
      
      if (exporterQuery.rows.length > 0) {
        exporterId = exporterQuery.rows[0].exporter_id;
      }
    }
    
    // Build query based on role
    let draftsQuery;
    let params;
    
    if (userRole === 'exporter' && exporterId) {
      // Exporters see only their own drafts
      draftsQuery = `
        SELECT 
          COUNT(*) as total_contracts,
          COUNT(*) FILTER (WHERE status IN ('DRAFT', 'COUNTERED')) as in_negotiation,
          COUNT(*) FILTER (WHERE status = 'FINALIZED') as finalized,
          COUNT(*) FILTER (WHERE status = 'REJECTED') as rejected,
          COALESCE(SUM(total_value), 0) as total_value
        FROM contract_drafts
        WHERE exporter_id = $1
      `;
      params = [exporterId];
    } else if (userRole === 'admin' || userRole === 'ecta') {
      // Admins see all drafts
      draftsQuery = `
        SELECT 
          COUNT(*) as total_contracts,
          COUNT(*) FILTER (WHERE status IN ('DRAFT', 'COUNTERED')) as in_negotiation,
          COUNT(*) FILTER (WHERE status = 'FINALIZED') as finalized,
          COUNT(*) FILTER (WHERE status = 'REJECTED') as rejected,
          COALESCE(SUM(total_value), 0) as total_value
        FROM contract_drafts
      `;
      params = [];
    } else {
      // No access
      return res.json({
        success: true,
        data: {
          totalContracts: 0,
          inNegotiation: 0,
          finalized: 0,
          rejected: 0,
          totalValue: 0
        },
        timestamp: new Date().toISOString()
      });
    }
    
    const result = await postgresService.query(draftsQuery, params);
    const stats = result.rows[0];
    
    res.json({
      success: true,
      data: {
        totalContracts: parseInt(stats.total_contracts) || 0,
        inNegotiation: parseInt(stats.in_negotiation) || 0,
        finalized: parseInt(stats.finalized) || 0,
        rejected: parseInt(stats.rejected) || 0,
        totalValue: parseFloat(stats.total_value) || 0
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Contract stats error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Helper function to log negotiation activity
async function logNegotiationActivity(draftId, actorId, actorType, actionType, message, details) {
  const query = `
    INSERT INTO contract_negotiations (
      draft_id, actor_id, actor_type, action_type, message, changes_made
    ) VALUES ($1, $2, $3, $4, $5, $6)
  `;
  await postgresService.query(query, [draftId, actorId, actorType, actionType, message, details ? JSON.stringify(details) : null]);
}

// Helper function to sync contract draft to blockchain
async function syncContractToBlockchain(draftData) {
  if (process.env.BLOCKCHAIN_SYNC !== 'true') {
    console.log('[Contract Sync] Blockchain sync disabled');
    return { synced: false, reason: 'disabled' };
  }
  
  try {
    console.log('[Contract Sync] Syncing contract to blockchain:', draftData.contract_number);
    
    const contractPayload = {
      contractNumber: draftData.contract_number,
      draftId: draftData.draft_id,
      exporterId: draftData.exporter_id,
      buyerId: draftData.buyer_id,
      coffeeType: draftData.coffee_type,
      originRegion: draftData.origin_region,
      quantity: draftData.quantity,
      unitPrice: draftData.unit_price,
      currency: draftData.currency,
      totalValue: draftData.total_value,
      status: draftData.status,
      createdAt: new Date().toISOString()
    };
    
    await fabricService.invokeChaincode(
      'CreateContractDraft',
      JSON.stringify(contractPayload)
    );
    
    console.log('[Contract Sync] Successfully synced to blockchain');
    return { synced: true };
  } catch (error) {
    console.error('[Contract Sync] Blockchain sync failed (non-critical):', error.message);
    return { synced: false, error: error.message };
  }
}

// Export router at the end after all routes are defined
// (moved from line 98 to ensure all routes are included)

// Create draft
router.post('/', authenticateToken, requireRole('exporter'), async (req, res) => {
  try {
    const username = req.user.id; // This is the username from JWT
    const { buyerId, coffeeType, originRegion, quantity, unitPrice, currency, paymentTerms, paymentMethod, incoterms, deliveryDate, portOfLoading, portOfDischarge, governingLaw, arbitrationLocation, arbitrationRules, contractLanguage, forceMajeureClause, qualityGrade, specialConditions, certificationsRequired } = req.body;
    
    if (!buyerId || !coffeeType || !quantity || !unitPrice) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Get exporter UUID from username
    const exporterQuery = await postgresService.query(
      'SELECT exporter_id FROM exporter_profiles WHERE user_id = $1',
      [username]
    );
    
    if (exporterQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Exporter profile not found' });
    }
    
    const exporterId = exporterQuery.rows[0].exporter_id;
    
    // Validate buyer exists and is verified
    const buyerCheck = await postgresService.query(
      'SELECT buyer_id, verification_status FROM buyer_registry WHERE buyer_id = $1',
      [buyerId]
    );
    
    if (buyerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Buyer not found' });
    }
    
    if (buyerCheck.rows[0].verification_status !== 'VERIFIED') {
      return res.status(400).json({ error: 'Buyer must be verified to create contract' });
    }
    
    const totalValue = quantity * unitPrice;
    const contractNumber = `DRAFT-${Date.now()}`;
    
    console.log('[Contract Draft] Creating draft:', { contractNumber, exporterId, buyerId, username });
    
    // NEW WORKFLOW: Auto-approve and finalize immediately
    // Status: FINALIZED (instead of DRAFT)
    // This allows exporter to proceed directly to ECTA registration
    
    // Insert into PostgreSQL with FINALIZED status
    const query = `INSERT INTO contract_drafts (contract_number, version, status, exporter_id, buyer_id, coffee_type, origin_region, quantity, unit_price, currency, total_value, payment_terms, payment_method, incoterms, delivery_date, port_of_loading, port_of_discharge, governing_law, arbitration_location, arbitration_rules, contract_language, force_majeure_clause, quality_grade, special_conditions, certifications_required, proposed_by, proposed_by_type, offer_valid_until) VALUES ($1, 1, 'FINALIZED', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, 'EXPORTER', CURRENT_TIMESTAMP + INTERVAL '7 days') RETURNING *`;
    
    const result = await postgresService.query(query, [contractNumber, exporterId, buyerId, coffeeType, originRegion, quantity, unitPrice, currency || 'USD', totalValue, paymentTerms, paymentMethod, incoterms, deliveryDate, portOfLoading, portOfDischarge, governingLaw, arbitrationLocation, arbitrationRules, contractLanguage || 'English', forceMajeureClause, qualityGrade, specialConditions, certificationsRequired, username]);
    
    const draft = result.rows[0];
    console.log('[Contract Draft] PostgreSQL insert successful (AUTO-FINALIZED):', draft.draft_id);
    
    // Log negotiation activity
    await logNegotiationActivity(draft.draft_id, exporterId, 'EXPORTER', 'CREATE', 'Contract draft created and auto-finalized', null);
    
    // Sync to blockchain (non-blocking) - fire and forget
    setImmediate(() => {
      syncContractToBlockchain(draft).catch(err => {
        console.error('[Contract Draft] Blockchain sync failed (non-critical):', err.message);
      });
    });
    
    res.json({ 
      success: true, 
      message: 'Contract draft created and auto-finalized successfully. You can now register it with ECTA.', 
      draft: {
        draft_id: draft.draft_id,
        contract_number: draft.contract_number,
        version: draft.version,
        status: draft.status, // FINALIZED
        created_at: draft.created_at
      },
      blockchain: { synced: false, status: 'pending' }
    });
  } catch (error) {
    console.error('[Contract Draft] Creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// List all drafts for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const username = req.user.id;
    const userRole = req.user.role;
    
    let query;
    let params;
    
    if (userRole === 'exporter') {
      // Get exporter UUID from username
      const exporterQuery = await postgresService.query(
        'SELECT exporter_id FROM exporter_profiles WHERE user_id = $1',
        [username]
      );
      
      if (exporterQuery.rows.length === 0) {
        // Return empty list instead of error - user may not have completed profile yet
        console.log(`[Contract Drafts] No exporter profile found for ${username}, returning empty list`);
        return res.json({ 
          success: true, 
          count: 0,
          drafts: [],
          message: 'No exporter profile found. Please complete your registration.'
        });
      }
      
      const exporterId = exporterQuery.rows[0].exporter_id;
      
      // Exporters see only their own drafts
      query = `
        SELECT d.*, b.company_name as buyer_name, b.country as buyer_country 
        FROM contract_drafts d 
        LEFT JOIN buyer_registry b ON d.buyer_id = b.buyer_id 
        WHERE d.exporter_id = $1 
        ORDER BY d.created_at DESC
      `;
      params = [exporterId];
    } else if (userRole === 'admin' || userRole === 'ecta') {
      // Admins and ECTA see all drafts
      query = `
        SELECT d.*, b.company_name as buyer_name, b.country as buyer_country,
               e.business_name as exporter_name
        FROM contract_drafts d 
        LEFT JOIN buyer_registry b ON d.buyer_id = b.buyer_id 
        LEFT JOIN exporter_profiles e ON d.exporter_id = e.exporter_id
        ORDER BY d.created_at DESC
      `;
      params = [];
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const result = await postgresService.query(query, params);
    
    res.json({ 
      success: true, 
      count: result.rows.length,
      drafts: result.rows 
    });
  } catch (error) {
    console.error('[Contract Drafts] List error:', error);
    res.status(500).json({ error: error.message });
  }
});

// List exporter drafts
router.get('/exporter/:exporterId', authenticateToken, async (req, res) => {
  try {
    const { exporterId } = req.params;
    const username = req.user.id;
    
    // Check if exporterId is a username or UUID
    let actualExporterId = exporterId;
    
    // If it looks like a username (not a UUID), look it up
    if (!exporterId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      const exporterQuery = await postgresService.query(
        'SELECT exporter_id FROM exporter_profiles WHERE user_id = $1',
        [exporterId]
      );
      
      if (exporterQuery.rows.length === 0) {
        return res.status(404).json({ error: 'Exporter profile not found' });
      }
      
      actualExporterId = exporterQuery.rows[0].exporter_id;
    }
    
    // Verify access - exporters can only see their own drafts
    if (req.user.role === 'exporter') {
      const userExporterQuery = await postgresService.query(
        'SELECT exporter_id FROM exporter_profiles WHERE user_id = $1',
        [username]
      );
      
      if (userExporterQuery.rows.length === 0 || userExporterQuery.rows[0].exporter_id !== actualExporterId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    
    const query = `SELECT d.*, b.company_name as buyer_name, b.country as buyer_country FROM contract_drafts d LEFT JOIN buyer_registry b ON d.buyer_id = b.buyer_id WHERE d.exporter_id = $1 ORDER BY d.created_at DESC`;
    const result = await postgresService.query(query, [actualExporterId]);
    
    res.json({ success: true, exporterId: actualExporterId, drafts: result.rows });
  } catch (error) {
    console.error('Drafts fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get draft
router.get('/:draftId', authenticateToken, async (req, res) => {
  try {
    const { draftId } = req.params;
    const username = req.user.id;
    
    const query = `SELECT d.*, b.company_name as buyer_name, b.country as buyer_country, e.business_name as exporter_name FROM contract_drafts d LEFT JOIN buyer_registry b ON d.buyer_id = b.buyer_id LEFT JOIN exporter_profiles e ON d.exporter_id = e.exporter_id WHERE d.draft_id = $1`;
    const result = await postgresService.query(query, [draftId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Draft not found' });
    }
    
    const draft = result.rows[0];
    
    // Check access for exporters
    if (req.user.role === 'exporter') {
      const exporterQuery = await postgresService.query(
        'SELECT exporter_id FROM exporter_profiles WHERE user_id = $1',
        [username]
      );
      
      if (exporterQuery.rows.length === 0 || exporterQuery.rows[0].exporter_id !== draft.exporter_id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    
    res.json(draft);
  } catch (error) {
    console.error('Draft fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update draft
router.put('/:draftId', authenticateToken, async (req, res) => {
  try {
    const { draftId } = req.params;
    const username = req.user.id;
    const updates = req.body;
    
    // Get current draft
    const draftQuery = await postgresService.query(
      'SELECT * FROM contract_drafts WHERE draft_id = $1',
      [draftId]
    );
    
    if (draftQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Draft not found' });
    }
    
    const draft = draftQuery.rows[0];
    
    // Check access for exporters
    if (req.user.role === 'exporter') {
      const exporterQuery = await postgresService.query(
        'SELECT exporter_id FROM exporter_profiles WHERE user_id = $1',
        [username]
      );
      
      if (exporterQuery.rows.length === 0 || exporterQuery.rows[0].exporter_id !== draft.exporter_id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    
    // Build update query dynamically
    const allowedFields = ['coffee_type', 'origin_region', 'quantity', 'unit_price', 'currency', 'payment_terms', 'payment_method', 'incoterms', 'delivery_date', 'port_of_loading', 'port_of_discharge', 'governing_law', 'arbitration_location', 'arbitration_rules', 'contract_language', 'force_majeure_clause', 'quality_grade', 'special_conditions', 'certifications_required', 'notes', 'status'];
    
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = $${paramIndex}`);
        updateValues.push(value);
        paramIndex++;
      }
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(draftId);
    
    const updateQuery = `
      UPDATE contract_drafts 
      SET ${updateFields.join(', ')}
      WHERE draft_id = $${paramIndex}
      RETURNING *
    `;
    
    const result = await postgresService.query(updateQuery, updateValues);
    
    // Log activity
    await logNegotiationActivity(draftId, draft.exporter_id, 'EXPORTER', 'UPDATE', 'Contract draft updated', updates);
    
    res.json({ 
      success: true, 
      message: 'Draft updated successfully',
      draft: result.rows[0]
    });
  } catch (error) {
    console.error('Draft update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Accept contract draft
router.post('/:draftId/accept', authenticateToken, async (req, res) => {
  try {
    const { draftId } = req.params;
    const username = req.user.id;
    const { notes } = req.body;
    
    // Get current draft
    const draftQuery = await postgresService.query(
      'SELECT * FROM contract_drafts WHERE draft_id = $1',
      [draftId]
    );
    
    if (draftQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Draft not found' });
    }
    
    const draft = draftQuery.rows[0];
    
    // Determine responder type and validate access
    let responderId, responderType;
    
    if (req.user.role === 'exporter') {
      const exporterQuery = await postgresService.query(
        'SELECT exporter_id FROM exporter_profiles WHERE user_id = $1',
        [username]
      );
      
      if (exporterQuery.rows.length === 0) {
        return res.status(404).json({ error: 'Exporter profile not found' });
      }
      
      responderId = exporterQuery.rows[0].exporter_id;
      responderType = 'EXPORTER';
      
      // Exporter can only accept if they didn't propose it
      if (draft.proposed_by_type === 'EXPORTER' && draft.exporter_id === responderId) {
        return res.status(400).json({ error: 'Cannot accept your own proposal' });
      }
    } else if (req.user.role === 'buyer') {
      // For buyer role (if implemented)
      responderId = username; // Buyer ID
      responderType = 'BUYER';
      
      if (draft.proposed_by_type === 'BUYER') {
        return res.status(400).json({ error: 'Cannot accept your own proposal' });
      }
    } else {
      return res.status(403).json({ error: 'Only exporters or buyers can accept contracts' });
    }
    
    // Update draft with acceptance
    const updateQuery = `
      UPDATE contract_drafts 
      SET status = 'ACCEPTED',
          responded_by = $1,
          responded_by_type = $2,
          responded_at = CURRENT_TIMESTAMP,
          response_type = 'ACCEPT',
          response_notes = $3,
          updated_at = CURRENT_TIMESTAMP
      WHERE draft_id = $4
      RETURNING *
    `;
    
    const result = await postgresService.query(updateQuery, [responderId, responderType, notes, draftId]);
    
    // Log activity
    await logNegotiationActivity(draftId, responderId, responderType, 'ACCEPT', notes || 'Contract accepted', null);
    
    // Sync to blockchain (non-blocking) - fire and forget
    setImmediate(() => {
      syncContractToBlockchain(result.rows[0]).catch(err => {
        console.error('[Contract Accept] Blockchain sync failed (non-critical):', err.message);
      });
    });
    
    res.json({ 
      success: true, 
      message: 'Contract accepted successfully',
      draft: result.rows[0],
      blockchain: { synced: false, status: 'pending' }
    });
  } catch (error) {
    console.error('Contract accept error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reject contract draft
router.post('/:draftId/reject', authenticateToken, async (req, res) => {
  try {
    const { draftId } = req.params;
    const username = req.user.id;
    const { notes } = req.body;
    
    if (!notes) {
      return res.status(400).json({ error: 'Rejection reason (notes) is required' });
    }
    
    // Get current draft
    const draftQuery = await postgresService.query(
      'SELECT * FROM contract_drafts WHERE draft_id = $1',
      [draftId]
    );
    
    if (draftQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Draft not found' });
    }
    
    const draft = draftQuery.rows[0];
    
    // Determine responder type and validate access
    let responderId, responderType;
    
    if (req.user.role === 'exporter') {
      const exporterQuery = await postgresService.query(
        'SELECT exporter_id FROM exporter_profiles WHERE user_id = $1',
        [username]
      );
      
      if (exporterQuery.rows.length === 0) {
        return res.status(404).json({ error: 'Exporter profile not found' });
      }
      
      responderId = exporterQuery.rows[0].exporter_id;
      responderType = 'EXPORTER';
      
      // Exporter can only reject if they didn't propose it
      if (draft.proposed_by_type === 'EXPORTER' && draft.exporter_id === responderId) {
        return res.status(400).json({ error: 'Cannot reject your own proposal' });
      }
    } else if (req.user.role === 'buyer') {
      // For buyer role (if implemented)
      responderId = username; // Buyer ID
      responderType = 'BUYER';
      
      if (draft.proposed_by_type === 'BUYER') {
        return res.status(400).json({ error: 'Cannot reject your own proposal' });
      }
    } else {
      return res.status(403).json({ error: 'Only exporters or buyers can reject contracts' });
    }
    
    // Update draft with rejection
    const updateQuery = `
      UPDATE contract_drafts 
      SET status = 'REJECTED',
          responded_by = $1,
          responded_by_type = $2,
          responded_at = CURRENT_TIMESTAMP,
          response_type = 'REJECT',
          response_notes = $3,
          updated_at = CURRENT_TIMESTAMP
      WHERE draft_id = $4
      RETURNING *
    `;
    
    const result = await postgresService.query(updateQuery, [responderId, responderType, notes, draftId]);
    
    // Log activity
    await logNegotiationActivity(draftId, responderId, responderType, 'REJECT', notes, null);
    
    // Sync to blockchain (non-blocking) - fire and forget
    setImmediate(() => {
      syncContractToBlockchain(result.rows[0]).catch(err => {
        console.error('[Contract Reject] Blockchain sync failed (non-critical):', err.message);
      });
    });
    
    res.json({ 
      success: true, 
      message: 'Contract rejected successfully',
      draft: result.rows[0],
      blockchain: { synced: false, status: 'pending' }
    });
  } catch (error) {
    console.error('Contract reject error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Download contract draft certificate/document as PDF
 * GET /api/contracts/drafts/:draftId/certificate
 */
router.get('/:draftId/certificate', authenticateToken, async (req, res) => {
  try {
    const { draftId } = req.params;
    const username = req.user.id;
    
    // Get contract draft with related data
    const query = `
      SELECT d.*, 
             b.company_name as buyer_name, 
             b.country as buyer_country,
             b.address as buyer_address,
             e.business_name as exporter_name,
             e.tin as exporter_tin,
             e.office_address as exporter_address
      FROM contract_drafts d 
      LEFT JOIN buyer_registry b ON d.buyer_id = b.buyer_id 
      LEFT JOIN exporter_profiles e ON d.exporter_id = e.exporter_id
      WHERE d.draft_id = $1
    `;
    const result = await postgresService.query(query, [draftId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contract draft not found' });
    }
    
    const draft = result.rows[0];
    
    // Check access for exporters
    if (req.user.role === 'exporter') {
      const exporterQuery = await postgresService.query(
        'SELECT exporter_id FROM exporter_profiles WHERE user_id = $1',
        [username]
      );
      
      if (exporterQuery.rows.length === 0 || exporterQuery.rows[0].exporter_id !== draft.exporter_id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    
    // Fetch issued documents to get additional data
    const docsQuery = `
      SELECT document_type, document_metadata, issuer_member_code
      FROM issued_documents
      WHERE exporter_id = $1 AND status = 'ACTIVE'
      ORDER BY issued_at DESC
    `;
    const docsResult = await postgresService.query(docsQuery, [draft.exporter_id]);
    
    // Extract data from issued documents
    let extractedData = {
      originRegion: null,
      qualityGrade: null,
      portOfLoading: null,
      portOfDischarge: null,
      quantity: null,
      incoterms: null,
      paymentMethod: null,
      deliveryDate: null
    };
    
    // Parse document metadata to extract relevant information
    for (const doc of docsResult.rows) {
      const metadata = doc.document_metadata || {};
      
      // Extract data based on document type
      if (doc.document_type === 'EXPORT_LICENSE' || doc.document_type === 'EXPORT_PERMIT') {
        extractedData.originRegion = extractedData.originRegion || metadata.originRegion || metadata.region;
        extractedData.qualityGrade = extractedData.qualityGrade || metadata.grade || metadata.qualityGrade;
        extractedData.quantity = extractedData.quantity || metadata.quantity;
      }
      
      if (doc.document_type === 'CERTIFICATE_OF_ORIGIN') {
        extractedData.originRegion = extractedData.originRegion || metadata.originRegion || metadata.geographicalDesignation;
      }
      
      if (doc.document_type === 'QUALITY_CERTIFICATE') {
        extractedData.qualityGrade = extractedData.qualityGrade || metadata.grade || metadata.qualityGrade;
      }
      
      if (doc.document_type === 'SHIPPING_BOOKING' || doc.document_type === 'CARGO_MANIFEST') {
        extractedData.portOfLoading = extractedData.portOfLoading || metadata.portOfLoading;
        extractedData.portOfDischarge = extractedData.portOfDischarge || metadata.portOfDischarge;
        extractedData.incoterms = extractedData.incoterms || metadata.incoterms;
      }
      
      if (doc.document_type === 'BANK_GUARANTEE' || doc.document_type === 'PAYMENT_GUARANTEE') {
        extractedData.paymentMethod = extractedData.paymentMethod || metadata.paymentMethod || 'Letter of Credit';
      }
    }
    
    // Merge extracted data with draft data (draft data takes precedence if not null)
    const finalData = {
      originRegion: draft.origin_region || extractedData.originRegion || 'Ethiopian Highlands',
      qualityGrade: draft.quality_grade || extractedData.qualityGrade || 'Grade 1',
      paymentTerms: draft.payment_terms || '30 days after shipment',
      paymentMethod: draft.payment_method || extractedData.paymentMethod || 'Letter of Credit (LC)',
      incoterms: draft.incoterms || extractedData.incoterms || 'FOB',
      deliveryDate: draft.delivery_date || extractedData.deliveryDate,
      portOfLoading: draft.port_of_loading || extractedData.portOfLoading || 'Port of Djibouti',
      portOfDischarge: draft.port_of_discharge || extractedData.portOfDischarge || 'As per buyer destination'
    };
    
    // Generate PDF
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="contract-${draft.contract_number}.pdf"`);
    
    // Pipe PDF to response
    doc.pipe(res);
    
    // Header
    doc.rect(0, 0, 612, 80).fill('#2c3e50');
    doc.fillColor('#ffffff')
       .fontSize(24)
       .font('Helvetica-Bold')
       .text('SALES CONTRACT', 50, 25, { align: 'center' });
    doc.fontSize(12)
       .font('Helvetica')
       .text(draft.status === 'FINALIZED' ? 'Finalized Contract' : 'Draft Contract', 50, 55, { align: 'center' });
    
    let y = 100;
    
    // Contract details
    doc.fillColor('#000000')
       .fontSize(10)
       .font('Helvetica-Bold')
       .text(`Contract Number: ${draft.contract_number}`, 50, y);
    y += 15;
    doc.font('Helvetica')
       .text(`Version: ${draft.version}`, 50, y);
    y += 15;
    doc.text(`Status: ${draft.status}`, 50, y);
    y += 15;
    doc.text(`Date: ${new Date(draft.created_at).toLocaleDateString()}`, 50, y);
    y += 30;
    
    // Parties
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('PARTIES TO THE CONTRACT', 50, y);
    y += 20;
    
    // Exporter (Seller)
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .text('SELLER (Exporter):', 50, y);
    y += 15;
    doc.fontSize(10)
       .font('Helvetica')
       .text(`Name: ${draft.exporter_name || 'N/A'}`, 70, y);
    y += 12;
    doc.text(`TIN: ${draft.exporter_tin || 'N/A'}`, 70, y);
    y += 12;
    doc.text(`Address: ${draft.exporter_address || 'N/A'}`, 70, y);
    y += 25;
    
    // Buyer
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .text('BUYER:', 50, y);
    y += 15;
    doc.fontSize(10)
       .font('Helvetica')
       .text(`Name: ${draft.buyer_name || 'N/A'}`, 70, y);
    y += 12;
    doc.text(`Country: ${draft.buyer_country || 'N/A'}`, 70, y);
    y += 12;
    doc.text(`Address: ${draft.buyer_address || 'N/A'}`, 70, y);
    y += 30;
    
    // Product details
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('PRODUCT DETAILS', 50, y);
    y += 20;
    
    doc.fontSize(10)
       .font('Helvetica')
       .text(`Coffee Type: ${draft.coffee_type || 'Arabica'}`, 70, y);
    y += 12;
    doc.text(`Origin Region: ${finalData.originRegion}`, 70, y);
    y += 12;
    doc.text(`Quality Grade: ${finalData.qualityGrade}`, 70, y);
    y += 12;
    doc.text(`Quantity: ${draft.quantity || 'N/A'} kg`, 70, y);
    y += 12;
    doc.text(`Unit Price: ${draft.currency || 'USD'} ${draft.unit_price || 'N/A'} per kg`, 70, y);
    y += 12;
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .text(`Total Value: ${draft.currency || 'USD'} ${draft.total_value || 'N/A'}`, 70, y);
    y += 30;
    
    // Terms and conditions
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('TERMS AND CONDITIONS', 50, y);
    y += 20;
    
    doc.fontSize(10)
       .font('Helvetica')
       .text(`Payment Terms: ${finalData.paymentTerms}`, 70, y);
    y += 12;
    doc.text(`Payment Method: ${finalData.paymentMethod}`, 70, y);
    y += 12;
    doc.text(`Incoterms: ${finalData.incoterms}`, 70, y);
    y += 12;
    doc.text(`Delivery Date: ${finalData.deliveryDate ? new Date(finalData.deliveryDate).toLocaleDateString() : 'As per agreement'}`, 70, y);
    y += 12;
    doc.text(`Port of Loading: ${finalData.portOfLoading}`, 70, y);
    y += 12;
    doc.text(`Port of Discharge: ${finalData.portOfDischarge}`, 70, y);
    y += 12;
    doc.text(`Governing Law: ${draft.governing_law || 'CISG (UN Convention on Contracts for the International Sale of Goods)'}`, 70, y);
    
    // Add new page if needed
    if (y > 650) {
      doc.addPage();
      y = 50;
    } else {
      y += 30;
    }
    
    // Special conditions
    if (draft.special_conditions) {
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('SPECIAL CONDITIONS', 50, y);
      y += 20;
      doc.fontSize(9)
         .font('Helvetica')
         .text(draft.special_conditions, 70, y, { width: 470, align: 'justify' });
      y += 40;
    }
    
    // Footer
    doc.fontSize(8)
       .font('Helvetica')
       .text(`Generated on: ${new Date().toLocaleString()}`, 50, 750, { align: 'center' });
    doc.text('Ethiopian Coffee & Tea Authority - Coffee Export Platform', 50, 765, { align: 'center' });
    
    // Finalize PDF
    doc.end();
    
  } catch (error) {
    console.error('Certificate download error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

// Counter-offer on contract draft
router.post('/:draftId/counter', authenticateToken, async (req, res) => {
  try {
    const { draftId } = req.params;
    const username = req.user.id;
    const { notes, changes } = req.body;
    
    if (!notes || !changes) {
      return res.status(400).json({ error: 'Counter-offer notes and changes are required' });
    }
    
    // Get current draft
    const draftQuery = await postgresService.query(
      'SELECT * FROM contract_drafts WHERE draft_id = $1',
      [draftId]
    );
    
    if (draftQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Draft not found' });
    }
    
    const draft = draftQuery.rows[0];
    
    // Determine responder type
    let responderId, responderType;
    
    if (req.user.role === 'exporter') {
      const exporterQuery = await postgresService.query(
        'SELECT exporter_id FROM exporter_profiles WHERE user_id = $1',
        [username]
      );
      
      if (exporterQuery.rows.length === 0) {
        return res.status(404).json({ error: 'Exporter profile not found' });
      }
      
      responderId = exporterQuery.rows[0].exporter_id;
      responderType = 'EXPORTER';
    } else if (req.user.role === 'buyer') {
      responderId = username;
      responderType = 'BUYER';
    } else {
      return res.status(403).json({ error: 'Only exporters or buyers can counter-offer' });
    }
    
    // Create new version with counter-offer
    const newVersion = draft.version + 1;
    const newContractNumber = `${draft.contract_number}-V${newVersion}`;
    
    // Apply changes to create new draft
    const newDraft = { ...draft, ...changes };
    
    const insertQuery = `
      INSERT INTO contract_drafts (
        contract_number, version, status, exporter_id, buyer_id,
        coffee_type, origin_region, quantity, unit_price, currency, total_value,
        payment_terms, payment_method, incoterms, delivery_date,
        port_of_loading, port_of_discharge, governing_law,
        proposed_by, proposed_by_type, parent_draft_id,
        response_notes
      ) VALUES (
        $1, $2, 'COUNTER', $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
      ) RETURNING *
    `;
    
    const result = await postgresService.query(insertQuery, [
      newContractNumber, newVersion, newDraft.exporter_id, newDraft.buyer_id,
      newDraft.coffee_type, newDraft.origin_region, newDraft.quantity,
      newDraft.unit_price, newDraft.currency, newDraft.quantity * newDraft.unit_price,
      newDraft.payment_terms, newDraft.payment_method, newDraft.incoterms,
      newDraft.delivery_date, newDraft.port_of_loading, newDraft.port_of_discharge,
      newDraft.governing_law, username, responderType, draftId, notes
    ]);
    
    // Update original draft
    await postgresService.query(
      `UPDATE contract_drafts SET status = 'COUNTERED', responded_by = $1, responded_by_type = $2, responded_at = CURRENT_TIMESTAMP, response_type = 'COUNTER', response_notes = $3 WHERE draft_id = $4`,
      [responderId, responderType, notes, draftId]
    );
    
    // Log activity
    await logNegotiationActivity(draftId, responderId, responderType, 'COUNTER', notes, changes);
    
    res.json({ 
      success: true, 
      message: 'Counter-offer created successfully',
      original_draft: draftId,
      new_draft: result.rows[0]
    });
  } catch (error) {
    console.error('Counter-offer error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export router at the end
module.exports = router;
