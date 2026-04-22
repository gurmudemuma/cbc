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
 * GET /api/payments/nbe/pending-fx-approval
 * Get payments pending foreign exchange approval
 */
router.get('/pending-fx-approval', authenticateToken, requireRole('nbe', 'admin'), async (req, res) => {
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
        ep.tin as exporter_tin
      FROM payments p
      LEFT JOIN exports e ON p.export_id = e.export_id
      LEFT JOIN buyer_registry br ON p.buyer_id = br.buyer_id
      LEFT JOIN exporter_profiles ep ON p.exporter_id = ep.exporter_id
      WHERE p.status = 'APPROVED' 
        AND (p.nbe_approval_status IS NULL OR p.nbe_approval_status = 'PENDING')
        AND p.currency != 'ETB'
      ORDER BY p.approved_at ASC
    `;

    const result = await client.query(query);

    res.json({
      success: true,
      payments: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('Pending FX approvals fetch error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    client.release();
  }
});

/**
 * POST /api/payments/nbe/:paymentId/fx/approve
 * Approve foreign exchange for payment
 */
router.post('/:paymentId/fx/approve', authenticateToken, requireRole('nbe', 'admin'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { paymentId } = req.params;
    const { exchangeRate, nbeReference, notes } = req.body;

    if (!exchangeRate) {
      return res.status(400).json({
        success: false,
        error: 'Exchange rate is required'
      });
    }

    // Get payment details
    const paymentQuery = 'SELECT * FROM payments WHERE payment_id = $1';
    const paymentResult = await client.query(paymentQuery, [paymentId]);

    if (paymentResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    const payment = paymentResult.rows[0];

    // Calculate ETB amount
    const amountEtb = payment.amount * exchangeRate;

    // Update payment with FX approval
    const updateQuery = `
      UPDATE payments
      SET 
        nbe_approval_status = 'APPROVED',
        nbe_approval_date = CURRENT_TIMESTAMP,
        nbe_reference = $1,
        exchange_rate = $2,
        amount_etb = $3,
        notes = COALESCE(notes, '') || $4,
        updated_by = $5
      WHERE payment_id = $6
      RETURNING *
    `;

    const result = await client.query(updateQuery, [
      nbeReference || null,
      exchangeRate,
      amountEtb,
      notes ? '\n[NBE] ' + notes : '',
      req.user.id,
      paymentId
    ]);

    // Log audit trail
    await client.query(
      `INSERT INTO payment_audit_log (payment_id, action, performed_by, details)
       VALUES ($1, $2, $3, $4)`,
      [
        paymentId,
        'FX_APPROVED',
        req.user.id,
        JSON.stringify({ 
          exchangeRate, 
          amountEtb, 
          nbeReference,
          currency: payment.currency,
          amount: payment.amount
        })
      ]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Foreign exchange approved successfully',
      payment: result.rows[0],
      fxDetails: {
        exchangeRate,
        amountUsd: payment.amount,
        amountEtb,
        currency: payment.currency
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('FX approval error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    client.release();
  }
});

/**
 * POST /api/payments/nbe/:paymentId/fx/reject
 * Reject foreign exchange for payment
 */
router.post('/:paymentId/fx/reject', authenticateToken, requireRole('nbe', 'admin'), async (req, res) => {
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
        nbe_approval_status = 'REJECTED',
        nbe_approval_date = CURRENT_TIMESTAMP,
        status = 'FAILED',
        failed_at = CURRENT_TIMESTAMP,
        failure_reason = $1,
        updated_by = $2
      WHERE payment_id = $3
      RETURNING *
    `;

    const result = await client.query(updateQuery, [
      'FX Rejected: ' + rejectionReason,
      req.user.id,
      paymentId
    ]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    // Log audit trail
    await client.query(
      `INSERT INTO payment_audit_log (payment_id, action, old_status, new_status, performed_by, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        paymentId,
        'FX_REJECTED',
        result.rows[0].status,
        'FAILED',
        req.user.id,
        JSON.stringify({ rejectionReason })
      ]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Foreign exchange rejected',
      payment: result.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('FX rejection error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    client.release();
  }
});

/**
 * GET /api/payments/nbe/statistics
 * Get FX approval statistics
 */
router.get('/statistics', authenticateToken, requireRole('nbe', 'admin'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_payments,
        COUNT(*) FILTER (WHERE nbe_approval_status = 'APPROVED') as approved_fx,
        COUNT(*) FILTER (WHERE nbe_approval_status = 'REJECTED') as rejected_fx,
        COUNT(*) FILTER (WHERE nbe_approval_status IS NULL OR nbe_approval_status = 'PENDING') as pending_fx,
        SUM(amount) FILTER (WHERE nbe_approval_status = 'APPROVED') as total_approved_usd,
        SUM(amount_etb) FILTER (WHERE nbe_approval_status = 'APPROVED') as total_approved_etb,
        AVG(exchange_rate) FILTER (WHERE nbe_approval_status = 'APPROVED') as avg_exchange_rate,
        AVG(EXTRACT(EPOCH FROM (nbe_approval_date - approved_at))/3600) FILTER (WHERE nbe_approval_status = 'APPROVED') as avg_approval_hours
      FROM payments
      WHERE currency != 'ETB'
    `;

    const result = await client.query(statsQuery);

    res.json({
      success: true,
      statistics: result.rows[0]
    });

  } catch (error) {
    console.error('FX statistics fetch error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    client.release();
  }
});

/**
 * GET /api/payments/nbe/:paymentId
 * Get payment details for NBE review
 */
router.get('/:paymentId', authenticateToken, requireRole('nbe', 'admin'), async (req, res) => {
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
        ep.business_name as exporter_name,
        ep.tin as exporter_tin,
        ep.license_number as exporter_license,
        sc.contract_number,
        sc.total_value as contract_value
      FROM payments p
      LEFT JOIN exports e ON p.export_id = e.export_id
      LEFT JOIN buyer_registry br ON p.buyer_id = br.buyer_id
      LEFT JOIN exporter_profiles ep ON p.exporter_id = ep.exporter_id
      LEFT JOIN sales_contracts sc ON p.contract_id = sc.contract_id
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

    // Get audit log
    const auditQuery = `
      SELECT * FROM payment_audit_log
      WHERE payment_id = $1
      ORDER BY performed_at DESC
    `;
    const auditResult = await client.query(auditQuery, [paymentId]);

    res.json({
      success: true,
      payment: {
        ...payment,
        auditLog: auditResult.rows
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

module.exports = router;
