const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres123@localhost:5433/coffee_export'
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        service: 'commercial-bank-api',
        timestamp: new Date().toISOString()
    });
});

// Auth endpoint
app.post('/api/auth/login', (req, res) => {
    res.json({
        success: true,
        data: {
            token: 'demo-token-commercial-bank',
            user: {
                id: 1,
                username: 'demo',
                role: 'commercial-bank',
                organizationId: 'commercial-bank'
            }
        }
    });
});

// Register endpoint
app.post('/api/auth/register', (req, res) => {
    const { username, password, email, organizationId, role } = req.body;
    
    if (!username || !password || !email) {
        return res.status(400).json({
            success: false,
            message: 'Username, password, and email are required'
        });
    }
    
    res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
            user: {
                id: `USER-${Date.now()}`,
                username,
                email,
                organizationId: organizationId || 'commercialbank',
                role: role || 'exporter'
            },
            token: `demo-token-${username}`
        }
    });
});

// Exports endpoints with real database
app.get('/api/exports', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM exports ORDER BY created_at DESC');
        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/exports', async (req, res) => {
    try {
        const { exportId, quantity, destination, coffeeType } = req.body;
        const result = await pool.query(
            'INSERT INTO exports (export_id, organization, quantity, destination, coffee_type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [exportId, 'commercial-bank', quantity, destination, coffeeType]
        );
        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Document verification endpoint
app.post('/api/documents/verify', async (req, res) => {
    try {
        const { export_id, document_type, document_hash } = req.body;
        const result = await pool.query(
            'INSERT INTO document_verifications (export_id, document_type, document_hash, verification_status) VALUES ($1, $2, $3, $4) RETURNING *',
            [export_id, document_type, document_hash, 'verified']
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/documents/:exportId', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM document_verifications WHERE export_id = $1', [req.params.exportId]);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3016;
app.listen(PORT, () => {
    console.log(`commercial-bank API running on port ${PORT}`);
});
