const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        service: 'shipping-line-api',
        timestamp: new Date().toISOString()
    });
});

// Auth endpoint
app.post('/api/auth/login', (req, res) => {
    res.json({
        success: true,
        token: 'demo-token-shipping-line',
        user: {
            id: 1,
            username: 'demo',
            role: 'shipping-line',
            organizationId: 'shipping-line'
        }
    });
});

// Shipment Bookings
app.post('/api/bookings', async (req, res) => {
    try {
        const { exportId, vesselName, departurePort, arrivalPort, departureDate, estimatedArrivalDate, containerType } = req.body;
        const bookingNumber = `SHIP-${Date.now()}`;
        const containerNumber = `CONT-${Date.now()}`;
        
        const result = await pool.query(
            `INSERT INTO shipments 
             (export_id, booking_number, vessel_name, departure_port, arrival_port, departure_date, estimated_arrival_date, container_number, container_type, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [exportId, bookingNumber, vesselName, departurePort, arrivalPort, departureDate, estimatedArrivalDate, containerNumber, containerType || '20ft', 'scheduled']
        );
        
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/bookings/:exportId', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM shipments WHERE export_id = $1',
            [req.params.exportId]
        );
        res.json({ success: true, data: result.rows[0] || null });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.put('/api/bookings/:id/status', async (req, res) => {
    try {
        const { status, trackingNotes } = req.body;
        const result = await pool.query(
            'UPDATE shipments SET status = $1, tracking_notes = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
            [status, trackingNotes, req.params.id]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Exports endpoint
app.get('/api/exports', (req, res) => {
    res.json({
        success: true,
        data: []
    });
});

app.post('/api/exports', (req, res) => {
    res.json({
        success: true,
        data: { id: Date.now(), ...req.body }
    });
});

const PORT = process.env.PORT || 3014;
app.listen(PORT, () => {
    console.log(`shipping-line API running on port ${PORT}`);
});

// Progress tracking endpoints
const { updateExportProgress, getExportProgress } = require('../../shared/progress-handler');
app.post('/api/exports/:export_id/progress', updateExportProgress);
app.get('/api/exports/:export_id/progress', getExportProgress);
