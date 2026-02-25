/**
 * Fabric Service Loader
 * Selects the appropriate Fabric service based on configuration
 */

const testMode = process.env.FABRIC_TEST_MODE;

let fabricService;

if (testMode === 'chaincode') {
    // Use external chaincode server (real smart contract)
    console.log('[Fabric Service] Loading CHAINCODE mode - Real Smart Contract');
    fabricService = require('./fabric-chaincode');
} else if (testMode === 'true' || testMode === true) {
    // Use mock service (no blockchain)
    console.log('[Fabric Service] Loading MOCK mode - No Blockchain');
    fabricService = require('./fabric-mock');
} else {
    // Use real Fabric SDK (requires deployed network)
    console.log('[Fabric Service] Loading FABRIC SDK mode - Real Blockchain Network');
    fabricService = require('./fabric');
}

module.exports = fabricService;
