/**
 * Sync Exporter Profiles from PostgreSQL to Blockchain
 * This ensures exporter_profiles records exist on blockchain for sales contract workflow
 */

require('dotenv').config();
const { Pool } = require('pg');
const fabricService = require('../services/fabric-cli-final');

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: 'coffee_export_db',
  user: 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres'
});

async function syncExporterProfiles() {
  console.log('\n========================================');
  console.log('  SYNCING EXPORTER PROFILES TO BLOCKCHAIN');
  console.log('========================================\n');

  try {
    // Get all ACTIVE exporters
    const result = await pool.query(`
      SELECT 
        exporter_id,
        business_name,
        tin,
        registration_number,
        minimum_capital,
        status
      FROM exporter_profiles
      WHERE status = 'ACTIVE'
      ORDER BY created_at
    `);

    console.log(`Found ${result.rows.length} ACTIVE exporters in database\n`);

    let synced = 0;
    let skipped = 0;
    let errors = 0;

    for (const exporter of result.rows) {
      console.log(`Processing: ${exporter.business_name}`);
      console.log(`  ID: ${exporter.exporter_id}`);

      // Check if already exists on blockchain
      try {
        await fabricService.queryChaincode('GetExporterProfile', exporter.exporter_id);
        console.log(`  - Already exists on blockchain\n`);
        skipped++;
        continue;
      } catch (error) {
        // Doesn't exist, proceed with registration
      }

      // Register on blockchain
      const preRegData = {
        exporterId: exporter.exporter_id,
        companyName: exporter.business_name,
        tin: exporter.tin,
        capitalETB: parseFloat(exporter.minimum_capital) || 20000000,
        licenseNumber: exporter.registration_number || '',
        licenseType: 'export',
        capitalType: 'company'
      };

      try {
        // Submit pre-registration
        await fabricService.invokeChaincode(
          'SubmitPreRegistration',
          JSON.stringify(preRegData)
        );
        console.log(`  ✓ Registered on blockchain`);

        // Approve the exporter (use ApprovePreRegistration with 'profile' stage)
        await fabricService.invokeChaincode(
          'ApprovePreRegistration',
          exporter.exporter_id,
          'profile',
          'approve',
          JSON.stringify({ comments: 'Auto-approved: Synced from database with ACTIVE status' })
        );
        console.log(`  ✓ Approved on blockchain\n`);
        synced++;

      } catch (error) {
        console.log(`  ✗ Error: ${error.message}\n`);
        errors++;
      }
    }

    console.log('========================================');
    console.log('  SYNC COMPLETE');
    console.log('========================================\n');
    console.log(`Synced: ${synced}`);
    console.log(`Skipped (already exist): ${skipped}`);
    console.log(`Errors: ${errors}\n`);

    // Now approve all pending exporters
    console.log('\n========================================');
    console.log('  APPROVING PENDING EXPORTERS');
    console.log('========================================\n');
    
    let approved = 0;
    let approvalErrors = 0;
    
    for (const exporter of result.rows) {
      try {
        // Get current status from blockchain
        const exporterData = await fabricService.queryChaincode('GetExporterProfile', exporter.exporter_id);
        // exporterData might already be parsed or be a string
        const exporterObj = typeof exporterData === 'string' ? JSON.parse(exporterData) : exporterData;
        
        if (exporterObj.status === 'pending_approval') {
          console.log(`Approving: ${exporter.business_name}`);
          await fabricService.invokeChaincode(
            'ApprovePreRegistration',
            exporter.exporter_id,
            'profile',
            'approve',
            JSON.stringify({ comments: 'Auto-approved: Database status is ACTIVE' })
          );
          console.log(`  ✓ Approved\n`);
          approved++;
        }
      } catch (error) {
        console.log(`  ✗ Approval error: ${error.message ? error.message.substring(0, 80) : String(error).substring(0, 80)}\n`);
        approvalErrors++;
      }
    }
    
    console.log('========================================');
    console.log(`Approved: ${approved}`);
    console.log(`Errors: ${approvalErrors}\n`);

  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  syncExporterProfiles()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { syncExporterProfiles };
