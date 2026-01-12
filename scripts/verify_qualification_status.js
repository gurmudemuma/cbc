
const http = require('http');

const USER_CREDENTIALS = {
    username: 'exporter1',
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
    console.log('--- Verifying Exporter Qualification Status ---');

    // 1. Login
    console.log('1. Logging in as Exporter...');
    let loginRes = await makeRequest('POST', '/api/auth/login', USER_CREDENTIALS);

    if (loginRes.statusCode !== 200 || !loginRes.data.data?.token) {
        console.log('Login failed (possibly user does not exist). Attempting registration...');
        const registerRes = await makeRequest('POST', '/api/auth/register', {
            ...USER_CREDENTIALS,
            email: 'exporter1@test.com',
            role: 'exporter',
            organizationId: 'exporter-portal', // Using 'exporter-portal' as org ID for now, or maybe 'exporter1'
            tin: 'TIN-EXP-001-' + Date.now()
        });

        console.log('Registration result:', registerRes.statusCode, registerRes.data);

        // Retry login
        loginRes = await makeRequest('POST', '/api/auth/login', USER_CREDENTIALS);
        if (loginRes.statusCode !== 200) {
            console.error('Retry login failed. Aborting. Response:', loginRes);
            return;
        }
    }

    const token = loginRes.data.data.token;
    console.log('Login successful. Token acquired.');

    // 2. Fetch Qualification Status
    console.log('2. Fetching qualification status from /api/exporter/qualification-status...');
    const statusRes = await makeRequest('GET', '/api/exporter/qualification-status', null, token);

    console.log('Status Code:', statusRes.statusCode);

    let exporterId = null;

    if (statusRes.statusCode === 200 && statusRes.data.success) {
        const data = statusRes.data.data;
        console.log('Qualification Status Data keys:', Object.keys(data));

        if (data.profile && data.profile.exporter_id) {
            exporterId = data.profile.exporter_id;
            console.log('Found Exporter ID:', exporterId);
        } else {
            console.log('Exporter Profile not found or ID missing in qualification status.');
            // If profile is null, we can't test dashboard easily without creating one.
            // But if generic exporter logic exists, maybe we can register one.
            // For now, logging failure to proceed.
        }

        if (data.hasOwnProperty('profile') && data.hasOwnProperty('laboratory') && data.hasOwnProperty('taster')) {
            console.log('✅ VERIFICATION PASSED: Qualification Status endpoint returns correct structure.');
        } else {
            console.log('❌ VERIFICATION FAILED: Qualification Status structure mismatch.');
        }
    } else {
        console.error('❌ VERIFICATION FAILED: Qualification Status API Error.');
        return;
    }

    if (exporterId) {
        console.log('3. Fetching Dashboard Data from /api/preregistration/dashboard/exporter/' + exporterId);
        const dashRes = await makeRequest('GET', `/api/preregistration/dashboard/exporter/${exporterId}`, null, token);
        console.log('Dashboard Status Code:', dashRes.statusCode);

        if (dashRes.statusCode === 200 && dashRes.data.success) {
            const dashData = dashRes.data.data;
            console.log('Dashboard Data keys:', Object.keys(dashData));
            if (dashData.compliance && dashData.documents) {
                console.log('✅ VERIFICATION PASSED: Dashboard endpoint works.');
            } else {
                console.log('❌ VERIFICATION FAILED: Dashboard data missing key sections.');
            }
        } else {
            console.log('❌ VERIFICATION FAILED: Dashboard API failed.', JSON.stringify(dashRes.data));
            // If this fails, it might be because 'SELECT *' failed due to missing columns in DB.
        }
    }
}

verify().catch(console.error);

