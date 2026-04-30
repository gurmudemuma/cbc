const express = require('express');
const router = express.Router();
const { submitTransaction, evaluateTransaction } = require('../services');
const { authenticateToken } = require('../middleware/auth');
const { Pool } = require('pg');

// Database pool for network submissions
const pool = new Pool({
  host: process.env.POSTGRES_HOST || process.env.DB_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'coffee_export_db',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
});

/**
 * Submit Network request
 */
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const NetworkData = {
      exporterId: req.user.id,
      companyName: req.user.companyName,
      ...req.body,
      submittedAt: new Date().toISOString(),
      status: 'submitted'
    };

    // Validate required fields
    const required = ['productType', 'quantity', 'destinationCountry', 'estimatedValue'];
    for (const field of required) {
      if (!NetworkData[field]) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }

    const result = await submitTransaction(
      req.user.id,
      process.env.CHAINCODE_NAME || 'ecta',
      'SubmitNetworkRequest',
      JSON.stringify(NetworkData)
    );

    res.json({
      success: true,
      message: 'Network request submitted',
      requestId: result
    });
  } catch (error) {
    console.error('Network submission error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Submit to Network (ESW) - Modified to accept issued documents
 * POST /api/network/submissions
 */
router.post('/submissions', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { exporterInfo, issuedDocumentIds, supportingDocuments } = req.body;
    const userId = req.user.id || req.user.username;

    // Validate required fields
    if (!issuedDocumentIds || !Array.isArray(issuedDocumentIds) || issuedDocumentIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: issuedDocumentIds array is required'
      });
    }

    // Get exporter UUID
    const exporterQuery = 'SELECT exporter_id, business_name, tin FROM exporter_profiles WHERE user_id = $1';
    const exporterResult = await client.query(exporterQuery, [userId]);

    if (exporterResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Exporter profile not found'
      });
    }

    const exporterUuid = exporterResult.rows[0].exporter_id;
    const exporterData = exporterResult.rows[0];

    // Verify all documents belong to exporter and are ACTIVE
    const docQuery = `
      SELECT document_id, document_type, issuer_member_code, status, expiry_date
      FROM issued_documents
      WHERE document_id = ANY($1) AND exporter_id = $2
    `;
    const docResult = await client.query(docQuery, [issuedDocumentIds, exporterUuid]);

    if (docResult.rows.length !== issuedDocumentIds.length) {
      return res.status(400).json({
        success: false,
        error: 'Some documents not found or do not belong to you'
      });
    }

    // Check for expired or revoked documents
    const invalidDocs = docResult.rows.filter(doc => {
      if (doc.status !== 'ACTIVE') return true;
      if (doc.expiry_date && new Date(doc.expiry_date) < new Date()) return true;
      return false;
    });

    if (invalidDocs.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Some documents are expired or revoked',
        invalidDocuments: invalidDocs.map(d => ({
          documentId: d.document_id,
          type: d.document_type,
          status: d.status,
          expiryDate: d.expiry_date
        }))
      });
    }

    // Check if all required documents are provided
    const requiredTypes = [
      'EXPORT_LICENSE',
      'PHYTOSANITARY_CERTIFICATE',
      'HEALTH_CERTIFICATE',
      'QUALITY_CERTIFICATE',
      'CERTIFICATE_OF_ORIGIN',
      'BANK_GUARANTEE',
      'SHIPPING_BOOKING',
      'CUSTOMS_CLEARANCE'
    ];

    const providedTypes = docResult.rows.map(d => d.document_type);
    const missingTypes = requiredTypes.filter(t => !providedTypes.includes(t));

    if (missingTypes.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required documents',
        missingDocuments: missingTypes
      });
    }

    // Generate reference numbers
    const timestamp = Date.now();
    const eswReferenceNumber = `NET-${timestamp}`;
    const networkReferenceNumber = `NET-REF-${timestamp}`;
    const submissionId = `SUB-${timestamp}`;

    // Create submission record
    await client.query('BEGIN');

    try {
      const insertQuery = `
        INSERT INTO network_submissions (
          submission_id,
          exporter_id,
          esw_reference_number,
          network_reference_number,
          exporter_info,
          supporting_documents,
          submitted_at,
          status,
          documents_collected,
          required_documents_count,
          issued_documents_count,
          ecta_status,
          bank_status,
          nbe_status,
          customs_status,
          shipping_status
        ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, 'SUBMITTED', true, $7, $8, 'PENDING', 'PENDING', 'PENDING', 'PENDING', 'PENDING')
        RETURNING *
      `;

      await client.query(insertQuery, [
        submissionId,
        exporterUuid,
        eswReferenceNumber,
        networkReferenceNumber,
        JSON.stringify(exporterInfo || {
          businessName: exporterData.business_name,
          tin: exporterData.tin,
          registrationNumber: userId
        }),
        JSON.stringify(supportingDocuments || []),
        requiredTypes.length,
        issuedDocumentIds.length
      ]);

      // Link documents to submission
      for (const documentId of issuedDocumentIds) {
        await client.query(
          'INSERT INTO submission_documents (submission_id, document_id) VALUES ($1, $2)',
          [submissionId, documentId]
        );
      }

      // Trigger document authentication for each network member
      const networkMembers = [...new Set(docResult.rows.map(d => d.issuer_member_code))];
      
      // Process document authentication and auto-approve based on verification
      setImmediate(async () => {
        const blockchainDocumentService = require('../services/blockchain-document.service');
        const authResults = {};
        
        for (const memberCode of networkMembers) {
          const memberDocs = docResult.rows.filter(d => d.issuer_member_code === memberCode);
          let allDocsVerified = true;
          
          for (const doc of memberDocs) {
            try {
              // Verify document authenticity against blockchain
              const verification = await blockchainDocumentService.verifyDocumentAuthenticity(
                doc.document_id,
                doc.document_hash
              );
              
              const authStatus = verification.isValid && verification.hashMatch ? 'VERIFIED' : 'FAILED';
              
              if (authStatus === 'FAILED') {
                allDocsVerified = false;
              }
              
              // Record authentication
              await pool.query(
                `INSERT INTO document_authentications (
                  submission_id, document_id, authenticator_member_code, 
                  authentication_status, verification_method, verification_result,
                  authenticated_at
                ) VALUES ($1, $2, $3, $4, 'BLOCKCHAIN', $5, CURRENT_TIMESTAMP)`,
                [submissionId, doc.document_id, memberCode, authStatus, JSON.stringify(verification)]
              );
              
              console.log(`[Network Submission] Document ${doc.document_id} authenticated by ${memberCode}: ${authStatus}`);
            } catch (authError) {
              console.error('[Network Submission] Authentication error:', authError);
              allDocsVerified = false;
            }
          }
          
          authResults[memberCode] = allDocsVerified;
        }
        
        // Auto-approve agencies whose documents are all verified
        const memberStatusMap = {
          'ECTA': 'ecta_status',
          'BANK': 'bank_status',
          'NBE': 'nbe_status',
          'CUSTOMS': 'customs_status',
          'SHIPPING': 'shipping_status',
          'MOA': 'ecta_status', // MOA documents count as ECTA
          'MOH': 'ecta_status', // MOH documents count as ECTA
          'ECX': 'ecta_status'  // ECX documents count as ECTA
        };
        
        const approvalUpdates = [];
        for (const [memberCode, verified] of Object.entries(authResults)) {
          const statusColumn = memberStatusMap[memberCode];
          if (statusColumn && verified) {
            const approvedAtColumn = statusColumn.replace('_status', '_approved_at');
            const approvedByColumn = statusColumn.replace('_status', '_approved_by');
            const notesColumn = statusColumn.replace('_status', '_notes');
            
            approvalUpdates.push(`
              ${statusColumn} = 'APPROVED',
              ${approvedAtColumn} = CURRENT_TIMESTAMP,
              ${approvedByColumn} = 'SYSTEM_AUTO_APPROVAL',
              ${notesColumn} = 'Auto-approved: All documents verified on blockchain'
            `);
            
            console.log(`[Network Submission] Auto-approved ${memberCode} for submission ${submissionId}`);
          }
        }
        
        if (approvalUpdates.length > 0) {
          try {
            const updateQuery = `
              UPDATE network_submissions 
              SET ${approvalUpdates.join(', ')}, updated_at = CURRENT_TIMESTAMP
              WHERE submission_id = $1
              RETURNING *
            `;
            
            const updateResult = await pool.query(updateQuery, [submissionId]);
            const submission = updateResult.rows[0];
            
            // Check if all required agencies have approved
            const allApproved = 
              submission.ecta_status === 'APPROVED' &&
              submission.bank_status === 'APPROVED' &&
              submission.nbe_status === 'APPROVED' &&
              submission.customs_status === 'APPROVED' &&
              submission.shipping_status === 'APPROVED';
            
            if (allApproved) {
              await pool.query(
                `UPDATE network_submissions 
                 SET status = 'EXPORT_APPROVED', completed_at = CURRENT_TIMESTAMP 
                 WHERE submission_id = $1`,
                [submissionId]
              );
              console.log(`[Network Submission] Submission ${submissionId} fully approved by all agencies`);
            }
          } catch (updateError) {
            console.error('[Network Submission] Auto-approval update error:', updateError);
          }
        }
      });

      await client.query('COMMIT');

      console.log(`[Network Submission] Created submission ${submissionId} with ${issuedDocumentIds.length} documents`);
      console.log(`[Network Submission] Auto-approval process initiated for ${networkMembers.length} network members`);

      res.json({
        success: true,
        message: 'Export submitted to Network successfully. Document verification and auto-approval in progress.',
        data: {
          eswReferenceNumber,
          networkReferenceNumber,
          submissionId,
          status: 'SUBMITTED',
          documentsToAuthenticate: issuedDocumentIds.length,
          networkMembers: networkMembers.length,
          networkMembersList: networkMembers,
          exporterInfo: exporterInfo || {
            businessName: exporterData.business_name,
            tin: exporterData.tin
          },
          approvalStatus: {
            ecta: 'PENDING',
            bank: 'PENDING',
            nbe: 'PENDING',
            customs: 'PENDING',
            shipping: 'PENDING'
          },
          note: 'Documents are being verified on blockchain. Agencies will be auto-approved upon successful verification.'
        }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('[Network Submission] Error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to submit to Network',
      message: error.message 
    });
  } finally {
    client.release();
  }
});

/**
 * Get network status (blockchain connectivity)
 * GET /api/network/status
 */
router.get('/status', authenticateToken, async (req, res) => {
  try {
    // Check blockchain connectivity
    const fabricService = require('../services');
    
    // Try to query blockchain
    try {
      await fabricService.evaluateTransaction(
        req.user.id,
        process.env.CHAINCODE_NAME || 'ecta',
        'HealthCheck'
      );
      
      res.json({
        status: 'connected',
        blockchain: 'operational',
        timestamp: new Date().toISOString()
      });
    } catch (blockchainError) {
      res.json({
        status: 'degraded',
        blockchain: 'unavailable',
        error: blockchainError.message,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Network status error:', error);
    res.status(500).json({ 
      status: 'error',
      error: error.message 
    });
  }
});

/**
 * Get all Network submissions for current exporter
 */
router.get('/my-submissions', authenticateToken, async (req, res) => {
  try {
    const result = await evaluateTransaction(
      req.user.id,
      process.env.CHAINCODE_NAME || 'ecta',
      'GetMyNetworkSubmissions',
      req.user.id
    );

    res.json(JSON.parse(result));
  } catch (error) {
    console.error('Network fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get Network statistics
 */
router.get('/statistics', authenticateToken, async (req, res) => {
  console.log('[Network Statistics] Endpoint called');
  try {
    // Get comprehensive statistics from PostgreSQL database
    console.log('[Network Statistics] Querying database for stats...');
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as "totalSubmissions",
        COUNT(*) FILTER (WHERE status IN ('SUBMITTED', 'DOCUMENTS_PENDING', 'UNDER_REVIEW')) as pending,
        COUNT(*) FILTER (WHERE status = 'UNDER_REVIEW') as "underReview",
        COUNT(*) FILTER (WHERE status IN ('EXPORT_APPROVED', 'APPROVED', 'COMPLETED')) as approved,
        COUNT(*) FILTER (WHERE status IN ('REJECTED', 'EXPORT_REJECTED')) as rejected,
        COUNT(*) FILTER (WHERE status = 'INFO_REQUIRED') as "infoRequired"
      FROM network_submissions
    `);
    
    // Calculate processing times for approved submissions
    // Use completed_at if available, otherwise use the latest agency approval timestamp
    const timingResult = await pool.query(`
      SELECT 
        AVG(EXTRACT(EPOCH FROM (
          COALESCE(
            completed_at,
            GREATEST(
              ecta_approved_at,
              bank_approved_at,
              nbe_approved_at,
              customs_approved_at,
              shipping_approved_at
            )
          ) - submitted_at
        )) / 3600) as "avgProcessingTime",
        MIN(EXTRACT(EPOCH FROM (
          COALESCE(
            completed_at,
            GREATEST(
              ecta_approved_at,
              bank_approved_at,
              nbe_approved_at,
              customs_approved_at,
              shipping_approved_at
            )
          ) - submitted_at
        )) / 3600) as "fastestApproval",
        MAX(EXTRACT(EPOCH FROM (
          COALESCE(
            completed_at,
            GREATEST(
              ecta_approved_at,
              bank_approved_at,
              nbe_approved_at,
              customs_approved_at,
              shipping_approved_at
            )
          ) - submitted_at
        )) / 3600) as "slowestApproval"
      FROM network_submissions
      WHERE status IN ('EXPORT_APPROVED', 'APPROVED', 'COMPLETED')
        AND (
          completed_at IS NOT NULL 
          OR ecta_approved_at IS NOT NULL
          OR bank_approved_at IS NOT NULL
          OR nbe_approved_at IS NOT NULL
          OR customs_approved_at IS NOT NULL
          OR shipping_approved_at IS NOT NULL
        )
    `);
    
    const stats = statsResult.rows[0] || {
      totalSubmissions: 0,
      pending: 0,
      underReview: 0,
      approved: 0,
      rejected: 0,
      infoRequired: 0
    };
    
    const timing = timingResult.rows[0] || {
      avgProcessingTime: 0,
      fastestApproval: 0,
      slowestApproval: 0
    };
    
    console.log('[Network Statistics] Stats:', stats);
    console.log('[Network Statistics] Timing:', timing);
    
    res.json({
      success: true,
      data: {
        totalSubmissions: parseInt(stats.totalSubmissions) || 0,
        pending: parseInt(stats.pending) || 0,
        underReview: parseInt(stats.underReview) || 0,
        approved: parseInt(stats.approved) || 0,
        rejected: parseInt(stats.rejected) || 0,
        infoRequired: parseInt(stats.infoRequired) || 0,
        avgProcessingTime: timing.avgProcessingTime ? Math.round(parseFloat(timing.avgProcessingTime)) : 0,
        fastestApproval: timing.fastestApproval ? Math.round(parseFloat(timing.fastestApproval)) : 0,
        slowestApproval: timing.slowestApproval ? Math.round(parseFloat(timing.slowestApproval)) : 0
      }
    });
  } catch (error) {
    console.error('[Network Statistics] Error:', error);
    // Return default stats on error
    res.json({
      success: true,
      data: {
        totalSubmissions: 0,
        pending: 0,
        underReview: 0,
        approved: 0,
        rejected: 0,
        infoRequired: 0,
        avgProcessingTime: 0,
        fastestApproval: 0,
        slowestApproval: 0
      }
    });
  }
});

/**
 * Get all Network submissions (with filters)
 * IMPORTANT: This route must be BEFORE /:requestId to avoid route collision
 */
router.get('/submissions', authenticateToken, async (req, res) => {
  try {
    console.log('[Network Submissions] Endpoint called with query:', req.query);
    const { status, exportId } = req.query;
    
    let query = 'SELECT * FROM network_submissions WHERE 1=1';
    const params = [];
    let paramCount = 1;
    
    if (status) {
      query += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    if (exportId) {
      query += ` AND esw_reference_number = $${paramCount}`;
      params.push(exportId);
      paramCount++;
    }
    
    query += ' ORDER BY submitted_at DESC';
    
    console.log('[Network Submissions] Query:', query);
    console.log('[Network Submissions] Params:', params);
    
    const result = await pool.query(query, params);
    
    console.log('[Network Submissions] Found', result.rows.length, 'submissions');
    
    // Map database column names to frontend-expected field names
    const mappedData = result.rows.map(row => {
      // Calculate approved agencies count from individual status columns
      const agencyStatuses = [
        row.ecta_status,
        row.bank_status,
        row.nbe_status,
        row.customs_status,
        row.shipping_status
      ];
      const approvedCount = agencyStatuses.filter(status => status === 'APPROVED').length;
      
      return {
        submissionId: row.submission_id,
        exportId: row.network_reference_number,
        exporterId: row.exporter_id,
        networkReferenceNumber: row.esw_reference_number,
        submittedAt: row.submitted_at,
        status: row.status,
        approvedAt: row.approved_at,
        rejectedAt: row.rejected_at,
        approvedAgencies: Array(approvedCount).fill('APPROVED'), // Create array with approved count
        rejectedAgencies: row.rejected_agencies || [],
        pendingAgencies: row.pending_agencies || [],
        documentHash: row.document_hash,
        blockchainTxId: row.blockchain_tx_id,
        metadata: row.metadata,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    });
    
    res.json({
      success: true,
      data: mappedData
    });
  } catch (error) {
    console.error('[Network Submissions] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get certificates for a submission
 * GET /api/network/submissions/:submissionId/certificates
 * IMPORTANT: This route must be BEFORE /submissions/:submissionId to avoid route collision
 */
router.get('/submissions/:submissionId/certificates', authenticateToken, async (req, res) => {
  try {
    const { submissionId } = req.params;
    
    // Query issued_documents via submission_documents junction table
    const query = `
      SELECT 
        id.document_id as "certificateId",
        id.document_number as "certificateNumber",
        id.issuer_member_code as "agencyCode",
        id.document_type as "documentType",
        id.issued_at as "issuedAt",
        id.expiry_date as "expiresAt",
        id.status,
        id.document_metadata as metadata
      FROM submission_documents sd
      JOIN issued_documents id ON sd.document_id = id.document_id
      WHERE sd.submission_id = $1
      ORDER BY id.issued_at DESC
    `;
    
    const result = await pool.query(query, [submissionId]);
    
    // Helper function to get agency name from code
    const getAgencyName = (code) => {
      const agencies = {
        'ECTA': 'Ethiopian Coffee & Tea Authority',
        'MOA': 'Ministry of Agriculture',
        'MOH': 'Ministry of Health',
        'ECX': 'Ethiopian Commodity Exchange',
        'BANK': 'National Bank of Ethiopia',
        'NBE': 'National Bank of Ethiopia',
        'SHIPPING': 'Shipping Line',
        'ERCA': 'Ethiopian Revenues and Customs Authority',
        'CUSTOMS': 'Customs Authority'
      };
      return agencies[code] || code;
    };
    
    res.json({
      success: true,
      data: result.rows.map(row => ({
        ...row,
        agencyName: getAgencyName(row.agencyCode),
        metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata
      }))
    });
  } catch (error) {
    console.error('[Get Submission Certificates] Error:', error);
    res.status(500).json({ success: false, error: error.message, data: [] });
  }
});

/**
 * Download certificate PDF
 * GET /api/network/certificates/:certificateId/download
 */
router.get('/certificates/:certificateId/download', authenticateToken, async (req, res) => {
  try {
    const { certificateId } = req.params;
    
    // Get document details
    const docQuery = await pool.query(
      'SELECT document_id, document_number, document_type, document_url FROM issued_documents WHERE document_id = $1',
      [certificateId]
    );
    
    if (docQuery.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Certificate not found' });
    }
    
    const document = docQuery.rows[0];
    
    // If document has a URL, redirect to it
    if (document.document_url) {
      return res.redirect(document.document_url);
    }
    
    // Otherwise, return 404 as PDF generation is not implemented for this document type
    res.status(404).json({ 
      success: false, 
      error: 'Certificate PDF not available. Document URL not found.' 
    });
  } catch (error) {
    console.error('[Download Certificate] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get submission by ID
 * IMPORTANT: This route must be BEFORE /:requestId to avoid route collision
 */
router.get('/submissions/:submissionId', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM network_submissions WHERE submission_id = $1',
      [req.params.submissionId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Submission not found' });
    }
    
    const submission = result.rows[0];
    const exporterInfo = submission.exporter_info || {};
    
    // Try to get export details from linked documents or exports table
    let exportData = {
      exportId: exporterInfo.exportId || submission.network_reference_number || 'N/A',
      exporterName: exporterInfo.businessName || exporterInfo.companyName || 'N/A',
      coffeeType: exporterInfo.coffeeType || exporterInfo.productType || 'N/A',
      quantity: exporterInfo.quantity || exporterInfo.quantityKg || 0,
      destinationCountry: exporterInfo.destination || exporterInfo.destinationCountry || 'N/A',
    };
    
    // Try to find related export record
    try {
      const exportQuery = await pool.query(
        `SELECT e.export_id, e.coffee_type, e.quantity, e.destination_country, e.buyer_name, e.estimated_value
         FROM exports e
         WHERE e.exporter_id = $1 
         AND e.status NOT IN ('CANCELLED', 'COMPLETED')
         ORDER BY e.created_at DESC
         LIMIT 1`,
        [submission.exporter_id]
      );
      
      if (exportQuery.rows.length > 0) {
        const exp = exportQuery.rows[0];
        exportData = {
          exportId: exp.export_id || exportData.exportId,
          exporterName: exporterInfo.businessName || exporterInfo.companyName || 'N/A',
          coffeeType: exp.coffee_type || exportData.coffeeType,
          quantity: exp.quantity || exportData.quantity,
          destinationCountry: exp.destination_country || exportData.destinationCountry,
          buyerName: exp.buyer_name,
          estimatedValue: exp.estimated_value,
        };
      }
    } catch (exportError) {
      console.log('Could not fetch related export:', exportError.message);
    }
    
    // Also try to extract info from issued documents metadata
    try {
      const docsQuery = await pool.query(
        `SELECT id.document_type, id.document_metadata
         FROM submission_documents sd
         JOIN issued_documents id ON sd.document_id = id.document_id
         WHERE sd.submission_id = $1
         AND id.document_type IN ('EXPORT_LICENSE', 'EXPORT_PERMIT', 'QUALITY_CERTIFICATE')
         LIMIT 3`,
        [submission.submission_id]
      );
      
      // Extract export details from document metadata
      for (const doc of docsQuery.rows) {
        const metadata = doc.document_metadata || {};
        if (metadata.coffeeType && exportData.coffeeType === 'N/A') {
          exportData.coffeeType = metadata.coffeeType;
        }
        if (metadata.quantity && exportData.quantity === 0) {
          // Parse quantity from strings like "1000 bags" or "5000 kg"
          const qtyMatch = String(metadata.quantity).match(/(\d+(?:\.\d+)?)/);
          if (qtyMatch) {
            exportData.quantity = parseFloat(qtyMatch[1]);
          }
        }
        if (metadata.destination && exportData.destinationCountry === 'N/A') {
          exportData.destinationCountry = metadata.destination;
        }
        if (metadata.destinationCountry && exportData.destinationCountry === 'N/A') {
          exportData.destinationCountry = metadata.destinationCountry;
        }
      }
    } catch (docsError) {
      console.log('Could not fetch document metadata:', docsError.message);
    }
    
    // Structure data to match frontend expectations
    const responseData = {
      submissionId: submission.submission_id,
      networkReferenceNumber: submission.network_reference_number,
      eswReferenceNumber: submission.esw_reference_number,
      status: submission.status || 'PENDING',
      submittedAt: submission.submitted_at,
      submittedBy: exporterInfo.businessName || exporterInfo.companyName || 'N/A',
      
      // Export information (nested object as frontend expects)
      export: exportData,
      
      // Exporter details
      exporterInfo: {
        businessName: exporterInfo.businessName || exporterInfo.companyName || 'N/A',
        tin: exporterInfo.tin || 'N/A',
        registrationNumber: exporterInfo.registrationNumber || exporterInfo.reg_number || 'N/A',
        email: exporterInfo.email || 'N/A',
        phone: exporterInfo.phone || 'N/A',
        address: exporterInfo.address || 'N/A',
        contactPerson: exporterInfo.contactPerson || 'N/A',
        businessType: exporterInfo.businessType || 'N/A',
      },
      
      // Agency statuses
      ecta_status: submission.ecta_status,
      ecta_approved_at: submission.ecta_approved_at,
      ecta_approved_by: submission.ecta_approved_by,
      ecta_notes: submission.ecta_notes,
      
      bank_status: submission.bank_status,
      bank_approved_at: submission.bank_approved_at,
      bank_approved_by: submission.bank_approved_by,
      bank_notes: submission.bank_notes,
      
      nbe_status: submission.nbe_status,
      nbe_approved_at: submission.nbe_approved_at,
      nbe_approved_by: submission.nbe_approved_by,
      nbe_notes: submission.nbe_notes,
      
      customs_status: submission.customs_status,
      customs_approved_at: submission.customs_approved_at,
      customs_approved_by: submission.customs_approved_by,
      customs_notes: submission.customs_notes,
      
      shipping_status: submission.shipping_status,
      shipping_approved_at: submission.shipping_approved_at,
      shipping_approved_by: submission.shipping_approved_by,
      shipping_notes: submission.shipping_notes,
      
      // Document counts
      documents_collected: submission.documents_collected,
      required_documents_count: submission.required_documents_count,
      issued_documents_count: submission.issued_documents_count,
      
      // Supporting documents
      supportingDocuments: submission.supporting_documents || [],
      
      // Timestamps
      created_at: submission.created_at,
      updated_at: submission.updated_at,
      completed_at: submission.completed_at,
    };
    
    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Get submission error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get agencies for current user
 * IMPORTANT: This route must be BEFORE /:requestId to avoid route collision
 */
router.get('/agencies/my/list', authenticateToken, async (req, res) => {
  try {
    console.log('[Agencies] User requesting agencies:', {
      id: req.user.id,
      role: req.user.role,
      organization: req.user.organization
    });
    
    const userId = req.user.id;
    
    // First, check if user has explicit agency assignments in database
    try {
      const assignmentResult = await pool.query(`
        SELECT 
          nm.member_code as code, 
          nm.member_name as name, 
          nm.member_code as id,
          nm.member_type as type, 
          nm.description, 
          nm.is_active as "isActive",
          unm.role
        FROM user_network_members unm
        JOIN network_members nm ON unm.member_id = nm.member_id
        WHERE unm.user_id = $1 AND nm.is_active = true
        ORDER BY nm.member_name
      `, [userId]);
      
      if (assignmentResult.rows.length > 0) {
        console.log('[Agencies] Found', assignmentResult.rows.length, 'database assignments for user');
        return res.json({
          success: true,
          data: assignmentResult.rows  // Changed from 'agencies' to 'data'
        });
      }
    } catch (dbError) {
      console.log('[Agencies] Database assignment check failed:', dbError.message);
    }
    
    // Fallback to organization/role mapping if no database assignments
    const userOrg = (req.user.organization || '').toLowerCase();
    const userRole = (req.user.role || '').toLowerCase();
    
    // Map user organization/role to member codes
    const memberCodeMap = {
      'ecta': ['ECTA'],
      'custom-authorities': ['ERCA'],
      'customs': ['ERCA'],
      'national-bank': ['NBE'],
      'nb-regulatory': ['NBE'],
      'nbe': ['NBE'],
      'governor': ['NBE'],
      'ecx': ['ECX'],
      'commercial-bank': ['CBE'],
      'commercialbank': ['CBE'],
      'bank': ['CBE'],  // Fixed: Changed from BANK to CBE
      'banker': ['CBE'], // Fixed: Changed from BANK to CBE
      'shipping': ['SHIPPING'],
      'shipping-line': ['SHIPPING'],
      'shippingline': ['SHIPPING'],
      'moa': ['MOA'],
      'moh': ['MOH']
    };
    
    // Determine which member codes the user has access to
    let memberCodes = [];
    
    // Check organization first
    if (memberCodeMap[userOrg]) {
      memberCodes = [...memberCodeMap[userOrg]];
    }
    
    // Check role
    if (memberCodeMap[userRole]) {
      memberCodes = [...new Set([...memberCodes, ...memberCodeMap[userRole]])];
    }
    
    // Admin has access to all agencies
    if (userRole === 'admin') {
      const allAgenciesResult = await pool.query(`
        SELECT member_code as code, member_name as name, member_code as id, 
               member_type as type, description, is_active as "isActive"
        FROM network_members
        WHERE is_active = true
        ORDER BY member_name
      `);
      
      console.log('[Agencies] Admin user - returning all', allAgenciesResult.rows.length, 'agencies');
      
      return res.json({
        success: true,
        data: allAgenciesResult.rows  // Changed from 'agencies' to 'data'
      });
    }
    
    // Fetch agencies from database based on member codes
    if (memberCodes.length > 0) {
      const result = await pool.query(`
        SELECT member_code as code, member_name as name, member_code as id,
               member_type as type, description, is_active as "isActive"
        FROM network_members
        WHERE member_code = ANY($1) AND is_active = true
        ORDER BY member_name
      `, [memberCodes]);
      
      console.log('[Agencies] Returning', result.rows.length, 'agencies for user via organization mapping');
      
      return res.json({
        success: true,
        data: result.rows  // Changed from 'agencies' to 'data'
      });
    }
    
    // No agencies found for user
    console.log('[Agencies] No agencies found for user');
    res.json({
      success: true,
      data: []  // Changed from 'agencies' to 'data'
    });
  } catch (error) {
    console.error('[Agencies] Fetch error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * Get all network members (public endpoint for reference)
 */
router.get('/agencies/all', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        member_code as code, 
        member_name as name, 
        member_type as type,
        description,
        contact_email as email,
        contact_phone as phone,
        is_active as "isActive",
        can_issue_documents as "canIssueDocuments",
        can_approve_exports as "canApproveExports"
      FROM network_members
      WHERE is_active = true
      ORDER BY member_name
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('[Network Members] Fetch error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * GET /api/network/dashboard
 * Get network member dashboard data (hybrid: PostgreSQL with blockchain fallback)
 */
router.get('/dashboard', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userRole = req.user.role?.toLowerCase();
    const userOrg = (req.user.organization || req.user.companyName || '').toUpperCase();
    
    console.log(`[Network Dashboard] User: ${req.user.username}, Role: ${userRole}, Org: ${userOrg}`);
    
    // Get basic statistics from PostgreSQL (fast)
    const statsQuery = `
      SELECT 
        COUNT(DISTINCT e.export_id) as total_exports,
        COUNT(DISTINCT e.export_id) FILTER (WHERE e.status IN ('PENDING', 'SUBMITTED')) as pending_exports,
        COUNT(DISTINCT e.export_id) FILTER (WHERE e.status = 'COMPLETED') as completed_exports,
        COUNT(DISTINCT p.payment_id) as total_payments,
        COUNT(DISTINCT p.payment_id) FILTER (WHERE p.status = 'COMPLETED') as completed_payments,
        COUNT(DISTINCT sc.contract_id) as total_contracts,
        COUNT(DISTINCT sc.contract_id) FILTER (WHERE sc.status = 'REGISTERED') as registered_contracts
      FROM exports e
      LEFT JOIN payments p ON e.export_id = p.export_id
      LEFT JOIN sales_contracts sc ON e.exporter_id = sc.exporter_id
    `;
    
    const statsResult = await client.query(statsQuery);
    const stats = statsResult.rows[0];
    
    // Get recent activities from PostgreSQL
    const activitiesQuery = `
      SELECT 
        'export' as type,
        e.export_id as id,
        e.coffee_type as title,
        e.status,
        e.created_at,
        ep.business_name as exporter_name
      FROM exports e
      LEFT JOIN exporter_profiles ep ON e.exporter_id = ep.exporter_id
      ORDER BY e.created_at DESC
      LIMIT 10
    `;
    
    const activitiesResult = await client.query(activitiesQuery);
    
    // Get network member specific data
    let memberSpecificData = {};
    
    if (userRole === 'bank' || userRole === 'banker') {
      const bankQuery = `
        SELECT 
          COUNT(*) as pending_reviews,
          SUM(amount) as total_amount_pending
        FROM payments 
        WHERE status IN ('INITIATED', 'DOCUMENTS_SUBMITTED', 'UNDER_REVIEW')
      `;
      const bankResult = await client.query(bankQuery);
      memberSpecificData = {
        pendingReviews: bankResult.rows[0].pending_reviews || 0,
        totalAmountPending: bankResult.rows[0].total_amount_pending || 0
      };
    }
    
    if (userRole === 'ecta') {
      const ectaQuery = `
        SELECT 
          COUNT(*) as pending_approvals,
          COUNT(*) FILTER (WHERE status = 'ECTA_LICENSE_PENDING') as license_pending,
          COUNT(*) FILTER (WHERE status = 'ECTA_QUALITY_PENDING') as quality_pending
        FROM exports 
        WHERE status LIKE 'ECTA_%'
      `;
      const ectaResult = await client.query(ectaQuery);
      memberSpecificData = {
        pendingApprovals: ectaResult.rows[0].pending_approvals || 0,
        licensePending: ectaResult.rows[0].license_pending || 0,
        qualityPending: ectaResult.rows[0].quality_pending || 0
      };
    }
    
    if (userRole === 'nbe') {
      const nbeQuery = `
        SELECT 
          COUNT(*) as fx_pending,
          SUM(amount) as fx_amount_pending
        FROM payments 
        WHERE status = 'PROCESSING' AND payment_method LIKE '%FX%'
      `;
      const nbeResult = await client.query(nbeQuery);
      memberSpecificData = {
        fxPending: nbeResult.rows[0].fx_pending || 0,
        fxAmountPending: nbeResult.rows[0].fx_amount_pending || 0
      };
    }
    
    const dashboardData = {
      success: true,
      statistics: {
        totalExports: parseInt(stats.total_exports) || 0,
        pendingExports: parseInt(stats.pending_exports) || 0,
        completedExports: parseInt(stats.completed_exports) || 0,
        totalPayments: parseInt(stats.total_payments) || 0,
        completedPayments: parseInt(stats.completed_payments) || 0,
        totalContracts: parseInt(stats.total_contracts) || 0,
        registeredContracts: parseInt(stats.registered_contracts) || 0
      },
      recentActivities: activitiesResult.rows,
      memberSpecific: memberSpecificData,
      userInfo: {
        role: userRole,
        organization: userOrg,
        username: req.user.username
      },
      dataSource: 'postgresql', // Hybrid system using PostgreSQL as primary
      timestamp: new Date().toISOString()
    };
    
    console.log(`[Network Dashboard] Successfully fetched dashboard for ${req.user.username}`);
    res.json(dashboardData);
    
  } catch (error) {
    console.error('[Network Dashboard] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch network dashboard data',
      details: error.message
    });
  } finally {
    client.release();
  }
});

/**
 * Get all Network exports (with filters)
 * IMPORTANT: This route MUST be BEFORE /:requestId to avoid route collision
 */
router.get('/exports', authenticateToken, async (req, res) => {
  try {
    console.log('[Network Exports] Fetching exports with query:', req.query);
    const { status } = req.query;
    
    let query = `
      SELECT 
        e.*,
        ep.business_name as exporter_name,
        ep.tin as exporter_tin
      FROM exports e
      LEFT JOIN exporter_profiles ep ON e.exporter_id = ep.exporter_id
      WHERE 1=1
    `;
    const params = [];
    
    if (status) {
      query += ' AND e.status = $1';
      params.push(status);
    }
    
    query += ' ORDER BY e.created_at DESC';
    
    console.log('[Network Exports] Query:', query);
    console.log('[Network Exports] Params:', params);
    
    const result = await pool.query(query, params);
    
    console.log('[Network Exports] Found', result.rows.length, 'exports from PostgreSQL');
    
    // Return PostgreSQL data directly (blockchain integration disabled for this endpoint)
    res.json({
      success: true,
      data: result.rows,
      source: 'postgres'
    });
  } catch (error) {
    console.error('[Network Exports] Error:', error);
    // Return empty array instead of 500 error for better UX
    res.json({ 
      success: true, 
      data: [],
      error: error.message 
    });
  }
});

/**
 * Get specific Network submission by ID
 */
router.get('/:requestId', authenticateToken, async (req, res) => {
  try {
    const result = await evaluateTransaction(
      req.user.id,
      process.env.CHAINCODE_NAME || 'ecta',
      'GetNetworkRequest',
      req.params.requestId
    );

    const NetworkRequest = JSON.parse(result);
    
    // Verify ownership
    if (NetworkRequest.exporterId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(NetworkRequest);
  } catch (error) {
    console.error('Network fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get Network approval status
 */
router.get('/:requestId/status', authenticateToken, async (req, res) => {
  try {
    const result = await evaluateTransaction(
      req.user.id,
      process.env.CHAINCODE_NAME || 'ecta',
      'GetNetworkApprovalStatus',
      req.params.requestId
    );

    res.json(JSON.parse(result));
  } catch (error) {
    console.error('Status fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Approve Network request (for authorized agencies)
 */
router.post('/:requestId/approve', authenticateToken, async (req, res) => {
  try {
    const { agency, comments } = req.body;

    if (!agency) {
      return res.status(400).json({ error: 'Agency name required' });
    }

    const approvalData = {
      requestId: req.params.requestId,
      agency,
      approver: req.user.id,
      comments: comments || '',
      approvedAt: new Date().toISOString()
    };

    const result = await submitTransaction(
      req.user.id,
      process.env.CHAINCODE_NAME || 'ecta',
      'ApproveNetworkRequest',
      JSON.stringify(approvalData)
    );

    res.json({
      success: true,
      message: 'Network request approved',
      txResult: result
    });
  } catch (error) {
    console.error('Approval error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get Network statistics
 * MOVED TO BOTTOM OF FILE - See database-backed version below
 */

/**
 * Get Network submissions with filters (OLD BLOCKCHAIN VERSION - DISABLED)
 * This route is commented out because we now use the database-backed version below
 * MOVED TO BOTTOM OF FILE - See database-backed version below
 */

/**
 * POST /api/network/authenticate-document
 * Authenticate a document issued by the network member
 */
router.post('/authenticate-document', authenticateToken, async (req, res) => {
  const blockchainDocumentService = require('../services/blockchain-document.service');
  
  const client = await pool.connect();
  
  try {
    const userId = req.user.id || req.user.username;
    const userRole = req.user.role;
    const { submissionId, documentId } = req.body;

    if (!submissionId || !documentId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: submissionId and documentId are required'
      });
    }

    // Determine network member code from user role
    const networkMemberMap = {
      'ecta': 'ECTA',
      'moh': 'MOH',
      'moa': 'MOA',
      'bank': 'BANK',
      'shipping': 'SHIPPING',
      'erca': 'ERCA',
      'ecx': 'ECX'
    };

    const authenticatorMemberCode = networkMemberMap[userRole?.toLowerCase()];

    if (!authenticatorMemberCode) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: Only network members can authenticate documents'
      });
    }

    // Get document details
    const docQuery = `
      SELECT * FROM issued_documents 
      WHERE document_id = $1 AND issuer_member_code = $2 AND status = 'ACTIVE'
    `;
    const docResult = await client.query(docQuery, [documentId, authenticatorMemberCode]);

    if (docResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Document not found or you are not authorized to authenticate this document (only issuer can authenticate)'
      });
    }

    const document = docResult.rows[0];

    // Check if document is expired
    if (document.expiry_date && new Date(document.expiry_date) < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Document has expired and cannot be authenticated'
      });
    }

    // Verify document authenticity against blockchain
    const verification = await blockchainDocumentService.verifyDocumentAuthenticity(
      documentId,
      document.document_hash
    );

    const authenticationStatus = verification.isValid && verification.hashMatch ? 'VERIFIED' : 'FAILED';

    // Record authentication in database
    const authQuery = `
      INSERT INTO document_authentications (
        submission_id,
        document_id,
        authenticator_member_code,
        authentication_status,
        verification_method,
        verification_result,
        authenticated_at,
        authenticated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, $7)
      RETURNING *
    `;

    const authResult = await client.query(authQuery, [
      submissionId,
      documentId,
      authenticatorMemberCode,
      authenticationStatus,
      'BLOCKCHAIN',
      JSON.stringify(verification),
      userId
    ]);

    // Record authentication on blockchain asynchronously
    setImmediate(async () => {
      try {
        await blockchainDocumentService.recordDocumentAuthentication({
          authenticationId: authResult.rows[0].authentication_id,
          submissionId,
          documentId,
          authenticatorMemberCode,
          authenticationStatus,
          authenticatedAt: authResult.rows[0].authenticated_at
        });
      } catch (blockchainError) {
        console.error('[Document Authentication] Blockchain error:', blockchainError);
      }
    });

    res.json({
      success: true,
      data: {
        authenticationId: authResult.rows[0].authentication_id,
        status: authenticationStatus,
        verificationMethod: 'BLOCKCHAIN',
        authenticatedAt: authResult.rows[0].authenticated_at,
        verification: {
          isValid: verification.isValid,
          hashMatch: verification.hashMatch
        }
      }
    });
  } catch (error) {
    console.error('[Document Authentication] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to authenticate document',
      details: error.message
    });
  } finally {
    client.release();
  }
});

// ============================================================================
// DATABASE-BACKED ENDPOINTS FOR NETWORK APPROVAL DASHBOARD
// ============================================================================
// NOTE: /submissions route moved above /:requestId to avoid route collision

/**
 * Get pending approvals for a specific network member/agency
 */
router.get('/agencies/:memberCode/pending', authenticateToken, async (req, res) => {
  try {
    const { memberCode } = req.params;
    
    // Map member codes to actual database column names
    const statusColumnMap = {
      'ECTA': 'ecta_status',
      'CBE': 'bank_status',
      'BANK': 'bank_status',
      'NBE': 'nbe_status',
      'CUSTOMS': 'customs_status',
      'ERCA': 'customs_status',
      'SHIPPING': 'shipping_status'
    };
    
    const statusColumn = statusColumnMap[memberCode.toUpperCase()] || `${memberCode.toLowerCase()}_status`;
    
    // Query submissions where this member's status is PENDING
    const query = `
      SELECT 
        ns.*,
        ep.business_name as exporter_name
      FROM network_submissions ns
      LEFT JOIN exporter_profiles ep ON ns.exporter_id = ep.exporter_id
      WHERE ${statusColumn} = 'PENDING'
      ORDER BY submitted_at ASC
    `;
    
    const result = await pool.query(query);
    
    // Map database fields to frontend-expected field names
    const mappedData = result.rows.map(row => ({
      submissionId: row.submission_id,
      exportId: row.network_reference_number,
      networkReferenceNumber: row.esw_reference_number,
      exporterId: row.exporter_id,
      exporterName: row.exporter_name || row.business_name || 'Unknown',
      submittedAt: row.submitted_at,
      status: row.status,
      ectaStatus: row.ecta_status,
      bankStatus: row.bank_status,
      nbeStatus: row.nbe_status,
      customsStatus: row.customs_status,
      shippingStatus: row.shipping_status,
      exporterInfo: row.exporter_info,
      supportingDocuments: row.supporting_documents,
      documentsCollected: row.documents_collected,
      requiredDocumentsCount: row.required_documents_count,
      issuedDocumentsCount: row.issued_documents_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    
    res.json({
      success: true,
      data: mappedData
    });
  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get statistics for a specific network member/agency
 */
router.get('/agencies/:memberCode/stats', authenticateToken, async (req, res) => {
  try {
    const { memberCode } = req.params;
    
    // Map member codes to actual database column names
    const statusColumnMap = {
      'ECTA': 'ecta_status',
      'CBE': 'bank_status',
      'BANK': 'bank_status',
      'NBE': 'nbe_status',
      'CUSTOMS': 'customs_status',
      'ERCA': 'customs_status',
      'SHIPPING': 'shipping_status'
    };
    
    const statusColumn = statusColumnMap[memberCode.toUpperCase()] || `${memberCode.toLowerCase()}_status`;
    
    const query = `
      SELECT 
        COUNT(*) FILTER (WHERE ${statusColumn} = 'PENDING') as pending,
        COUNT(*) FILTER (WHERE ${statusColumn} = 'APPROVED') as approved,
        COUNT(*) FILTER (WHERE ${statusColumn} = 'REJECTED') as rejected,
        COUNT(*) as "totalApprovals"
      FROM Network_submissions
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get agency stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Process network member approval
 */
router.post('/submissions/:submissionId/agencies/:memberCode/approve', authenticateToken, async (req, res) => {
  try {
    const { submissionId, memberCode } = req.params;
    const { status, notes, rejectionReason, salesContractReference, contractVerified } = req.body;
    
    // Validate sales contract for APPROVAL status (required for all network members)
    if (status === 'APPROVED') {
      if (!salesContractReference) {
        return res.status(400).json({
          success: false,
          error: 'Sales contract reference is required for approval'
        });
      }
      
      if (!contractVerified) {
        return res.status(400).json({
          success: false,
          error: 'Sales contract must be verified before approval'
        });
      }
      
      // Verify the sales contract exists and is valid
      const contractQuery = `
        SELECT reference_number, status, exporter_id
        FROM sales_contracts
        WHERE reference_number = $1 AND status IN ('FINALIZED', 'ACTIVE')
      `;
      const contractResult = await pool.query(contractQuery, [salesContractReference]);
      
      if (contractResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or inactive sales contract reference'
        });
      }
    }
    
    const memberLower = memberCode.toLowerCase();
    const statusColumn = `${memberLower}_status`;
    const approvedAtColumn = `${memberLower}_approved_at`;
    const approvedByColumn = `${memberLower}_approved_by`;
    const notesColumn = `${memberLower}_notes`;
    
    // Update the specific member's approval status
    const query = `
      UPDATE network_submissions 
      SET 
        ${statusColumn} = $1,
        ${approvedAtColumn} = CURRENT_TIMESTAMP,
        ${approvedByColumn} = $2,
        ${notesColumn} = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE submission_id = $4
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      status,
      req.user.id,
      notes || rejectionReason || '',
      submissionId
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Submission not found' });
    }
    
    // Check if all members have approved to update overall status
    const submission = result.rows[0];
    const allApproved = 
      submission.ecta_status === 'APPROVED' &&
      submission.bank_status === 'APPROVED' &&
      submission.nbe_status === 'APPROVED' &&
      submission.customs_status === 'APPROVED' &&
      submission.shipping_status === 'APPROVED';
    
    if (allApproved) {
      await pool.query(
        `UPDATE network_submissions 
         SET status = 'EXPORT_APPROVED', completed_at = CURRENT_TIMESTAMP 
         WHERE submission_id = $1`,
        [submissionId]
      );
    }
    
    console.log(`[Network Approval] ${memberCode} ${status} submission ${submissionId} by ${req.user.id}`);
    if (status === 'APPROVED') {
      console.log(`[Network Approval] Sales contract verified: ${salesContractReference}`);
    }
    
    res.json({
      success: true,
      message: `Submission ${status.toLowerCase()} successfully`,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Process approval error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get user's assigned network members
 */
router.get('/user/network-members', authenticateToken, async (req, res) => {
  try {
    // Map user roles to network member codes
    const networkMembers = [];
    
    const roleMapping = {
      'ECTA': { code: 'ECTA', name: 'Ethiopian Coffee & Tea Authority', isActive: true },
      'BANK': { code: 'BANK', name: 'Commercial Bank', isActive: true },
      'NBE': { code: 'NBE', name: 'National Bank of Ethiopia', isActive: true },
      'CUSTOMS': { code: 'CUSTOMS', name: 'Customs Authority', isActive: true },
      'SHIPPING': { code: 'SHIPPING', name: 'Shipping Line', isActive: true }
    };
    
    // Check user's role or assigned agencies
    const userRole = req.user.role?.toUpperCase();
    
    if (roleMapping[userRole]) {
      networkMembers.push(roleMapping[userRole]);
    } else if (req.user.agencies) {
      // If user has multiple agency assignments
      req.user.agencies.forEach(agency => {
        const agencyUpper = agency.toUpperCase();
        if (roleMapping[agencyUpper]) {
          networkMembers.push(roleMapping[agencyUpper]);
        }
      });
    }
    
    res.json({
      success: true,
      data: networkMembers
    });
  } catch (error) {
    console.error('Get user network members error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});


module.exports = router;



/**
 * Get contract notifications for a network member
 */
router.get('/notifications/contracts', authenticateToken, async (req, res) => {
  try {
    const userOrg = (req.user.organization || req.user.companyName || '').toUpperCase();
    const userRole = (req.user.role || '').toLowerCase();
    
    // Map user to member code
    const memberCodeMap = {
      'ECTA': 'ECTA',
      'BANK': 'BANK',
      'COMMERCIAL-BANK': 'BANK',
      'COMMERCIALBANK': 'BANK',
      'NBE': 'NBE',
      'NATIONAL-BANK': 'NBE',
      'NATIONALBANK': 'NBE',
      'ECX': 'ECX',
      'ERCA': 'ERCA',
      'CUSTOM-AUTHORITIES': 'ERCA',
      'CUSTOMS': 'ERCA',
      'SHIPPING': 'SHIPPING',
      'SHIPPING-LINE': 'SHIPPING',
      'MOA': 'MOA',
      'MOH': 'MOH',
      // Role-based mapping
      'ecta': 'ECTA',
      'bank': 'BANK',
      'nbe': 'NBE',
      'ecx': 'ECX',
      'erca': 'ERCA',
      'shipping': 'SHIPPING',
      'moa': 'MOA',
      'moh': 'MOH'
    };
    
    const memberCode = memberCodeMap[userOrg] || memberCodeMap[userRole];
    
    if (!memberCode) {
      console.log('[Contract Notifications] No member code found for:', { userOrg, userRole, user: req.user });
      return res.status(403).json({ success: false, error: 'User not associated with any network member' });
    }
    
    const { status, limit = 50 } = req.query;
    
    let query = `
      SELECT 
        cn.notification_id,
        cn.contract_id,
        cn.ecta_reference_number,
        cn.notification_type,
        cn.notification_status,
        cn.notification_message,
        cn.sent_at,
        cn.read_at,
        cn.acknowledged_at,
        cn.metadata,
        ep.business_name as exporter_name,
        cd.coffee_type,
        cd.quantity,
        cd.total_value,
        cd.currency,
        cd.registered_at
      FROM contract_notifications cn
      LEFT JOIN exporter_profiles ep ON cn.exporter_id = ep.exporter_id
      LEFT JOIN contract_drafts cd ON cn.contract_id = cd.draft_id
      WHERE cn.recipient_member_code = $1
    `;
    
    const params = [memberCode];
    
    if (status) {
      query += ` AND cn.notification_status = $2`;
      params.push(status);
    }
    
    query += ` ORDER BY cn.sent_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      memberCode: memberCode
    });
  } catch (error) {
    console.error('[Contract Notifications] Fetch error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Mark notification as read
 */
router.patch('/notifications/:notificationId/read', authenticateToken, async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const result = await pool.query(`
      UPDATE contract_notifications
      SET notification_status = 'READ', read_at = NOW()
      WHERE notification_id = $1
      RETURNING *
    `, [notificationId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }
    
    res.json({
      success: true,
      notification: result.rows[0]
    });
  } catch (error) {
    console.error('[Contract Notifications] Mark read error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Verify contract by network member
 */
router.post('/contracts/:referenceNumber/verify', authenticateToken, async (req, res) => {
  try {
    const { referenceNumber } = req.params;
    const { verificationNotes } = req.body;
    
    const userOrg = (req.user.organization || '').toLowerCase();
    const userRole = (req.user.role || '').toLowerCase();
    
    // Map user to member code
    const memberCodeMap = {
      'ecta': 'ECTA',
      'commercial-bank': 'BANK',
      'commercialbank': 'BANK',
      'national-bank': 'NBE',
      'nationalbank': 'NBE',
      'ecx': 'ECX',
      'custom-authorities': 'ERCA',
      'customs': 'ERCA',
      'shipping': 'SHIPPING',
      'shipping-line': 'SHIPPING',
      'moa': 'MOA',
      'moh': 'MOH'
    };
    
    const memberCode = memberCodeMap[userOrg] || memberCodeMap[userRole];
    
    if (!memberCode) {
      return res.status(403).json({ success: false, error: 'User not associated with any network member' });
    }
    
    // Get contract details
    const contractResult = await pool.query(`
      SELECT draft_id, exporter_id, status
      FROM contract_drafts
      WHERE ecta_reference_number = $1
    `, [referenceNumber]);
    
    if (contractResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Contract not found' });
    }
    
    const contract = contractResult.rows[0];
    
    // Update permission status
    const result = await pool.query(`
      UPDATE contract_permissions
      SET 
        permission_status = 'VERIFIED',
        verified_at = NOW(),
        verified_by = $1,
        approval_notes = $2,
        updated_at = NOW()
      WHERE ecta_reference_number = $3 AND member_code = $4
      RETURNING *
    `, [req.user.id, verificationNotes, referenceNumber, memberCode]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Permission record not found' });
    }
    
    // Mark notification as acknowledged
    await pool.query(`
      UPDATE contract_notifications
      SET notification_status = 'ACKNOWLEDGED', acknowledged_at = NOW()
      WHERE ecta_reference_number = $1 AND recipient_member_code = $2
    `, [referenceNumber, memberCode]);
    
    console.log(`[Contract Verification] ${memberCode} verified contract ${referenceNumber}`);
    
    res.json({
      success: true,
      message: `Contract ${referenceNumber} verified successfully`,
      permission: result.rows[0]
    });
  } catch (error) {
    console.error('[Contract Verification] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get contract permissions/verification status
 */
router.get('/contracts/:referenceNumber/permissions', authenticateToken, async (req, res) => {
  try {
    const { referenceNumber } = req.params;
    
    const result = await pool.query(`
      SELECT 
        cp.permission_id,
        cp.member_code,
        nm.member_name,
        cp.permission_status,
        cp.verified_at,
        cp.approval_notes,
        u.username as verified_by_username
      FROM contract_permissions cp
      LEFT JOIN network_members nm ON cp.member_code = nm.member_code
      LEFT JOIN users u ON cp.verified_by = u.user_id
      WHERE cp.ecta_reference_number = $1
      ORDER BY nm.member_name
    `, [referenceNumber]);
    
    res.json({
      success: true,
      data: result.rows,
      referenceNumber: referenceNumber
    });
  } catch (error) {
    console.error('[Contract Permissions] Fetch error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Check if exporter has permission from specific network member
 */
router.get('/contracts/:referenceNumber/check-permission/:memberCode', async (req, res) => {
  try {
    const { referenceNumber, memberCode } = req.params;
    
    const result = await pool.query(`
      SELECT 
        cp.permission_status,
        cp.verified_at,
        cp.approval_notes,
        cd.exporter_id,
        ep.business_name as exporter_name
      FROM contract_permissions cp
      LEFT JOIN contract_drafts cd ON cp.contract_id = cd.draft_id
      LEFT JOIN exporter_profiles ep ON cp.exporter_id = ep.exporter_id
      WHERE cp.ecta_reference_number = $1 AND cp.member_code = $2
    `, [referenceNumber, memberCode]);
    
    if (result.rows.length === 0) {
      return res.json({
        success: true,
        hasPermission: false,
        status: 'NOT_FOUND',
        message: 'No permission record found for this contract and member'
      });
    }
    
    const permission = result.rows[0];
    const hasPermission = permission.permission_status === 'VERIFIED' || permission.permission_status === 'APPROVED';
    
    res.json({
      success: true,
      hasPermission: hasPermission,
      status: permission.permission_status,
      verifiedAt: permission.verified_at,
      exporterName: permission.exporter_name,
      notes: permission.approval_notes
    });
  } catch (error) {
    console.error('[Contract Permission Check] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get all exports (for network members like banks)
 * GET /api/network/exports
 * 
 * This endpoint allows network members (banks, ECTA, NBE, etc.) to view all exports
 * with optional status filtering. This is different from the exporter-portal endpoint
 * which only returns exports for the logged-in exporter.
 */
router.get('/exports', authenticateToken, async (req, res) => {
  try {
    console.log('[Network Exports] Fetching exports with query:', req.query);
    const { status } = req.query;
    
    // Try PostgreSQL first (primary data source in hybrid mode)
    let query = `
      SELECT 
        e.*,
        ep.business_name as exporter_name,
        ep.tin as exporter_tin
      FROM exports e
      LEFT JOIN exporter_profiles ep ON e.exporter_id = ep.exporter_id
      WHERE 1=1
    `;
    const params = [];
    
    if (status) {
      query += ' AND e.status = $1';
      params.push(status);
    }
    
    query += ' ORDER BY e.created_at DESC';
    
    console.log('[Network Exports] Query:', query);
    console.log('[Network Exports] Params:', params);
    
    const result = await pool.query(query, params);
    
    console.log('[Network Exports] Found', result.rows.length, 'exports from PostgreSQL');
    
    // Return PostgreSQL data directly (blockchain integration disabled for this endpoint)
    res.json({
      success: true,
      data: result.rows,
      source: 'postgres'
    });
  } catch (error) {
    console.error('[Network Exports] Error:', error);
    // Return empty array instead of 500 error for better UX
    res.json({ 
      success: true, 
      data: [],
      error: error.message 
    });
  }
});

module.exports = router;

