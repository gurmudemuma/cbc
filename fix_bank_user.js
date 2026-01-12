const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'coffee_export_db',
    user: 'postgres',
    password: 'postgres'
});

async function fixBankUser() {
    try {
        console.log('\n=== Checking Users Table Columns ===\n');

        const columns = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns
            WHERE table_name = 'users'
            ORDER BY ordinal_position
        `);
        console.log('Available columns:', columns.rows.map(r => r.column_name).join(', '));

        console.log('\n=== Current Users ===\n');
        const users = await pool.query(`SELECT * FROM users`);
        console.table(users.rows);

        // Hash the password
        const hashedPassword = await bcrypt.hash('password123', 10);
        console.log('\n=== Creating/Updating Bank Admin ===\n');

        // Check if admin user exists
        const adminCheck = await pool.query(`SELECT * FROM users WHERE username = 'admin'`);

        if (adminCheck.rows.length > 0) {
            // Update existing admin user
            console.log('Admin user exists, updating password...');
            await pool.query(`
                UPDATE users 
                SET password = $1
                WHERE username = 'admin'
            `, [hashedPassword]);
            console.log('✅ Admin password updated to: password123');
        } else {
            // Create new admin user
            console.log('Creating new admin user...');
            await pool.query(`
                INSERT INTO users (username, email, password, role)
                VALUES ($1, $2, $3, $4)
            `, ['admin', 'admin@bank.com', hashedPassword, 'admin']);
            console.log('✅ Admin user created');
            console.log('   Username: admin');
            console.log('   Password: password123');
        }

        console.log('\n=== Final User List ===\n');
        const finalUsers = await pool.query(`SELECT id, username, email, role FROM users`);
        console.table(finalUsers.rows);

        console.log('\n✅ Setup complete!');
        console.log('\nYou can now login with:');
        console.log('  Username: admin');
        console.log('  Password: password123');
        console.log('  Organization: Commercial Bank (or any organization)');

    } catch (error) {
        console.error('Error:', error.message);
        console.error(error);
    } finally {
        await pool.end();
    }
}

fixBankUser();
