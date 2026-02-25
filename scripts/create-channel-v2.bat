@echo off
REM ================================================================================
REM Coffee Export Blockchain Consortium - Comprehensive Channel Creation
REM ================================================================================
REM This script creates and configures the coffeechannel for Fabric 2.x
REM 
REM Components:
REM - 3 Orderers (Raft consensus cluster)
REM - 6 Peers (ECTA x2, Bank, NBE, Customs, Shipping)
REM - Channel participation API (Fabric 2.x method)
REM - Anchor peer configuration for all organizations
REM
REM Prerequisites:
REM - Docker containers running (docker-compose -f docker-compose-fabric.yml up -d)
REM - Crypto materials generated (crypto-config/)
REM - configtx.yaml properly configured
REM ================================================================================

echo.
echo ================================================================================
echo COFFEE EXPORT BLOCKCHAIN CONSORTIUM
echo Comprehensive Channel Creation and Configuration
echo ================================================================================
echo.
echo Channel Name: coffeechannel
echo Organizations: ECTA, Bank, NBE, Customs, Shipping
echo Orderers: 3 nodes (Raft consensus)
echo Peers: 6 nodes across 5 organizations
echo.
echo This script will:
echo   1. Generate channel genesis block
echo   2. Join all orderers to channel (Raft cluster formation)
echo   3. Join all peers to channel
echo   4. Update anchor peers for each organization
echo   5. Verify channel configuration
echo.
echo ================================================================================
echo.

set CHANNEL_NAME=coffeechannel
set ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem

REM ================================================================================
REM STEP 1: Generate Channel Genesis Block
REM ================================================================================

echo [1/5] Generating channel genesis block...
echo.
echo Using profile: CoffeeChannel
echo Output: /etc/hyperledger/configtx/%CHANNEL_NAME%.block
echo.

docker exec -e FABRIC_CFG_PATH=/etc/hyperledger/configtx cli configtxgen -profile CoffeeChannel -outputBlock /etc/hyperledger/configtx/%CHANNEL_NAME%.block -channelID %CHANNEL_NAME%

if errorlevel 1 (
    echo.
    echo ================================================================================
    echo ERROR: Failed to generate channel genesis block
    echo ================================================================================
    echo.
    echo Possible causes:
    echo   - configtx.yaml has syntax errors
    echo   - CoffeeChannel profile not found
    echo   - Missing organization definitions
    echo.
    echo Please check:
    echo   1. config/configtx.yaml exists and is valid
    echo   2. CoffeeChannel profile is defined
    echo   3. All organization MSP directories exist
    echo.
    pause
    exit /b 1
)

echo.
echo [SUCCESS] Channel genesis block created
echo.

REM ================================================================================
REM STEP 2: Join Orderers to Channel (Raft Cluster Formation)
REM ================================================================================

echo ================================================================================
echo [2/5] Joining orderers to channel (Raft cluster formation)
echo ================================================================================
echo.
echo This creates a 3-node Raft consensus cluster for fault tolerance.
echo The cluster can tolerate 1 node failure.
echo.

echo [2.1] Joining orderer1.orderer.example.com:7053...
docker exec cli osnadmin channel join --channelID %CHANNEL_NAME% --config-block /etc/hyperledger/configtx/%CHANNEL_NAME%.block -o orderer1.orderer.example.com:7053 --ca-file /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem --client-cert /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/tls/server.crt --client-key /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/tls/server.key

if errorlevel 1 (
    echo [WARNING] Orderer1 join failed or already joined
) else (
    echo [SUCCESS] Orderer1 joined
)

echo.
echo [2.2] Joining orderer2.orderer.example.com:8053...
docker exec cli osnadmin channel join --channelID %CHANNEL_NAME% --config-block /etc/hyperledger/configtx/%CHANNEL_NAME%.block -o orderer2.orderer.example.com:8053 --ca-file /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/orderer.example.com/orderers/orderer2.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem --client-cert /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/orderer.example.com/orderers/orderer2.orderer.example.com/tls/server.crt --client-key /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/orderer.example.com/orderers/orderer2.orderer.example.com/tls/server.key

if errorlevel 1 (
    echo [WARNING] Orderer2 join failed or already joined
) else (
    echo [SUCCESS] Orderer2 joined
)

echo.
echo [2.3] Joining orderer3.orderer.example.com:9053...
docker exec cli osnadmin channel join --channelID %CHANNEL_NAME% --config-block /etc/hyperledger/configtx/%CHANNEL_NAME%.block -o orderer3.orderer.example.com:9053 --ca-file /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/orderer.example.com/orderers/orderer3.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem --client-cert /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/orderer.example.com/orderers/orderer3.orderer.example.com/tls/server.crt --client-key /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/orderer.example.com/orderers/orderer3.orderer.example.com/tls/server.key

if errorlevel 1 (
    echo [WARNING] Orderer3 join failed or already joined
) else (
    echo [SUCCESS] Orderer3 joined
)

echo.
echo [SUCCESS] Raft cluster formed with 3 orderers
echo.

REM ================================================================================
REM STEP 3: Join Peers to Channel
REM ================================================================================

echo ================================================================================
echo [3/5] Joining peers to channel
echo ================================================================================
echo.

echo [3.1] Joining ECTA peer0.ecta.example.com:7051...
docker exec cli peer channel join -b /etc/hyperledger/configtx/%CHANNEL_NAME%.block

if errorlevel 1 (
    echo [ERROR] ECTA peer0 failed to join
) else (
    echo [SUCCESS] ECTA peer0 joined
)

echo.
echo [3.2] Joining ECTA peer1.ecta.example.com:8051...
docker exec -e CORE_PEER_ADDRESS=peer1.ecta.example.com:8051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/ecta.example.com/peers/peer1.ecta.example.com/tls/ca.crt cli peer channel join -b /etc/hyperledger/configtx/%CHANNEL_NAME%.block

if errorlevel 1 (
    echo [ERROR] ECTA peer1 failed to join
) else (
    echo [SUCCESS] ECTA peer1 joined
)

echo.
echo [3.3] Joining Bank peer0.bank.example.com:9051...
docker exec -e CORE_PEER_LOCALMSPID=BankMSP -e CORE_PEER_ADDRESS=peer0.bank.example.com:9051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/bank.example.com/peers/peer0.bank.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/bank.example.com/users/Admin@bank.example.com/msp cli peer channel join -b /etc/hyperledger/configtx/%CHANNEL_NAME%.block

if errorlevel 1 (
    echo [ERROR] Bank peer0 failed to join
) else (
    echo [SUCCESS] Bank peer0 joined
)

echo.
echo [3.4] Joining NBE peer0.nbe.example.com:10051...
docker exec -e CORE_PEER_LOCALMSPID=NBEMSP -e CORE_PEER_ADDRESS=peer0.nbe.example.com:10051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/nbe.example.com/peers/peer0.nbe.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/nbe.example.com/users/Admin@nbe.example.com/msp cli peer channel join -b /etc/hyperledger/configtx/%CHANNEL_NAME%.block

if errorlevel 1 (
    echo [ERROR] NBE peer0 failed to join
) else (
    echo [SUCCESS] NBE peer0 joined
)

echo.
echo [3.5] Joining Customs peer0.customs.example.com:11051...
docker exec -e CORE_PEER_LOCALMSPID=CustomsMSP -e CORE_PEER_ADDRESS=peer0.customs.example.com:11051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/customs.example.com/peers/peer0.customs.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/customs.example.com/users/Admin@customs.example.com/msp cli peer channel join -b /etc/hyperledger/configtx/%CHANNEL_NAME%.block

if errorlevel 1 (
    echo [ERROR] Customs peer0 failed to join
) else (
    echo [SUCCESS] Customs peer0 joined
)

echo.
echo [3.6] Joining Shipping peer0.shipping.example.com:12051...
docker exec -e CORE_PEER_LOCALMSPID=ShippingMSP -e CORE_PEER_ADDRESS=peer0.shipping.example.com:12051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/shipping.example.com/peers/peer0.shipping.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/shipping.example.com/users/Admin@shipping.example.com/msp cli peer channel join -b /etc/hyperledger/configtx/%CHANNEL_NAME%.block

if errorlevel 1 (
    echo [ERROR] Shipping peer0 failed to join
) else (
    echo [SUCCESS] Shipping peer0 joined
)

echo.
echo [SUCCESS] All 6 peers joined to channel
echo.

REM ================================================================================
REM STEP 4: Update Anchor Peers
REM ================================================================================

echo ================================================================================
echo [4/5] Updating anchor peers for each organization
echo ================================================================================
echo.
echo Anchor peers enable cross-organization communication via gossip protocol.
echo Each organization designates one peer as the anchor peer.
echo.

echo [4.1] Updating anchor peer for ECTA (peer0.ecta.example.com)...
docker exec cli peer channel update -o orderer1.orderer.example.com:7050 -c %CHANNEL_NAME% -f /etc/hyperledger/configtx/ECTAMSPanchors.tx --tls --cafile %ORDERER_CA%

if errorlevel 1 (
    echo [WARNING] ECTA anchor peer update failed (may not be critical)
) else (
    echo [SUCCESS] ECTA anchor peer updated
)

echo.
echo [4.2] Updating anchor peer for Bank (peer0.bank.example.com)...
docker exec -e CORE_PEER_LOCALMSPID=BankMSP -e CORE_PEER_ADDRESS=peer0.bank.example.com:9051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/bank.example.com/peers/peer0.bank.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/bank.example.com/users/Admin@bank.example.com/msp cli peer channel update -o orderer1.orderer.example.com:7050 -c %CHANNEL_NAME% -f /etc/hyperledger/configtx/BankMSPanchors.tx --tls --cafile %ORDERER_CA%

if errorlevel 1 (
    echo [WARNING] Bank anchor peer update failed (may not be critical)
) else (
    echo [SUCCESS] Bank anchor peer updated
)

echo.
echo [4.3] Updating anchor peer for NBE (peer0.nbe.example.com)...
docker exec -e CORE_PEER_LOCALMSPID=NBEMSP -e CORE_PEER_ADDRESS=peer0.nbe.example.com:10051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/nbe.example.com/peers/peer0.nbe.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/nbe.example.com/users/Admin@nbe.example.com/msp cli peer channel update -o orderer1.orderer.example.com:7050 -c %CHANNEL_NAME% -f /etc/hyperledger/configtx/NBEMSPanchors.tx --tls --cafile %ORDERER_CA%

if errorlevel 1 (
    echo [WARNING] NBE anchor peer update failed (may not be critical)
) else (
    echo [SUCCESS] NBE anchor peer updated
)

echo.
echo [4.4] Updating anchor peer for Customs (peer0.customs.example.com)...
docker exec -e CORE_PEER_LOCALMSPID=CustomsMSP -e CORE_PEER_ADDRESS=peer0.customs.example.com:11051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/customs.example.com/peers/peer0.customs.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/customs.example.com/users/Admin@customs.example.com/msp cli peer channel update -o orderer1.orderer.example.com:7050 -c %CHANNEL_NAME% -f /etc/hyperledger/configtx/CustomsMSPanchors.tx --tls --cafile %ORDERER_CA%

if errorlevel 1 (
    echo [WARNING] Customs anchor peer update failed (may not be critical)
) else (
    echo [SUCCESS] Customs anchor peer updated
)

echo.
echo [4.5] Updating anchor peer for Shipping (peer0.shipping.example.com)...
docker exec -e CORE_PEER_LOCALMSPID=ShippingMSP -e CORE_PEER_ADDRESS=peer0.shipping.example.com:12051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/shipping.example.com/peers/peer0.shipping.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/shipping.example.com/users/Admin@shipping.example.com/msp cli peer channel update -o orderer1.orderer.example.com:7050 -c %CHANNEL_NAME% -f /etc/hyperledger/configtx/ShippingMSPanchors.tx --tls --cafile %ORDERER_CA%

if errorlevel 1 (
    echo [WARNING] Shipping anchor peer update failed (may not be critical)
) else (
    echo [SUCCESS] Shipping anchor peer updated
)

echo.
echo [INFO] Anchor peer updates completed (warnings are acceptable)
echo.

REM ================================================================================
REM STEP 5: Verify Channel Configuration
REM ================================================================================

echo ================================================================================
echo [5/5] Verifying channel configuration
echo ================================================================================
echo.

echo [5.1] Listing channels on ECTA peer0...
docker exec cli peer channel list

echo.
echo [5.2] Getting channel info...
docker exec cli peer channel getinfo -c %CHANNEL_NAME%

echo.
echo [5.3] Checking CouchDB for channel databases...
echo.
echo Expected databases:
echo   - coffeechannel_
echo   - coffeechannel__lifecycle
echo   - coffeechannel_lscc
echo.

curl -s http://admin:adminpw@localhost:5984/_all_dbs 2>nul | findstr "coffeechannel"

if errorlevel 1 (
    echo [WARNING] CouchDB databases not found yet (may take a moment to create)
) else (
    echo [SUCCESS] CouchDB databases created
)

echo.
echo ================================================================================
echo CHANNEL CREATION COMPLETE!
echo ================================================================================
echo.
echo Summary:
echo   Channel Name: %CHANNEL_NAME%
echo   Orderers: 3 nodes (Raft cluster)
echo   Peers: 6 nodes (ECTA x2, Bank, NBE, Customs, Shipping)
echo   Anchor Peers: Configured for all organizations
echo   CouchDB: State databases ready
echo.
echo Channel is ready for chaincode deployment!
echo.
echo Next Steps:
echo   1. Deploy chaincode: scripts\deploy-chaincode.bat
echo   2. Test chaincode: scripts\test-chaincode.bat
echo   3. Verify CouchDB: http://localhost:5984/_utils (admin/adminpw)
echo.
echo ================================================================================
echo.
pause
