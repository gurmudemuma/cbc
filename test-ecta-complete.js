console.log('\n=== ECTA Complete Test Suite ===\n');

const axios = require('axios');
const { Pool } = require('pg');

const ECTA_API = 'http://localhost:3003/api';
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'coffee_export_db',
  user: 'postgres',
  password: 'postgres'
});

const CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

let authToken = null;
let testResults = {
  passed: 0,
  failed: 0,
  total: 0
};

async function runTest(name, testFn) {
  testResults.total++;
  console.log(`\n[TEST ${testResults.total}] ${name}`);
  console.log('-'.repeat(60));
  
  try {
    await testFn();
    testResults.passed++;
    console.log('✅ PASSED\n');
    return true;
  } catch (error) {
    testResults.failed++;
    console.log(`❌ FAILED: ${error.message}\n`);
    return false;
  }
}

async function test1_Authentication() {
  const response = await axios.post(`${ECTA_API}/auth/login`, CREDENTIALS);
  
  if (!response.data.data?.token) {
    throw new Error('No token received');
  }
  
  authToken = response.data.data.token;
  console.log(`Token received: ${authToken.substring(0, 20)}...`);
}

async function test2_GetAllExports() {
  const response = await axios.get(`${ECTA_API}/licenses/exports`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  const exports = response.data.data || [];
  console.log(`Retrieved ${exports.length} exports`);
  
  if (exports.length === 0) {
    throw new Error('No exports found');
  }
}

async function test3_GetPendingLicenses() {
  const response = await axios.get(`${ECTA_API}/licenses/pending`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  const pending = response.data.data || [];
  console.log(`Found ${pending.length} pending license approvals`);
}

async function test4_GetPendingQuality() {
  const response = await axios.get(`${ECTA_API}/quality/pending`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  const pending = response.data.data || [];
  console.log(`Found ${pending.length} pending quality inspections`);
}

async function test5_GetPendingContracts() {
  const response = await axios.get(`${ECTA_API}/contracts/pending`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  const pending = response.data.data || [];
  console.log(`Found ${pending.length} pending contract approvals`);
}

async function test6_DatabaseStatus() {
  const result = await pool.query(`
    SELECT 
      COUNT(*) FILTER (WHERE status = 'ECX_VERIFIED') as ecx_verified,
      COUNT(*) FILTER (WHERE status = 'ECTA_LICENSE_APPROVED') as license_approved,
      COUNT(*) FILTER (WHERE status = 'ECTA_QUALITY_APPROVED') as quality_approved,
      COUNT(*) FILTER (WHERE status = 'ECTA_CONTRACT_APPROVED') as contract_approved,
      COUNT(*) as total
    FROM exports
  `);
  
  const stats = result.rows[0];
  console.log('Export Status Breakdown:');
  console.log(`  Total: ${stats.total}`);
  console.log(`  ECX_VERIFIED: ${stats.ecx_verified}`);
  console.log(`  ECTA_LICENSE_APPROVED: ${stats.license_approved}`);
  console.log(`  ECTA_QUALITY_APPROVED: ${stats.quality_approved}`);
  console.log(`  ECTA_CONTRACT_APPROVED: ${stats.contract_approved}`);
}

async function test7_WorkflowComplete() {
  const result = await pool.query(`
    SELECT COUNT(*) as count
    FROM exports
    WHERE status = 'ECTA_CONTRACT_APPROVED'
    AND export_license_number IS NOT NULL
    AND quality_grade IS NOT NULL
  `);
  
  const count = parseInt(result.rows[0].count);
  console.log(`Exports with complete ECTA workflow: ${count}`);
  
  if (count === 0) {
    throw new Error('No exports with complete workflow found');
  }
}

async function runAllTests() {
  console.log('Starting ECTA Complete Test Suite...\n');
  console.log('Configuration:');
  console.log(`  API: ${ECTA_API}`);
  console.log(`  User: ${CREDENTIALS.username}`);
  console.log('');
  
  try {
    await runTest('Authentication', test1_Authentication);
    await runTest('Get All Exports', test2_GetAllExports);
    await runTest('Get Pending Licenses', test3_GetPendingLicenses);
    await runTest('Get Pending Quality Inspections', test4_GetPendingQuality);
    await runTest('Get Pending Contracts', test5_GetPendingContracts);
    await runTest('Database Status Check', test6_DatabaseStatus);
    await runTest('Verify Complete Workflow', test7_WorkflowComplete);
    
  } catch (error) {
    console.error('\n❌ Fatal Error:', error.message);
  } finally {
    await pool.end();
  }
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed} ✅`);
  console.log(`Failed: ${testResults.failed} ${testResults.failed > 0 ? '❌' : ''}`);
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  console.log('='.repeat(60));
  
  if (testResults.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! 🎉\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  SOME TESTS FAILED\n');
    process.exit(1);
  }
}

// Run the tests
runAllTests();
