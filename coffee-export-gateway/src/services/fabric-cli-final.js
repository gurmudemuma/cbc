/**
 * Fabric CLI-based service
 * Uses peer CLI commands to interact with chaincode
 * This bypasses SDK endorsement policy issues
 */

const { exec, spawn } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const CHANNEL_NAME = process.env.CHANNEL_NAME || 'coffeechannel';
const CHAINCODE_NAME = process.env.CHAINCODE_NAME || 'ecta';

console.log('[Fabric CLI] Using CLI-based chaincode invocation');
console.log(`[Fabric CLI] Channel: ${CHANNEL_NAME}, Chaincode: ${CHAINCODE_NAME}`);

/**
 * Execute peer CLI command via docker exec using spawn (no shell interpretation)
 */
async function executePeerCommandWithArgs(args) {
  return new Promise((resolve, reject) => {
    const dockerArgs = [
      'exec',
      '-e', 'CORE_PEER_TLS_ENABLED=true',
      '-e', 'CORE_PEER_LOCALMSPID=ECTAMSP',
      '-e', 'CORE_PEER_ADDRESS=peer0.ecta.example.com:7051',
      '-e', 'CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt',
      '-e', 'CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/ecta.example.com/users/Admin@ecta.example.com/msp',
      'cli',
      ...args
    ];
    
    const proc = spawn('docker', dockerArgs, {
      timeout: 30000,
      maxBuffer: 10 * 1024 * 1024
    });
    
    let stdout = '';
    let stderr = '';
    
    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    proc.on('close', (code) => {
      if (code !== 0) {
        const stderrLower = stderr.toLowerCase();
        if (stderrLower.includes('error') || stderrLower.includes('failed') || stderrLower.includes('fatal')) {
          console.error('[Fabric CLI] Error in stderr:', stderr);
        }
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      } else {
        resolve(stdout.trim());
      }
    });
    
    proc.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Execute peer CLI command via docker exec
 */
async function executePeerCommand(command) {
  try {
    // Wrap command to execute in CLI container
    const dockerCommand = `docker exec -e CORE_PEER_TLS_ENABLED=true -e CORE_PEER_LOCALMSPID=ECTAMSP -e CORE_PEER_ADDRESS=peer0.ecta.example.com:7051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/ecta.example.com/users/Admin@ecta.example.com/msp cli ${command}`;
    
    const { stdout, stderr } = await execPromise(dockerCommand, {
      timeout: 30000,
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer for large responses
    });
    
    // Log stderr for debugging but don't treat as error unless it contains actual errors
    if (stderr && stderr.trim() !== '') {
      const stderrLower = stderr.toLowerCase();
      if (stderrLower.includes('error') || stderrLower.includes('failed') || stderrLower.includes('fatal')) {
        console.error('[Fabric CLI] Error in stderr:', stderr);
      }
    }
    
    // Return only stdout, trimmed
    const result = stdout.trim();
    return result;
  } catch (error) {
    console.error('[Fabric CLI] Command failed:', error.message);
    throw error;
  }
}

/**
 * Invoke chaincode (write operation)
 * Uses multiple peer endorsements to satisfy MAJORITY policy (3+ out of 5 orgs)
 */
async function invokeChaincode(functionName, ...args) {
  // Create the chaincode args structure
  const chaincodeArgs = {
    function: functionName,
    Args: args
  };
  
  const argsJson = JSON.stringify(chaincodeArgs);
  
  // Use spawn to avoid shell escaping issues
  const peerArgs = [
    'peer', 'chaincode', 'invoke',
    '-o', 'orderer1.orderer.example.com:7050',
    '--ordererTLSHostnameOverride', 'orderer1.orderer.example.com',
    '--tls',
    '--cafile', '/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem',
    '-C', CHANNEL_NAME,
    '-n', CHAINCODE_NAME,
    '-c', argsJson,
    '--peerAddresses', 'peer0.ecta.example.com:7051',
    '--tlsRootCertFiles', '/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt',
    '--peerAddresses', 'peer0.bank.example.com:9051',
    '--tlsRootCertFiles', '/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/bank.example.com/peers/peer0.bank.example.com/tls/ca.crt',
    '--peerAddresses', 'peer0.nbe.example.com:10051',
    '--tlsRootCertFiles', '/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/nbe.example.com/peers/peer0.nbe.example.com/tls/ca.crt',
    '--waitForEvent'
  ];
  
  console.log(`[Fabric CLI] Invoking: ${functionName} (with 3-org endorsement)`);
  const result = await executePeerCommandWithArgs(peerArgs);
  
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
  const argsArray = args.map(arg => `"${arg}"`).join(',');
  const command = `peer chaincode query -C ${CHANNEL_NAME} -n ${CHAINCODE_NAME} -c '{"function":"${functionName}","Args":[${argsArray}]}'`;
  
  console.log(`[Fabric CLI] Querying: ${functionName} with args:`, args);
  
  try {
    const result = await executePeerCommand(command);
    
    console.log(`[Fabric CLI] ${functionName} raw result length:`, result ? result.length : 0);
    console.log(`[Fabric CLI] ${functionName} raw result (first 100 chars):`, result ? result.substring(0, 100) : 'null');
    
    // Handle empty results
    if (!result || result.trim() === '') {
      console.log(`[Fabric CLI] ${functionName} returned empty result`);
      return [];
    }
    
    // Try to parse as JSON
    try {
      const parsed = JSON.parse(result);
      console.log(`[Fabric CLI] ${functionName} successfully parsed, returned ${Array.isArray(parsed) ? parsed.length : 'non-array'} results`);
      return parsed;
    } catch (parseError) {
      console.error(`[Fabric CLI] ${functionName} JSON parse error:`, parseError.message);
      console.error(`[Fabric CLI] Raw result (first 500 chars):`, result.substring(0, 500));
      return result;
    }
  } catch (error) {
    console.error(`[Fabric CLI] ${functionName} query failed:`, error.message);
    throw error;
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
    
    // If result is already an object/array, return it
    if (typeof result === 'object') {
      console.log(`[Fabric CLI] GetUsersByRole returned ${Array.isArray(result) ? result.length : 'object'} results`);
      return result;
    }
    
    // If result is a string, try to parse it
    if (typeof result === 'string') {
      if (!result || result.trim() === '') {
        console.log('[Fabric CLI] GetUsersByRole returned empty string');
        return [];
      }
      try {
        const parsed = JSON.parse(result);
        console.log(`[Fabric CLI] GetUsersByRole parsed ${Array.isArray(parsed) ? parsed.length : 'object'} results`);
        return parsed;
      } catch (parseError) {
        console.error('[Fabric CLI] GetUsersByRole JSON parse error:', parseError.message);
        console.error('[Fabric CLI] Raw result (first 200 chars):', result.substring(0, 200));
        return [];
      }
    }
    
    return [];
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
  // CLI-style methods
  invokeChaincode,
  queryChaincode,
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
  getWallet,
  
  // SDK-compatible wrapper methods
  async evaluateTransaction(userId, chaincodeName, functionName, ...args) {
    return await queryChaincode(functionName, ...args);
  },
  
  async submitTransaction(userId, chaincodeName, functionName, ...args) {
    return await invokeChaincode(functionName, ...args);
  }
};

