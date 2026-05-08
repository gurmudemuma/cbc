const express = require('express');
const router = express.Router();
const path = require('path');
const fabricService = require('../services');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { generateInvoicePDF } = require('../utils/invoice-pdf');
const { validateCurrency, validateMultipleCurrencies } = require('../middleware/currency-validator');

// ==================== Shipment CRUD Endpoints ====================

/**
 * Create new shipment (exporter only)
 * POST /api/shipment/create
 */
router.post('/create', authenticateToken, requireRole('exporter'), validateCurrency('currency'), async (req, res) => {
  try {
    const exporterId = req.user.id;
    
    // Flatten nested structure for chaincode
    // Support both flat and nested input formats
    const flatData = {
      shipmentId: req.body.shipmentId,
      exporterId,
      exporterName: req.user.companyName,
      
      // Sales contract fields (flatten if nested)
      buyerCompanyName: req.body.buyerCompanyName || req.body.salesContract?.buyerCompanyName,
      buyerCountry: req.body.buyerCountry || req.body.salesContract?.buyerCountry,
      buyerContact: req.body.buyerContact || req.body.salesContract?.buyerContact,
      contractDate: req.body.contractDate || req.body.salesContract?.contractDate,
      deliveryTerms: req.body.deliveryTerms || req.body.salesContract?.deliveryTerms,
      paymentTerms: req.body.paymentTerms || req.body.salesContract?.paymentTerms,
      ecxAuctionReference: req.body.ecxAuctionReference || req.body.salesContract?.ecxAuctionReference,
      
      // Coffee details (flatten if nested)
      coffeeType: req.body.coffeeType || req.body.coffeeDetails?.type,
      grade: req.body.grade || req.body.coffeeDetails?.grade,
      quantity: req.body.quantity || req.body.coffeeDetails?.quantity,
      geographicalDesignation: req.body.geographicalDesignation || req.body.coffeeDetails?.geographicalDesignation,
      processingMethod: req.body.processingMethod || req.body.coffeeDetails?.processingMethod,
      
      // Pricing (flatten if nested)
      unitPrice: req.body.unitPrice || req.body.pricing?.unitPrice,
      currency: req.body.currency || req.body.pricing?.currency,
      
      // Optional fields
      contractNumber: req.body.contractNumber,
      bagMarks: req.body.bagMarks,
      
      createdAt: new Date().toISOString()
    };

    // Validate required fields
    if (!flatData.shipmentId) {
      return res.status(400).json({ error: 'shipmentId is required' });
    }

    const result = await fabricService.createShipment(flatData);
    
    res.json({
      success: true,
      message: 'Shipment created successfully',
      shipmentId: flatData.shipmentId,
      result
    });
  } catch (error) {
    console.error('Shipment creation error:', error);
    
    // Handle duplicate shipment ID
    if (error.message.includes('already exists')) {
      return res.status(409).json({ error: 'Shipment ID already exists' });
    }
    
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get shipment details (exporter, ecta, bank)
 * GET /api/shipment/:shipmentId
 */
router.get('/:shipmentId', authenticateToken, requireRole('exporter', 'ecta', 'bank', 'admin'), async (req, res) => {
  try {
    const { shipmentId } = req.params;
    const shipment = await fabricService.getShipment(shipmentId);
    
    // Authorization check: exporters can only view their own shipments
    if (req.user.role === 'exporter' && shipment.exporterId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied to this shipment' });
    }
    
    res.json(shipment);
  } catch (error) {
    console.error('Shipment retrieval error:', error);
    
    if (error.message.includes('does not exist')) {
      return res.status(404).json({ error: 'Shipment not found' });
    }
    
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get exporter's shipments (exporter own, ecta, admin)
 * GET /api/shipment/exporter/:exporterId
 */
router.get('/exporter/:exporterId', authenticateToken, requireRole('exporter', 'ecta', 'admin'), async (req, res) => {
  try {
    const { exporterId } = req.params;
    
    // Authorization check: exporters can only view their own shipments
    if (req.user.role === 'exporter' && exporterId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied to this exporter\'s shipments' });
    }
    
    const shipments = await fabricService.getShipmentsByExporter(exporterId);
    
    res.json({
      exporterId,
      shipments
    });
  } catch (error) {
    console.error('Exporter shipments retrieval error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

// ==================== Contract Workflow Endpoints ====================

/**
 * Register sales contract with ECTA (exporter only)
 * POST /api/shipment/:shipmentId/register-contract
 */
router.post('/:shipmentId/register-contract', authenticateToken, requireRole('exporter'), async (req, res) => {
  try {
    const { shipmentId } = req.params;
    
    // Get shipment to verify ownership
    const shipment = await fabricService.getShipment(shipmentId);
    
    if (shipment.exporterId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied to this shipment' });
    }
    
    const result = await fabricService.registerSalesContract(shipmentId);
    
    res.json({
      success: true,
      message: 'Sales contract registered with ECTA',
      shipmentId,
      result
    });
  } catch (error) {
    console.error('Contract registration error:', error);
    
    if (error.message.includes('does not exist')) {
      return res.status(404).json({ error: 'Shipment not found' });
    }
    
    res.status(500).json({ error: error.message });
  }
});

/**
 * Validate minimum price (ECTA only)
 * POST /api/shipment/:shipmentId/validate-price
 */
router.post('/:shipmentId/validate-price', authenticateToken, requireRole('ecta', 'admin'), async (req, res) => {
  try {
    const { shipmentId } = req.params;
    const { minimumPrice, validatedBy } = req.body;
    
    // Validate required fields
    if (minimumPrice === undefined) {
      return res.status(400).json({ error: 'minimumPrice is required' });
    }
    
    const minimumPriceData = {
      minimumPrice,
      validatedBy: validatedBy || req.user.id,
      validationDate: new Date().toISOString()
    };
    
    const result = await fabricService.validateMinimumPrice(shipmentId, minimumPriceData);
    
    res.json({
      success: true,
      message: 'Price validation completed',
      shipmentId,
      result
    });
  } catch (error) {
    console.error('Price validation error:', error);
    
    if (error.message.includes('does not exist')) {
      return res.status(404).json({ error: 'Shipment not found' });
    }
    
    if (error.message.includes('below minimum')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

/**
 * Approve sales contract (ECTA only)
 * POST /api/shipment/:shipmentId/approve-contract
 */
router.post('/:shipmentId/approve-contract', authenticateToken, requireRole('ecta', 'admin'), async (req, res) => {
  try {
    const { shipmentId } = req.params;
    const { comments } = req.body;
    
    const approvalData = {
      approvedBy: req.user.id,
      approvalDate: new Date().toISOString(),
      comments: comments || ''
    };
    
    const result = await fabricService.approveSalesContract(shipmentId, approvalData);
    
    res.json({
      success: true,
      message: 'Sales contract approved',
      shipmentId,
      result
    });
  } catch (error) {
    console.error('Contract approval error:', error);
    
    if (error.message.includes('does not exist')) {
      return res.status(404).json({ error: 'Shipment not found' });
    }
    
    if (error.message.includes('not validated') || error.message.includes('price validation')) {
      return res.status(400).json({ error: 'Price must be validated before contract approval' });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// ==================== Invoice Endpoints ====================

/**
 * Generate commercial invoice (exporter, ecta)
 * POST /api/shipment/:shipmentId/generate-invoice
 */
router.post('/:shipmentId/generate-invoice', authenticateToken, requireRole('exporter', 'ecta', 'admin'), async (req, res) => {
  try {
    const { shipmentId } = req.params;
    
    // Get shipment to verify ownership (if exporter)
    const shipment = await fabricService.getShipment(shipmentId);
    
    if (req.user.role === 'exporter' && shipment.exporterId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied to this shipment' });
    }
    
    // Generate invoice in chaincode
    const result = await fabricService.generateCommercialInvoice(shipmentId);
    
    // Get updated shipment with invoice details
    const updatedShipment = await fabricService.getShipment(shipmentId);
    
    // Generate PDF
    const invoiceNumber = updatedShipment.commercialInvoice.invoiceNumber;
    const pdfFileName = `${invoiceNumber}.pdf`;
    const pdfPath = path.join(__dirname, '../../invoices', pdfFileName);
    
    try {
      await generateInvoicePDF(updatedShipment, pdfPath);
      
      // Update shipment with PDF URL
      const pdfUrl = `/invoices/${pdfFileName}`;
      // Note: In a real implementation, you'd update the chaincode with the PDF URL
      // For now, we'll return it in the response
      
      res.json({
        success: true,
        message: 'Commercial invoice and PDF generated',
        shipmentId,
        invoiceNumber,
        pdfUrl,
        result
      });
    } catch (pdfError) {
      console.error('PDF generation error:', pdfError);
      // Invoice was created in chaincode, but PDF failed
      res.json({
        success: true,
        message: 'Commercial invoice generated, but PDF generation failed',
        shipmentId,
        invoiceNumber,
        pdfError: pdfError.message,
        result
      });
    }
  } catch (error) {
    console.error('Invoice generation error:', error);
    
    if (error.message.includes('does not exist')) {
      return res.status(404).json({ error: 'Shipment not found' });
    }
    
    if (error.message.includes('not approved')) {
      return res.status(400).json({ error: 'Contract must be approved before generating invoice' });
    }
    
    res.status(500).json({ error: error.message });
  }
});

/**
 * Download invoice PDF (exporter, ecta, bank)
 * GET /api/shipment/:shipmentId/invoice/download
 */
router.get('/:shipmentId/invoice/download', authenticateToken, requireRole('exporter', 'ecta', 'bank', 'admin'), async (req, res) => {
  try {
    const { shipmentId } = req.params;
    
    // Get shipment to verify invoice exists
    const shipment = await fabricService.getShipment(shipmentId);
    
    // Authorization check for exporters
    if (req.user.role === 'exporter' && shipment.exporterId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied to this shipment' });
    }
    
    if (!shipment.commercialInvoice || !shipment.commercialInvoice.pdfUrl) {
      return res.status(404).json({ error: 'Invoice PDF not found. Generate invoice first.' });
    }
    
    // Return PDF URL (in production, this would serve the actual file)
    res.json({
      success: true,
      shipmentId,
      invoiceNumber: shipment.commercialInvoice.invoiceNumber,
      pdfUrl: shipment.commercialInvoice.pdfUrl,
      message: 'PDF URL retrieved successfully'
    });
  } catch (error) {
    console.error('Invoice download error:', error);
    
    if (error.message.includes('does not exist')) {
      return res.status(404).json({ error: 'Shipment not found' });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// ==================== Payment Endpoints ====================

/**
 * Update payment details (exporter only)
 * POST /api/shipment/:shipmentId/payment
 */
router.post('/:shipmentId/payment', authenticateToken, requireRole('exporter'), validateMultipleCurrencies(['lcCurrency', 'currency']), async (req, res) => {
  try {
    const { shipmentId } = req.params;
    
    // Get shipment to verify ownership
    const shipment = await fabricService.getShipment(shipmentId);
    
    if (shipment.exporterId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied to this shipment' });
    }
    
    const paymentData = {
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    // Validate payment method
    if (!paymentData.method || !['LC', 'CAD', 'TT'].includes(paymentData.method)) {
      return res.status(400).json({ error: 'Valid payment method (LC, CAD, TT) is required' });
    }
    
    const result = await fabricService.updatePaymentDetails(shipmentId, paymentData);
    
    res.json({
      success: true,
      message: 'Payment details updated',
      shipmentId,
      result
    });
  } catch (error) {
    console.error('Payment update error:', error);
    
    if (error.message.includes('does not exist')) {
      return res.status(404).json({ error: 'Shipment not found' });
    }
    
    res.status(500).json({ error: error.message });
  }
});

/**
 * Verify payment (bank only)
 * POST /api/shipment/:shipmentId/verify-payment
 */
router.post('/:shipmentId/verify-payment', authenticateToken, requireRole('bank', 'admin'), async (req, res) => {
  try {
    const { shipmentId } = req.params;
    const { status, comments } = req.body;
    
    // Validate status
    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Valid status (approved, rejected) is required' });
    }
    
    const verificationData = {
      status,
      verifiedBy: req.user.id,
      verificationDate: new Date().toISOString(),
      comments: comments || ''
    };
    
    const result = await fabricService.verifyPayment(shipmentId, verificationData);
    
    res.json({
      success: true,
      message: `Payment ${status}`,
      shipmentId,
      result
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    
    if (error.message.includes('does not exist')) {
      return res.status(404).json({ error: 'Shipment not found' });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// ==================== Packing List and Query Endpoints ====================

/**
 * Update packing list (exporter only)
 * POST /api/shipment/:shipmentId/packing-list
 */
router.post('/:shipmentId/packing-list', authenticateToken, requireRole('exporter'), async (req, res) => {
  try {
    const { shipmentId } = req.params;
    
    // Get shipment to verify ownership
    const shipment = await fabricService.getShipment(shipmentId);
    
    if (shipment.exporterId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied to this shipment' });
    }
    
    const packingData = {
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    const result = await fabricService.updatePackingList(shipmentId, packingData);
    
    res.json({
      success: true,
      message: 'Packing list updated',
      shipmentId,
      result
    });
  } catch (error) {
    console.error('Packing list update error:', error);
    
    if (error.message.includes('does not exist')) {
      return res.status(404).json({ error: 'Shipment not found' });
    }
    
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get pending contract approvals (ECTA only)
 * GET /api/shipment/pending/contracts
 */
router.get('/pending/contracts', authenticateToken, requireRole('ecta', 'admin'), async (req, res) => {
  try {
    const pendingContracts = await fabricService.getPendingContractApprovals();
    
    res.json({
      success: true,
      count: pendingContracts.length,
      contracts: pendingContracts
    });
  } catch (error) {
    console.error('Pending contracts query error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get pending payment verifications (bank only)
 * GET /api/shipment/pending/payments
 */
router.get('/pending/payments', authenticateToken, requireRole('bank', 'admin'), async (req, res) => {
  try {
    const pendingPayments = await fabricService.getPendingPaymentVerifications();
    
    res.json({
      success: true,
      count: pendingPayments.length,
      payments: pendingPayments
    });
  } catch (error) {
    console.error('Pending payments query error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== Minimum Price Management Endpoints ====================

/**
 * Set minimum export price (ECTA only)
 * POST /api/shipment/minimum-price
 */
router.post('/minimum-price', authenticateToken, requireRole('ecta', 'admin'), validateCurrency('currency'), async (req, res) => {
  try {
    const { grade, coffeeType, minimumPrice, currency, effectiveDate } = req.body;
    
    // Validate required fields
    if (!grade || !coffeeType || minimumPrice === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: grade, coffeeType, minimumPrice' 
      });
    }
    
    const priceData = {
      grade,
      coffeeType,
      minimumPrice: parseFloat(minimumPrice),
      currency: currency || 'USD',
      effectiveDate: effectiveDate || new Date().toISOString(),
      setBy: req.user.id
    };
    
    const result = await fabricService.setMinimumPrice(priceData);
    
    res.json({
      success: true,
      message: 'Minimum price set successfully',
      result
    });
  } catch (error) {
    console.error('Set minimum price error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get current minimum price for a grade and type
 * GET /api/shipment/minimum-price/:grade/:type
 */
router.get('/minimum-price/:grade/:type', authenticateToken, async (req, res) => {
  try {
    const { grade, type } = req.params;
    
    const minimumPrice = await fabricService.getMinimumPrice(grade, type);
    
    res.json({
      success: true,
      minimumPrice
    });
  } catch (error) {
    console.error('Get minimum price error:', error);
    
    if (error.message.includes('No minimum price found')) {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get price history for a grade and type
 * GET /api/shipment/minimum-price/:grade/:type/history
 */
router.get('/minimum-price/:grade/:type/history', authenticateToken, async (req, res) => {
  try {
    const { grade, type } = req.params;
    
    const priceHistory = await fabricService.getPriceHistory(grade, type);
    
    res.json({
      success: true,
      count: priceHistory.length,
      priceHistory
    });
  } catch (error) {
    console.error('Get price history error:', error);
    res.status(500).json({ error: error.message });
  }
});
