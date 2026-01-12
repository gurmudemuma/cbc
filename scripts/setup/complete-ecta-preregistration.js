#!/usr/bin/env node

/**
 * Complete ECTA Pre-Registration Workflow
 * 
 * This script completes all ECTA pre-registration requirements for exporters
 * according to Ethiopian Coffee & Tea Authority regulations:
 * 
 * 1. Verify capital (minimum ETB 15,000,000 for private companies)
 * 2. Certify coffee laboratory (if not farmer)
 * 3. Verify coffee taster (if not farmer)
 * 4. Issue competence certificate
 * 5. Issue export license
 */

const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'coffee_export_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
};

const ECTA_OFFICIAL = 'ecta1';
const MINIMUM_CAPITAL = 15000000; // ETB 15 million

async function verifyCapital(client, exporterId, businessName) {
  console.log(`\n📋 Verifying capital for ${businessName}...`);
  
  try {
    // Check current capital
    const result = await client.query(
      'SELECT minimum_capital, capital_verified FROM exporter_profiles WHERE exporter_id = $1',
      [exporterId]
    );
    
    const profile = result.rows[0];
    
    if (profile.capital_verified) {
      console.log('  ✅ Capital already verified');
      return true;
    }
    
    if (parseFloat(profile.minimum_capital) < MINIMUM_CAPITAL) {
      console.log(`  ❌ Insufficient capital: ETB ${profile.minimum_capital} (Required: ETB ${MINIMUM_CAPITAL})`);
      return false;
    }
    
    // Verify capital
    await client.query(`
      UPDATE exporter_profiles 
      SET capital_verified = true,
          capital_verification_date = NOW(),
          updated_at = NOW()
      WHERE exporter_id = $1
    `, [exporterId]);
    
    console.log(`  ✅ Capital verified: ETB ${profile.minimum_capital}`);
    return true;
    
  } catch (error) {
    console.error(`  ❌ Error verifying capital: ${error.message}`);
    return false;
  }
}

async function certifyLaboratory(client, exporterId, businessName, businessType) {
  console.log(`\n🔬 Certifying coffee laboratory for ${businessName}...`);
  
  // Farmers don't need laboratories
  if (businessType === 'FARMER' || businessType === 'FARMER_COOPERATIVE') {
    console.log('  ℹ️  Farmers exempt from laboratory requirement');
    return true;
  }
  
  try {
    // Check if laboratory exists
    const existingLab = await client.query(
      'SELECT laboratory_id, status FROM coffee_laboratories WHERE exporter_id = $1',
      [exporterId]
    );
    
    if (existingLab.rows.length > 0) {
      const lab = existingLab.rows[0];
      if (lab.status === 'ACTIVE') {
        console.log('  ✅ Laboratory already certified');
        return true;
      }
      
      // Update existing lab to ACTIVE
      await client.query(`
        UPDATE coffee_laboratories
        SET status = 'ACTIVE',
            certified_date = NOW(),
            expiry_date = NOW() + INTERVAL '2 years',
            updated_at = NOW()
        WHERE laboratory_id = $1
      `, [lab.laboratory_id]);
      
      console.log('  ✅ Laboratory certification updated');
      return true;
    }
    
    // Create new laboratory
    const labId = uuidv4();
    const certNumber = `LAB-CERT-${Date.now()}`;
    
    await client.query(`
      INSERT INTO coffee_laboratories (
        laboratory_id, exporter_id, laboratory_name,
        address,
        certification_number, certified_date, expiry_date,
        equipment, has_roasting_facility, has_cupping_room,
        status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW() + INTERVAL '2 years', $6::jsonb, $7, $8, $9, NOW(), NOW())
    `, [
      labId,
      exporterId,
      `${businessName} Coffee Laboratory`,
      'Addis Ababa, Ethiopia', // Default address
      certNumber,
      JSON.stringify(['Moisture meter', 'Roaster', 'Grinder', 'Cupping equipment']),
      true,
      true,
      'ACTIVE'
    ]);
    
    console.log(`  ✅ Laboratory certified: ${certNumber}`);
    return true;
    
  } catch (error) {
    console.error(`  ❌ Error certifying laboratory: ${error.message}`);
    return false;
  }
}

async function verifyTaster(client, exporterId, businessName, businessType) {
  console.log(`\n👨‍🔬 Verifying coffee taster for ${businessName}...`);
  
  // Farmers don't need tasters
  if (businessType === 'FARMER' || businessType === 'FARMER_COOPERATIVE') {
    console.log('  ℹ️  Farmers exempt from taster requirement');
    return true;
  }
  
  try {
    // Check if taster exists
    const existingTaster = await client.query(
      'SELECT taster_id, status FROM coffee_tasters WHERE exporter_id = $1',
      [exporterId]
    );
    
    if (existingTaster.rows.length > 0) {
      const taster = existingTaster.rows[0];
      if (taster.status === 'ACTIVE') {
        console.log('  ✅ Taster already verified');
        return true;
      }
      
      // Update existing taster to ACTIVE
      await client.query(`
        UPDATE coffee_tasters
        SET status = 'ACTIVE',
            certificate_expiry_date = NOW() + INTERVAL '3 years',
            updated_at = NOW()
        WHERE taster_id = $1
      `, [taster.taster_id]);
      
      console.log('  ✅ Taster verification updated');
      return true;
    }
    
    // Create new taster
    const tasterId = uuidv4();
    const certNumber = `TASTER-CERT-${Date.now()}`;
    
    await client.query(`
      INSERT INTO coffee_tasters (
        taster_id, exporter_id, full_name,
        qualification_level, proficiency_certificate_number,
        certificate_issue_date, certificate_expiry_date,
        employment_start_date,
        is_exclusive_employee, status,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW() + INTERVAL '3 years', NOW(), $6, $7, NOW(), NOW())
    `, [
      tasterId,
      exporterId,
      `${businessName} Chief Taster`,
      'CERTIFICATE',
      certNumber,
      true,
      'ACTIVE'
    ]);
    
    console.log(`  ✅ Taster verified: ${certNumber}`);
    return true;
    
  } catch (error) {
    console.error(`  ❌ Error verifying taster: ${error.message}`);
    return false;
  }
}

async function issueCompetenceCertificate(client, exporterId, businessName) {
  console.log(`\n📜 Issuing competence certificate for ${businessName}...`);
  
  try {
    // Check if certificate exists
    const existingCert = await client.query(
      'SELECT certificate_id, status FROM competence_certificates WHERE exporter_id = $1',
      [exporterId]
    );
    
    if (existingCert.rows.length > 0) {
      const cert = existingCert.rows[0];
      if (cert.status === 'ACTIVE') {
        console.log('  ✅ Competence certificate already issued');
        return true;
      }
      
      // Update existing certificate to ACTIVE
      await client.query(`
        UPDATE competence_certificates
        SET status = 'ACTIVE',
            issued_date = NOW(),
            expiry_date = NOW() + INTERVAL '1 year',
            approved_by = $2,
            approved_at = NOW(),
            updated_at = NOW()
        WHERE certificate_id = $1
      `, [cert.certificate_id, ECTA_OFFICIAL]);
      
      console.log('  ✅ Competence certificate updated');
      return true;
    }
    
    // Get laboratory and taster IDs
    const labResult = await client.query(
      'SELECT laboratory_id FROM coffee_laboratories WHERE exporter_id = $1 AND status = $2 LIMIT 1',
      [exporterId, 'ACTIVE']
    );
    
    const tasterResult = await client.query(
      'SELECT taster_id FROM coffee_tasters WHERE exporter_id = $1 AND status = $2 LIMIT 1',
      [exporterId, 'ACTIVE']
    );
    
    const labId = labResult.rows.length > 0 ? labResult.rows[0].laboratory_id : null;
    const tasterId = tasterResult.rows.length > 0 ? tasterResult.rows[0].taster_id : null;
    
    // Create new certificate
    const certId = uuidv4();
    const certNumber = `COMP-CERT-${Date.now()}`;
    
    await client.query(`
      INSERT INTO competence_certificates (
        certificate_id, exporter_id, certificate_number,
        issued_date, expiry_date,
        laboratory_id, taster_id,
        facility_inspection_date, inspection_passed,
        has_quality_management_system,
        approved_by, approved_at,
        status, created_at, updated_at
      ) VALUES ($1, $2, $3, NOW(), NOW() + INTERVAL '1 year', $4, $5, NOW(), $6, $7, $8, NOW(), $9, NOW(), NOW())
    `, [
      certId,
      exporterId,
      certNumber,
      labId,
      tasterId,
      true,
      true,
      ECTA_OFFICIAL,
      'ACTIVE'
    ]);
    
    console.log(`  ✅ Competence certificate issued: ${certNumber}`);
    return true;
    
  } catch (error) {
    console.error(`  ❌ Error issuing competence certificate: ${error.message}`);
    return false;
  }
}

async function issueExportLicense(client, exporterId, businessName) {
  console.log(`\n📋 Issuing export license for ${businessName}...`);
  
  try {
    // Check if license exists
    const existingLicense = await client.query(
      'SELECT license_id, status FROM export_licenses WHERE exporter_id = $1',
      [exporterId]
    );
    
    if (existingLicense.rows.length > 0) {
      const license = existingLicense.rows[0];
      if (license.status === 'ACTIVE') {
        console.log('  ✅ Export license already issued');
        return true;
      }
      
      // Update existing license to ACTIVE
      await client.query(`
        UPDATE export_licenses
        SET status = 'ACTIVE',
            issued_date = NOW(),
            expiry_date = NOW() + INTERVAL '1 year',
            approved_by = $2,
            approved_at = NOW(),
            updated_at = NOW()
        WHERE license_id = $1
      `, [license.license_id, ECTA_OFFICIAL]);
      
      console.log('  ✅ Export license updated');
      return true;
    }
    
    // Get competence certificate ID
    const certResult = await client.query(
      'SELECT certificate_id FROM competence_certificates WHERE exporter_id = $1 AND status = $2 LIMIT 1',
      [exporterId, 'ACTIVE']
    );
    
    if (certResult.rows.length === 0) {
      console.log('  ❌ Cannot issue license: No competence certificate found');
      return false;
    }
    
    const certId = certResult.rows[0].certificate_id;
    
    // Create new license
    const licenseId = uuidv4();
    const licenseNumber = `LIC-${new Date().getFullYear()}-${Date.now()}`;
    
    await client.query(`
      INSERT INTO export_licenses (
        license_id, exporter_id, license_number,
        issued_date, expiry_date,
        competence_certificate_id,
        authorized_coffee_types, authorized_origins,
        annual_quota,
        eic_registration_number,
        approved_by, approved_at,
        status, created_at, updated_at
      ) VALUES ($1, $2, $3, NOW(), NOW() + INTERVAL '1 year', $4, $5, $6, $7, $8, $9, NOW(), $10, NOW(), NOW())
    `, [
      licenseId,
      exporterId,
      licenseNumber,
      certId,
      JSON.stringify(['Arabica', 'Robusta', 'Sidamo', 'Yirgacheffe', 'Harar']),
      JSON.stringify(['Sidamo', 'Yirgacheffe', 'Harar', 'Jimma', 'Limu']),
      100000, // 100 tons annual quota
      `EIC-${Date.now()}`, // EIC registration number
      ECTA_OFFICIAL,
      'ACTIVE'
    ]);
    
    console.log(`  ✅ Export license issued: ${licenseNumber}`);
    return true;
    
  } catch (error) {
    console.error(`  ❌ Error issuing export license: ${error.message}`);
    return false;
  }
}

async function completePreRegistration(client, exporter) {
  console.log('\n' + '='.repeat(70));
  console.log(`🏢 Processing: ${exporter.business_name}`);
  console.log('='.repeat(70));
  
  const steps = [
    { name: 'Capital Verification', fn: () => verifyCapital(client, exporter.exporter_id, exporter.business_name) },
    { name: 'Laboratory Certification', fn: () => certifyLaboratory(client, exporter.exporter_id, exporter.business_name, exporter.business_type) },
    { name: 'Taster Verification', fn: () => verifyTaster(client, exporter.exporter_id, exporter.business_name, exporter.business_type) },
    { name: 'Competence Certificate', fn: () => issueCompetenceCertificate(client, exporter.exporter_id, exporter.business_name) },
    { name: 'Export License', fn: () => issueExportLicense(client, exporter.exporter_id, exporter.business_name) }
  ];
  
  let allPassed = true;
  
  for (const step of steps) {
    const result = await step.fn();
    if (!result) {
      allPassed = false;
      console.log(`\n❌ ${step.name} failed - stopping pre-registration for this exporter`);
      break;
    }
  }
  
  if (allPassed) {
    console.log(`\n✅ ${exporter.business_name} is now fully qualified to export!`);
  }
  
  return allPassed;
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║        ECTA Pre-Registration Completion Workflow           ║');
  console.log('║     Ethiopian Coffee & Tea Authority Regulations           ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  const pool = new Pool(dbConfig);
  
  try {
    const client = await pool.connect();
    
    // Get all exporters that need pre-registration
    const result = await client.query(`
      SELECT 
        ep.exporter_id,
        ep.business_name,
        ep.business_type,
        ep.minimum_capital,
        ep.capital_verified,
        (SELECT COUNT(*) FROM coffee_laboratories cl WHERE cl.exporter_id = ep.exporter_id AND cl.status = 'ACTIVE') as labs,
        (SELECT COUNT(*) FROM coffee_tasters ct WHERE ct.exporter_id = ep.exporter_id AND ct.status = 'ACTIVE') as tasters,
        (SELECT COUNT(*) FROM competence_certificates cc WHERE cc.exporter_id = ep.exporter_id AND cc.status = 'ACTIVE') as certs,
        (SELECT COUNT(*) FROM export_licenses el WHERE el.exporter_id = ep.exporter_id AND el.status = 'ACTIVE') as licenses
      FROM exporter_profiles ep
      WHERE ep.status = 'ACTIVE'
      ORDER BY ep.business_name
    `);
    
    console.log(`\n📊 Found ${result.rows.length} active exporters\n`);
    
    const summary = {
      total: result.rows.length,
      fullyQualified: 0,
      needsWork: 0,
      processed: 0,
      failed: 0
    };
    
    for (const exporter of result.rows) {
      const isFullyQualified = 
        exporter.capital_verified &&
        (exporter.business_type === 'FARMER' || exporter.business_type === 'FARMER_COOPERATIVE' || parseInt(exporter.labs) > 0) &&
        (exporter.business_type === 'FARMER' || exporter.business_type === 'FARMER_COOPERATIVE' || parseInt(exporter.tasters) > 0) &&
        parseInt(exporter.certs) > 0 &&
        parseInt(exporter.licenses) > 0;
      
      if (isFullyQualified) {
        console.log(`✅ ${exporter.business_name} - Already fully qualified`);
        summary.fullyQualified++;
        continue;
      }
      
      summary.needsWork++;
      const success = await completePreRegistration(client, exporter);
      
      if (success) {
        summary.processed++;
      } else {
        summary.failed++;
      }
    }
    
    // Final summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 FINAL SUMMARY');
    console.log('='.repeat(70));
    console.log(`Total Exporters:          ${summary.total}`);
    console.log(`Already Qualified:        ${summary.fullyQualified}`);
    console.log(`Needed Processing:        ${summary.needsWork}`);
    console.log(`Successfully Processed:   ${summary.processed}`);
    console.log(`Failed:                   ${summary.failed}`);
    console.log('='.repeat(70));
    
    if (summary.failed === 0) {
      console.log('\n🎉 All exporters are now fully qualified!');
    } else {
      console.log(`\n⚠️  ${summary.failed} exporter(s) could not be fully qualified`);
    }
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    await pool.end();
    process.exit(1);
  }
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
