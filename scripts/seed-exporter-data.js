/**
 * Seed Exporter Data Script
 * Creates test data for exporter1 if it doesn't exist
 */

const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'coffee_export_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

function generateId(prefix) {
  return `${prefix}-${crypto.randomBytes(4).toString('hex')}`;
}

async function seedExporterData() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🌱 Seeding exporter1 data...\n');

    // 1. Check if user exists
    console.log('1️⃣ Checking user account...');
    const userResult = await client.query(
      'SELECT id FROM users WHERE username = $1',
      ['exporter1']
    );

    if (userResult.rows.length === 0) {
      console.log('❌ User "exporter1" not found');
      console.log('   Please create the user first\n');
      await client.query('ROLLBACK');
      return;
    }

    const userId = userResult.rows[0].id;
    console.log(`✅ User found: ${userId}\n`);

    // 2. Check if profile already exists
    console.log('2️⃣ Checking exporter profile...');
    const existingProfile = await client.query(
      'SELECT exporter_id FROM exporter_profiles WHERE user_id = $1',
      [userId]
    );

    let exporterId;
    if (existingProfile.rows.length > 0) {
      exporterId = existingProfile.rows[0].exporter_id;
      console.log(`✅ Profile already exists: ${exporterId}\n`);
    } else {
      // Create exporter profile
      exporterId = generateId('EXP');
      const registrationNumber = `ECTA-PVT-2024-${Math.floor(1000 + Math.random() * 9000)}`;
      const tin = `TIN-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;

      await client.query(`
        INSERT INTO exporter_profiles (
          exporter_id, user_id, business_name, tin, registration_number,
          business_type, minimum_capital, capital_verified,
          office_address, city, region, contact_person, email, phone,
          status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
      `, [
        exporterId,
        userId,
        'Test Coffee Exporter Ltd',
        tin,
        registrationNumber,
        'PRIVATE',
        15000000,
        true,
        'Bole Road, Addis Ababa',
        'Addis Ababa',
        'Addis Ababa',
        'John Doe',
        'exporter1@example.com',
        '+251911234567',
        'PENDING_APPROVAL'
      ]);

      console.log(`✅ Created profile: ${exporterId}`);
      console.log(`   Business: Test Coffee Exporter Ltd`);
      console.log(`   TIN: ${tin}`);
      console.log(`   Registration: ${registrationNumber}\n`);
    }

    // 3. Create laboratory if doesn't exist
    console.log('3️⃣ Checking laboratory...');
    const existingLab = await client.query(
      'SELECT laboratory_id FROM coffee_laboratories WHERE exporter_id = $1',
      [exporterId]
    );

    let laboratoryId;
    if (existingLab.rows.length > 0) {
      laboratoryId = existingLab.rows[0].laboratory_id;
      console.log(`✅ Laboratory already exists: ${laboratoryId}\n`);
    } else {
      laboratoryId = generateId('LAB');
      
      await client.query(`
        INSERT INTO coffee_laboratories (
          laboratory_id, exporter_id, laboratory_name, address, city, region,
          equipment, has_roasting_facility, has_cupping_room, has_sample_storage,
          status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      `, [
        laboratoryId,
        exporterId,
        'Test Coffee Laboratory',
        'Industrial Area, Addis Ababa',
        'Addis Ababa',
        'Addis Ababa',
        ['Roaster', 'Cupping Table', 'Moisture Meter', 'Sample Storage'],
        true,
        true,
        true,
        'PENDING'
      ]);

      console.log(`✅ Created laboratory: ${laboratoryId}\n`);
    }

    // 4. Create taster if doesn't exist
    console.log('4️⃣ Checking taster...');
    const existingTaster = await client.query(
      'SELECT taster_id FROM coffee_tasters WHERE exporter_id = $1',
      [exporterId]
    );

    let tasterId;
    if (existingTaster.rows.length > 0) {
      tasterId = existingTaster.rows[0].taster_id;
      console.log(`✅ Taster already exists: ${tasterId}\n`);
    } else {
      tasterId = generateId('TASTER');
      const nationalId = `ID-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
      const certNumber = `QG-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;

      await client.query(`
        INSERT INTO coffee_tasters (
          taster_id, exporter_id, full_name, date_of_birth, national_id,
          qualification_level, proficiency_certificate_number,
          certificate_issue_date, certificate_expiry_date,
          employment_start_date, is_exclusive_employee,
          status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      `, [
        tasterId,
        exporterId,
        'Jane Smith',
        '1985-05-15',
        nationalId,
        'Q Grader',
        certNumber,
        new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
        new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000), // 2 years from now
        new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 6 months ago
        true,
        'PENDING'
      ]);

      console.log(`✅ Created taster: ${tasterId}\n`);
    }

    // 5. Create competence certificate if doesn't exist
    console.log('5️⃣ Checking competence certificate...');
    const existingCompetence = await client.query(
      'SELECT certificate_id FROM competence_certificates WHERE exporter_id = $1',
      [exporterId]
    );

    let competenceId;
    if (existingCompetence.rows.length > 0) {
      competenceId = existingCompetence.rows[0].certificate_id;
      console.log(`✅ Competence certificate already exists: ${competenceId}\n`);
    } else {
      competenceId = generateId('COMP');

      await client.query(`
        INSERT INTO competence_certificates (
          certificate_id, exporter_id, laboratory_id, taster_id,
          application_date, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, NOW(), $5, NOW(), NOW())
      `, [
        competenceId,
        exporterId,
        laboratoryId,
        tasterId,
        'PENDING'
      ]);

      console.log(`✅ Created competence certificate: ${competenceId}\n`);
    }

    // 6. Create export license if doesn't exist
    console.log('6️⃣ Checking export license...');
    const existingLicense = await client.query(
      'SELECT license_id FROM export_licenses WHERE exporter_id = $1',
      [exporterId]
    );

    let licenseId;
    if (existingLicense.rows.length > 0) {
      licenseId = existingLicense.rows[0].license_id;
      console.log(`✅ Export license already exists: ${licenseId}\n`);
    } else {
      licenseId = generateId('LIC');
      const eicNumber = `EIC-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;

      await client.query(`
        INSERT INTO export_licenses (
          license_id, exporter_id, competence_certificate_id,
          eic_registration_number, requested_coffee_types, requested_origins,
          application_date, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, NOW(), NOW())
      `, [
        licenseId,
        exporterId,
        competenceId,
        eicNumber,
        ['ARABICA', 'ROBUSTA'],
        ['SIDAMA', 'YIRGACHEFFE', 'HARRAR'],
        'PENDING_REVIEW'
      ]);

      console.log(`✅ Created export license: ${licenseId}\n`);
    }

    await client.query('COMMIT');

    console.log('═══════════════════════════════════════════════════');
    console.log('✅ Data seeding complete!');
    console.log('═══════════════════════════════════════════════════');
    console.log(`Exporter ID: ${exporterId}`);
    console.log(`Laboratory ID: ${laboratoryId}`);
    console.log(`Taster ID: ${tasterId}`);
    console.log(`Competence ID: ${competenceId}`);
    console.log(`License ID: ${licenseId}`);
    console.log('═══════════════════════════════════════════════════\n');
    console.log('🎉 You can now login as exporter1 and view the dashboard!');
    console.log('   URL: http://localhost:5173/my-applications\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding data:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

seedExporterData();
