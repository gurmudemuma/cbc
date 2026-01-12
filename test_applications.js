/**
 * Test script to verify /api/exporter/applications endpoint
 * Run with: node test_applications.js
 */

const axios = require('axios');

async function testApplicationsEndpoint() {
    try {
        // First, login as exporter1
        console.log('Logging in as exporter1...');
        const loginResponse = await axios.post('http://localhost:3004/api/auth/login', {
            username: 'exporter1',
            password: 'password123'
        });

        const token = loginResponse.data.token;
        console.log('✓ Login successful');
        console.log('Token:', token.substring(0, 20) + '...');

        // Call applications endpoint
        console.log('\nFetching applications...');
        const appsResponse = await axios.get('http://localhost:3004/api/exporter/applications', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('\n=== APPLICATIONS RESPONSE ===');
        console.log('Status:', appsResponse.status);
        console.log('Success:', appsResponse.data.success);
        console.log('Data length:', appsResponse.data.data?.length || 0);
        console.log('\nFull response:');
        console.log(JSON.stringify(appsResponse.data, null, 2));

    } catch (error) {
        console.error('ERROR:', error.response?.data || error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Headers:', error.response.headers);
        }
    }
}

testApplicationsEndpoint();
