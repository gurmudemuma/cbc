#!/usr/bin/env node

const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// User configurations
const users = [
    {
        username: 'exporter1',
        password: 'Password123',
        email: 'exporter1@bank.com',
        organizationId: 'commercialbank-001',
        role: 'exporter',
        org: 'commercialbank',
        mspId: 'commercialbankMSP'
    },
    {
        username: 'banker1',
        password: 'Password123',
        email: 'banker1@nationalbank.com',
        organizationId: 'NATIONAL-BANK-001',
        role: 'banker',
        org: 'nationalbank',
        mspId: 'NationalBankMSP'
    },
    {
        username: 'inspector1',
        password: 'Password123',
        email: 'inspector1@ncat.gov',
        organizationId: 'NCAT-001',
        role: 'inspector',
        org: 'ncat',
        mspId: 'NCATMSP'
    },
    {
        username: 'shipper1',
        password: 'Password123',
        email: 'shipper1@shipping.com',
        organizationId: 'SHIPPING-LINE-001',
        role: 'shipper',
        org: 'shippingline',
        mspId: 'ShippingLineMSP'
    }
];

async function registerUser(userConfig) {
    try {
        console.log(`\n📝 Registering ${userConfig.username} in ${userConfig.org}...`);

        // Load connection profile
        const ccpPath = path.resolve(__dirname, '..', 'network', 'organizations', 'peerOrganizations', 
            `${userConfig.org}.coffee-export.com`, `connection-${userConfig.org}.json`);
        
        if (!fs.existsSync(ccpPath)) {
            throw new Error(`Connection profile not found: ${ccpPath}`);
        }

        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create wallet
        const walletPath = path.join(__dirname, '..', 'api', userConfig.org, 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        // Check if admin exists
        const adminIdentity = await wallet.get('admin');
        if (!adminIdentity) {
            console.log(`❌ Admin identity not found for ${userConfig.org}. Run enroll-admins.sh first.`);
            return false;
        }

        // Create gateway
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity: 'admin',
            discovery: { enabled: true, asLocalhost: true }
        });

        // Get network and contract
        const network = await gateway.getNetwork('coffeechannel');
        const contract = network.getContract('user-management');

        // Hash password
        const passwordHash = await bcrypt.hash(userConfig.password, 10);

        // Generate user ID
        const userId = `USER-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        // Create user object
        const user = {
            id: userId,
            username: userConfig.username,
            passwordHash: passwordHash,
            email: userConfig.email,
            organizationId: userConfig.organizationId,
            role: userConfig.role,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isActive: true
        };

        // Submit transaction
        console.log(`   Submitting transaction to blockchain...`);
        await contract.submitTransaction('CreateUser', JSON.stringify(user));

        console.log(`✅ Successfully registered ${userConfig.username}`);
        console.log(`   User ID: ${userId}`);
        console.log(`   Email: ${userConfig.email}`);
        console.log(`   Organization: ${userConfig.organizationId}`);
        console.log(`   Role: ${userConfig.role}`);

        // Disconnect
        await gateway.disconnect();
        return true;

    } catch (error) {
        console.log(`❌ Failed to register ${userConfig.username}`);
        console.log(`   Error: ${error.message}`);
        return false;
    }
}

async function main() {
    console.log('==========================================');
    console.log('🚀 Registering Test Users via Blockchain');
    console.log('==========================================');

    let successCount = 0;
    let failCount = 0;

    for (const userConfig of users) {
        const success = await registerUser(userConfig);
        if (success) {
            successCount++;
        } else {
            failCount++;
        }
    }

    console.log('\n==========================================');
    console.log('📊 Registration Summary');
    console.log('==========================================');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log('==========================================\n');

    if (successCount > 0) {
        console.log('📋 Login Credentials:');
        console.log('--------------------');
        users.forEach(user => {
            console.log(`${user.org.padEnd(15)} username: ${user.username.padEnd(12)} password: ${user.password}`);
        });
        console.log('\n🌐 Access the frontend at: http://localhost:5173\n');
    }

    process.exit(failCount > 0 ? 1 : 0);
}

main();
