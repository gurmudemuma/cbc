// Shared progress tracking handler for all APIs
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres123@localhost:5433/coffee_export'
});

const updateExportProgress = async (req, res) => {
    try {
        const { export_id } = req.params;
        const { step } = req.body;
        const user = req.user || req.body.user || 'system';

        // Call the database function
        await pool.query(
            'SELECT update_export_progress($1, $2, $3, $4)',
            [export_id, step, user, req.body.notes || null]
        );

        res.json({ success: true, message: `Step ${step} completed` });
    } catch (error) {
        console.error('Progress update failed:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

const getExportProgress = async (req, res) => {
    try {
        const { export_id } = req.params;

        const result = await pool.query(
            'SELECT * FROM export_dashboard WHERE export_id = $1',
            [export_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Export not found' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Failed to get progress:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = { updateExportProgress, getExportProgress };
