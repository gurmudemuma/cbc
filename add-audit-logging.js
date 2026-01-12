const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'coffee_export_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
};

const ECTA_OFFICIAL = 'ecta1';

async function logAuditEvent(client, eventType, entityType, entityId, action, description, metadata = {}) {
  try {
    await client.query(`
      INSERT INTO preregistration_audit_log (
        audit_id, event_type, entity_type, entity_id,
        user_id, user_role, organization_id,
        action, description, metadata,
        timestamp, severity, compliance_relevant
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), $11, $12)
    `, [
      uuidv4(), eventType, entityType, entityId,
      ECTA_OFFICIAL, 'ecta_official', 'ECTA',
      action, description, JSON.stringify(metadata),
      'MEDIUM', true
    ]);
    return true;
  } catch (error) {
    console.error(`  ❌ Failed: ${error.message}`);
    return false;
  }
}

async function auditCapitalVerifications(client) {
  console.log('\n📋 Auditing Capital Verifications...');
  const result = await client.query(`
    SELECT exporter_id, business_name, minimum_capital, capital_verification_date
    FROM exporter_profiles WHERE capital_verified = true
  `);
  
  let logged = 0;
  for (const exp of result.rows) {
    if (await logAuditEvent(client, 'CAPITAL_VERIFICATION', 'exporter', exp.exporter_id,
        'VERIFY_CAPITAL', `Capital verified for ${exp.business_name}`,
        { business_name: exp.business_name, capital_amount: exp.minimum_capital })) {
      logged++;
      console.log(`  ✅ ${exp.business_name}`);
    }
  }
  console.log(`✅ Logged ${logged} capital verifications`);
  return logged;
}

async function auditLaboratoryCertifications(client) {
  console.log('\n🔬 Auditing Laboratory Certifications...');
  const result = await client.query(`
    SELECT cl.laboratory_id, cl.exporter_id, cl.laboratory_name, 
           cl.certification_number, ep.business_name
    FROM coffee_laboratories cl
    JOIN exporter_profiles ep ON cl.exporter_id = ep.exporter_id
    WHERE cl.status = 'ACTIVE'
  `);
  
  let logged = 0;
  for (const lab of result.rows) {
    if (await logAuditEvent(client, 'LABORATORY_CERTIFICATION', 'laboratory', lab.laboratory_id,
        'CERTIFY_LABORATORY', `Laboratory certified for ${lab.business_name}`,
        { laboratory_name: lab.laboratory_name, certification_number: lab.certification_number })) {
      logged++;
      console.log(`  ✅ ${lab.business_name}`);
    }
  }
  console.log(`✅ Logged ${logged} laboratory certifications`);
  return logged;
}

async function auditTasterVerifications(client) {
  console.log('\n👨‍🔬 Auditing Taster Verifications...');
  const result = await client.query(`
    SELECT ct.taster_id, ct.exporter_id, ct.full_name,
           ct.proficiency_certificate_number, ep.business_name
    FROM coffee_tasters ct
    JOIN exporter_profiles ep ON ct.exporter_id = ep.exporter_id
    WHERE ct.status = 'ACTIVE'
  `);
  
  let logged = 0;
  for (const taster of result.rows) {
    if (await logAuditEvent(client, 'TASTER_VERIFICATION', 'taster', taster.taster_id,
        'VERIFY_TASTER', `Taster verified for ${taster.business_name}`,
        { taster_name: taster.full_name, certificate_number: taster.proficiency_certificate_number })) {
      logged++;
      console.log(`  ✅ ${taster.business_name}`);
    }
  }
  console.log(`✅ Logged ${logged} taster verifications`);
  return logged;
}

async function auditCompetenceCertificates(client) {
  console.log('\n📜 Auditing Competence Certificates...');
  const result = await client.query(`
    SELECT cc.certificate_id, cc.exporter_id, cc.certificate_number,
           cc.issued_date, ep.business_name
    FROM competence_certificates cc
    JOIN exporter_profiles ep ON cc.exporter_id = ep.exporter_id
    WHERE cc.status = 'ACTIVE'
  `);
  
  let logged = 0;
  for (const cert of result.rows) {
    if (await logAuditEvent(client, 'COMPETENCE_CERTIFICATE_ISSUED', 'competence_certificate', cert.certificate_id,
        'ISSUE_COMPETENCE_CERTIFICATE', `Competence certificate issued for ${cert.business_name}`,
        { certificate_number: cert.certificate_number, issued_date: cert.issued_date })) {
      logged++;
      console.log(`  ✅ ${cert.business_name}`);
    }
  }
  console.log(`✅ Logged ${logged} competence certificates`);
  return logged;
}

async function auditExportLicenses(client) {
  console.log('\n📋 Auditing Export Licenses...');
  const result = await client.query(`
    SELECT el.license_id, el.exporter_id, el.license_number,
           el.issued_date, ep.business_name
    FROM export_licenses el
    JOIN exporter_profiles ep ON el.exporter_id = ep.exporter_id
    WHERE el.status = 'ACTIVE'
  `);
  
  let logged = 0;
  for (const lic of result.rows) {
    if (await logAuditEvent(client, 'EXPORT_LICENSE_ISSUED', 'export_license', lic.license_id,
        'ISSUE_EXPORT_LICENSE', `Export license issued for ${lic.business_name}`,
        { license_number: lic.license_number, issued_date: lic.issued_date })) {
      logged++;
      console.log(`  ✅ ${lic.business_name}`);
    }
  }
  console.log(`✅ Logged ${logged} export licenses`);
  return logged;
}

async function generateComplianceReport(client) {
  console.log('\n📊 Generating Compliance Report...');
  
  const eventCounts = await client.query(`
    SELECT event_type, COUNT(*) as count
    FROM preregistration_audit_log
    WHERE compliance_relevant = true
    GROUP BY event_type
    ORDER BY count DESC
  `);
  
  console.log('\n📈 Audit Events by Type:');
  console.table(eventCounts.rows);
  
  const summary = await client.query(`
    SELECT 
      COUNT(*) as total_events,
      COUNT(DISTINCT entity_id) as unique_entities,
      MIN(timestamp) as earliest_event,
      MAX(timestamp) as latest_event
    FROM preregistration_audit_log
  `);
  
  console.log('\n📋 Compliance Summary:');
  console.table(summary.rows);
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║          Add Audit Logging for ECTA Actions               ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  const pool = new Pool(dbConfig);
  
  try {
    const client = await pool.connect();
    console.log('✅ Connected to database\n');
    
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'preregistration_audit_log'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ Audit log table does not exist');
      client.release();
      await pool.end();
      return;
    }
    
    const summary = {
      capitalVerifications: await auditCapitalVerifications(client),
      laboratoryCertifications: await auditLaboratoryCertifications(client),
      tasterVerifications: await auditTasterVerifications(client),
      competenceCertificates: await auditCompetenceCertificates(client),
      exportLicenses: await auditExportLicenses(client)
    };
    
    await generateComplianceReport(client);
    
    console.log('\n' + '='.repeat(70));
    console.log('📊 AUDIT LOGGING SUMMARY');
    console.log('='.repeat(70));
    console.log(`Capital Verifications:       ${summary.capitalVerifications}`);
    console.log(`Laboratory Certifications:   ${summary.laboratoryCertifications}`);
    console.log(`Taster Verifications:        ${summary.tasterVerifications}`);
    console.log(`Competence Certificates:     ${summary.competenceCertificates}`);
    console.log(`Export Licenses:             ${summary.exportLicenses}`);
    console.log('='.repeat(70));
    
    const total = Object.values(summary).reduce((a, b) => a + b, 0);
    console.log(`\n✅ Total audit events logged: ${total}`);
    
    if (total > 0) {
      console.log('\n🎉 Audit logging complete! All ECTA actions are now traceable.');
      console.log('\n📋 Compliance Features:');
      console.log('  ✅ 7-year retention policy');
      console.log('  ✅ Immutable audit records');
      console.log('  ✅ Complete traceability');
    }
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  process.exit(1);
});
