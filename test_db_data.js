/**
 * Test ECTA dashboard with direct database query
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
    const fs = require('fs');
    let output = '';

    try {
        // Check users
        output += '=== USERS ===\n';
        const users = await pool.query('SELECT username, role FROM users WHERE role LIKE \'%ECTA%\' OR role = \'ADMIN\' ORDER BY username');
        output += JSON.stringify(users.rows, null, 2) + '\n';

        // Check exporter profiles
        output += '\n=== EXPORTER PROFILES ===\n';
        const profiles = await pool.query('SELECT exporter_id, business_name, status FROM exporter_profiles ORDER BY created_at DESC');
        output += 'Total profiles: ' + profiles.rows.length + '\n';
        output += JSON.stringify(profiles.rows, null, 2) + '\n';

        // Count by status
        output += '\n=== PROFILE STATUS COUNTS ===\n';
        const statusCounts = await pool.query(`
            SELECT status, COUNT(*) as count 
            FROM exporter_profiles 
            GROUP BY status
        `);
        output += JSON.stringify(statusCounts.rows, null, 2) + '\n';

        // Check laboratories
        output += '\n=== LABORATORIES ===\n';
        const labs = await pool.query('SELECT laboratory_id, laboratory_name, status FROM coffee_laboratories ORDER BY created_at DESC');
        output += 'Total labs: ' + labs.rows.length + '\n';
        output += JSON.stringify(labs.rows, null, 2) + '\n';

        // Check tasters
        output += '\n=== TASTERS ===\n';
        const tasters = await pool.query('SELECT taster_id, full_name, status FROM coffee_tasters ORDER BY created_at DESC');
        output += 'Total tasters: ' + tasters.rows.length + '\n';
        output += JSON.stringify(tasters.rows, null, 2) + '\n';

        // Check competence certificates
        output += '\n=== COMPETENCE CERTIFICATES ===\n';
        const certs = await pool.query('SELECT certificate_id, exporter_id, status FROM competence_certificates ORDER BY created_at DESC');
        output += 'Total certificates: ' + certs.rows.length + '\n';
        output += JSON.stringify(certs.rows, null, 2) + '\n';

        // Check export licenses
        output += '\n=== EXPORT LICENSES ===\n';
        const licenses = await pool.query('SELECT license_id, exporter_id, status FROM export_licenses ORDER BY created_at DESC');
        output += 'Total licenses: ' + licenses.rows.length + '\n';
        output += JSON.stringify(licenses.rows, null, 2) + '\n';

        console.log(output);
        fs.writeFileSync('db_data_output.txt', output);
        console.log('\n✅ Output saved to db_data_output.txt');

    } catch (error) {
        console.error('ERROR:', error.message);
    } finally {
        await pool.end();
    }
}

test();
