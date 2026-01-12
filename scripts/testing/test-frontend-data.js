const http = require('http');

function makeRequest(port, path, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost', port, path, method,
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function testRealFrontendData() {
  console.log('');
  console.log('     TESTING ACTUAL FRONTEND DATA (What User Sees)       ');
  console.log('\n');
  
  // Login as exporter1
  console.log('1. Logging in as exporter1...');
  const loginRes = await makeRequest(3004, '/api/auth/login', 'POST', {
    username: 'exporter1',
    password: 'password123'
  });
  
  if (loginRes.statusCode !== 200) {
    console.log(' Login failed:', loginRes.statusCode);
    console.log('Response:', JSON.stringify(loginRes.data, null, 2));
    return;
  }
  
  const token = loginRes.data.data.token;
  const userId = loginRes.data.data.user.id;
  console.log(' Logged in successfully');
  console.log('   User ID:', userId);
  console.log('   Username:', loginRes.data.data.user.username);
  console.log('   Role:', loginRes.data.data.user.role);
  
  // Test all sidebar endpoints
  console.log('\n2. Testing Sidebar Data Endpoints:\n');
  
  const endpoints = [
    { name: 'Profile', path: '/api/exporter/profile' },
    { name: 'Qualification Status', path: '/api/exporter/qualification-status' },
    { name: 'Laboratories', path: '/api/exporter/laboratories' },
    { name: 'Tasters', path: '/api/exporter/tasters' },
    { name: 'Competence Certificates', path: '/api/exporter/competence-certificates' },
    { name: 'Export Licenses', path: '/api/exporter/export-licenses' },
    { name: 'My Exports', path: '/api/exports' },
    { name: 'Export Stats', path: '/api/exports/stats' },
    { name: 'Dashboard', path: '/api/exporter/dashboard' }
  ];
  
  for (const endpoint of endpoints) {
    const res = await makeRequest(3004, endpoint.path, 'GET', null, token);
    console.log(` ${endpoint.name}:`);
    console.log(`   Status: ${res.statusCode}`);
    
    if (res.statusCode === 200) {
      const data = res.data.data;
      if (Array.isArray(data)) {
        console.log(`    Returns array with ${data.length} items`);
        if (data.length > 0) {
          console.log(`   First item keys:`, Object.keys(data[0]).join(', '));
        }
      } else if (data && typeof data === 'object') {
        console.log(`    Returns object`);
        console.log(`   Keys:`, Object.keys(data).join(', '));
        
        // Show actual values for important fields
        if (endpoint.name === 'Export Stats') {
          console.log(`   Values:`, JSON.stringify(data, null, 6));
        }
        if (endpoint.name === 'Qualification Status') {
          console.log(`   Can Create Export:`, data.canCreateExportRequest);
          console.log(`   Has Valid Profile:`, data.validation?.hasValidProfile);
        }
      } else {
        console.log(`     Unexpected data type:`, typeof data);
      }
    } else if (res.statusCode === 404) {
      console.log(`    Endpoint not found (404)`);
    } else {
      console.log(`    Error: ${res.statusCode}`);
      if (res.data.message) {
        console.log(`   Message:`, res.data.message);
      }
    }
    console.log('');
  }
  
  // Check what user_id is associated with exporter profile
  console.log('3. Checking User-Exporter Association:\n');
  const { Pool } = require('pg');
  const pool = new Pool({
    host: 'localhost', port: 5432, database: 'coffee_export_db',
    user: 'postgres', password: 'postgres'
  });
  
  const client = await pool.connect();
  
  // Check if user has exporter profile
  const userCheck = await client.query(`
    SELECT u.id, u.username, u.role, u.organization_id,
           ep.exporter_id, ep.business_name, ep.user_id
    FROM users u
    LEFT JOIN exporter_profiles ep ON u.id::text = ep.user_id
    WHERE u.username = $1
  `, ['exporter1']);
  
  if (userCheck.rows.length > 0) {
    const user = userCheck.rows[0];
    console.log('User Record:');
    console.log('   User ID:', user.id);
    console.log('   Username:', user.username);
    console.log('   Role:', user.role);
    console.log('   Organization ID:', user.organization_id);
    console.log('   Exporter ID:', user.exporter_id || ' NOT LINKED');
    console.log('   Business Name:', user.business_name || ' NOT LINKED');
    console.log('   Profile User ID:', user.user_id || ' NOT LINKED');
    
    if (!user.exporter_id) {
      console.log('\n PROBLEM FOUND: User is not linked to any exporter profile!');
      console.log('   This is why the sidebar shows 0 values.');
      
      // Show available exporter profiles
      const exporters = await client.query('SELECT exporter_id, business_name, user_id FROM exporter_profiles');
      console.log('\n   Available Exporter Profiles:');
      exporters.rows.forEach(e => {
        console.log(`       ${e.business_name} (ID: ${e.exporter_id}, User ID: ${e.user_id || 'NULL'})`);
      });
    }
  }
  
  client.release();
  await pool.end();
}

testRealFrontendData().catch(e => console.error('Error:', e.message));
