const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'coffee_export_db',
    user: 'postgres',
    password: 'postgres'
});

async function fixExistingUsers() {
    try {
        console.log('\n=== CURRENT USERS ===\n');
        const current = await pool.query(`
            SELECT id, username, email, role, organization_id 
            FROM users 
            ORDER BY organization_id, username
        `);
        console.table(current.rows);

        const hashedPassword = await bcrypt.hash('password123', 10);

        // Update ALL existing users to have the correct password
        console.log('\n=== Updating all user passwords to "password123" ===\n');
        await pool.query(`
            UPDATE users 
            SET password_hash = $1
        `, [hashedPassword]);
        console.log('✅ All user passwords updated');

        // Check if we need to create bank-specific users
        const bankUsers = await pool.query(`
            SELECT * FROM users 
            WHERE organization_id IN ('commercial-bank', 'national-bank')
        `);

        if (bankUsers.rows.length === 0) {
            console.log('\n⚠️  No bank users found. Creating bank-specific admin users...\n');

            // Create commercial bank admin with unique username
            await pool.query(`
                INSERT INTO users (username, email, password_hash, organization_id, role, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
            `, ['bankadmin', 'admin@commercialbank.com', hashedPassword, 'commercial-bank', 'bank_admin']);
            console.log('✅ Commercial Bank admin created (username: bankadmin)');

            // Create national bank admin with unique username
            await pool.query(`
                INSERT INTO users (username, email, password_hash, organization_id, role, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
            `, ['nbeadmin', 'admin@nbe.gov.et', hashedPassword, 'national-bank', 'nbe_admin']);
            console.log('✅ National Bank admin created (username: nbeadmin)');
        } else {
            console.log('\n✅ Bank users already exist');
        }

        console.log('\n=== FINAL USER LIST ===\n');
        const final = await pool.query(`
            SELECT username, email, role, organization_id 
            FROM users 
            ORDER BY organization_id, username
        `);
        console.table(final.rows);

        console.log('\n╔══════════════════════════════════════════════════════════╗');
        console.log('║              LOGIN CREDENTIALS SUMMARY                   ║');
        console.log('╚══════════════════════════════════════════════════════════╝\n');

        console.log('🔑 ALL USERS NOW HAVE PASSWORD: password123\n');

        console.log('To login, select the appropriate organization and use:');
        console.log('  - Exporter Portal: Use existing exporter usernames (exporter1, etc.)');
        console.log('  - Commercial Bank: Use "bankadmin" or "admin"');
        console.log('  - National Bank: Use "nbeadmin" or "admin"');
        console.log('  - Other orgs: Use "admin" or check the table above\n');

        console.log('✅ Password reset complete!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        await pool.end();
    }
}

fixExistingUsers();
