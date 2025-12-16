import { Router, Request, Response } from 'express';
import { Pool } from 'pg';

const router = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Create customs clearance
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      exportId,
      declarationNumber,
      inspectionNotes,
      dutyPaid,
      taxPaid,
    } = req.body;

    if (!exportId || !declarationNumber) {
      return res.status(400).json({
        success: false,
        message: 'exportId and declarationNumber are required',
      });
    }

    const result = await pool.query(
      `INSERT INTO customs_clearances 
       (export_id, declaration_number, inspection_notes, duty_paid, tax_paid, status, cleared_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [exportId, declarationNumber, inspectionNotes, dutyPaid, taxPaid, 'cleared']
    );

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to create customs clearance',
      error: error.message,
    });
  }
});

// Get clearance by export ID
router.get('/:exportId', async (req: Request, res: Response) => {
  try {
    const { exportId } = req.params;

    const result = await pool.query(
      'SELECT * FROM customs_clearances WHERE export_id = $1',
      [exportId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Clearance not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch clearance',
      error: error.message,
    });
  }
});

export default router;
