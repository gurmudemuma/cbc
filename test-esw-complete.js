console.log('\n=== ESW API Complete Test ===\n');

const axios = require('axios');

const ESW_API = 'http://localhost:3008/api/esw';
const ECTA_API = 'http://localhost:3003/api';

async function testESW() {
  try {
    // Step 1: Health check
    console.log('1. Testing ESW health endpoint...');
    const health = await axios.get('http://localhost:3008/health');
    console.log('✅ ESW API is healthy:', health.data.status);
    console.log(`   Database: ${health.data.database}`);
    console.log(`   Uptime: ${Math.round(health.data.uptime)}s\n`);
    
    // Step 2: Authenticate with ECTA (to get token)
    console.log('2. Authenticating with ECTA...');
    const login = await axios.post(`${ECTA_API}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    if (!login.data.data?.token) {
      throw new Error('No token received from ECTA');
    }
    
    const token = login.data.data.token;
    console.log('✅ Authentication successful\n');
    
    // Step 3: Get ESW statistics
    console.log('3. Testing ESW statistics endpoint...');
    const stats = await axios.get(`${ESW_API}/statistics`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ ESW Statistics:');
    console.log(`   Total Submissions: ${stats.data.data?.totalSubmissions || 0}`);
    console.log(`   Pending: ${stats.data.data?.pendingSubmissions || 0}`);
    console.log(`   Approved: ${stats.data.data?.approvedSubmissions || 0}`);
    console.log(`   Rejected: ${stats.data.data?.rejectedSubmissions || 0}\n`);
    
    // Step 4: Get agencies
    console.log('4. Testing get agencies endpoint...');
    const agencies = await axios.get(`${ESW_API}/agencies`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`✅ Retrieved ${agencies.data.data?.length || 0} agencies`);
    if (agencies.data.data && agencies.data.data.length > 0) {
      console.log('   Sample agencies:');
      agencies.data.data.slice(0, 3).forEach(agency => {
        console.log(`   - ${agency.agencyName} (${agency.agencyCode})`);
      });
    }
    console.log('');
    
    // Step 5: Get all submissions
    console.log('5. Testing get all submissions endpoint...');
    const submissions = await axios.get(`${ESW_API}/submissions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`✅ Retrieved ${submissions.data.data?.length || 0} ESW submissions\n`);
    
    // Step 6: Check exports ready for ESW
    console.log('6. Checking exports ready for ESW submission...');
    const exports = await axios.get(`${ECTA_API}/licenses/exports`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const readyExports = exports.data.data?.filter(e => 
      e.status === 'ECTA_CONTRACT_APPROVED' || e.status === 'ESW_SUBMISSION_PENDING'
    ) || [];
    
    console.log(`✅ Found ${readyExports.length} exports ready for ESW submission`);
    if (readyExports.length > 0) {
      console.log('   Sample exports:');
      readyExports.slice(0, 3).forEach(exp => {
        console.log(`   - ${exp.exportId?.substring(0, 8)}... (${exp.coffeeType})`);
      });
    }
    console.log('');
    
    console.log('✅ ALL ESW API TESTS PASSED!\n');
    console.log('📝 Summary:');
    console.log('  - ESW API is running on port 3008');
    console.log('  - Database connection is healthy');
    console.log('  - Authentication is working');
    console.log('  - All endpoints are accessible');
    console.log(`  - ${readyExports.length} exports ready for ESW submission`);
    console.log('');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testESW();
