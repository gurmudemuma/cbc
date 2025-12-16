import { Router, Request, Response } from 'express';
import { Pool } from 'pg';

const router = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Create FX approval
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      exportId,
      exportValue,
      currency,
      exchangeRate,
      approvalNotes,
      approved,
    } = req.body;

    if (!exportId || !exportValue) {
      return res.status(400).json({
        success: false,
        message: 'exportId and exportValue are required',
      });
    }

    const localValue = exportValue * (exchangeRate || 1);
    const status = approved ? 'approved' : 'pending';

    const result = await pool.query(
      `INSERT INTO fx_approvals 
       (export_id, export_value, currency, exchange_rate, local_value, 
        approval_status, approval_notes, approved_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        exportId,
        exportValue,
        currency || 'USD',
        exchangeRate,
        localValue,
        status,
        approvalNotes,
        approved ? new Date() : null,
      ]
    );

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to create FX approval',
      error: error.message,
    });
  }
});

// Get FX approval by export ID
router.get('/:exportId', async (req: Request, res: Response) => {
  try {
    const { exportId } = req.params;

    const result = await pool.query(
      'SELECT * FROM fx_approvals WHERE export_id = $1 ORDER BY created_at DESC LIMIT 1',
      [exportId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'FX approval not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch FX approval',
      error: error.message,
    });
  }
});

// Get current FX rates
router.get('/fx-rates', async (_req: Request, res: Response) => {
  try {
    // In production, this would fetch from external API or database
    const rates = {
      USD: 1.0,
      EUR: 0.92,
      GBP: 0.79,
      ETB: 55.5, // Ethiopian Birr
    };

    res.json({
      success: true,
      data: rates,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch FX rates',
      error: error.message,
    });
  }
});

export default router;
