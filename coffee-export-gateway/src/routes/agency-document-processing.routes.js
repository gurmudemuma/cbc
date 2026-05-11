const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.POSTGRES_HOST || process.env.DB_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'coffee_export_db',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
});

/**
 * GET /api/agency/document-requests/pending
 * Get pending document requests for the current agency
 */
router.get('/document-requests/pending', authenticateToken, async (req, res) => {
  try {
    const userRole = req.user.role?.toUpperCase();
    
    // Map user roles to agency codes
    const roleToAgency = {
      'ECTA': 'ECTA',
      'MOA': 'MOA',
      'MOH': 'MOH',
      'ECX': 'ECX',
      'BANK': 'BANK',
      'NBE': 'NBE',
      'CUSTOMS': 'CUSTOMS',
      'SHIPPING': 'SHIPPING'
    };

    const agencyCode = roleToAgency[userRole];
    
    if (!agencyCode) {
      return res.status(403).json({
        success: false,
        error: 'User role not authorized for document processing'
      });
    }

    const query = `
      SELECT 
        dr.*,
        drb.ecta_reference_number,
        ep.business_name as exporter_name,
        ep.tin as exporter_tin,
        ep.email as exporter_email,
        ep.contact_person as exporter_contact_person,
        ep.phone as exporter_phone,
        ep.status as profile_status,
        cl.status as laboratory_status,
        cl.inspected_by as laboratory_inspector,
        cl.last_inspection_date,
        cl.laboratory_name,
        ct.status as taster_status,
        ct.full_name as taster_name,
        ct.proficiency_certificate_number,
        ct.certificate_issue_date as taster_certificate_date,
        el.status as license_status,
        el.license_number,
        el.issued_date as license_issue_date,
        el.expiry_date as license_expiry_date,
        cc.status as competence_status,
        cc.certificate_number as competence_certificate_number,
        cc.issued_date as competence_issue_date,
        cc.expiry_date as competence_expiry_date
      FROM document_requests dr
      JOIN document_request_batches drb ON dr.batch_id = drb.batch_id
      JOIN exporter_profiles ep ON dr.exporter_id = ep.exporter_id
      LEFT JOIN coffee_laboratories cl ON ep.exporter_id = cl.exporter_id
      LEFT JOIN coffee_tasters ct ON ep.exporter_id = ct.exporter_id
      LEFT JOIN export_licenses el ON ep.exporter_id = el.exporter_id
      LEFT JOIN competence_certificates cc ON ep.exporter_id = cc.exporter_id
      WHERE dr.issuer_agency = $1
        AND dr.status IN ('PENDING', 'ACKNOWLEDGED', 'IN_PROGRESS')
      ORDER BY 
        CASE dr.priority
          WHEN 'URGENT' THEN 1
          WHEN 'HIGH' THEN 2
          WHEN 'MEDIUM' THEN 3
          WHEN 'LOW' THEN 4
        END,
        dr.requested_at ASC
    `;

    const result = await pool.query(query, [agencyCode]);

    // Enrich each request with exporterQualification object
    const enrichedRequests = result.rows.map(row => ({
      ...row,
      exporterQualification: {
        profileStatus: row.profile_status || 'UNKNOWN',
        licenseStatus: row.license_status || 'MISSING',
        competenceStatus: row.competence_status || 'MISSING',
        laboratoryStatus: row.laboratory_status || 'MISSING',
        tasterStatus: row.taster_status || 'MISSING'
      }
    }));

    res.json({
      success: true,
      agency: agencyCode,
      count: enrichedRequests.length,
      requests: enrichedRequests
    });

  } catch (error) {
    console.error('[Agency Document Requests] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/agency/document-requests/:requestId/acknowledge
 * Acknowledge receipt of a document request
 */
router.post('/document-requests/:requestId/acknowledge', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { requestId } = req.params;
    const { estimatedCompletionDays, notes } = req.body;
    const userId = req.user.id || req.user.username;
    const userRole = req.user.role?.toUpperCase();

    await client.query('BEGIN');

    // Update request status
    const updateQuery = `
      UPDATE document_requests
      SET 
        status = 'ACKNOWLEDGED',
        acknowledged_at = CURRENT_TIMESTAMP,
        acknowledged_by = $1,
        notes = $2
      WHERE request_id = $3 AND issuer_agency = $4 AND status = 'PENDING'
      RETURNING *
    `;

    const result = await client.query(updateQuery, [userId, notes, requestId, userRole]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Request not found or already processed'
      });
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Document request acknowledged',
      request: result.rows[0],
      estimatedCompletion: estimatedCompletionDays ? `${estimatedCompletionDays} days` : null
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Acknowledge Request] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    client.release();
  }
});

/**
 * POST /api/agency/document-requests/:requestId/issue
 * Issue/sign a document for a request
 * The system automatically signs with the network member's MSP certificate
 */
router.post('/document-requests/:requestId/issue', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { requestId } = req.params;
    const { documentNumber, expiryDate, metadata } = req.body;
    const userId = req.user.id || req.user.username;
    const userRole = req.user.role?.toUpperCase();

    await client.query('BEGIN');

    // Get request details with exporter qualification data
    const requestQuery = `
      SELECT 
        dr.*, 
        ep.exporter_id, 
        ep.business_name,
        ep.tin,
        ep.contact_person,
        cl.last_inspection_date,
        cl.inspected_by,
        ct.full_name as taster_name,
        el.expiry_date as license_expiry_date,
        cc.expiry_date as competence_expiry_date
      FROM document_requests dr
      JOIN exporter_profiles ep ON dr.exporter_id = ep.exporter_id
      LEFT JOIN coffee_laboratories cl ON ep.exporter_id = cl.exporter_id
      LEFT JOIN coffee_tasters ct ON ep.exporter_id = ct.exporter_id
      LEFT JOIN export_licenses el ON ep.exporter_id = el.exporter_id
      LEFT JOIN competence_certificates cc ON ep.exporter_id = cc.exporter_id
      WHERE dr.request_id = $1 AND dr.issuer_agency = $2
    `;
    
    const requestResult = await client.query(requestQuery, [requestId, userRole]);

    if (requestResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Request not found or not authorized'
      });
    }

    const request = requestResult.rows[0];

    // Generate document content for signing
    const documentContent = {
      documentNumber,
      documentType: request.document_type,
      exporterName: request.business_name,
      exporterTin: request.tin,
      issuedBy: userRole,
      issuedAt: new Date().toISOString(),
      expiryDate: expiryDate || null,
      metadata: metadata || {}
    };

    // Calculate document hash
    const documentHash = require('crypto')
      .createHash('sha256')
      .update(JSON.stringify(documentContent))
      .digest('hex');

    // Create MSP signature using the network member's certificate
    // In production, this would use the actual MSP certificate from crypto-config
    const mspId = `${userRole}MSP`;
    const mspSignature = {
      mspId,
      signedBy: userId,
      signedAt: new Date().toISOString(),
      algorithm: 'SHA256withECDSA',
      // This would be the actual signature using the MSP's private key
      signature: require('crypto')
        .createHash('sha256')
        .update(`${documentHash}${mspId}${userId}${new Date().toISOString()}`)
        .digest('hex'),
      // Reference to the MSP certificate path (in production)
      certificatePath: `/crypto-config/peerOrganizations/${userRole.toLowerCase()}.example.com/users/Admin@${userRole.toLowerCase()}.example.com/msp/signcerts/cert.pem`
    };

    // Store document URL (in production, this would be stored in a document management system)
    const storedDocumentUrl = `/api/documents/${documentNumber}.pdf`;

    // Create issued document with MSP signature
    const docId = require('crypto').randomUUID();
    const insertDocQuery = `
      INSERT INTO issued_documents (
        document_id,
        exporter_id,
        document_type,
        document_number,
        document_hash,
        document_url,
        issuer_member_code,
        issued_by,
        issued_at,
        expiry_date,
        status,
        document_metadata,
        request_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, $9, 'ACTIVE', $10, $11)
      RETURNING *
    `;

    const enrichedMetadata = {
      ...metadata,
      mspSignature,
      documentHash,
      documentContent,
      issuedTo: request.business_name,
      issuedToId: request.exporter_id,
      qualificationData: {
        lastInspectionDate: request.last_inspection_date,
        inspectedBy: request.inspected_by,
        tasterName: request.taster_name,
        licenseExpiryDate: request.license_expiry_date,
        competenceExpiryDate: request.competence_expiry_date
      }
    };

    const docResult = await client.query(insertDocQuery, [
      docId,
      request.exporter_id,
      request.document_type,
      documentNumber,
      documentHash,
      storedDocumentUrl,
      userRole,
      userId,
      expiryDate,
      JSON.stringify(enrichedMetadata),
      requestId
    ]);

    // Update request status
    const updateRequestQuery = `
      UPDATE document_requests
      SET 
        status = 'COMPLETED',
        issued_document_id = $1,
        completed_at = CURRENT_TIMESTAMP
      WHERE request_id = $2
      RETURNING *
    `;

    await client.query(updateRequestQuery, [docId, requestId]);

    await client.query('COMMIT');

    console.log(`[Document Issued] ${request.document_type} issued and signed by ${mspId} for request ${requestId}`);

    res.json({
      success: true,
      message: 'Document issued and signed with MSP certificate',
      document: docResult.rows[0],
      mspSignature,
      documentHash
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Issue Document] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    client.release();
  }
});

/**
 * POST /api/agency/document-requests/:requestId/reject
 * Reject a document request
 */
router.post('/document-requests/:requestId/reject', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { requestId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id || req.user.username;
    const userRole = req.user.role?.toUpperCase();

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Rejection reason is required'
      });
    }

    await client.query('BEGIN');

    const updateQuery = `
      UPDATE document_requests
      SET 
        status = 'REJECTED',
        rejection_reason = $1,
        acknowledged_by = $2,
        acknowledged_at = CURRENT_TIMESTAMP
      WHERE request_id = $3 AND issuer_agency = $4
      RETURNING *
    `;

    const result = await client.query(updateQuery, [reason, userId, requestId, userRole]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Request not found'
      });
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Document request rejected',
      request: result.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Reject Request] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    client.release();
  }
});

module.exports = router;
