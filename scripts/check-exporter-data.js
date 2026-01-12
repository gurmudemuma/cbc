/**
 * Check Exporter Data Script
 * Verifies if exporter1 has data in the database
 */

const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'coffee_export_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function checkExporterData() {
  try {
    console.log('🔍 Checking exporter1 data...\n');

    // 1. Check if user exists
    console.log('1️⃣ Checking user account...');
    const userResult = await pool.query(
      'SELECT id, username, organization_id FROM users WHERE username = $1',
      ['exporter1']
    );

    if (userResult.rows.length === 0) {
      console.log('❌ User "exporter1" not found in database');
      console.log('   Please create the user first or use a different username\n');
      await pool.end();
      return;
    }

    const user = userResult.rows[0];
    console.log('✅ User found:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Organization: ${user.organization_id}\n`);

    // 2. Check if exporter profile exists
    console.log('2️⃣ Checking exporter profile...');
    const profileResult = await pool.query(
      'SELECT * FROM exporter_profiles WHERE user_id = $1',
      [user.id]
    );

    if (profileResult.rows.length === 0) {
      console.log('❌ No exporter profile found for this user');
      console.log('   Run: node cbc/scripts/seed-exporter-data.js');
      console.log('   Or: psql -U postgres -d coffee_export_db -f cbc/scripts/seed-exporter1-data.sql\n');
      await pool.end();
      return;
    }

    const profile = profileResult.rows[0];
    console.log('✅ Exporter profile found:');
    console.log(`   Exporter ID: ${profile.exporter_id}`);
    console.log(`   Business Name: ${profile.business_name}`);
    console.log(`   TIN: ${profile.tin}`);
    console.log(`   Status: ${profile.status}`);
    console.log(`   Registration Number: ${profile.registration_number}\n`);

    // 3. Check laboratory
    console.log('3️⃣ Checking laboratory...');
    const labResult = await pool.query(
      'SELECT laboratory_id, laboratory_name, status FROM coffee_laboratories WHERE exporter_id = $1',
      [profile.exporter_id]
    );

    if (labResult.rows.length === 0) {
      console.log('⚠️  No laboratory registered');
    } else {
      const lab = labResult.rows[0];
      console.log('✅ Laboratory found:');
      console.log(`   ID: ${lab.laboratory_id}`);
      console.log(`   Name: ${lab.laboratory_name}`);
      console.log(`   Status: ${lab.status}`);
    }
    console.log('');

    // 4. Check taster
    console.log('4️⃣ Checking taster...');
    const tasterResult = await pool.query(
      'SELECT taster_id, full_name, status FROM coffee_tasters WHERE exporter_id = $1',
      [profile.exporter_id]
    );

    if (tasterResult.rows.length === 0) {
      console.log('⚠️  No taster registered');
    } else {
      const taster = tasterResult.rows[0];
      console.log('✅ Taster found:');
      console.log(`   ID: ${taster.taster_id}`);
      console.log(`   Name: ${taster.full_name}`);
      console.log(`   Status: ${taster.status}`);
    }
    console.log('');

    // 5. Check competence certificate
    console.log('5️⃣ Checking competence certificate...');
    const competenceResult = await pool.query(
      'SELECT certificate_id, status FROM competence_certificates WHERE exporter_id = $1',
      [profile.exporter_id]
    );

    if (competenceResult.rows.length === 0) {
      console.log('⚠️  No competence certificate application');
    } else {
      const competence = competenceResult.rows[0];
      console.log('✅ Competence certificate found:');
      console.log(`   ID: ${competence.certificate_id}`);
      console.log(`   Status: ${competence.status}`);
    }
    console.log('');

    // 6. Check export license
    console.log('6️⃣ Checking export license...');
    const licenseResult = await pool.query(
      'SELECT license_id, status FROM export_licenses WHERE exporter_id = $1',
      [profile.exporter_id]
    );

    if (licenseResult.rows.length === 0) {
      console.log('⚠️  No export license application');
    } else {
      const license = licenseResult.rows[0];
      console.log('✅ Export license found:');
      console.log(`   ID: ${license.license_id}`);
      console.log(`   Status: ${license.status}`);
    }
    console.log('');

    // Summary
    console.log('📊 SUMMARY:');
    console.log('═══════════════════════════════════════════════════');
    console.log(`Business Name: ${profile.business_name}`);
    console.log(`Profile Status: ${profile.status}`);
    console.log(`Laboratory Status: ${labResult.rows.length > 0 ? labResult.rows[0].status : 'MISSING'}`);
    console.log(`Taster Status: ${tasterResult.rows.length > 0 ? tasterResult.rows[0].status : 'MISSING'}`);
    console.log(`Competence Status: ${competenceResult.rows.length > 0 ? competenceResult.rows[0].status : 'MISSING'}`);
    console.log(`License Status: ${licenseResult.rows.length > 0 ? licenseResult.rows[0].status : 'MISSING'}`);
    console.log('═══════════════════════════════════════════════════\n');

    const hasAllData = 
      profileResult.rows.length > 0 &&
      labResult.rows.length > 0 &&
      tasterResult.rows.length > 0 &&
      competenceResult.rows.length > 0 &&
      licenseResult.rows.length > 0;

    if (hasAllData) {
      console.log('✅ All data exists! The dashboard should display correctly.');
      console.log('   Navigate to: http://localhost:5173/my-applications');
    } else {
      console.log('⚠️  Some data is missing. Run the seed script:');
      console.log('   node cbc/scripts/seed-exporter-data.js');
    }

  } catch (error) {
    console.error('❌ Error checking data:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('   Database connection refused. Is PostgreSQL running?');
    }
  } finally {
    await pool.end();
  }
}

checkExporterData();
