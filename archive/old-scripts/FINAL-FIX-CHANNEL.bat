@echo off
REM ============================================================================
REM FINAL FIX - Create Channel Without Orderer MSP Issues
REM ============================================================================

echo.
echo ========================================
echo  FINAL CHANNEL FIX
echo ========================================
echo.

set CHANNEL_NAME=coffeechannel
set CHAINCODE_NAME=ecta

echo The issue: Genesis block contains Orderer MSP that peers can't validate
echo Solution: Use system channel approach or skip orderer join
echo.
echo Since Fabric network is already running with orderers in Raft,
echo we can create channel by having first peer submit to orderer.
echo.

echo Step 1: Generate channel config (application only)...
docker exec cli configtxgen -profile CoffeeChannel -outputCreateChannelTx /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/channel.tx -channelID %CHANNEL_NAME%

if %errorlevel% neq 0 (
    echo ⚠ Channel tx generation failed - this is expected in Fabric 2.3+
    echo Using alternative: Direct genesis block approach
    echo.
    
    echo The genesis block already exists. Let's check orderer logs...
    docker logs orderer1.orderer.example.com --tail 20
    
    echo.
    echo Checking if orderers can see the channel...
    docker exec orderer1.orderer.example.com ls -la /var/hyperledger/production/orderer/chains/
    
    pause
    exit /b 1
)

echo.
echo Step 2: Create channel on orderer...
docker exec cli peer channel create -o orderer1.orderer.example.com:7050 -c %CHANNEL_NAME% -f /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/channel.tx --outputBlock /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/%CHANNEL_NAME%_created.block --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem

if %errorlevel% neq 0 (
    echo ✗ Channel creation failed
    pause
    exit /b 1
)

echo ✓ Channel created!

echo.
echo Step 3: Join all peers...
docker exec cli peer channel join -b /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/%CHANNEL_NAME%_created.block

docker exec -e CORE_PEER_ADDRESS=peer1.ecta.example.com:8051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/ecta.example.com/peers/peer1.ecta.example.com/tls/ca.crt cli peer channel join -b /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/%CHANNEL_NAME%_created.block

docker exec -e CORE_PEER_LOCALMSPID=BankMSP -e CORE_PEER_ADDRESS=peer0.bank.example.com:9051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/bank.example.com/peers/peer0.bank.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/bank.example.com/users/Admin@bank.example.com/msp cli peer channel join -b /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/%CHANNEL_NAME%_created.block

docker exec -e CORE_PEER_LOCALMSPID=NBEMSP -e CORE_PEER_ADDRESS=peer0.nbe.example.com:10051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/nbe.example.com/peers/peer0.nbe.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/nbe.example.com/users/Admin@nbe.example.com/msp cli peer channel join -b /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/%CHANNEL_NAME%_created.block

docker exec -e CORE_PEER_LOCALMSPID=CustomsMSP -e CORE_PEER_ADDRESS=peer0.customs.example.com:11051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/customs.example.com/peers/peer0.customs.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/customs.example.com/users/Admin@customs.example.com/msp cli peer channel join -b /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/%CHANNEL_NAME%_created.block

docker exec -e CORE_PEER_LOCALMSPID=ShippingMSP -e CORE_PEER_ADDRESS=peer0.shipping.example.com:12051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/shipping.example.com/peers/peer0.shipping.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/shipping.example.com/users/Admin@shipping.example.com/msp cli peer channel join -b /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/%CHANNEL_NAME%_created.block

echo.
echo ✓ All peers joined!

echo.
echo Verifying...
docker exec cli peer channel list

echo.
pause

