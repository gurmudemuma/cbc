/**
 * Verify ECTA dashboard fix
 * Checks if "pending" endpoints now return all records (including ACTIVE ones)
 */

const axios = require('axios');

async function verify() {
    try {
        console.log('Logging in as admin...');
        const login = await axios.post('http://localhost:3004/api/auth/login', {
            username: 'admin',
            password: 'password123'
        });
        const token = login.data.data?.token || login.data.token;
        console.log('Login successful.\n');

        const headers = { 'Authorization': `Bearer ${token}` };

        // 1. Check Exporters
        console.log('1. Checking Exporters (/exporters/pending)...');
        try {
            const exporters = await axios.get('http://localhost:3003/api/preregistration/exporters/pending', { headers });
            console.log(`   Count: ${exporters.data.count}`);
            console.log(`   First item status: ${exporters.data.data[0]?.status}`);
            if (exporters.data.count > 0) console.log('   ✅ PASS: Returns data');
            else console.log('   ❌ FAIL: No data returned');
        } catch (e) { console.log(`   ❌ FAIL: ${e.message}`); }

        // 2. Check Laboratories
        console.log('\n2. Checking Laboratories (/laboratories/pending)...');
        try {
            const labs = await axios.get('http://localhost:3003/api/preregistration/laboratories/pending', { headers });
            console.log(`   Count: ${labs.data.count}`);
            console.log(`   First item status: ${labs.data.data[0]?.status}`);
            if (labs.data.count > 0) console.log('   ✅ PASS: Returns data');
            else console.log('   ❌ FAIL: No data returned');
        } catch (e) { console.log(`   ❌ FAIL: ${e.message}`); }

        // 3. Check Tasters
        console.log('\n3. Checking Tasters (/tasters/pending)...');
        try {
            const tasters = await axios.get('http://localhost:3003/api/preregistration/tasters/pending', { headers });
            console.log(`   Count: ${tasters.data.count}`);
            console.log(`   First item status: ${tasters.data.data[0]?.status}`);
            if (tasters.data.count > 0) console.log('   ✅ PASS: Returns data');
            else console.log('   ❌ FAIL: No data returned');
        } catch (e) { console.log(`   ❌ FAIL: ${e.message}`); }

        // 4. Check Competence Certificates
        console.log('\n4. Checking Competence Certificates (/competence/pending)...');
        try {
            const certs = await axios.get('http://localhost:3003/api/preregistration/competence/pending', { headers });
            console.log(`   Count: ${certs.data.count}`);
            console.log(`   First item status: ${certs.data.data[0]?.status}`);
            if (certs.data.count > 0) console.log('   ✅ PASS: Returns data');
            else console.log('   ❌ FAIL: No data returned');
        } catch (e) { console.log(`   ❌ FAIL: ${e.message}`); }

        // 5. Check Licenses
        console.log('\n5. Checking Licenses (/licenses/pending)...');
        try {
            const licenses = await axios.get('http://localhost:3003/api/preregistration/licenses/pending', { headers });
            console.log(`   Count: ${licenses.data.count}`);
            console.log(`   First item status: ${licenses.data.data[0]?.status}`);
            if (licenses.data.count > 0) console.log('   ✅ PASS: Returns data');
            else console.log('   ❌ FAIL: No data returned');
        } catch (e) {
            console.log(`   ❌ FAIL: ${e.message}`);
            if (e.response) console.log(JSON.stringify(e.response.data));
        }

        // 6. Check Stats
        console.log('\n6. Checking Global Stats (/dashboard/stats)...');
        try {
            const stats = await axios.get('http://localhost:3003/api/preregistration/dashboard/stats', { headers });
            console.log('   Stats:', JSON.stringify(stats.data.data, null, 2));
            if (stats.data.data.exporters.active > 0) console.log('   ✅ PASS: Stats include active counts');
            else console.log('   ⚠️ WARNING: No active exporters found in stats');
        } catch (e) { console.log(`   ❌ FAIL: ${e.message}`); }

    } catch (error) {
        console.error('FATAL ERROR:', error.message);
    }
}

verify();
