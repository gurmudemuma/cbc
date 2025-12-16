#!/usr/bin/env node

/*
 * Register exporter1 on the blockchain using the admin identity for Commercial Bank
 * Usage: DEFAULT_TEST_EXPORTER_PASSWORD=Exporter123!@# node scripts/register-exporter1.js
 */

const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

async function registerExporter1() {
  try {
    const username = process.env.DEFAULT_TEST_EXPORTER_USERNAME || 'exporter1';
    const password = process.env.DEFAULT_TEST_EXPORTER_PASSWORD || 'Exporter123!@#';
    const email = process.env.DEFAULT_TEST_EXPORTER_EMAIL || 'exporter1@example.com';
    const org = process.env.DEFAULT_TEST_EXPORTER_ORG || 'commercialbank';
    const organizationId = process.env.DEFAULT_TEST_EXPORTER_ID || 'commercialbank-001';

    console.log(`Registering ${username} for org ${org} (id: ${organizationId})`);

    // Connection profile path
    const ccpPath = path.resolve(__dirname, '..', 'network', 'organizations', 'peerOrganizations', `${org}.coffee-export.com`, `connection-${org}.json`);
    if (!fs.existsSync(ccpPath)) {
      throw new Error(`Connection profile not found: ${ccpPath}`);
    }

    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    // Wallet path for the api of the org
    const walletPath = path.join(__dirname, '..', 'api', org, 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const adminIdentity = await wallet.get('admin');
    if (!adminIdentity) {
      console.error('Admin identity not found. Run scripts/enroll-admins.sh first.');
      process.exit(1);
    }

    // Connect gateway as admin
    const gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: 'admin',
      discovery: { enabled: true, asLocalhost: true }
    });

    const network = await gateway.getNetwork('coffeechannel');
    const contract = network.getContract('user-management');

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    const userId = `USER-${Date.now()}-${Math.random().toString(36).substr(2,9).toUpperCase()}`;

    const user = {
      id: userId,
      username,
      passwordHash,
      email,
      organizationId,
      role: 'exporter',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    };

    console.log('Submitting CreateUser transaction to the blockchain...');
    await contract.submitTransaction('CreateUser', JSON.stringify(user));

    console.log(`✅ Registered user ${username} (id: ${userId})`);

    await gateway.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('Failed to register exporter1:', error);
    process.exit(1);
  }
}

registerExporter1();
