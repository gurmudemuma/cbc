
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// DB Config from env or hardcoded for this environment
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'coffee_export_db',
    password: process.env.DB_PASSWORD || 'postgres',
    port: parseInt(process.env.DB_PORT || '5432'),
});

async function runMigration() {
    const client = await pool.connect();
    try {
        const migrationPath = path.join('c:', 'project', 'cbc', 'api', 'shared', 'database', 'migrations', '009_add_tin_to_exports.sql');
        console.log(`Reading migration file: ${migrationPath}`);
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log('Executing migration...');
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');
        console.log('Migration 009 applied successfully.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
