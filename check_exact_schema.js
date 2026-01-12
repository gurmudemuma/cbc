const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'coffee_export_db',
    user: 'postgres',
    password: 'postgres'
});

async function checkExactSchema() {
    try {
        console.log('\n=== EXACT USERS TABLE SCHEMA ===\n');

        const schema = await pool.query(`
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns
            WHERE table_name = 'users'
            ORDER BY ordinal_position
        `);

        schema.rows.forEach(col => {
            console.log(`- ${col.column_name}: ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''}`);
        });

        console.log('\n=== SAMPLE USER DATA ===\n');
        const users = await pool.query(`SELECT * FROM users LIMIT 3`);
        if (users.rows.length > 0) {
            console.log('Sample user columns:', Object.keys(users.rows[0]));
            console.table(users.rows.map(u => ({
                id: u.id,
                username: u.username,
                email: u.email,
                role: u.role,
                has_password: u.password ? 'Yes' : 'No',
                has_password_hash: u.password_hash ? 'Yes' : 'No'
            })));
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkExactSchema();
