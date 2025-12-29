
import axios from 'axios';

// ECTA API runs on 3003
const API_URL = 'http://localhost:3003/api';

async function main() {
    try {
        console.log('1. Logging in as ECTA official...');
        const username = 'ecta1'; // Pre-existing user
        const password = 'password123'; // Assuming default password

        let token = '';

        try {
            const loginRes = await axios.post(`${API_URL}/auth/login`, {
                username,
                password
            });
            token = loginRes.data.data.token;
            console.log('Login successful. Token obtained.');
            console.log('Login Message:', loginRes.data.message);
        } catch (e: any) {
            console.error('Login failed!');
            if (e.response) {
                console.error('Status:', e.response.status);
                console.error('Data:', JSON.stringify(e.response.data, null, 2));
            } else {
                console.error('Error:', e.message);
            }
            return;
        }

        console.log('2. Fetching pending exporter applications...');
        try {
            const pendingRes = await axios.get(`${API_URL}/preregistration/exporters/pending`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('Fetch Status:', pendingRes.status);
            console.log('Count:', pendingRes.data.count);
            console.log('Data:', JSON.stringify(pendingRes.data.data, null, 2));

            if (pendingRes.data.data.length > 0) {
                console.log('SUCCESS: Pending applications found via ECTA API.');
            } else {
                console.log('WARNING: No pending applications found, but we expected at least one.');
            }

        } catch (e: any) {
            console.error('Fetch Failed!');
            if (e.response) {
                console.error('Status:', e.response.status);
                console.error('Data:', JSON.stringify(e.response.data, null, 2));
            } else {
                console.error('Error:', e.message);
            }
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

main();
