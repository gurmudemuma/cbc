const fs = require('fs');
const path = require('path');

async function createClientIdentity() {
    try {
        const walletPath = path.join(__dirname, 'wallet');
        
        // Ensure wallet directory exists
        if (!fs.existsSync(walletPath)) {
            fs.mkdirSync(walletPath, { recursive: true });
        }
        
        // Check if admin identity exists
        const adminPath = path.join(walletPath, 'Admin@exporter-portal.coffee-export.com');
        if (!fs.existsSync(adminPath)) {
            console.log('⚠️  Admin identity not found, will be created on first connection');
            process.exit(0);
        }
        
        // Create client identity from admin
        try {
            const adminIdentity = JSON.parse(
                fs.readFileSync(path.join(adminPath, 'Admin@exporter-portal.coffee-export.com'), 'utf8')
            );
            
            const clientIdentity = {
                ...adminIdentity,
                label: 'exporterPortalClient'
            };
            
            const clientPath = path.join(walletPath, 'exporterPortalClient');
            fs.mkdirSync(clientPath, { recursive: true });
            fs.writeFileSync(
                path.join(clientPath, 'exporterPortalClient'),
                JSON.stringify(clientIdentity, null, 2)
            );
            
            console.log('✅ Client identity created successfully');
        } catch (error) {
            console.log('⚠️  Could not create client identity:', error.message);
            console.log('   This will be created on first connection');
        }
    } catch (error) {
        console.log('⚠️  Error in client identity creation:', error.message);
        process.exit(0);
    }
}

createClientIdentity();
