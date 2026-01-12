const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'coffee_export_db',
  user: 'postgres',
  password: 'postgres'
});

async function listUsers() {
  try {
    console.log('\n=== Existing Users in Database ===\n');
    
    const result = await pool.query(`
      SELECT username, email, role
      FROM users
      ORDER BY username
      LIMIT 20
    `);
    
    if (result.rows.length === 0) {
      console.log('No users found in database.');
    } else {
      result.rows.forEach((user, idx) => {
        console.log(`${idx + 1}. Username: ${user.username}`);
        console.log(`   Email: ${user.email || 'N/A'}`);
        console.log(`   Role: ${user.role || 'N/A'}`);
        console.log('');
      });
    }
    
    console.log(`Total users: ${result.rows.length}`);
    console.log('\n=== Update Test Script ===\n');
    console.log('Update test-ecta-complete.js and test-ecta-simple.js with:');
    console.log('  username: "<one of the usernames above>"');
    console.log('  password: "<the actual password>"');
    console.log('\nOr use the frontend to create a new ECTA user.\n');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

listUsers();
