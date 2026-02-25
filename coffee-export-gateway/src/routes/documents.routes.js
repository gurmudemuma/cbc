/**
 * Document Management Routes
 * Handles document upload, storage, and verification for exporter registration
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { authenticateToken, requireRole } = require('../middleware/auth');
const fabricService = require('../services');
const notificationService = require('../services/notification.service');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/documents');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${req.user.id}-${basename}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, JPG, PNG, DOC, DOCX allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

/**
 * Upload document (Exporter)
 * POST /api/documents/upload
 */
router.post('/upload', authenticateToken, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { documentType, description, relatedTo } = req.body;

    if (!documentType) {
      // Clean up uploaded file
      await fs.unlink(req.file.path);
      return res.status(400).json({ error: 'Document type is required' });
    }

    const documentData = {
      documentId: `DOC-${Date.now()}`,
      exporterId: req.user.id,
      documentType, // e.g., 'capital_proof', 'laboratory_certificate', 'taster_certificate'
      fileName: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      description: description || '',
      relatedTo: relatedTo || '', // e.g., 'laboratory_id', 'taster_id'
      status: 'pending_verification',
      uploadedAt: new Date().toISOString(),
      uploadedBy: req.user.id
    };

    // Store document metadata on blockchain
    await fabricService.submitTransaction(
      req.user.id,
      process.env.CHAINCODE_NAME || 'ecta',
      'UploadStatutoryDocument',
      req.user.id,
      documentType,
      JSON.stringify(documentData)
    );

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      document: {
        documentId: documentData.documentId,
        fileName: documentData.originalName,
        documentType: documentData.documentType,
        status: documentData.status,
        uploadedAt: documentData.uploadedAt
      }
    });
  } catch (error) {
    // Clean up file if upload failed
    if (req.file) {
      await fs.unlink(req.file.path).catch(err => console.error('Failed to delete file:', err));
    }
    console.error('Document upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get exporter's documents
 * GET /api/documents/my
 */
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const exporterId = req.user.id;

    // Get documents from blockchain
    const result = await fabricService.evaluateTransaction(
      exporterId,
      process.env.CHAINCODE_NAME || 'ecta',
      'GetExporterProfile',
      exporterId
    );

    const profile = JSON.parse(result);
    const documents = profile.documents || [];

    res.json(documents);
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Download document
 * GET /api/documents/:documentId/download
 */
router.get('/:documentId/download', authenticateToken, async (req, res) => {
  try {
    const { documentId } = req.params;
    const exporterId = req.user.id;

    // Get document metadata from blockchain
    const result = await fabricService.evaluateTransaction(
      exporterId,
      process.env.CHAINCODE_NAME || 'ecta',
      'GetExporterProfile',
      exporterId
    );

    const profile = JSON.parse(result);
    const documents = profile.documents || [];
    const document = documents.find(doc => doc.documentId === documentId);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check authorization
    if (document.exporterId !== exporterId && req.user.role !== 'ecta' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to download this document' });
    }

    // Send file
    res.download(document.filePath, document.originalName);
  } catch (error) {
    console.error('Document download error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get pending documents for verification (ECTA only)
 * GET /api/documents/pending
 */
router.get('/pending', authenticateToken, requireRole('ecta', 'admin'), async (req, res) => {
  try {
    // Get all pending document verifications
    const result = await fabricService.evaluateTransaction(
      req.user.id,
      process.env.CHAINCODE_NAME || 'ecta',
      'GetPendingDocumentVerifications'
    );

    const pendingDocs = JSON.parse(result);
    res.json(pendingDocs);
  } catch (error) {
    console.error('Get pending documents error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Verify document (ECTA only)
 * POST /api/documents/:documentId/verify
 */
router.post('/:documentId/verify', authenticateToken, requireRole('ecta', 'admin'), async (req, res) => {
  try {
    const { documentId } = req.params;
    const { status, comments, exporterId, documentType } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Valid status (approved/rejected) is required' });
    }

    if (!exporterId || !documentType) {
      return res.status(400).json({ error: 'Exporter ID and document type are required' });
    }

    const verificationData = {
      documentId,
      status,
      verifiedBy: req.user.id,
      verifiedAt: new Date().toISOString(),
      comments: comments || ''
    };

    // Update document status on blockchain
    await fabricService.submitTransaction(
      req.user.id,
      process.env.CHAINCODE_NAME || 'ecta',
      'VerifyStatutoryDocument',
      exporterId,
      documentType,
      JSON.stringify(verificationData)
    );

    // Send notification to exporter
    try {
      const user = await fabricService.getUser(exporterId);
      const statusText = status === 'approved' ? 'approved' : 'rejected';
      // You can create a specific notification method for document verification
      console.log(`Document ${documentId} ${statusText} for exporter ${exporterId}`);
    } catch (error) {
      console.log('Notification error:', error.message);
    }

    res.json({
      success: true,
      message: `Document ${status} successfully`,
      documentId,
      status,
      verifiedAt: verificationData.verifiedAt
    });
  } catch (error) {
    console.error('Document verification error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get document by ID (ECTA only)
 * GET /api/documents/:documentId
 */
router.get('/:documentId', authenticateToken, requireRole('ecta', 'admin'), async (req, res) => {
  try {
    const { documentId } = req.params;

    // Get all pending documents and find the specific one
    const result = await fabricService.evaluateTransaction(
      req.user.id,
      process.env.CHAINCODE_NAME || 'ecta',
      'GetPendingDocumentVerifications'
    );

    const pendingDocs = JSON.parse(result);
    const document = pendingDocs.find(doc => doc.documentId === documentId);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(document);
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Delete document (Exporter - only if not verified)
 * DELETE /api/documents/:documentId
 */
router.delete('/:documentId', authenticateToken, async (req, res) => {
  try {
    const { documentId } = req.params;
    const exporterId = req.user.id;

    // Get document metadata
    const result = await fabricService.evaluateTransaction(
      exporterId,
      process.env.CHAINCODE_NAME || 'ecta',
      'GetExporterProfile',
      exporterId
    );

    const profile = JSON.parse(result);
    const documents = profile.documents || [];
    const document = documents.find(doc => doc.documentId === documentId);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (document.exporterId !== exporterId) {
      return res.status(403).json({ error: 'Not authorized to delete this document' });
    }

    if (document.status === 'approved') {
      return res.status(403).json({ error: 'Cannot delete approved documents' });
    }

    // Delete file from filesystem
    try {
      await fs.unlink(document.filePath);
    } catch (error) {
      console.error('Failed to delete file:', error);
    }

    // Note: Blockchain doesn't support deletion, so we mark as deleted
    // In a real implementation, you'd update the document status to 'deleted'

    res.json({
      success: true,
      message: 'Document deleted successfully',
      documentId
    });
  } catch (error) {
    console.error('Document deletion error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
