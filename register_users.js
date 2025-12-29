
const http = require('http');

const users = [
    { port: 3004, name: 'Exporter', data: { username: 'exporter1', password: 'password123', email: 'exporter1@test.com', role: 'exporter', organizationId: 'EXPORTER_1' } },
    { port: 3001, name: 'Commercial Bank', data: { username: 'banker1', password: 'password123', email: 'banker1@test.com', role: 'banker', organizationId: 'COMMERCIAL_BANK' } },
    { port: 3002, name: 'Customs', data: { username: 'customs1', password: 'password123', email: 'customs1@test.com', role: 'customs_officer', organizationId: 'CUSTOMS' } },
    { port: 3003, name: 'ECTA', data: { username: 'ecta1', password: 'password123', email: 'ecta1@test.com', role: 'ecta_official', organizationId: 'ECTA' } },
    { port: 3006, name: 'ECX', data: { username: 'ecx1', password: 'password123', email: 'ecx1@test.com', role: 'ecx_officer', organizationId: 'ECX' } },
    { port: 3007, name: 'Shipping', data: { username: 'shipper1', password: 'password123', email: 'shipper1@test.com', role: 'shipper', organizationId: 'SHIPPING_LINE' } }
];

async function register(user) {
    return new Promise((resolve) => {
        const data = JSON.stringify(user.data);
        const options = {
            hostname: 'localhost',
            port: user.port,
            path: '/api/auth/register',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                console.log(`[${user.name}] Status: ${res.statusCode} - ${body}`);
                resolve();
            });
        });

        req.on('error', (e) => {
            console.error(`[${user.name}] Error: ${e.message}`);
            resolve();
        });

        req.write(data);
        req.end();
    });
}

async function run() {
    console.log('Starting user registration...');
    for (const user of users) {
        await register(user);
    }
    console.log('Done.');
}

run();
