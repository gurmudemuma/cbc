const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { Pool } = require('pg');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const blockchainDocumentService = require('../services/blockchain-document.service');
const { generateDocumentPDF } = require('../utils/document-pdf-generator');

const pool = new Pool({
  host: process.env.POSTGRES_HOST || process.env.DB_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'coffee_export_db',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
});

// Document storage directory
const DOCUMENT_STORAGE_PATH = process.env.DOCUMENT_STORAGE_PATH || '/app/storage/documents';

// Network member role mapping
const NETWORK_MEMBER_MAP = {
  'ecta': 'ECTA',
  'moh': 'MOH',
  'moa': 'MOA',
  'bank': 'BANK',
  'shipping': 'SHIPPING',
  'erca': 'ERCA',
  'customs': 'CUSTOMS',
  'nbe': 'NBE',
  'ecx': 'ECX'
};

/**
 * Generate SHA-256 hash of document content
 */
function generateDocumentHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Generate digital signature for document
 */
function generateDigitalSignature(documentHash, issuerCode) {
  const signatureData = `${documentHash}:${issuerCode}:${Date.now()}`;
  return crypto.createHash('sha256').update(signatureData).digest('hex');
}

/**
 * GET /api/network-member/document-requests/pending
 * Get pending document requests for the network member
 */
router.get('/document-requests/pending', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.id || req.user.username;
    const userRole = req.user.role;

    const networkMemberCode = NETWORK_MEMBER_MAP[userRole?.toLowerCase()];

    if (!networkMemberCode) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: Only network members can access this endpoint'
      });
    }

    // Get pending requests for this network member
    const query = `
      SELECT 
        dr.*,
        ep.business_name,
        ep.status as profile_status,
        EXISTS(SELECT 1 FROM coffee_laboratories cl WHERE cl.exporter_id = ep.exporter_id AND cl.status = 'ACTIVE') as has_active_laboratory,
        EXISTS(SELECT 1 FROM coffee_tasters ct WHERE ct.exporter_id = ep.exporter_id AND ct.status = 'ACTIVE') as has_active_taster,
        EXISTS(SELECT 1 FROM competence_certificates cc WHERE cc.exporter_id = ep.exporter_id AND cc.status = 'ACTIVE') as has_active_competence,
        EXISTS(SELECT 1 FROM export_licenses el WHERE el.exporter_id = ep.exporter_id AND el.status = 'ACTIVE') as has_active_license
      FROM document_requests dr
      JOIN exporter_profiles ep ON dr.exporter_id = ep.exporter_id
      WHERE dr.network_member_code = $1 
        AND dr.request_status IN ('PENDING', 'UNDER_REVIEW')
      ORDER BY dr.requested_at ASC
    `;

    const result = await client.query(query, [networkMemberCode]);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        requestId: row.request_id,
        exporterId: row.exporter_id,
        exporterName: row.business_name,
        documentType: row.document_type,
        requestNotes: row.request_notes,
        requestedAt: row.requested_at,
        requestStatus: row.request_status,
        exporterQualification: {
          profileStatus: row.profile_status,
          licenseStatus: row.has_active_license ? 'ACTIVE' : 'MISSING',
          competenceStatus: row.has_active_competence ? 'ACTIVE' : 'MISSING',
          laboratoryStatus: row.has_active_laboratory ? 'ACTIVE' : 'MISSING',
          tasterStatus: row.has_active_taster ? 'ACTIVE' : 'MISSING'
        }
      }))
    });
  } catch (error) {
    console.error('[Document Issuance] Error fetching pending requests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending document requests',
      details: error.message
    });
  } finally {
    client.release();
  }
});

/**
 * POST /api/network-member/documents/issue
 * Issue a document to an exporter
 */
router.post('/documents/issue', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.id || req.user.username;
    const userRole = req.user.role;
    const {
      requestId,
      exporterId,
      documentType,
      documentNumber,
      documentMetadata,
      expiryDate,
      documentFile // base64 encoded PDF
    } = req.body;

    // Validate required fields
    if (!requestId || !exporterId || !documentType || !documentNumber || !documentFile) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: requestId, exporterId, documentType, documentNumber, and documentFile are required'
      });
    }

    let issuerMemberCode = NETWORK_MEMBER_MAP[userRole?.toLowerCase()];

    // Allow admin to issue documents for any network member
    // Get the member code from the request itself
    if (!issuerMemberCode && userRole?.toLowerCase() === 'admin') {
      // Get member code from the request in database
      const requestCheckQuery = `
        SELECT network_member_code FROM document_requests 
        WHERE request_id = $1 AND exporter_id = $2
      `;
      const requestCheckResult = await client.query(requestCheckQuery, [requestId, exporterId]);
      
      if (requestCheckResult.rows.length > 0) {
        issuerMemberCode = requestCheckResult.rows[0].network_member_code;
        console.log(`[Admin Override] Admin issuing document for ${issuerMemberCode}`);
      }
    }

    if (!issuerMemberCode) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: Only network members can issue documents'
      });
    }

    await client.query('BEGIN');

    try {
      // Verify request exists and belongs to this network member
      const requestQuery = `
        SELECT * FROM document_requests 
        WHERE request_id = $1 
          AND network_member_code = $2 
          AND exporter_id = $3
          AND request_status IN ('PENDING', 'UNDER_REVIEW')
      `;
      const requestResult = await client.query(requestQuery, [requestId, issuerMemberCode, exporterId]);

      if (requestResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          error: 'Document request not found or already processed'
        });
      }

      // Decode base64 document file
      const documentBuffer = Buffer.from(documentFile, 'base64');
      
      // Generate document hash
      const documentHash = generateDocumentHash(documentBuffer);
      
      // Generate digital signature
      const issuerSignature = generateDigitalSignature(documentHash, issuerMemberCode);

      // Ensure storage directory exists
      await fs.mkdir(DOCUMENT_STORAGE_PATH, { recursive: true });

      // Save document to storage
      const fileName = `${documentNumber.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;
      const filePath = path.join(DOCUMENT_STORAGE_PATH, fileName);
      await fs.writeFile(filePath, documentBuffer);

      const documentUrl = `/storage/documents/${fileName}`;

      // Insert issued document
      const insertDocQuery = `
        INSERT INTO issued_documents (
          request_id,
          exporter_id,
          issuer_member_code,
          document_type,
          document_number,
          document_hash,
          issuer_signature,
          document_url,
          document_metadata,
          expiry_date,
          issued_by,
          status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'ACTIVE')
        RETURNING *
      `;

      const docResult = await client.query(insertDocQuery, [
        requestId,
        exporterId,
        issuerMemberCode,
        documentType,
        documentNumber,
        documentHash,
        issuerSignature,
        documentUrl,
        JSON.stringify(documentMetadata || {}),
        expiryDate || null,
        userId
      ]);

      // Update request status to ISSUED
      await client.query(
        'UPDATE document_requests SET request_status = $1, reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $2 WHERE request_id = $3',
        ['ISSUED', userId, requestId]
      );

      await client.query('COMMIT');

      console.log(`[Document Issuance] Issued document ${documentNumber} to exporter ${exporterId}`);

      // Record on blockchain asynchronously (don't block response)
      setImmediate(async () => {
        try {
          const blockchainResult = await blockchainDocumentService.recordDocumentIssuance({
            documentId: docResult.rows[0].document_id,
            exporterId,
            issuerMemberCode,
            documentType,
            documentNumber,
            documentHash,
            issuerSignature,
            issuedAt: docResult.rows[0].issued_at,
            expiryDate: expiryDate || null
          });

          if (blockchainResult.success) {
            // Update blockchain transaction ID
            await pool.query(
              'UPDATE issued_documents SET blockchain_tx_id = $1 WHERE document_id = $2',
              [blockchainResult.transactionId, docResult.rows[0].document_id]
            );
            console.log(`[Document Issuance] Blockchain recorded: ${blockchainResult.transactionId}`);
          } else {
            console.error(`[Document Issuance] Blockchain recording failed: ${blockchainResult.error}`);
          }
        } catch (blockchainError) {
          console.error('[Document Issuance] Blockchain error:', blockchainError);
        }
      });

      res.json({
        success: true,
        message: 'Document issued successfully',
        data: {
          documentId: docResult.rows[0].document_id,
          documentNumber: docResult.rows[0].document_number,
          documentHash: docResult.rows[0].document_hash,
          issuedAt: docResult.rows[0].issued_at,
          documentUrl: docResult.rows[0].document_url,
          blockchainTxId: null // Will be updated asynchronously
        }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('[Document Issuance] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to issue document',
      details: error.message
    });
  } finally {
    client.release();
  }
});

/**
 * POST /api/network-member/document-requests/:requestId/reject
 * Reject a document request
 */
router.post('/document-requests/:requestId/reject', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.id || req.user.username;
    const userRole = req.user.role;
    const { requestId } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        error: 'Rejection reason is required'
      });
    }

    const networkMemberCode = NETWORK_MEMBER_MAP[userRole?.toLowerCase()];

    if (!networkMemberCode) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: Only network members can reject requests'
      });
    }

    // Verify request exists and belongs to this network member
    const requestQuery = `
      SELECT * FROM document_requests 
      WHERE request_id = $1 
        AND network_member_code = $2 
        AND request_status IN ('PENDING', 'UNDER_REVIEW')
    `;
    const requestResult = await client.query(requestQuery, [requestId, networkMemberCode]);

    if (requestResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Document request not found or already processed'
      });
    }

    // Update request status to REJECTED
    await client.query(
      `UPDATE document_requests 
       SET request_status = 'REJECTED', 
           rejection_reason = $1, 
           reviewed_at = CURRENT_TIMESTAMP, 
           reviewed_by = $2 
       WHERE request_id = $3`,
      [rejectionReason, userId, requestId]
    );

    console.log(`[Document Issuance] Rejected request ${requestId}`);

    res.json({
      success: true,
      message: 'Document request rejected successfully'
    });
  } catch (error) {
    console.error('[Document Issuance] Error rejecting request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject document request',
      details: error.message
    });
  } finally {
    client.release();
  }
});

/**
 * POST /api/network-member/documents/:documentId/revoke
 * Revoke an issued document
 */
router.post('/documents/:documentId/revoke', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.id || req.user.username;
    const userRole = req.user.role;
    const { documentId } = req.params;
    const { revocationReason } = req.body;

    if (!revocationReason) {
      return res.status(400).json({
        success: false,
        error: 'Revocation reason is required'
      });
    }

    const networkMemberCode = NETWORK_MEMBER_MAP[userRole?.toLowerCase()];

    if (!networkMemberCode) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: Only network members can revoke documents'
      });
    }

    // Verify document exists and was issued by this network member
    const docQuery = `
      SELECT * FROM issued_documents 
      WHERE document_id = $1 
        AND issuer_member_code = $2 
        AND status = 'ACTIVE'
    `;
    const docResult = await client.query(docQuery, [documentId, networkMemberCode]);

    if (docResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Document not found or already revoked'
      });
    }

    // Update document status to REVOKED
    await client.query(
      `UPDATE issued_documents 
       SET status = 'REVOKED', 
           updated_at = CURRENT_TIMESTAMP 
       WHERE document_id = $1`,
      [documentId]
    );

    console.log(`[Document Issuance] Revoked document ${documentId}`);

    // Record revocation on blockchain asynchronously
    setImmediate(async () => {
      try {
        await blockchainDocumentService.recordDocumentRevocation(
          documentId,
          revocationReason,
          userId
        );
      } catch (blockchainError) {
        console.error('[Document Issuance] Blockchain revocation error:', blockchainError);
      }
    });

    res.json({
      success: true,
      message: 'Document revoked successfully'
    });
  } catch (error) {
    console.error('[Document Issuance] Error revoking document:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to revoke document',
      details: error.message
    });
  } finally {
    client.release();
  }
});

module.exports = router;


/**
 * GET /api/exporter/documents/:documentId/download
 * Download a signed document PDF
 */
router.get('/documents/:documentId/download', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { documentId } = req.params;
    const userId = req.user.id || req.user.username;
    
    // Get document details
    const docQuery = `
      SELECT 
        id.*,
        ep.business_name,
        ep.tin,
        ep.registration_number,
        ep.address,
        ep.contact_person,
        ep.phone,
        ep.email
      FROM issued_documents id
      JOIN exporter_profiles ep ON id.exporter_id = ep.exporter_id
      WHERE id.document_id = $1
    `;
    
    const docResult = await client.query(docQuery, [documentId]);
    
    if (docResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }
    
    const document = docResult.rows[0];
    
    // Check if user has access to this document
    // Exporters can only download their own documents
    // Network members can download documents they issued
    // Admins can download any document
    const userRole = req.user.role?.toLowerCase();
    const isExporter = document.exporter_id === req.user.exporterId || 
                       (await client.query('SELECT exporter_id FROM exporter_profiles WHERE user_id = $1', [userId])).rows.length > 0;
    const isIssuer = document.issuer_member_code === NETWORK_MEMBER_MAP[userRole];
    const isAdmin = userRole === 'admin';
    
    if (!isExporter && !isIssuer && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: You do not have permission to download this document'
      });
    }
    
    // Check if document is active
    if (document.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        error: `Document is ${document.status.toLowerCase()} and cannot be downloaded`
      });
    }
    
    console.log(`[Document Download] Generating PDF for document ${documentId}`);
    
    // Prepare document data for PDF generation
    const documentData = {
      documentNumber: document.document_number,
      document_type: document.document_type,
      exporterId: document.exporter_id,
      issuedAt: document.issued_at,
      expiryDate: document.expiry_date,
      issuedBy: document.issued_by,
      document_metadata: document.document_metadata || {}
    };
    
    const exporterData = {
      business_name: document.business_name,
      tin: document.tin,
      registration_number: document.registration_number,
      address: document.address,
      contact_person: document.contact_person,
      phone: document.phone,
      email: document.email
    };
    
    // Generate signed PDF
    const pdfBuffer = await generateDocumentPDF(documentData, exporterData);
    
    // Set response headers for PDF download
    const filename = `${document.document_type}_${document.document_number}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    // Send PDF
    res.send(pdfBuffer);
    
    console.log(`[Document Download] Successfully generated and sent ${filename}`);
    
  } catch (error) {
    console.error('[Document Download] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download document',
      details: error.message
    });
  } finally {
    client.release();
  }
});

/**
 * GET /api/exporter/documents
 * Get all documents for the logged-in exporter
 */
router.get('/documents', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.id || req.user.username;
    
    // Get exporter ID from user
    const exporterQuery = 'SELECT exporter_id FROM exporter_profiles WHERE user_id = $1';
    const exporterResult = await client.query(exporterQuery, [userId]);
    
    if (exporterResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Exporter profile not found'
      });
    }
    
    const exporterId = exporterResult.rows[0].exporter_id;
    
    // Get all documents for this exporter
    const docsQuery = `
      SELECT 
        document_id,
        issuer_member_code,
        document_type,
        document_number,
        issued_at,
        expiry_date,
        status,
        document_metadata
      FROM issued_documents
      WHERE exporter_id = $1
      ORDER BY issued_at DESC
    `;
    
    const docsResult = await client.query(docsQuery, [exporterId]);
    
    res.json({
      success: true,
      data: docsResult.rows.map(doc => ({
        documentId: doc.document_id,
        issuerMemberCode: doc.issuer_member_code,
        documentType: doc.document_type,
        documentNumber: doc.document_number,
        issuedAt: doc.issued_at,
        expiryDate: doc.expiry_date,
        status: doc.status,
        metadata: doc.document_metadata,
        downloadUrl: `/api/exporter/documents/${doc.document_id}/download`
      }))
    });
    
  } catch (error) {
    console.error('[Get Documents] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch documents',
      details: error.message
    });
  } finally {
    client.release();
  }
});

/**
 * GET /api/exporter/documents/by-submission/:submissionId
 * Get all documents for a specific network submission
 */
router.get('/documents/by-submission/:submissionId', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { submissionId } = req.params;
    const userId = req.user.id || req.user.username;
    
    // Get exporter ID from user
    const exporterQuery = 'SELECT exporter_id FROM exporter_profiles WHERE user_id = $1';
    const exporterResult = await client.query(exporterQuery, [userId]);
    
    if (exporterResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Exporter profile not found'
      });
    }
    
    const exporterId = exporterResult.rows[0].exporter_id;
    
    // Verify submission belongs to this exporter
    const submissionQuery = 'SELECT * FROM network_submissions WHERE submission_id = $1 AND exporter_id = $2';
    const submissionResult = await client.query(submissionQuery, [submissionId, exporterId]);
    
    if (submissionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found or access denied'
      });
    }
    
    // Get all documents linked to this submission
    const docsQuery = `
      SELECT 
        id.document_id,
        id.issuer_member_code,
        id.document_type,
        id.document_number,
        id.issued_at,
        id.expiry_date,
        id.status,
        id.document_metadata
      FROM issued_documents id
      JOIN submission_documents sd ON id.document_id = sd.document_id
      WHERE sd.submission_id = $1
      ORDER BY id.issued_at DESC
    `;
    
    const docsResult = await client.query(docsQuery, [submissionId]);
    
    res.json({
      success: true,
      data: docsResult.rows.map(doc => ({
        documentId: doc.document_id,
        issuerMemberCode: doc.issuer_member_code,
        documentType: doc.document_type,
        documentNumber: doc.document_number,
        issuedAt: doc.issued_at,
        expiryDate: doc.expiry_date,
        status: doc.status,
        metadata: doc.document_metadata,
        downloadUrl: `/api/exporter/documents/${doc.document_id}/download`
      }))
    });
    
  } catch (error) {
    console.error('[Get Submission Documents] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch submission documents',
      details: error.message
    });
  } finally {
    client.release();
  }
});

module.exports = router;
