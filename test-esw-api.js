/**
 * ESW API Endpoint Testing Script
 * Tests all ESW API endpoints to verify functionality
 */

const axios = require('axios');

const ESW_API_URL = 'http://localhost:3008/api/esw';

// Test data
const testExportId = 'EXP-2024-000001'; // Replace with actual export ID from database

// Color codes for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
    log(`✓ ${message}`, 'green');
}

function logError(message) {
    log(`✗ ${message}`, 'red');
}

function logInfo(message) {
    log(`ℹ ${message}`, 'blue');
}

function logWarning(message) {
    log(`⚠ ${message}`, 'yellow');
}

function logHeader(message) {
    console.log('\n' + '='.repeat(60));
    log(message, 'cyan');
    console.log('='.repeat(60));
}

async function testHealthCheck() {
    logHeader('Test 1: Health Check');
    try {
        const response = await axios.get('http://localhost:3008/health');
        logSuccess('Health check passed');
        logInfo(`Status: ${response.data.status}`);
        logInfo(`Service: ${response.data.service}`);
        return true;
    } catch (error) {
        logError(`Health check failed: ${error.message}`);
        return false;
    }
}

async function testGetAgencies() {
    logHeader('Test 2: Get ESW Agencies');
    try {
        const response = await axios.get(`${ESW_API_URL}/agencies`);
        logSuccess(`Retrieved ${response.data.data.length} agencies`);
        
        // Display first 5 agencies
        response.data.data.slice(0, 5).forEach(agency => {
            logInfo(`  - ${agency.agency_name} (${agency.agency_code}) - ${agency.agency_type}`);
        });
        
        return true;
    } catch (error) {
        logError(`Get agencies failed: ${error.message}`);
        return false;
    }
}

async function testSubmitToESW() {
    logHeader('Test 3: Submit Export to ESW');
    try {
        const submissionData = {
            exportId: testExportId,
            documents: [
                {
                    documentType: 'EXPORT_LICENSE',
                    fileName: 'export_license.pdf',
                    fileUrl: '/uploads/export_license.pdf'
                },
                {
                    documentType: 'QUALITY_CERTIFICATE',
                    fileName: 'quality_cert.pdf',
                    fileUrl: '/uploads/quality_cert.pdf'
                }
            ],
            certificates: [
                {
                    certificateType: 'ECTA_LICENSE',
                    certificateNumber: 'ECTA-2024-001',
                    documentUrl: '/uploads/ecta_license.pdf'
                }
            ]
        };

        const response = await axios.post(
            `${ESW_API_URL}/submissions`,
            submissionData,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-ID': 'test-user-001' // Mock user ID
                }
            }
        );

        logSuccess('Export submitted to ESW successfully');
        logInfo(`ESW Reference: ${response.data.data.eswReferenceNumber}`);
        logInfo(`Submission ID: ${response.data.data.submissionId}`);
        logInfo(`Status: ${response.data.data.status}`);
        
        return response.data.data.submissionId;
    } catch (error) {
        if (error.response) {
            logError(`Submit to ESW failed: ${error.response.data.message || error.message}`);
            if (error.response.data.details) {
                logWarning(`Details: ${JSON.stringify(error.response.data.details)}`);
            }
        } else {
            logError(`Submit to ESW failed: ${error.message}`);
        }
        return null;
    }
}

async function testGetSubmissions() {
    logHeader('Test 4: Get All ESW Submissions');
    try {
        const response = await axios.get(`${ESW_API_URL}/submissions`);
        logSuccess(`Retrieved ${response.data.data.length} submissions`);
        
        // Display first 3 submissions
        response.data.data.slice(0, 3).forEach(submission => {
            logInfo(`  - ${submission.eswReferenceNumber} (${submission.status})`);
        });
        
        return response.data.data.length > 0 ? response.data.data[0].submissionId : null;
    } catch (error) {
        logError(`Get submissions failed: ${error.message}`);
        return null;
    }
}

async function testGetSubmissionDetails(submissionId) {
    logHeader('Test 5: Get Submission Details');
    if (!submissionId) {
        logWarning('No submission ID provided, skipping test');
        return false;
    }

    try {
        const response = await axios.get(`${ESW_API_URL}/submissions/${submissionId}`);
        logSuccess('Retrieved submission details');
        logInfo(`ESW Reference: ${response.data.data.eswReferenceNumber}`);
        logInfo(`Status: ${response.data.data.status}`);
        logInfo(`Agency Approvals: ${response.data.data.agencyApprovals.length}`);
        logInfo(`Documents: ${response.data.data.documents.length}`);
        logInfo(`Pending Agencies: ${response.data.data.pendingAgencies.length}`);
        logInfo(`Approved Agencies: ${response.data.data.approvedAgencies.length}`);
        
        return true;
    } catch (error) {
        logError(`Get submission details failed: ${error.message}`);
        return false;
    }
}

async function testGetAgencyApprovals(submissionId) {
    logHeader('Test 6: Get Agency Approvals');
    if (!submissionId) {
        logWarning('No submission ID provided, skipping test');
        return false;
    }

    try {
        const response = await axios.get(`${ESW_API_URL}/submissions/${submissionId}/approvals`);
        logSuccess(`Retrieved ${response.data.data.length} agency approvals`);
        
        // Display all approvals
        response.data.data.forEach(approval => {
            logInfo(`  - ${approval.agencyName}: ${approval.status}`);
        });
        
        return true;
    } catch (error) {
        logError(`Get agency approvals failed: ${error.message}`);
        return false;
    }
}

async function testProcessAgencyApproval(submissionId) {
    logHeader('Test 7: Process Agency Approval');
    if (!submissionId) {
        logWarning('No submission ID provided, skipping test');
        return false;
    }

    try {
        const approvalData = {
            submissionId: submissionId,
            agencyCode: 'MOT',
            status: 'APPROVED',
            notes: 'All documents verified and approved'
        };

        const response = await axios.post(
            `${ESW_API_URL}/approvals`,
            approvalData,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-ID': 'mot-officer-001' // Mock MOT officer ID
                }
            }
        );

        logSuccess('Agency approval processed successfully');
        logInfo(`Agency: ${response.data.data.agencyName}`);
        logInfo(`Status: ${response.data.data.status}`);
        logInfo(`Approved By: ${response.data.data.approvedBy}`);
        
        return true;
    } catch (error) {
        if (error.response) {
            logError(`Process approval failed: ${error.response.data.message || error.message}`);
        } else {
            logError(`Process approval failed: ${error.message}`);
        }
        return false;
    }
}

async function testGetSubmissionsByExport() {
    logHeader('Test 8: Get Submissions by Export ID');
    try {
        const response = await axios.get(`${ESW_API_URL}/exports/${testExportId}/submissions`);
        logSuccess(`Retrieved ${response.data.data.length} submissions for export ${testExportId}`);
        
        response.data.data.forEach(submission => {
            logInfo(`  - ${submission.eswReferenceNumber} (${submission.status})`);
        });
        
        return true;
    } catch (error) {
        if (error.response && error.response.status === 404) {
            logWarning(`No submissions found for export ${testExportId}`);
        } else {
            logError(`Get submissions by export failed: ${error.message}`);
        }
        return false;
    }
}

async function testGetPendingApprovals() {
    logHeader('Test 9: Get Pending Approvals for Agency');
    try {
        const agencyCode = 'MOT';
        const response = await axios.get(`${ESW_API_URL}/agencies/${agencyCode}/pending`);
        logSuccess(`Retrieved ${response.data.data.length} pending approvals for ${agencyCode}`);
        
        response.data.data.slice(0, 3).forEach(approval => {
            logInfo(`  - Submission: ${approval.submissionId} (${approval.status})`);
        });
        
        return true;
    } catch (error) {
        logError(`Get pending approvals failed: ${error.message}`);
        return false;
    }
}

async function testGetStatistics() {
    logHeader('Test 10: Get ESW Statistics');
    try {
        const response = await axios.get(`${ESW_API_URL}/statistics`);
        logSuccess('Retrieved ESW statistics');
        logInfo(`Total Submissions: ${response.data.data.totalSubmissions}`);
        logInfo(`Pending: ${response.data.data.pending}`);
        logInfo(`Under Review: ${response.data.data.underReview}`);
        logInfo(`Approved: ${response.data.data.approved}`);
        logInfo(`Rejected: ${response.data.data.rejected}`);
        logInfo(`Avg Processing Time: ${response.data.data.avgProcessingTime} hours`);
        
        return true;
    } catch (error) {
        logError(`Get statistics failed: ${error.message}`);
        return false;
    }
}

async function runAllTests() {
    logHeader('ESW API Endpoint Testing');
    logInfo('Starting comprehensive API tests...');
    logInfo(`API URL: ${ESW_API_URL}`);
    logInfo(`Test Export ID: ${testExportId}`);
    
    const results = {
        passed: 0,
        failed: 0,
        skipped: 0
    };

    // Test 1: Health Check
    if (await testHealthCheck()) {
        results.passed++;
    } else {
        results.failed++;
        logError('Health check failed - ESW API may not be running');
        logInfo('Start the ESW API with: npm run dev (in api/esw directory)');
        return;
    }

    // Test 2: Get Agencies
    if (await testGetAgencies()) {
        results.passed++;
    } else {
        results.failed++;
    }

    // Test 3: Get Submissions
    const submissionId = await testGetSubmissions();
    if (submissionId) {
        results.passed++;
    } else {
        results.failed++;
    }

    // Test 4: Get Submission Details
    if (submissionId) {
        if (await testGetSubmissionDetails(submissionId)) {
            results.passed++;
        } else {
            results.failed++;
        }
    } else {
        logWarning('Skipping submission details test (no submissions found)');
        results.skipped++;
    }

    // Test 5: Get Agency Approvals
    if (submissionId) {
        if (await testGetAgencyApprovals(submissionId)) {
            results.passed++;
        } else {
            results.failed++;
        }
    } else {
        logWarning('Skipping agency approvals test (no submissions found)');
        results.skipped++;
    }

    // Test 6: Submit to ESW (creates new submission)
    const newSubmissionId = await testSubmitToESW();
    if (newSubmissionId) {
        results.passed++;
    } else {
        results.failed++;
    }

    // Test 7: Process Agency Approval
    if (newSubmissionId || submissionId) {
        if (await testProcessAgencyApproval(newSubmissionId || submissionId)) {
            results.passed++;
        } else {
            results.failed++;
        }
    } else {
        logWarning('Skipping agency approval test (no submissions available)');
        results.skipped++;
    }

    // Test 8: Get Submissions by Export
    if (await testGetSubmissionsByExport()) {
        results.passed++;
    } else {
        results.failed++;
    }

    // Test 9: Get Pending Approvals
    if (await testGetPendingApprovals()) {
        results.passed++;
    } else {
        results.failed++;
    }

    // Test 10: Get Statistics
    if (await testGetStatistics()) {
        results.passed++;
    } else {
        results.failed++;
    }

    // Summary
    logHeader('Test Summary');
    logSuccess(`Passed: ${results.passed}`);
    if (results.failed > 0) {
        logError(`Failed: ${results.failed}`);
    }
    if (results.skipped > 0) {
        logWarning(`Skipped: ${results.skipped}`);
    }
    
    const total = results.passed + results.failed + results.skipped;
    const successRate = ((results.passed / total) * 100).toFixed(1);
    
    console.log('\n' + '='.repeat(60));
    if (results.failed === 0) {
        logSuccess(`All tests passed! Success rate: ${successRate}%`);
    } else {
        logWarning(`Some tests failed. Success rate: ${successRate}%`);
    }
    console.log('='.repeat(60) + '\n');
}

// Run tests
runAllTests().catch(error => {
    logError(`Test execution failed: ${error.message}`);
    process.exit(1);
});
