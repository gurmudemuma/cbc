const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres123@localhost:5433/coffee_export'
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        service: 'ecta-api',
        timestamp: new Date().toISOString()
    });
});

// Auth endpoint
app.post('/api/auth/login', (req, res) => {
    res.json({
        success: true,
        token: 'demo-token-ecta',
        user: {
            id: 1,
            username: 'demo',
            role: 'ecta',
            organizationId: 'ecta'
        }
    });
});

// Exports endpoint
app.get('/api/exports', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM exports ORDER BY created_at DESC');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/exports', async (req, res) => {
    try {
        const result = await pool.query(
            'INSERT INTO exports (export_id, organization) VALUES ($1, $2) RETURNING *',
            [Date.now().toString(), 'ecta']
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Contracts endpoint
app.post('/api/contracts', async (req, res) => {
    try {
        const { export_id, buyer_name, quantity, price_per_kg, total_value, contract_terms } = req.body;
        const contractNumber = `CNT-${Date.now()}`;
        const result = await pool.query(
            'INSERT INTO sales_contracts (export_id, contract_number, buyer_name, quantity, price_per_kg, total_value, contract_terms, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [export_id, contractNumber, buyer_name, quantity, price_per_kg, total_value, contract_terms, 'active']
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/contracts/:exportId', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM sales_contracts WHERE export_id = $1', [req.params.exportId]);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Quality inspection endpoint
app.post('/api/quality/inspect', async (req, res) => {
    try {
        const { export_id, coffee_type, moisture_content, defect_count, cup_score } = req.body;
        const result = await pool.query(
            'INSERT INTO quality_inspections (export_id, coffee_type, moisture_content, defect_count, cup_score, grade, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [export_id, coffee_type, moisture_content, defect_count, cup_score, 'Grade 1', 'passed']
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/quality/:exportId', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM quality_inspections WHERE export_id = $1', [req.params.exportId]);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
    console.log(`ecta API running on port ${PORT}`);
});

// Progress tracking endpoints
const { updateExportProgress, getExportProgress } = require('../../shared/progress-handler');
app.post('/api/exports/:export_id/progress', updateExportProgress);
app.get('/api/exports/:export_id/progress', getExportProgress);
