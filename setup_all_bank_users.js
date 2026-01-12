const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'coffee_export_db',
    user: 'postgres',
    password: 'postgres'
});

async function setupAllUsers() {
    try {
        console.log('\n=== CURRENT USERS ===\n');
        const current = await pool.query(`
            SELECT id, username, email, role, organization_id 
            FROM users 
            ORDER BY organization_id, username
        `);
        console.table(current.rows);

        const hashedPassword = await bcrypt.hash('password123', 10);

        // Setup Commercial Bank admin
        console.log('\n=== Setting up Commercial Bank Admin ===');
        const cbCheck = await pool.query(`
            SELECT * FROM users 
            WHERE username = 'admin' AND organization_id = 'commercial-bank'
        `);

        if (cbCheck.rows.length > 0) {
            await pool.query(`
                UPDATE users 
                SET password_hash = $1 
                WHERE username = 'admin' AND organization_id = 'commercial-bank'
            `, [hashedPassword]);
            console.log('✅ Commercial Bank admin password updated');
        } else {
            await pool.query(`
                INSERT INTO users (username, email, password_hash, organization_id, role, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
            `, ['admin', 'admin@commercialbank.com', hashedPassword, 'commercial-bank', 'bank_admin']);
            console.log('✅ Commercial Bank admin created');
        }

        // Setup National Bank admin
        console.log('\n=== Setting up National Bank Admin ===');
        const nbCheck = await pool.query(`
            SELECT * FROM users 
            WHERE username = 'admin' AND organization_id = 'national-bank'
        `);

        if (nbCheck.rows.length > 0) {
            await pool.query(`
                UPDATE users 
                SET password_hash = $1 
                WHERE username = 'admin' AND organization_id = 'national-bank'
            `, [hashedPassword]);
            console.log('✅ National Bank admin password updated');
        } else {
            await pool.query(`
                INSERT INTO users (username, email, password_hash, organization_id, role, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
            `, ['admin', 'admin@nbe.gov.et', hashedPassword, 'national-bank', 'nbe_admin']);
            console.log('✅ National Bank admin created');
        }

        console.log('\n=== FINAL USER LIST ===\n');
        const final = await pool.query(`
            SELECT username, email, role, organization_id 
            FROM users 
            ORDER BY organization_id, username
        `);
        console.table(final.rows);

        console.log('\n╔══════════════════════════════════════════════════════════╗');
        console.log('║           LOGIN CREDENTIALS - ALL ORGANIZATIONS          ║');
        console.log('╚══════════════════════════════════════════════════════════╝\n');

        console.log('📋 Commercial Bank (Document Validation):');
        console.log('   Organization: Commercial Bank');
        console.log('   Username: admin');
        console.log('   Password: password123\n');

        console.log('📋 National Bank (Regulatory Oversight):');
        console.log('   Organization: National Bank of Ethiopia (NBE)');
        console.log('   Username: admin');
        console.log('   Password: password123\n');

        console.log('📋 Exporter Portal:');
        console.log('   Organization: Exporter Portal');
        console.log('   Username: exporter1 (or other existing exporters)');
        console.log('   Password: password123\n');

        console.log('✅ All users are ready for login!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        await pool.end();
    }
}

setupAllUsers();
