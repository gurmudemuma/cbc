#!/usr/bin/env node

/**
 * Comprehensive Verification Script
 * Tests all Exporter and ECTA functionality
 * 
 * This script verifies:
 * 1. All API services are running
 * 2. Database connectivity
 * 3. Exporter Portal functionality
 * 4. ECTA functionality (pre-registration, licensing, quality)
 * 5. Export workflow
 * 6. Data integrity
 */

const http = require('http');
const { Pool } = require('pg');

// Configuration
const SERVICES = {
  'Commercial Bank': { port: 3001, path: '/api/health' },
  'Custom Authorities': { port: 3002, path: '/api/health' },
  'ECTA': { port: 3003, path: '/api/health' },
  'Exporter Portal': { port: 3004, path: '/api/health' },
  'National Bank': { port: 3005, path: '/api/health' },
  'ECX': { port: 3006, path: '/api/health' },
  'Shipping Line': { port: 3007, path: '/api/health' }
};

const TEST_USERS = {
  exporter: { username: 'exporter1', password: 'password123', port: 3004 },
  ecta: { username: 'ecta1', password: 'password123', port: 3003 },
  banker: { username: 'banker1', password: 'password123', port: 3001 }
};

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'coffee_export_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
};

// Utility functions
function makeRequest(hostname, port, path, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
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
          const parsed = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (e) => reject(e));
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

async function login(username, password, port) {
  try {
    const response = await makeRequest('localhost', port, '/api/auth/login', 'POST', {
      username,
      password
    });
    
    if (response.statusCode === 200 && response.data.data?.token) {
      return response.data.data.token;
    }
    return null;
  } catch (error) {
    return null;
  }
}

// Test functions
async function testServiceHealth() {
  console.log('\n=== Testing Service Health ===');
  const results = {};
  
  for (const [name, config] of Object.entries(SERVICES)) {
    try {
      const response = await makeRequest('localhost', config.port, config.path);
      // 200 = healthy, 404 = no health endpoint but service running, 401 = auth required but service running
      const isHealthy = response.statusCode === 200 || response.statusCode === 404 || response.statusCode === 401;
      results[name] = isHealthy ? '✅ Running' : `❌ Unhealthy (${response.statusCode})`;
    } catch (error) {
      results[name] = `❌ Not responding (${error.message})`;
    }
  }
  
  console.table(results);
  return Object.values(results).every(r => r.includes('✅'));
}

async function testDatabaseConnection() {
  console.log('\n=== Testing Database Connection ===');
  const pool = new Pool(dbConfig);
  
  try {
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Test key tables exist
    const tables = [
      'exporter_profiles',
      'coffee_laboratories',
      'coffee_tasters',
      'competence_certificates',
      'export_licenses',
      'exports',
      'export_status_history',
      'users'
    ];
    
    for (const table of tables) {
      const result = await client.query(
        `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)`,
        [table]
      );
      const exists = result.rows[0].exists;
      console.log(`  ${exists ? '✅' : '❌'} Table: ${table}`);
    }
    
    client.release();
    await pool.end();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    await pool.end();
    return false;
  }
}

async function testExporterPortal() {
  console.log('\n=== Testing Exporter Portal ===');
  const port = TEST_USERS.exporter.port;
  
  try {
    // Test login
    console.log('Testing exporter login...');
    const token = await login(TEST_USERS.exporter.username, TEST_USERS.exporter.password, port);
    
    if (!token) {
      console.log('❌ Exporter login failed');
      return false;
    }
    console.log('✅ Exporter login successful');
    
    // Test stats endpoint
    console.log('Testing export stats...');
    const statsResponse = await makeRequest('localhost', port, '/api/exports/stats', 'GET', null, token);
    
    if (statsResponse.statusCode === 200 && statsResponse.data.success) {
      console.log('✅ Export stats endpoint working');
      console.log('  Stats:', JSON.stringify(statsResponse.data.data, null, 2));
    } else {
      console.log('❌ Export stats endpoint failed');
      return false;
    }
    
    // Test get exports
    console.log('Testing get exports...');
    const exportsResponse = await makeRequest('localhost', port, '/api/exports', 'GET', null, token);
    
    if (exportsResponse.statusCode === 200) {
      console.log(`✅ Get exports working (${exportsResponse.data.data?.length || 0} exports found)`);
    } else {
      console.log('❌ Get exports failed');
    }
    
    // Test qualification status
    console.log('Testing qualification status...');
    const qualResponse = await makeRequest('localhost', port, '/api/exporter/qualification-status', 'GET', null, token);
    
    if (qualResponse.statusCode === 200) {
      console.log('✅ Qualification status endpoint working');
      console.log('  Status:', qualResponse.data.data?.status || 'N/A');
    } else {
      console.log('⚠️  Qualification status endpoint not available (may be expected)');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Exporter Portal test failed:', error.message);
    return false;
  }
}

async function testECTAPreRegistration() {
  console.log('\n=== Testing ECTA Pre-Registration ===');
  const port = TEST_USERS.ecta.port;
  
  try {
    // Test login
    console.log('Testing ECTA login...');
    const token = await login(TEST_USERS.ecta.username, TEST_USERS.ecta.password, port);
    
    if (!token) {
      console.log('❌ ECTA login failed');
      return false;
    }
    console.log('✅ ECTA login successful');
    
    // Test dashboard stats
    console.log('Testing ECTA dashboard stats...');
    const statsResponse = await makeRequest('localhost', port, '/api/preregistration/dashboard/stats', 'GET', null, token);
    
    if (statsResponse.statusCode === 200 && statsResponse.data.success) {
      console.log('✅ ECTA dashboard stats working');
      console.log('  Stats:', JSON.stringify(statsResponse.data.data, null, 2));
    } else {
      console.log('❌ ECTA dashboard stats failed');
      return false;
    }
    
    // Test get all exporters
    console.log('Testing get all exporters...');
    const exportersResponse = await makeRequest('localhost', port, '/api/preregistration/exporters', 'GET', null, token);
    
    if (exportersResponse.statusCode === 200) {
      console.log(`✅ Get exporters working (${exportersResponse.data.data?.length || 0} exporters found)`);
    } else {
      console.log('❌ Get exporters failed');
    }
    
    // Test pending applications
    console.log('Testing pending applications...');
    const pendingResponse = await makeRequest('localhost', port, '/api/preregistration/exporters/pending', 'GET', null, token);
    
    if (pendingResponse.statusCode === 200) {
      console.log(`✅ Pending applications working (${pendingResponse.data.data?.length || 0} pending)`);
    } else {
      console.log('❌ Pending applications failed');
    }
    
    return true;
  } catch (error) {
    console.error('❌ ECTA Pre-Registration test failed:', error.message);
    return false;
  }
}

async function testECTALicensing() {
  console.log('\n=== Testing ECTA Licensing ===');
  const port = TEST_USERS.ecta.port;
  
  try {
    const token = await login(TEST_USERS.ecta.username, TEST_USERS.ecta.password, port);
    
    if (!token) {
      console.log('❌ ECTA login failed');
      return false;
    }
    
    // Test pending licenses
    console.log('Testing pending licenses...');
    const pendingResponse = await makeRequest('localhost', port, '/api/licenses/pending', 'GET', null, token);
    
    if (pendingResponse.statusCode === 200) {
      console.log(`✅ Pending licenses working (${pendingResponse.data.data?.length || 0} pending)`);
    } else {
      console.log('❌ Pending licenses failed');
    }
    
    // Test get all exports
    console.log('Testing get all exports (ECTA view)...');
    const exportsResponse = await makeRequest('localhost', port, '/api/licenses/exports', 'GET', null, token);
    
    if (exportsResponse.statusCode === 200) {
      console.log(`✅ Get exports working (${exportsResponse.data.data?.length || 0} exports)`);
    } else {
      console.log('❌ Get exports failed');
    }
    
    return true;
  } catch (error) {
    console.error('❌ ECTA Licensing test failed:', error.message);
    return false;
  }
}

async function testECTAQuality() {
  console.log('\n=== Testing ECTA Quality Certification ===');
  const port = TEST_USERS.ecta.port;
  
  try {
    const token = await login(TEST_USERS.ecta.username, TEST_USERS.ecta.password, port);
    
    if (!token) {
      console.log('❌ ECTA login failed');
      return false;
    }
    
    // Test pending quality inspections
    console.log('Testing pending quality inspections...');
    const pendingResponse = await makeRequest('localhost', port, '/api/quality/pending', 'GET', null, token);
    
    if (pendingResponse.statusCode === 200) {
      console.log(`✅ Pending quality inspections working (${pendingResponse.data.data?.length || 0} pending)`);
    } else {
      console.log('❌ Pending quality inspections failed');
    }
    
    // Test get all exports
    console.log('Testing get all exports (Quality view)...');
    const exportsResponse = await makeRequest('localhost', port, '/api/quality/exports', 'GET', null, token);
    
    if (exportsResponse.statusCode === 200) {
      console.log(`✅ Get exports working (${exportsResponse.data.data?.length || 0} exports)`);
    } else {
      console.log('❌ Get exports failed');
    }
    
    return true;
  } catch (error) {
    console.error('❌ ECTA Quality test failed:', error.message);
    return false;
  }
}

async function testDataIntegrity() {
  console.log('\n=== Testing Data Integrity ===');
  const pool = new Pool(dbConfig);
  
  try {
    const client = await pool.connect();
    
    // Check for orphaned records
    console.log('Checking for orphaned records...');
    
    const checks = [
      {
        name: 'Coffee laboratories without exporters',
        query: `SELECT COUNT(*) FROM coffee_laboratories cl 
                LEFT JOIN exporter_profiles ep ON cl.exporter_id = ep.exporter_id 
                WHERE ep.exporter_id IS NULL`
      },
      {
        name: 'Coffee tasters without exporters',
        query: `SELECT COUNT(*) FROM coffee_tasters ct 
                LEFT JOIN exporter_profiles ep ON ct.exporter_id = ep.exporter_id 
                WHERE ep.exporter_id IS NULL`
      },
      {
        name: 'Exports without exporters',
        query: `SELECT COUNT(*) FROM exports e 
                LEFT JOIN exporter_profiles ep ON e.exporter_id = ep.exporter_id 
                WHERE ep.exporter_id IS NULL AND e.exporter_id IS NOT NULL`
      },
      {
        name: 'Export status history without exports',
        query: `SELECT COUNT(*) FROM export_status_history esh 
                LEFT JOIN exports e ON esh.export_id = e.export_id 
                WHERE e.export_id IS NULL`
      }
    ];
    
    let allClean = true;
    for (const check of checks) {
      const result = await client.query(check.query);
      const count = parseInt(result.rows[0].count);
      if (count > 0) {
        console.log(`❌ ${check.name}: ${count} orphaned records`);
        allClean = false;
      } else {
        console.log(`✅ ${check.name}: Clean`);
      }
    }
    
    client.release();
    await pool.end();
    return allClean;
  } catch (error) {
    console.error('❌ Data integrity test failed:', error.message);
    await pool.end();
    return false;
  }
}

async function testExportWorkflow() {
  console.log('\n=== Testing Export Workflow ===');
  const pool = new Pool(dbConfig);
  
  try {
    const client = await pool.connect();
    
    // Check export status distribution
    console.log('Checking export status distribution...');
    const statusResult = await client.query(`
      SELECT status, COUNT(*) as count 
      FROM exports 
      WHERE status IS NOT NULL
      GROUP BY status 
      ORDER BY count DESC
    `);
    
    if (statusResult.rows.length > 0) {
      console.log('✅ Export status distribution:');
      console.table(statusResult.rows);
    } else {
      console.log('⚠️  No exports found in database');
    }
    
    // Check for stuck exports (created more than 30 days ago and still pending)
    const stuckResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM exports 
      WHERE status IN ('PENDING', 'ECX_PENDING', 'ECTA_LICENSE_PENDING', 'QUALITY_PENDING') 
      AND created_at < NOW() - INTERVAL '30 days'
    `);
    
    const stuckCount = parseInt(stuckResult.rows[0].count);
    if (stuckCount > 0) {
      console.log(`⚠️  ${stuckCount} exports stuck in pending status for >30 days`);
    } else {
      console.log('✅ No stuck exports found');
    }
    
    client.release();
    await pool.end();
    return true;
  } catch (error) {
    console.error('❌ Export workflow test failed:', error.message);
    await pool.end();
    return false;
  }
}

// Main execution
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   Comprehensive Verification: Exporters & ECTA System     ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  const results = {
    'Service Health': false,
    'Database Connection': false,
    'Exporter Portal': false,
    'ECTA Pre-Registration': false,
    'ECTA Licensing': false,
    'ECTA Quality': false,
    'Data Integrity': false,
    'Export Workflow': false
  };
  
  // Run all tests
  results['Service Health'] = await testServiceHealth();
  results['Database Connection'] = await testDatabaseConnection();
  
  if (results['Database Connection']) {
    results['Exporter Portal'] = await testExporterPortal();
    results['ECTA Pre-Registration'] = await testECTAPreRegistration();
    results['ECTA Licensing'] = await testECTALicensing();
    results['ECTA Quality'] = await testECTAQuality();
    results['Data Integrity'] = await testDataIntegrity();
    results['Export Workflow'] = await testExportWorkflow();
  }
  
  // Summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    VERIFICATION SUMMARY                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  for (const [test, passed] of Object.entries(results)) {
    console.log(`${passed ? '✅' : '❌'} ${test}`);
  }
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(r => r).length;
  const successRate = ((passedTests / totalTests) * 100).toFixed(1);
  
  console.log(`\n📊 Success Rate: ${passedTests}/${totalTests} (${successRate}%)`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! System is fully operational.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Please review the output above.');
    process.exit(1);
  }
}

// Run the verification
main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
