/**
 * Simpler test - just check status counts
 */

const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'coffee_export_db',
    user: 'postgres',
    password: 'postgres'
});

async function test() {
    try {
        console.log('=== PROFILE STATUS COUNTS ===');
        const statusCounts = await pool.query(`
            SELECT status, COUNT(*) as count 
            FROM exporter_profiles 
            GROUP BY status
            ORDER BY count DESC
        `);
        statusCounts.rows.forEach(row => {
            console.log(`${row.status}: ${row.count}`);
        });

        console.log('\n=== LABORATORY STATUS COUNTS ===');
        const labCounts = await pool.query(`
            SELECT status, COUNT(*) as count 
            FROM coffee_laboratories 
            GROUP BY status
            ORDER BY count DESC
        `);
        labCounts.rows.forEach(row => {
            console.log(`${row.status}: ${row.count}`);
        });

        console.log('\n=== TASTER STATUS COUNTS ===');
        const tasterCounts = await pool.query(`
            SELECT status, COUNT(*) as count 
            FROM coffee_tasters 
            GROUP BY status
            ORDER BY count DESC
        `);
        tasterCounts.rows.forEach(row => {
            console.log(`${row.status}: ${row.count}`);
        });

        console.log('\n=== COMPETENCE CERTIFICATE STATUS COUNTS ===');
        const certCounts = await pool.query(`
            SELECT status, COUNT(*) as count 
            FROM competence_certificates 
            GROUP BY status
            ORDER BY count DESC
        `);
        certCounts.rows.forEach(row => {
            console.log(`${row.status}: ${row.count}`);
        });

        console.log('\n=== EXPORT LICENSE STATUS COUNTS ===');
        const licenseCounts = await pool.query(`
            SELECT status, COUNT(*) as count 
            FROM export_licenses 
            GROUP BY status
            ORDER BY count DESC
        `);
        licenseCounts.rows.forEach(row => {
            console.log(`${row.status}: ${row.count}`);
        });

    } catch (error) {
        console.error('ERROR:', error.message);
    } finally {
        await pool.end();
    }
}

test();
