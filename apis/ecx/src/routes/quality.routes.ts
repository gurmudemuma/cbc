import { Router, Request, Response } from 'express';
import { Pool } from 'pg';

const router = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Create quality inspection
router.post('/certify', async (req: Request, res: Response) => {
  try {
    const {
      exportId,
      coffeeType,
      grade,
      cupping_score,
      moisture_content,
      defects,
      inspectionNotes,
      approved,
    } = req.body;

    if (!exportId || !coffeeType) {
      return res.status(400).json({
        success: false,
        message: 'exportId and coffeeType are required',
      });
    }

    const certificateNumber = `QC-${Date.now()}`;
    const status = approved ? 'approved' : 'pending';

    const result = await pool.query(
      `INSERT INTO quality_inspections 
       (export_id, certificate_number, coffee_type, grade, cupping_score, 
        moisture_content, defects, inspection_notes, status, inspected_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       RETURNING *`,
      [
        exportId,
        certificateNumber,
        coffeeType,
        grade,
        cupping_score,
        moisture_content,
        defects,
        inspectionNotes,
        status,
      ]
    );

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to create quality inspection',
      error: error.message,
    });
  }
});

// Get quality inspection by export ID
router.get('/:exportId', async (req: Request, res: Response) => {
  try {
    const { exportId } = req.params;

    const result = await pool.query(
      'SELECT * FROM quality_inspections WHERE export_id = $1',
      [exportId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Quality inspection not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quality inspection',
      error: error.message,
    });
  }
});

// Get coffee grades
router.get('/grades', async (_req: Request, res: Response) => {
  try {
    const grades = [
      { value: 'Grade 1', label: 'Grade 1 - Premium', minScore: 85 },
      { value: 'Grade 2', label: 'Grade 2 - High Quality', minScore: 80 },
      { value: 'Grade 3', label: 'Grade 3 - Standard', minScore: 75 },
      { value: 'Grade 4', label: 'Grade 4 - Commercial', minScore: 70 },
      { value: 'Grade 5', label: 'Grade 5 - Low Grade', minScore: 60 },
    ];

    res.json({
      success: true,
      data: grades,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch grades',
      error: error.message,
    });
  }
});

export default router;
