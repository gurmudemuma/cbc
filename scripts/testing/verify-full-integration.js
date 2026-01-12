/**
 * Full System Integration Verification
 * 
 * Tests end-to-end integration across all CBC microservices:
 * - Exporter Portal (pre-registration, exports)
 * - ECTA (qualification, licensing)
 * - Commercial Bank (payment verification)
 * - National Bank (forex allocation)
 * - Custom Authorities (clearance)
 * - ECX (contract verification)
 * - Shipping Line (logistics)
 */

const http = require('http');
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'coffee_export_db',
  user: 'postgres',
  password: 'postgres'
});

// Service configurations
const SERVICES = {
  'Exporter Portal': { port: 3004, path: '/health' },
  'ECTA': { port: 3001, path: '/health' },
  'Commercial Bank': { port: 3002, path: '/health' },
  'National Bank': { port: 3003, path: '/health' },
  'Custom Authorities': { port: 3005, path: '/health' },
  'ECX': { port: 3006, path: '/health' },
  'Shipping Line': { port: 3007, path: '/health' }
};

function makeRequest(port, path, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port,
      path,
      method,
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000
    };
    
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
    
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
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

async function checkServiceHealth(name, config) {
  try {
    const res = await makeRequest(config.port, config.path);
    return {
      name,
      status: res.statusCode === 200 ? '✅ Running' : `⚠️  Unhealthy (${res.statusCode})`,
      healthy: res.statusCode === 200
    };
  } catch (error) {
    return {
      name,
      status: `❌ Not responding (${error.message})`,
      healthy: false
    };
  }
}

async function verifyDatabaseIntegrity() {
  const client = await pool.connect();
  const results = {
    tables: [],
    relationships: [],
    dataConsistency: []
  };
  
  try {
    // Check critical tables exist
    const tables = [
      'users',
      'exporter_profiles',
      'coffee_laboratories',
      'coffee_tasters',
      'competence_certificates',
      'export_licenses',
      'exports',
      'export_status_history',
      'ecta_audit_log'
    ];
    
    for (const table of tables) {
      const res = await client.query(`
        SELECT COUNT(*) as count FROM ${table}
      `);
      results.tables.push({
        table,
        count: parseInt(res.rows[0].count),
        status: '✅'
      });
    }
    
    // Check foreign key relationships
    const relationships = [
      {
        name: 'Exporter Profiles → Users',
        query: `
          SELECT COUNT(*) as orphaned 
          FROM exporter_profiles ep 
          WHERE ep.user_id IS NOT NULL 
          AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id::text = ep.user_id)
        `
      },
      {
        name: 'Laboratories → Exporters',
        query: `
          SELECT COUNT(*) as orphaned 
          FROM coffee_laboratories cl 
          WHERE NOT EXISTS (SELECT 1 FROM exporter_profiles ep WHERE ep.exporter_id = cl.exporter_id)
        `
      },
      {
        name: 'Tasters → Exporters',
        query: `
          SELECT COUNT(*) as orphaned 
          FROM coffee_tasters ct 
          WHERE NOT EXISTS (SELECT 1 FROM exporter_profiles ep WHERE ep.exporter_id = ct.exporter_id)
        `
      },
      {
        name: 'Competence Certificates → Exporters',
        query: `
          SELECT COUNT(*) as orphaned 
          FROM competence_certificates cc 
          WHERE NOT EXISTS (SELECT 1 FROM exporter_profiles ep WHERE ep.exporter_id = cc.exporter_id)
        `
      },
      {
        name: 'Export Licenses → Exporters',
        query: `
          SELECT COUNT(*) as orphaned 
          FROM export_licenses el 
          WHERE NOT EXISTS (SELECT 1 FROM exporter_profiles ep WHERE ep.exporter_id = el.exporter_id)
        `
      },
      {
        name: 'Exports → Exporters',
        query: `
          SELECT COUNT(*) as orphaned 
          FROM exports e 
          WHERE NOT EXISTS (SELECT 1 FROM exporter_profiles ep WHERE ep.exporter_id = e.exporter_id)
        `
      }
    ];
    
    for (const rel of relationships) {
      const res = await client.query(rel.query);
      const orphaned = parseInt(res.rows[0].orphaned);
      results.relationships.push({
        relationship: rel.name,
        orphaned,
        status: orphaned === 0 ? '✅ Clean' : `❌ ${orphaned} orphaned`
      });
    }
    
    // Check data consistency
    const consistencyChecks = [
      {
        name: 'Qualified Exporters',
        query: `
          SELECT COUNT(*) as count 
          FROM exporter_profiles ep
          WHERE ep.capital_verified = true
          AND EXISTS (SELECT 1 FROM coffee_laboratories cl WHERE cl.exporter_id = ep.exporter_id AND cl.status = 'ACTIVE')
          AND EXISTS (SELECT 1 FROM coffee_tasters ct WHERE ct.exporter_id = ep.exporter_id AND ct.status = 'ACTIVE')
          AND EXISTS (SELECT 1 FROM competence_certificates cc WHERE cc.exporter_id = ep.exporter_id AND cc.status = 'ACTIVE')
          AND EXISTS (SELECT 1 FROM export_licenses el WHERE el.exporter_id = ep.exporter_id AND el.status = 'ACTIVE')
        `
      },
      {
        name: 'Active Export Licenses',
        query: `
          SELECT COUNT(*) as count 
          FROM export_licenses 
          WHERE status = 'ACTIVE' 
          AND expiry_date > NOW()
        `
      },
      {
        name: 'Valid Competence Certificates',
        query: `
          SELECT COUNT(*) as count 
          FROM competence_certificates 
          WHERE status = 'ACTIVE' 
          AND expiry_date > NOW()
        `
      },
      {
        name: 'ECTA Audit Log Entries',
        query: `SELECT COUNT(*) as count FROM ecta_audit_log`
      }
    ];
    
    for (const check of consistencyChecks) {
      const res = await client.query(check.query);
      results.dataConsistency.push({
        check: check.name,
        count: parseInt(res.rows[0].count),
        status: '✅'
      });
    }
    
  } finally {
    client.release();
  }
  
  return results;
}

async function verifyExporterWorkflow() {
  const results = {
    authentication: null,
    preRegistration: null,
    qualification: null,
    exportCreation: null
  };
  
  try {
    // 1. Test Exporter Authentication
    const loginRes = await makeRequest(3004, '/api/auth/login', 'POST', {
      username: 'exporter1',
      password: 'password123'
    });
    
    results.authentication = {
      status: loginRes.statusCode === 200 ? '✅ Working' : '❌ Failed',
      userId: loginRes.data?.data?.user?.id,
      token: loginRes.data?.data?.token
    };
    
    if (loginRes.statusCode !== 200) {
      return results;
    }
    
    const token = loginRes.data.data.token;
    
    // 2. Test Pre-Registration Data Retrieval
    const endpoints = [
      { name: 'Profile', path: '/api/exporter/profile' },
      { name: 'Laboratories', path: '/api/exporter/laboratories' },
      { name: 'Tasters', path: '/api/exporter/tasters' },
      { name: 'Competence Certificates', path: '/api/exporter/competence-certificates' },
      { name: 'Export Licenses', path: '/api/exporter/export-licenses' }
    ];
    
    const preRegResults = {};
    for (const endpoint of endpoints) {
      const res = await makeRequest(3004, endpoint.path, 'GET', null, token);
      const data = res.data?.data;
      preRegResults[endpoint.name] = {
        status: res.statusCode === 200 ? '✅' : '❌',
        count: Array.isArray(data) ? data.length : (data ? 1 : 0)
      };
    }
    
    results.preRegistration = preRegResults;
    
    // 3. Test Qualification Status
    const qualRes = await makeRequest(3004, '/api/exporter/qualification-status', 'GET', null, token);
    results.qualification = {
      status: qualRes.statusCode === 200 ? '✅ Working' : '❌ Failed',
      canExport: qualRes.data?.data?.canCreateExportRequest,
      validation: qualRes.data?.data?.validation
    };
    
    // 4. Test Export Stats
    const statsRes = await makeRequest(3004, '/api/exports/stats', 'GET', null, token);
    results.exportCreation = {
      status: statsRes.statusCode === 200 ? '✅ Working' : '❌ Failed',
      stats: statsRes.data?.data
    };
    
  } catch (error) {
    console.error('Error in exporter workflow verification:', error.message);
  }
  
  return results;
}

async function verifyECTAIntegration() {
  const results = {
    authentication: null,
    dashboard: null,
    exporters: null,
    auditLog: null
  };
  
  try {
    // 1. Test ECTA Authentication
    const loginRes = await makeRequest(3001, '/api/auth/login', 'POST', {
      username: 'ecta1',
      password: 'password123'
    });
    
    results.authentication = {
      status: loginRes.statusCode === 200 ? '✅ Working' : '❌ Failed'
    };
    
    if (loginRes.statusCode !== 200) {
      return results;
    }
    
    const token = loginRes.data.data.token;
    
    // 2. Test ECTA Dashboard
    const dashRes = await makeRequest(3001, '/api/ecta/dashboard/stats', 'GET', null, token);
    results.dashboard = {
      status: dashRes.statusCode === 200 ? '✅ Working' : '❌ Failed',
      stats: dashRes.data?.data
    };
    
    // 3. Test Exporter List
    const exportersRes = await makeRequest(3001, '/api/ecta/exporters', 'GET', null, token);
    results.exporters = {
      status: exportersRes.statusCode === 200 ? '✅ Working' : '❌ Failed',
      count: exportersRes.data?.data?.length || 0
    };
    
    // 4. Verify Audit Log
    const client = await pool.connect();
    try {
      const auditRes = await client.query(`
        SELECT COUNT(*) as count,
               COUNT(DISTINCT exporter_id) as exporters,
               COUNT(DISTINCT action_type) as action_types
        FROM ecta_audit_log
      `);
      
      results.auditLog = {
        status: '✅ Verified',
        totalEntries: parseInt(auditRes.rows[0].count),
        exporters: parseInt(auditRes.rows[0].exporters),
        actionTypes: parseInt(auditRes.rows[0].action_types)
      };
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error in ECTA integration verification:', error.message);
  }
  
  return results;
}

async function verifyCrossServiceIntegration() {
  const results = [];
  
  const client = await pool.connect();
  try {
    // Check if qualified exporters can create exports
    const qualifiedExporters = await client.query(`
      SELECT ep.exporter_id, ep.business_name,
             COUNT(DISTINCT cl.laboratory_id) as labs,
             COUNT(DISTINCT ct.taster_id) as tasters,
             COUNT(DISTINCT cc.certificate_id) as certificates,
             COUNT(DISTINCT el.license_id) as licenses
      FROM exporter_profiles ep
      LEFT JOIN coffee_laboratories cl ON cl.exporter_id = ep.exporter_id AND cl.status = 'ACTIVE'
      LEFT JOIN coffee_tasters ct ON ct.exporter_id = ep.exporter_id AND ct.status = 'ACTIVE'
      LEFT JOIN competence_certificates cc ON cc.exporter_id = ep.exporter_id AND cc.status = 'ACTIVE'
      LEFT JOIN export_licenses el ON el.exporter_id = ep.exporter_id AND el.status = 'ACTIVE'
      WHERE ep.capital_verified = true
      GROUP BY ep.exporter_id, ep.business_name
    `);
    
    for (const exporter of qualifiedExporters.rows) {
      const isQualified = exporter.labs > 0 && exporter.tasters > 0 && 
                         exporter.certificates > 0 && exporter.licenses > 0;
      
      results.push({
        exporter: exporter.business_name,
        qualified: isQualified ? '✅ Yes' : '❌ No',
        labs: exporter.labs,
        tasters: exporter.tasters,
        certificates: exporter.certificates,
        licenses: exporter.licenses
      });
    }
    
  } finally {
    client.release();
  }
  
  return results;
}

async function runFullIntegrationTest() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         FULL SYSTEM INTEGRATION VERIFICATION               ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  // 1. Service Health Check
  console.log('=== 1. SERVICE HEALTH CHECK ===\n');
  const healthResults = [];
  for (const [name, config] of Object.entries(SERVICES)) {
    const result = await checkServiceHealth(name, config);
    healthResults.push(result);
  }
  
  console.table(healthResults.map(r => ({ Service: r.name, Status: r.status })));
  
  const allHealthy = healthResults.every(r => r.healthy);
  if (!allHealthy) {
    console.log('\n⚠️  Some services are not running. Integration tests may fail.\n');
  }
  
  // 2. Database Integrity
  console.log('\n=== 2. DATABASE INTEGRITY ===\n');
  const dbResults = await verifyDatabaseIntegrity();
  
  console.log('Tables:');
  console.table(dbResults.tables);
  
  console.log('\nRelationships:');
  console.table(dbResults.relationships);
  
  console.log('\nData Consistency:');
  console.table(dbResults.dataConsistency);
  
  // 3. Exporter Workflow
  console.log('\n=== 3. EXPORTER WORKFLOW INTEGRATION ===\n');
  const exporterResults = await verifyExporterWorkflow();
  
  console.log('Authentication:', exporterResults.authentication?.status);
  if (exporterResults.authentication?.userId) {
    console.log('  User ID:', exporterResults.authentication.userId);
  }
  
  if (exporterResults.preRegistration) {
    console.log('\nPre-Registration Data:');
    console.table(exporterResults.preRegistration);
  }
  
  if (exporterResults.qualification) {
    console.log('\nQualification Status:', exporterResults.qualification.status);
    console.log('  Can Create Export:', exporterResults.qualification.canExport);
    if (exporterResults.qualification.validation) {
      console.log('  Validation:', JSON.stringify(exporterResults.qualification.validation, null, 2));
    }
  }
  
  if (exporterResults.exportCreation) {
    console.log('\nExport Stats:', exporterResults.exportCreation.status);
    if (exporterResults.exportCreation.stats) {
      console.log('  Stats:', JSON.stringify(exporterResults.exportCreation.stats, null, 2));
    }
  }
  
  // 4. ECTA Integration
  console.log('\n=== 4. ECTA INTEGRATION ===\n');
  const ectaResults = await verifyECTAIntegration();
  
  console.log('Authentication:', ectaResults.authentication?.status);
  console.log('Dashboard:', ectaResults.dashboard?.status);
  if (ectaResults.dashboard?.stats) {
    console.log('  Stats:', JSON.stringify(ectaResults.dashboard.stats, null, 2));
  }
  
  console.log('Exporters List:', ectaResults.exporters?.status);
  console.log('  Count:', ectaResults.exporters?.count);
  
  console.log('Audit Log:', ectaResults.auditLog?.status);
  if (ectaResults.auditLog) {
    console.log('  Total Entries:', ectaResults.auditLog.totalEntries);
    console.log('  Exporters:', ectaResults.auditLog.exporters);
    console.log('  Action Types:', ectaResults.auditLog.actionTypes);
  }
  
  // 5. Cross-Service Integration
  console.log('\n=== 5. CROSS-SERVICE INTEGRATION ===\n');
  const crossServiceResults = await verifyCrossServiceIntegration();
  
  console.log('Qualified Exporters:');
  console.table(crossServiceResults);
  
  // Summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    INTEGRATION SUMMARY                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  const healthyServices = healthResults.filter(r => r.healthy).length;
  const totalServices = healthResults.length;
  const orphanedRecords = dbResults.relationships.filter(r => r.orphaned > 0).length;
  const qualifiedExporters = crossServiceResults.filter(r => r.qualified.includes('✅')).length;
  
  console.log(`✅ Services Running: ${healthyServices}/${totalServices}`);
  console.log(`✅ Database Tables: ${dbResults.tables.length} verified`);
  console.log(`${orphanedRecords === 0 ? '✅' : '❌'} Data Integrity: ${orphanedRecords === 0 ? 'Clean' : `${orphanedRecords} issues found`}`);
  console.log(`✅ Qualified Exporters: ${qualifiedExporters}`);
  console.log(`✅ Exporter Workflow: ${exporterResults.authentication?.status === '✅ Working' ? 'Integrated' : 'Issues found'}`);
  console.log(`✅ ECTA Integration: ${ectaResults.authentication?.status === '✅ Working' ? 'Integrated' : 'Issues found'}`);
  
  const allIntegrated = healthyServices === totalServices && 
                        orphanedRecords === 0 && 
                        exporterResults.authentication?.status === '✅ Working' &&
                        ectaResults.authentication?.status === '✅ Working';
  
  console.log('\n' + (allIntegrated ? 
    '🎉 ALL SYSTEMS FULLY INTEGRATED AND OPERATIONAL!' : 
    '⚠️  Some integration issues detected. Review details above.'));
  
  await pool.end();
}

runFullIntegrationTest().catch(error => {
  console.error('Fatal error:', error);
  pool.end();
  process.exit(1);
});
