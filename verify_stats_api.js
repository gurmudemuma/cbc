
const http = require('http');

const USER_CREDENTIALS = {
    username: 'exporter1',
    password: 'password123'
};

const API_CONFIG = {
    hostname: 'localhost',
    port: 3004,
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
    console.log('--- Verifying Export Stats via API ---');

    // 1. Login
    console.log('1. Logging in...');
    const loginRes = await makeRequest('POST', '/api/auth/login', USER_CREDENTIALS);

    if (loginRes.statusCode !== 200 || !loginRes.data.data?.token) {
        console.error('Login failed:', loginRes);
        // Try registering if login fails
        console.log('Login failed (maybe user does not exist?). Attempting registration...');
        const registerRes = await makeRequest('POST', '/api/auth/register', {
            ...USER_CREDENTIALS,
            email: 'exporter1@test.com',
            role: 'exporter',
            organizationId: 'EXPORTER_1'
        });
        console.log('Registration result:', registerRes.statusCode);

        // Retry login
        const retryLogin = await makeRequest('POST', '/api/auth/login', USER_CREDENTIALS);
        if (retryLogin.statusCode !== 200) {
            console.error('Retry login failed. Aborting.');
            return;
        }
        loginRes.data = retryLogin.data;
    }

    const token = loginRes.data.data.token;
    console.log('Login successful. Token obtained.');

    // 2. Fetch Stats
    console.log('2. Fetching stats from /api/exports/stats...');
    const statsRes = await makeRequest('GET', '/api/exports/stats', null, token);

    console.log('Status Code:', statsRes.statusCode);
    console.log('Response:', JSON.stringify(statsRes.data, null, 2));

    if (statsRes.statusCode === 200 && statsRes.data.success && statsRes.data.data.totalExports !== undefined) {
        console.log('✅ VERIFICATION PASSED: Stats endpoint is working and returning correct structure.');
    } else {
        console.error('❌ VERIFICATION FAILED: Invalid response structure or status.');
    }
}

verify().catch(console.error);
