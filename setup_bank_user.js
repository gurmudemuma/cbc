const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'coffee_export_db',
    user: 'postgres',
    password: 'postgres'
});

async function setupBankUser() {
    try {
        console.log('\n=== Checking existing users ===\n');

        // Check all users
        const allUsers = await pool.query(`
            SELECT id, username, email, role, organization_id 
            FROM users 
            ORDER BY organization_id, username
        `);
        console.table(allUsers.rows);

        // Check if commercial bank admin exists
        const bankAdmin = await pool.query(`
            SELECT * FROM users 
            WHERE username = 'admin' AND organization_id = 'commercial-bank'
        `);

        if (bankAdmin.rows.length > 0) {
            console.log('\n✅ Commercial Bank admin user already exists');
            console.log('Username: admin');
            console.log('Organization: commercial-bank');

            // Update password to known value
            const hashedPassword = await bcrypt.hash('password123', 10);
            await pool.query(`
                UPDATE users 
                SET password = $1 
                WHERE username = 'admin' AND organization_id = 'commercial-bank'
            `, [hashedPassword]);
            console.log('✅ Password reset to: password123');
        } else {
            console.log('\n⚠️  No commercial bank admin found. Creating one...');

            const hashedPassword = await bcrypt.hash('password123', 10);
            await pool.query(`
                INSERT INTO users (username, email, password, role, organization_id)
                VALUES ($1, $2, $3, $4, $5)
            `, ['admin', 'admin@commercialbank.com', hashedPassword, 'bank_admin', 'commercial-bank']);

            console.log('✅ Created commercial bank admin');
            console.log('Username: admin');
            console.log('Password: password123');
            console.log('Organization: commercial-bank');
        }

        console.log('\n=== Login Credentials Summary ===\n');
        console.log('Commercial Bank:');
        console.log('  Username: admin');
        console.log('  Password: password123');
        console.log('  Organization: commercial-bank');

    } catch (error) {
        console.error('Error:', error.message);
        console.error(error);
    } finally {
        await pool.end();
    }
}

setupBankUser();
