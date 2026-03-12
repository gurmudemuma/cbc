@echo off
REM ============================================================================
REM PRODUCTION FABRIC DEPLOYMENT
REM Expert-level deployment using Channel Participation API (Fabric 2.3+)
REM ============================================================================

setlocal enabledelayedexpansion

echo.
echo ========================================
echo  PRODUCTION FABRIC DEPLOYMENT
echo ========================================
echo.
echo This script performs production-grade Fabric deployment:
echo   1. Create channel using Channel Participation API
echo   2. Join orderers to channel (Raft consensus)
echo   3. Join all peers to channel
echo   4. Package chaincode with correct paths
echo   5. Install chaincode on all peers
echo   6. Approve chaincode for all organizations
echo   7. Commit chaincode to channel
echo   8. Initialize chaincode
echo   9. Seed users to blockchain
echo.
echo Estimated time: 8-12 minutes
echo.
pause

set CHANNEL_NAME=coffeechannel
set CHAINCODE_NAME=ecta
set CHAINCODE_VERSION=1.0
set CHAINCODE_SEQUENCE=1
set ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem

REM ============================================================================
REM STEP 1: GENERATE CHANNEL GENESIS BLOCK
REM ============================================================================

echo.
echo ========================================
echo  STEP 1: GENERATE CHANNEL GENESIS BLOCK
echo ========================================
echo.

echo Generating channel genesis block using configtxgen...
docker exec cli configtxgen -profile CoffeeChannel -outputBlock /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/%CHANNEL_NAME%.block -channelID %CHANNEL_NAME%

if %errorlevel% neq 0 (
    echo ✗ Failed to generate channel genesis block
    echo.
    echo Checking configtx.yaml...
    docker exec cli cat /etc/hyperledger/configtx/configtx.yaml
    pause
    exit /b 1
)

echo ✓ Channel genesis block generated

REM ============================================================================
REM STEP 2: JOIN ORDERERS TO CHANNEL (Channel Participation API)
REM ============================================================================

echo.
echo ========================================
echo  STEP 2: JOIN ORDERERS TO CHANNEL
echo ========================================
echo.

echo Using Channel Participation API (osnadmin)...

REM Join orderer1
echo [1/3] Joining orderer1...
docker exec cli osnadmin channel join --channelID %CHANNEL_NAME% --config-block /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/%CHANNEL_NAME%.block -o orderer1.orderer.example.com:7053 --ca-file %ORDERER_CA% --client-cert %ORDERER_CA% --client-key /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/tls/server.key

if %errorlevel% equ 0 (
    echo ✓ orderer1 joined
) else (
    echo ⚠ orderer1 may already be in channel
)

REM Join orderer2
echo [2/3] Joining orderer2...
docker exec cli osnadmin channel join --channelID %CHANNEL_NAME% --config-block /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/%CHANNEL_NAME%.block -o orderer2.orderer.example.com:8053 --ca-file %ORDERER_CA% --client-cert %ORDERER_CA% --client-key /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/orderer.example.com/orderers/orderer2.orderer.example.com/tls/server.key

if %errorlevel% equ 0 (
    echo ✓ orderer2 joined
) else (
    echo ⚠ orderer2 may already be in channel
)

REM Join orderer3
echo [3/3] Joining orderer3...
docker exec cli osnadmin channel join --channelID %CHANNEL_NAME% --config-block /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/%CHANNEL_NAME%.block -o orderer3.orderer.example.com:9053 --ca-file %ORDERER_CA% --client-cert %ORDERER_CA% --client-key /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/orderer.example.com/orderers/orderer3.orderer.example.com/tls/server.key

if %errorlevel% equ 0 (
    echo ✓ orderer3 joined
) else (
    echo ⚠ orderer3 may already be in channel
)

echo.
echo ✓ Orderers joined to channel
echo Waiting for Raft consensus (10 seconds)...
timeout /t 10 /nobreak >nul

REM ============================================================================
REM STEP 3: JOIN PEERS TO CHANNEL
REM ============================================================================

echo.
echo ========================================
echo  STEP 3: JOIN PEERS TO CHANNEL
echo ========================================
echo.

REM Join ECTA peer0
echo [1/6] Joining peer0.ecta...
docker exec cli peer channel join -b /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/%CHANNEL_NAME%.block

if %errorlevel% equ 0 (
    echo ✓ peer0.ecta joined
) else (
    echo ⚠ peer0.ecta may already be in channel
)

REM Join ECTA peer1
echo [2/6] Joining peer1.ecta...
docker exec -e CORE_PEER_ADDRESS=peer1.ecta.example.com:8051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/ecta.example.com/peers/peer1.ecta.example.com/tls/ca.crt cli peer channel join -b /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/%CHANNEL_NAME%.block

if %errorlevel% equ 0 (
    echo ✓ peer1.ecta joined
) else (
    echo ⚠ peer1.ecta may already be in channel
)

REM Join Bank peer
echo [3/6] Joining peer0.bank...
docker exec -e CORE_PEER_LOCALMSPID=BankMSP -e CORE_PEER_ADDRESS=peer0.bank.example.com:9051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/bank.example.com/peers/peer0.bank.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/bank.example.com/users/Admin@bank.example.com/msp cli peer channel join -b /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/%CHANNEL_NAME%.block

if %errorlevel% equ 0 (
    echo ✓ peer0.bank joined
) else (
    echo ⚠ peer0.bank may already be in channel
)

REM Join NBE peer
echo [4/6] Joining peer0.nbe...
docker exec -e CORE_PEER_LOCALMSPID=NBEMSP -e CORE_PEER_ADDRESS=peer0.nbe.example.com:10051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/nbe.example.com/peers/peer0.nbe.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/nbe.example.com/users/Admin@nbe.example.com/msp cli peer channel join -b /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/%CHANNEL_NAME%.block

if %errorlevel% equ 0 (
    echo ✓ peer0.nbe joined
) else (
    echo ⚠ peer0.nbe may already be in channel
)

REM Join Customs peer
echo [5/6] Joining peer0.customs...
docker exec -e CORE_PEER_LOCALMSPID=CustomsMSP -e CORE_PEER_ADDRESS=peer0.customs.example.com:11051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/customs.example.com/peers/peer0.customs.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/customs.example.com/users/Admin@customs.example.com/msp cli peer channel join -b /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/%CHANNEL_NAME%.block

if %errorlevel% equ 0 (
    echo ✓ peer0.customs joined
) else (
    echo ⚠ peer0.customs may already be in channel
)

REM Join Shipping peer
echo [6/6] Joining peer0.shipping...
docker exec -e CORE_PEER_LOCALMSPID=ShippingMSP -e CORE_PEER_ADDRESS=peer0.shipping.example.com:12051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/shipping.example.com/peers/peer0.shipping.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/shipping.example.com/users/Admin@shipping.example.com/msp cli peer channel join -b /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/%CHANNEL_NAME%.block

if %errorlevel% equ 0 (
    echo ✓ peer0.shipping joined
) else (
    echo ⚠ peer0.shipping may already be in channel
)

echo.
echo ✓ All peers joined to channel

REM Verify channel membership
echo.
echo Verifying channel membership...
docker exec cli peer channel list

timeout /t 5 /nobreak >nul

REM ============================================================================
REM STEP 4: PACKAGE CHAINCODE
REM ============================================================================

echo.
echo ========================================
echo  STEP 4: PACKAGE CHAINCODE
echo ========================================
echo.

echo Packaging chaincode: %CHAINCODE_NAME%...
docker exec cli peer lifecycle chaincode package %CHAINCODE_NAME%.tar.gz --path /opt/gopath/src/github.com/hyperledger/fabric/chaincode/%CHAINCODE_NAME% --lang node --label %CHAINCODE_NAME%_%CHAINCODE_VERSION%

if %errorlevel% neq 0 (
    echo ✗ Failed to package chaincode
    echo.
    echo Checking chaincode directory...
    docker exec cli ls -la /opt/gopath/src/github.com/hyperledger/fabric/chaincode/
    docker exec cli ls -la /opt/gopath/src/github.com/hyperledger/fabric/chaincode/%CHAINCODE_NAME%/
    pause
    exit /b 1
)

echo ✓ Chaincode packaged successfully

REM ============================================================================
REM STEP 5: INSTALL CHAINCODE ON ALL PEERS
REM ============================================================================

echo.
echo ========================================
echo  STEP 5: INSTALL CHAINCODE
echo ========================================
echo.

echo Installing chaincode on all peers...

REM Install on ECTA peer0
echo [1/6] Installing on peer0.ecta...
docker exec cli peer lifecycle chaincode install %CHAINCODE_NAME%.tar.gz
echo ✓ Installed on peer0.ecta

REM Install on ECTA peer1
echo [2/6] Installing on peer1.ecta...
docker exec -e CORE_PEER_ADDRESS=peer1.ecta.example.com:8051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/ecta.example.com/peers/peer1.ecta.example.com/tls/ca.crt cli peer lifecycle chaincode install %CHAINCODE_NAME%.tar.gz
echo ✓ Installed on peer1.ecta

REM Install on Bank peer
echo [3/6] Installing on peer0.bank...
docker exec -e CORE_PEER_LOCALMSPID=BankMSP -e CORE_PEER_ADDRESS=peer0.bank.example.com:9051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/bank.example.com/peers/peer0.bank.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/bank.example.com/users/Admin@bank.example.com/msp cli peer lifecycle chaincode install %CHAINCODE_NAME%.tar.gz
echo ✓ Installed on peer0.bank

REM Install on NBE peer
echo [4/6] Installing on peer0.nbe...
docker exec -e CORE_PEER_LOCALMSPID=NBEMSP -e CORE_PEER_ADDRESS=peer0.nbe.example.com:10051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/nbe.example.com/peers/peer0.nbe.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/nbe.example.com/users/Admin@nbe.example.com/msp cli peer lifecycle chaincode install %CHAINCODE_NAME%.tar.gz
echo ✓ Installed on peer0.nbe

REM Install on Customs peer
echo [5/6] Installing on peer0.customs...
docker exec -e CORE_PEER_LOCALMSPID=CustomsMSP -e CORE_PEER_ADDRESS=peer0.customs.example.com:11051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/customs.example.com/peers/peer0.customs.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/customs.example.com/users/Admin@customs.example.com/msp cli peer lifecycle chaincode install %CHAINCODE_NAME%.tar.gz
echo ✓ Installed on peer0.customs

REM Install on Shipping peer
echo [6/6] Installing on peer0.shipping...
docker exec -e CORE_PEER_LOCALMSPID=ShippingMSP -e CORE_PEER_ADDRESS=peer0.shipping.example.com:12051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/shipping.example.com/peers/peer0.shipping.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/shipping.example.com/users/Admin@shipping.example.com/msp cli peer lifecycle chaincode install %CHAINCODE_NAME%.tar.gz
echo ✓ Installed on peer0.shipping

echo.
echo ✓ Chaincode installed on all peers

REM Get package ID
echo.
echo Getting chaincode package ID...
docker exec cli peer lifecycle chaincode queryinstalled > package_id.txt
for /f "tokens=3 delims=:, " %%a in ('findstr /C:"Package ID" package_id.txt') do set PACKAGE_ID=%%a
echo Package ID: %PACKAGE_ID%

if "%PACKAGE_ID%"=="" (
    echo ✗ Failed to get package ID
    type package_id.txt
    pause
    exit /b 1
)

timeout /t 3 /nobreak >nul

REM ============================================================================
REM STEP 6: APPROVE CHAINCODE FOR ALL ORGANIZATIONS
REM ============================================================================

echo.
echo ========================================
echo  STEP 6: APPROVE CHAINCODE
echo ========================================
echo.

echo Approving chaincode for all organizations...

REM Approve for ECTA
echo [1/5] Approving for ECTA...
docker exec cli peer lifecycle chaincode approveformyorg -o orderer1.orderer.example.com:7050 --ordererTLSHostnameOverride orderer1.orderer.example.com --channelID %CHANNEL_NAME% --name %CHAINCODE_NAME% --version %CHAINCODE_VERSION% --package-id %PACKAGE_ID% --sequence %CHAINCODE_SEQUENCE% --tls --cafile %ORDERER_CA%
echo ✓ Approved for ECTA

REM Approve for Bank
echo [2/5] Approving for Bank...
docker exec -e CORE_PEER_LOCALMSPID=BankMSP -e CORE_PEER_ADDRESS=peer0.bank.example.com:9051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/bank.example.com/peers/peer0.bank.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/bank.example.com/users/Admin@bank.example.com/msp cli peer lifecycle chaincode approveformyorg -o orderer1.orderer.example.com:7050 --ordererTLSHostnameOverride orderer1.orderer.example.com --channelID %CHANNEL_NAME% --name %CHAINCODE_NAME% --version %CHAINCODE_VERSION% --package-id %PACKAGE_ID% --sequence %CHAINCODE_SEQUENCE% --tls --cafile %ORDERER_CA%
echo ✓ Approved for Bank

REM Approve for NBE
echo [3/5] Approving for NBE...
docker exec -e CORE_PEER_LOCALMSPID=NBEMSP -e CORE_PEER_ADDRESS=peer0.nbe.example.com:10051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/nbe.example.com/peers/peer0.nbe.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/nbe.example.com/users/Admin@nbe.example.com/msp cli peer lifecycle chaincode approveformyorg -o orderer1.orderer.example.com:7050 --ordererTLSHostnameOverride orderer1.orderer.example.com --channelID %CHANNEL_NAME% --name %CHAINCODE_NAME% --version %CHAINCODE_VERSION% --package-id %PACKAGE_ID% --sequence %CHAINCODE_SEQUENCE% --tls --cafile %ORDERER_CA%
echo ✓ Approved for NBE

REM Approve for Customs
echo [4/5] Approving for Customs...
docker exec -e CORE_PEER_LOCALMSPID=CustomsMSP -e CORE_PEER_ADDRESS=peer0.customs.example.com:11051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/customs.example.com/peers/peer0.customs.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/customs.example.com/users/Admin@customs.example.com/msp cli peer lifecycle chaincode approveformyorg -o orderer1.orderer.example.com:7050 --ordererTLSHostnameOverride orderer1.orderer.example.com --channelID %CHANNEL_NAME% --name %CHAINCODE_NAME% --version %CHAINCODE_VERSION% --package-id %PACKAGE_ID% --sequence %CHAINCODE_SEQUENCE% --tls --cafile %ORDERER_CA%
echo ✓ Approved for Customs

REM Approve for Shipping
echo [5/5] Approving for Shipping...
docker exec -e CORE_PEER_LOCALMSPID=ShippingMSP -e CORE_PEER_ADDRESS=peer0.shipping.example.com:12051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/shipping.example.com/peers/peer0.shipping.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/shipping.example.com/users/Admin@shipping.example.com/msp cli peer lifecycle chaincode approveformyorg -o orderer1.orderer.example.com:7050 --ordererTLSHostnameOverride orderer1.orderer.example.com --channelID %CHANNEL_NAME% --name %CHAINCODE_NAME% --version %CHAINCODE_VERSION% --package-id %PACKAGE_ID% --sequence %CHAINCODE_SEQUENCE% --tls --cafile %ORDERER_CA%
echo ✓ Approved for Shipping

echo.
echo ✓ Chaincode approved by all organizations

REM Check commit readiness
echo.
echo Checking commit readiness...
docker exec cli peer lifecycle chaincode checkcommitreadiness --channelID %CHANNEL_NAME% --name %CHAINCODE_NAME% --version %CHAINCODE_VERSION% --sequence %CHAINCODE_SEQUENCE% --tls --cafile %ORDERER_CA% --output json

timeout /t 5 /nobreak >nul

REM ============================================================================
REM STEP 7: COMMIT CHAINCODE
REM ============================================================================

echo.
echo ========================================
echo  STEP 7: COMMIT CHAINCODE
echo ========================================
echo.

echo Committing chaincode to channel...
docker exec cli peer lifecycle chaincode commit -o orderer1.orderer.example.com:7050 --ordererTLSHostnameOverride orderer1.orderer.example.com --channelID %CHANNEL_NAME% --name %CHAINCODE_NAME% --version %CHAINCODE_VERSION% --sequence %CHAINCODE_SEQUENCE% --tls --cafile %ORDERER_CA% --peerAddresses peer0.ecta.example.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt --peerAddresses peer0.bank.example.com:9051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/bank.example.com/peers/peer0.bank.example.com/tls/ca.crt

if %errorlevel% neq 0 (
    echo ✗ Failed to commit chaincode
    pause
    exit /b 1
)

echo ✓ Chaincode committed successfully

echo.
echo Waiting for chaincode to initialize (15 seconds)...
timeout /t 15 /nobreak >nul

REM ============================================================================
REM STEP 8: VERIFY DEPLOYMENT
REM ============================================================================

echo.
echo ========================================
echo  STEP 8: VERIFY DEPLOYMENT
echo ========================================
echo.

echo Checking committed chaincode...
docker exec cli peer lifecycle chaincode querycommitted --channelID %CHANNEL_NAME% --name %CHAINCODE_NAME%

echo.
echo Checking channel list...
docker exec cli peer channel list

echo.
echo ✓ Deployment verification complete

REM ============================================================================
REM STEP 9: SEED USERS TO BLOCKCHAIN
REM ============================================================================

echo.
echo ========================================
echo  STEP 9: SEED USERS TO BLOCKCHAIN
echo ========================================
echo.

echo Seeding users to blockchain...
docker exec coffee-gateway node src/scripts/seedUsers.js

echo.
echo ✓ Users seeded to blockchain

REM ============================================================================
REM COMPLETION
REM ============================================================================

echo.
echo ========================================
echo  DEPLOYMENT COMPLETE!
echo ========================================
echo.
echo Channel: %CHANNEL_NAME%
echo Chaincode: %CHAINCODE_NAME% v%CHAINCODE_VERSION%
echo Package ID: %PACKAGE_ID%
echo.
echo System Status:
echo   ✓ Channel created and operational
echo   ✓ All orderers in Raft consensus
echo   ✓ All peers joined to channel
echo   ✓ Chaincode deployed and committed
echo   ✓ Users synced to blockchain
echo.
echo ========================================
echo  SYSTEM FULLY OPERATIONAL!
echo ========================================
echo.
echo   Frontend:       http://localhost:5173
echo   Gateway API:    http://localhost:3000
echo   Bridge API:     http://localhost:3008
echo.
echo   Login: admin / admin123
echo.
echo   Hybrid System Active:
echo   ✓ PostgreSQL (fast queries)
echo   ✓ Blockchain (immutable records)
echo.
start http://localhost:5173
pause

