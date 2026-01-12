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

async function login(username, password) {
  const res = await makeRequest(3004, '/api/auth/login', 'POST', { username, password });
  return res.statusCode === 200 ? res.data.data.token : null;
}

async function testExporterView() {
  console.log('');
  console.log('     Exporter Application Status Verification             ');
  console.log('\n');
  
  const token = await login('exporter1', 'password123');
  if (!token) {
    console.log(' Login failed');
    return;
  }
  console.log(' Logged in as exporter1\n');
  
  // Test 1: Qualification Status
  console.log(' Test 1: Qualification Status');
  console.log(''.repeat(60));
  const qualRes = await makeRequest(3004, '/api/exporter/qualification-status', 'GET', null, token);
  if (qualRes.statusCode === 200) {
    console.log(' Endpoint working');
    console.log('\nQualification Status:');
    console.log(JSON.stringify(qualRes.data.data, null, 2));
  } else {
    console.log(' Failed:', qualRes.statusCode);
  }
  
  // Test 2: Profile Status
  console.log('\n\n Test 2: Exporter Profile');
  console.log(''.repeat(60));
  const profileRes = await makeRequest(3004, '/api/exporter/profile', 'GET', null, token);
  if (profileRes.statusCode === 200) {
    console.log(' Endpoint working');
    console.log('\nProfile Data:');
    const profile = profileRes.data.data;
    console.log(`  Business Name: ${profile.businessName || 'N/A'}`);
    console.log(`  Status: ${profile.status || 'N/A'}`);
    console.log(`  Capital Verified: ${profile.capitalVerified ? '' : ''}`);
  } else {
    console.log(' Failed:', profileRes.statusCode);
  }
  
  // Test 3: Laboratory Status
  console.log('\n\n Test 3: Laboratory Status');
  console.log(''.repeat(60));
  const labRes = await makeRequest(3004, '/api/exporter/laboratories', 'GET', null, token);
  if (labRes.statusCode === 200) {
    console.log(' Endpoint working');
    const labs = labRes.data.data || [];
    console.log(`\nLaboratories: ${labs.length}`);
    labs.forEach((lab, i) => {
      console.log(`  ${i+1}. ${lab.laboratoryName || 'N/A'} - Status: ${lab.status}`);
    });
  } else {
    console.log(' Failed:', labRes.statusCode);
  }
  
  // Test 4: Taster Status
  console.log('\n\n Test 4: Taster Status');
  console.log(''.repeat(60));
  const tasterRes = await makeRequest(3004, '/api/exporter/tasters', 'GET', null, token);
  if (tasterRes.statusCode === 200) {
    console.log(' Endpoint working');
    const tasters = tasterRes.data.data || [];
    console.log(`\nTasters: ${tasters.length}`);
    tasters.forEach((t, i) => {
      console.log(`  ${i+1}. ${t.fullName || 'N/A'} - Status: ${t.status}`);
    });
  } else {
    console.log(' Failed:', tasterRes.statusCode);
  }
  
  // Test 5: Competence Certificates
  console.log('\n\n Test 5: Competence Certificates');
  console.log(''.repeat(60));
  const certRes = await makeRequest(3004, '/api/exporter/competence-certificates', 'GET', null, token);
  if (certRes.statusCode === 200) {
    console.log(' Endpoint working');
    const certs = certRes.data.data || [];
    console.log(`\nCertificates: ${certs.length}`);
    certs.forEach((c, i) => {
      console.log(`  ${i+1}. ${c.certificateNumber || 'N/A'} - Status: ${c.status}`);
      console.log(`      Issued: ${c.issuedDate ? new Date(c.issuedDate).toLocaleDateString() : 'N/A'}`);
      console.log(`      Expires: ${c.expiryDate ? new Date(c.expiryDate).toLocaleDateString() : 'N/A'}`);
    });
  } else {
    console.log(' Failed:', certRes.statusCode);
  }
  
  // Test 6: Export Licenses
  console.log('\n\n Test 6: Export Licenses');
  console.log(''.repeat(60));
  const licRes = await makeRequest(3004, '/api/exporter/export-licenses', 'GET', null, token);
  if (licRes.statusCode === 200) {
    console.log(' Endpoint working');
    const lics = licRes.data.data || [];
    console.log(`\nLicenses: ${lics.length}`);
    lics.forEach((l, i) => {
      console.log(`  ${i+1}. ${l.licenseNumber || 'N/A'} - Status: ${l.status}`);
      console.log(`      Issued: ${l.issuedDate ? new Date(l.issuedDate).toLocaleDateString() : 'N/A'}`);
      console.log(`      Expires: ${l.expiryDate ? new Date(l.expiryDate).toLocaleDateString() : 'N/A'}`);
    });
  } else {
    console.log(' Failed:', licRes.statusCode);
  }
  
  // Test 7: Dashboard Stats
  console.log('\n\n Test 7: Dashboard Statistics');
  console.log(''.repeat(60));
  const statsRes = await makeRequest(3004, '/api/exports/stats', 'GET', null, token);
  if (statsRes.statusCode === 200) {
    console.log(' Endpoint working');
    console.log('\nDashboard Stats:');
    console.log(JSON.stringify(statsRes.data.data, null, 2));
  } else {
    console.log(' Failed:', statsRes.statusCode);
  }
  
  // Test 8: My Exports
  console.log('\n\n Test 8: My Exports');
  console.log(''.repeat(60));
  const exportsRes = await makeRequest(3004, '/api/exports', 'GET', null, token);
  if (exportsRes.statusCode === 200) {
    console.log(' Endpoint working');
    const exports = exportsRes.data.data || [];
    console.log(`\nExports: ${exports.length}`);
    exports.forEach((e, i) => {
      console.log(`  ${i+1}. ${e.coffeeType || 'N/A'} to ${e.destinationCountry || 'N/A'}`);
      console.log(`      Status: ${e.status}`);
      console.log(`      Quantity: ${e.quantity} kg`);
    });
  } else {
    console.log(' Failed:', exportsRes.statusCode);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(' Exporter Application Status Verification Complete');
  console.log('='.repeat(60));
}

testExporterView().catch(e => console.error('Error:', e.message));
