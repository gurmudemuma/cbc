/**
 * Fabric CLI-based service
 * Uses peer CLI commands to interact with chaincode
 * This bypasses SDK endorsement policy issues
 */

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const CHANNEL_NAME = process.env.CHANNEL_NAME || 'coffeechannel';
const CHAINCODE_NAME = process.env.CHAINCODE_NAME || 'ecta';

console.log('[Fabric CLI] Using CLI-based chaincode invocation');
console.log(`[Fabric CLI] Channel: ${CHANNEL_NAME}, Chaincode: ${CHAINCODE_NAME}`);

/**
 * Execute peer CLI command via docker exec
 */
async function executePeerCommand(command) {
  try {
    // Wrap command to execute in CLI container
    const dockerCommand = `docker exec -e CORE_PEER_TLS_ENABLED=true -e CORE_PEER_LOCALMSPID=ECTAMSP -e CORE_PEER_ADDRESS=peer0.ecta.example.com:7051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/ecta.example.com/users/Admin@ecta.example.com/msp cli ${command}`;
    
    const { stdout, stderr } = await execPromise(dockerCommand, {
      timeout: 30000
    });
    
    if (stderr && !stderr.includes('UTC') && !stderr.includes('INFO')) {
      console.error('[Fabric CLI] Warning:', stderr);
    }
    
    return stdout.trim();
  } catch (error) {
    console.error('[Fabric CLI] Command failed:', error.message);
    throw error;
  }
}

/**
 * Invoke chaincode (write operation)
 */
async function invokeChaincode(functionName, ...args) {
  const argsJson = JSON.stringify(args);
  const command = `peer chaincode invoke \
    -o orderer1.orderer.example.com:7050 \
    --ordererTLSHostnameOverride orderer1.orderer.example.com \
    --tls \
    --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem \
    -C ${CHANNEL_NAME} \
    -n ${CHAINCODE_NAME} \
    -c '{"function":"${functionName}","Args":${argsJson}}' \
    --peerAddresses peer0.ecta.example.com:7051 \
    --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt \
    --waitForEvent`;
  
  console.log(`[Fabric CLI] Invoking: ${functionName}`);
  const result = await executePeerCommand(command);
  
  // Extract result from CLI output
  const lines = result.split('\n');
  const lastLine = lines[lines.length - 1];
  
  // Try to parse as JSON, otherwise return as string
  try {
    return JSON.parse(lastLine);
  } catch {
    return lastLine;
  }
}

/**
 * Query chaincode (read operation)
 */
async function queryChaincode(functionName, ...args) {
  const argsJson = JSON.stringify(args);
  const command = `peer chaincode query \
    -C ${CHANNEL_NAME} \
    -n ${CHAINCODE_NAME} \
    -c '{"function":"${functionName}","Args":${argsJson}}'`;
  
  console.log(`[Fabric CLI] Querying: ${functionName}`);
  const result = await executePeerCommand(command);
  
  // Try to parse as JSON
  try {
    return JSON.parse(result);
  } catch {
    return result;
  }
}

// ==================== User Management Functions ====================

async function registerUser(userData) {
  try {
    const result = await invokeChaincode('RegisterUser', JSON.stringify(userData));
    return typeof result === 'string' ? result : JSON.stringify(result);
  } catch (error) {
    console.error('[Fabric CLI] RegisterUser failed:', error.message);
    throw error;
  }
}

async function getUser(username) {
  try {
    const result = await queryChaincode('GetUser', username);
    return typeof result === 'object' ? result : JSON.parse(result);
  } catch (error) {
    console.error('[Fabric CLI] GetUser failed:', error.message);
    throw error;
  }
}

async function updateUserStatus(username, statusData) {
  try {
    const result = await invokeChaincode('UpdateUserStatus', username, JSON.stringify(statusData));
    return typeof result === 'string' ? result : JSON.stringify(result);
  } catch (error) {
    console.error('[Fabric CLI] UpdateUserStatus failed:', error.message);
    throw error;
  }
}

async function getUsersByRole(role) {
  try {
    const result = await queryChaincode('GetUsersByRole', role);
    return typeof result === 'object' ? result : JSON.parse(result);
  } catch (error) {
    console.error('[Fabric CLI] GetUsersByRole failed:', error.message);
    return [];
  }
}

async function getPendingUsers() {
  try {
    const result = await queryChaincode('GetPendingUsers');
    return typeof result === 'object' ? result : JSON.parse(result);
  } catch (error) {
    console.error('[Fabric CLI] GetPendingUsers failed:', error.message);
    return [];
  }
}

// ==================== Exporter Management Functions ====================

async function getExporterProfile(exporterId) {
  try {
    const result = await queryChaincode('GetExporterProfile', exporterId);
    return typeof result === 'object' ? result : JSON.parse(result);
  } catch (error) {
    console.error('[Fabric CLI] GetExporterProfile failed:', error.message);
    throw error;
  }
}

async function updateExporterProfile(exporterId, updates) {
  try {
    const result = await invokeChaincode('UpdateExporterProfile', exporterId, JSON.stringify(updates));
    return typeof result === 'string' ? result : JSON.stringify(result);
  } catch (error) {
    console.error('[Fabric CLI] UpdateExporterProfile failed:', error.message);
    throw error;
  }
}

// ==================== Shipment Functions ====================

async function createShipment(shipmentData) {
  try {
    const result = await invokeChaincode('CreateShipment', JSON.stringify(shipmentData));
    return typeof result === 'string' ? result : JSON.stringify(result);
  } catch (error) {
    console.error('[Fabric CLI] CreateShipment failed:', error.message);
    throw error;
  }
}

async function getShipment(shipmentId) {
  try {
    const result = await queryChaincode('GetShipment', shipmentId);
    return typeof result === 'object' ? result : JSON.parse(result);
  } catch (error) {
    console.error('[Fabric CLI] GetShipment failed:', error.message);
    throw error;
  }
}

// ==================== Certificate Functions ====================

async function requestCertificate(certificateRequest) {
  try {
    const result = await invokeChaincode('RequestCertificate', JSON.stringify(certificateRequest));
    return typeof result === 'string' ? result : JSON.stringify(result);
  } catch (error) {
    console.error('[Fabric CLI] RequestCertificate failed:', error.message);
    throw error;
  }
}

async function getCertificate(certificateId) {
  try {
    const result = await queryChaincode('GetCertificate', certificateId);
    return typeof result === 'object' ? result : JSON.parse(result);
  } catch (error) {
    console.error('[Fabric CLI] GetCertificate failed:', error.message);
    throw error;
  }
}

// Stub functions for compatibility
async function enrollAdmin() {
  console.log('[Fabric CLI] Admin enrollment not needed in CLI mode');
  return { success: true };
}

async function registerExporter() {
  console.log('[Fabric CLI] Use registerUser instead');
  return { success: true };
}

async function getWallet() {
  return null; // Not used in CLI mode
}

module.exports = {
  registerUser,
  getUser,
  updateUserStatus,
  getUsersByRole,
  getPendingUsers,
  getExporterProfile,
  updateExporterProfile,
  createShipment,
  getShipment,
  requestCertificate,
  getCertificate,
  enrollAdmin,
  registerExporter,
  getWallet
};
