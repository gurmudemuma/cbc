import { Router, Request, Response } from 'express';
import { Pool } from 'pg';

const router = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Create shipment booking
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      exportId,
      vesselName,
      departurePort,
      arrivalPort,
      departureDate,
      estimatedArrivalDate,
      containerType,
    } = req.body;

    if (!exportId || !vesselName || !departurePort || !arrivalPort) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: exportId, vesselName, departurePort, arrivalPort',
      });
    }

    const bookingNumber = `SHIP-${Date.now()}`;
    const containerNumber = `CONT-${Date.now()}`;

    const result = await pool.query(
      `INSERT INTO shipments 
       (export_id, booking_number, vessel_name, departure_port, arrival_port, 
        departure_date, estimated_arrival_date, container_number, container_type, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        exportId,
        bookingNumber,
        vesselName,
        departurePort,
        arrivalPort,
        departureDate,
        estimatedArrivalDate,
        containerNumber,
        containerType || '20ft',
        'scheduled',
      ]
    );

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: error.message,
    });
  }
});

// Get shipment by export ID
router.get('/:exportId', async (req: Request, res: Response) => {
  try {
    const { exportId } = req.params;

    const result = await pool.query(
      'SELECT * FROM shipments WHERE export_id = $1',
      [exportId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shipment',
      error: error.message,
    });
  }
});

// Update shipment status
router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, trackingNotes } = req.body;

    const result = await pool.query(
      `UPDATE shipments 
       SET status = $1, tracking_notes = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status, trackingNotes, id]
    );

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update shipment',
      error: error.message,
    });
  }
});

export default router;
