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
        service: 'national-bank-api',
        timestamp: new Date().toISOString()
    });
});

// Auth endpoint
app.post('/api/auth/login', (req, res) => {
    res.json({
        success: true,
        token: 'demo-token-national-bank',
        user: {
            id: 1,
            username: 'demo',
            role: 'national-bank',
            organizationId: 'national-bank'
        }
    });
});

// FX Approvals
app.post('/api/approvals', async (req, res) => {
    try {
        const { exportId, exportValue, currency, exchangeRate, approvalNotes, approved } = req.body;
        const localValue = exportValue * (exchangeRate || 1);
        const status = approved ? 'approved' : 'pending';
        
        const result = await pool.query(
            `INSERT INTO fx_approvals 
             (export_id, export_value, currency, exchange_rate, local_value, approval_status, approval_notes, approved_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [exportId, exportValue, currency || 'USD', exchangeRate, localValue, status, approvalNotes, approved ? new Date() : null]
        );
        
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/approvals/:exportId', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM fx_approvals WHERE export_id = $1 ORDER BY created_at DESC LIMIT 1',
            [req.params.exportId]
        );
        res.json({ success: true, data: result.rows[0] || null });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/fx-rates', (req, res) => {
    res.json({
        success: true,
        data: { USD: 1.0, EUR: 0.92, GBP: 0.79, ETB: 55.5 },
        timestamp: new Date().toISOString()
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

const PORT = process.env.PORT || 3014;
app.listen(PORT, () => {
    console.log(`national-bank API running on port ${PORT}`);
});

// Progress tracking endpoints
const { updateExportProgress, getExportProgress } = require('../../shared/progress-handler');
app.post('/api/exports/:export_id/progress', updateExportProgress);
app.get('/api/exports/:export_id/progress', getExportProgress);
