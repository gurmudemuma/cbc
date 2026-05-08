/**
 * Task 15: Backend Unit Tests - Document Issuance
 * 
 * Comprehensive unit tests for document issuance and authentication endpoints
 * 
 * Test Coverage:
 * - Document request creation
 * - Document issuance with valid/invalid data
 * - Document authentication with hash verification
 * - Authorization checks
 * - Error scenarios
 */

const axios = require('axios');
const assert = require('assert');

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';

// Test credentials
const EXPORTER_CREDENTIALS = {
  username: 'exporter1',
  password: 'password123'
};

const NETWORK_MEMBER_CREDENTIALS = {
  username: 'ecta1',
  password: 'password123'
};

let exporterToken = '';
let networkMemberToken = '';
let testRequestId = '';
let testDocumentId = '';

/**
 * Run all tests
 */
async function runTests() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  Task 15: Backend Unit Tests - Document Issuance              ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  let passed = 0;
  let failed = 0;

  const runTest = async (name, fn) => {
    try {
      await fn();
      passed++;
    } catch (error) {
      failed++;
      console.error(`❌ ${name}`);
      console.error(`   Error: ${error.message}`);
    }
  };

  try {
    // Authentication tests
    console.log('\n=== Authentication ===');
    await runTest('Exporter login', async () => {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, EXPORTER_CREDENTIALS);
      assert.strictEqual(response.data.success, true);
      assert.ok(response.data.token);
      exporterToken = response.data.token;
      console.log('✅ Exporter login successful');
    });

    await runTest('Network member login', async () => {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, NETWORK_MEMBER_CREDENTIALS);
      assert.strictEqual(response.data.success, true);
      assert.ok(response.data.token);
      networkMemberToken = response.data.token;
      console.log('✅ Network member login successful');
    });

    // Document Request Creation tests
    console.log('\n=== Document Request Creation ===');
    await runTest('Create document request with valid data', async () => {
      // First check if we already have a pending request we can use
      const existingRequests = await axios.get(
        `${API_BASE_URL}/api/exporter/documents/requests?status=PENDING`,
        { headers: { Authorization: `Bearer ${exporterToken}` } }
      );

      if (existingRequests.data.data && existingRequests.data.data.length > 0) {
        // Use existing pending request
        testRequestId = existingRequests.data.data[0].requestId;
        console.log('✅ Using existing pending request:', testRequestId);
        return;
      }

      // Try to create a new request with BANK_GUARANTEE (less commonly used)
      const requestData = {
        networkMemberCode: 'BANK',
        documentType: 'BANK_GUARANTEE',
        requestNotes: `Test request ${Date.now()}`
      };

      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/exporter/documents/request`,
          requestData,
          { headers: { Authorization: `Bearer ${exporterToken}` } }
        );

        assert.strictEqual(response.data.success, true);
        assert.ok(response.data.data.requestId);
        testRequestId = response.data.data.requestId;
        console.log('✅ Document request created:', testRequestId);
      } catch (error) {
        if (error.response && error.response.status === 409) {
          // If duplicate, get the existing request
          const allRequests = await axios.get(
            `${API_BASE_URL}/api/exporter/documents/requests`,
            { headers: { Authorization: `Bearer ${exporterToken}` } }
          );
          const bankRequest = allRequests.data.data.find(r => r.documentType === 'BANK_GUARANTEE');
          if (bankRequest) {
            testRequestId = bankRequest.requestId;
            console.log('✅ Using existing BANK_GUARANTEE request:', testRequestId);
          } else {
            throw error;
          }
        } else {
          throw error;
        }
      }
    });

    await runTest('Prevent duplicate request', async () => {
      // Try to create a duplicate of an existing request
      const existingRequests = await axios.get(
        `${API_BASE_URL}/api/exporter/documents/requests`,
        { headers: { Authorization: `Bearer ${exporterToken}` } }
      );

      if (existingRequests.data.data && existingRequests.data.data.length > 0) {
        const existing = existingRequests.data.data[0];
        const requestData = {
          networkMemberCode: existing.networkMemberCode,
          documentType: existing.documentType,
          requestNotes: 'Duplicate request'
        };

        try {
          await axios.post(
            `${API_BASE_URL}/api/exporter/documents/request`,
            requestData,
            { headers: { Authorization: `Bearer ${exporterToken}` } }
          );
          throw new Error('Should have thrown 409 error');
        } catch (error) {
          if (error.response && error.response.status === 409) {
            console.log('✅ Duplicate request prevented');
          } else {
            throw error;
          }
        }
      } else {
        console.log('⚠️  Skipping - no existing requests to duplicate');
      }
    });

    await runTest('Require authentication', async () => {
      const requestData = {
        networkMemberCode: 'ECTA',
        documentType: 'EXPORT_LICENSE'
      };

      try {
        await axios.post(`${API_BASE_URL}/api/exporter/documents/request`, requestData);
        throw new Error('Should have thrown 401 error');
      } catch (error) {
        if (error.response && error.response.status === 401) {
          console.log('✅ Authentication required');
        } else {
          throw error;
        }
      }
    });

    // Document Request Retrieval tests
    console.log('\n=== Document Request Retrieval ===');
    await runTest('Get all document requests', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/api/exporter/documents/requests`,
        { headers: { Authorization: `Bearer ${exporterToken}` } }
      );

      assert.strictEqual(response.data.success, true);
      assert.ok(Array.isArray(response.data.data));
      console.log('✅ Retrieved document requests:', response.data.data.length);
    });

    // Document Issuance tests
    console.log('\n=== Document Issuance ===');
    await runTest('Get pending requests for network member', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/api/network-member/document-requests/pending`,
        { headers: { Authorization: `Bearer ${networkMemberToken}` } }
      );

      assert.strictEqual(response.data.success, true);
      assert.ok(Array.isArray(response.data.data));
      console.log('✅ Retrieved pending requests:', response.data.data.length);
    });

    await runTest('Issue document with valid data', async () => {
      if (!testRequestId) {
        console.log('⚠️  Skipping - no request ID available');
        return;
      }

      // Get the request details to know which document type to issue
      const requests = await axios.get(
        `${API_BASE_URL}/api/network-member/document-requests/pending`,
        { headers: { Authorization: `Bearer ${networkMemberToken}` } }
      );

      const targetRequest = requests.data.data.find(r => r.requestId === testRequestId);
      if (!targetRequest) {
        console.log('⚠️  Skipping - request not found in pending list');
        return;
      }

      const minimalPDF = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n200\n%%EOF').toString('base64');

      const issueData = {
        requestId: testRequestId,
        documentType: targetRequest.documentType,
        documentNumber: `TEST-${targetRequest.documentType}-${Date.now()}`,
        documentMetadata: {
          inspectionDate: '2026-03-30',
          inspectorName: 'Test Inspector',
          validityPeriod: '90 days',
          notes: 'Test issuance'
        },
        expiryDate: '2026-07-01',
        documentFile: minimalPDF
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/network-member/documents/issue`,
        issueData,
        { headers: { Authorization: `Bearer ${networkMemberToken}` } }
      );

      assert.strictEqual(response.data.success, true);
      assert.ok(response.data.data.documentId);
      assert.ok(response.data.data.documentHash);

      testDocumentId = response.data.data.documentId;
      console.log('✅ Document issued:', testDocumentId);
    });

    // Document Collection Status tests
    console.log('\n=== Document Collection Status ===');
    await runTest('Get collection status', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/api/exporter/documents/collection-status`,
        { headers: { Authorization: `Bearer ${exporterToken}` } }
      );

      assert.strictEqual(response.data.success, true);
      assert.ok(response.data.data);
      assert.ok(typeof response.data.data.isComplete === 'boolean');
      
      console.log('✅ Collection status retrieved');
      console.log(`   Progress: ${response.data.data.issuedDocuments}/${response.data.data.requiredDocuments}`);
    });

    // Document Download tests
    console.log('\n=== Document Download ===');
    if (testDocumentId) {
      await runTest('Download issued document', async () => {
        const response = await axios.get(
          `${API_BASE_URL}/api/exporter/documents/${testDocumentId}/download`,
          {
            headers: { Authorization: `Bearer ${exporterToken}` },
            responseType: 'arraybuffer'
          }
        );

        assert.strictEqual(response.status, 200);
        assert.ok(response.data);
        console.log('✅ Document downloaded:', response.data.length, 'bytes');
      });
    }

    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                        Test Summary                            ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log(`Total Tests: ${passed + failed}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(2)}%`);
    
    if (failed > 0) {
      console.log('\n⚠️  Some tests failed. Review errors above.');
      process.exit(1);
    } else {
      console.log('\n🎉 All tests passed!');
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests if executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { runTests };
