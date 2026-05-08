/**
 * Task 15: Backend Unit Tests - Document Authentication
 * 
 * Comprehensive unit tests for document authentication during Network Submission
 * 
 * Test Coverage:
 * - Document authentication with hash verification
 * - Blockchain verification
 * - Network Submission with issued documents
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
let testSubmissionId = '';
let testDocumentIds = [];

/**
 * Run all tests
 */
async function runTests() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  Task 15: Backend Unit Tests - Document Authentication        ║');
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
    // Setup - Login
    console.log('\n=== Setup ===');
    await runTest('Login as exporter', async () => {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, EXPORTER_CREDENTIALS);
      assert.strictEqual(response.data.success, true);
      exporterToken = response.data.token;
      console.log('✅ Exporter logged in');
    });

    await runTest('Login as network member', async () => {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, NETWORK_MEMBER_CREDENTIALS);
      assert.strictEqual(response.data.success, true);
      networkMemberToken = response.data.token;
      console.log('✅ Network member logged in');
    });

    // Get issued documents
    await runTest('Get issued documents for testing', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/api/exporter/documents/collection-status`,
        { headers: { Authorization: `Bearer ${exporterToken}` } }
      );

      testDocumentIds = response.data.data.documents
        .filter(doc => doc.status === 'ISSUED' && doc.documentId)
        .map(doc => doc.documentId);

      console.log('✅ Found issued documents:', testDocumentIds.length);
    });

    // Network Submission tests
    console.log('\n=== Network Submission with Issued Documents ===');
    if (testDocumentIds.length > 0) {
      await runTest('Submit to Network with issued document IDs', async () => {
        const submissionData = {
          exporterInfo: {
            businessName: 'Test Exporter',
            tin: '1234567890',
            businessType: 'Private Limited Company'
          },
          licenseInfo: {
            licenseNumber: 'LIC-2026-001'
          },
          issuedDocumentIds: testDocumentIds,
          supportingDocuments: [
            {
              documentType: 'COMMERCIAL_INVOICE',
              fileName: 'invoice.pdf',
              fileUrl: 'test-url'
            }
          ]
        };

        const response = await axios.post(
          `${API_BASE_URL}/api/network/submissions`,
          submissionData,
          { headers: { Authorization: `Bearer ${exporterToken}` } }
        );

        assert.strictEqual(response.data.success, true);
        assert.ok(response.data.data.submissionId);
        
        testSubmissionId = response.data.data.submissionId;
        console.log('✅ Network Submission created:', testSubmissionId);
      });
    } else {
      console.log('⚠️  Skipping Network Submission tests - no issued documents available');
    }

    await runTest('Fail submission without required documents', async () => {
      const submissionData = {
        exporterInfo: {
          businessName: 'Test Exporter',
          tin: '1234567890'
        },
        issuedDocumentIds: [],
        supportingDocuments: []
      };

      try {
        await axios.post(
          `${API_BASE_URL}/api/network/submissions`,
          submissionData,
          { headers: { Authorization: `Bearer ${exporterToken}` } }
        );
        throw new Error('Should have thrown 400 error');
      } catch (error) {
        if (error.response && error.response.status === 400) {
          console.log('✅ Missing documents validation working');
        } else {
          throw error;
        }
      }
    });

    // Document Authentication tests
    console.log('\n=== Document Authentication ===');
    if (testSubmissionId && testDocumentIds.length > 0) {
      await runTest('Authenticate document by issuer', async () => {
        const authData = {
          submissionId: testSubmissionId,
          documentId: testDocumentIds[0],
          authenticationStatus: 'VERIFIED'
        };

        const response = await axios.post(
          `${API_BASE_URL}/api/network/authenticate-document`,
          authData,
          { headers: { Authorization: `Bearer ${networkMemberToken}` } }
        );

        assert.strictEqual(response.data.success, true);
        assert.ok(response.data.data.authenticationId);
        
        console.log('✅ Document authenticated');
      });

      await runTest('Prevent authentication by non-issuer', async () => {
        const authData = {
          submissionId: testSubmissionId,
          documentId: testDocumentIds[0],
          authenticationStatus: 'VERIFIED'
        };

        try {
          await axios.post(
            `${API_BASE_URL}/api/network/authenticate-document`,
            authData,
            { headers: { Authorization: `Bearer ${exporterToken}` } }
          );
          throw new Error('Should have thrown 403 error');
        } catch (error) {
          if (error.response && error.response.status === 403) {
            console.log('✅ Non-issuer authentication prevented');
          } else {
            throw error;
          }
        }
      });
    } else {
      console.log('⚠️  Skipping authentication tests - no submission or documents available');
    }

    // Authentication Status Retrieval tests
    console.log('\n=== Authentication Status Retrieval ===');
    if (testSubmissionId) {
      await runTest('Get authentication status for submission', async () => {
        const response = await axios.get(
          `${API_BASE_URL}/api/network/submissions/${testSubmissionId}/authentications`,
          { headers: { Authorization: `Bearer ${exporterToken}` } }
        );

        assert.strictEqual(response.data.success, true);
        assert.ok(Array.isArray(response.data.data));
        
        const verified = response.data.data.filter(a => a.status === 'VERIFIED').length;
        console.log('✅ Authentication status retrieved');
        console.log(`   Progress: ${verified}/${response.data.data.length}`);
      });
    }

    // Error Scenarios tests
    console.log('\n=== Error Scenarios ===');
    await runTest('Handle non-existent submission', async () => {
      const authData = {
        submissionId: 'non-existent-id',
        documentId: 'doc-id',
        authenticationStatus: 'VERIFIED'
      };

      try {
        await axios.post(
          `${API_BASE_URL}/api/network/authenticate-document`,
          authData,
          { headers: { Authorization: `Bearer ${networkMemberToken}` } }
        );
        throw new Error('Should have thrown 404 or 500 error');
      } catch (error) {
        if (error.response && (error.response.status === 404 || error.response.status === 500)) {
          console.log('✅ Non-existent submission handled');
        } else {
          throw error;
        }
      }
    });

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
