#!/usr/bin/env node

/**
 * Create Dedicated Client Identity for Exporter Portal
 * Creates a specific client identity under Commercial Bank MSP
 */

const fs = require('fs');
const path = require('path');
const { Wallets } = require('fabric-network');

async function createClientIdentity() {
  try {
    console.log('🔐 Creating dedicated Exporter Portal client identity...');

    // Load admin identity as template
    const walletPath = path.resolve(__dirname, 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    
    const adminIdentity = await wallet.get('admin');
    if (!adminIdentity) {
      throw new Error('Admin identity not found. Please ensure admin is enrolled first.');
    }

    console.log('✅ Admin identity found');

    // Create dedicated client identity
    const clientIdentity = {
      credentials: {
        certificate: adminIdentity.credentials.certificate,
        privateKey: adminIdentity.credentials.privateKey
      },
      mspId: 'CommercialBankMSP',
      type: 'X.509',
      version: 1
    };

    // Save client identity
    await wallet.put('exporterPortalClient', clientIdentity);
    console.log('✅ Created exporterPortalClient identity');

    // Verify identity was created
    const verifyIdentity = await wallet.get('exporterPortalClient');
    if (verifyIdentity) {
      console.log('✅ Client identity verified and ready for use');
      console.log('🎯 Identity Details:');
      console.log(`   - Name: exporterPortalClient`);
      console.log(`   - MSP: ${verifyIdentity.mspId}`);
      console.log(`   - Type: ${verifyIdentity.type}`);
    }

    console.log('🎉 Exporter Portal client identity created successfully!');
    
  } catch (error) {
    console.error('❌ Failed to create client identity:', error.message);
    process.exit(1);
  }
}

// Run the script
createClientIdentity();
