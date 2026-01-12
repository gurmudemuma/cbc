const http = require('http');

const loginData = JSON.stringify({
    username: 'exporter1',
    password: 'password123'
});

const loginOptions = {
    hostname: 'localhost',
    port: 3004,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData.length
    }
};

console.log('1. Logging in as exporter1...');

const req = http.request(loginOptions, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
        if (res.statusCode !== 200) {
            console.error('Login failed:', res.statusCode, body);
            process.exit(1);
        }

        const response = JSON.parse(body);
        const token = response.data.token;
        console.log('Login successful. Token received.');

        // 2. Fetch Applications
        getApplications(token);
    });
});

req.on('error', (e) => {
    console.error(`Login error: ${e.message}`);
});

req.write(loginData);
req.end();

function getApplications(token) {
    console.log('2. Fetching applications...');

    const options = {
        hostname: 'localhost',
        port: 3004,
        path: '/api/exporter/applications', // Testing the new endpoint directly
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };

    const appReq = http.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
            console.log(`Status: ${res.statusCode}`);
            if (res.statusCode === 200) {
                console.log('Response Body:', body);
                try {
                    const json = JSON.parse(body);
                    if (json.success && Array.isArray(json.data)) {
                        console.log('✅ VERIFICATION SUCCESS: Received application list array.');
                        console.log(`Count: ${json.data.length}`);
                    } else {
                        console.error('❌ VERIFICATION FAILED: Unexpected data format.');
                    }
                } catch (e) {
                    console.error('Failed to parse response JSON');
                }
            } else {
                console.error('❌ VERIFICATION FAILED: Endpoint returned error.');
                console.log('Body:', body);
            }
        });
    });

    appReq.on('error', (e) => {
        console.error(`Request error: ${e.message}`);
    });

    appReq.end();
}
