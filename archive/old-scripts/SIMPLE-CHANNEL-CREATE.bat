@echo off
REM ============================================================================
REM SIMPLE CHANNEL CREATION - Using Peer Join Directly
REM ============================================================================

echo.
echo ========================================
echo  SIMPLE CHANNEL CREATION
echo ========================================
echo.

set CHANNEL_NAME=coffeechannel
set CHAINCODE_NAME=ecta
set CHAINCODE_VERSION=1.0
set CHAINCODE_SEQUENCE=1

REM The genesis block is already generated at:
REM /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/coffeechannel.block

echo Step 1: Join peer0.ecta to channel (this creates the channel)...
docker exec cli peer channel join -b /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/coffeechannel.block

if %errorlevel% equ 0 (
    echo ✓ peer0.ecta joined - channel created!
) else (
    echo ⚠ peer0.ecta join failed - checking if already joined...
    docker exec cli peer channel list
)

echo.
echo Step 2: Join peer1.ecta...
docker exec -e CORE_PEER_ADDRESS=peer1.ecta.example.com:8051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/ecta.example.com/peers/peer1.ecta.example.com/tls/ca.crt cli peer channel join -b /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/coffeechannel.block

echo.
echo Step 3: Join peer0.bank...
docker exec -e CORE_PEER_LOCALMSPID=BankMSP -e CORE_PEER_ADDRESS=peer0.bank.example.com:9051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/bank.example.com/peers/peer0.bank.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/bank.example.com/users/Admin@bank.example.com/msp cli peer channel join -b /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/coffeechannel.block

echo.
echo Step 4: Join peer0.nbe...
docker exec -e CORE_PEER_LOCALMSPID=NBEMSP -e CORE_PEER_ADDRESS=peer0.nbe.example.com:10051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/nbe.example.com/peers/peer0.nbe.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/nbe.example.com/users/Admin@nbe.example.com/msp cli peer channel join -b /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/coffeechannel.block

echo.
echo Step 5: Join peer0.customs...
docker exec -e CORE_PEER_LOCALMSPID=CustomsMSP -e CORE_PEER_ADDRESS=peer0.customs.example.com:11051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/customs.example.com/peers/peer0.customs.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/customs.example.com/users/Admin@customs.example.com/msp cli peer channel join -b /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/coffeechannel.block

echo.
echo Step 6: Join peer0.shipping...
docker exec -e CORE_PEER_LOCALMSPID=ShippingMSP -e CORE_PEER_ADDRESS=peer0.shipping.example.com:12051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/shipping.example.com/peers/peer0.shipping.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/shipping.example.com/users/Admin@shipping.example.com/msp cli peer channel join -b /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/coffeechannel.block

echo.
echo ========================================
echo  VERIFY CHANNEL MEMBERSHIP
echo ========================================
echo.
docker exec cli peer channel list

echo.
echo ========================================
echo  APPROVE CHAINCODE
echo ========================================
echo.

set PACKAGE_ID=ecta_1.0:60327d797bc9a87828f63c2218022559a79c63c0925e8dddff8c1e034f2f205e

echo [1/5] Approving for ECTA...
docker exec cli peer lifecycle chaincode approveformyorg -o orderer1.orderer.example.com:7050 --ordererTLSHostnameOverride orderer1.orderer.example.com --channelID %CHANNEL_NAME% --name %CHAINCODE_NAME% --version %CHAINCODE_VERSION% --package-id %PACKAGE_ID% --sequence %CHAINCODE_SEQUENCE% --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem

echo [2/5] Approving for Bank...
docker exec -e CORE_PEER_LOCALMSPID=BankMSP -e CORE_PEER_ADDRESS=peer0.bank.example.com:9051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/bank.example.com/peers/peer0.bank.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/bank.example.com/users/Admin@bank.example.com/msp cli peer lifecycle chaincode approveformyorg -o orderer1.orderer.example.com:7050 --ordererTLSHostnameOverride orderer1.orderer.example.com --channelID %CHANNEL_NAME% --name %CHAINCODE_NAME% --version %CHAINCODE_VERSION% --package-id %PACKAGE_ID% --sequence %CHAINCODE_SEQUENCE% --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem

echo [3/5] Approving for NBE...
docker exec -e CORE_PEER_LOCALMSPID=NBEMSP -e CORE_PEER_ADDRESS=peer0.nbe.example.com:10051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/nbe.example.com/peers/peer0.nbe.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/nbe.example.com/users/Admin@nbe.example.com/msp cli peer lifecycle chaincode approveformyorg -o orderer1.orderer.example.com:7050 --ordererTLSHostnameOverride orderer1.orderer.example.com --channelID %CHANNEL_NAME% --name %CHAINCODE_NAME% --version %CHAINCODE_VERSION% --package-id %PACKAGE_ID% --sequence %CHAINCODE_SEQUENCE% --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem

echo [4/5] Approving for Customs...
docker exec -e CORE_PEER_LOCALMSPID=CustomsMSP -e CORE_PEER_ADDRESS=peer0.customs.example.com:11051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/customs.example.com/peers/peer0.customs.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/customs.example.com/users/Admin@customs.example.com/msp cli peer lifecycle chaincode approveformyorg -o orderer1.orderer.example.com:7050 --ordererTLSHostnameOverride orderer1.orderer.example.com --channelID %CHANNEL_NAME% --name %CHAINCODE_NAME% --version %CHAINCODE_VERSION% --package-id %PACKAGE_ID% --sequence %CHAINCODE_SEQUENCE% --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem

echo [5/5] Approving for Shipping...
docker exec -e CORE_PEER_LOCALMSPID=ShippingMSP -e CORE_PEER_ADDRESS=peer0.shipping.example.com:12051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/shipping.example.com/peers/peer0.shipping.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/shipping.example.com/users/Admin@shipping.example.com/msp cli peer lifecycle chaincode approveformyorg -o orderer1.orderer.example.com:7050 --ordererTLSHostnameOverride orderer1.orderer.example.com --channelID %CHANNEL_NAME% --name %CHAINCODE_NAME% --version %CHAINCODE_VERSION% --package-id %PACKAGE_ID% --sequence %CHAINCODE_SEQUENCE% --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem

echo.
echo ========================================
echo  COMMIT CHAINCODE
echo ========================================
echo.

docker exec cli peer lifecycle chaincode commit -o orderer1.orderer.example.com:7050 --ordererTLSHostnameOverride orderer1.orderer.example.com --channelID %CHANNEL_NAME% --name %CHAINCODE_NAME% --version %CHAINCODE_VERSION% --sequence %CHAINCODE_SEQUENCE% --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem --peerAddresses peer0.ecta.example.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt --peerAddresses peer0.bank.example.com:9051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/bank.example.com/peers/peer0.bank.example.com/tls/ca.crt

echo.
echo ========================================
echo  VERIFY DEPLOYMENT
echo ========================================
echo.

docker exec cli peer lifecycle chaincode querycommitted --channelID %CHANNEL_NAME% --name %CHAINCODE_NAME%

echo.
echo ========================================
echo  SEED USERS
echo ========================================
echo.

docker exec coffee-gateway node src/scripts/seedUsers.js

echo.
echo ========================================
echo  COMPLETE!
echo ========================================
echo.
pause

