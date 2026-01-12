const axios = require('axios');

const services = [
    { name: 'Commercial Bank', port: 3001, url: 'http://localhost:3001' },
    { name: 'Custom Authorities', port: 3002, url: 'http://localhost:3002' },
    { name: 'ECTA', port: 3003, url: 'http://localhost:3003' },
    { name: 'Exporter Portal', port: 3004, url: 'http://localhost:3004' },
    { name: 'National Bank', port: 3005, url: 'http://localhost:3005' },
    { name: 'ECX', port: 3006, url: 'http://localhost:3006' },
    { name: 'Shipping Line', port: 3007, url: 'http://localhost:3007' }
];

async function checkService(service) {
    try {
        const response = await axios.get(`${service.url}/health`, { timeout: 3000 });
        return {
            ...service,
            status: '✅ RUNNING',
            statusCode: response.status,
            data: response.data
        };
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            return {
                ...service,
                status: '❌ NOT RUNNING',
                error: 'Connection refused - service not started'
            };
        } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
            return {
                ...service,
                status: '⚠️  TIMEOUT',
                error: 'Service not responding'
            };
        } else {
            return {
                ...service,
                status: '❌ ERROR',
                error: error.message
            };
        }
    }
}

async function checkAllServices() {
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║           API SERVICES HEALTH CHECK                      ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    const results = await Promise.all(services.map(checkService));

    console.log('┌─────────────────────────┬──────┬─────────────────────────┐');
    console.log('│ Service                 │ Port │ Status                  │');
    console.log('├─────────────────────────┼──────┼─────────────────────────┤');

    results.forEach(result => {
        const name = result.name.padEnd(23);
        const port = result.port.toString().padEnd(4);
        const status = result.status.padEnd(23);
        console.log(`│ ${name} │ ${port} │ ${status} │`);
    });

    console.log('└─────────────────────────┴──────┴─────────────────────────┘\n');

    const running = results.filter(r => r.status === '✅ RUNNING');
    const notRunning = results.filter(r => r.status.includes('❌'));

    console.log(`Summary: ${running.length}/${services.length} services running\n`);

    if (notRunning.length > 0) {
        console.log('⚠️  Services NOT running:');
        notRunning.forEach(service => {
            console.log(`   - ${service.name} (port ${service.port}): ${service.error}`);
        });
        console.log('\n💡 Tip: Check if start-all.bat is running and review the terminal output for errors.\n');
    } else {
        console.log('✅ All services are running!\n');
    }

    // Check frontend
    console.log('Checking Frontend (Vite dev server)...');
    try {
        await axios.get('http://localhost:5173', { timeout: 3000 });
        console.log('✅ Frontend is running on http://localhost:5173\n');
    } catch (error) {
        console.log('❌ Frontend is NOT running on port 5173\n');
    }
}

checkAllServices().catch(console.error);
