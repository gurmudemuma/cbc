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
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Use PostgreSQL for listing all exports (more efficient than blockchain query)
    const pool = require('../services/postgres');
    const result = await pool.query(`
      SELECT 
        export_id,
        exporter_id,
        status,
        coffee_type,
        quantity,
        destination_country,
        buyer_name,
        buyer_country,
        estimated_value,
        created_at,
        updated_at,
        organization_id
      FROM exports 
      ORDER BY created_at DESC
    `);
    
    res.json({
      success: true,
      data: result.rows,
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

    const result = await fabricService.submitTransaction(
      req.user.id,
      process.env.CHAINCODE_NAME || 'ecta',
      'CreateExportRequest',
      JSON.stringify(exportData)
    );

    res.json({
      success: true,
      exportId: exportData.exportId,
      result: JSON.parse(result)
    });
  } catch (error) {
    console.error('Export creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get export details
 */
router.get('/:exportId', authenticateToken, async (req, res) => {
  try {
    const result = await fabricService.evaluateTransaction(
      req.user.id,
      process.env.CHAINCODE_NAME || 'ecta',
      'GetExportRequest',
      req.params.exportId
    );

    res.json(JSON.parse(result));
  } catch (error) {
    console.error('Export fetch error:', error);
    res.status(500).json({ error: error.message });
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

    const result = await fabricService.submitTransaction(
      req.user.id,
      process.env.CHAINCODE_NAME || 'ecta',
      'UpdateExportContract',
      req.params.exportId,
      JSON.stringify(updates)
    );

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
