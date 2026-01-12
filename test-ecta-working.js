console.log('ECTA Test Starting...');

const axios = require('axios');

async function testECTA() {
  console.log('\n=== Testing ECTA API ===\n');
  
  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const health = await axios.get('http://localhost:3003/health');
    console.log('✅ Health check passed:', health.data.status);
    
    // Test login - Using default admin user (password: admin123 from migration)
    console.log('\n2. Testing authentication...');
    const login = await axios.post('http://localhost:3003/api/auth/login', {
      username: 'admin',
      password: 'admin123'  // From migration 005_create_users_table.sql
    });
    
    if (login.data.data?.token) {
      console.log('✅ Authentication successful');
      const token = login.data.data.token;
      
      // Test get exports
      console.log('\n3. Testing get exports...');
      const exports = await axios.get('http://localhost:3003/api/licenses/exports', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log(`✅ Retrieved ${exports.data.data?.length || 0} exports`);
      
      console.log('\n✅ ALL TESTS PASSED!');
      console.log('\n📝 Test Summary:');
      console.log('  - Health check: ✅');
      console.log('  - Authentication: ✅');
      console.log('  - Get exports: ✅');
      console.log(`  - Total exports: ${exports.data.data?.length || 0}`);
    } else {
      console.log('❌ Authentication failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    console.log('\n💡 Tip: Update username/password in this script with valid credentials');
    console.log('   Run "node list-users.js" to see available users');
  }
}

testECTA();
