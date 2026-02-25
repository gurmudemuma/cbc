const express = require('express');
const router = express.Router();
const fabricService = require('../services/fabric-chaincode');
const { authenticateToken, requireRole } = require('../middleware/auth');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/statutory-documents');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|jpg|jpeg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, JPG, JPEG, and PNG files are allowed'));
    }
  }
});

/**
 * Upload statutory document (Exporter only)
 * POST /api/statutory/documents/upload
 */
router.post('/documents/upload', authenticateToken, upload.single('document'), async (req, res) => {
  try {
    const exporterId = req.user.id;
    const { documentType, number, issueDate, expiryDate, vatNumber, registrationNumber, capitalETB, capitalType } = req.body;
    
    if (!documentType) {
      return res.status(400).json({ error: 'Document type is required' });
    }

    // Validate document type
    const validTypes = ['tradeLicense', 'tinCertificate', 'vatCertificate', 'investmentRegistration'];
    if (!validTypes.includes(documentType)) {
      return res.status(400).json({ error: 'Invalid document type' });
    }

    // Calculate document hash if file uploaded
    let documentHash = null;
    if (req.file) {
      const fileBuffer = await fs.readFile(req.file.path);
      documentHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    }

    // Prepare document data based on type
    const documentData = {
      documentHash,
      filePath: req.file ? req.file.path : null,
      fileName: req.file ? req.file.originalname : null
    };

    switch (documentType) {
      case 'tradeLicense':
        if (!number || !issueDate || !expiryDate) {
          return res.status(400).json({ error: 'Trade license requires number, issueDate, and expiryDate' });
        }
        documentData.number = number;
        documentData.issueDate = issueDate;
        documentData.expiryDate = expiryDate;
        break;
      
      case 'tinCertificate':
        if (!issueDate) {
          return res.status(400).json({ error: 'TIN certificate requires issueDate' });
        }
        documentData.issueDate = issueDate;
        break;
      
      case 'vatCertificate':
        if (!vatNumber || !issueDate) {
          return res.status(400).json({ error: 'VAT certificate requires vatNumber and issueDate' });
        }
        documentData.vatNumber = vatNumber;
        documentData.issueDate = issueDate;
        break;
      
      case 'investmentRegistration':
        if (!registrationNumber || !capitalETB || !capitalType) {
          return res.status(400).json({ error: 'Investment registration requires registrationNumber, capitalETB, and capitalType' });
        }
        documentData.registrationNumber = registrationNumber;
        documentData.capitalETB = parseFloat(capitalETB);
        documentData.capitalType = capitalType;
        break;
    }

    // Upload to blockchain
    const result = await fabricService.uploadStatutoryDocument(exporterId, documentType, documentData);
    
    res.json({
      success: true,
      message: 'Document uploaded successfully',
      documentType,
      documentHash,
      result
    });
  } catch (error) {
    console.error('Upload statutory document error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get exporter's statutory documents
 * GET /api/statutory/documents
 */
router.get('/documents', authenticateToken, async (req, res) => {
  try {
    const exporterId = req.user.id;
    
    // Get exporter profile which includes statutory documents
    const result = await fabricService.queryChaincode('GetExporterProfile', [exporterId]);
    const exporter = JSON.parse(result);
    
    res.json({
      exporterId,
      companyName: exporter.companyName,
      statutoryDocuments: exporter.statutoryDocuments || {},
      capitalETB: exporter.capitalETB
    });
  } catch (error) {
    console.error('Get statutory documents error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get pending document verifications (ECTA only)
 * GET /api/statutory/documents/pending
 */
router.get('/documents/pending', authenticateToken, requireRole('ecta', 'admin'), async (req, res) => {
  try {
    const pending = await fabricService.getPendingDocumentVerifications();
    res.json(pending);
  } catch (error) {
    console.error('Get pending verifications error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Verify statutory document (ECTA only)
 * POST /api/statutory/documents/:exporterId/:documentType/verify
 */
router.post('/documents/:exporterId/:documentType/verify', authenticateToken, requireRole('ecta', 'admin'), async (req, res) => {
  try {
    const { exporterId, documentType } = req.params;
    const { approved, notes, reason } = req.body;
    
    if (approved === undefined) {
      return res.status(400).json({ error: 'Approval status is required' });
    }

    const verificationData = {
      approved,
      verifiedBy: req.user.id,
      notes: notes || '',
      reason: reason || ''
    };

    const result = await fabricService.verifyStatutoryDocument(exporterId, documentType, verificationData);
    
    res.json({
      success: true,
      message: approved ? 'Document verified successfully' : 'Document rejected',
      exporterId,
      documentType,
      result
    });
  } catch (error) {
    console.error('Verify document error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update NBE delinquent status (NBE or ECTA only)
 * POST /api/statutory/nbe-status/:exporterId
 */
router.post('/nbe-status/:exporterId', authenticateToken, requireRole('nbe', 'ecta', 'admin'), async (req, res) => {
  try {
    const { exporterId } = req.params;
    const { delinquentStatus, outstandingFX, clearanceDate, clearanceCertificate } = req.body;
    
    if (!delinquentStatus) {
      return res.status(400).json({ error: 'Delinquent status is required' });
    }

    if (!['clear', 'delinquent'].includes(delinquentStatus)) {
      return res.status(400).json({ error: 'Invalid delinquent status. Must be "clear" or "delinquent"' });
    }

    const nbeStatus = {
      delinquentStatus,
      outstandingFX: outstandingFX || 0,
      clearanceDate: clearanceDate || null,
      clearanceCertificate: clearanceCertificate || null,
      checkedBy: req.user.id
    };

    const result = await fabricService.updateNBEStatus(exporterId, nbeStatus);
    
    res.json({
      success: true,
      message: 'NBE status updated successfully',
      exporterId,
      delinquentStatus,
      result
    });
  } catch (error) {
    console.error('Update NBE status error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Check statutory compliance
 * GET /api/statutory/compliance/:exporterId
 */
router.get('/compliance/:exporterId', authenticateToken, async (req, res) => {
  try {
    const { exporterId } = req.params;
    
    // Only allow exporters to check their own compliance, or ECTA/admin to check any
    if (req.user.role === 'exporter' && req.user.id !== exporterId) {
      return res.status(403).json({ error: 'You can only check your own compliance' });
    }

    const compliance = await fabricService.checkStatutoryCompliance(exporterId);
    res.json(compliance);
  } catch (error) {
    console.error('Check compliance error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Download statutory document
 * GET /api/statutory/documents/:exporterId/:documentType/download
 */
router.get('/documents/:exporterId/:documentType/download', authenticateToken, async (req, res) => {
  try {
    const { exporterId, documentType } = req.params;
    
    // Only allow exporters to download their own documents, or ECTA/admin to download any
    if (req.user.role === 'exporter' && req.user.id !== exporterId) {
      return res.status(403).json({ error: 'You can only download your own documents' });
    }

    // Get exporter profile
    const result = await fabricService.queryChaincode('GetExporterProfile', [exporterId]);
    const exporter = JSON.parse(result);
    
    if (!exporter.statutoryDocuments || !exporter.statutoryDocuments[documentType]) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const document = exporter.statutoryDocuments[documentType];
    
    // In a real implementation, you would retrieve the file from storage
    // For now, return document metadata
    res.json({
      exporterId,
      documentType,
      document,
      message: 'Document metadata retrieved. File download not yet implemented.'
    });
  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
