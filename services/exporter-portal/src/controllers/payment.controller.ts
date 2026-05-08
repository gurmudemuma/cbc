import { Request, Response } from 'express';
import { getPool } from '@shared/database/pool';
import { v4 as uuidv4 } from 'uuid';

const pool = getPool();

// Initiate Payment (CBE/Exporter Bank)
export const initiatePayment = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const {
      exportId,
      contractId,
      buyerId,
      paymentMethod,
      paymentTerms,
      amount,
      currency = 'USD',
      exchangeRate,
      lcDetails,
      notes
    } = req.body;

    const user = (req as any).user;
    const exporterId = user.exporter_id || user.user_id;

    await client.query('BEGIN');

    // Get export details and documents
    const exportResult = await client.query(
      `SELECT e.*, ep.business_name as exporter_name 
       FROM exports e
       LEFT JOIN exporter_profiles ep ON e.exporter_id = ep.exporter_id
       WHERE e.export_id = $1`,
      [exportId]
    );

    if (exportResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Export not found' });
    }

    const exportData = exportResult.rows[0];

    // Create payment record
    const paymentId = uuidv4();
    const paymentResult = await client.query(
      `INSERT INTO payments (
        payment_id, export_id, contract_id, exporter_id, buyer_id,
        payment_method, payment_terms, amount, currency, exchange_rate,
        lc_number, lc_issuing_bank, lc_advising_bank, lc_expiry_date,
        status, notes, created_by, processing_bank
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        paymentId, exportId, contractId, exporterId, buyerId,
        paymentMethod, paymentTerms, amount, currency, exchangeRate,
        lcDetails?.lcNumber, lcDetails?.issuingBank, lcDetails?.advisingBank, lcDetails?.expiryDate,
        'INITIATED', notes, user.email || user.username, 'CBE'
      ]
    );

    // Get export documents to attach to payment
    const docsResult = await client.query(
      `SELECT * FROM documents WHERE entity_id = $1 AND entity_type = 'EXPORT'`,
      [exportId]
    );

    // Copy export documents to payment_documents
    for (const doc of docsResult.rows) {
      await client.query(
        `INSERT INTO payment_documents (
          payment_id, document_type, document_name, document_url, 
          document_hash, submitted_by, review_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          paymentId,
          doc.document_type,
          doc.document_name,
          doc.document_url,
          doc.document_hash,
          user.email || user.username,
          'PENDING'
        ]
      );
    }

    // Log audit
    await client.query(
      `INSERT INTO payment_audit_log (payment_id, action, new_status, performed_by, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        paymentId,
        'PAYMENT_INITIATED',
        'INITIATED',
        user.email || user.username,
        JSON.stringify({ export_id: exportId, amount, currency, payment_method: paymentMethod })
      ]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Payment initiated successfully',
      payment: paymentResult.rows[0]
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error initiating payment:', error);
    res.status(500).json({ error: 'Failed to initiate payment', details: error.message });
  } finally {
    client.release();
  }
};

// Submit Documents (CBE submits to Importer Bank)
export const submitDocuments = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { paymentId } = req.params;
    const { documents } = req.body;
    const user = (req as any).user;

    await client.query('BEGIN');

    // Update payment status
    await client.query(
      `UPDATE payments 
       SET status = 'DOCUMENTS_SUBMITTED', 
           documents_submitted_at = CURRENT_TIMESTAMP,
           updated_by = $1
       WHERE payment_id = $2`,
      [user.email || user.username, paymentId]
    );

    // Add additional documents if provided
    if (documents && documents.length > 0) {
      for (const doc of documents) {
        await client.query(
          `INSERT INTO payment_documents (
            payment_id, document_type, document_name, document_url,
            document_hash, submitted_by, review_status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            paymentId,
            doc.documentType,
            doc.documentName,
            doc.documentUrl || '',
            doc.documentHash || '',
            user.email || user.username,
            'PENDING'
          ]
        );
      }
    }

    // Log audit
    await client.query(
      `INSERT INTO payment_audit_log (payment_id, action, old_status, new_status, performed_by, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        paymentId,
        'DOCUMENTS_SUBMITTED',
        'INITIATED',
        'DOCUMENTS_SUBMITTED',
        user.email || user.username,
        JSON.stringify({ documents_count: documents?.length || 0 })
      ]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Documents submitted successfully to Importer Bank for review'
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error submitting documents:', error);
    res.status(500).json({ error: 'Failed to submit documents', details: error.message });
  } finally {
    client.release();
  }
};

// Get Pending Review (Importer Bank)
export const getPendingReview = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    // Get payments where importer bank needs to review
    const result = await pool.query(
      `SELECT 
        p.*,
        ep.business_name as exporter_name,
        br.company_name as buyer_name,
        e.coffee_type,
        e.quantity,
        e.destination_country,
        COUNT(pd.document_id) as documents_count,
        COUNT(pd.document_id) FILTER (WHERE pd.review_status = 'APPROVED') as approved_documents
      FROM payments p
      LEFT JOIN exporter_profiles ep ON p.exporter_id = ep.exporter_id
      LEFT JOIN buyer_registry br ON p.buyer_id = br.buyer_id
      LEFT JOIN exports e ON p.export_id = e.export_id
      LEFT JOIN payment_documents pd ON p.payment_id = pd.payment_id
      WHERE p.status IN ('DOCUMENTS_SUBMITTED', 'UNDER_REVIEW')
      GROUP BY p.payment_id, ep.business_name, br.company_name, e.coffee_type, e.quantity, e.destination_country
      ORDER BY p.documents_submitted_at DESC`
    );

    res.json({
      success: true,
      payments: result.rows
    });
  } catch (error: any) {
    console.error('Error getting pending review:', error);
    res.status(500).json({ error: 'Failed to get pending review', details: error.message });
  }
};

// Review Document (Importer Bank)
export const reviewDocument = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { paymentId } = req.params;
    const { documentId, reviewStatus, reviewNotes } = req.body;
    const user = (req as any).user;

    await client.query('BEGIN');

    // Update document review status
    await client.query(
      `UPDATE payment_documents 
       SET review_status = $1, 
           review_notes = $2,
           reviewed_by = $3,
           reviewed_at = CURRENT_TIMESTAMP
       WHERE document_id = $4 AND payment_id = $5`,
      [reviewStatus, reviewNotes, user.email || user.username, documentId, paymentId]
    );

    // Update payment status to UNDER_REVIEW if not already
    await client.query(
      `UPDATE payments 
       SET status = 'UNDER_REVIEW', updated_by = $1
       WHERE payment_id = $2 AND status = 'DOCUMENTS_SUBMITTED'`,
      [user.email || user.username, paymentId]
    );

    // Log audit
    await client.query(
      `INSERT INTO payment_audit_log (payment_id, action, performed_by, details)
       VALUES ($1, $2, $3, $4)`,
      [
        paymentId,
        'DOCUMENT_REVIEWED',
        user.email || user.username,
        JSON.stringify({ document_id: documentId, review_status: reviewStatus, notes: reviewNotes })
      ]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Document reviewed successfully'
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error reviewing document:', error);
    res.status(500).json({ error: 'Failed to review document', details: error.message });
  } finally {
    client.release();
  }
};

// Approve Payment (Importer Bank)
export const approvePayment = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { paymentId } = req.params;
    const { bankReference, notes } = req.body;
    const user = (req as any).user;

    await client.query('BEGIN');

    // Check if all documents are approved
    const docsCheck = await client.query(
      `SELECT COUNT(*) as total, 
              COUNT(*) FILTER (WHERE review_status = 'APPROVED') as approved
       FROM payment_documents WHERE payment_id = $1`,
      [paymentId]
    );

    if (docsCheck.rows[0].total !== docsCheck.rows[0].approved) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Cannot approve payment. Not all documents are approved.' 
      });
    }

    // Update payment status
    await client.query(
      `UPDATE payments 
       SET status = 'APPROVED',
           approved_at = CURRENT_TIMESTAMP,
           documents_approved_at = CURRENT_TIMESTAMP,
           bank_reference = $1,
           notes = COALESCE(notes || E'\n\n', '') || $2,
           updated_by = $3
       WHERE payment_id = $4`,
      [bankReference, notes, user.email || user.username, paymentId]
    );

    // Log audit
    await client.query(
      `INSERT INTO payment_audit_log (payment_id, action, old_status, new_status, performed_by, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        paymentId,
        'PAYMENT_APPROVED',
        'UNDER_REVIEW',
        'APPROVED',
        user.email || user.username,
        JSON.stringify({ bank_reference: bankReference, notes })
      ]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Payment approved successfully by Importer Bank'
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error approving payment:', error);
    res.status(500).json({ error: 'Failed to approve payment', details: error.message });
  } finally {
    client.release();
  }
};

// Reject Payment (Importer Bank)
export const rejectPayment = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { paymentId } = req.params;
    const { rejectionReason } = req.body;
    const user = (req as any).user;

    await client.query('BEGIN');

    await client.query(
      `UPDATE payments 
       SET status = 'FAILED',
           failed_at = CURRENT_TIMESTAMP,
           documents_rejected_at = CURRENT_TIMESTAMP,
           rejection_reason = $1,
           failure_reason = $1,
           updated_by = $2
       WHERE payment_id = $3`,
      [rejectionReason, user.email || user.username, paymentId]
    );

    // Log audit
    await client.query(
      `INSERT INTO payment_audit_log (payment_id, action, old_status, new_status, performed_by, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        paymentId,
        'PAYMENT_REJECTED',
        'UNDER_REVIEW',
        'FAILED',
        user.email || user.username,
        JSON.stringify({ rejection_reason: rejectionReason })
      ]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Payment rejected by Importer Bank'
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error rejecting payment:', error);
    res.status(500).json({ error: 'Failed to reject payment', details: error.message });
  } finally {
    client.release();
  }
};

// Complete Payment (Importer Bank)
export const completePayment = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { paymentId } = req.params;
    const { transactionReference, completionNotes } = req.body;
    const user = (req as any).user;

    await client.query('BEGIN');

    await client.query(
      `UPDATE payments 
       SET status = 'COMPLETED',
           completed_at = CURRENT_TIMESTAMP,
           bank_reference = COALESCE(bank_reference, $1),
           notes = COALESCE(notes || E'\n\n', '') || $2,
           updated_by = $3
       WHERE payment_id = $4 AND status = 'APPROVED'`,
      [transactionReference, completionNotes, user.email || user.username, paymentId]
    );

    // Log audit
    await client.query(
      `INSERT INTO payment_audit_log (payment_id, action, old_status, new_status, performed_by, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        paymentId,
        'PAYMENT_COMPLETED',
        'APPROVED',
        'COMPLETED',
        user.email || user.username,
        JSON.stringify({ transaction_reference: transactionReference, notes: completionNotes })
      ]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Payment completed successfully'
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error completing payment:', error);
    res.status(500).json({ error: 'Failed to complete payment', details: error.message });
  } finally {
    client.release();
  }
};

// Get Payments
export const getPayments = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const user = (req as any).user;

    let query = `
      SELECT 
        p.*,
        ep.business_name as exporter_name,
        br.company_name as buyer_name,
        e.coffee_type,
        e.quantity,
        e.destination_country,
        COUNT(pd.document_id) as documents_count,
        COUNT(pd.document_id) FILTER (WHERE pd.review_status = 'APPROVED') as approved_documents
      FROM payments p
      LEFT JOIN exporter_profiles ep ON p.exporter_id = ep.exporter_id
      LEFT JOIN buyer_registry br ON p.buyer_id = br.buyer_id
      LEFT JOIN exports e ON p.export_id = e.export_id
      LEFT JOIN payment_documents pd ON p.payment_id = pd.payment_id
    `;

    const params: any[] = [];
    const conditions: string[] = [];

    if (status) {
      conditions.push(`p.status = $${params.length + 1}`);
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ` GROUP BY p.payment_id, ep.business_name, br.company_name, e.coffee_type, e.quantity, e.destination_country
               ORDER BY p.created_at DESC`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      payments: result.rows
    });
  } catch (error: any) {
    console.error('Error getting payments:', error);
    res.status(500).json({ error: 'Failed to get payments', details: error.message });
  }
};

// Get Payment Details
export const getPaymentDetails = async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;

    const paymentResult = await pool.query(
      `SELECT 
        p.*,
        ep.business_name as exporter_name,
        br.company_name as buyer_name,
        e.coffee_type,
        e.quantity,
        e.destination_country
      FROM payments p
      LEFT JOIN exporter_profiles ep ON p.exporter_id = ep.exporter_id
      LEFT JOIN buyer_registry br ON p.buyer_id = br.buyer_id
      LEFT JOIN exports e ON p.export_id = e.export_id
      WHERE p.payment_id = $1`,
      [paymentId]
    );

    if (paymentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const documentsResult = await pool.query(
      `SELECT * FROM payment_documents WHERE payment_id = $1 ORDER BY submitted_at DESC`,
      [paymentId]
    );

    res.json({
      success: true,
      payment: {
        ...paymentResult.rows[0],
        documents: documentsResult.rows
      }
    });
  } catch (error: any) {
    console.error('Error getting payment details:', error);
    res.status(500).json({ error: 'Failed to get payment details', details: error.message });
  }
};

// Get Payment Statistics
export const getPaymentStatistics = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`SELECT * FROM v_payment_statistics`);

    res.json({
      success: true,
      statistics: result.rows[0] || {
        total_payments: 0,
        completed_payments: 0,
        pending_payments: 0,
        failed_payments: 0,
        total_completed_amount: 0,
        total_pending_amount: 0,
        avg_processing_days: 0
      }
    });
  } catch (error: any) {
    console.error('Error getting payment statistics:', error);
    res.status(500).json({ error: 'Failed to get payment statistics', details: error.message });
  }
};

// Get All Payments Dashboard (Universal - All parties)
export const getAllPaymentsDashboard = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT 
        p.*,
        ep.business_name as exporter_name,
        br.company_name as buyer_name,
        e.coffee_type,
        e.quantity,
        e.destination_country,
        COUNT(pd.document_id) as documents_count,
        COUNT(pd.document_id) FILTER (WHERE pd.review_status = 'APPROVED') as approved_documents
      FROM payments p
      LEFT JOIN exporter_profiles ep ON p.exporter_id = ep.exporter_id
      LEFT JOIN buyer_registry br ON p.buyer_id = br.buyer_id
      LEFT JOIN exports e ON p.export_id = e.export_id
      LEFT JOIN payment_documents pd ON p.payment_id = pd.payment_id
      GROUP BY p.payment_id, ep.business_name, br.company_name, e.coffee_type, e.quantity, e.destination_country
      ORDER BY p.created_at DESC
      LIMIT 100`
    );

    res.json({
      success: true,
      payments: result.rows
    });
  } catch (error: any) {
    console.error('Error getting dashboard:', error);
    res.status(500).json({ error: 'Failed to get dashboard', details: error.message });
  }
};

// Get Payment Ledger (Complete audit trail)
export const getPaymentLedger = async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;

    // Get payment details
    const paymentResult = await pool.query(
      `SELECT 
        p.*,
        ep.business_name as exporter_name,
        br.company_name as buyer_name,
        e.coffee_type,
        e.quantity,
        e.destination_country
      FROM payments p
      LEFT JOIN exporter_profiles ep ON p.exporter_id = ep.exporter_id
      LEFT JOIN buyer_registry br ON p.buyer_id = br.buyer_id
      LEFT JOIN exports e ON p.export_id = e.export_id
      WHERE p.payment_id = $1`,
      [paymentId]
    );

    if (paymentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Get documents
    const documentsResult = await pool.query(
      `SELECT * FROM payment_documents WHERE payment_id = $1 ORDER BY submitted_at DESC`,
      [paymentId]
    );

    // Get audit log
    const auditResult = await pool.query(
      `SELECT * FROM payment_audit_log WHERE payment_id = $1 ORDER BY performed_at ASC`,
      [paymentId]
    );

    // Get transactions
    const transactionsResult = await pool.query(
      `SELECT * FROM payment_transactions WHERE payment_id = $1 ORDER BY created_at DESC`,
      [paymentId]
    );

    res.json({
      success: true,
      ledger: {
        payment: paymentResult.rows[0],
        documents: documentsResult.rows,
        audit_trail: auditResult.rows,
        transactions: transactionsResult.rows
      }
    });
  } catch (error: any) {
    console.error('Error getting payment ledger:', error);
    res.status(500).json({ error: 'Failed to get payment ledger', details: error.message });
  }
};
