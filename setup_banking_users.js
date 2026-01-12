const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'coffee_export_db',
    user: 'postgres',
    password: 'postgres'
});

async function setupBankingUsers() {
    try {
        console.log('\n=== ALL USERS IN DATABASE ===\n');

        const allUsers = await pool.query(`
            SELECT id, username, email, role, organization_id 
            FROM users 
            ORDER BY organization_id, username
        `);
        console.table(allUsers.rows);

        // Setup Commercial Bank admin
        console.log('\n=== Setting up Commercial Bank User ===\n');
        const commercialBankCheck = await pool.query(`
            SELECT * FROM users 
            WHERE username = 'admin' AND organization_id = 'commercial-bank'
        `);

        const hashedPassword = await bcrypt.hash('password123', 10);

        if (commercialBankCheck.rows.length > 0) {
            await pool.query(`
                UPDATE users 
                SET password = $1 
                WHERE username = 'admin' AND organization_id = 'commercial-bank'
            `, [hashedPassword]);
            console.log('✅ Commercial Bank admin password reset');
        } else {
            await pool.query(`
                INSERT INTO users (username, email, password, role, organization_id)
                VALUES ($1, $2, $3, $4, $5)
            `, ['admin', 'admin@commercialbank.com', hashedPassword, 'bank_admin', 'commercial-bank']);
            console.log('✅ Commercial Bank admin created');
        }

        // Setup National Bank admin
        console.log('\n=== Setting up National Bank User ===\n');
        const nationalBankCheck = await pool.query(`
            SELECT * FROM users 
            WHERE username = 'admin' AND organization_id = 'national-bank'
        `);

        if (nationalBankCheck.rows.length > 0) {
            await pool.query(`
                UPDATE users 
                SET password = $1 
                WHERE username = 'admin' AND organization_id = 'national-bank'
            `, [hashedPassword]);
            console.log('✅ National Bank admin password reset');
        } else {
            await pool.query(`
                INSERT INTO users (username, email, password, role, organization_id)
                VALUES ($1, $2, $3, $4, $5)
            `, ['admin', 'admin@nbe.gov.et', hashedPassword, 'nbe_admin', 'national-bank']);
            console.log('✅ National Bank admin created');
        }

        console.log('\n=== FINAL USER LIST ===\n');
        const finalUsers = await pool.query(`
            SELECT username, email, role, organization_id 
            FROM users 
            WHERE organization_id IN ('commercial-bank', 'national-bank', 'exporter-portal')
            ORDER BY organization_id, username
        `);
        console.table(finalUsers.rows);

        console.log('\n=== LOGIN CREDENTIALS ===\n');
        console.log('Commercial Bank (Document Validation):');
        console.log('  Organization: Commercial Bank');
        console.log('  Username: admin');
        console.log('  Password: password123\n');

        console.log('National Bank (Regulatory Oversight):');
        console.log('  Organization: National Bank of Ethiopia (NBE)');
        console.log('  Username: admin');
        console.log('  Password: password123\n');

    } catch (error) {
        console.error('Error:', error.message);
        console.error(error);
    } finally {
        await pool.end();
    }
}

setupBankingUsers();
