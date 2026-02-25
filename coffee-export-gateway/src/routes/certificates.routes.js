const express = require('express');
const router = express.Router();
const fabricService = require('../services/fabric-chaincode');
const { authenticateToken } = require('../middleware/auth');
const { generateCertificatePDF, generateBundlePDF } = require('../utils/certificate-pdf');
const path = require('path');
const fs = require('fs');

// ==================== Certificate Request & Retrieval ====================

/**
 * Request a certificate for a shipment
 * POST /api/certificates/request
 */
router.post('/request', authenticateToken, async (req, res) => {
  try {
    const { shipmentId, certificateType, certificateData, comments } = req.body;

    if (!shipmentId || !certificateType) {
      return res.status(400).json({ error: 'Missing required fields: shipmentId, certificateType' });
    }

    const certificateRequest = {
      shipmentId,
      certificateType,
      exporterId: req.user.id,
      certificateData: certificateData || {},
      comments: comments || ''
    };

    const result = await fabricService.requestCertificate(certificateRequest);
    const response = JSON.parse(result);

    res.json({
      success: true,
      message: 'Certificate requested successfully',
      ...response
    });
  } catch (error) {
    console.error('Certificate request error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get certificate by ID
 * GET /api/certificates/:certificateId
 */
router.get('/:certificateId', authenticateToken, async (req, res) => {
  try {
    const certificate = await fabricService.getCertificate(req.params.certificateId);
    res.json(certificate);
  } catch (error) {
    console.error('Certificate fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all certificates for a shipment
 * GET /api/certificates/shipment/:shipmentId
 */
router.get('/shipment/:shipmentId', authenticateToken, async (req, res) => {
  try {
    const certificates = await fabricService.getCertificatesByShipment(req.params.shipmentId);
    res.json(certificates);
  } catch (error) {
    console.error('Certificate fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get pending certificates by type and agency
 * GET /api/certificates/pending/:certificateType?agency=AGENCY
 */
router.get('/pending/:certificateType', authenticateToken, async (req, res) => {
  try {
    const { certificateType } = req.params;
    const { agency } = req.query;

    const certificates = await fabricService.getPendingCertificates(certificateType, agency);
    res.json(certificates);
  } catch (error) {
    console.error('Certificate fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== Certificate Issuance ====================

/**
 * Issue CQIC Export Authorization
 * POST /api/certificates/:certificateId/issue/cqic
 */
router.post('/:certificateId/issue/cqic', authenticateToken, async (req, res) => {
  try {
    const { certificateId } = req.params;
    const authorizationData = {
      ...req.body,
      issuedBy: req.user.id
    };

    const result = await fabricService.issueCQICAuthorization(certificateId, authorizationData);
    const response = JSON.parse(result);

    res.json({
      success: true,
      message: 'CQIC authorization issued successfully',
      ...response
    });
  } catch (error) {
    console.error('CQIC issuance error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Issue Phytosanitary Certificate
 * POST /api/certificates/:certificateId/issue/phyto
 */
router.post('/:certificateId/issue/phyto', authenticateToken, async (req, res) => {
  try {
    const { certificateId } = req.params;
    const inspectionData = {
      ...req.body,
      inspectorName: req.user.name || req.user.id
    };

    const result = await fabricService.issuePhytosanitaryCertificate(certificateId, inspectionData);
    const response = JSON.parse(result);

    res.json({
      success: true,
      message: 'Phytosanitary certificate issued successfully',
      ...response
    });
  } catch (error) {
    console.error('Phytosanitary issuance error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Issue Certificate of Origin
 * POST /api/certificates/:certificateId/issue/origin
 */
router.post('/:certificateId/issue/origin', authenticateToken, async (req, res) => {
  try {
    const { certificateId } = req.params;
    const originData = {
      ...req.body,
      issuedBy: req.user.id
    };

    const result = await fabricService.issueCertificateOfOrigin(certificateId, originData);
    const response = JSON.parse(result);

    res.json({
      success: true,
      message: 'Certificate of origin issued successfully',
      ...response
    });
  } catch (error) {
    console.error('Origin certificate issuance error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Issue EUDR Compliance Certificate
 * POST /api/certificates/:certificateId/issue/eudr
 */
router.post('/:certificateId/issue/eudr', authenticateToken, async (req, res) => {
  try {
    const { certificateId } = req.params;
    const eudrData = {
      ...req.body,
      issuedBy: req.user.id
    };

    const result = await fabricService.issueEUDRCompliance(certificateId, eudrData);
    const response = JSON.parse(result);

    res.json({
      success: true,
      message: 'EUDR compliance certificate issued successfully',
      ...response
    });
  } catch (error) {
    console.error('EUDR issuance error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Issue ICO Certificate
 * POST /api/certificates/:certificateId/issue/ico
 */
router.post('/:certificateId/issue/ico', authenticateToken, async (req, res) => {
  try {
    const { certificateId } = req.params;
    const icoData = {
      ...req.body,
      issuedBy: req.user.id
    };

    const result = await fabricService.issueICOCertificate(certificateId, icoData);
    const response = JSON.parse(result);

    res.json({
      success: true,
      message: 'ICO certificate issued successfully',
      ...response
    });
  } catch (error) {
    console.error('ICO issuance error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== Certificate Management ====================

/**
 * Revoke a certificate
 * POST /api/certificates/:certificateId/revoke
 */
router.post('/:certificateId/revoke', authenticateToken, async (req, res) => {
  try {
    const { certificateId } = req.params;
    const { reason } = req.body;

    const revocationData = {
      revokedBy: req.user.id,
      reason: reason || 'No reason provided'
    };

    const result = await fabricService.revokeCertificate(certificateId, revocationData);
    const response = JSON.parse(result);

    res.json({
      success: true,
      message: 'Certificate revoked successfully',
      ...response
    });
  } catch (error) {
    console.error('Certificate revocation error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Verify certificate by certificate number (public endpoint)
 * GET /api/certificates/verify/:certificateNumber
 */
router.get('/verify/:certificateNumber', async (req, res) => {
  try {
    const result = await fabricService.verifyCertificate(req.params.certificateNumber);
    res.json(result);
  } catch (error) {
    console.error('Certificate verification error:', error);
    res.status(404).json({ 
      valid: false,
      error: error.message 
    });
  }
});

// ==================== GPS Tracking ====================

/**
 * Record GPS plot data
 * POST /api/certificates/gps/plot
 */
router.post('/gps/plot', authenticateToken, async (req, res) => {
  try {
    const gpsPlotData = {
      ...req.body,
      exporterId: req.user.id
    };

    const result = await fabricService.recordGPSPlot(gpsPlotData);
    const response = JSON.parse(result);

    res.json({
      success: true,
      message: 'GPS plot recorded successfully',
      ...response
    });
  } catch (error) {
    console.error('GPS plot recording error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update deforestation check for a plot
 * POST /api/certificates/gps/plot/:plotId/deforestation
 */
router.post('/gps/plot/:plotId/deforestation', authenticateToken, async (req, res) => {
  try {
    const { plotId } = req.params;
    const checkData = req.body;

    const result = await fabricService.updateDeforestationCheck(plotId, checkData);
    const response = JSON.parse(result);

    res.json({
      success: true,
      message: 'Deforestation check updated successfully',
      ...response
    });
  } catch (error) {
    console.error('Deforestation check error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get GPS plots for a shipment
 * GET /api/certificates/gps/shipment/:shipmentId
 */
router.get('/gps/shipment/:shipmentId', authenticateToken, async (req, res) => {
  try {
    const plots = await fabricService.getGPSPlotsByShipment(req.params.shipmentId);
    res.json(plots);
  } catch (error) {
    console.error('GPS plots fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Verify GPS plot
 * POST /api/certificates/gps/plot/:plotId/verify
 */
router.post('/gps/plot/:plotId/verify', authenticateToken, async (req, res) => {
  try {
    const { plotId } = req.params;
    const verificationData = {
      ...req.body,
      verifiedBy: req.user.id
    };

    const result = await fabricService.verifyGPSPlot(plotId, verificationData);
    const response = JSON.parse(result);

    res.json({
      success: true,
      message: 'GPS plot verified successfully',
      ...response
    });
  } catch (error) {
    console.error('GPS plot verification error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== Certificate Bundles ====================

/**
 * Generate certificate bundle for a shipment
 * POST /api/certificates/bundle/generate/:shipmentId
 */
router.post('/bundle/generate/:shipmentId', authenticateToken, async (req, res) => {
  try {
    const result = await fabricService.generateCertificateBundle(req.params.shipmentId);
    const response = JSON.parse(result);

    res.json({
      success: true,
      message: 'Certificate bundle generated successfully',
      ...response
    });
  } catch (error) {
    console.error('Bundle generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get certificate bundle
 * GET /api/certificates/bundle/:bundleId
 */
router.get('/bundle/:bundleId', authenticateToken, async (req, res) => {
  try {
    const bundle = await fabricService.getCertificateBundle(req.params.bundleId);
    res.json(bundle);
  } catch (error) {
    console.error('Bundle fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Download certificate bundle PDF
 * GET /api/certificates/bundle/:bundleId/download
 */
router.get('/bundle/:bundleId/download', authenticateToken, async (req, res) => {
  try {
    const { bundleId } = req.params;
    
    // Get bundle details
    const bundle = await fabricService.getCertificateBundle(bundleId);
    
    // Get all certificates in the bundle
    const certificates = await fabricService.getCertificatesByShipment(bundle.shipmentId);
    
    // Get shipment details
    const shipment = await fabricService.getShipment(bundle.shipmentId);
    
    // Get GPS plots if any EUDR certificates
    let gpsPlots = [];
    const hasEUDR = certificates.some(cert => cert.certificateType === 'EUDR');
    if (hasEUDR) {
      gpsPlots = await fabricService.getGPSPlotsByShipment(bundle.shipmentId);
    }
    
    // Generate bundle PDF
    const { filepath, filename } = await generateBundlePDF(bundle, certificates, shipment, gpsPlots);
    
    // Send file
    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('Bundle PDF download error:', err);
        res.status(500).json({ error: 'Failed to download bundle PDF' });
      }
    });
    
  } catch (error) {
    console.error('Bundle PDF generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== PDF Download Endpoints ====================

/**
 * Download certificate PDF
 * GET /api/certificates/:certificateId/download
 */
router.get('/:certificateId/download', authenticateToken, async (req, res) => {
  try {
    const { certificateId } = req.params;
    
    // Get certificate details
    const certificate = await fabricService.getCertificate(certificateId);
    
    // Get shipment details
    const shipment = await fabricService.getShipment(certificate.shipmentId);
    
    // Get additional data if needed (GPS plots for EUDR)
    let additionalData = {};
    if (certificate.certificateType === 'EUDR') {
      const gpsPlots = await fabricService.getGPSPlotsByShipment(certificate.shipmentId);
      additionalData.gpsPlots = gpsPlots;
    }
    
    // Generate PDF
    const { filepath, filename } = await generateCertificatePDF(certificate, shipment, additionalData);
    
    // Send file
    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('PDF download error:', err);
        res.status(500).json({ error: 'Failed to download PDF' });
      }
      
      // Optionally delete file after download
      // fs.unlinkSync(filepath);
    });
    
  } catch (error) {
    console.error('Certificate PDF generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * View certificate PDF (inline)
 * GET /api/certificates/:certificateId/view
 */
router.get('/:certificateId/view', authenticateToken, async (req, res) => {
  try {
    const { certificateId } = req.params;
    
    // Get certificate details
    const certificate = await fabricService.getCertificate(certificateId);
    
    // Get shipment details
    const shipment = await fabricService.getShipment(certificate.shipmentId);
    
    // Get additional data if needed
    let additionalData = {};
    if (certificate.certificateType === 'EUDR') {
      const gpsPlots = await fabricService.getGPSPlotsByShipment(certificate.shipmentId);
      additionalData.gpsPlots = gpsPlots;
    }
    
    // Generate PDF
    const { filepath, filename } = await generateCertificatePDF(certificate, shipment, additionalData);
    
    // Send file for inline viewing
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    
    const fileStream = fs.createReadStream(filepath);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Certificate PDF view error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export router
module.exports = router;
