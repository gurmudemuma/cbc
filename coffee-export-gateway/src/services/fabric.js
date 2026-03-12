const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const fs = require('fs');
const path = require('path');

// Check if running in test/mock mode
const FABRIC_TEST_MODE = process.env.FABRIC_TEST_MODE === 'true';
const FABRIC_USE_CLI = process.env.FABRIC_USE_CLI === 'true';

if (FABRIC_TEST_MODE) {
  module.exports = require('./fabric-mock');
} else if (FABRIC_USE_CLI) {
  module.exports = require('./fabric-cli-final');
} else {
  console.log('✅ Using Fabric SDK - Direct network connection');
  
  // Enable debug logging
  process.env.HFC_LOGGING = '{"debug":"console"}';
  process.env.GRPC_TRACE = 'all';
  process.env.GRPC_VERBOSITY = 'DEBUG';

const ccpPath = path.resolve(__dirname, '..', 'config', 'connection-profile.json');
const ccpRaw = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

// Fix relative paths in connection profile to be absolute
const ccp = JSON.parse(JSON.stringify(ccpRaw));
const basePath = process.cwd();

// Fix peer TLS cert paths - verify files exist
if (ccp.peers) {
  Object.keys(ccp.peers).forEach(peerName => {
    if (ccp.peers[peerName].tlsCACerts && ccp.peers[peerName].tlsCACerts.path) {
      const certPath = path.join(basePath, ccp.peers[peerName].tlsCACerts.path);
      if (!fs.existsSync(certPath)) {
        console.warn(`⚠️  Peer TLS cert not found: ${certPath}`);
      }
      ccp.peers[peerName].tlsCACerts.path = certPath;
    }
  });
}

// Fix orderer TLS cert paths - verify files exist
if (ccp.orderers) {
  Object.keys(ccp.orderers).forEach(ordererName => {
    if (ccp.orderers[ordererName].tlsCACerts && ccp.orderers[ordererName].tlsCACerts.path) {
      const certPath = path.join(basePath, ccp.orderers[ordererName].tlsCACerts.path);
      if (!fs.existsSync(certPath)) {
        console.warn(`⚠️  Orderer TLS cert not found: ${certPath}`);
      }
      ccp.orderers[ordererName].tlsCACerts.path = certPath;
    }
  });
}

const walletPath = path.join(process.cwd(), 'wallets');
const CHANNEL_NAME = process.env.CHANNEL_NAME || 'coffeechannel';
const CHAINCODE_NAME = process.env.CHAINCODE_NAME || 'ecta';

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
  
  // Connect WITHOUT discovery - use static endpoints from connection profile
  // Use query handler that doesn't require endorsement policy for reads
  await gateway.connect(ccp, {
    wallet,
    identity: userId,
    discovery: { 
      enabled: true,  // Enable discovery to find available peers
      asLocalhost: false
    },
    eventHandlerOptions: {
      commitTimeout: 300,
      strategy: require('fabric-network').DefaultEventHandlerStrategies.MSPID_SCOPE_ANYFORTX
    },
    queryHandlerOptions: {
      timeout: 30,
      strategy: require('fabric-network').DefaultQueryHandlerStrategies.MSPID_SCOPE_SINGLE
    }
  });

  return gateway;
}

/**
 * Submit transaction to chaincode
 */
async function submitTransaction(userId, chaincodeName, functionName, ...args) {
  const gateway = await getGateway(userId);
  try {
    const network = await gateway.getNetwork(CHANNEL_NAME);
    const contract = network.getContract(chaincodeName);

    // Create transaction and explicitly target ECTA peers only
    const transaction = contract.createTransaction(functionName);
    
    // Set endorsing organizations to only ECTA (bypass MAJORITY policy)
    transaction.setEndorsingOrganizations('ECTAMSP');
    
    const result = await transaction.submit(...args);
    return result.toString();
  } catch (error) {
    console.error(`[Fabric] Transaction submission failed: ${error.message}`);
    console.error(`[Fabric] Error details:`, error);
    throw error;
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
    const network = await gateway.getNetwork(CHANNEL_NAME);
    const contract = network.getContract(chaincodeName);

    const result = await contract.evaluateTransaction(functionName, ...args);
    return result.toString();
  } finally {
    gateway.disconnect();
  }
}

// ==================== User Management Functions ====================

async function registerUser(userData) {
  return await submitTransaction('admin', CHAINCODE_NAME, 'RegisterUser', JSON.stringify(userData));
}

async function getUser(username) {
  const result = await evaluateTransaction('admin', CHAINCODE_NAME, 'GetUser', username);
  return JSON.parse(result);
}

async function updateUserStatus(username, statusData) {
  return await submitTransaction('admin', CHAINCODE_NAME, 'UpdateUserStatus', username, JSON.stringify(statusData));
}

async function getUsersByRole(role) {
  const result = await evaluateTransaction('admin', CHAINCODE_NAME, 'GetUsersByRole', role);
  return JSON.parse(result);
}

async function getPendingUsers() {
  const result = await evaluateTransaction('admin', CHAINCODE_NAME, 'GetPendingUsers');
  return JSON.parse(result);
}

async function getUsersByStatus(status) {
  const result = await evaluateTransaction('admin', CHAINCODE_NAME, 'GetUsersByStatus', status);
  return JSON.parse(result);
}

// ==================== Export Functions ====================

async function createShipment(shipmentData) {
  return await submitTransaction('admin', CHAINCODE_NAME, 'CreateShipment', JSON.stringify(shipmentData));
}

async function getShipment(shipmentId) {
  const result = await evaluateTransaction('admin', CHAINCODE_NAME, 'GetShipment', shipmentId);
  return JSON.parse(result);
}

async function getShipmentsByExporter(exporterId) {
  const result = await evaluateTransaction('admin', CHAINCODE_NAME, 'GetShipmentsByExporter', exporterId);
  return JSON.parse(result);
}

// ==================== Certificate Functions ====================

async function requestCertificate(certificateRequest) {
  return await submitTransaction('admin', CHAINCODE_NAME, 'RequestCertificate', JSON.stringify(certificateRequest));
}

async function getCertificate(certificateId) {
  const result = await evaluateTransaction('admin', CHAINCODE_NAME, 'GetCertificate', certificateId);
  return JSON.parse(result);
}

async function getCertificatesByShipment(shipmentId) {
  const result = await evaluateTransaction('admin', CHAINCODE_NAME, 'GetCertificatesByShipment', shipmentId);
  return JSON.parse(result);
}

module.exports = {
  enrollAdmin,
  registerExporter,
  submitTransaction,
  evaluateTransaction,
  getWallet,
  // User management
  registerUser,
  getUser,
  updateUserStatus,
  getUsersByRole,
  getPendingUsers,
  getUsersByStatus,
  // Shipment management
  createShipment,
  getShipment,
  getShipmentsByExporter,
  // Certificate management
  requestCertificate,
  getCertificate,
  getCertificatesByShipment
};

} // End of else block for SDK mode
