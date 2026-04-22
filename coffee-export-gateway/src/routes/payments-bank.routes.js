const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.POSTGRES_HOST || process.env.DB_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'coffee_export_db',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
});

/**
 * GET /api/payments/bank/pending-review
 * Get payments pending bank review
 */
router.get('/pending-review', authenticateToken, requireRole('bank', 'admin'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT 
        p.*,
        e.coffee_type,
        e.quantity,
        e.destination_country,
        br.company_name as buyer_name,
        br.country as buyer_country,
        ep.business_name as exporter_name,
        COUNT(pd.document_id) as documents_count,
        COUNT(pd.document_id) FILTER (WHERE pd.review_status = 'APPROVED') as approved_documents,
        COUNT(pd.document_id) FILTER (WHERE pd.review_status = 'PENDING') as pending_documents
      FROM payments p
      LEFT JOIN exports e ON p.export_id = e.export_id
      LEFT JOIN buyer_registry br ON p.buyer_id = br.buyer_id
      LEFT JOIN exporter_profiles ep ON p.exporter_id = ep.exporter_id
      LEFT JOIN payment_documents pd ON p.payment_id = pd.payment_id
      WHERE p.status IN ('DOCUMENTS_SUBMITTED', 'UNDER_REVIEW')
      GROUP BY p.payment_id, e.coffee_type, e.quantity, e.destination_country, 
               br.company_name, br.country, ep.business_name
      ORDER BY p.documents_submitted_at ASC
    `;

    const result = await client.query(query);

    res.json({
      success: true,
      payments: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('Pending payments fetch error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    client.release();
  }
});

/**
 * POST /api/payments/bank/:paymentId/lc/open
 * Open Letter of Credit
 */
router.post('/:paymentId/lc/open', authenticateToken, requireRole('bank', 'admin'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { paymentId } = req.params;
    const {
      lcNumber,
      issuingBank,
      advisingBank,
      openingDate,
      expiryDate,
      lcAmount
    } = req.body;

    // Validate required fields
    if (!lcNumber || !issuingBank || !expiryDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: lcNumber, issuingBank, expiryDate'
      });
    }

    // Update payment with LC details
    const updateQuery = `
      UPDATE payments
      SET 
        status = 'LC_OPENED',
        lc_number = $1,
        lc_issuing_bank = $2,
        lc_advising_bank = $3,
        lc_opening_date = $4,
        lc_expiry_date = $5,
        lc_amount = $6,
        processing_bank = $7,
        updated_by = $8
      WHERE payment_id = $9 AND payment_method = 'LC'
      RETURNING *
    `;

    const result = await client.query(updateQuery, [
      lcNumber,
      issuingBank,
      advisingBank || null,
      openingDate || new Date(),
      expiryDate,
      lcAmount || null,
      issuingBank,
      req.user.id,
      paymentId
    ]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Payment not found or not an LC payment'
      });
    }

    // Log audit trail
    await client.query(
      `INSERT INTO payment_audit_log (payment_id, action, old_status, new_status, performed_by, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        paymentId,
        'LC_OPENED',
        result.rows[0].status,
        'LC_OPENED',
        req.user.id,
        JSON.stringify({ lcNumber, issuingBank, expiryDate })
      ]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Letter of Credit opened successfully',
      payment: result.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('LC opening error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    client.release();
  }
});

/**
 * POST /api/payments/bank/:paymentId/documents/review
 * Review submitted documents
 */
router.post('/:paymentId/documents/review', authenticateToken, requireRole('bank', 'admin'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { paymentId } = req.params;
    const { documentId, reviewStatus, reviewNotes } = req.body;

    if (!documentId || !reviewStatus) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: documentId, reviewStatus'
      });
    }

    // Update document review status
    const updateQuery = `
      UPDATE payment_documents
      SET 
        review_status = $1,
        review_notes = $2,
        reviewed_by = $3,
        reviewed_at = CURRENT_TIMESTAMP
      WHERE document_id = $4 AND payment_id = $5
      RETURNING *
    `;

    const result = await client.query(updateQuery, [
      reviewStatus,
      reviewNotes || null,
      req.user.id,
      documentId,
      paymentId
    ]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Check if all documents are reviewed
    const checkQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE review_status = 'APPROVED') as approved,
        COUNT(*) FILTER (WHERE review_status = 'REJECTED') as rejected
      FROM payment_documents
      WHERE payment_id = $1
    `;

    const checkResult = await client.query(checkQuery, [paymentId]);
    const { total, approved, rejected } = checkResult.rows[0];

    // Update payment status if all documents reviewed
    if (parseInt(approved) + parseInt(rejected) === parseInt(total)) {
      if (parseInt(rejected) > 0) {
        await client.query(
          `UPDATE payments 
           SET status = 'DOCUMENTS_SUBMITTED', 
               documents_rejected_at = CURRENT_TIMESTAMP,
               rejection_reason = $1,
               updated_by = $2
           WHERE payment_id = $3`,
          ['Some documents rejected', req.user.id, paymentId]
        );
      } else {
        await client.query(
          `UPDATE payments 
           SET status = 'UNDER_REVIEW', 
               documents_approved_at = CURRENT_TIMESTAMP,
               updated_by = $1
           WHERE payment_id = $2`,
          [req.user.id, paymentId]
        );
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Document reviewed successfully',
      document: result.rows[0],
      allDocumentsReviewed: parseInt(approved) + parseInt(rejected) === parseInt(total)
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Document review error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    client.release();
  }
});

/**
 * POST /api/payments/bank/:paymentId/approve
 * Approve payment
 */
router.post('/:paymentId/approve', authenticateToken, requireRole('bank', 'admin'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { paymentId } = req.params;
    const { bankReference, notes } = req.body;

    const updateQuery = `
      UPDATE payments
      SET 
        status = 'APPROVED',
        approved_at = CURRENT_TIMESTAMP,
        bank_reference = $1,
        notes = COALESCE(notes, '') || $2,
        updated_by = $3
      WHERE payment_id = $4 AND status = 'UNDER_REVIEW'
      RETURNING *
    `;

    const result = await client.query(updateQuery, [
      bankReference || null,
      notes ? '\n' + notes : '',
      req.user.id,
      paymentId
    ]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Payment not found or not in correct status for approval'
      });
    }

    // Log audit trail
    await client.query(
      `INSERT INTO payment_audit_log (payment_id, action, old_status, new_status, performed_by, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        paymentId,
        'PAYMENT_APPROVED',
        'UNDER_REVIEW',
        'APPROVED',
        req.user.id,
        JSON.stringify({ bankReference, notes })
      ]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Payment approved successfully',
      payment: result.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Payment approval error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    client.release();
  }
});

/**
 * POST /api/payments/bank/:paymentId/reject
 * Reject payment
 */
router.post('/:paymentId/reject', authenticateToken, requireRole('bank', 'admin'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { paymentId } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        error: 'Rejection reason is required'
      });
    }

    const updateQuery = `
      UPDATE payments
      SET 
        status = 'FAILED',
        failed_at = CURRENT_TIMESTAMP,
        failure_reason = $1,
        updated_by = $2
      WHERE payment_id = $3 AND status IN ('UNDER_REVIEW', 'DOCUMENTS_SUBMITTED')
      RETURNING *
    `;

    const result = await client.query(updateQuery, [
      rejectionReason,
      req.user.id,
      paymentId
    ]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Payment not found or not in correct status for rejection'
      });
    }

    // Log audit trail
    await client.query(
      `INSERT INTO payment_audit_log (payment_id, action, old_status, new_status, performed_by, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        paymentId,
        'PAYMENT_REJECTED',
        result.rows[0].status,
        'FAILED',
        req.user.id,
        JSON.stringify({ rejectionReason })
      ]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Payment rejected',
      payment: result.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Payment rejection error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    client.release();
  }
});

/**
 * POST /api/payments/bank/:paymentId/process
 * Process approved payment
 */
router.post('/:paymentId/process', authenticateToken, requireRole('bank', 'admin'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { paymentId } = req.params;
    const { swiftReference, transactionDetails } = req.body;

    const updateQuery = `
      UPDATE payments
      SET 
        status = 'PROCESSING',
        swift_code = $1,
        updated_by = $2
      WHERE payment_id = $3 AND status = 'APPROVED'
      RETURNING *
    `;

    const result = await client.query(updateQuery, [
      swiftReference || null,
      req.user.id,
      paymentId
    ]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Payment not found or not approved'
      });
    }

    // Create transaction record
    if (transactionDetails) {
      await client.query(
        `INSERT INTO payment_transactions (
          payment_id, transaction_type, amount, currency,
          from_account, to_account, swift_reference, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          paymentId,
          'CREDIT',
          result.rows[0].amount,
          result.rows[0].currency,
          transactionDetails.fromAccount || null,
          transactionDetails.toAccount || null,
          swiftReference || null,
          'PROCESSING'
        ]
      );
    }

    // Log audit trail
    await client.query(
      `INSERT INTO payment_audit_log (payment_id, action, old_status, new_status, performed_by, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        paymentId,
        'PAYMENT_PROCESSING',
        'APPROVED',
        'PROCESSING',
        req.user.id,
        JSON.stringify({ swiftReference })
      ]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Payment processing initiated',
      payment: result.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Payment processing error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    client.release();
  }
});

/**
 * POST /api/payments/bank/:paymentId/complete
 * Mark payment as completed
 */
router.post('/:paymentId/complete', authenticateToken, requireRole('bank', 'admin'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { paymentId } = req.params;
    const { transactionReference, completionNotes } = req.body;

    const updateQuery = `
      UPDATE payments
      SET 
        status = 'COMPLETED',
        completed_at = CURRENT_TIMESTAMP,
        bank_reference = COALESCE(bank_reference, $1),
        notes = COALESCE(notes, '') || $2,
        updated_by = $3
      WHERE payment_id = $4 AND status = 'PROCESSING'
      RETURNING *
    `;

    const result = await client.query(updateQuery, [
      transactionReference || null,
      completionNotes ? '\n' + completionNotes : '',
      req.user.id,
      paymentId
    ]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Payment not found or not in processing status'
      });
    }

    // Update transaction status
    await client.query(
      `UPDATE payment_transactions
       SET status = 'COMPLETED', processed_at = CURRENT_TIMESTAMP
       WHERE payment_id = $1 AND status = 'PROCESSING'`,
      [paymentId]
    );

    // Log audit trail
    await client.query(
      `INSERT INTO payment_audit_log (payment_id, action, old_status, new_status, performed_by, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        paymentId,
        'PAYMENT_COMPLETED',
        'PROCESSING',
        'COMPLETED',
        req.user.id,
        JSON.stringify({ transactionReference, completionNotes })
      ]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Payment completed successfully',
      payment: result.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Payment completion error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    client.release();
  }
});

module.exports = router;
