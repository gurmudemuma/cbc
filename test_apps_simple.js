/**
 * Simplified test - just check the applications endpoint
 */

const axios = require('axios');

async function test() {
    try {
        // Login
        const login = await axios.post('http://localhost:3004/api/auth/login', {
            username: 'exporter1',
            password: 'password123'
        });

        console.log('Login response:', JSON.stringify(login.data, null, 2));

        const token = login.data.data?.token || login.data.token;
        if (!token) {
            console.error('No token in response!');
            return;
        }

        console.log('\nToken:', token.substring(0, 30) + '...\n');

        // Get applications
        const apps = await axios.get('http://localhost:3004/api/exporter/applications', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('Applications response:');
        console.log(JSON.stringify(apps.data, null, 2));
        console.log('\nNumber of applications:', apps.data.data?.length || 0);

    } catch (error) {
        console.error('ERROR:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

test();
