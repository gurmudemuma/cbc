@echo off
REM ============================================================================
REM COMPLETE BLOCKCHAIN SETUP - Approve and Commit Chaincode
REM ============================================================================

setlocal enabledelayedexpansion

echo.
echo ============================================================================
echo              COMPLETE BLOCKCHAIN SETUP
echo ============================================================================
echo.

set CHANNEL_NAME=coffeechannel
set CC_NAME=ecta
set CC_VERSION=1.0
set CC_SEQUENCE=1
set PACKAGE_ID=ecta_1.0:db0f8bb03d69513a9ceaa3681aa9b43aeab9c5429a24413bc5bb626e379e0c97
set CRYPTO_PATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config

echo Package ID: %PACKAGE_ID%
echo Channel: %CHANNEL_NAME%
echo Chaincode: %CC_NAME% v%CC_VERSION%
echo.

REM ============================================================================
REM APPROVE CHAINCODE FOR ALL ORGANIZATIONS
REM ============================================================================
echo.
echo ============================================================================
echo APPROVING CHAINCODE FOR ALL ORGANIZATIONS
echo ============================================================================
echo.

echo [1/5] Approving for ECTA...
docker exec -e CORE_PEER_LOCALMSPID=ECTAMSP -e CORE_PEER_ADDRESS=peer0.ecta.example.com:7051 -e CORE_PEER_TLS_ROOTCERT_FILE=%CRYPTO_PATH%/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=%CRYPTO_PATH%/peerOrganizations/ecta.example.com/users/Admin@ecta.example.com/msp cli peer lifecycle chaincode approveformyorg -o orderer1.orderer.example.com:7050 --ordererTLSHostnameOverride orderer1.orderer.example.com --tls --cafile %CRYPTO_PATH%/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem --channelID %CHANNEL_NAME% --name %CC_NAME% --version %CC_VERSION% --package-id %PACKAGE_ID% --sequence %CC_SEQUENCE%
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] ECTA approval failed
    exit /b 1
)
echo [SUCCESS] ECTA approved
echo.

echo [2/5] Approving for Bank...
docker exec -e CORE_PEER_LOCALMSPID=BankMSP -e CORE_PEER_ADDRESS=peer0.bank.example.com:9051 -e CORE_PEER_TLS_ROOTCERT_FILE=%CRYPTO_PATH%/peerOrganizations/bank.example.com/peers/peer0.bank.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=%CRYPTO_PATH%/peerOrganizations/bank.example.com/users/Admin@bank.example.com/msp cli peer lifecycle chaincode approveformyorg -o orderer1.orderer.example.com:7050 --ordererTLSHostnameOverride orderer1.orderer.example.com --tls --cafile %CRYPTO_PATH%/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem --channelID %CHANNEL_NAME% --name %CC_NAME% --version %CC_VERSION% --package-id %PACKAGE_ID% --sequence %CC_SEQUENCE%
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Bank approval failed
    exit /b 1
)
echo [SUCCESS] Bank approved
echo.

echo [3/5] Approving for NBE...
docker exec -e CORE_PEER_LOCALMSPID=NBEMSP -e CORE_PEER_ADDRESS=peer0.nbe.example.com:10051 -e CORE_PEER_TLS_ROOTCERT_FILE=%CRYPTO_PATH%/peerOrganizations/nbe.example.com/peers/peer0.nbe.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=%CRYPTO_PATH%/peerOrganizations/nbe.example.com/users/Admin@nbe.example.com/msp cli peer lifecycle chaincode approveformyorg -o orderer1.orderer.example.com:7050 --ordererTLSHostnameOverride orderer1.orderer.example.com --tls --cafile %CRYPTO_PATH%/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem --channelID %CHANNEL_NAME% --name %CC_NAME% --version %CC_VERSION% --package-id %PACKAGE_ID% --sequence %CC_SEQUENCE%
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] NBE approval failed
    exit /b 1
)
echo [SUCCESS] NBE approved
echo.

echo [4/5] Approving for Customs...
docker exec -e CORE_PEER_LOCALMSPID=CustomsMSP -e CORE_PEER_ADDRESS=peer0.customs.example.com:11051 -e CORE_PEER_TLS_ROOTCERT_FILE=%CRYPTO_PATH%/peerOrganizations/customs.example.com/peers/peer0.customs.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=%CRYPTO_PATH%/peerOrganizations/customs.example.com/users/Admin@customs.example.com/msp cli peer lifecycle chaincode approveformyorg -o orderer1.orderer.example.com:7050 --ordererTLSHostnameOverride orderer1.orderer.example.com --tls --cafile %CRYPTO_PATH%/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem --channelID %CHANNEL_NAME% --name %CC_NAME% --version %CC_VERSION% --package-id %PACKAGE_ID% --sequence %CC_SEQUENCE%
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Customs approval failed
    exit /b 1
)
echo [SUCCESS] Customs approved
echo.

echo [5/5] Approving for Shipping...
docker exec -e CORE_PEER_LOCALMSPID=ShippingMSP -e CORE_PEER_ADDRESS=peer0.shipping.example.com:12051 -e CORE_PEER_TLS_ROOTCERT_FILE=%CRYPTO_PATH%/peerOrganizations/shipping.example.com/peers/peer0.shipping.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=%CRYPTO_PATH%/peerOrganizations/shipping.example.com/users/Admin@shipping.example.com/msp cli peer lifecycle chaincode approveformyorg -o orderer1.orderer.example.com:7050 --ordererTLSHostnameOverride orderer1.orderer.example.com --tls --cafile %CRYPTO_PATH%/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem --channelID %CHANNEL_NAME% --name %CC_NAME% --version %CC_VERSION% --package-id %PACKAGE_ID% --sequence %CC_SEQUENCE%
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Shipping approval failed
    exit /b 1
)
echo [SUCCESS] Shipping approved
echo.

REM ============================================================================
REM CHECK COMMIT READINESS
REM ============================================================================
echo.
echo ============================================================================
echo CHECKING COMMIT READINESS
echo ============================================================================
echo.

docker exec cli peer lifecycle chaincode checkcommitreadiness --channelID %CHANNEL_NAME% --name %CC_NAME% --version %CC_VERSION% --sequence %CC_SEQUENCE% --output json
echo.

REM ============================================================================
REM COMMIT CHAINCODE
REM ============================================================================
echo.
echo ============================================================================
echo COMMITTING CHAINCODE TO CHANNEL
echo ============================================================================
echo.

docker exec cli peer lifecycle chaincode commit -o orderer1.orderer.example.com:7050 --ordererTLSHostnameOverride orderer1.orderer.example.com --tls --cafile %CRYPTO_PATH%/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem --channelID %CHANNEL_NAME% --name %CC_NAME% --version %CC_VERSION% --sequence %CC_SEQUENCE% --peerAddresses peer0.ecta.example.com:7051 --tlsRootCertFiles %CRYPTO_PATH%/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt --peerAddresses peer0.bank.example.com:9051 --tlsRootCertFiles %CRYPTO_PATH%/peerOrganizations/bank.example.com/peers/peer0.bank.example.com/tls/ca.crt --peerAddresses peer0.nbe.example.com:10051 --tlsRootCertFiles %CRYPTO_PATH%/peerOrganizations/nbe.example.com/peers/peer0.nbe.example.com/tls/ca.crt

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Commit failed
    exit /b 1
)
echo [SUCCESS] Chaincode committed to channel
echo.

REM ============================================================================
REM VERIFY DEPLOYMENT
REM ============================================================================
echo.
echo ============================================================================
echo VERIFYING DEPLOYMENT
echo ============================================================================
echo.

docker exec cli peer lifecycle chaincode querycommitted --channelID %CHANNEL_NAME% --name %CC_NAME%
echo.

echo.
echo ============================================================================
echo              BLOCKCHAIN SETUP COMPLETE!
echo ============================================================================
echo.
echo Channel: %CHANNEL_NAME%
echo Chaincode: %CC_NAME% v%CC_VERSION%
echo Status: COMMITTED
echo.
echo Next Steps:
echo   1. Start hybrid services: docker-compose -f docker-compose-hybrid.yml up -d
echo   2. Check gateway logs: docker logs coffee-gateway
echo   3. Test blockchain: Access frontend at http://localhost:5173
echo.
echo ============================================================================

endlocal
pause
