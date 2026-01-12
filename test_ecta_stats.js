/**
 * Test ECTA dashboard stats endpoint
 */

const axios = require('axios');

async function test() {
    try {
        // Login as ECTA user
        const login = await axios.post('http://localhost:3004/api/auth/login', {
            username: 'admin',
            password: 'password123'
        });

        console.log('Login successful\n');

        const token = login.data.data?.token || login.data.token;

        // Get global stats
        const stats = await axios.get('http://localhost:3003/api/preregistration/dashboard/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('Global Stats response:');
        console.log(JSON.stringify(stats.data, null, 2));

        // Get pending applications
        const pending = await axios.get('http://localhost:3003/api/preregistration/exporters/pending', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('\nPending Applications:');
        console.log(JSON.stringify(pending.data, null, 2));

    } catch (error) {
        console.error('ERROR:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

test();
