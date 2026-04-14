const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { Pool } = require('pg');
const notificationService = require('../services/notification.service');

const pool = new Pool({
  host: process.env.POSTGRES_HOST || process.env.DB_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'coffee_export_db',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
});

/**
 * POST /api/exporter/documents/request
 * Exporter requests a document from a network member
 */
router.post('/request', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const exporterId = req.user.id || req.user.username;
    const { networkMemberCode, documentType, requestNotes } = req.body;

    // Validate required fields
    if (!networkMemberCode || !documentType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: networkMemberCode and documentType are required'
      });
    }

    // Validate network member code format (must be string and not empty)
    if (typeof networkMemberCode !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid networkMemberCode: must be a string'
      });
    }
    
    if (networkMemberCode.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid networkMemberCode: must be a non-empty string'
      });
    }

    // Validate document type format (must be string and not empty)
    if (typeof documentType !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid documentType: must be a string'
      });
    }
    
    if (documentType.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid documentType: must be a non-empty string'
      });
    }

    // Validate request notes if provided
    if (requestNotes !== undefined && requestNotes !== null && typeof requestNotes !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid requestNotes: must be a string'
      });
    }

    // Get exporter UUID
    const exporterQuery = 'SELECT exporter_id FROM exporter_profiles WHERE user_id = $1';
    const exporterResult = await client.query(exporterQuery, [exporterId]);

    if (exporterResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Exporter profile not found'
      });
    }

    const exporterUuid = exporterResult.rows[0].exporter_id;

    // Check if exporter is fully qualified
    // An exporter is fully qualified when:
    // 1. Profile status is ACTIVE
    // 2. Has at least one ACTIVE laboratory
    // 3. Has at least one ACTIVE taster
    // 4. Has at least one ACTIVE competence certificate
    // 5. Has at least one ACTIVE export license
    const qualificationQuery = `
      SELECT 
        ep.status as profile_status,
        EXISTS(SELECT 1 FROM coffee_laboratories cl WHERE cl.exporter_id = ep.exporter_id AND cl.status = 'ACTIVE') as has_active_laboratory,
        EXISTS(SELECT 1 FROM coffee_tasters ct WHERE ct.exporter_id = ep.exporter_id AND ct.status = 'ACTIVE') as has_active_taster,
        EXISTS(SELECT 1 FROM competence_certificates cc WHERE cc.exporter_id = ep.exporter_id AND cc.status = 'ACTIVE') as has_active_competence,
        EXISTS(SELECT 1 FROM export_licenses el WHERE el.exporter_id = ep.exporter_id AND el.status = 'ACTIVE') as has_active_license
      FROM exporter_profiles ep
      WHERE ep.exporter_id = $1
    `;
    const qualResult = await client.query(qualificationQuery, [exporterUuid]);

    if (qualResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Exporter profile not found. Please complete pre-registration first.'
      });
    }

    const qual = qualResult.rows[0];
    const isFullyQualified = 
      qual.profile_status === 'ACTIVE' &&
      qual.has_active_laboratory === true &&
      qual.has_active_taster === true &&
      qual.has_active_competence === true &&
      qual.has_active_license === true;

    if (!isFullyQualified) {
      return res.status(403).json({
        success: false,
        error: 'Exporter must be fully qualified before requesting documents. Please ensure all qualification requirements are met.',
        message: 'Complete your qualification by ensuring you have an active profile, laboratory, taster, competence certificate, and export license.',
        qualification: {
          profile: qual.profile_status,
          laboratory: qual.has_active_laboratory ? 'ACTIVE' : 'MISSING',
          taster: qual.has_active_taster ? 'ACTIVE' : 'MISSING',
          competence: qual.has_active_competence ? 'ACTIVE' : 'MISSING',
          license: qual.has_active_license ? 'ACTIVE' : 'MISSING'
        }
      });
    }

    // Check for duplicate requests (PENDING, UNDER_REVIEW, or ISSUED)
    // Allow new request only if previous request was REJECTED
    const duplicateQuery = `
      SELECT 
        request_id,
        request_status,
        requested_at,
        request_notes,
        reviewed_at,
        rejection_reason
      FROM document_requests 
      WHERE exporter_id = $1 
        AND network_member_code = $2 
        AND document_type = $3 
        AND request_status IN ('PENDING', 'UNDER_REVIEW', 'ISSUED')
      ORDER BY requested_at DESC
      LIMIT 1
    `;
    const duplicateResult = await client.query(duplicateQuery, [
      exporterUuid,
      networkMemberCode,
      documentType
    ]);

    if (duplicateResult.rows.length > 0) {
      const existingRequest = duplicateResult.rows[0];
      const statusMessages = {
        'PENDING': 'A pending request for this document already exists',
        'UNDER_REVIEW': 'A request for this document is currently under review',
        'ISSUED': 'This document has already been issued to you'
      };
      
      return res.status(409).json({
        success: false,
        error: statusMessages[existingRequest.request_status] || 'A request for this document already exists',
        message: 'You cannot request the same document while a previous request is pending, under review, or already issued. If you need a new document, please wait for the current request to be rejected or contact the network member.',
        existingRequest: {
          requestId: existingRequest.request_id,
          status: existingRequest.request_status,
          requestedAt: existingRequest.requested_at,
          reviewedAt: existingRequest.reviewed_at,
          requestNotes: existingRequest.request_notes
        }
      });
    }

    // Begin transaction
    await client.query('BEGIN');

    try {
      // Create document request
      const insertQuery = `
        INSERT INTO document_requests (
          exporter_id,
          network_member_code,
          document_type,
          request_notes,
          request_status
        ) VALUES ($1, $2, $3, $4, 'PENDING')
        RETURNING *
      `;

      const result = await client.query(insertQuery, [
        exporterUuid,
        networkMemberCode,
        documentType,
        requestNotes || null
      ]);

      // Commit transaction
      await client.query('COMMIT');

      console.log(`[Document Request] Created request ${result.rows[0].request_id} for ${exporterId}`);

      // Get exporter business name for notification
      const exporterInfoQuery = 'SELECT business_name, tin FROM exporter_profiles WHERE exporter_id = $1';
      const exporterInfoResult = await client.query(exporterInfoQuery, [exporterUuid]);
      const exporterInfo = {
        exporterId: exporterUuid,
        businessName: exporterInfoResult.rows[0]?.business_name || 'Unknown Exporter',
        tin: exporterInfoResult.rows[0]?.tin || ''
      };

      // AUTO-APPROVAL: Since exporter is fully qualified, auto-approve and issue document
      const requestId = result.rows[0].request_id;
      
      setImmediate(async () => {
        try {
          console.log(`[Document Request] Auto-approving request ${requestId} for qualified exporter`);
          
          // Update request status to UNDER_REVIEW then ISSUED
          await pool.query(
            `UPDATE document_requests 
             SET request_status = 'UNDER_REVIEW', 
                 reviewed_at = CURRENT_TIMESTAMP,
                 reviewed_by = 'SYSTEM_AUTO_APPROVAL'
             WHERE request_id = $1`,
            [requestId]
          );

          // Generate document number
          const timestamp = Date.now();
          const docPrefix = {
            'EXPORT_LICENSE': 'EXL',
            'PHYTOSANITARY_CERTIFICATE': 'PHY',
            'HEALTH_CERTIFICATE': 'HLT',
            'FUMIGATION_CERTIFICATE': 'FUM',
            'QUALITY_CERTIFICATE': 'QUA',
            'CERTIFICATE_OF_ORIGIN': 'COO',
            'BANK_GUARANTEE': 'BGT',
            'SHIPPING_BOOKING': 'SHP',
            'CUSTOMS_CLEARANCE': 'CUS',
            'WEIGHT_CERTIFICATE': 'WGT',
            'EXPORT_PERMIT': 'EXP',
            'PAYMENT_GUARANTEE': 'PGT',
            'CARGO_MANIFEST': 'CGO'
          };
          const prefix = docPrefix[documentType] || 'DOC';
          const documentNumber = `${prefix}-${timestamp}`;

          // Calculate expiry date (1 year from now)
          const expiryDate = new Date();
          expiryDate.setFullYear(expiryDate.getFullYear() + 1);

          // Create document hash (simplified for auto-approval)
          const crypto = require('crypto');
          const hashData = `${documentNumber}-${exporterUuid}-${documentType}-${timestamp}`;
          const documentHash = crypto.createHash('sha256').update(hashData).digest('hex');

          // Issue the document
          const issueQuery = `
            INSERT INTO issued_documents (
              request_id,
              exporter_id,
              issuer_member_code,
              document_type,
              document_number,
              document_hash,
              document_metadata,
              issued_at,
              expiry_date,
              status,
              issued_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, $8, 'ACTIVE', 'SYSTEM_AUTO_APPROVAL')
            RETURNING document_id
          `;

          const metadata = {
            exporterName: exporterInfo.businessName,
            exporterTin: exporterInfo.tin,
            issuanceMethod: 'AUTO_APPROVAL',
            qualificationVerified: true,
            autoApprovedAt: new Date().toISOString()
          };

          const issueResult = await pool.query(issueQuery, [
            requestId,
            exporterUuid,
            networkMemberCode,
            documentType,
            documentNumber,
            documentHash,
            JSON.stringify(metadata),
            expiryDate
          ]);

          const documentId = issueResult.rows[0].document_id;

          // Update request status to ISSUED
          await pool.query(
            `UPDATE document_requests 
             SET request_status = 'ISSUED'
             WHERE request_id = $1`,
            [requestId]
          );

          console.log(`[Document Request] Auto-issued document ${documentId} (${documentNumber}) for request ${requestId}`);

          // Record on blockchain asynchronously
          const blockchainDocumentService = require('../services/blockchain-document.service');
          try {
            await blockchainDocumentService.recordDocumentIssuance({
              documentId,
              exporterId: exporterUuid,
              issuerMemberCode: networkMemberCode,
              documentType,
              documentNumber,
              documentHash,
              issuedAt: new Date(),
              expiryDate
            });
            console.log(`[Document Request] Document ${documentId} recorded on blockchain`);
          } catch (blockchainError) {
            console.error('[Document Request] Blockchain recording error:', blockchainError.message);
          }

        } catch (autoApprovalError) {
          console.error('[Document Request] Auto-approval error:', autoApprovalError);
        }
      });

      // Send notification to network member
      try {
        await notificationService.notifyDocumentRequested(
          networkMemberCode,
          exporterInfo,
          documentType,
          result.rows[0].request_id
        );
      } catch (notificationError) {
        // Log notification error but don't fail the request
        console.error('[Document Request] Notification error:', notificationError.message);
      }

      res.json({
        success: true,
        message: 'Document request submitted successfully. Auto-approval in progress.',
        data: {
          requestId: result.rows[0].request_id,
          networkMemberCode: result.rows[0].network_member_code,
          documentType: result.rows[0].document_type,
          status: result.rows[0].request_status,
          requestedAt: result.rows[0].requested_at,
          autoApproval: true,
          note: 'Document will be automatically issued within seconds as you are fully qualified.'
        }
      });
    } catch (insertError) {
      // Rollback transaction on error
      await client.query('ROLLBACK');
      throw insertError;
    }
  } catch (error) {
    console.error('[Document Request] Error:', error);
    
    // Handle specific database errors
    if (error.code === '23503') {
      // Foreign key violation
      return res.status(400).json({
        success: false,
        error: 'Invalid reference: exporter profile not found',
        details: 'The exporter profile does not exist in the system'
      });
    } else if (error.code === '23505') {
      // Unique constraint violation
      return res.status(409).json({
        success: false,
        error: 'Duplicate request detected',
        details: 'A request with these details already exists'
      });
    } else if (error.code === 'ECONNREFUSED') {
      // Database connection error
      return res.status(503).json({
        success: false,
        error: 'Database connection failed',
        details: 'Unable to connect to the database. Please try again later.'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create document request',
      details: error.message
    });
  } finally {
    client.release();
  }
});

/**
 * GET /api/exporter/documents/requests
 * Get all document requests for the current exporter
 */
router.get('/requests', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const exporterId = req.user.id || req.user.username;
    const { status } = req.query;

    // Validate status parameter if provided
    const validStatuses = ['PENDING', 'UNDER_REVIEW', 'ISSUED', 'REJECTED'];
    
    if (status !== undefined && status !== null) {
      if (typeof status !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Invalid status parameter: must be a string',
          validStatuses
        });
      }
      
      if (!validStatuses.includes(status.toUpperCase())) {
        return res.status(400).json({
          success: false,
          error: `Invalid status value: must be one of ${validStatuses.join(', ')}`,
          validStatuses
        });
      }
    }

    // Get exporter UUID
    const exporterQuery = 'SELECT exporter_id FROM exporter_profiles WHERE user_id = $1';
    const exporterResult = await client.query(exporterQuery, [exporterId]);

    if (exporterResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Exporter profile not found'
      });
    }

    const exporterUuid = exporterResult.rows[0].exporter_id;

    // Build query
    let query = `
      SELECT 
        dr.*,
        id.document_id,
        id.document_number,
        id.issued_at as document_issued_at
      FROM document_requests dr
      LEFT JOIN issued_documents id ON dr.request_id = id.request_id
      WHERE dr.exporter_id = $1
    `;
    const params = [exporterUuid];

    if (status) {
      query += ' AND dr.request_status = $2';
      params.push(status.toUpperCase());
    }

    query += ' ORDER BY dr.requested_at DESC';

    const result = await client.query(query, params);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        requestId: row.request_id,
        networkMemberCode: row.network_member_code,
        documentType: row.document_type,
        status: row.request_status,
        requestNotes: row.request_notes,
        requestedAt: row.requested_at,
        reviewedAt: row.reviewed_at,
        reviewedBy: row.reviewed_by,
        rejectionReason: row.rejection_reason,
        issuedDocument: row.document_id ? {
          documentId: row.document_id,
          documentNumber: row.document_number,
          issuedAt: row.document_issued_at
        } : null
      }))
    });
  } catch (error) {
    console.error('[Document Requests] Error:', error);
    
    // Handle specific database errors
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        error: 'Database connection failed',
        details: 'Unable to connect to the database. Please try again later.'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch document requests',
      details: error.message
    });
  } finally {
    client.release();
  }
});


/**
 * POST /api/exporter/documents/request-all
 * Exporter requests all required export documents at once
 * This is used after sales contract is finalized
 */
router.post('/request-all', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const exporterId = req.user.id || req.user.username;
    const { contractId, shipmentDetails } = req.body;

    if (!contractId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: contractId is required'
      });
    }

    // Get exporter UUID
    const exporterQuery = 'SELECT exporter_id, business_name FROM exporter_profiles WHERE user_id = $1';
    const exporterResult = await client.query(exporterQuery, [exporterId]);

    if (exporterResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Exporter profile not found'
      });
    }

    const exporterUuid = exporterResult.rows[0].exporter_id;
    const businessName = exporterResult.rows[0].business_name;

    // Check if exporter is fully qualified
    const qualificationQuery = `
      SELECT 
        ep.status as profile_status,
        EXISTS(SELECT 1 FROM coffee_laboratories cl WHERE cl.exporter_id = ep.exporter_id AND cl.status = 'ACTIVE') as has_active_laboratory,
        EXISTS(SELECT 1 FROM coffee_tasters ct WHERE ct.exporter_id = ep.exporter_id AND ct.status = 'ACTIVE') as has_active_taster,
        EXISTS(SELECT 1 FROM competence_certificates cc WHERE cc.exporter_id = ep.exporter_id AND cc.status = 'ACTIVE') as has_active_competence,
        EXISTS(SELECT 1 FROM export_licenses el WHERE el.exporter_id = ep.exporter_id AND el.status = 'ACTIVE') as has_active_license
      FROM exporter_profiles ep
      WHERE ep.exporter_id = $1
    `;
    const qualResult = await client.query(qualificationQuery, [exporterUuid]);

    if (qualResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Exporter profile not found'
      });
    }

    const qual = qualResult.rows[0];
    const isFullyQualified = 
      qual.profile_status === 'ACTIVE' &&
      qual.has_active_laboratory === true &&
      qual.has_active_taster === true &&
      qual.has_active_competence === true &&
      qual.has_active_license === true;

    if (!isFullyQualified) {
      return res.status(403).json({
        success: false,
        error: 'Exporter must be fully qualified before requesting documents',
        qualification: {
          profile: qual.profile_status,
          laboratory: qual.has_active_laboratory ? 'ACTIVE' : 'MISSING',
          taster: qual.has_active_taster ? 'ACTIVE' : 'MISSING',
          competence: qual.has_active_competence ? 'ACTIVE' : 'MISSING',
          license: qual.has_active_license ? 'ACTIVE' : 'MISSING'
        }
      });
    }

    // Verify sales contract exists and is finalized
    const contractQuery = `
      SELECT * FROM contract_drafts 
      WHERE draft_id = $1 AND exporter_id = $2 AND status = 'FINALIZED'
    `;
    const contractResult = await client.query(contractQuery, [contractId, exporterUuid]);

    if (contractResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Sales contract not found or not finalized. Please finalize your sales contract first.'
      });
    }

    // Define all required documents and their issuers
    const requiredDocuments = [
      { networkMemberCode: 'ECX', documentType: 'QUALITY_CERTIFICATE', description: 'Coffee Quality Certificate' },
      { networkMemberCode: 'ECTA', documentType: 'CERTIFICATE_OF_ORIGIN', description: 'Certificate of Origin' },
      { networkMemberCode: 'MOA', documentType: 'PHYTOSANITARY_CERTIFICATE', description: 'Phytosanitary Certificate' },
      { networkMemberCode: 'ECX', documentType: 'WEIGHT_CERTIFICATE', description: 'Weight Certificate' },
      { networkMemberCode: 'SHIPPING', documentType: 'BILL_OF_LADING', description: 'Bill of Lading' }
    ];

    await client.query('BEGIN');

    const createdRequests = [];
    const skippedRequests = [];
    const errors = [];

    try {
      for (const doc of requiredDocuments) {
        // Check if request already exists
        const duplicateQuery = `
          SELECT request_id, request_status 
          FROM document_requests 
          WHERE exporter_id = $1 
            AND network_member_code = $2 
            AND document_type = $3 
            AND request_status IN ('PENDING', 'UNDER_REVIEW', 'ISSUED')
          LIMIT 1
        `;
        const duplicateResult = await client.query(duplicateQuery, [
          exporterUuid,
          doc.networkMemberCode,
          doc.documentType
        ]);

        if (duplicateResult.rows.length > 0) {
          skippedRequests.push({
            documentType: doc.documentType,
            networkMemberCode: doc.networkMemberCode,
            description: doc.description,
            reason: `Already ${duplicateResult.rows[0].request_status.toLowerCase()}`,
            existingRequestId: duplicateResult.rows[0].request_id
          });
          continue;
        }

        // Create document request
        const requestNotes = `Requested for sales contract ${contractId}. ${shipmentDetails ? JSON.stringify(shipmentDetails) : ''}`;
        
        const insertQuery = `
          INSERT INTO document_requests (
            exporter_id,
            network_member_code,
            document_type,
            request_notes,
            request_status
          ) VALUES ($1, $2, $3, $4, 'PENDING')
          RETURNING *
        `;

        const result = await client.query(insertQuery, [
          exporterUuid,
          doc.networkMemberCode,
          doc.documentType,
          requestNotes
        ]);

        createdRequests.push({
          requestId: result.rows[0].request_id,
          documentType: doc.documentType,
          networkMemberCode: doc.networkMemberCode,
          description: doc.description,
          status: result.rows[0].request_status,
          requestedAt: result.rows[0].requested_at
        });

        // Send notification to network member (async, don't block)
        setImmediate(async () => {
          try {
            await notificationService.notifyDocumentRequested(
              doc.networkMemberCode,
              { exporterId: exporterUuid, businessName },
              doc.documentType,
              result.rows[0].request_id
            );
          } catch (notificationError) {
            console.error('[Bulk Document Request] Notification error:', notificationError.message);
          }
        });
      }

      await client.query('COMMIT');

      console.log(`[Bulk Document Request] Created ${createdRequests.length} requests for ${exporterId}`);

      res.json({
        success: true,
        message: `Successfully requested ${createdRequests.length} documents`,
        data: {
          contractId,
          created: createdRequests,
          skipped: skippedRequests,
          summary: {
            totalRequested: requiredDocuments.length,
            created: createdRequests.length,
            skipped: skippedRequests.length,
            errors: errors.length
          }
        }
      });
    } catch (insertError) {
      await client.query('ROLLBACK');
      throw insertError;
    }
  } catch (error) {
    console.error('[Bulk Document Request] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create bulk document requests',
      details: error.message
    });
  } finally {
    client.release();
  }
});

/**
 * GET /api/exporter/documents/required
 * Get list of all required documents and their status
 */
router.get('/required', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const exporterId = req.user.id || req.user.username;

    // Get exporter UUID
    const exporterQuery = 'SELECT exporter_id FROM exporter_profiles WHERE user_id = $1';
    const exporterResult = await client.query(exporterQuery, [exporterId]);

    if (exporterResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Exporter profile not found'
      });
    }

    const exporterUuid = exporterResult.rows[0].exporter_id;

    // Define all required documents
    const requiredDocuments = [
      { networkMemberCode: 'ECTA', documentType: 'EXPORT_LICENSE', description: 'Export License', category: 'PRE_QUALIFICATION' },
      { networkMemberCode: 'ECTA', documentType: 'COMPETENCE_CERTIFICATE', description: 'Competence Certificate', category: 'PRE_QUALIFICATION' },
      { networkMemberCode: 'ECTA', documentType: 'LABORATORY_CERTIFICATE', description: 'Laboratory Certificate', category: 'PRE_QUALIFICATION' },
      { networkMemberCode: 'ECTA', documentType: 'TASTER_CERTIFICATE', description: 'Taster Certificate', category: 'PRE_QUALIFICATION' },
      { networkMemberCode: 'EXPORTER', documentType: 'SALES_CONTRACT', description: 'Sales Contract Certificate', category: 'SALES_CONTRACT' },
      { networkMemberCode: 'ECX', documentType: 'QUALITY_CERTIFICATE', description: 'Quality Certificate', category: 'EXPORT_EXECUTION' },
      { networkMemberCode: 'ECTA', documentType: 'CERTIFICATE_OF_ORIGIN', description: 'Certificate of Origin', category: 'EXPORT_EXECUTION' },
      { networkMemberCode: 'MOA', documentType: 'PHYTOSANITARY_CERTIFICATE', description: 'Phytosanitary Certificate', category: 'EXPORT_EXECUTION' },
      { networkMemberCode: 'ECX', documentType: 'WEIGHT_CERTIFICATE', description: 'Weight Certificate', category: 'EXPORT_EXECUTION' },
      { networkMemberCode: 'EXPORTER', documentType: 'PACKING_LIST', description: 'Packing List', category: 'EXPORT_EXECUTION' },
      { networkMemberCode: 'EXPORTER', documentType: 'COMMERCIAL_INVOICE', description: 'Commercial Invoice', category: 'EXPORT_EXECUTION' },
      { networkMemberCode: 'SHIPPING', documentType: 'BILL_OF_LADING', description: 'Bill of Lading', category: 'EXPORT_EXECUTION' }
    ];

    // Get status of each document
    const documentsWithStatus = await Promise.all(
      requiredDocuments.map(async (doc) => {
        // Check if document exists
        const docQuery = `
          SELECT 
            document_id,
            document_number,
            issued_at,
            expiry_date,
            status
          FROM issued_documents
          WHERE exporter_id = $1 
            AND document_type = $2
            AND status = 'ACTIVE'
          ORDER BY issued_at DESC
          LIMIT 1
        `;
        const docResult = await client.query(docQuery, [exporterUuid, doc.documentType]);

        // Check if there's a pending request
        const requestQuery = `
          SELECT 
            request_id,
            request_status,
            requested_at,
            reviewed_at,
            rejection_reason
          FROM document_requests
          WHERE exporter_id = $1 
            AND document_type = $2
          ORDER BY requested_at DESC
          LIMIT 1
        `;
        const requestResult = await client.query(requestQuery, [exporterUuid, doc.documentType]);

        let status = 'NOT_REQUESTED';
        let details = null;

        if (docResult.rows.length > 0) {
          status = 'ISSUED';
          details = {
            documentId: docResult.rows[0].document_id,
            documentNumber: docResult.rows[0].document_number,
            issuedAt: docResult.rows[0].issued_at,
            expiryDate: docResult.rows[0].expiry_date,
            downloadUrl: `/api/exporter/documents/${docResult.rows[0].document_id}/download`
          };
        } else if (requestResult.rows.length > 0) {
          const request = requestResult.rows[0];
          status = request.request_status;
          details = {
            requestId: request.request_id,
            requestedAt: request.requested_at,
            reviewedAt: request.reviewed_at,
            rejectionReason: request.rejection_reason
          };
        }

        return {
          ...doc,
          status,
          details,
          canRequest: status === 'NOT_REQUESTED' || status === 'REJECTED'
        };
      })
    );

    // Group by category
    const grouped = {
      PRE_QUALIFICATION: documentsWithStatus.filter(d => d.category === 'PRE_QUALIFICATION'),
      SALES_CONTRACT: documentsWithStatus.filter(d => d.category === 'SALES_CONTRACT'),
      EXPORT_EXECUTION: documentsWithStatus.filter(d => d.category === 'EXPORT_EXECUTION')
    };

    res.json({
      success: true,
      data: {
        all: documentsWithStatus,
        byCategory: grouped,
        summary: {
          total: documentsWithStatus.length,
          issued: documentsWithStatus.filter(d => d.status === 'ISSUED').length,
          pending: documentsWithStatus.filter(d => d.status === 'PENDING').length,
          underReview: documentsWithStatus.filter(d => d.status === 'UNDER_REVIEW').length,
          rejected: documentsWithStatus.filter(d => d.status === 'REJECTED').length,
          notRequested: documentsWithStatus.filter(d => d.status === 'NOT_REQUESTED').length
        }
      }
    });
  } catch (error) {
    console.error('[Required Documents] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch required documents',
      details: error.message
    });
  } finally {
    client.release();
  }
});


/**
 * GET /api/exporter/documents/:documentId/download
 * Download an issued document PDF
 */
router.get('/:documentId/download', authenticateToken, async (req, res) => {
  console.log('[Document Download] Route hit! DocumentId:', req.params.documentId);
  const client = await pool.connect();
  
  try {
    const { documentId } = req.params;
    const userId = req.user.id || req.user.username;
    console.log('[Document Download] User:', userId, 'DocumentId:', documentId);
    
    // Get exporter UUID
    const exporterQuery = 'SELECT exporter_id FROM exporter_profiles WHERE user_id = $1';
    const exporterResult = await client.query(exporterQuery, [userId]);
    
    if (exporterResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Exporter profile not found'
      });
    }
    
    const exporterUuid = exporterResult.rows[0].exporter_id;
    
    // Get document details
    const docQuery = `
      SELECT 
        id.*,
        ep.business_name,
        ep.tin,
        ep.registration_number,
        ep.office_address as address,
        ep.contact_person,
        ep.phone,
        ep.email
      FROM issued_documents id
      JOIN exporter_profiles ep ON id.exporter_id = ep.exporter_id
      WHERE id.document_id = $1 AND id.exporter_id = $2
    `;
    
    const docResult = await client.query(docQuery, [documentId, exporterUuid]);
    
    if (docResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Document not found or you do not have access to this document'
      });
    }
    
    const document = docResult.rows[0];
    
    // Check if document is active
    if (document.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        error: `Document is ${document.status.toLowerCase()} and cannot be downloaded`
      });
    }
    
    console.log(`[Document Download] Generating PDF for document ${documentId}`);
    
    // Check if we have a stored PDF file
    if (document.document_url) {
      const fs = require('fs');
      const path = require('path');
      const filePath = document.document_url.replace('/storage/documents/', '');
      const fullPath = path.join(process.env.DOCUMENT_STORAGE_PATH || '/app/storage/documents', filePath);
      
      if (fs.existsSync(fullPath)) {
        // Serve the stored PDF file
        const filename = `${document.document_type}_${document.document_number}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        const fileStream = fs.createReadStream(fullPath);
        fileStream.pipe(res);
        
        console.log(`[Document Download] Served stored PDF: ${filename}`);
        return;
      }
    }
    
    // If no stored file, generate PDF on-the-fly
    const { generateDocumentPDF } = require('../utils/document-pdf-generator');
    
    // Prepare document data for PDF generation
    const documentData = {
      documentNumber: document.document_number,
      document_type: document.document_type,
      documentType: document.document_type, // Some generators use this
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

module.exports = router;
