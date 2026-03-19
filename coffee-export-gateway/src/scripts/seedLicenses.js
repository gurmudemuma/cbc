/**
 * Seed Export Licenses Script
 * Creates complete qualification chain: Laboratory → Taster → Competence Certificate → Export License
 * Ensures licenses are properly issued with all prerequisites
 */

require('dotenv').config();
const { Pool } = require('pg');

const dbConfig = {
  host: process.env.POSTGRES_HOST || process.env.DB_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || process.env.DB_PORT || 5432,
  database: process.env.POSTGRES_DB || process.env.DB_NAME || 'coffee_export_db',
  user: process.env.POSTGRES_USER || process.env.DB_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD || 'postgres'
};

const pool = new Pool(dbConfig);

async function seedQualifications() {
  try {
    console.log('[Qualifications] Connecting to database...');
    const client = await pool.connect();

    // Get all active exporter profiles
    const exportersResult = await client.query(
      'SELECT exporter_id, user_id FROM exporter_profiles WHERE status = $1 LIMIT 2',
      ['ACTIVE']
    );

    if (exportersResult.rows.length === 0) {
      console.log('[Qualifications] No active exporters found');
      client.release();
      return;
    }

    console.log(`[Qualifications] Found ${exportersResult.rows.length} active exporters`);

    // Create full qualification chain for each exporter
    for (const exporter of exportersResult.rows) {
      try {
        // 1. Get or create Laboratory
        let labResult = await client.query(
          'SELECT laboratory_id FROM coffee_laboratories WHERE exporter_id = $1 AND status = $2 LIMIT 1',
          [exporter.exporter_id, 'ACTIVE']
        );
        
        let actualLabId;
        if (labResult.rows.length > 0) {
          actualLabId = labResult.rows[0].laboratory_id;
          console.log(`[Qualifications] ✓ Using existing laboratory for ${exporter.user_id}`);
        } else {
          const labId = require('crypto').randomUUID();
          labResult = await client.query(`
            INSERT INTO coffee_laboratories (
              laboratory_id, exporter_id, laboratory_name, address, 
              certification_number, certified_date, expiry_date, status,
              has_roasting_facility, has_cupping_room, has_sample_storage
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING laboratory_id
          `, [
            labId, exporter.exporter_id, `Lab-${exporter.user_id}`, 'Addis Ababa',
            `CERT-LAB-${Date.now()}`, new Date(), new Date(Date.now() + 365*24*60*60*1000), 'ACTIVE',
            true, true, true
          ]);
          if (labResult.rows.length === 0) {
            console.log(`[Qualifications] ERROR: Lab insert returned no rows for ${exporter.user_id}`);
            throw new Error('Lab insert failed - no RETURNING result');
          }
          actualLabId = labResult.rows[0].laboratory_id;
          console.log(`[Qualifications] ✓ Created laboratory ${actualLabId} for ${exporter.user_id}`);
        }

        // 2. Get or create Taster
        let tasterResult = await client.query(
          'SELECT taster_id FROM coffee_tasters WHERE exporter_id = $1 AND status = $2 LIMIT 1',
          [exporter.exporter_id, 'ACTIVE']
        );
        
        let actualTasterId;
        if (tasterResult.rows.length > 0) {
          actualTasterId = tasterResult.rows[0].taster_id;
          console.log(`[Qualifications] ✓ Using existing taster for ${exporter.user_id}`);
        } else {
          const tasterId = require('crypto').randomUUID();
          tasterResult = await client.query(`
            INSERT INTO coffee_tasters (
              taster_id, exporter_id, full_name, date_of_birth, national_id,
              qualification_level, proficiency_certificate_number, certificate_issue_date,
              certificate_expiry_date, employment_start_date, is_exclusive_employee, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING taster_id
          `, [
            tasterId, exporter.exporter_id, `Taster-${exporter.user_id}`, '1990-01-01', 'ID123456',
            'CERTIFICATE', `PROF-CERT-${Date.now()}`, new Date(), 
            new Date(Date.now() + 365*24*60*60*1000), new Date(), true, 'ACTIVE'
          ]);
          if (tasterResult.rows.length === 0) {
            console.log(`[Qualifications] ERROR: Taster insert returned no rows for ${exporter.user_id}`);
            throw new Error('Taster insert failed - no RETURNING result');
          }
          actualTasterId = tasterResult.rows[0].taster_id;
          console.log(`[Qualifications] ✓ Created taster ${actualTasterId} for ${exporter.user_id}`);
        }

        // 3. Get or create Competence Certificate
        let certResult = await client.query(
          'SELECT certificate_id FROM competence_certificates WHERE exporter_id = $1 AND status = $2 LIMIT 1',
          [exporter.exporter_id, 'ACTIVE']
        );
        
        let actualCertId;
        if (certResult.rows.length > 0) {
          actualCertId = certResult.rows[0].certificate_id;
          console.log(`[Qualifications] ✓ Using existing competence certificate for ${exporter.user_id}`);
        } else {
          const certId = require('crypto').randomUUID();
          console.log(`[Qualifications] DEBUG: Inserting cert with lab=${actualLabId}, taster=${actualTasterId}`);
          certResult = await client.query(`
            INSERT INTO competence_certificates (
              certificate_id, exporter_id, certificate_number, issued_date, expiry_date,
              status, laboratory_id, taster_id, facility_inspection_date, inspection_passed,
              has_quality_management_system, approved_by, approved_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING certificate_id
          `, [
            certId, exporter.exporter_id, `COMP-CERT-${Date.now()}`, new Date(),
            new Date(Date.now() + 365*24*60*60*1000), 'ACTIVE', actualLabId, actualTasterId,
            new Date(), true, true, 'admin', new Date()
          ]);
          actualCertId = certResult.rows[0].certificate_id;
          console.log(`[Qualifications] ✓ Created competence certificate for ${exporter.user_id}`);
        }

        // 4. Create Export License (only after competence certificate)
        const licenseNumber = `EXP-LIC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await client.query(`
          INSERT INTO export_licenses (
            exporter_id, license_number, issued_date, expiry_date, status,
            competence_certificate_id, eic_registration_number, approved_by, approved_at,
            authorized_coffee_types, authorized_origins, annual_quota
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (license_number) DO NOTHING
        `, [
          exporter.exporter_id, licenseNumber, new Date(),
          new Date(Date.now() + 365*24*60*60*1000), 'ACTIVE',
          actualCertId, `EIC-${exporter.user_id.toUpperCase()}`, 'admin', new Date(),
          JSON.stringify(['ARABICA', 'ROBUSTA']),
          JSON.stringify(['SIDAMA', 'YIRGACHEFFE', 'HARRAR']), 100000
        ]);
        console.log(`[Qualifications] ✓ Created export license ${licenseNumber} for ${exporter.user_id}`);

      } catch (err) {
        console.log(`[Qualifications] Skipped ${exporter.user_id}: ${err.message}`);
      }
    }

    client.release();
    console.log('[Qualifications] Seeding complete');
    process.exit(0);
  } catch (error) {
    console.error('[Qualifications] Error:', error);
    process.exit(1);
  }
}

seedQualifications();
