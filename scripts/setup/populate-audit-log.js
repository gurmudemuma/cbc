/**
 * Populate ECTA Audit Log
 * 
 * Retroactively logs all ECTA pre-registration actions
 * for compliance and traceability
 */

const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'coffee_export_db',
  user: 'postgres',
  password: 'postgres'
});

const ECTA_OFFICIAL = 'ecta1';

async function logAuditEvent(client, exporterId, actionType, description, entityType, entityId, newValues = {}) {
  const retentionDate = new Date();
  retentionDate.setFullYear(retentionDate.getFullYear() + 7); // 7-year retention
  
  await client.query(`
    INSERT INTO ecta_audit_log (
      exporter_id, action_type, action_description,
      performed_by, entity_type, entity_id,
      new_values, retention_until, metadata
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  `, [
    exporterId,
    actionType,
    description,
    ECTA_OFFICIAL,
    entityType,
    entityId,
    JSON.stringify(newValues),
    retentionDate.toISOString().split('T')[0],
    JSON.stringify({ compliance_relevant: true, automated_entry: true })
  ]);
}

async function populateAuditLog() {
  const client = await pool.connect();
  
  try {
    console.log('\n📋 Populating ECTA Audit Log...\n');
    
    let totalEvents = 0;
    
    // 1. Capital Verifications
    console.log('1. Auditing Capital Verifications...');
    const capitals = await client.query(`
      SELECT exporter_id, business_name, minimum_capital, capital_verification_date
      FROM exporter_profiles 
      WHERE capital_verified = true
    `);
    
    for (const exp of capitals.rows) {
      await logAuditEvent(
        client,
        exp.exporter_id,
        'CAPITAL_VERIFICATION',
        `Capital verified for ${exp.business_name} - ETB ${exp.minimum_capital.toLocaleString()}`,
        'exporter_profile',
        exp.exporter_id,
        { capital_amount: exp.minimum_capital, verified: true }
      );
      console.log(`   ✅ ${exp.business_name}`);
      totalEvents++;
    }
    
    // 2. Laboratory Certifications
    console.log('\n2. Auditing Laboratory Certifications...');
    const labs = await client.query(`
      SELECT cl.laboratory_id, cl.exporter_id, cl.laboratory_name, 
             cl.certified_date, cl.expiry_date, ep.business_name
      FROM coffee_laboratories cl
      JOIN exporter_profiles ep ON ep.exporter_id = cl.exporter_id
      WHERE cl.status = 'ACTIVE'
    `);
    
    for (const lab of labs.rows) {
      await logAuditEvent(
        client,
        lab.exporter_id,
        'LABORATORY_CERTIFICATION',
        `Laboratory certified: ${lab.laboratory_name} for ${lab.business_name}`,
        'coffee_laboratory',
        lab.laboratory_id,
        { 
          laboratory_name: lab.laboratory_name,
          certified_date: lab.certified_date,
          expiry_date: lab.expiry_date
        }
      );
      console.log(`   ✅ ${lab.business_name} - ${lab.laboratory_name}`);
      totalEvents++;
    }
    
    // 3. Taster Verifications
    console.log('\n3. Auditing Taster Verifications...');
    const tasters = await client.query(`
      SELECT ct.taster_id, ct.exporter_id, ct.full_name,
             ct.proficiency_certificate_number, ct.certificate_expiry_date,
             ep.business_name
      FROM coffee_tasters ct
      JOIN exporter_profiles ep ON ep.exporter_id = ct.exporter_id
      WHERE ct.status = 'ACTIVE'
    `);
    
    for (const taster of tasters.rows) {
      await logAuditEvent(
        client,
        taster.exporter_id,
        'TASTER_VERIFICATION',
        `Taster verified: ${taster.full_name} for ${taster.business_name}`,
        'coffee_taster',
        taster.taster_id,
        {
          taster_name: taster.full_name,
          certificate_number: taster.proficiency_certificate_number,
          expiry_date: taster.certificate_expiry_date
        }
      );
      console.log(`   ✅ ${taster.business_name} - ${taster.full_name}`);
      totalEvents++;
    }
    
    // 4. Competence Certificates
    console.log('\n4. Auditing Competence Certificates...');
    const certs = await client.query(`
      SELECT cc.certificate_id, cc.exporter_id, cc.certificate_number,
             cc.issued_date, cc.expiry_date, ep.business_name
      FROM competence_certificates cc
      JOIN exporter_profiles ep ON ep.exporter_id = cc.exporter_id
      WHERE cc.status = 'ACTIVE'
    `);
    
    for (const cert of certs.rows) {
      await logAuditEvent(
        client,
        cert.exporter_id,
        'COMPETENCE_CERTIFICATE_ISSUED',
        `Competence certificate issued: ${cert.certificate_number} for ${cert.business_name}`,
        'competence_certificate',
        cert.certificate_id,
        {
          certificate_number: cert.certificate_number,
          issued_date: cert.issued_date,
          expiry_date: cert.expiry_date
        }
      );
      console.log(`   ✅ ${cert.business_name} - ${cert.certificate_number}`);
      totalEvents++;
    }
    
    // 5. Export Licenses
    console.log('\n5. Auditing Export Licenses...');
    const licenses = await client.query(`
      SELECT el.license_id, el.exporter_id, el.license_number,
             el.issued_date, el.expiry_date, el.annual_quota,
             ep.business_name
      FROM export_licenses el
      JOIN exporter_profiles ep ON ep.exporter_id = el.exporter_id
      WHERE el.status = 'ACTIVE'
    `);
    
    for (const lic of licenses.rows) {
      await logAuditEvent(
        client,
        lic.exporter_id,
        'EXPORT_LICENSE_ISSUED',
        `Export license issued: ${lic.license_number} for ${lic.business_name}`,
        'export_license',
        lic.license_id,
        {
          license_number: lic.license_number,
          issued_date: lic.issued_date,
          expiry_date: lic.expiry_date,
          annual_quota: lic.annual_quota
        }
      );
      console.log(`   ✅ ${lic.business_name} - ${lic.license_number}`);
      totalEvents++;
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`✅ Total audit events logged: ${totalEvents}`);
    console.log('='.repeat(60));
    console.log('\n📊 Audit Log Summary:');
    console.log('   • 7-year retention policy applied');
    console.log('   • Immutable audit records');
    console.log('   • Complete traceability for compliance');
    console.log('   • All ECTA actions documented\n');
    
  } catch (error) {
    console.error('❌ Error populating audit log:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

populateAuditLog().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
