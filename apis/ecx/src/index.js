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
        service: 'ecx-api',
        timestamp: new Date().toISOString()
    });
});

// Auth endpoint
app.post('/api/auth/login', (req, res) => {
    res.json({
        success: true,
        token: 'demo-token-ecx',
        user: {
            id: 1,
            username: 'demo',
            role: 'ecx',
            organizationId: 'ecx'
        }
    });
});

// Quality Certification
app.post('/api/quality/certify', async (req, res) => {
    try {
        const { exportId, coffeeType, grade, cupping_score, moisture_content, defects, inspectionNotes, approved } = req.body;
        const certificateNumber = `QC-${Date.now()}`;
        const status = approved ? 'approved' : 'pending';
        
        const result = await pool.query(
            `INSERT INTO quality_inspections 
             (export_id, certificate_number, coffee_type, grade, cupping_score, moisture_content, defects, inspection_notes, status, inspected_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()) RETURNING *`,
            [exportId, certificateNumber, coffeeType, grade, cupping_score, moisture_content, defects, inspectionNotes, status]
        );
        
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/quality/:exportId', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM quality_inspections WHERE export_id = $1',
            [req.params.exportId]
        );
        res.json({ success: true, data: result.rows[0] || null });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/quality/grades', (req, res) => {
    res.json({
        success: true,
        data: [
            { value: 'Grade 1', label: 'Grade 1 - Premium', minScore: 85 },
            { value: 'Grade 2', label: 'Grade 2 - High Quality', minScore: 80 },
            { value: 'Grade 3', label: 'Grade 3 - Standard', minScore: 75 },
            { value: 'Grade 4', label: 'Grade 4 - Commercial', minScore: 70 },
            { value: 'Grade 5', label: 'Grade 5 - Low Grade', minScore: 60 }
        ]
    });
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

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
    console.log(`ecx API running on port ${PORT}`);
});
