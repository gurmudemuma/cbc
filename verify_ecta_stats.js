
const http = require('http');

const USER_CREDENTIALS = {
    username: 'ecta1', // Using ECTA official user from register_users.js
    password: 'password123'
};

const API_CONFIG = {
    hostname: 'localhost',
    port: 3003,
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
    console.log('--- Verifying ECTA Dashboard Stats ---');

    // 1. Login
    console.log('1. Logging in as ECTA Official...');
    // ECTA auth might be on a different port if using shared auth service, 
    // but typically each service has its own auth or proxies it. 
    // Checking docker-compose, ECTA is 3003. Auth routes usually mounted at /api/auth.
    const loginRes = await makeRequest('POST', '/api/auth/login', USER_CREDENTIALS);

    if (loginRes.statusCode !== 200 || !loginRes.data.data?.token) {
        console.error('Login failed:', loginRes);
        // Try registering if login fails
        console.log('Login failed. Attempting registration...');
        const registerRes = await makeRequest('POST', '/api/auth/register', {
            ...USER_CREDENTIALS,
            email: 'ecta1@test.com',
            role: 'ecta_official',
            organizationId: 'ECTA'
        });
        console.log('Registration result:', registerRes.statusCode);

        // Retry login
        const retryLogin = await makeRequest('POST', '/api/auth/login', USER_CREDENTIALS);
        if (retryLogin.statusCode !== 200) {
            console.error('Retry login failed. Aborting. Response:', retryLogin);
            return;
        }
        loginRes.data = retryLogin.data;
    }

    const token = loginRes.data.data.token;
    console.log('Login successful.');

    // 2. Fetch Stats
    console.log('2. Fetching stats from /api/ecta/dashboard/stats...');
    // NOTE: The route in prergistration.routes.ts is mounted. 
    // I need to check api/ecta/src/index.ts to see the base path for preregistration routes.
    // Usually it's /api/ecta/.... checking index.ts would be wise, but I'll guess /api/ecta/dashboard/stats first 
    // based on previous patterns, or /api/preregistration/dashboard/stats.
    // Let's assume the router is mounted at /api/ecta for now.

    const statsRes = await makeRequest('GET', '/api/preregistration/dashboard/stats', null, token);

    console.log('Status Code:', statsRes.statusCode);
    console.log('Response:', JSON.stringify(statsRes.data, null, 2));

    if (statsRes.statusCode === 200 && statsRes.data.success && statsRes.data.data.exporters) {
        console.log('✅ VERIFICATION PASSED: ECTA Stats endpoint is operational.');
    } else {
        console.error('❌ VERIFICATION FAILED.');
    }
}

verify().catch(console.error);
