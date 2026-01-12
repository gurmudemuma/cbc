const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'coffee_export_db',
    user: 'postgres',
    password: 'postgres'
});

async function checkUsers() {
    try {
        console.log('\n=== ALL USERS IN DATABASE ===\n');
        const allUsers = await pool.query(`
      SELECT id, username, email, role, organization_id, created_at 
      FROM users 
      ORDER BY organization_id, username
    `);
        console.table(allUsers.rows);

        console.log('\n=== COMMERCIAL BANK USERS ===\n');
        const bankUsers = await pool.query(`
      SELECT id, username, email, role, organization_id 
      FROM users 
      WHERE organization_id = 'commercial-bank'
    `);
        console.table(bankUsers.rows);

        console.log('\n=== EXPORTER PORTAL USERS ===\n');
        const exporterUsers = await pool.query(`
      SELECT id, username, email, role, organization_id 
      FROM users 
      WHERE organization_id = 'exporter-portal'
    `);
        console.table(exporterUsers.rows);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkUsers();
