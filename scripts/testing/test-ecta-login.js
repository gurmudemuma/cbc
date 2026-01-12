const http = require('http');

function makeRequest(port, path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port,
      path,
      method,
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000
    };
    
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
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

async function testECTALogin() {
  console.log('Testing ECTA Login...\n');
  
  const credentials = [
    { username: 'ecta_admin', password: 'password123' },
    { username: 'ecta1', password: 'password123' },
    { username: 'ecta', password: 'password123' }
  ];
  
  for (const cred of credentials) {
    console.log(`Trying: ${cred.username}`);
    try {
      const res = await makeRequest(3001, '/api/auth/login', 'POST', cred);
      console.log(`  Status: ${res.statusCode}`);
      if (res.statusCode === 200) {
        console.log(`  ✅ SUCCESS!`);
        console.log(`  User:`, res.data.data?.user?.username);
        console.log(`  Role:`, res.data.data?.user?.role);
        return;
      } else {
        console.log(`  Message:`, res.data.message || res.raw);
      }
    } catch (error) {
      console.log(`  ❌ Error:`, error.message);
    }
    console.log('');
  }
  
  console.log('❌ All login attempts failed');
}

testECTALogin().catch(console.error);
