const http = require('http');
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost', port: 5432, database: 'coffee_export_db',
  user: 'postgres', password: 'postgres'
});

function makeRequest(port, path, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost', port, path, method,
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function login(username, password, port) {
  const res = await makeRequest(port, '/api/auth/login', 'POST', { username, password });
  return res.statusCode === 200 ? res.data.data.token : null;
}

async function checkDatabaseConsistency() {
  console.log('\n');
  console.log('          DATABASE CONSISTENCY CHECK                      ');
  console.log('\n');
  
  const client = await pool.connect();
  const issues = [];
  
  try {
    // Check 1: All exporters have required data
    console.log(' Check 1: Exporter Data Completeness');
    console.log(''.repeat(60));
    
    const exporters = await client.query(`
      SELECT 
        ep.exporter_id,
        ep.business_name,
        ep.capital_verified,
        (SELECT COUNT(*) FROM coffee_laboratories cl WHERE cl.exporter_id = ep.exporter_id AND cl.status = 'ACTIVE') as labs,
        (SELECT COUNT(*) FROM coffee_tasters ct WHERE ct.exporter_id = ep.exporter_id AND ct.status = 'ACTIVE') as tasters,
        (SELECT COUNT(*) FROM competence_certificates cc WHERE cc.exporter_id = ep.exporter_id AND cc.status = 'ACTIVE') as certs,
        (SELECT COUNT(*) FROM export_licenses el WHERE el.exporter_id = ep.exporter_id AND el.status = 'ACTIVE') as licenses
      FROM exporter_profiles ep
      WHERE ep.status = 'ACTIVE'
    `);
    
    for (const exp of exporters.rows) {
      const missing = [];
      if (!exp.capital_verified) missing.push('Capital');
      if (parseInt(exp.labs) === 0) missing.push('Laboratory');
      if (parseInt(exp.tasters) === 0) missing.push('Taster');
      if (parseInt(exp.certs) === 0) missing.push('Certificate');
      if (parseInt(exp.licenses) === 0) missing.push('License');
      
      if (missing.length > 0) {
        console.log(`   ${exp.business_name}: Missing ${missing.join(', ')}`);
        issues.push(`${exp.business_name} missing: ${missing.join(', ')}`);
      } else {
        console.log(`   ${exp.business_name}: Complete`);
      }
    }
    
    // Check 2: Certificate and License Validity
    console.log('\n Check 2: Certificate & License Validity');
    console.log(''.repeat(60));
    
    const expiredCerts = await client.query(`
      SELECT business_name, certificate_number, expiry_date
      FROM competence_certificates cc
      JOIN exporter_profiles ep ON cc.exporter_id = ep.exporter_id
      WHERE cc.status = 'ACTIVE' AND cc.expiry_date < NOW()
    `);
    
    if (expiredCerts.rows.length > 0) {
      console.log(`   ${expiredCerts.rows.length} expired competence certificates`);
      expiredCerts.rows.forEach(c => {
        console.log(`      ${c.business_name}: ${c.certificate_number}`);
        issues.push(`Expired certificate: ${c.business_name}`);
      });
    } else {
      console.log('   All competence certificates valid');
    }
    
    const expiredLicenses = await client.query(`
      SELECT business_name, license_number, expiry_date
      FROM export_licenses el
      JOIN exporter_profiles ep ON el.exporter_id = ep.exporter_id
      WHERE el.status = 'ACTIVE' AND el.expiry_date < NOW()
    `);
    
    if (expiredLicenses.rows.length > 0) {
      console.log(`   ${expiredLicenses.rows.length} expired export licenses`);
      expiredLicenses.rows.forEach(l => {
        console.log(`      ${l.business_name}: ${l.license_number}`);
        issues.push(`Expired license: ${l.business_name}`);
      });
    } else {
      console.log('   All export licenses valid');
    }
    
    // Check 3: Referential Integrity
    console.log('\n Check 3: Referential Integrity');
    console.log(''.repeat(60));
    
    const orphanedLabs = await client.query(`
      SELECT COUNT(*) as count FROM coffee_laboratories cl
      LEFT JOIN exporter_profiles ep ON cl.exporter_id = ep.exporter_id
      WHERE ep.exporter_id IS NULL
    `);
    
    if (parseInt(orphanedLabs.rows[0].count) > 0) {
      console.log(`   ${orphanedLabs.rows[0].count} orphaned laboratories`);
      issues.push('Orphaned laboratories found');
    } else {
      console.log('   No orphaned laboratories');
    }
    
    const orphanedTasters = await client.query(`
      SELECT COUNT(*) as count FROM coffee_tasters ct
      LEFT JOIN exporter_profiles ep ON ct.exporter_id = ep.exporter_id
      WHERE ep.exporter_id IS NULL
    `);
    
    if (parseInt(orphanedTasters.rows[0].count) > 0) {
      console.log(`   ${orphanedTasters.rows[0].count} orphaned tasters`);
      issues.push('Orphaned tasters found');
    } else {
      console.log('   No orphaned tasters');
    }
    
    // Check 4: Audit Log Consistency
    console.log('\n Check 4: Audit Log Consistency');
    console.log(''.repeat(60));
    
    const auditCount = await client.query('SELECT COUNT(*) as count FROM preregistration_audit_log');
    console.log(`  ℹ  Total audit events: ${auditCount.rows[0].count}`);
    
    const auditByType = await client.query(`
      SELECT event_type, COUNT(*) as count
      FROM preregistration_audit_log
      GROUP BY event_type
      ORDER BY count DESC
    `);
    
    auditByType.rows.forEach(a => {
      console.log(`      ${a.event_type}: ${a.count}`);
    });
    
    if (parseInt(auditCount.rows[0].count) < 20) {
      console.log('    Expected at least 20 audit events');
      issues.push('Insufficient audit events');
    } else {
      console.log('   Audit log populated');
    }
    
    client.release();
    return issues;
    
  } catch (error) {
    client.release();
    console.error(' Database check failed:', error.message);
    return ['Database check failed'];
  }
}

async function checkAPIConsistency() {
  console.log('\n');
  console.log('          API CONSISTENCY CHECK                           ');
  console.log('\n');
  
  const issues = [];
  
  // Check Exporter Portal
  console.log(' Check 1: Exporter Portal API');
  console.log(''.repeat(60));
  
  const exporterToken = await login('exporter1', 'password123', 3004);
  if (!exporterToken) {
    console.log('   Exporter login failed');
    issues.push('Exporter authentication broken');
    return issues;
  }
  console.log('   Authentication working');
  
  const qualStatus = await makeRequest(3004, '/api/exporter/qualification-status', 'GET', null, exporterToken);
  if (qualStatus.statusCode !== 200) {
    console.log('   Qualification status endpoint failed');
    issues.push('Qualification status endpoint broken');
  } else {
    const qual = qualStatus.data.data;
    console.log(`   Qualification status: ${qual.canCreateExportRequest ? 'QUALIFIED' : 'NOT QUALIFIED'}`);
    
    if (!qual.validation.hasValidProfile) {
      console.log('   Profile validation failed');
      issues.push('Profile validation inconsistent');
    }
    if (!qual.validation.hasMinimumCapital) {
      console.log('   Capital validation failed');
      issues.push('Capital validation inconsistent');
    }
    if (!qual.validation.hasCertifiedLaboratory) {
      console.log('   Laboratory validation failed');
      issues.push('Laboratory validation inconsistent');
    }
    if (!qual.validation.hasQualifiedTaster) {
      console.log('   Taster validation failed');
      issues.push('Taster validation inconsistent');
    }
    if (!qual.validation.hasCompetenceCertificate) {
      console.log('   Certificate validation failed');
      issues.push('Certificate validation inconsistent');
    }
    if (!qual.validation.hasExportLicense) {
      console.log('   License validation failed');
      issues.push('License validation inconsistent');
    }
    
    if (qual.canCreateExportRequest) {
      console.log('   All validations passed');
    }
  }
  
  const stats = await makeRequest(3004, '/api/exports/stats', 'GET', null, exporterToken);
  if (stats.statusCode !== 200) {
    console.log('   Stats endpoint failed');
    issues.push('Stats endpoint broken');
  } else {
    console.log('   Stats endpoint working');
  }
  
  // Check ECTA API
  console.log('\n Check 2: ECTA API');
  console.log(''.repeat(60));
  
  const ectaToken = await login('ecta1', 'password123', 3003);
  if (!ectaToken) {
    console.log('   ECTA login failed');
    issues.push('ECTA authentication broken');
    return issues;
  }
  console.log('   Authentication working');
  
  const ectaStats = await makeRequest(3003, '/api/preregistration/dashboard/stats', 'GET', null, ectaToken);
  if (ectaStats.statusCode !== 200) {
    console.log('   Dashboard stats failed');
    issues.push('ECTA dashboard broken');
  } else {
    const stats = ectaStats.data.data;
    console.log(`   Dashboard stats: ${stats.exporters.total} exporters, ${stats.licenses.total} licenses`);
    
    if (stats.exporters.total !== 4) {
      console.log(`    Expected 4 exporters, found ${stats.exporters.total}`);
      issues.push('Exporter count mismatch');
    }
    if (stats.licenses.total !== 4) {
      console.log(`    Expected 4 licenses, found ${stats.licenses.total}`);
      issues.push('License count mismatch');
    }
  }
  
  const exporters = await makeRequest(3003, '/api/preregistration/exporters', 'GET', null, ectaToken);
  if (exporters.statusCode !== 200) {
    console.log('   Get exporters failed');
    issues.push('Get exporters endpoint broken');
  } else {
    console.log(`   Get exporters: ${exporters.data.data.length} found`);
  }
  
  return issues;
}

async function checkDataFlowConsistency() {
  console.log('\n');
  console.log('          DATA FLOW CONSISTENCY CHECK                     ');
  console.log('\n');
  
  const client = await pool.connect();
  const issues = [];
  
  try {
    // Check 1: Database  API consistency
    console.log(' Check 1: Database  API Data Consistency');
    console.log(''.repeat(60));
    
    const dbExporters = await client.query('SELECT COUNT(*) as count FROM exporter_profiles WHERE status = $1', ['ACTIVE']);
    const dbCount = parseInt(dbExporters.rows[0].count);
    
    const ectaToken = await login('ecta1', 'password123', 3003);
    const apiStats = await makeRequest(3003, '/api/preregistration/dashboard/stats', 'GET', null, ectaToken);
    const apiCount = apiStats.data.data.exporters.total;
    
    if (dbCount === apiCount) {
      console.log(`   Exporter count matches: DB=${dbCount}, API=${apiCount}`);
    } else {
      console.log(`   Exporter count mismatch: DB=${dbCount}, API=${apiCount}`);
      issues.push('Exporter count mismatch between DB and API');
    }
    
    // Check 2: License count consistency
    const dbLicenses = await client.query('SELECT COUNT(*) as count FROM export_licenses WHERE status = $1', ['ACTIVE']);
    const dbLicCount = parseInt(dbLicenses.rows[0].count);
    const apiLicCount = apiStats.data.data.licenses.total;
    
    if (dbLicCount === apiLicCount) {
      console.log(`   License count matches: DB=${dbLicCount}, API=${apiLicCount}`);
    } else {
      console.log(`   License count mismatch: DB=${dbLicCount}, API=${apiLicCount}`);
      issues.push('License count mismatch between DB and API');
    }
    
    // Check 3: Exporter qualification consistency
    console.log('\n Check 2: Exporter Qualification Consistency');
    console.log(''.repeat(60));
    
    const exporterToken = await login('exporter1', 'password123', 3004);
    const qualStatus = await makeRequest(3004, '/api/exporter/qualification-status', 'GET', null, exporterToken);
    
    if (qualStatus.statusCode === 200) {
      const qual = qualStatus.data.data;
      const exporterId = qual.validation.exporterId;
      
      // Verify database matches API response
      const dbProfile = await client.query('SELECT * FROM exporter_profiles WHERE exporter_id = $1', [exporterId]);
      const dbLab = await client.query('SELECT * FROM coffee_laboratories WHERE exporter_id = $1 AND status = $2', [exporterId, 'ACTIVE']);
      const dbTaster = await client.query('SELECT * FROM coffee_tasters WHERE exporter_id = $1 AND status = $2', [exporterId, 'ACTIVE']);
      const dbCert = await client.query('SELECT * FROM competence_certificates WHERE exporter_id = $1 AND status = $2', [exporterId, 'ACTIVE']);
      const dbLic = await client.query('SELECT * FROM export_licenses WHERE exporter_id = $1 AND status = $2', [exporterId, 'ACTIVE']);
      
      const checks = [
        { name: 'Profile', api: qual.validation.hasValidProfile, db: dbProfile.rows.length > 0 },
        { name: 'Laboratory', api: qual.validation.hasCertifiedLaboratory, db: dbLab.rows.length > 0 },
        { name: 'Taster', api: qual.validation.hasQualifiedTaster, db: dbTaster.rows.length > 0 },
        { name: 'Certificate', api: qual.validation.hasCompetenceCertificate, db: dbCert.rows.length > 0 },
        { name: 'License', api: qual.validation.hasExportLicense, db: dbLic.rows.length > 0 }
      ];
      
      checks.forEach(check => {
        if (check.api === check.db) {
          console.log(`   ${check.name}: API and DB consistent`);
        } else {
          console.log(`   ${check.name}: API=${check.api}, DB=${check.db}`);
          issues.push(`${check.name} inconsistency between API and DB`);
        }
      });
    }
    
    client.release();
    return issues;
    
  } catch (error) {
    client.release();
    console.error(' Data flow check failed:', error.message);
    return ['Data flow check failed'];
  }
}

async function checkCrossServiceConsistency() {
  console.log('\n');
  console.log('          CROSS-SERVICE CONSISTENCY CHECK                 ');
  console.log('\n');
  
  const issues = [];
  
  console.log(' Check: Same Data Across Services');
  console.log(''.repeat(60));
  
  try {
    // Login to both services
    const exporterToken = await login('exporter1', 'password123', 3004);
    const ectaToken = await login('ecta1', 'password123', 3003);
    
    // Get exporter data from Exporter Portal
    const exporterView = await makeRequest(3004, '/api/exporter/qualification-status', 'GET', null, exporterToken);
    
    // Get same exporter data from ECTA
    const ectaView = await makeRequest(3003, '/api/preregistration/exporters', 'GET', null, ectaToken);
    
    if (exporterView.statusCode === 200 && ectaView.statusCode === 200) {
      const exporterId = exporterView.data.data.validation.exporterId;
      const ectaExporter = ectaView.data.data.find(e => e.exporterId === exporterId);
      
      if (ectaExporter) {
        console.log('   Exporter found in both services');
        
        // Compare key fields
        const exporterName = exporterView.data.data.validation.profile.businessName;
        const ectaName = ectaExporter.businessName;
        
        if (exporterName === ectaName) {
          console.log(`   Business name consistent: ${exporterName}`);
        } else {
          console.log(`   Business name mismatch: Exporter="${exporterName}", ECTA="${ectaName}"`);
          issues.push('Business name inconsistent across services');
        }
      } else {
        console.log('   Exporter not found in ECTA service');
        issues.push('Exporter missing in ECTA service');
      }
    }
    
  } catch (error) {
    console.error('   Cross-service check failed:', error.message);
    issues.push('Cross-service check failed');
  }
  
  return issues;
}

async function main() {
  console.log('');
  console.log('                                                          ');
  console.log('     SYSTEM CONSISTENCY VERIFICATION                      ');
  console.log('     Comprehensive Cross-System Check                     ');
  console.log('                                                          ');
  console.log('');
  
  const allIssues = [];
  
  // Run all checks
  const dbIssues = await checkDatabaseConsistency();
  allIssues.push(...dbIssues);
  
  const apiIssues = await checkAPIConsistency();
  allIssues.push(...apiIssues);
  
  const dataFlowIssues = await checkDataFlowConsistency();
  allIssues.push(...dataFlowIssues);
  
  const crossServiceIssues = await checkCrossServiceConsistency();
  allIssues.push(...crossServiceIssues);
  
  // Final summary
  console.log('\n');
  console.log('                    FINAL SUMMARY                         ');
  console.log('\n');
  
  if (allIssues.length === 0) {
    console.log(' ALL CONSISTENCY CHECKS PASSED!');
    console.log('\nThe system is working consistently across:');
    console.log('   Database integrity');
    console.log('   API endpoints');
    console.log('   Data flow (DB  API)');
    console.log('   Cross-service communication');
    console.log('\n System is PRODUCTION READY with full consistency!');
  } else {
    console.log(` FOUND ${allIssues.length} CONSISTENCY ISSUES:\n`);
    allIssues.forEach((issue, i) => {
      console.log(`  ${i+1}. ${issue}`);
    });
    console.log('\n  Please address these issues before production deployment.');
  }
  
  await pool.end();
  process.exit(allIssues.length === 0 ? 0 : 1);
}

main().catch(e => {
  console.error('\n Fatal error:', e.message);
  process.exit(1);
});
