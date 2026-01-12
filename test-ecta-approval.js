/**
 * Test Script for ECTA Approval/Rejection Endpoints
 * 
 * This script tests all ECTA approval and rejection endpoints
 * to ensure they're working correctly after the fix.
 */

const axios = require('axios');

const ECTA_API_BASE = 'http://localhost:3003/api';

// Test configuration
const TEST_EXPORT_ID = 'test-export-001';
const TEST_TOKEN = 'your-test-token-here'; // Replace with actual token

const apiClient = axios.create({
  baseURL: ECTA_API_BASE,
  headers: {
    'Authorization': `Bearer ${TEST_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

async function testLicenseApproval() {
  console.log('\n=== Testing License Approval ===');
  try {
    const response = await apiClient.post(`/license/${TEST_EXPORT_ID}/approve`, {
      licenseNumber: 'ECTA-EXP-2024-TEST-001',
      notes: 'Test license approval'
    });
    console.log('✅ License Approval:', response.data);
    return true;
  } catch (error) {
    console.error('❌ License Approval Failed:', error.response?.data || error.message);
    return false;
  }
}

async function testLicenseRejection() {
  console.log('\n=== Testing License Rejection ===');
  try {
    const response = await apiClient.post(`/license/${TEST_EXPORT_ID}/reject`, {
      category: 'Expired License',
      reason: 'The export license has expired. Please renew before resubmitting.'
    });
    console.log('✅ License Rejection:', response.data);
    return true;
  } catch (error) {
    console.error('❌ License Rejection Failed:', error.response?.data || error.message);
    return false;
  }
}

async function testQualityApproval() {
  console.log('\n=== Testing Quality Approval ===');
  try {
    const response = await apiClient.post(`/quality/${TEST_EXPORT_ID}/approve`, {
      qualityGrade: 'Grade 2',
      qualityCertNumber: 'QC-TEST-001',
      moistureContent: 11.5,
      defectCount: 3,
      cupScore: 87.5,
      inspectionNotes: 'Excellent quality coffee with balanced profile'
    });
    console.log('✅ Quality Approval:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Quality Approval Failed:', error.response?.data || error.message);
    return false;
  }
}

async function testQualityRejection() {
  console.log('\n=== Testing Quality Rejection ===');
  try {
    const response = await apiClient.post(`/quality/${TEST_EXPORT_ID}/reject`, {
      category: 'Excessive Moisture Content',
      reason: 'Moisture content measured at 14.2%, exceeding the maximum allowed 12.5%'
    });
    console.log('✅ Quality Rejection:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Quality Rejection Failed:', error.response?.data || error.message);
    return false;
  }
}

async function testContractApproval() {
  console.log('\n=== Testing Contract Approval ===');
  try {
    const response = await apiClient.post(`/contract/${TEST_EXPORT_ID}/approve`, {
      contractNumber: 'CON-TEST-001',
      originCertificateNumber: 'COO-TEST-001',
      notes: 'Contract verified and approved'
    });
    console.log('✅ Contract Approval:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Contract Approval Failed:', error.response?.data || error.message);
    return false;
  }
}

async function testContractRejection() {
  console.log('\n=== Testing Contract Rejection ===');
  try {
    const response = await apiClient.post(`/contract/${TEST_EXPORT_ID}/reject`, {
      category: 'Invalid Buyer Information',
      reason: 'Buyer company registration could not be verified in destination country'
    });
    console.log('✅ Contract Rejection:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Contract Rejection Failed:', error.response?.data || error.message);
    return false;
  }
}

async function testGetPendingLicenses() {
  console.log('\n=== Testing Get Pending Licenses ===');
  try {
    const response = await apiClient.get('/license/pending');
    console.log('✅ Get Pending Licenses:', {
      success: response.data.success,
      count: response.data.count,
      message: response.data.message
    });
    return true;
  } catch (error) {
    console.error('❌ Get Pending Licenses Failed:', error.response?.data || error.message);
    return false;
  }
}

async function testGetPendingQuality() {
  console.log('\n=== Testing Get Pending Quality ===');
  try {
    const response = await apiClient.get('/quality/pending');
    console.log('✅ Get Pending Quality:', {
      success: response.data.success,
      count: response.data.count
    });
    return true;
  } catch (error) {
    console.error('❌ Get Pending Quality Failed:', error.response?.data || error.message);
    return false;
  }
}

async function testGetPendingContracts() {
  console.log('\n=== Testing Get Pending Contracts ===');
  try {
    const response = await apiClient.get('/contract/pending');
    console.log('✅ Get Pending Contracts:', {
      success: response.data.success,
      count: response.data.count
    });
    return true;
  } catch (error) {
    console.error('❌ Get Pending Contracts Failed:', error.response?.data || error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   ECTA Approval/Rejection Endpoint Tests                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  const results = {
    passed: 0,
    failed: 0
  };

  // Test GET endpoints (these should work without specific export)
  if (await testGetPendingLicenses()) results.passed++; else results.failed++;
  if (await testGetPendingQuality()) results.passed++; else results.failed++;
  if (await testGetPendingContracts()) results.passed++; else results.failed++;

  console.log('\n' + '='.repeat(60));
  console.log('Note: Approval/Rejection tests require a valid export ID');
  console.log('Update TEST_EXPORT_ID and TEST_TOKEN to test these endpoints');
  console.log('='.repeat(60));

  // Uncomment these when you have a valid export ID and token
  // if (await testLicenseApproval()) results.passed++; else results.failed++;
  // if (await testLicenseRejection()) results.passed++; else results.failed++;
  // if (await testQualityApproval()) results.passed++; else results.failed++;
  // if (await testQualityRejection()) results.passed++; else results.failed++;
  // if (await testContractApproval()) results.passed++; else results.failed++;
  // if (await testContractRejection()) results.passed++; else results.failed++;

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log(`║   Test Results: ${results.passed} Passed, ${results.failed} Failed${' '.repeat(28 - results.passed.toString().length - results.failed.toString().length)}║`);
  console.log('╚════════════════════════════════════════════════════════════╝\n');
}

// Run tests
runAllTests().catch(console.error);
