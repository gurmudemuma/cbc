const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function testContractRegistration() {
  console.log('============================================================================');
  console.log('         TESTING BLOCKCHAIN CONTRACT REGISTRATION');
  console.log('============================================================================');
  console.log('');

  const contractData = {
    draftId: "2ea664c5-5134-4b7a-90e6-58b52661394f",
    exporterId: "USER_exporter1",
    buyerId: "fb5ffcfc-0f17-4c8b-9983-f84489c2cff2",
    buyerName: "Tchibo GmbH",
    buyerCountry: "Germany",
    coffeeType: "SPECIALTY",
    originRegion: "Ethiopia",
    quantity: "100.00",
    unitPrice: "5.50",
    totalValue: "550.00",
    currency: "EUR",
    qualityGrade: "Grade 1",
    paymentMethod: "LC",
    paymentTerms: "ADVANCE_PAYMENT",
    incoterms: "FOB",
    portOfLoading: "Djibouti Port",
    portOfDischarge: "Hamburg Port",
    deliveryDate: "2026-08-02T00:00:00.000Z",
    governingLaw: "Ethiopian Law",
    arbitrationRules: "ICC Rules",
    arbitrationLocation: "Addis Ababa, Ethiopia",
    ectaOfficer: "ecta1"
  };

  const contractJson = JSON.stringify(contractData).replace(/"/g, '\\"');
  
  const command = `docker exec -e CORE_PEER_TLS_ENABLED=true -e CORE_PEER_LOCALMSPID=ECTAMSP -e CORE_PEER_ADDRESS=peer0.ecta.example.com:7051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/ecta.example.com/users/Admin@ecta.example.com/msp cli peer chaincode invoke -o orderer1.orderer.example.com:7050 --ordererTLSHostnameOverride orderer1.orderer.example.com --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem -C coffeechannel -n ecta -c '{"function":"RegisterSalesContractWithReference","Args":["${contractJson}"]}' --peerAddresses peer0.ecta.example.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt --peerAddresses peer0.bank.example.com:9051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/bank.example.com/peers/peer0.bank.example.com/tls/ca.crt --peerAddresses peer0.nbe.example.com:10051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/nbe.example.com/peers/peer0.nbe.example.com/tls/ca.crt --peerAddresses peer0.customs.example.com:11051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/customs.example.com/peers/peer0.customs.example.com/tls/ca.crt --peerAddresses peer0.shipping.example.com:12051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/shipping.example.com/peers/peer0.shipping.example.com/tls/ca.crt --waitForEvent`;

  console.log('[INFO] Invoking RegisterSalesContractWithReference on blockchain...');
  console.log('[INFO] Contract: ECTA-SC-20260504-56976');
  console.log('[INFO] Exporter: Ethiopian Coffee Exports Ltd');
  console.log('[INFO] Buyer: Tchibo GmbH (Germany)');
  console.log('[INFO] Value: €550.00');
  console.log('');

  try {
    const { stdout, stderr } = await execPromise(command);
    
    if (stdout) {
      console.log('[STDOUT]', stdout);
    }
    if (stderr) {
      console.log('[STDERR]', stderr);
    }
    
    if (stdout.includes('Chaincode invoke successful') || stdout.includes('status:200')) {
      console.log('');
      console.log('============================================================================');
      console.log('[SUCCESS] Contract registered on blockchain!');
      console.log('============================================================================');
      console.log('');
      console.log('The contract has been successfully written to the blockchain.');
      console.log('All 5 organizations (ECTA, Bank, NBE, Customs, Shipping) have endorsed it.');
      console.log('');
      return true;
    } else {
      console.log('');
      console.log('[WARNING] Registration may have failed or is pending');
      return false;
    }
  } catch (error) {
    console.error('');
    console.error('[ERROR] Blockchain invocation failed:');
    console.error(error.message);
    if (error.stdout) console.error('[STDOUT]', error.stdout);
    if (error.stderr) console.error('[STDERR]', error.stderr);
    return false;
  }
}

testContractRegistration().then(success => {
  process.exit(success ? 0 : 1);
});
