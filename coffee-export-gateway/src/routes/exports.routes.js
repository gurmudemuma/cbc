const express = require('express');
const router = express.Router();
const fabricService = require('../services');
const postgresService = require('../services/postgres');
const { authenticateToken } = require('../middleware/auth');

/**
 * Get export statistics
 * GET /api/exports/stats
 * Returns statistics from PostgreSQL exports table
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Query PostgreSQL for export statistics
    // Note: Exports table is currently empty, but structure is ready
    const statsQuery = `
      SELECT 
        COUNT(*) as total_exports,
        COALESCE(SUM(estimated_value), 0) as total_value,
        COUNT(*) FILTER (WHERE status IN ('COMPLETED', 'DELIVERED')) as completed_exports,
        COUNT(*) FILTER (WHERE status IN ('SHIPPED', 'IN_TRANSIT', 'SHIPMENT_SCHEDULED')) as active_shipments,
        COUNT(*) FILTER (WHERE status LIKE '%PENDING%' OR status IN ('DRAFT', 'SUBMITTED')) as pending_action
      FROM exports
      WHERE exporter_id IN (
        SELECT exporter_id FROM exporter_profiles WHERE user_id = $1
      )
    `;
    
    const result = await postgresService.query(statsQuery, [userId]);
    const stats = result.rows[0];
    
    res.json({
      success: true,
      data: {
        totalExports: parseInt(stats.total_exports) || 0,
        totalValue: parseFloat(stats.total_value) || 0,
        completedExports: parseInt(stats.completed_exports) || 0,
        activeShipments: parseInt(stats.active_shipments) || 0,
        pendingAction: parseInt(stats.pending_action) || 0
      },
      source: 'postgresql',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Export stats error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * Get all exports (for listing)
 * GET /api/exports
 * Supports query parameters: status, limit, offset
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    const userRole = req.user.role?.toLowerCase();
    
    // Use PostgreSQL for listing exports
    const pool = require('../services/postgres');
    
    let query = `
      SELECT 
        e.export_id,
        e.exporter_id,
        e.status,
        e.coffee_type,
        e.quantity,
        e.destination_country,
        e.buyer_name,
        e.buyer_country,
        e.estimated_value,
        e.currency,
        e.buyer_id,
        e.contract_id,
        e.sales_contract_id,
        e.created_at,
        e.updated_at,
        ep.business_name as exporter_name,
        cd.lc_number,
        cd.payment_method,
        cd.payment_terms,
        cd.issuing_bank,
        cd.advising_bank,
        cd.lc_expiry_date,
        cd.total_value as contract_amount
      FROM exports e
      LEFT JOIN exporter_profiles ep ON e.exporter_id = ep.exporter_id
      LEFT JOIN contract_drafts cd ON (e.contract_id = cd.draft_id OR e.sales_contract_id = cd.draft_id)
    `;
    
    const params = [];
    const conditions = [];
    let paramCount = 1;
    
    // For exporters, only show their own exports
    if (userRole === 'exporter') {
      const exporterQuery = 'SELECT exporter_id FROM exporter_profiles WHERE user_id = $1';
      const exporterResult = await pool.query(exporterQuery, [req.user.id]);
      
      if (exporterResult.rows.length > 0) {
        conditions.push(`e.exporter_id = $${paramCount}`);
        params.push(exporterResult.rows[0].exporter_id);
        paramCount++;
      } else {
        // No exporter profile, return empty
        return res.json({
          success: true,
          exports: [],
          count: 0,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // Filter by status if provided
    if (status) {
      conditions.push(`e.status = $${paramCount}`);
      params.push(status.toUpperCase());
      paramCount++;
    }
    
    // Add WHERE clause if there are conditions
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    // Add ordering and pagination
    query += ` ORDER BY e.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      exports: result.rows,
      count: result.rows.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Exports fetch error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * Create new export contract
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const exportData = {
      exportId: `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      exporterId: req.body.exporterId || req.user.id,
      coffeeType: req.body.coffeeType,
      quantity: req.body.quantity,
      destinationCountry: req.body.destinationCountry,
      estimatedValue: req.body.estimatedValue || 0,
      buyerCompanyName: req.body.buyerCompanyName || '',
      buyerCountry: req.body.buyerCountry || req.body.destinationCountry,
      paymentTerms: req.body.paymentTerms || '',
      deliveryTerms: req.body.deliveryTerms || '',
      geographicalDesignation: req.body.geographicalDesignation || '',
      ecxAuctionReference: req.body.ecxAuctionReference || null
    };

    // Submit to blockchain
    const result = await fabricService.submitTransaction(
      req.user.id,
      process.env.CHAINCODE_NAME || 'ecta',
      'CreateExportRequest',
      JSON.stringify(exportData)
    );

    // Also insert into PostgreSQL for querying
    const pool = require('../services/postgres');
    
    // Get exporter_id from exporter_profiles
    const exporterQuery = await pool.query(
      'SELECT exporter_id FROM exporter_profiles WHERE user_id = $1',
      [req.user.id]
    );
    
    const exporterId = exporterQuery.rows[0]?.exporter_id || exportData.exporterId;
    
    // Insert export into PostgreSQL
    const insertQuery = `
      INSERT INTO exports (
        export_id, exporter_id, coffee_type, quantity, 
        destination_country, estimated_value, currency, 
        buyer_name, buyer_country, payment_terms, 
        delivery_terms, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      ON CONFLICT (export_id) DO UPDATE SET
        updated_at = NOW()
      RETURNING *
    `;
    
    const insertResult = await pool.query(insertQuery, [
      exportData.exportId,
      exporterId,
      exportData.coffeeType,
      exportData.quantity,
      exportData.destinationCountry,
      exportData.estimatedValue,
      req.body.currency || 'USD',
      exportData.buyerCompanyName,
      exportData.buyerCountry,
      exportData.paymentTerms,
      exportData.deliveryTerms,
      req.body.status || 'DRAFT'
    ]);

    res.json({
      success: true,
      exportId: exportData.exportId,
      data: insertResult.rows[0],
      blockchain: JSON.parse(result)
    });
  } catch (error) {
    console.error('Export creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get export details by ID
 * GET /api/exports/:exportId
 */
router.get('/:exportId', authenticateToken, async (req, res) => {
  try {
    const { exportId } = req.params;
    const pool = require('../services/postgres');
    
    // Query PostgreSQL for export details with contract information
    const query = `
      SELECT 
        e.*,
        ep.business_name as exporter_name,
        ep.tin as exporter_tin,
        br.company_name as buyer_company_name,
        br.country as buyer_country,
        br.contact_person as buyer_contact,
        cd.lc_number,
        cd.payment_method as contract_payment_method,
        cd.payment_terms as contract_payment_terms,
        cd.issuing_bank,
        cd.advising_bank,
        cd.lc_expiry_date,
        cd.total_value as contract_total_value,
        cd.currency as contract_currency,
        cd.status as contract_status
      FROM exports e
      LEFT JOIN exporter_profiles ep ON e.exporter_id = ep.exporter_id
      LEFT JOIN buyer_registry br ON e.buyer_id = br.buyer_id
      LEFT JOIN contract_drafts cd ON (e.contract_id = cd.draft_id OR e.sales_contract_id = cd.draft_id)
      WHERE e.export_id = $1
    `;
    
    const result = await pool.query(query, [exportId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Export not found'
      });
    }
    
    const exportData = result.rows[0];
    
    // Structure the response with contract details
    const response = {
      ...exportData,
      contract_details: exportData.lc_number ? {
        lc_number: exportData.lc_number,
        payment_method: exportData.contract_payment_method,
        payment_terms: exportData.contract_payment_terms,
        issuing_bank: exportData.issuing_bank,
        advising_bank: exportData.advising_bank,
        lc_expiry_date: exportData.lc_expiry_date,
        total_value: exportData.contract_total_value,
        currency: exportData.contract_currency,
        status: exportData.contract_status
      } : null
    };
    
    res.json({
      success: true,
      export: response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Export fetch error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * Get all exports for an exporter
 */
router.get('/exporter/:exporterId', authenticateToken, async (req, res) => {
  try {
    const result = await fabricService.evaluateTransaction(
      req.user.id,
      process.env.CHAINCODE_NAME || 'ecta',
      'GetExporterExports',
      req.params.exporterId
    );

    res.json(JSON.parse(result));
  } catch (error) {
    console.error('Exports fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update export contract details
 */
router.put('/:exportId/contract', authenticateToken, async (req, res) => {
  try {
    const updates = {
      buyerCompanyName: req.body.buyerCompanyName,
      buyerCountry: req.body.buyerCountry,
      paymentTerms: req.body.paymentTerms,
      deliveryTerms: req.body.deliveryTerms,
      geographicalDesignation: req.body.geographicalDesignation,
      ecxAuctionReference: req.body.ecxAuctionReference
    };

    // Update on blockchain
    const result = await fabricService.submitTransaction(
      req.user.id,
      process.env.CHAINCODE_NAME || 'ecta',
      'UpdateExportContract',
      req.params.exportId,
      JSON.stringify(updates)
    );

    // Also update in PostgreSQL
    const pool = require('../services/postgres');
    try {
      await pool.query(
        `UPDATE exports 
         SET buyer_name = COALESCE($1, buyer_name),
             buyer_country = COALESCE($2, buyer_country),
             payment_terms = COALESCE($3, payment_terms),
             delivery_terms = COALESCE($4, delivery_terms),
             geographical_designation = COALESCE($5, geographical_designation),
             ecx_auction_reference = COALESCE($6, ecx_auction_reference),
             updated_at = NOW()
         WHERE export_id = $7`,
        [
          updates.buyerCompanyName,
          updates.buyerCountry,
          updates.paymentTerms,
          updates.deliveryTerms,
          updates.geographicalDesignation,
          updates.ecxAuctionReference,
          req.params.exportId
        ]
      );
    } catch (pgError) {
      console.log('PostgreSQL update skipped:', pgError.message);
    }

    res.json({
      success: true,
      result: JSON.parse(result)
    });
  } catch (error) {
    console.error('Contract update error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update banking details
 */
router.put('/:exportId/banking', authenticateToken, async (req, res) => {
  try {
    const bankingDetails = {
      lcNumber: req.body.lcNumber,
      lcIssuingBank: req.body.lcIssuingBank,
      lcAmount: req.body.lcAmount,
      lcCurrency: req.body.lcCurrency
    };

    const result = await fabricService.submitTransaction(
      req.user.id,
      process.env.CHAINCODE_NAME || 'ecta',
      'UpdateBankingDetails',
      req.params.exportId,
      JSON.stringify(bankingDetails)
    );

    res.json({
      success: true,
      result: JSON.parse(result)
    });
  } catch (error) {
    console.error('Banking update error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update shipping details
 */
router.put('/:exportId/shipping', authenticateToken, async (req, res) => {
  try {
    const shippingDetails = {
      billOfLadingNumber: req.body.billOfLadingNumber,
      containerNumber: req.body.containerNumber,
      vesselName: req.body.vesselName,
      portOfLoading: req.body.portOfLoading,
      portOfDischarge: req.body.portOfDischarge,
      estimatedDepartureDate: req.body.estimatedDepartureDate,
      estimatedArrivalDate: req.body.estimatedArrivalDate
    };

    const result = await fabricService.submitTransaction(
      req.user.id,
      process.env.CHAINCODE_NAME || 'ecta',
      'UpdateShippingDetails',
      req.params.exportId,
      JSON.stringify(shippingDetails)
    );

    res.json({
      success: true,
      result: JSON.parse(result)
    });
  } catch (error) {
    console.error('Shipping update error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get shipment tracking
 */
router.get('/:exportId/tracking', authenticateToken, async (req, res) => {
  try {
    const result = await fabricService.evaluateTransaction(
      req.user.id,
      process.env.CHAINCODE_NAME || 'ecta',
      'GetExportRequest',
      req.params.exportId
    );

    const exportData = JSON.parse(result);
    
    res.json({
      exportId: exportData.exportId,
      status: exportData.status,
      workflow: exportData.workflow,
      billOfLadingNumber: exportData.billOfLadingNumber,
      containerNumber: exportData.containerNumber,
      vesselName: exportData.vesselName,
      estimatedDepartureDate: exportData.estimatedDepartureDate,
      estimatedArrivalDate: exportData.estimatedArrivalDate
    });
  } catch (error) {
    console.error('Tracking error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get export history/audit trail
 */
router.get('/:exportId/history', authenticateToken, async (req, res) => {
  try {
    const result = await fabricService.evaluateTransaction(
      req.user.id,
      process.env.CHAINCODE_NAME || 'ecta',
      'GetAssetHistory',
      req.params.exportId
    );

    res.json(JSON.parse(result));
  } catch (error) {
    console.error('History fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Banking approval - Commercial Bank permits export to proceed
 * POST /api/exports/:exportId/banking/approve
 */
router.post('/:exportId/banking/approve', authenticateToken, async (req, res) => {
  try {
    const { exportId } = req.params;
    const { 
      lcNumber, 
      lcIssuingBank, 
      lcAmount, 
      lcCurrency,
      importerBank,
      importerBankSwift,
      paymentMethod,
      notes 
    } = req.body;

    // Update banking details and approve
    const approvalData = {
      status: 'BANKING_APPROVED',
      bankingApprovedBy: req.user.id,
      bankingApprovedAt: new Date().toISOString(),
      bankingNotes: notes || '',
      lcNumber: lcNumber || '',
      lcIssuingBank: lcIssuingBank || importerBank || '',
      lcAmount: lcAmount || 0,
      lcCurrency: lcCurrency || 'USD',
      importerBank: importerBank || '',
      importerBankSwift: importerBankSwift || '',
      paymentMethod: paymentMethod || 'LC'
    };

    // Update on blockchain
    const result = await fabricService.submitTransaction(
      req.user.id,
      process.env.CHAINCODE_NAME || 'ecta',
      'UpdateExportStatus',
      exportId,
      'BANKING_APPROVED',
      JSON.stringify(approvalData)
    );

    // Update in PostgreSQL if exists
    try {
      await postgresService.query(
        `UPDATE exports 
         SET status = $1,
             banking_approved_by = $2,
             banking_approved_at = CURRENT_TIMESTAMP,
             banking_notes = $3,
             lc_number = $4,
             lc_issuing_bank = $5,
             lc_amount = $6,
             lc_currency = $7,
             importer_bank = $8,
             importer_bank_swift = $9,
             payment_method = $10,
             updated_at = CURRENT_TIMESTAMP
         WHERE export_id = $11`,
        [
          'BANKING_APPROVED',
          req.user.id,
          notes || '',
          lcNumber || '',
          lcIssuingBank || importerBank || '',
          lcAmount || 0,
          lcCurrency || 'USD',
          importerBank || '',
          importerBankSwift || '',
          paymentMethod || 'LC',
          exportId
        ]
      );
    } catch (pgError) {
      console.log('PostgreSQL update skipped (export may not exist in DB yet):', pgError.message);
    }

    res.json({
      success: true,
      message: 'Export approved by Commercial Bank - permitted to proceed to other network members',
      exportId,
      status: 'BANKING_APPROVED',
      result: JSON.parse(result)
    });
  } catch (error) {
    console.error('Banking approval error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * Banking rejection - Commercial Bank rejects export
 * POST /api/exports/:exportId/banking/reject
 */
router.post('/:exportId/banking/reject', authenticateToken, async (req, res) => {
  try {
    const { exportId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ 
        success: false,
        error: 'Rejection reason is required' 
      });
    }

    const rejectionData = {
      status: 'BANKING_REJECTED',
      bankingRejectedBy: req.user.id,
      bankingRejectedAt: new Date().toISOString(),
      bankingRejectionReason: reason
    };

    // Update on blockchain
    const result = await fabricService.submitTransaction(
      req.user.id,
      process.env.CHAINCODE_NAME || 'ecta',
      'UpdateExportStatus',
      exportId,
      'BANKING_REJECTED',
      JSON.stringify(rejectionData)
    );

    // Update in PostgreSQL if exists
    try {
      await postgresService.query(
        `UPDATE exports 
         SET status = $1,
             banking_rejected_by = $2,
             banking_rejected_at = CURRENT_TIMESTAMP,
             banking_rejection_reason = $3,
             updated_at = CURRENT_TIMESTAMP
         WHERE export_id = $4`,
        ['BANKING_REJECTED', req.user.id, reason, exportId]
      );
    } catch (pgError) {
      console.log('PostgreSQL update skipped (export may not exist in DB yet):', pgError.message);
    }

    res.json({
      success: true,
      message: 'Export rejected by Commercial Bank - will NOT proceed to other network members',
      exportId,
      status: 'BANKING_REJECTED',
      reason,
      result: JSON.parse(result)
    });
  } catch (error) {
    console.error('Banking rejection error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * Verify export document - Commercial Bank verifies documents
 * POST /api/exports/:exportId/banking/verify
 */
router.post('/:exportId/banking/verify', authenticateToken, async (req, res) => {
  try {
    const { exportId } = req.params;
    const { documents, notes } = req.body;

    const verificationData = {
      documentsVerified: true,
      documentsVerifiedBy: req.user.id,
      documentsVerifiedAt: new Date().toISOString(),
      verifiedDocuments: documents || [],
      verificationNotes: notes || ''
    };

    // Update on blockchain
    const result = await fabricService.submitTransaction(
      req.user.id,
      process.env.CHAINCODE_NAME || 'ecta',
      'UpdateExportDetails',
      exportId,
      JSON.stringify(verificationData)
    );

    res.json({
      success: true,
      message: 'Documents verified by Commercial Bank',
      exportId,
      result: JSON.parse(result)
    });
  } catch (error) {
    console.error('Document verification error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

module.exports = router;
