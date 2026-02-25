@echo off
REM Deploy chaincode to Coffee Export Consortium network
REM This script packages, installs, approves, and commits the chaincode

echo ========================================
echo Deploying ECTA Chaincode
echo ========================================
echo.

set CHANNEL_NAME=coffeechannel
set CHAINCODE_NAME=ecta
set CHAINCODE_VERSION=1.0
set CHAINCODE_SEQUENCE=1

echo Step 1: Packaging chaincode...
docker exec -e FABRIC_CFG_PATH=/etc/hyperledger/configtx cli peer lifecycle chaincode package /opt/gopath/src/github.com/hyperledger/fabric/chaincode/ecta.tar.gz --path /opt/gopath/src/github.com/hyperledger/fabric/chaincode/ecta --lang node --label %CHAINCODE_NAME%_%CHAINCODE_VERSION%

if errorlevel 1 (
    echo ERROR: Failed to package chaincode
    pause
    exit /b 1
)

echo.
echo Step 2: Installing chaincode on ECTA peer0...
docker exec cli peer lifecycle chaincode install /opt/gopath/src/github.com/hyperledger/fabric/chaincode/ecta.tar.gz

echo.
echo Step 3: Installing chaincode on ECTA peer1...
docker exec -e CORE_PEER_ADDRESS=peer1.ecta.example.com:8051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/ecta.example.com/peers/peer1.ecta.example.com/tls/ca.crt cli peer lifecycle chaincode install /opt/gopath/src/github.com/hyperledger/fabric/chaincode/ecta.tar.gz

echo.
echo Step 4: Installing chaincode on Bank peer...
docker exec -e CORE_PEER_LOCALMSPID=BankMSP -e CORE_PEER_ADDRESS=peer0.bank.example.com:9051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/bank.example.com/peers/peer0.bank.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/bank.example.com/users/Admin@bank.example.com/msp cli peer lifecycle chaincode install /opt/gopath/src/github.com/hyperledger/fabric/chaincode/ecta.tar.gz

echo.
echo Step 5: Installing chaincode on NBE peer...
docker exec -e CORE_PEER_LOCALMSPID=NBEMSP -e CORE_PEER_ADDRESS=peer0.nbe.example.com:10051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/nbe.example.com/peers/peer0.nbe.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/nbe.example.com/users/Admin@nbe.example.com/msp cli peer lifecycle chaincode install /opt/gopath/src/github.com/hyperledger/fabric/chaincode/ecta.tar.gz

echo.
echo Step 6: Installing chaincode on Customs peer...
docker exec -e CORE_PEER_LOCALMSPID=CustomsMSP -e CORE_PEER_ADDRESS=peer0.customs.example.com:11051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/customs.example.com/peers/peer0.customs.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/customs.example.com/users/Admin@customs.example.com/msp cli peer lifecycle chaincode install /opt/gopath/src/github.com/hyperledger/fabric/chaincode/ecta.tar.gz

echo.
echo Step 7: Installing chaincode on Shipping peer...
docker exec -e CORE_PEER_LOCALMSPID=ShippingMSP -e CORE_PEER_ADDRESS=peer0.shipping.example.com:12051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/shipping.example.com/peers/peer0.shipping.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/shipping.example.com/users/Admin@shipping.example.com/msp cli peer lifecycle chaincode install /opt/gopath/src/github.com/hyperledger/fabric/chaincode/ecta.tar.gz

echo.
echo Step 8: Querying installed chaincode to get package ID...
docker exec cli peer lifecycle chaincode queryinstalled > chaincode_query.txt
type chaincode_query.txt

echo.
echo IMPORTANT: Copy the Package ID from above and use it in the next steps
echo Example: ecta_1.0:abc123def456...
echo.
set /p PACKAGE_ID="Enter the Package ID: "

if "%PACKAGE_ID%"=="" (
    echo ERROR: Package ID is required
    pause
    exit /b 1
)

echo.
echo Step 9: Approving chaincode for ECTA...
docker exec cli peer lifecycle chaincode approveformyorg -o orderer1.orderer.example.com:7050 --channelID %CHANNEL_NAME% --name %CHAINCODE_NAME% --version %CHAINCODE_VERSION% --package-id %PACKAGE_ID% --sequence %CHAINCODE_SEQUENCE% --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem

echo.
echo Step 10: Approving chaincode for Bank...
docker exec -e CORE_PEER_LOCALMSPID=BankMSP -e CORE_PEER_ADDRESS=peer0.bank.example.com:9051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/bank.example.com/peers/peer0.bank.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/bank.example.com/users/Admin@bank.example.com/msp cli peer lifecycle chaincode approveformyorg -o orderer1.orderer.example.com:7050 --channelID %CHANNEL_NAME% --name %CHAINCODE_NAME% --version %CHAINCODE_VERSION% --package-id %PACKAGE_ID% --sequence %CHAINCODE_SEQUENCE% --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem

echo.
echo Step 11: Approving chaincode for NBE...
docker exec -e CORE_PEER_LOCALMSPID=NBEMSP -e CORE_PEER_ADDRESS=peer0.nbe.example.com:10051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/nbe.example.com/peers/peer0.nbe.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/nbe.example.com/users/Admin@nbe.example.com/msp cli peer lifecycle chaincode approveformyorg -o orderer1.orderer.example.com:7050 --channelID %CHANNEL_NAME% --name %CHAINCODE_NAME% --version %CHAINCODE_VERSION% --package-id %PACKAGE_ID% --sequence %CHAINCODE_SEQUENCE% --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem

echo.
echo Step 12: Approving chaincode for Customs...
docker exec -e CORE_PEER_LOCALMSPID=CustomsMSP -e CORE_PEER_ADDRESS=peer0.customs.example.com:11051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/customs.example.com/peers/peer0.customs.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/customs.example.com/users/Admin@customs.example.com/msp cli peer lifecycle chaincode approveformyorg -o orderer1.orderer.example.com:7050 --channelID %CHANNEL_NAME% --name %CHAINCODE_NAME% --version %CHAINCODE_VERSION% --package-id %PACKAGE_ID% --sequence %CHAINCODE_SEQUENCE% --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem

echo.
echo Step 13: Approving chaincode for Shipping...
docker exec -e CORE_PEER_LOCALMSPID=ShippingMSP -e CORE_PEER_ADDRESS=peer0.shipping.example.com:12051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/shipping.example.com/peers/peer0.shipping.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/shipping.example.com/users/Admin@shipping.example.com/msp cli peer lifecycle chaincode approveformyorg -o orderer1.orderer.example.com:7050 --channelID %CHANNEL_NAME% --name %CHAINCODE_NAME% --version %CHAINCODE_VERSION% --package-id %PACKAGE_ID% --sequence %CHAINCODE_SEQUENCE% --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem

echo.
echo Step 14: Checking commit readiness...
docker exec cli peer lifecycle chaincode checkcommitreadiness --channelID %CHANNEL_NAME% --name %CHAINCODE_NAME% --version %CHAINCODE_VERSION% --sequence %CHAINCODE_SEQUENCE% --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem --output json

echo.
echo Step 15: Committing chaincode definition...
docker exec cli peer lifecycle chaincode commit -o orderer1.orderer.example.com:7050 --channelID %CHANNEL_NAME% --name %CHAINCODE_NAME% --version %CHAINCODE_VERSION% --sequence %CHAINCODE_SEQUENCE% --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem --peerAddresses peer0.ecta.example.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt --peerAddresses peer0.bank.example.com:9051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/bank.example.com/peers/peer0.bank.example.com/tls/ca.crt

echo.
echo Step 16: Verifying chaincode is committed...
docker exec cli peer lifecycle chaincode querycommitted --channelID %CHANNEL_NAME% --name %CHAINCODE_NAME% --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem

echo.
echo Step 17: Testing chaincode - Initialize Ledger...
docker exec cli peer chaincode invoke -o orderer1.orderer.example.com:7050 --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem -C %CHANNEL_NAME% -n %CHAINCODE_NAME% --peerAddresses peer0.ecta.example.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt -c "{\"function\":\"InitLedger\",\"Args\":[]}"

echo.
echo ========================================
echo Chaincode Deployed Successfully!
echo ========================================
echo.
echo Next steps:
echo 1. Update coffee-export-gateway/.env: Set FABRIC_TEST_MODE=false
echo 2. Start backend: cd coffee-export-gateway ^&^& npm start
echo 3. Test API endpoints
echo.
pause
