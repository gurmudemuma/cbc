/**
 * Sync Qualifications to Blockchain
 * Syncs PostgreSQL qualification data to Hyperledger Fabric
 */

require('dotenv').config();
const { Pool } = require('pg');

const dbConfig = {
  host: process.env.DB_HOST || 'postgres',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'coffee_export_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
};

const pool = new Pool(dbConfig);
let fabricService;

async function syncQualificationsToBlockchain() {
  try {
    console.log('\n========================================');
    console.log('  SYNCING QUALIFICATIONS TO BLOCKCHAIN');
    console.log('========================================\n');

    // Load Fabric service
    try {
      fabricService = require('../services');
      console.log('✓ Fabric service loaded\n');
    } catch (error) {
      console.error('✗ Failed to load Fabric service:', error.message);
      console.log('  Blockchain not available - running in PostgreSQL-only mode\n');
      process.exit(0);
    }

    // Get all exporter profiles with qualifications
    const query = `
      SELECT 
        ep.exporter_id,
        ep.user_id,
        ep.business_name,
        ep.tin,
        ep.status as profile_status,
        cl.certification_number as lab_cert,
        cl.status as lab_status,
        ct.proficiency_certificate_number as taster_cert,
        ct.status as taster_status,
        cc.certificate_number as competence_cert,
        cc.status as competence_status,
        el.license_number,
        el.status as license_status
      FROM exporter_profiles ep
      LEFT JOIN coffee_laboratories cl ON ep.exporter_id = cl.exporter_id
      LEFT JOIN coffee_tasters ct ON ep.exporter_id = ct.exporter_id
      LEFT JOIN competence_certificates cc ON ep.exporter_id = cc.exporter_id
      LEFT JOIN export_licenses el ON ep.exporter_id = el.exporter_id
      ORDER BY ep.user_id
    `;

    const result = await pool.query(query);
    console.log(`Found ${result.rows.length} exporter profiles to sync\n`);

    let synced = 0;
    let skipped = 0;
    let errors = 0;

    for (const row of result.rows) {
      try {
        console.log(`Syncing: ${row.user_id} (${row.business_name})...`);

        // Build qualification data
        const qualificationData = {
          exporterId: row.user_id,
          businessName: row.business_name,
          tin: row.tin,
          preRegistrationStatus: {
            profile: {
              status: row.profile_status,
              approved: row.profile_status === 'ACTIVE'
            },
            laboratory: {
              status: row.lab_status || 'MISSING',
              certified: row.lab_status === 'ACTIVE',
              certificationNumber: row.lab_cert
            },
            taster: {
              status: row.taster_status || 'MISSING',
              verified: row.taster_status === 'ACTIVE',
              certificateNumber: row.taster_cert
            },
            competenceCertificate: {
              status: row.competence_status || 'MISSING',
              valid: row.competence_status === 'ACTIVE',
              certificateNumber: row.competence_cert
            },
            license: {
              status: row.license_status || 'MISSING',
              valid: row.license_status === 'ACTIVE',
              licenseNumber: row.license_number
            }
          },
          isQualified: row.profile_status === 'ACTIVE' && 
                      row.lab_status === 'ACTIVE' && 
                      row.taster_status === 'ACTIVE' && 
                      row.competence_status === 'ACTIVE' && 
                      row.license_status === 'ACTIVE',
          updatedAt: new Date().toISOString()
        };

        // Submit to blockchain
        await fabricService.submitTransaction(
          'admin',
          process.env.CHAINCODE_NAME || 'ecta',
          'UpdateExporterProfile',
          row.user_id,
          JSON.stringify(qualificationData)
        );

        console.log(`  ✓ Synced to blockchain`);
        synced++;
      } catch (error) {
        console.error(`  ✗ Error:`, error.message);
        errors++;
      }
    }

    console.log('\n========================================');
    console.log('  SYNC COMPLETE');
    console.log('========================================\n');
    console.log(`Synced: ${synced} profiles`);
    console.log(`Skipped: ${skipped} profiles`);
    if (errors > 0) {
      console.log(`Errors: ${errors}`);
    }
    console.log('\n');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Sync failed:', error);
    process.exit(1);
  }
}

syncQualificationsToBlockchain();
