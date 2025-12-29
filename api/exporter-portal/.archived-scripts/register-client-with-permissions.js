#!/usr/bin/env node

const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

async function main() {
    try {
        // Load the network configuration
        const ccpPath = path.resolve(__dirname, 'connection-commercialbank-fixed.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new CA client for interacting with the CA
        const caInfo = ccp.organizations['CommercialBank'].certificateAuthorities[0];
        const caURL = ccp.certificateAuthorities[caInfo].url;
        const ca = new FabricCAServices(caURL);

        // Create a new file system based wallet for managing identities
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        // Check to see if we've already enrolled the user
        const userIdentity = await wallet.get('exporterPortalClient');
        if (userIdentity) {
            console.log('Removing existing "exporterPortalClient" identity from wallet');
            await wallet.remove('exporterPortalClient');
        }

        // Check to see if we've enrolled the admin user
        const adminIdentity = await wallet.get('admin');
        if (!adminIdentity) {
            console.log('An identity for the admin user "admin" does not exist in the wallet');
            console.log('Run the enrollAdmin.js application first');
            return;
        }

        // Build a user object for authenticating with the CA
        const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(adminIdentity, 'admin');

        // Register the user with proper attributes for channel access
        const secret = await ca.register({
            affiliation: 'commercialbank.department1',
            enrollmentID: 'exporterPortalClient',
            role: 'client',
            attrs: [
                { name: 'role', value: 'exporter-portal', eco: true },
                { name: 'access-level', value: 'external', eco: true },
                { name: 'hf.type', value: 'client', eco: true },
                { name: 'hf.Affiliation', value: 'commercialbank.department1', eco: true },
                { name: 'hf.Registrar.Roles', value: 'client', eco: true }
            ]
        }, adminUser);

        console.log('Successfully registered "exporterPortalClient" with CA');

        // Enroll the user
        const enrollment = await ca.enroll({
            enrollmentID: 'exporterPortalClient',
            enrollmentSecret: secret
        });

        // Import the new identity into the wallet
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: 'CommercialBankMSP',
            type: 'X.509',
        };

        await wallet.put('exporterPortalClient', x509Identity);
        console.log('Successfully enrolled "exporterPortalClient" and imported it into the wallet');
        console.log('The identity now has proper permissions to access the channel');

    } catch (error) {
        console.error(`Failed to register user "exporterPortalClient": ${error}`);
        process.exit(1);
    }
}

main();
