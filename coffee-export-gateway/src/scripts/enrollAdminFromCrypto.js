/**
 * Enroll Admin from Cryptogen Materials
 * 
 * This script creates an admin identity in the wallet using the
 * pre-generated crypto materials from cryptogen instead of enrolling
 * with Fabric CA. This is the proper way to bootstrap when using cryptogen.
 */

const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function main() {
    try {
        console.log('========================================');
        console.log('  ENROLLING ADMIN FROM CRYPTO MATERIALS');
        console.log('========================================\n');

        // Wallet path
        const walletPath = path.join(process.cwd(), 'wallets');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check if admin already exists
        const adminExists = await wallet.get('admin');
        if (adminExists) {
            console.log('✓ Admin identity already exists in wallet');
            return;
        }

        // Paths to crypto materials - try multiple locations
        let credPath = path.join(
            __dirname,
            '..',
            '..',
            '..',
            'crypto-config',
            'peerOrganizations',
            'ecta.example.com',
            'users',
            'Admin@ecta.example.com'
        );
        
        // If not found, try from /app/crypto-config (Docker container path)
        if (!fs.existsSync(credPath)) {
            credPath = path.join(
                '/app',
                'crypto-config',
                'peerOrganizations',
                'ecta.example.com',
                'users',
                'Admin@ecta.example.com'
            );
        }

        const certPath = path.join(credPath, 'msp', 'signcerts');
        const keyPath = path.join(credPath, 'msp', 'keystore');

        console.log(`\nLooking for crypto materials at:`);
        console.log(`  Cert: ${certPath}`);
        console.log(`  Key:  ${keyPath}`);

        // Check if paths exist
        if (!fs.existsSync(certPath)) {
            throw new Error(`Certificate path does not exist: ${certPath}`);
        }
        if (!fs.existsSync(keyPath)) {
            throw new Error(`Key path does not exist: ${keyPath}`);
        }

        // Read certificate
        const certFiles = fs.readdirSync(certPath);
        if (certFiles.length === 0) {
            throw new Error(`No certificate files found in ${certPath}`);
        }
        const certificate = fs.readFileSync(path.join(certPath, certFiles[0]), 'utf8');
        console.log(`✓ Certificate loaded: ${certFiles[0]}`);

        // Read private key
        const keyFiles = fs.readdirSync(keyPath);
        if (keyFiles.length === 0) {
            throw new Error(`No key files found in ${keyPath}`);
        }
        const privateKey = fs.readFileSync(path.join(keyPath, keyFiles[0]), 'utf8');
        console.log(`✓ Private key loaded: ${keyFiles[0]}`);

        // Create identity
        const identity = {
            credentials: {
                certificate,
                privateKey
            },
            mspId: 'ECTAMSP',
            type: 'X.509'
        };

        // Import to wallet
        await wallet.put('admin', identity);
        console.log('\n✓ Admin identity imported to wallet successfully');

        // Verify
        const adminIdentity = await wallet.get('admin');
        if (adminIdentity) {
            console.log('✓ Verification: Admin identity exists in wallet');
        }

        console.log('\n========================================');
        console.log('  ADMIN ENROLLMENT COMPLETE');
        console.log('========================================\n');

    } catch (error) {
        console.error(`\n✗ Failed to enroll admin: ${error.message}`);
        console.error(`\nStack trace:`);
        console.error(error.stack);
        process.exit(1);
    }
}

main();
