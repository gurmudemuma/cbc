/**
 * Debug User Mapping Script
 * Checks if the JWT user ID matches the database user_id
 */

const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'coffee_export_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function debugUserMapping() {
  try {
    console.log('🔍 Debugging user mapping for exporter1...\n');

    // 1. Get user from users table
    console.log('1️⃣ Checking users table...');
    const userResult = await pool.query(
      'SELECT id, username, organization_id FROM users WHERE username = $1',
      ['exporter1']
    );

    if (userResult.rows.length === 0) {
      console.log('❌ User "exporter1" not found\n');
      await pool.end();
      return;
    }

    const user = userResult.rows[0];
    console.log('✅ User found:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Type: ${typeof user.id}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Organization: ${user.organization_id}\n`);

    // 2. Check exporter_profiles with this user_id
    console.log('2️⃣ Checking exporter_profiles table...');
    const profileResult = await pool.query(
      'SELECT exporter_id, user_id, business_name FROM exporter_profiles WHERE user_id = $1',
      [user.id]
    );

    if (profileResult.rows.length === 0) {
      console.log('❌ No profile found with user_id:', user.id);
      console.log('   Checking if user_id is stored as string...\n');
      
      // Try as string
      const profileStringResult = await pool.query(
        'SELECT exporter_id, user_id, business_name FROM exporter_profiles WHERE user_id = $1',
        [String(user.id)]
      );
      
      if (profileStringResult.rows.length > 0) {
        console.log('✅ Found profile with string user_id!');
        console.log(`   Exporter ID: ${profileStringResult.rows[0].exporter_id}`);
        console.log(`   User ID in DB: ${profileStringResult.rows[0].user_id}`);
        console.log(`   Type: ${typeof profileStringResult.rows[0].user_id}\n`);
      } else {
        console.log('❌ Still no profile found\n');
        
        // Show all profiles to debug
        console.log('3️⃣ Showing all exporter profiles...');
        const allProfiles = await pool.query(
          'SELECT exporter_id, user_id, business_name FROM exporter_profiles LIMIT 5'
        );
        console.log('Profiles in database:');
        allProfiles.rows.forEach(p => {
          console.log(`   - Exporter: ${p.business_name}`);
          console.log(`     User ID: ${p.user_id} (type: ${typeof p.user_id})`);
          console.log(`     Exporter ID: ${p.exporter_id}`);
        });
      }
    } else {
      const profile = profileResult.rows[0];
      console.log('✅ Profile found:');
      console.log(`   Exporter ID: ${profile.exporter_id}`);
      console.log(`   User ID in DB: ${profile.user_id}`);
      console.log(`   Type: ${typeof profile.user_id}`);
      console.log(`   Business Name: ${profile.business_name}\n`);
      
      console.log('✅ Mapping is correct! The API should work.');
    }

    // 4. Check the data type mismatch
    console.log('\n4️⃣ Checking for type mismatches...');
    const typeCheckResult = await pool.query(`
      SELECT 
        u.id as user_id,
        u.username,
        ep.exporter_id,
        ep.user_id as profile_user_id,
        ep.business_name,
        CASE 
          WHEN u.id::text = ep.user_id::text THEN 'MATCH'
          ELSE 'MISMATCH'
        END as match_status
      FROM users u
      LEFT JOIN exporter_profiles ep ON u.id::text = ep.user_id::text
      WHERE u.username = 'exporter1'
    `);

    if (typeCheckResult.rows.length > 0) {
      const result = typeCheckResult.rows[0];
      console.log('Match Status:', result.match_status);
      if (result.match_status === 'MATCH') {
        console.log('✅ User ID and Profile User ID match when cast to text');
      } else {
        console.log('❌ User ID and Profile User ID do NOT match');
        console.log(`   User ID: ${result.user_id}`);
        console.log(`   Profile User ID: ${result.profile_user_id}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

debugUserMapping();
