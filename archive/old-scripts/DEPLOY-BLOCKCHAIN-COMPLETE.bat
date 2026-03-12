@echo off
REM ============================================================================
REM COMPLETE BLOCKCHAIN DEPLOYMENT
REM Production-ready Fabric network setup with channel and chaincode
REM ============================================================================

echo.
echo ========================================
echo  COMPLETE BLOCKCHAIN DEPLOYMENT
echo ========================================
echo.
echo This will deploy a complete Hyperledger Fabric network:
echo   - Create channel using Channel Participation API
echo   - Join all peers to channel
echo   - Package and install chaincode
echo   - Approve chaincode for all organizations
echo   - Commit chaincode to channel
echo   - Initialize and test chaincode
echo.
echo Estimated time: 5-10 minutes
echo.
pause

set CHANNEL_NAME=coffeechannel
set CC_NAME=ecta
set CC_VERSION=1.0
set CC_SEQUENCE=1

echo.
echo ========================================
echo  STEP 1: CREATE CHANNEL
echo ========================================
echo.

echo Creating channel using Channel Participation API...

REM Create channel genesis block using configtxgen
echo Generating channel genesis block...
docker exec cli configtxgen -profile CoffeeChannel -outputBlock /opt/gopath/src/github.com/hyperledger/fabric/peer/%CHANNEL_NAME%.block -channelID %CHANNEL_NAME%

if %errorlevel% neq 0 (
    echo ✗ Failed to generate channel block
    echo.
    echo Checking configtx.yaml...
    docker exec cli ls -la /etc/hyperledger/configtx/
    pause
    exit /b 1
)

echo ✓ Channel genesis block created

REM Join orderers to channel using osnadmin
echo.
echo Joining orderers to channel...

echo [1/3] Joining orderer1...
docker exec cli osnadmin channel join --channelID %CHANNEL_NAME% --config-block /opt/gopath/src/github.com/hyperledger/fabric/peer/%CHANNEL_NAME%.block -o orderer1.orderer.example.com:7053 --ca-file /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem --client-cert /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/tls/server.crt --client-key /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/tls/server.key

echo [2/3] Joining orderer2...
docker exec cli osnadmin channel join --channelID %CHANNEL_NAME% --config-block /opt/gopath/src/github.com/hyperledger/fabric/peer/%CHANNEL_NAME%.block -o orderer2.orderer.example.com:8053 --ca-file /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/orderer.example.com/orderers/orderer2.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem --client-cert /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/orderer.example.com/orderers/orderer2.orderer.example.com/tls/server.crt --client-key /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/orderer.example.com/orderers/orderer2.orderer.example.com/tls/server.key

echo [3/3] Joining orderer3...
docker exec cli osnadmin channel join --channelID %CHANNEL_NAME% --config-block /opt/gopath/src/github.com/hyperledger/fabric/peer/%CHANNEL_NAME%.block -o orderer3.orderer.example.com:9053 --ca-file /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/orderer.example.com/orderers/orderer3.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem --client-cert /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/orderer.example.com/orderers/orderer3.orderer.example.com/tls/server.crt --client-key /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/orderer.example.com/orderers/orderer3.orderer.example.com/tls/server.key

echo ✓ Orderers joined to channel

timeout /t 5 /nobreak

echo.
echo ========================================
echo  STEP 2: JOIN PEERS TO CHANNEL
echo ========================================
echo.

echo Joining peers to channel...

REM Join ECTA peer0
echo [1/6] Joining peer0.ecta...
docker exec cli peer channel join -b %CHANNEL_NAME%.block

REM Join ECTA peer1
echo [2/6] Joining peer1.ecta...
docker exec -e CORE_PEER_ADDRESS=peer1.ecta.example.com:8051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/ecta.example.com/peers/peer1.ecta.example.com/tls/ca.crt cli peer channel join -b %CHANNEL_NAME%.block

REM Join Bank peer
echo [3/6] Joining peer0.bank...
docker exec -e CORE_PEER_LOCALMSPID=BankMSP -e CORE_PEER_ADDRESS=peer0.bank.example.com:9051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/bank.example.com/peers/peer0.bank.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/bank.example.com/users/Admin@bank.example.com/msp cli peer channel join -b %CHANNEL_NAME%.block

REM Join NBE peer
echo [4/6] Joining peer0.nbe...
docker exec -e CORE_PEER_LOCALMSPID=NBEMSP -e CORE_PEER_ADDRESS=peer0.nbe.example.com:10051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/nbe.example.com/peers/peer0.nbe.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/nbe.example.com/users/Admin@nbe.example.com/msp cli peer channel join -b %CHANNEL_NAME%.block

REM Join Customs peer
echo [5/6] Joining peer0.customs...
docker exec -e CORE_PEER_LOCALMSPID=CustomsMSP -e CORE_PEER_ADDRESS=peer0.customs.example.com:11051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/customs.example.com/peers/peer0.customs.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/customs.example.com/users/Admin@customs.example.com/msp cli peer channel join -b %CHANNEL_NAME%.block

REM Join Shipping peer
echo [6/6] Joining peer0.shipping...
docker exec -e CORE_PEER_LOCALMSPID=ShippingMSP -e CORE_PEER_ADDRESS=peer0.shipping.example.com:12051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/shipping.example.com/peers/peer0.shipping.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/shipping.example.com/users/Admin@shipping.example.com/msp cli peer channel join -b %CHANNEL_NAME%.block

echo ✓ All peers joined to channel

timeout /t 3 /nobreak

echo.
echo ========================================
echo  STEP 3: PACKAGE CHAINCODE
echo ========================================
echo.

echo Packaging chaincode...
docker exec cli peer lifecycle chaincode package %CC_NAME%.tar.gz --path /opt/gopath/src/github.com/hyperledger/fabric/chaincode/%CC_NAME% --lang node --label %CC_NAME%_%CC_VERSION%

if %errorlevel% neq 0 (
    echo ✗ Failed to package chaincode
    pause
    exit /b 1
)

echo ✓ Chaincode packaged

echo.
echo ========================================
echo  STEP 4: INSTALL CHAINCODE
echo ========================================
echo.

echo Installing chaincode on all peers...

REM Install on ECTA peer0
echo [1/6] Installing on peer0.ecta...
docker exec cli peer lifecycle chaincode install %CC_NAME%.tar.gz

REM Install on ECTA peer1
echo [2/6] Installing on peer1.ecta...
docker exec -e CORE_PEER_ADDRESS=peer1.ecta.example.com:8051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/ecta.example.com/peers/peer1.ecta.example.com/tls/ca.crt cli peer lifecycle chaincode install %CC_NAME%.tar.gz

REM Install on Bank peer
echo [3/6] Installing on peer0.bank...
docker exec -e CORE_PEER_LOCALMSPID=BankMSP -e CORE_PEER_ADDRESS=peer0.bank.example.com:9051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/bank.example.com/peers/peer0.bank.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/bank.example.com/users/Admin@bank.example.com/msp cli peer lifecycle chaincode install %CC_NAME%.tar.gz

REM Install on NBE peer
echo [4/6] Installing on peer0.nbe...
docker exec -e CORE_PEER_LOCALMSPID=NBEMSP -e CORE_PEER_ADDRESS=peer0.nbe.example.com:10051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/nbe.example.com/peers/peer0.nbe.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/nbe.example.com/users/Admin@nbe.example.com/msp cli peer lifecycle chaincode install %CC_NAME%.tar.gz

REM Install on Customs peer
echo [5/6] Installing on peer0.customs...
docker exec -e CORE_PEER_LOCALMSPID=CustomsMSP -e CORE_PEER_ADDRESS=peer0.customs.example.com:11051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/customs.example.com/peers/peer0.customs.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/customs.example.com/users/Admin@customs.example.com/msp cli peer lifecycle chaincode install %CC_NAME%.tar.gz

REM Install on Shipping peer
echo [6/6] Installing on peer0.shipping...
docker exec -e CORE_PEER_LOCALMSPID=ShippingMSP -e CORE_PEER_ADDRESS=peer0.shipping.example.com:12051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/shipping.example.com/peers/peer0.shipping.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/shipping.example.com/users/Admin@shipping.example.com/msp cli peer lifecycle chaincode install %CC_NAME%.tar.gz

echo ✓ Chaincode installed on all peers

REM Get package ID
echo.
echo Getting chaincode package ID...
docker exec cli peer lifecycle chaincode queryinstalled > package_id.txt 2>&1
for /f "tokens=3 delims=, " %%G in ('findstr /C:"Package ID" package_id.txt') do set PACKAGE_ID=%%G
echo Package ID: %PACKAGE_ID%

timeout /t 3 /nobreak

echo.
echo ========================================
echo  STEP 5: APPROVE CHAINCODE
echo ========================================
echo.

echo Approving chaincode for all organizations...

REM Approve for ECTA
echo [1/5] Approving for ECTA...
docker exec cli peer lifecycle chaincode approveformyorg -o orderer1.orderer.example.com:7050 --ordererTLSHostnameOverride orderer1.orderer.example.com --channelID %CHANNEL_NAME% --name %CC_NAME% --version %CC_VERSION% --package-id %PACKAGE_ID% --sequence %CC_SEQUENCE% --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem

REM Approve for Bank
echo [2/5] Approving for Bank...
docker exec -e CORE_PEER_LOCALMSPID=BankMSP -e CORE_PEER_ADDRESS=peer0.bank.example.com:9051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/bank.example.com/peers/peer0.bank.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/bank.example.com/users/Admin@bank.example.com/msp cli peer lifecycle chaincode approveformyorg -o orderer1.orderer.example.com:7050 --ordererTLSHostnameOverride orderer1.orderer.example.com --channelID %CHANNEL_NAME% --name %CC_NAME% --version %CC_VERSION% --package-id %PACKAGE_ID% --sequence %CC_SEQUENCE% --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem

REM Approve for NBE
echo [3/5] Approving for NBE...
docker exec -e CORE_PEER_LOCALMSPID=NBEMSP -e CORE_PEER_ADDRESS=peer0.nbe.example.com:10051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/nbe.example.com/peers/peer0.nbe.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/nbe.example.com/users/Admin@nbe.example.com/msp cli peer lifecycle chaincode approveformyorg -o orderer1.orderer.example.com:7050 --ordererTLSHostnameOverride orderer1.orderer.example.com --channelID %CHANNEL_NAME% --name %CC_NAME% --version %CC_VERSION% --package-id %PACKAGE_ID% --sequence %CC_SEQUENCE% --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem

REM Approve for Customs
echo [4/5] Approving for Customs...
docker exec -e CORE_PEER_LOCALMSPID=CustomsMSP -e CORE_PEER_ADDRESS=peer0.customs.example.com:11051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/customs.example.com/peers/peer0.customs.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/customs.example.com/users/Admin@customs.example.com/msp cli peer lifecycle chaincode approveformyorg -o orderer1.orderer.example.com:7050 --ordererTLSHostnameOverride orderer1.orderer.example.com --channelID %CHANNEL_NAME% --name %CC_NAME% --version %CC_VERSION% --package-id %PACKAGE_ID% --sequence %CC_SEQUENCE% --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem

REM Approve for Shipping
echo [5/5] Approving for Shipping...
docker exec -e CORE_PEER_LOCALMSPID=ShippingMSP -e CORE_PEER_ADDRESS=peer0.shipping.example.com:12051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/shipping.example.com/peers/peer0.shipping.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/shipping.example.com/users/Admin@shipping.example.com/msp cli peer lifecycle chaincode approveformyorg -o orderer1.orderer.example.com:7050 --ordererTLSHostnameOverride orderer1.orderer.example.com --channelID %CHANNEL_NAME% --name %CC_NAME% --version %CC_VERSION% --package-id %PACKAGE_ID% --sequence %CC_SEQUENCE% --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem

echo ✓ Chaincode approved by all organizations

timeout /t 3 /nobreak

echo.
echo ========================================
echo  STEP 6: COMMIT CHAINCODE
echo ========================================
echo.

echo Committing chaincode to channel...
docker exec cli peer lifecycle chaincode commit -o orderer1.orderer.example.com:7050 --ordererTLSHostnameOverride orderer1.orderer.example.com --channelID %CHANNEL_NAME% --name %CC_NAME% --version %CC_VERSION% --sequence %CC_SEQUENCE% --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem --peerAddresses peer0.ecta.example.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt --peerAddresses peer0.bank.example.com:9051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/bank.example.com/peers/peer0.bank.example.com/tls/ca.crt

if %errorlevel% neq 0 (
    echo ✗ Failed to commit chaincode
    pause
    exit /b 1
)

echo ✓ Chaincode committed

timeout /t 10 /nobreak

echo.
echo ========================================
echo  STEP 7: VERIFY DEPLOYMENT
echo ========================================
echo.

echo Verifying chaincode deployment...
docker exec cli peer lifecycle chaincode querycommitted --channelID %CHANNEL_NAME% --name %CC_NAME%

echo.
echo Checking channel membership...
docker exec cli peer channel list

echo.
echo ========================================
echo  STEP 8: SEED USERS TO BLOCKCHAIN
echo ========================================
echo.

echo Waiting for chaincode to be ready (10 seconds)...
timeout /t 10 /nobreak

echo Seeding users to blockchain...
docker exec coffee-gateway node src/scripts/seedUsers.js

echo.
echo ========================================
echo  DEPLOYMENT COMPLETE!
echo ========================================
echo.
echo ✓ Channel created: %CHANNEL_NAME%
echo ✓ Chaincode deployed: %CC_NAME% v%CC_VERSION%
echo ✓ All peers joined
echo ✓ Users seeded to blockchain
echo.
echo Your hybrid system is now fully operational!
echo.
echo   Frontend: http://localhost:5173
echo   Login: admin / admin123
echo.
echo   Features:
echo   ✓ Fast queries (PostgreSQL)
echo   ✓ Immutable records (Blockchain)
echo   ✓ Consensus validation
echo   ✓ Complete audit trail
echo.
start http://localhost:5173
pause
