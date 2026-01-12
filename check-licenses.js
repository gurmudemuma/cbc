const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'coffee_export_db',
  user: 'postgres',
  password: 'postgres'
});

async function checkLicenses() {
  try {
    // Check exporter profiles (pre-registration)
    const exporters = await pool.query(
      "SELECT exporter_id, business_name, status, approved_at FROM exporter_profiles WHERE status = 'APPROVED'"
    );
    console.log('\n=== APPROVED EXPORTERS (Pre-Registration) ===');
    console.log('Count:', exporters.rows.length);
    exporters.rows.forEach(row => {
      console.log(`- ${row.business_name} (${row.exporter_id}) - Approved: ${row.approved_at}`);
    });

    // Check exports and their statuses
    const exports = await pool.query(
      `SELECT e.export_id, e.exporter_id, ep.business_name, e.status, 
              e.export_license_number, e.license_approved_at,
              e.quality_grade, e.quality_approved_at,
              e.contract_approved_at
       FROM exports e
       JOIN exporter_profiles ep ON e.exporter_id = ep.exporter_id
       ORDER BY e.created_at DESC`
    );
    
    console.log('\n=== EXPORTS STATUS ===');
    console.log('Total exports:', exports.rows.length);
    
    const statusCounts = {};
    exports.rows.forEach(row => {
      statusCounts[row.status] = (statusCounts[row.status] || 0) + 1;
    });
    
    console.log('\nStatus breakdown:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
    console.log('\n=== EXPORTS READY FOR ESW (ECTA_CONTRACT_APPROVED) ===');
    const readyForESW = exports.rows.filter(e => e.status === 'ECTA_CONTRACT_APPROVED');
    console.log('Count:', readyForESW.length);
    
    console.log('\n=== EXPORTS NEEDING ECTA LICENSE APPROVAL ===');
    const needingLicense = exports.rows.filter(e => 
      e.status === 'ECTA_LICENSE_PENDING' || e.status === 'ECX_VERIFIED'
    );
    console.log('Count:', needingLicense.length);
    
    console.log('\n=== EXPORTS IN EARLY STAGES (PENDING/ECX_PENDING) ===');
    const earlyStage = exports.rows.filter(e => 
      e.status === 'PENDING' || e.status === 'ECX_PENDING'
    );
    console.log('Count:', earlyStage.length);
    earlyStage.forEach(row => {
      console.log(`  - Export ${row.export_id.substring(0, 8)}... by ${row.business_name} - Status: ${row.status}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkLicenses();
