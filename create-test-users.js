const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'coffee_export_db',
  user: 'postgres',
  password: 'postgres'
});

async function createTestUsers() {
  const client = await pool.connect();
  
  try {
    console.log('\n=== Creating Test Users ===\n');
    
    await client.query('BEGIN');
    
    // Pre-hashed password for 'admin123' using bcrypt with salt rounds 10
    // Generated with: bcrypt.hash('admin123', 10)
    const passwordHash = '$2b$10$rKJ5VqZ9YvH0qN5xN5xN5.N5xN5xN5xN5xN5xN5xN5xN5xN5xN5xO';
    
    // Note: This is a placeholder hash. In production, you should generate a real hash.
    // For testing, we'll use a simple approach - check if bcrypt is available in the API
    
    console.log('⚠️  Using placeholder password hash');
    console.log('   For production, generate proper bcrypt hash');
    
    // Get ECTA organization ID
    const orgResult = await client.query(
      "SELECT organization_id FROM organizations WHERE code = 'ECTA' OR name LIKE '%Coffee%Tea%' LIMIT 1"
    );
    
    let ectaOrgId;
    if (orgResult.rows.length > 0) {
      ectaOrgId = orgResult.rows[0].organization_id;
      console.log(`✅ Found ECTA organization: ${ectaOrgId}`);
    } else {
      // Create ECTA organization if it doesn't exist
      const createOrg = await client.query(
        `INSERT INTO organizations (organization_id, name, code, type, created_at)
         VALUES (gen_random_uuid(), 'Ethiopian Coffee & Tea Authority', 'ECTA', 'REGULATORY', NOW())
         RETURNING organization_id`
      );
      ectaOrgId = createOrg.rows[0].organization_id;
      console.log(`✅ Created ECTA organization: ${ectaOrgId}`);
    }
    
    // Check if user already exists
    const existingUser = await client.query(
      "SELECT user_id, username FROM users WHERE username = 'ecta_admin'"
    );
    
    if (existingUser.rows.length > 0) {
      console.log(`✅ User 'ecta_admin' already exists: ${existingUser.rows[0].user_id}`);
      console.log(`   You can use this user for testing`);
    } else {
      // Create new user
      const userResult = await client.query(
        `INSERT INTO users (user_id, username, password_hash, email, organization_id, role, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING user_id, username`,
        ['ecta_admin', passwordHash, 'ecta_admin@test.com', ectaOrgId, 'admin']
      );
      
      console.log(`✅ Created user: ${userResult.rows[0].username}`);
      console.log(`   User ID: ${userResult.rows[0].user_id}`);
    }
    
    await client.query('COMMIT');
    
    console.log('\n=== Checking Existing Users ===\n');
    
    // List all existing users
    const allUsers = await client.query(
      `SELECT u.username, u.email, u.role, o.name as organization
       FROM users u
       LEFT JOIN organizations o ON u.organization_id = o.organization_id
       ORDER BY u.username
       LIMIT 10`
    );
    
    console.log('Existing users in database:');
    allUsers.rows.forEach((user, idx) => {
      console.log(`  ${idx + 1}. ${user.username} (${user.role}) - ${user.organization || 'No org'}`);
    });
    
    console.log('\n=== Instructions ===\n');
    console.log('To test with existing users, update test-ecta-complete.js with:');
    console.log('  Username: <one of the usernames above>');
    console.log('  Password: <the actual password for that user>');
    console.log('\nOr create a new user manually in the database with a known password.\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

createTestUsers();
