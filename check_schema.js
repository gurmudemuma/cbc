const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'coffee_export_db',
    user: 'postgres',
    password: 'postgres'
});

async function checkSchema() {
    try {
        console.log('\n=== USERS TABLE SCHEMA ===\n');

        const schema = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'users'
            ORDER BY ordinal_position
        `);
        console.table(schema.rows);

        console.log('\n=== ALL USERS ===\n');
        const users = await pool.query(`SELECT * FROM users LIMIT 10`);
        console.table(users.rows);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkSchema();
