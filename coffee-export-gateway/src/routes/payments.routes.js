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
 * POST /api/payments/initiate
 * Initiate a new payment for an export
 */
router.post('/initiate', authenticateToken, requireRole('exporter', 'admin'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
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

    // Validate required fields
    if (!exportId || !paymentMethod || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: exportId, paymentMethod, amount'
      });
    }

    // Get exporter UUID
    const exporterQuery = 'SELECT exporter_id FROM exporter_profiles WHERE user_id = $1';
    const exporterResult = await client.query(exporterQuery, [req.user.id]);
    
    if (exporterResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Exporter profile not found'
      });
    }

    const exporterId = exporterResult.rows[0].exporter_id;

    // Verify export exists and belongs to exporter
    const exportQuery = 'SELECT * FROM exports WHERE export_id = $1 AND exporter_id = $2';
    const exportResult = await client.query(exportQuery, [exportId, exporterId]);
    
    if (exportResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Export not found or does not belong to exporter'
      });
    }

    // Calculate ETB amount if exchange rate provided
    const amountEtb = exchangeRate ? (amount * exchangeRate) : null;

    // Insert payment
    const insertQuery = `
      INSERT INTO payments (
        export_id, contract_id, exporter_id, buyer_id,
        payment_method, payment_terms, amount, currency,
        exchange_rate, amount_etb, status,
        lc_number, lc_issuing_bank, lc_advising_bank,
        lc_opening_date, lc_expiry_date, lc_amount,
        notes, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
        $12, $13, $14, $15, $16, $17, $18, $19
      ) RETURNING *
    `;

    const values = [
      exportId,
      contractId || null,
      exporterId,
      buyerId || null,
      paymentMethod,
      paymentTerms || null,
      amount,
      currency,
      exchangeRate || null,
      amountEtb,
      'INITIATED',
      lcDetails?.lcNumber || null,
      lcDetails?.issuingBank || null,
      lcDetails?.advisingBank || null,
      lcDetails?.openingDate || null,
      lcDetails?.expiryDate || null,
      lcDetails?.amount || amount,
      notes || null,
      req.user.id
    ];

    const result = await client.query(insertQuery, values);
    const payment = result.rows[0];

    // Log audit trail
    await client.query(
      `INSERT INTO payment_audit_log (payment_id, action, new_status, performed_by, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        payment.payment_id,
        'PAYMENT_INITIATED',
        'INITIATED',
        req.user.id,
        JSON.stringify({ amount, currency, paymentMethod })
      ]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Payment initiated successfully',
      payment: {
        paymentId: payment.payment_id,
        exportId: payment.export_id,
        amount: payment.amount,
        currency: payment.currency,
        paymentMethod: payment.payment_method,
        status: payment.status,
        initiatedAt: payment.initiated_at
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Payment initiation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    client.release();
  }
});

/**
 * GET /api/payments
 * Get all payments for the authenticated user (exporter, bank, or NBE)
 */
router.get('/', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { status, paymentMethod, limit = 50, offset = 0 } = req.query;
    const userRole = req.user.role?.toLowerCase();
    
    // For exporters - get their own payments
    if (userRole === 'exporter' || userRole === 'admin') {
      const exporterQuery = 'SELECT exporter_id FROM exporter_profiles WHERE user_id = $1';
      const exporterResult = await client.query(exporterQuery, [req.user.id]);
      
      if (exporterResult.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Exporter profile not found' });
      }
      
      const exporterId = exporterResult.rows[0].exporter_id;
      
      let query = `
        SELECT p.*, e.coffee_type, e.quantity, e.destination_country, 
               br.company_name as buyer_name, br.country as buyer_country, 
               COUNT(pd.document_id) as documents_count, 
               COUNT(pd.document_id) FILTER (WHERE pd.review_status = 'APPROVED') as approved_documents 
        FROM payments p 
        LEFT JOIN exports e ON p.export_id = e.export_id 
        LEFT JOIN buyer_registry br ON p.buyer_id = br.buyer_id 
        LEFT JOIN payment_documents pd ON p.payment_id = pd.payment_id 
        WHERE p.exporter_id = $1
      `;
      const params = [exporterId];
      let paramCount = 2;
      
      if (status) { 
        query += ` AND p.status = $${paramCount}`; 
        params.push(status); 
        paramCount++; 
      }
      if (paymentMethod) { 
        query += ` AND p.payment_method = $${paramCount}`; 
        params.push(paymentMethod); 
        paramCount++; 
      }
      
      query += ` GROUP BY p.payment_id, e.coffee_type, e.quantity, e.destination_country, br.company_name, br.country 
                 ORDER BY p.created_at DESC 
                 LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      params.push(limit, offset);
      
      const result = await client.query(query, params);
      
      let countQuery = `SELECT COUNT(*) as total FROM payments p WHERE p.exporter_id = $1`;
      const countParams = [exporterId];
      let countParamNum = 2;
      
      if (status) { 
        countQuery += ` AND p.status = $${countParamNum}`; 
        countParams.push(status); 
        countParamNum++; 
      }
      if (paymentMethod) { 
        countQuery += ` AND p.payment_method = $${countParamNum}`; 
        countParams.push(paymentMethod); 
      }
      
      const countResult = await client.query(countQuery, countParams);
      
      return res.json({ 
        success: true, 
        payments: result.rows, 
        pagination: { 
          total: parseInt(countResult.rows[0].total), 
          limit: parseInt(limit), 
          offset: parseInt(offset), 
          hasMore: (parseInt(offset) + result.rows.length) < parseInt(countResult.rows[0].total) 
        } 
      });
    }
    
    // For banks and NBE - get all payments
    if (userRole === 'bank' || userRole === 'banker' || userRole === 'nbe' || userRole === 'governor') {
      let query = `
        SELECT p.*, e.coffee_type, e.quantity, e.destination_country, 
               ep.business_name as exporter_name, 
               br.company_name as buyer_name, br.country as buyer_country, 
               COUNT(pd.document_id) as documents_count, 
               COUNT(pd.document_id) FILTER (WHERE pd.review_status = 'APPROVED') as approved_documents 
        FROM payments p 
        LEFT JOIN exports e ON p.export_id = e.export_id 
        LEFT JOIN exporter_profiles ep ON p.exporter_id = ep.exporter_id 
        LEFT JOIN buyer_registry br ON p.buyer_id = br.buyer_id 
        LEFT JOIN payment_documents pd ON p.payment_id = pd.payment_id 
        WHERE 1=1
      `;
      const params = [];
      let paramCount = 1;
      
      if (status) { 
        query += ` AND p.status = $${paramCount}`; 
        params.push(status); 
        paramCount++; 
      }
      if (paymentMethod) { 
        query += ` AND p.payment_method = $${paramCount}`; 
        params.push(paymentMethod); 
        paramCount++; 
      }
      
      query += ` GROUP BY p.payment_id, e.coffee_type, e.quantity, e.destination_country, ep.business_name, br.company_name, br.country 
                 ORDER BY p.created_at DESC 
                 LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      params.push(limit, offset);
      
      const result = await client.query(query, params);
      
      let countQuery = `SELECT COUNT(*) as total FROM payments p WHERE 1=1`;
      const countParams = [];
      let countParamNum = 1;
      
      if (status) { 
        countQuery += ` AND p.status = $${countParamNum}`; 
        countParams.push(status); 
        countParamNum++; 
      }
      if (paymentMethod) { 
        countQuery += ` AND p.payment_method = $${countParamNum}`; 
        countParams.push(paymentMethod); 
      }
      
      const countResult = await client.query(countQuery, countParams.length > 0 ? countParams : []);
      
      return res.json({ 
        success: true, 
        payments: result.rows, 
        pagination: { 
          total: parseInt(countResult.rows[0].total), 
          limit: parseInt(limit), 
          offset: parseInt(offset), 
          hasMore: (parseInt(offset) + result.rows.length) < parseInt(countResult.rows[0].total) 
        } 
      });
    }
    
    // For other roles - return empty array
    return res.json({ 
      success: true, 
      payments: [], 
      pagination: { 
        total: 0, 
        limit: parseInt(limit), 
        offset: parseInt(offset), 
        hasMore: false 
      } 
    });
    
  } catch (error) {
    console.error('Payments fetch error:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
});

/**
 * GET /api/payments/statistics
 * Get payment statistics for exporter, bank, or NBE
 */
router.get('/statistics', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userRole = req.user.role?.toLowerCase();
    
    // For exporters - get their own payment statistics
    if (userRole === 'exporter' || userRole === 'admin') {
      // Get exporter UUID
      const exporterQuery = 'SELECT exporter_id FROM exporter_profiles WHERE user_id = $1';
      const exporterResult = await client.query(exporterQuery, [req.user.id]);
      
      if (exporterResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Exporter profile not found'
        });
      }

      const exporterId = exporterResult.rows[0].exporter_id;

      const statsQuery = `
        SELECT 
          COUNT(*) as total_payments,
          COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_payments,
          COUNT(*) FILTER (WHERE status IN ('INITIATED', 'DOCUMENTS_SUBMITTED', 'UNDER_REVIEW', 'PROCESSING')) as pending_payments,
          COUNT(*) FILTER (WHERE status = 'FAILED') as failed_payments,
          SUM(amount) FILTER (WHERE status = 'COMPLETED') as total_received,
          SUM(amount) FILTER (WHERE status IN ('INITIATED', 'DOCUMENTS_SUBMITTED', 'UNDER_REVIEW', 'PROCESSING')) as pending_amount,
          AVG(EXTRACT(EPOCH FROM (completed_at - initiated_at))/86400) FILTER (WHERE status = 'COMPLETED') as avg_processing_days,
          COUNT(DISTINCT payment_method) as payment_methods_used
        FROM payments
        WHERE exporter_id = $1
      `;

      const result = await client.query(statsQuery, [exporterId]);

      return res.json({
        success: true,
        statistics: result.rows[0]
      });
    }
    
    // For banks and NBE - get all payment statistics
    if (userRole === 'bank' || userRole === 'banker' || userRole === 'nbe' || userRole === 'governor') {
      const statsQuery = `
        SELECT 
          COUNT(*) as total_payments,
          COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_payments,
          COUNT(*) FILTER (WHERE status IN ('INITIATED', 'DOCUMENTS_SUBMITTED', 'UNDER_REVIEW', 'PROCESSING')) as pending_payments,
          COUNT(*) FILTER (WHERE status = 'FAILED') as failed_payments,
          SUM(amount) FILTER (WHERE status = 'COMPLETED') as total_received,
          SUM(amount) FILTER (WHERE status IN ('INITIATED', 'DOCUMENTS_SUBMITTED', 'UNDER_REVIEW', 'PROCESSING')) as pending_amount,
          AVG(EXTRACT(EPOCH FROM (completed_at - initiated_at))/86400) FILTER (WHERE status = 'COMPLETED') as avg_processing_days,
          COUNT(DISTINCT payment_method) as payment_methods_used,
          COUNT(DISTINCT exporter_id) as total_exporters
        FROM payments
      `;

      const result = await client.query(statsQuery);

      return res.json({
        success: true,
        statistics: result.rows[0]
      });
    }
    
    // For other roles - return empty statistics
    return res.json({
      success: true,
      statistics: {
        total_payments: 0,
        completed_payments: 0,
        pending_payments: 0,
        failed_payments: 0,
        total_received: 0,
        pending_amount: 0,
        avg_processing_days: 0,
        payment_methods_used: 0
      }
    });

  } catch (error) {
    console.error('Statistics fetch error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    client.release();
  }
});

/**
 * GET /api/payments/:paymentId
 * Get detailed payment information
 */
router.get('/:paymentId', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { paymentId } = req.params;

    const query = `
      SELECT 
        p.*,
        e.coffee_type,
        e.quantity,
        e.destination_country,
        e.status as export_status,
        br.company_name as buyer_name,
        br.country as buyer_country,
        br.tax_id as buyer_tax_id,
        ep.business_name as exporter_name
      FROM payments p
      LEFT JOIN exports e ON p.export_id = e.export_id
      LEFT JOIN buyer_registry br ON p.buyer_id = br.buyer_id
      LEFT JOIN exporter_profiles ep ON p.exporter_id = ep.exporter_id
      WHERE p.payment_id = $1
    `;

    const result = await client.query(query, [paymentId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    const payment = result.rows[0];

    // Get payment documents
    const docsQuery = `
      SELECT * FROM payment_documents
      WHERE payment_id = $1
      ORDER BY submitted_at DESC
    `;
    const docsResult = await client.query(docsQuery, [paymentId]);

    // Get payment milestones
    const milestonesQuery = `
      SELECT * FROM payment_milestones
      WHERE payment_id = $1
      ORDER BY due_date ASC
    `;
    const milestonesResult = await client.query(milestonesQuery, [paymentId]);

    // Get payment transactions
    const transactionsQuery = `
      SELECT * FROM payment_transactions
      WHERE payment_id = $1
      ORDER BY created_at DESC
    `;
    const transactionsResult = await client.query(transactionsQuery, [paymentId]);

    res.json({
      success: true,
      payment: {
        ...payment,
        documents: docsResult.rows,
        milestones: milestonesResult.rows,
        transactions: transactionsResult.rows
      }
    });

  } catch (error) {
    console.error('Payment fetch error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    client.release();
  }
});

/**
 * POST /api/payments/:paymentId/documents
 * Submit documents for payment
 */
router.post('/:paymentId/documents', authenticateToken, requireRole('exporter', 'admin'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { paymentId } = req.params;
    const { documents } = req.body;

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Documents array is required'
      });
    }

    // Verify payment exists
    const paymentQuery = 'SELECT * FROM payments WHERE payment_id = $1';
    const paymentResult = await client.query(paymentQuery, [paymentId]);

    if (paymentResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    // Insert documents
    const insertedDocs = [];
    for (const doc of documents) {
      const insertQuery = `
        INSERT INTO payment_documents (
          payment_id, document_type, document_name,
          document_url, document_hash, submitted_by
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const result = await client.query(insertQuery, [
        paymentId,
        doc.documentType,
        doc.documentName,
        doc.documentUrl || null,
        doc.documentHash || null,
        req.user.id
      ]);

      insertedDocs.push(result.rows[0]);
    }

    // Update payment status
    await client.query(
      `UPDATE payments 
       SET status = 'DOCUMENTS_SUBMITTED', 
           documents_submitted_at = CURRENT_TIMESTAMP,
           updated_by = $1
       WHERE payment_id = $2 AND status = 'INITIATED'`,
      [req.user.id, paymentId]
    );

    // Log audit trail
    await client.query(
      `INSERT INTO payment_audit_log (payment_id, action, new_status, performed_by, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        paymentId,
        'DOCUMENTS_SUBMITTED',
        'DOCUMENTS_SUBMITTED',
        req.user.id,
        JSON.stringify({ documentsCount: documents.length })
      ]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Documents submitted successfully',
      documents: insertedDocs
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Document submission error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    client.release();
  }
});

module.exports = router;
