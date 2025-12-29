const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

// Database configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'coffee_export_db',
  password: 'postgres',
  port: 5432,
});

async function seedDashboardData() {
  const client = await pool.connect();

  try {
    console.log('🌱 starting seed process...');

    // 0. Cleanup
    await client.query('DELETE FROM export_licenses WHERE license_number = $1', ['LIC-2025-555']);
    await client.query('DELETE FROM competence_certificates WHERE certificate_number = $1', ['COMP-2025-777']);
    await client.query('DELETE FROM coffee_tasters WHERE proficiency_certificate_number = $1', ['Q-2025-888']);
    await client.query('DELETE FROM coffee_laboratories WHERE certification_number = $1', ['LAB-CERT-2025-001']);
    await client.query('DELETE FROM exporter_profiles WHERE registration_number = $1', ['ECTA-PVT-2025-9999']);

    // 1. Create User
    const userId = uuidv4();
    const currentDate = new Date().toISOString();
    const nextYear = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString();

    // 2. Create Exporter Profile
    const exporterId = uuidv4();
    const tin = 'TIN-' + Math.floor(Math.random() * 1000000);
    const regNum = 'ECTA-PVT-2025-9999';

    console.log(`Creating Exporter: ${exporterId}`);

    await client.query(`
      INSERT INTO exporter_profiles (
        exporter_id, user_id, business_name, tin, registration_number, 
        business_type, minimum_capital, capital_verified, capital_verification_date,
        office_address, city, region, contact_person, email, phone, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    `, [
      exporterId,
      userId,
      'Golden Beans Export PLC',
      tin,
      regNum,
      'PRIVATE',
      2000000.00,
      true,
      currentDate,
      'Bole Sub-city, Woreda 03',
      'Addis Ababa',
      'Addis Ababa',
      'Abebe Kebede',
      'abebe@goldenbeans.com',
      '+251911223344',
      'ACTIVE'
    ]);

    // 3. Create Certified Laboratory
    const labId = uuidv4();
    await client.query(`
      INSERT INTO coffee_laboratories (
        laboratory_id, exporter_id, laboratory_name, address,
        equipment, last_inspection_date, inspected_by,
        certification_number, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      labId,
      exporterId,
      'Golden Quality Lab',
      'Kality Industrial Zone',
      JSON.stringify(['Moisture Meter', 'Sample Roaster', 'Cupping Table']),
      currentDate,
      'Inspector Tadesse',
      'LAB-CERT-2025-001',
      'ACTIVE'
    ]);

    // 4. Create Certified Taster
    const tasterId = uuidv4();
    await client.query(`
      INSERT INTO coffee_tasters (
        taster_id, exporter_id, full_name,
        qualification_level, proficiency_certificate_number,
        certificate_issue_date, certificate_expiry_date,
        employment_start_date, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      tasterId,
      exporterId,
      'Sara Mohammed',
      'CERTIFICATE',
      'Q-2025-888',
      currentDate,
      nextYear,
      currentDate,
      'ACTIVE'
    ]);

    // 5. Create Competence Certificate
    const certId = uuidv4();
    await client.query(`
      INSERT INTO competence_certificates (
        certificate_id, exporter_id, certificate_number,
        issued_date, expiry_date, status, approved_at, approved_by,
        laboratory_id, taster_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      certId,
      exporterId,
      'COMP-2025-777',
      currentDate,
      nextYear,
      'ACTIVE',
      currentDate,
      'ECTA-ADMIN',
      labId,
      tasterId
    ]);

    // 6. Create Export License
    const licenseId = uuidv4();
    await client.query(`
      INSERT INTO export_licenses (
        license_id, exporter_id, license_number, eic_registration_number,
        issued_date, expiry_date, status, approved_at, approved_by,
        authorized_coffee_types, authorized_origins
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [
      licenseId,
      exporterId,
      'LIC-2025-555',
      'EIC-REG-2025-333',
      currentDate,
      nextYear,
      'ACTIVE',
      currentDate,
      'MIT-ADMIN',
      JSON.stringify(['ARABICA', 'ROBUSTA']),
      JSON.stringify(['SIDAMA', 'YIRGACHEFFE'])
    ]);

    console.log('✅ Seed Data Created Successfully!');
    console.log('------------------------------------------------');
    console.log(`Exporter ID: ${exporterId}`);
    console.log(`TIN:         ${tin}`);
    console.log(`Reg Number:  ${regNum}`);
    console.log('------------------------------------------------');
    console.log('You can now test the 360-View Dashboard with these credentials.');

  } catch (err) {
    console.error('Error seeding data:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

seedDashboardData();
