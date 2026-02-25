const express = require('express');
const router = express.Router();
const fabricService = require('../services');
const { authenticateToken } = require('../middleware/auth');

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

module.exports = router;
