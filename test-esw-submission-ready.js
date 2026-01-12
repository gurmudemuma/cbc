console.log('\n=== ESW Submission Readiness Test ===\n');

const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'coffee_export_db',
  user: 'postgres',
  password: 'postgres'
});

async function testESWSubmissionReady() {
  try {
    console.log('Checking exports ready for ESW submission...\n');
    
    // Query exports that should appear in ESW Submission page
    const result = await pool.query(`
      SELECT 
        e.export_id,
        ep.business_name as exporter_name,
        e.coffee_type,
        e.quantity,
        e.destination_country,
        e.status,
        e.export_license_number,
        e.quality_grade,
        e.contract_approved_at,
        e.created_at
      FROM exports e
      JOIN exporter_profiles ep ON e.exporter_id = ep.exporter_id
      WHERE e.status IN ('ECTA_CONTRACT_APPROVED', 'ESW_SUBMISSION_PENDING')
      ORDER BY e.created_at DESC
    `);
    
    console.log(`✅ Found ${result.rows.length} exports ready for ESW submission\n`);
    
    if (result.rows.length === 0) {
      console.log('❌ WARNING: No exports are ready for ESW submission!');
      console.log('   Exports must have status: ECTA_CONTRACT_APPROVED or ESW_SUBMISSION_PENDING\n');
    } else {
      console.log('Export Details:');
      console.log('='.repeat(100));
      
      result.rows.forEach((exp, index) => {
        console.log(`\n${index + 1}. Export ID: ${exp.export_id}`);
        console.log(`   Exporter: ${exp.exporter_name}`);
        console.log(`   Coffee Type: ${exp.coffee_type}`);
        console.log(`   Quantity: ${exp.quantity?.toLocaleString()} kg`);
        console.log(`   Destination: ${exp.destination_country}`);
        console.log(`   Status: ${exp.status}`);
        console.log(`   License #: ${exp.export_license_number || 'N/A'}`);
        console.log(`   Quality Grade: ${exp.quality_grade || 'N/A'}`);
        console.log(`   Contract Approved: ${exp.contract_approved_at ? new Date(exp.contract_approved_at).toLocaleString() : 'N/A'}`);
      });
      
      console.log('\n' + '='.repeat(100));
      
      // Check if all have required fields
      const missingLicense = result.rows.filter(e => !e.export_license_number);
      const missingQuality = result.rows.filter(e => !e.quality_grade);
      
      if (missingLicense.length > 0) {
        console.log(`\n⚠️  WARNING: ${missingLicense.length} exports missing license numbers`);
      }
      
      if (missingQuality.length > 0) {
        console.log(`⚠️  WARNING: ${missingQuality.length} exports missing quality grades`);
      }
      
      if (missingLicense.length === 0 && missingQuality.length === 0) {
        console.log('\n✅ All exports have complete ECTA workflow data');
      }
    }
    
    // Check status distribution
    console.log('\n\n=== Status Distribution ===');
    const statusResult = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM exports
      GROUP BY status
      ORDER BY count DESC
    `);
    
    statusResult.rows.forEach(row => {
      const isReady = row.status === 'ECTA_CONTRACT_APPROVED' || row.status === 'ESW_SUBMISSION_PENDING';
      const marker = isReady ? '✅' : '  ';
      console.log(`${marker} ${row.status}: ${row.count}`);
    });
    
    console.log('\n✅ = Ready for ESW Submission');
    
    console.log('\n\n=== Frontend Filter Logic ===');
    console.log('The ESW Submission page filters exports with:');
    console.log('  - status === "ECTA_CONTRACT_APPROVED" OR');
    console.log('  - status === "ESW_SUBMISSION_PENDING"');
    console.log('\nThis matches the database query above.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

testESWSubmissionReady();
