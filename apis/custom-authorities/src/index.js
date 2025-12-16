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
        service: 'custom-authorities-api',
        timestamp: new Date().toISOString()
    });
});

// Auth endpoint
app.post('/api/auth/login', (req, res) => {
    res.json({
        success: true,
        token: 'demo-token-custom-authorities',
        user: {
            id: 1,
            username: 'demo',
            role: 'custom-authorities',
            organizationId: 'custom-authorities'
        }
    });
});

// Customs Clearance
app.post('/api/clearance', async (req, res) => {
    try {
        const { exportId, declarationNumber, inspectionNotes, dutyPaid, taxPaid } = req.body;
        
        const result = await pool.query(
            `INSERT INTO customs_clearances 
             (export_id, declaration_number, inspection_notes, duty_paid, tax_paid, status, cleared_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
            [exportId, declarationNumber, inspectionNotes, dutyPaid, taxPaid, 'cleared']
        );
        
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/clearance/:exportId', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM customs_clearances WHERE export_id = $1',
            [req.params.exportId]
        );
        res.json({ success: true, data: result.rows[0] || null });
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

const PORT = process.env.PORT || 3019;
app.listen(PORT, () => {
    console.log(`custom-authorities API running on port ${PORT}`);
});

// Progress tracking endpoints
const { updateExportProgress, getExportProgress } = require('../../shared/progress-handler');
app.post('/api/exports/:export_id/progress', updateExportProgress);
app.get('/api/exports/:export_id/progress', getExportProgress);
