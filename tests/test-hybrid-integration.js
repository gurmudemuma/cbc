/**
 * Hybrid System Integration Test
 * Tests complete data flow between Fabric and CBC
 */

const axios = require('axios');
const { Pool } = require('pg');

// Configuration
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:3000';
const BRIDGE_URL = process.env.BRIDGE_URL || 'http://localhost:3008';
const CHAINCODE_URL = process.env.CHAINCODE_URL || 'http://localhost:3001';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'coffee_export_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

// Test data
const testExporter = {
  username: `test_exporter_${Date.now()}`,
  password: 'test123',
  companyName: 'Test Coffee Export Ltd',
  tin: `TIN${Date.now()}`,
  capitalETB: 5000000
};

let adminToken;

// Helper functions
async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function loginAsAdmin() {
  const response = await axios.post(`${API_GATEWAY_URL}/api/auth/login`, {
    username: 'admin',
    password: 'admin123'
  });
  return response.data.token;
}

async function checkFabric(exporterId) {
  try {
    const response = await axios.post(`${CHAINCODE_URL}/query`, {
      fcn: 'GetExporter',
      args: [exporterId]
    });
    return JSON.parse(response.data.result);
  } catch (error) {
    return null;
  }
}

async function checkCBC(exporterId) {
  const result = await pool.query(
    'SELECT * FROM exporter_profiles WHERE exporter_id = $1',
    [exporterId]
  );
  return result.rows[0] || null;
}

// Test cases
async function test1_HealthChecks() {
  console.log('\n=== Test 1: Health Checks ===');
  
  const gatewayHealth = await axios.get(`${API_GATEWAY_URL}/health`);
  console.log('✓ API Gateway:', gatewayHealth.data.status);
  
  const bridgeHealth = await axios.get(`${BRIDGE_URL}/health`);
  console.log('✓ Blockchain Bridge:', bridgeHealth.data.status);
  
  const chaincodeHealth = await axios.get(`${CHAINCODE_URL}/health`);
  console.log('✓ Chaincode Server:', chaincodeHealth.data.status);
  
  return true;
}

async function test2_ExporterRegistration() {
  console.log('\n=== Test 2: Exporter Registration ===');
  
  adminToken = await loginAsAdmin();
  console.log('✓ Admin logged in');
  
  await axios.post(
    `${API_GATEWAY_URL}/api/exporter/register`,
    testExporter,
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  console.log('✓ Exporter registered:', testExporter.username);
  
  console.log('  Waiting for sync...');
  await sleep(5000);
  
  const fabricData = await checkFabric(testExporter.username);
  console.log('✓ Found in Fabric:', fabricData ? fabricData.status : 'NOT FOUND');
  
  const cbcData = await checkCBC(testExporter.username);
  console.log('✓ Found in CBC:', cbcData ? cbcData.status : 'NOT FOUND');
  
  return fabricData && cbcData;
}

async function test3_SyncMetrics() {
  console.log('\n=== Test 3: Sync Metrics ===');
  
  const metrics = await axios.get(`${BRIDGE_URL}/metrics`);
  console.log('✓ Sync metrics:', JSON.stringify(metrics.data, null, 2));
  
  const status = await axios.get(`${BRIDGE_URL}/sync/status`);
  console.log('✓ Sync status:', JSON.stringify(status.data, null, 2));
  
  return true;
}

// Run all tests
async function runTests() {
  console.log('========================================');
  console.log('Hybrid System Integration Test');
  console.log('========================================');
  
  const results = [];
  
  try {
    results.push({ name: 'Health Checks', passed: await test1_HealthChecks() });
    results.push({ name: 'Exporter Registration', passed: await test2_ExporterRegistration() });
    results.push({ name: 'Sync Metrics', passed: await test3_SyncMetrics() });
  } catch (error) {
    console.error('\n✗ Test failed:', error.message);
    results.push({ name: 'Error', passed: false });
  } finally {
    await pool.end();
  }
  
  console.log('\n========================================');
  console.log('Test Results');
  console.log('========================================');
  results.forEach(r => {
    console.log(`${r.passed ? '✓' : '✗'} ${r.name}`);
  });
  
  const allPassed = results.every(r => r.passed);
  console.log('\n' + (allPassed ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED'));
  
  process.exit(allPassed ? 0 : 1);
}

runTests();
