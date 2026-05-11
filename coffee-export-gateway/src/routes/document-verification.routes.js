const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
  host: process.env.POSTGRES_HOST || process.env.DB_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'coffee_export_db',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
});

/**
 * POST /api/document-verification/submit-batch
 * Exporter submits collected documents for network verification
 */
router.post('/submit-batch', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { contractReference, documentIds } = req.body;
    const userId = req.user.id || req.user.username;

    console.log('[Document Verification] Submit batch:', { contractReference, documentIds, userId });

    // Validate input
    if (!contractReference || !documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Contract reference and document IDs are required'
      });
    }

    // Get exporter profile
    const exporterQuery = 'SELECT exporter_id, business_name FROM exporter_profiles WHERE user_id = $1';
    const exporterResult = await client.query(exporterQuery, [userId]);

    if (exporterResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Exporter profile not found'
      });
    }

    const exporterUuid = exporterResult.rows[0].exporter_id;

    // Verify all documents belong to this exporter and are ACTIVE
    const docCheckQuery = `
      SELECT document_id, document_type, issuer_member_code, status
      FROM issued_documents
      WHERE document_id = ANY($1) AND exporter_id = $2
    `;
    const docCheckResult = await client.query(docCheckQuery, [documentIds, exporterUuid]);

    if (docCheckResult.rows.length !== documentIds.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Some documents not found or do not belong to this exporter'
      });
    }

    // Check if any documents are not ACTIVE
    const inactiveDoc = docCheckResult.rows.find(doc => doc.status !== 'ACTIVE');
    if (inactiveDoc) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: `Document ${inactiveDoc.document_id} is not active (status: ${inactiveDoc.status})`
      });
    }

    // Generate submission reference
    const refQuery = `
      SELECT COUNT(*) as count 
      FROM document_submission_batches 
      WHERE submission_reference LIKE 'DSB-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-%'
    `;
    const refResult = await client.query(refQuery);
    const count = parseInt(refResult.rows[0].count) + 1;
    const submissionReference = `DSB-${new Date().getFullYear()}-${String(count).padStart(5, '0')}`;

    // Create document submission batch
    const batchQuery = `
      INSERT INTO document_submission_batches (
        exporter_id,
        contract_reference,
        submission_reference,
        submission_status,
        total_documents,
        submitted_at
      ) VALUES ($1, $2, $3, 'SUBMITTED', $4, CURRENT_TIMESTAMP)
      RETURNING batch_id, submission_reference
    `;
    const batchResult = await client.query(batchQuery, [
      exporterUuid,
      contractReference,
      submissionReference,
      documentIds.length
    ]);

    const batchId = batchResult.rows[0].batch_id;

    // Get all network members that need to verify
    const networkMembersQuery = `
      SELECT DISTINCT member_code 
      FROM network_members 
      WHERE member_type IN ('REGULATORY', 'FINANCIAL', 'LOGISTICS', 'QUALITY')
        AND status = 'ACTIVE'
    `;
    const networkMembersResult = await client.query(networkMembersQuery);
    const networkMembers = networkMembersResult.rows.map(row => row.member_code);

    // Create verification records for each document and each network member
    const verificationInserts = [];
    for (const documentId of documentIds) {
      for (const memberCode of networkMembers) {
        verificationInserts.push(
          client.query(`
            INSERT INTO document_verifications (
              batch_id,
              document_id,
              verifier_member_code,
              verification_status
            ) VALUES ($1, $2, $3, 'PENDING')
          `, [batchId, documentId, memberCode])
        );
      }
    }

    await Promise.all(verificationInserts);

    await client.query('COMMIT');

    res.json({
      success: true,
      data: {
        batchId,
        submissionReference,
        totalDocuments: documentIds.length,
        totalVerifications: documentIds.length * networkMembers.length,
        networkMembers
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Document Verification] Submit batch error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    client.release();
  }
});

/**
 * GET /api/document-verification/exporter/batches
 * Get all document submission batches for the current exporter
 */
router.get('/exporter/batches', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user.username;

    // Get exporter profile
    const exporterQuery = 'SELECT exporter_id FROM exporter_profiles WHERE user_id = $1';
    const exporterResult = await pool.query(exporterQuery, [userId]);

    if (exporterResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Exporter profile not found'
      });
    }

    const exporterUuid = exporterResult.rows[0].exporter_id;

    // Get all batches with verification progress
    const query = `
      SELECT 
        dsb.batch_id,
        dsb.submission_reference,
        dsb.contract_reference,
        dsb.submission_status,
        dsb.total_documents,
        dsb.verified_documents,
        dsb.rejected_documents,
        dsb.submitted_at,
        dsb.verification_completed_at,
        dsb.payment_initiated_at,
        COUNT(DISTINCT dv.verification_id) as total_verifications,
        COUNT(DISTINCT CASE WHEN dv.verification_status = 'PENDING' THEN dv.verification_id END) as pending_verifications,
        COUNT(DISTINCT CASE WHEN dv.verification_status = 'VERIFIED' THEN dv.verification_id END) as verified_verifications,
        COUNT(DISTINCT CASE WHEN dv.verification_status = 'REJECTED' THEN dv.verification_id END) as rejected_verifications
      FROM document_submission_batches dsb
      LEFT JOIN document_verifications dv ON dsb.batch_id = dv.batch_id
      WHERE dsb.exporter_id = $1
      GROUP BY dsb.batch_id
      ORDER BY dsb.submitted_at DESC
    `;

    const result = await pool.query(query, [exporterUuid]);

    res.json({
      success: true,
      count: result.rows.length,
      batches: result.rows.map(row => ({
        batchId: row.batch_id,
        submissionReference: row.submission_reference,
        contractReference: row.contract_reference,
        submissionStatus: row.submission_status,
        totalDocuments: row.total_documents,
        verifiedDocuments: row.verified_documents,
        rejectedDocuments: row.rejected_documents,
        submittedAt: row.submitted_at,
        verificationCompletedAt: row.verification_completed_at,
        paymentInitiatedAt: row.payment_initiated_at,
        verificationProgress: {
          total: parseInt(row.total_verifications),
          pending: parseInt(row.pending_verifications),
          verified: parseInt(row.verified_verifications),
          rejected: parseInt(row.rejected_verifications)
        }
      }))
    });

  } catch (error) {
    console.error('[Document Verification] Get exporter batches error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/document-verification/network-member/pending
 * Get pending document verifications for the current network member
 */
router.get('/network-member/pending', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user.username;

    // Get network member assignments
    const memberQuery = `
      SELECT nm.member_code, nm.member_name
      FROM user_network_members unm
      JOIN network_members nm ON unm.network_member_id = nm.member_id
      WHERE unm.user_id = $1
    `;
    const memberResult = await pool.query(memberQuery, [userId]);

    if (memberResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'User is not assigned to any network member'
      });
    }

    const memberCodes = memberResult.rows.map(row => row.member_code);

    // Get pending verifications
    const query = `
      SELECT 
        dv.verification_id,
        dv.batch_id,
        dv.document_id,
        dv.verifier_member_code,
        dv.verification_status,
        dsb.submission_reference,
        dsb.contract_reference,
        dsb.submitted_at,
        id.document_type,
        id.document_number,
        id.issuer_member_code,
        id.document_hash,
        id.issuer_signature,
        id.blockchain_tx_id,
        id.issued_at,
        ep.business_name as exporter_name,
        ep.tin as exporter_tin
      FROM document_verifications dv
      JOIN document_submission_batches dsb ON dv.batch_id = dsb.batch_id
      JOIN issued_documents id ON dv.document_id = id.document_id
      JOIN exporter_profiles ep ON dsb.exporter_id = ep.exporter_id
      WHERE dv.verifier_member_code = ANY($1)
        AND dv.verification_status = 'PENDING'
      ORDER BY dsb.submitted_at ASC
    `;

    const result = await pool.query(query, [memberCodes]);

    res.json({
      success: true,
      count: result.rows.length,
      verifications: result.rows.map(row => ({
        verificationId: row.verification_id,
        batchId: row.batch_id,
        documentId: row.document_id,
        verifierMemberCode: row.verifier_member_code,
        verificationStatus: row.verification_status,
        submissionReference: row.submission_reference,
        contractReference: row.contract_reference,
        submittedAt: row.submitted_at,
        document: {
          documentType: row.document_type,
          documentNumber: row.document_number,
          issuerMemberCode: row.issuer_member_code,
          documentHash: row.document_hash,
          issuerSignature: row.issuer_signature,
          blockchainTxId: row.blockchain_tx_id,
          issuedAt: row.issued_at
        },
        exporter: {
          name: row.exporter_name,
          tin: row.exporter_tin
        }
      }))
    });

  } catch (error) {
    console.error('[Document Verification] Get pending verifications error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/document-verification/network-member/verify
 * Network member verifies a document
 */
router.post('/network-member/verify', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { verificationId, verificationStatus, verificationMethod, verificationNotes, rejectionReason } = req.body;
    const userId = req.user.id || req.user.username;

    console.log('[Document Verification] Verify document:', { verificationId, verificationStatus, userId });

    // Validate input
    if (!verificationId || !verificationStatus) {
      return res.status(400).json({
        success: false,
        error: 'Verification ID and status are required'
      });
    }

    if (!['VERIFIED', 'REJECTED'].includes(verificationStatus)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid verification status. Must be VERIFIED or REJECTED'
      });
    }

    // Get network member assignment
    const memberQuery = `
      SELECT nm.member_code
      FROM user_network_members unm
      JOIN network_members nm ON unm.network_member_id = nm.member_id
      WHERE unm.user_id = $1
    `;
    const memberResult = await client.query(memberQuery, [userId]);

    if (memberResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        error: 'User is not assigned to any network member'
      });
    }

    const memberCode = memberResult.rows[0].member_code;

    // Update verification record
    const updateQuery = `
      UPDATE document_verifications
      SET 
        verification_status = $1,
        verification_method = $2,
        verification_notes = $3,
        verified_at = CURRENT_TIMESTAMP,
        verified_by = $4,
        rejection_reason = $5
      WHERE verification_id = $6
        AND verifier_member_code = $7
        AND verification_status = 'PENDING'
      RETURNING batch_id, document_id
    `;
    
    const updateResult = await client.query(updateQuery, [
      verificationStatus,
      verificationMethod || 'MSP_SIGNATURE',
      verificationNotes,
      userId,
      rejectionReason,
      verificationId,
      memberCode
    ]);

    if (updateResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Verification not found or already processed'
      });
    }

    const batchId = updateResult.rows[0].batch_id;

    // Update batch verification counts
    const countQuery = `
      SELECT 
        COUNT(*) FILTER (WHERE verification_status = 'VERIFIED') as verified_count,
        COUNT(*) FILTER (WHERE verification_status = 'REJECTED') as rejected_count,
        COUNT(*) FILTER (WHERE verification_status = 'PENDING') as pending_count
      FROM document_verifications
      WHERE batch_id = $1
    `;
    const countResult = await client.query(countQuery, [batchId]);
    const counts = countResult.rows[0];

    // Update batch status
    let batchStatus = 'UNDER_VERIFICATION';
    let verificationCompletedAt = null;

    if (parseInt(counts.pending_count) === 0) {
      if (parseInt(counts.rejected_count) > 0) {
        batchStatus = 'REJECTED';
      } else {
        batchStatus = 'VERIFIED';
      }
      verificationCompletedAt = new Date();
    }

    await client.query(`
      UPDATE document_submission_batches
      SET 
        submission_status = $1,
        verified_documents = $2,
        rejected_documents = $3,
        verification_completed_at = $4
      WHERE batch_id = $5
    `, [batchStatus, counts.verified_count, counts.rejected_count, verificationCompletedAt, batchId]);

    await client.query('COMMIT');

    res.json({
      success: true,
      data: {
        verificationId,
        verificationStatus,
        batchId,
        batchStatus,
        verificationProgress: {
          verified: parseInt(counts.verified_count),
          rejected: parseInt(counts.rejected_count),
          pending: parseInt(counts.pending_count)
        }
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Document Verification] Verify document error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    client.release();
  }
});

/**
 * GET /api/document-verification/cbe/ready-for-payment
 * Get document batches ready for payment initiation (CBE only)
 */
router.get('/cbe/ready-for-payment', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user.username;

    // Verify user is assigned to CBE
    const memberQuery = `
      SELECT nm.member_code
      FROM user_network_members unm
      JOIN network_members nm ON unm.network_member_id = nm.member_id
      WHERE unm.user_id = $1 AND nm.member_code = 'CBE'
    `;
    const memberResult = await pool.query(memberQuery, [userId]);

    if (memberResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Only CBE users can access this endpoint'
      });
    }

    // Get batches ready for payment
    const query = `
      SELECT 
        dsb.batch_id,
        dsb.submission_reference,
        dsb.contract_reference,
        dsb.exporter_id,
        ep.business_name as exporter_name,
        ep.tin as exporter_tin,
        dsb.total_documents,
        dsb.submitted_at,
        dsb.verification_completed_at,
        cd.total_value as contract_value,
        cd.currency as contract_currency,
        cd.payment_method,
        cd.payment_terms,
        br.company_name as buyer_name,
        br.country as buyer_country,
        COUNT(DISTINCT dv.document_id) as verified_documents_count
      FROM document_submission_batches dsb
      JOIN exporter_profiles ep ON dsb.exporter_id = ep.exporter_id
      LEFT JOIN ecta_contract_submissions ecs ON dsb.contract_reference = ecs.ecta_reference_number
      LEFT JOIN contract_drafts cd ON ecs.draft_id = cd.draft_id
      LEFT JOIN buyer_registry br ON ecs.buyer_id = br.buyer_id
      LEFT JOIN document_verifications dv ON dsb.batch_id = dv.batch_id AND dv.verification_status = 'VERIFIED'
      WHERE dsb.submission_status = 'VERIFIED'
        AND dsb.payment_initiated_at IS NULL
      GROUP BY dsb.batch_id, dsb.submission_reference, dsb.contract_reference, dsb.exporter_id, 
               ep.business_name, ep.tin, dsb.total_documents, dsb.submitted_at, dsb.verification_completed_at,
               cd.total_value, cd.currency, cd.payment_method, cd.payment_terms, br.company_name, br.country
      ORDER BY dsb.verification_completed_at ASC
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      count: result.rows.length,
      batches: result.rows.map(row => ({
        batchId: row.batch_id,
        submissionReference: row.submission_reference,
        contractReference: row.contract_reference,
        exporterId: row.exporter_id,
        exporterName: row.exporter_name,
        exporterTin: row.exporter_tin,
        totalDocuments: row.total_documents,
        verifiedDocuments: parseInt(row.verified_documents_count),
        submittedAt: row.submitted_at,
        verificationCompletedAt: row.verification_completed_at,
        contract: {
          value: row.contract_value,
          currency: row.contract_currency,
          paymentMethod: row.payment_method,
          paymentTerms: row.payment_terms
        },
        buyer: {
          name: row.buyer_name,
          country: row.buyer_country
        }
      }))
    });

  } catch (error) {
    console.error('[Document Verification] Get ready for payment error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/document-verification/cbe/initiate-payment
 * CBE initiates payment by sending documents to importer bank
 */
router.post('/cbe/initiate-payment', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const {
      batchId,
      importerBankName,
      importerBankCountry,
      importerBankSwift,
      paymentAmount,
      paymentCurrency,
      paymentMethod,
      paymentTerms
    } = req.body;
    const userId = req.user.id || req.user.username;

    console.log('[Document Verification] Initiate payment:', { batchId, userId });

    // Validate input
    if (!batchId || !importerBankName || !paymentAmount) {
      return res.status(400).json({
        success: false,
        error: 'Batch ID, importer bank name, and payment amount are required'
      });
    }

    // Verify user is assigned to CBE
    const memberQuery = `
      SELECT nm.member_code
      FROM user_network_members unm
      JOIN network_members nm ON unm.network_member_id = nm.member_id
      WHERE unm.user_id = $1 AND nm.member_code = 'CBE'
    `;
    const memberResult = await client.query(memberQuery, [userId]);

    if (memberResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        error: 'Access denied. Only CBE users can initiate payments'
      });
    }

    // Get batch details
    const batchQuery = `
      SELECT 
        dsb.batch_id,
        dsb.exporter_id,
        dsb.contract_reference,
        dsb.submission_status,
        dsb.payment_initiated_at
      FROM document_submission_batches dsb
      WHERE dsb.batch_id = $1
    `;
    const batchResult = await client.query(batchQuery, [batchId]);

    if (batchResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Batch not found'
      });
    }

    const batch = batchResult.rows[0];

    if (batch.submission_status !== 'VERIFIED') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: `Batch is not verified (status: ${batch.submission_status})`
      });
    }

    if (batch.payment_initiated_at) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Payment already initiated for this batch'
      });
    }

    // Generate payment reference
    const refQuery = `
      SELECT COUNT(*) as count 
      FROM payment_initiations 
      WHERE payment_reference LIKE 'PAY-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-%'
    `;
    const refResult = await client.query(refQuery);
    const count = parseInt(refResult.rows[0].count) + 1;
    const paymentReference = `PAY-${new Date().getFullYear()}-${String(count).padStart(5, '0')}`;

    // Create payment initiation
    const paymentQuery = `
      INSERT INTO payment_initiations (
        batch_id,
        exporter_id,
        contract_reference,
        payment_reference,
        payment_amount,
        payment_currency,
        importer_bank_name,
        importer_bank_country,
        importer_bank_swift,
        payment_method,
        payment_terms,
        initiated_by,
        payment_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'INITIATED')
      RETURNING initiation_id, payment_reference
    `;
    const paymentResult = await client.query(paymentQuery, [
      batchId,
      batch.exporter_id,
      batch.contract_reference,
      paymentReference,
      paymentAmount,
      paymentCurrency || 'USD',
      importerBankName,
      importerBankCountry,
      importerBankSwift,
      paymentMethod,
      paymentTerms,
      userId
    ]);

    const initiationId = paymentResult.rows[0].initiation_id;

    // Link all verified documents to payment
    const docsQuery = `
      SELECT DISTINCT dv.document_id, id.document_type
      FROM document_verifications dv
      JOIN issued_documents id ON dv.document_id = id.document_id
      WHERE dv.batch_id = $1 AND dv.verification_status = 'VERIFIED'
    `;
    const docsResult = await client.query(docsQuery, [batchId]);

    const docInserts = docsResult.rows.map(doc =>
      client.query(`
        INSERT INTO payment_initiation_documents (
          initiation_id,
          document_id,
          document_category,
          required_for_payment
        ) VALUES ($1, $2, $3, TRUE)
      `, [initiationId, doc.document_id, doc.document_type])
    );

    await Promise.all(docInserts);

    // Update batch status
    await client.query(`
      UPDATE document_submission_batches
      SET 
        submission_status = 'PAYMENT_INITIATED',
        payment_initiated_at = CURRENT_TIMESTAMP,
        payment_initiated_by = $1
      WHERE batch_id = $2
    `, [userId, batchId]);

    await client.query('COMMIT');

    res.json({
      success: true,
      data: {
        initiationId,
        paymentReference,
        batchId,
        totalDocuments: docsResult.rows.length,
        paymentAmount,
        paymentCurrency: paymentCurrency || 'USD',
        importerBank: {
          name: importerBankName,
          country: importerBankCountry,
          swift: importerBankSwift
        }
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Document Verification] Initiate payment error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    client.release();
  }
});

module.exports = router;
