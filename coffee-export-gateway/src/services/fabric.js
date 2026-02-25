const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const fs = require('fs');
const path = require('path');

// Check if running in test/mock mode
const FABRIC_TEST_MODE = process.env.FABRIC_TEST_MODE === 'true';

if (FABRIC_TEST_MODE) {
  console.log('⚠️  Running in MOCK MODE - No Fabric network required');
  const mockFabric = require('./fabric-mock');
  module.exports = mockFabric;
  return;
}

const ccpPath = path.resolve(__dirname, '..', 'config', 'connection-profile.json');
const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

const walletPath = path.join(process.cwd(), 'wallets');

/**
 * Get or create wallet for user
 */
async function getWallet() {
  return await Wallets.newFileSystemWallet(walletPath);
}

/**
 * Get CA client
 */
function getCAClient() {
  const caInfo = ccp.certificateAuthorities['ca.ecta.example.com'];
  const caTLSCACerts = fs.readFileSync(path.resolve(__dirname, '../..', caInfo.tlsCACerts.path), 'utf8');
  const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);
  return ca;
}

/**
 * Enroll admin user (run once during setup)
 */
async function enrollAdmin() {
  try {
    const ca = getCAClient();
    const wallet = await getWallet();

    const identity = await wallet.get('admin');
    if (identity) {
      console.log('Admin already enrolled');
      return;
    }

    const enrollment = await ca.enroll({
      enrollmentID: process.env.CA_ADMIN_USER || 'admin',
      enrollmentSecret: process.env.CA_ADMIN_PASSWORD || 'adminpw'
    });

    const x509Identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
      },
      mspId: process.env.ORG_MSP_ID || 'ECTAOrgMSP',
      type: 'X.509',
    };

    await wallet.put('admin', x509Identity);
    console.log('Successfully enrolled admin user and imported into wallet');
  } catch (error) {
    console.error(`Failed to enroll admin: ${error}`);
    throw error;
  }
}

/**
 * Register and enroll a new exporter
 */
async function registerExporter(exporterId, exporterData) {
  try {
    const ca = getCAClient();
    const wallet = await getWallet();

    const userIdentity = await wallet.get(exporterId);
    if (userIdentity) {
      throw new Error(`Exporter ${exporterId} already registered`);
    }

    const adminIdentity = await wallet.get('admin');
    if (!adminIdentity) {
      throw new Error('Admin not enrolled. Run enrollAdmin first.');
    }

    const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
    const adminUser = await provider.getUserContext(adminIdentity, 'admin');

    const secret = await ca.register(
      {
        enrollmentID: exporterId,
        role: 'client',
        affiliation: 'ecta.department1',
        attrs: [
          { name: 'exporterType', value: 'coffee', ecert: true },
          { name: 'companyName', value: exporterData.companyName, ecert: true }
        ]
      },
      adminUser
    );

    const enrollment = await ca.enroll({
      enrollmentID: exporterId,
      enrollmentSecret: secret
    });

    const x509Identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
      },
      mspId: process.env.ORG_MSP_ID || 'ECTAOrgMSP',
      type: 'X.509',
    };

    await wallet.put(exporterId, x509Identity);
    console.log(`Successfully registered and enrolled exporter: ${exporterId}`);
    
    return { success: true, exporterId };
  } catch (error) {
    console.error(`Failed to register exporter: ${error}`);
    throw error;
  }
}

/**
 * Get gateway connection for a user
 */
async function getGateway(userId) {
  const wallet = await getWallet();
  
  const identity = await wallet.get(userId);
  if (!identity) {
    throw new Error(`Identity not found for user: ${userId}`);
  }

  const gateway = new Gateway();
  await gateway.connect(ccp, {
    wallet,
    identity: userId,
    discovery: { enabled: true, asLocalhost: process.env.FABRIC_NETWORK_AS_LOCALHOST === 'true' }
  });

  return gateway;
}

/**
 * Submit transaction to chaincode
 */
async function submitTransaction(userId, chaincodeName, functionName, ...args) {
  const gateway = await getGateway(userId);
  try {
    const network = await gateway.getNetwork(process.env.CHANNEL_NAME || 'coffeechannel');
    const contract = network.getContract(chaincodeName);

    const result = await contract.submitTransaction(functionName, ...args);
    return result.toString();
  } finally {
    gateway.disconnect();
  }
}

/**
 * Evaluate (query) transaction
 */
async function evaluateTransaction(userId, chaincodeName, functionName, ...args) {
  const gateway = await getGateway(userId);
  try {
    const network = await gateway.getNetwork(process.env.CHANNEL_NAME || 'coffeechannel');
    const contract = network.getContract(chaincodeName);

    const result = await contract.evaluateTransaction(functionName, ...args);
    return result.toString();
  } finally {
    gateway.disconnect();
  }
}

module.exports = {
  enrollAdmin,
  registerExporter,
  submitTransaction,
  evaluateTransaction,
  getWallet
};
