/**
 * API Diagnostic Script
 * Run this in the browser console to diagnose API issues
 */

console.log('=== CBC API Diagnostic Tool ===\n');

// 1. Check Authentication
console.log('1. Checking Authentication...');
const token = localStorage.getItem('token');
const user = localStorage.getItem('user');
const org = localStorage.getItem('org');

console.log('Token exists:', !!token);
console.log('Token length:', token?.length || 0);
console.log('User:', user ? JSON.parse(user) : 'Not logged in');
console.log('Organization:', org);

if (!token) {
  console.error('❌ NO TOKEN FOUND! You need to login first.');
  console.log('\nTo login, go to /login page or run:');
  console.log(`
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'your_password' })
})
.then(r => r.json())
.then(d => {
  if (d.token) {
    localStorage.setItem('token', d.token);
    localStorage.setItem('user', JSON.stringify(d.user));
    console.log('✓ Logged in successfully');
  }
});
  `);
}

// 2. Test API Endpoints
console.log('\n2. Testing API Endpoints...');

const testEndpoints = [
  { name: 'ECTA Pending Applications', url: '/api/ecta/preregistration/exporters/pending' },
  { name: 'ECTA Pending Laboratories', url: '/api/ecta/preregistration/laboratories/pending' },
  { name: 'ECTA Pending Tasters', url: '/api/ecta/preregistration/tasters/pending' },
  { name: 'ECTA Pending Competence', url: '/api/ecta/preregistration/competence/pending' },
  { name: 'ECTA Pending Licenses', url: '/api/ecta/preregistration/licenses/pending' },
  { name: 'Exporter Dashboard', url: '/api/exporter/dashboard' },
  { name: 'Exporter Profile', url: '/api/exporter/profile' },
];

async function testEndpoint(endpoint) {
  try {
    const response = await fetch(endpoint.url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✓ ${endpoint.name}: ${response.status} - ${Array.isArray(data) ? data.length : (data.data ? 'Has data' : 'No data')} items`);
      return { success: true, data };
    } else {
      console.error(`✗ ${endpoint.name}: ${response.status} - ${data.message || 'Error'}`);
      return { success: false, error: data };
    }
  } catch (error) {
    console.error(`✗ ${endpoint.name}: Network error -`, error.message);
    return { success: false, error };
  }
}

// Run tests
if (token) {
  console.log('\nRunning endpoint tests...\n');
  Promise.all(testEndpoints.map(testEndpoint))
    .then(results => {
      console.log('\n=== Test Summary ===');
      const passed = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      console.log(`Passed: ${passed}/${results.length}`);
      console.log(`Failed: ${failed}/${results.length}`);
      
      if (failed > 0) {
        console.log('\n=== Troubleshooting ===');
        console.log('1. Check if backend services are running (ports 3001-3007)');
        console.log('2. Verify Vite proxy configuration in vite.config.js');
        console.log('3. Check browser Network tab for actual request URLs');
        console.log('4. Verify database has data (run seed scripts)');
        console.log('5. Check backend logs for errors');
      }
    });
} else {
  console.log('\n⚠️  Skipping endpoint tests (no token)');
}

// 3. Check Vite Proxy
console.log('\n3. Checking Vite Proxy Configuration...');
console.log('Current URL:', window.location.href);
console.log('Expected proxy routes:');
console.log('  /api/ecta/* → http://localhost:3003/api/*');
console.log('  /api/exporter/* → http://localhost:3004/api/exporter/*');
console.log('  /api/banker/* → http://localhost:3001/api/*');

// 4. Check Database Connection
console.log('\n4. Testing Database Connection...');
fetch('/api/ecta/preregistration/exporters', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(data => {
  if (Array.isArray(data) || data.data) {
    console.log('✓ Database connection working');
    console.log(`  Found ${Array.isArray(data) ? data.length : data.data?.length || 0} exporters`);
  } else {
    console.log('⚠️  Database might be empty or query failed');
  }
})
.catch(e => console.error('✗ Database connection test failed:', e.message));

console.log('\n=== Diagnostic Complete ===');
console.log('Copy the output above and share with your team for troubleshooting.\n');
