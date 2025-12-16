const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: 'postgresql://postgres:postgres123@localhost:5433/coffee_export'
});

const orgName = process.env.ORG_NAME || 'commercial-bank';
const port = process.env.PORT || 3001;

app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        service: `${orgName}-api`,
        timestamp: new Date().toISOString()
    });
});

app.post('/api/auth/login', (req, res) => {
    res.json({
        success: true,
        token: `token-${orgName}`,
        user: { id: 1, username: 'admin', role: orgName }
    });
});

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
        const { exportId, quantity, destination, coffeeType } = req.body;
        const result = await pool.query(
            'INSERT INTO exports (export_id, organization, quantity, destination, coffee_type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [exportId, orgName, quantity, destination, coffeeType]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(port, () => {
    console.log(`${orgName} API running on port ${port} with database`);
});
