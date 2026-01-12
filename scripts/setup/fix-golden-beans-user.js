const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'coffee_export_db',
  user: 'postgres',
  password: 'postgres'
});

async function fixGoldenBeansUser() {
  const client = await pool.connect();
  
  try {
    const exporterId = '7aeaa77e-5188-4175-8be9-e3086fe37386';
    
    console.log('Fixing Golden Beans Export PLC user association...\n');
    
    // Check if a user already exists for this exporter
    const existingUser = await client.query(`
      SELECT id, username FROM users 
      WHERE organization_id = 'GOLDEN_BEANS' OR username = 'goldenbeans'
    `);
    
    if (existingUser.rows.length > 0) {
      console.log('✅ Found existing user:', existingUser.rows[0].username);
      console.log('   User ID:', existingUser.rows[0].id);
      
      // Update exporter profile with correct user_id
      await client.query(`
        UPDATE exporter_profiles
        SET user_id = $1
        WHERE exporter_id = $2
      `, [existingUser.rows[0].id.toString(), exporterId]);
      
      console.log('✅ Updated exporter profile with correct user_id\n');
    } else {
      console.log('No existing user found. Creating new user...');
      
      // Use a simple hash for now (in production, use bcrypt)
      const simpleHash = '$2b$10$YourHashHere'; // Placeholder
      
      // Create new user
      const newUser = await client.query(`
        INSERT INTO users (username, password_hash, email, role, organization_id, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, username
      `, [
        'goldenbeans',
        simpleHash,
        'abebe@goldenbeans.com',
        'exporter',
        'GOLDEN_BEANS',
        true
      ]);
      
      console.log('✅ Created user:', newUser.rows[0].username);
      console.log('   User ID:', newUser.rows[0].id);
      
      // Update exporter profile
      await client.query(`
        UPDATE exporter_profiles
        SET user_id = $1
        WHERE exporter_id = $2
      `, [newUser.rows[0].id.toString(), exporterId]);
      
      console.log('✅ Linked user to exporter profile\n');
    }
    
    // Verify the fix
    const verification = await client.query(`
      SELECT ep.business_name, ep.user_id, u.username
      FROM exporter_profiles ep
      LEFT JOIN users u ON u.id::text = ep.user_id
      WHERE ep.exporter_id = $1
    `, [exporterId]);
    
    console.log('Verification:');
    console.log('   Business:', verification.rows[0].business_name);
    console.log('   User ID:', verification.rows[0].user_id);
    console.log('   Username:', verification.rows[0].username || '❌ NOT LINKED');
    
    if (verification.rows[0].username) {
      console.log('\n✅ Golden Beans Export PLC is now properly linked!');
    }
    
  } finally {
    client.release();
    await pool.end();
  }
}

fixGoldenBeansUser().catch(console.error);
