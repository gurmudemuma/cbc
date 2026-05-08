const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const postgresService = require('../services/postgres');
const { generateSalesContractCertificate } = require('../utils/sales-contract-certificate');
const hybridDataService = require('../services/hybrid-data-service');

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

// Accept draft and automatically finalize
router.post('/:draftId/accept', authenticateToken, async (req, res) => {
  try {
    const { draftId } = req.params;
    const actorUsername = req.user.id;
    
    // Step 1: Get the draft with full details
    const draftQuery = `
      SELECT d.*, 
             b.buyer_id, b.company_name as buyer_company_name, b.country as buyer_country,
             b.address as buyer_address, b.email as buyer_email, b.phone as buyer_phone,
             b.tax_id as buyer_tax_id, b.registration_number as buyer_registration_number,
             e.exporter_id, e.business_name as exporter_name, e.tin as exporter_tin,
             e.contact_person as exporter_contact, e.email as exporter_email, 
             e.phone as exporter_phone, e.office_address as exporter_address,
             e.city as exporter_city, e.region as exporter_region
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
    
    // Step 2: Update draft status to ACCEPTED
    const updateQuery = `
      UPDATE contract_drafts
      SET status = 'ACCEPTED',
          responded_by = $1,
          responded_by_type = 'BUYER',
          responded_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE draft_id = $2
      RETURNING draft_id, status, responded_at
    `;
    
    const updateResult = await postgresService.query(updateQuery, [actorUsername, draftId]);
    
    await logNegotiationActivity(
      draftId,
      actorUsername,
      'BUYER',
      'ACCEPT',
      'Contract draft accepted - proceeding to finalization',
      null
    );
    
    // Step 3: Automatically finalize the contract
    console.log(`[Contract Accept] Auto-finalizing draft ${draftId} with complete buyer and exporter data`);
    
    // Generate ECTA reference number
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const ectaReferenceNumber = `ECTA-SC-${dateStr}-${randomNum}`;
    
    // Generate contract ID
    const crypto = require('crypto');
    const finalizedContractId = crypto.randomUUID();
    
    // Prepare comprehensive contract data with both buyer and exporter information
    const contractData = {
      draftId: draftId,
      contractId: finalizedContractId,
      contractNumber: draft.contract_number, // Required by chaincode
      ectaReferenceNumber: ectaReferenceNumber,
      // Exporter data
      exporterId: draft.exporter_id,
      exporterName: draft.exporter_name,
      exporterTin: draft.exporter_tin,
      exporterContact: draft.exporter_contact,
      exporterEmail: draft.exporter_email,
      exporterPhone: draft.exporter_phone,
      exporterAddress: `${draft.exporter_address}, ${draft.exporter_city}, ${draft.exporter_region}`,
      // Buyer data
      buyerId: draft.buyer_id,
      buyerName: draft.buyer_company_name,
      buyerCountry: draft.buyer_country,
      buyerAddress: draft.buyer_address,
      buyerEmail: draft.buyer_email,
      buyerPhone: draft.buyer_phone,
      buyerTaxId: draft.buyer_tax_id,
      buyerRegistrationNumber: draft.buyer_registration_number,
      // Contract terms
      coffeeType: draft.coffee_type,
      originRegion: draft.origin_region,
      quantity: draft.quantity,
      unitPrice: draft.unit_price,
      totalValue: draft.total_value,
      currency: draft.currency,
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
      forceMajeureClause: draft.force_majeure_clause,
      specialConditions: draft.special_conditions,
      certificationsRequired: draft.certifications_required,
      status: 'FINALIZED',
      proposedBy: draft.proposed_by || actorUsername,
      proposedByType: draft.proposed_by_type || 'EXPORTER'
    };
    
    console.log('[Contract Accept] Finalizing contract in PostgreSQL...');
    
    // Update the draft with finalization details in PostgreSQL
    const finalizeQuery = `
      UPDATE contract_drafts
      SET status = 'FINALIZED',
          finalized_contract_id = $1,
          ecta_reference_number = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE draft_id = $3
      RETURNING draft_id, status, finalized_contract_id, ecta_reference_number, contract_number
    `;
    
    const finalizeResult = await postgresService.query(finalizeQuery, [
      finalizedContractId,
      ectaReferenceNumber,
      draftId
    ]);
    
    console.log('[Contract Accept] PostgreSQL finalization successful');
    
    // Attempt blockchain write (non-blocking)
    let blockchainTxId = null;
    try {
      console.log('[Contract Accept] Attempting blockchain write...');
      const fabricService = require('../services/index');
      
      // First, ensure exporter exists on blockchain
      try {
        console.log('[Contract Accept] Checking if exporter exists on blockchain...');
        await fabricService.evaluateTransaction(
          'system',
          'ecta',
          'GetExporterProfile',
          draft.exporter_id
        );
        console.log('[Contract Accept] Exporter exists on blockchain');
      } catch (exporterError) {
        // Exporter doesn't exist, create it
        console.log('[Contract Accept] Exporter not found on blockchain, creating...');
        const exporterProfile = {
          exporterId: draft.exporter_id,
          companyName: draft.exporter_name,
          tin: draft.exporter_tin,
          capitalETB: 20000000, // Default minimum capital
          licenseNumber: '',
          licenseType: 'export',
          status: 'approved',
          preRegistrationStatus: {
            profile: { status: 'approved', submittedAt: new Date().toISOString() },
            laboratory: { status: 'not_started' },
            taster: { status: 'not_started' },
            competenceCertificate: { status: 'not_started' },
            exportLicense: { status: 'not_started' }
          }
        };
        
        await fabricService.submitTransaction(
          'system',
          'ecta',
          'SubmitPreRegistration',
          JSON.stringify(exporterProfile)
        );
        console.log('[Contract Accept] Exporter profile created on blockchain');
      }
      
      // Now write the contract draft to blockchain
      blockchainTxId = await fabricService.submitTransaction(
        'system',
        'ecta',
        'CreateContractDraft',
        JSON.stringify(contractData)
      );
      
      if (blockchainTxId) {
        console.log('[Contract Accept] Blockchain write successful:', blockchainTxId);
      }
    } catch (blockchainError) {
      console.warn('[Contract Accept] Blockchain write failed (non-blocking):', blockchainError.message);
    }
    
    // Log finalization activity
    await logNegotiationActivity(
      draftId,
      actorUsername,
      'SYSTEM',
      'MODIFY',
      'Contract automatically finalized with complete buyer and exporter data',
      { 
        ectaReferenceNumber, 
        finalizedContractId,
        blockchainTxId: blockchainTxId,
        buyerData: {
          name: draft.buyer_company_name,
          country: draft.buyer_country,
          taxId: draft.buyer_tax_id
        },
        exporterData: {
          name: draft.exporter_name,
          tin: draft.exporter_tin,
          contact: draft.exporter_contact
        }
      }
    );
    
    // Step 4: Submit to ECTA for registration (non-blocking)
    let ectaSubmissionStatus = 'pending';
    try {
      console.log('[Contract Accept] Submitting to ECTA for registration...');
      
      // Create ECTA registration record
      const ectaSubmissionQuery = `
        INSERT INTO ecta_contract_submissions (
          draft_id,
          ecta_reference_number,
          exporter_id,
          buyer_id,
          submission_status,
          submitted_at,
          contract_data
        ) VALUES ($1, $2, $3, $4, 'PENDING_REGISTRATION', CURRENT_TIMESTAMP, $5)
        RETURNING submission_id
      `;
      
      const submissionData = {
        coffeeType: draft.coffee_type,
        quantity: draft.quantity,
        totalValue: draft.total_value,
        exporterName: draft.exporter_name,
        buyerName: draft.buyer_company_name,
        buyerCountry: draft.buyer_country
      };
      
      const submissionResult = await postgresService.query(ectaSubmissionQuery, [
        draftId,
        ectaReferenceNumber,
        draft.exporter_id,
        draft.buyer_id,
        JSON.stringify(submissionData)
      ]);
      
      ectaSubmissionStatus = 'submitted';
      console.log(`[Contract Accept] Submitted to ECTA for registration: ${submissionResult.rows[0].submission_id}`);
      
      // Log submission activity
      await logNegotiationActivity(
        draftId,
        'SYSTEM',
        'SYSTEM',
        'MODIFY',
        'Contract submitted to ECTA for registration',
        { 
          submissionId: submissionResult.rows[0].submission_id,
          ectaReferenceNumber: ectaReferenceNumber
        }
      );
    } catch (ectaError) {
      console.warn('[Contract Accept] ECTA submission failed (non-blocking):', ectaError.message);
      ectaSubmissionStatus = 'failed';
    }
    
    console.log(`✓ Contract accepted and finalized: ${ectaReferenceNumber}`);
    console.log(`  PostgreSQL: SUCCESS`);
    console.log(`  Blockchain: ${blockchainTxId ? 'SUCCESS' : 'FAILED (non-blocking)'}`);
    console.log(`  ECTA Submission: ${ectaSubmissionStatus.toUpperCase()}`);
    console.log(`  Buyer: ${draft.buyer_company_name} (${draft.buyer_country})`);
    console.log(`  Exporter: ${draft.exporter_name} (TIN: ${draft.exporter_tin})`);
    
    res.json({
      success: true,
      message: 'Contract accepted, finalized, and submitted to ECTA for registration',
      draft: finalizeResult.rows[0],
      ectaReferenceNumber: ectaReferenceNumber,
      finalizedContractId: finalizedContractId,
      buyerInfo: {
        name: draft.buyer_company_name,
        country: draft.buyer_country,
        email: draft.buyer_email
      },
      exporterInfo: {
        name: draft.exporter_name,
        tin: draft.exporter_tin,
        email: draft.exporter_email
      },
      syncStatus: {
        postgres: true,
        blockchain: !!blockchainTxId,
        ectaSubmission: ectaSubmissionStatus,
        errors: [
          ...(!blockchainTxId ? ['Blockchain write failed (non-blocking)'] : []),
          ...(ectaSubmissionStatus === 'failed' ? ['ECTA submission failed (non-blocking)'] : [])
        ]
      },
      note: `Contract finalized and ${ectaSubmissionStatus === 'submitted' ? 'submitted to ECTA for registration' : 'awaiting ECTA submission'}. ${blockchainTxId ? 'Synced to blockchain.' : 'Blockchain sync pending.'}`
    });
  } catch (error) {
    console.error('Accept and finalize error:', error);
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

// Finalize contract (using hybrid service for dual-write)
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
    
    // Generate ECTA reference number (format: ECTA-SC-YYYYMMDD-XXXXX)
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const ectaReferenceNumber = `ECTA-SC-${dateStr}-${randomNum}`;
    
    // Generate contract ID as UUID
    const crypto = require('crypto');
    const finalizedContractId = crypto.randomUUID();
    
    // Prepare contract data for hybrid write
    const contractData = {
      draftId: draftId,
      contractId: finalizedContractId,
      ectaReferenceNumber: ectaReferenceNumber,
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
      forceMajeureClause: draft.force_majeure_clause,
      status: 'FINALIZED'
    };
    
    console.log('[Contract Finalize] Using hybrid service for dual-write...');
    
    // HYBRID WRITE: Write to both PostgreSQL and Blockchain
    const writeResults = await hybridDataService.writeContract(contractData);
    
    // Check if PostgreSQL write succeeded (critical)
    if (!writeResults.postgres) {
      console.error('[Contract Finalize] PostgreSQL write failed');
      return res.status(500).json({ 
        error: 'Contract finalization failed',
        details: 'Database write failed'
      });
    }
    
    // Update the draft status in PostgreSQL (blockchain_tx_id column doesn't exist, removed)
    const updateQuery = `
      UPDATE contract_drafts
      SET status = 'FINALIZED',
          finalized_contract_id = $1,
          ecta_reference_number = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE draft_id = $3
      RETURNING draft_id, status, finalized_contract_id, ecta_reference_number, contract_number
    `;
    
    const updateResult = await postgresService.query(updateQuery, [
      finalizedContractId,
      ectaReferenceNumber,
      draftId
    ]);
    
    // Log finalization activity
    await logNegotiationActivity(
      draftId,
      req.user.id,
      'EXPORTER',
      'MODIFY',
      'Contract finalized with ECTA reference number',
      { 
        ectaReferenceNumber, 
        finalizedContractId,
        blockchainTxId: writeResults.blockchain
      }
    );
    
    console.log(`✓ Contract finalized via hybrid service: ${ectaReferenceNumber}`);
    console.log(`  PostgreSQL: ${writeResults.postgres ? 'SUCCESS' : 'FAILED'}`);
    console.log(`  Blockchain: ${writeResults.blockchain ? 'SUCCESS' : 'FAILED (non-blocking)'}`);
    
    if (writeResults.errors.length > 0) {
      console.warn('[Contract Finalize] Errors during hybrid write:', writeResults.errors);
    }
    
    // Return success
    res.json({
      success: true,
      message: 'Contract finalized successfully',
      draft: updateResult.rows[0],
      ectaReferenceNumber: ectaReferenceNumber,
      finalizedContractId: finalizedContractId,
      syncStatus: {
        postgres: !!writeResults.postgres,
        blockchain: !!writeResults.blockchain,
        errors: writeResults.errors
      },
      note: writeResults.blockchain 
        ? 'Contract finalized and synced to blockchain'
        : 'Contract finalized in database. Blockchain sync can be retried later.'
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
