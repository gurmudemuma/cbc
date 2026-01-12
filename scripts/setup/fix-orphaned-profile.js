const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'coffee_export_db',
  user: 'postgres',
  password: 'postgres'
});

async function fixOrphanedProfile() {
  const client = await pool.connect();
  
  try {
    // Find orphaned profiles
    const orphaned = await client.query(`
      SELECT ep.exporter_id, ep.business_name, ep.user_id
      FROM exporter_profiles ep
      WHERE ep.user_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id::text = ep.user_id)
    `);
    
    console.log(`Found ${orphaned.rows.length} orphaned profile(s):\n`);
    
    for (const profile of orphaned.rows) {
      console.log(`❌ ${profile.business_name}`);
      console.log(`   Exporter ID: ${profile.exporter_id}`);
      console.log(`   Invalid User ID: ${profile.user_id}`);
      
      // Set user_id to NULL for orphaned profiles
      await client.query(`
        UPDATE exporter_profiles
        SET user_id = NULL
        WHERE exporter_id = $1
      `, [profile.exporter_id]);
      
      console.log(`   ✅ Fixed: Set user_id to NULL\n`);
    }
    
    if (orphaned.rows.length === 0) {
      console.log('✅ No orphaned profiles found');
    } else {
      console.log(`✅ Fixed ${orphaned.rows.length} orphaned profile(s)`);
    }
    
  } finally {
    client.release();
    await pool.end();
  }
}

fixOrphanedProfile().catch(console.error);
