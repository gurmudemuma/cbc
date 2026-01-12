const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'coffee_export_db',
  user: 'postgres',
  password: 'postgres'
});

/**
 * This script helps progress exports through the workflow for testing
 * 
 * Workflow:
 * 1. PENDING → ECX_VERIFIED (ECX approves lot)
 * 2. ECX_VERIFIED → ECTA_LICENSE_APPROVED (ECTA approves license)
 * 3. ECTA_LICENSE_APPROVED → ECTA_QUALITY_APPROVED (ECTA approves quality)
 * 4. ECTA_QUALITY_APPROVED → ECTA_CONTRACT_APPROVED (ECTA approves contract)
 * 5. ECTA_CONTRACT_APPROVED → Ready for ESW Submission!
 */

async function progressExports() {
  const client = await pool.connect();
  
  try {
    console.log('\n=== EXPORT WORKFLOW PROGRESSION ===\n');
    
    // Get all exports
    const exportsResult = await client.query(
      `SELECT e.export_id, e.exporter_id, ep.business_name, e.status, e.coffee_type, e.quantity
       FROM exports e
       JOIN exporter_profiles ep ON e.exporter_id = ep.exporter_id
       ORDER BY e.created_at DESC`
    );
    
    console.log(`Total exports: ${exportsResult.rows.length}\n`);
    
    // Count by status
    const statusCounts = {};
    exportsResult.rows.forEach(row => {
      statusCounts[row.status] = (statusCounts[row.status] || 0) + 1;
    });
    
    console.log('Current status breakdown:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
    console.log('\n--- Options ---');
    console.log('1. Progress ALL exports to ECTA_CONTRACT_APPROVED (fast-track for testing)');
    console.log('2. Progress exports step-by-step (one status at a time)');
    console.log('3. Progress specific export by ID');
    console.log('4. Show detailed export information');
    console.log('5. Exit\n');
    
    // For now, let's show what would happen with option 1
    console.log('\n=== SIMULATION: Fast-track to ECTA_CONTRACT_APPROVED ===\n');
    
    let progressCount = 0;
    
    for (const exp of exportsResult.rows) {
      if (exp.status === 'PENDING' || exp.status === 'ECX_PENDING') {
        console.log(`Export ${exp.export_id.substring(0, 8)}... (${exp.business_name})`);
        console.log(`  Current: ${exp.status}`);
        console.log(`  Would progress through:`);
        console.log(`    1. ${exp.status} → ECX_VERIFIED`);
        console.log(`    2. ECX_VERIFIED → ECTA_LICENSE_APPROVED`);
        console.log(`    3. ECTA_LICENSE_APPROVED → ECTA_QUALITY_APPROVED`);
        console.log(`    4. ECTA_QUALITY_APPROVED → ECTA_CONTRACT_APPROVED ✅`);
        console.log(`    5. Ready for ESW Submission!\n`);
        progressCount++;
      }
    }
    
    console.log(`\n${progressCount} exports would be progressed to ECTA_CONTRACT_APPROVED\n`);
    
    console.log('=== TO ACTUALLY PROGRESS EXPORTS ===');
    console.log('Run this script with argument:');
    console.log('  node progress-exports-workflow.js --execute\n');
    
    // Check if --execute flag is provided
    if (process.argv.includes('--execute')) {
      console.log('\n⚠️  EXECUTING WORKFLOW PROGRESSION...\n');
      
      await client.query('BEGIN');
      
      let updated = 0;
      
      for (const exp of exportsResult.rows) {
        if (exp.status === 'PENDING' || exp.status === 'ECX_PENDING') {
          const exportId = exp.export_id;
          const oldStatus = exp.status;
          
          // Progress to ECTA_CONTRACT_APPROVED
          await client.query(
            `UPDATE exports SET 
              status = $1,
              export_license_number = $2,
              license_approved_at = NOW(),
              license_approved_by = $3,
              quality_grade = $4,
              quality_approved_at = NOW(),
              quality_approved_by = $3,
              contract_approved_at = NOW(),
              contract_approved_by = $3,
              updated_at = NOW()
            WHERE export_id = $5`,
            ['ECTA_CONTRACT_APPROVED', `LIC-${Date.now()}-${updated}`, 'system', 'Grade 1', exportId]
          );
          
          // Add status history
          await client.query(
            `INSERT INTO export_status_history (export_id, old_status, new_status, changed_by, notes)
             VALUES ($1, $2, $3, $4, $5)`,
            [exportId, oldStatus, 'ECTA_CONTRACT_APPROVED', 'system', 'Fast-tracked for testing']
          );
          
          updated++;
          console.log(`✅ Export ${exportId.substring(0, 8)}... → ECTA_CONTRACT_APPROVED`);
        }
      }
      
      await client.query('COMMIT');
      
      console.log(`\n✅ Successfully progressed ${updated} exports to ECTA_CONTRACT_APPROVED`);
      console.log('\nThese exports are now eligible for ESW Submission!');
      console.log('Navigate to: ESW Submission page to submit them.\n');
    }
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

progressExports();
