
import axios from 'axios';

const API_URL = 'http://localhost:3004/api';

async function main() {
    try {
        console.log('1. Registering new test user...');
        const username = `debug_user_${Date.now()}`;
        const email = `${username}@example.com`;
        const password = 'password123';

        let token = '';
        let userId = '';

        try {
            const regRes = await axios.post(`${API_URL}/auth/register`, {
                username,
                email,
                password,
                organizationName: 'Debug Org',
                tin: '1234567890',
                address: 'Debug Address',
                role: 'exporter'
            });
            console.log('Registration Status:', regRes.status);
        } catch (e: any) {
            if (e.response) {
                console.log('Registration failed (might already exist):', e.response.status);
            } else {
                console.error('Registration error:', e.message);
                return;
            }
        }

        console.log('2. Logging in...');
        try {
            const loginRes = await axios.post(`${API_URL}/auth/login`, {
                username, // Corrected: Using username instead of email
                password
            });
            token = loginRes.data.data.token;
            console.log('Login successful. Token obtained.');
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

        console.log('3. Attempting to register exporter profile...');
        try {
            const profileData = {
                businessName: 'Debug Coffee Exporters ' + Date.now(),
                tin: '999888' + Math.floor(Math.random() * 1000),
                registrationNumber: 'REG-2024-' + Math.floor(Math.random() * 1000),
                businessType: 'PRIVATE',
                minimumCapital: 15000000,
                officeAddress: 'Addis Ababa',
                city: 'Addis Ababa',
                region: 'Addis Ababa',
                contactPerson: 'Debug Person',
                email: email,
                phone: '+251911223344'
            };

            const profileRes = await axios.post(`${API_URL}/exporter/profile/register`, profileData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Profile Registration Status:', profileRes.status);
            console.log('Profile Registration Data:', JSON.stringify(profileRes.data, null, 2));

        } catch (e: any) {
            console.error('Profile Registration Failed!');
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
