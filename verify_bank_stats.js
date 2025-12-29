
const http = require('http');

const USER_CREDENTIALS = {
    username: 'banker1',
    password: 'password123'
};

const API_CONFIG = {
    hostname: 'localhost',
    port: 3001, // Commercial Bank API port is 3001
};

function makeRequest(method, path, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: API_CONFIG.hostname,
            port: API_CONFIG.port,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ statusCode: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, raw: data });
                }
            });
        });

        req.on('error', (e) => reject(e));

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function verify() {
    console.log('--- Verifying Commercial Bank API Stats ---');

    // 1. Login
    console.log('1. Logging in as Banker...');
    // Auth routes are usually at /api/auth/login or /api/users/login. 
    // export-postgres.routes.ts imported authMiddleware, suggesting a shared auth.
    // Assuming /api/auth/login based on index.ts mounting.
    const loginRes = await makeRequest('POST', '/api/auth/login', USER_CREDENTIALS);

    if (loginRes.statusCode !== 200 || !loginRes.data.data?.token) {
        console.error('Login failed:', loginRes);
        return;
    }

    const token = loginRes.data.data.token;
    console.log('Login successful.');

    // 2. Fetch Stats
    console.log('2. Fetching stats from /api/exports/dashboard/stats...');
    const statsRes = await makeRequest('GET', '/api/exports/dashboard/stats', null, token);

    console.log('Status Code:', statsRes.statusCode);
    console.log('Response:', JSON.stringify(statsRes.data, null, 2));

    if (statsRes.statusCode === 200 && statsRes.data.success && statsRes.data.data.pendingFxApprovals !== undefined) {
        console.log('✅ VERIFICATION PASSED: Bank Stats endpoint is operational.');
    } else {
        console.error('❌ VERIFICATION FAILED.');
    }
}

verify().catch(console.error);
