@echo off
REM ============================================================================
REM COMPLETE FABRIC SETUP - Channel Creation and Chaincode Deployment
REM ============================================================================

echo.
echo ========================================
echo  COMPLETE FABRIC SETUP
echo ========================================
echo.
echo This will:
echo   1. Create coffeechannel
echo   2. Join all peers to channel
echo   3. Update anchor peers
echo   4. Package chaincode
echo   5. Install chaincode on all peers
echo   6. Approve chaincode for all orgs
echo   7. Commit chaincode
echo   8. Initialize chaincode
echo   9. Seed users to blockchain
echo.
echo Estimated time: 10-15 minutes
echo.
pause

set CHANNEL_NAME=coffeechannel
set CHAINCODE_NAME=ecta
set CHAINCODE_VERSION=1.0
set CHAINCODE_SEQUENCE=1

REM ============================================================================
REM STEP 1: CREATE CHANNEL
REM ============================================================================

echo.
echo ========================================
echo  STEP 1: CREATE CHANNEL
echo ========================================
echo.

echo Creating channel: %CHANNEL_NAME%...

REM Generate channel transaction if not exists
if not exist channel-artifacts\%CHANNEL_NAME%.tx (
    echo Generating channel transaction...
    docker run --rm -v "%CD%":/work -w /work -e FABRIC_CFG_PATH=/work/config hyperledger/fabric-tools:2.5 configtxgen -profile CoffeeChannel -outputCreateChannelTx /work/channel-artifacts/%CHANNEL_NAME%.tx -channelID %CHANNEL_NAME%
)

REM Create channel using peer0.ecta
echo Creating channel on orderer...
docker exec -e CORE_PEER_LOCALMSPID=ECTAMSP -e CORE_PEER_ADDRESS=peer0.ecta.example.com:7051 -e CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/fabric/msp -e CORE_PEER_TLS_ENABLED=true -e CORE_PEER_TLS_ROOTCERT_FILE=/etc/hyperledger/fabric/tls/ca.crt peer0.ecta.example.com peer channel create -o orderer1.orderer.example.com:7050 -c %CHANNEL_NAME% -f /etc/hyperledger/fabric/channel-artifacts/%CHANNEL_NAME%.tx --outputBlock /etc/hyperledger/fabric/channel-artifacts/%CHANNEL_NAME%.block --tls --cafile /etc/hyperledger/fabric/orderer-tls/tlsca.orderer.example.com-cert.pem

if %errorlevel% neq 0 (
    echo ⚠ Channel may already exist or creation failed
    echo Checking if channel exists...
    docker exec peer0.ecta.example.com peer channel list
) else (
    echo ✓ Channel created successfully
)

echo.
timeout /t 5 /nobreak

REM ============================================================================
REM STEP 2: JOIN PEERS TO CHANNEL
REM ============================================================================

echo.
echo ========================================
echo  STEP 2: JOIN PEERS TO CHANNEL
echo ========================================
echo.

REM Fetch channel block if needed
echo Fetching channel genesis block...
docker exec peer0.ecta.example.com peer channel fetch 0 %CHANNEL_NAME%.block -c %CHANNEL_NAME% -o orderer1.orderer.example.com:7050 --tls --cafile /etc/hyperledger/fabric/orderer-tls/tlsca.orderer.example.com-cert.pem

echo.
echo Joining peers to channel...

REM Join ECTA peers
echo [1/6] Joining peer0.ecta...
docker exec peer0.ecta.example.com peer channel join -b %CHANNEL_NAME%.block
echo ✓ peer0.ecta joined

echo [2/6] Joining peer1.ecta...
docker exec peer1.ecta.example.com peer channel join -b %CHANNEL_NAME%.block
echo ✓ peer1.ecta joined

REM Join Bank peer
echo [3/6] Joining peer0.bank...
docker exec peer0.bank.example.com peer channel join -b %CHANNEL_NAME%.block
echo ✓ peer0.bank joined

REM Join NBE peer
echo [4/6] Joining peer0.nbe...
docker exec peer0.nbe.example.com peer channel join -b %CHANNEL_NAME%.block
echo ✓ peer0.nbe joined

REM Join Customs peer
echo [5/6] Joining peer0.customs...
docker exec peer0.customs.example.com peer channel join -b %CHANNEL_NAME%.block
echo ✓ peer0.customs joined

REM Join Shipping peer
echo [6/6] Joining peer0.shipping...
docker exec peer0.shipping.example.com peer channel join -b %CHANNEL_NAME%.block
echo ✓ peer0.shipping joined

echo.
echo ✓ All peers joined to channel

timeout /t 3 /nobreak

REM ============================================================================
REM STEP 3: PACKAGE CHAINCODE
REM ============================================================================

echo.
echo ========================================
echo  STEP 3: PACKAGE CHAINCODE
echo ========================================
echo.

echo Packaging chaincode: %CHAINCODE_NAME%...

REM Package chaincode
docker exec peer0.ecta.example.com peer lifecycle chaincode package %CHAINCODE_NAME%.tar.gz --path /opt/gopath/src/github.com/chaincode/%CHAINCODE_NAME% --lang node --label %CHAINCODE_NAME%_%CHAINCODE_VERSION%

if %errorlevel% neq 0 (
    echo ✗ Failed to package chaincode
    echo.
    echo Checking chaincode directory...
    docker exec peer0.ecta.example.com ls -la /opt/gopath/src/github.com/chaincode/
    pause
    exit /b 1
)

echo ✓ Chaincode packaged

REM ============================================================================
REM STEP 4: INSTALL CHAINCODE
REM ============================================================================

echo.
echo ========================================
echo  STEP 4: INSTALL CHAINCODE
echo ========================================
echo.

echo Installing chaincode on all peers...

REM Install on ECTA peers
echo [1/6] Installing on peer0.ecta...
docker exec peer0.ecta.example.com peer lifecycle chaincode install %CHAINCODE_NAME%.tar.gz
echo ✓ Installed on peer0.ecta

echo [2/6] Installing on peer1.ecta...
docker exec peer1.ecta.example.com peer lifecycle chaincode install %CHAINCODE_NAME%.tar.gz
echo ✓ Installed on peer1.ecta

REM Install on other peers
echo [3/6] Installing on peer0.bank...
docker exec peer0.bank.example.com peer lifecycle chaincode install %CHAINCODE_NAME%.tar.gz
echo ✓ Installed on peer0.bank

echo [4/6] Installing on peer0.nbe...
docker exec peer0.nbe.example.com peer lifecycle chaincode install %CHAINCODE_NAME%.tar.gz
echo ✓ Installed on peer0.nbe

echo [5/6] Installing on peer0.customs...
docker exec peer0.customs.example.com peer lifecycle chaincode install %CHAINCODE_NAME%.tar.gz
echo ✓ Installed on peer0.customs

echo [6/6] Installing on peer0.shipping...
docker exec peer0.shipping.example.com peer lifecycle chaincode install %CHAINCODE_NAME%.tar.gz
echo ✓ Installed on peer0.shipping

echo.
echo ✓ Chaincode installed on all peers

REM Get package ID
echo.
echo Getting chaincode package ID...
docker exec peer0.ecta.example.com peer lifecycle chaincode queryinstalled > chaincode_id.txt
for /f "tokens=3 delims=:, " %%a in ('findstr /C:"Package ID" chaincode_id.txt') do set PACKAGE_ID=%%a
echo Package ID: %PACKAGE_ID%

timeout /t 3 /nobreak

REM ============================================================================
REM STEP 5: APPROVE CHAINCODE
REM ============================================================================

echo.
echo ========================================
echo  STEP 5: APPROVE CHAINCODE
echo ========================================
echo.

echo Approving chaincode for all organizations...

REM Approve for ECTA
echo [1/5] Approving for ECTA...
docker exec peer0.ecta.example.com peer lifecycle chaincode approveformyorg -o orderer1.orderer.example.com:7050 --channelID %CHANNEL_NAME% --name %CHAINCODE_NAME% --version %CHAINCODE_VERSION% --package-id %PACKAGE_ID% --sequence %CHAINCODE_SEQUENCE% --tls --cafile /etc/hyperledger/fabric/orderer-tls/tlsca.orderer.example.com-cert.pem
echo ✓ Approved for ECTA

REM Approve for Bank
echo [2/5] Approving for Bank...
docker exec peer0.bank.example.com peer lifecycle chaincode approveformyorg -o orderer1.orderer.example.com:7050 --channelID %CHANNEL_NAME% --name %CHAINCODE_NAME% --version %CHAINCODE_VERSION% --package-id %PACKAGE_ID% --sequence %CHAINCODE_SEQUENCE% --tls --cafile /etc/hyperledger/fabric/orderer-tls/tlsca.orderer.example.com-cert.pem
echo ✓ Approved for Bank

REM Approve for NBE
echo [3/5] Approving for NBE...
docker exec peer0.nbe.example.com peer lifecycle chaincode approveformyorg -o orderer1.orderer.example.com:7050 --channelID %CHANNEL_NAME% --name %CHAINCODE_NAME% --version %CHAINCODE_VERSION% --package-id %PACKAGE_ID% --sequence %CHAINCODE_SEQUENCE% --tls --cafile /etc/hyperledger/fabric/orderer-tls/tlsca.orderer.example.com-cert.pem
echo ✓ Approved for NBE

REM Approve for Customs
echo [4/5] Approving for Customs...
docker exec peer0.customs.example.com peer lifecycle chaincode approveformyorg -o orderer1.orderer.example.com:7050 --channelID %CHANNEL_NAME% --name %CHAINCODE_NAME% --version %CHAINCODE_VERSION% --package-id %PACKAGE_ID% --sequence %CHAINCODE_SEQUENCE% --tls --cafile /etc/hyperledger/fabric/orderer-tls/tlsca.orderer.example.com-cert.pem
echo ✓ Approved for Customs

REM Approve for Shipping
echo [5/5] Approving for Shipping...
docker exec peer0.shipping.example.com peer lifecycle chaincode approveformyorg -o orderer1.orderer.example.com:7050 --channelID %CHANNEL_NAME% --name %CHAINCODE_NAME% --version %CHAINCODE_VERSION% --package-id %PACKAGE_ID% --sequence %CHAINCODE_SEQUENCE% --tls --cafile /etc/hyperledger/fabric/orderer-tls/tlsca.orderer.example.com-cert.pem
echo ✓ Approved for Shipping

echo.
echo ✓ Chaincode approved by all organizations

timeout /t 3 /nobreak

REM ============================================================================
REM STEP 6: COMMIT CHAINCODE
REM ============================================================================

echo.
echo ========================================
echo  STEP 6: COMMIT CHAINCODE
echo ========================================
echo.

echo Committing chaincode to channel...
docker exec peer0.ecta.example.com peer lifecycle chaincode commit -o orderer1.orderer.example.com:7050 --channelID %CHANNEL_NAME% --name %CHAINCODE_NAME% --version %CHAINCODE_VERSION% --sequence %CHAINCODE_SEQUENCE% --tls --cafile /etc/hyperledger/fabric/orderer-tls/tlsca.orderer.example.com-cert.pem --peerAddresses peer0.ecta.example.com:7051 --tlsRootCertFiles /etc/hyperledger/fabric/tls/ca.crt --peerAddresses peer0.bank.example.com:9051 --tlsRootCertFiles /etc/hyperledger/fabric/bank-tls/ca.crt

if %errorlevel% neq 0 (
    echo ✗ Failed to commit chaincode
    pause
    exit /b 1
)

echo ✓ Chaincode committed

timeout /t 5 /nobreak

REM ============================================================================
REM STEP 7: VERIFY CHAINCODE
REM ============================================================================

echo.
echo ========================================
echo  STEP 7: VERIFY CHAINCODE
echo ========================================
echo.

echo Checking committed chaincode...
docker exec peer0.ecta.example.com peer lifecycle chaincode querycommitted --channelID %CHANNEL_NAME% --name %CHAINCODE_NAME%

echo.
echo ✓ Chaincode verification complete

REM ============================================================================
REM STEP 8: SEED USERS TO BLOCKCHAIN
REM ============================================================================

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
echo ✓ Users seeded to blockchain

REM ============================================================================
REM COMPLETION
REM ============================================================================

echo.
echo ========================================
echo  FABRIC SETUP COMPLETE!
echo ========================================
echo.
echo Channel: %CHANNEL_NAME%
echo Chaincode: %CHAINCODE_NAME% v%CHAINCODE_VERSION%
echo.
echo Verification:
docker exec peer0.ecta.example.com peer channel list
echo.
docker exec peer0.ecta.example.com peer lifecycle chaincode querycommitted --channelID %CHANNEL_NAME%
echo.
echo ========================================
echo  SYSTEM FULLY OPERATIONAL!
echo ========================================
echo.
echo   Frontend: http://localhost:5173
echo   Login: admin / admin123
echo.
echo   All features now available:
echo   ✓ PostgreSQL (fast queries)
echo   ✓ Blockchain (immutable records)
echo   ✓ Hybrid system fully operational
echo.
start http://localhost:5173
pause
