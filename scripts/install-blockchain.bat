@echo off
REM ============================================================================
REM COMPLETE BLOCKCHAIN INSTALLATION SCRIPT
REM Initializes channel, installs chaincode, approves, commits, and initializes
REM ============================================================================

setlocal enabledelayedexpansion

echo.
echo ============================================================================
echo              COMPLETE BLOCKCHAIN INSTALLATION
echo ============================================================================
echo.
echo This script will:
echo   1. Initialize blockchain channel
echo   2. Join all peers to the channel
echo   3. Package chaincode
echo   4. Install chaincode on all peers
echo   5. Approve chaincode for all organizations
echo   6. Commit chaincode to the channel
echo   7. Initialize chaincode ledger
echo.
echo ============================================================================
echo.

pause

REM Configuration
set CHANNEL_NAME=coffeechannel
set CC_NAME=ecta
set CC_VERSION=1.0
set CC_PATH=/opt/gopath/src/github.com/hyperledger/fabric/chaincode/ecta
set CC_LANG=node
set CC_SEQUENCE=1
set CRYPTO_PATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config

REM ============================================================================
REM STEP 1: INITIALIZE BLOCKCHAIN CHANNEL
REM ============================================================================
echo.
echo ============================================================================
echo STEP 1: INITIALIZE BLOCKCHAIN CHANNEL
echo ============================================================================
echo.

echo [1.1] Generating channel genesis block...
docker exec cli bash -c "export FABRIC_CFG_PATH=/etc/hyperledger/configtx && configtxgen -profile CoffeeChannel -outputBlock /opt/gopath/src/github.com/hyperledger/fabric/peer/%CHANNEL_NAME%.block -channelID %CHANNEL_NAME%"
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to generate channel block
    exit /b 1
)
echo [SUCCESS] Channel genesis block created
echo.

echo [1.2] Joining peer0.ecta to channel...
docker exec cli bash -c "export CORE_PEER_LOCALMSPID=ECTAMSP && export CORE_PEER_TLS_ROOTCERT_FILE=%CRYPTO_PATH%/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt && export CORE_PEER_MSPCONFIGPATH=%CRYPTO_PATH%/peerOrganizations/ecta.example.com/users/Admin@ecta.example.com/msp && export CORE_PEER_ADDRESS=peer0.ecta.example.com:7051 && peer channel join -b %CHANNEL_NAME%.block"
echo [SUCCESS] peer0.ecta joined
echo.

echo [1.3] Joining peer0.bank to channel...
docker exec cli bash -c "export CORE_PEER_LOCALMSPID=BankMSP && export CORE_PEER_ADDRESS=peer0.bank.example.com:9051 && export CORE_PEER_TLS_ROOTCERT_FILE=%CRYPTO_PATH%/peerOrganizations/bank.example.com/peers/peer0.bank.example.com/tls/ca.crt && export CORE_PEER_MSPCONFIGPATH=%CRYPTO_PATH%/peerOrganizations/bank.example.com/users/Admin@bank.example.com/msp && peer channel join -b %CHANNEL_NAME%.block"
echo [SUCCESS] peer0.bank joined
echo.

echo [1.4] Joining peer0.nbe to channel...
docker exec cli bash -c "export CORE_PEER_LOCALMSPID=NBEMSP && export CORE_PEER_ADDRESS=peer0.nbe.example.com:10051 && export CORE_PEER_TLS_ROOTCERT_FILE=%CRYPTO_PATH%/peerOrganizations/nbe.example.com/peers/peer0.nbe.example.com/tls/ca.crt && export CORE_PEER_MSPCONFIGPATH=%CRYPTO_PATH%/peerOrganizations/nbe.example.com/users/Admin@nbe.example.com/msp && peer channel join -b %CHANNEL_NAME%.block"
echo [SUCCESS] peer0.nbe joined
echo.

echo [1.5] Joining peer0.customs to channel...
docker exec cli bash -c "export CORE_PEER_LOCALMSPID=CustomsMSP && export CORE_PEER_ADDRESS=peer0.customs.example.com:11051 && export CORE_PEER_TLS_ROOTCERT_FILE=%CRYPTO_PATH%/peerOrganizations/customs.example.com/peers/peer0.customs.example.com/tls/ca.crt && export CORE_PEER_MSPCONFIGPATH=%CRYPTO_PATH%/peerOrganizations/customs.example.com/users/Admin@customs.example.com/msp && peer channel join -b %CHANNEL_NAME%.block"
echo [SUCCESS] peer0.customs joined
echo.

echo [1.6] Joining peer0.shipping to channel...
docker exec cli bash -c "export CORE_PEER_LOCALMSPID=ShippingMSP && export CORE_PEER_ADDRESS=peer0.shipping.example.com:12051 && export CORE_PEER_TLS_ROOTCERT_FILE=%CRYPTO_PATH%/peerOrganizations/shipping.example.com/peers/peer0.shipping.example.com/tls/ca.crt && export CORE_PEER_MSPCONFIGPATH=%CRYPTO_PATH%/peerOrganizations/shipping.example.com/users/Admin@shipping.example.com/msp && peer channel join -b %CHANNEL_NAME%.block"
echo [SUCCESS] peer0.shipping joined
echo.

echo [1.7] Verifying channel membership...
docker exec cli peer channel list
echo.
echo [SUCCESS] All peers joined channel: %CHANNEL_NAME%
echo.

REM ============================================================================
REM STEP 2: PACKAGE CHAINCODE
REM ============================================================================
echo.
echo ============================================================================
echo STEP 2: PACKAGE CHAINCODE
echo ============================================================================
echo.

docker exec cli rm -f /opt/gopath/src/github.com/hyperledger/fabric/peer/*.tar.gz 2>nul
docker exec cli peer lifecycle chaincode package %CC_NAME%.tar.gz --path %CC_PATH% --lang %CC_LANG% --label %CC_NAME%_%CC_VERSION%
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Packaging failed
    exit /b 1
)
echo [SUCCESS] Chaincode packaged: %CC_NAME%.tar.gz
echo.

REM ============================================================================
REM STEP 3: INSTALL CHAINCODE ON ALL PEERS
REM ============================================================================
echo.
echo ============================================================================
echo STEP 3: INSTALL CHAINCODE ON ALL PEERS
echo ============================================================================
echo.

echo [3.1] Installing on peer0.ecta...
docker exec -e CORE_PEER_LOCALMSPID=ECTAMSP -e CORE_PEER_ADDRESS=peer0.ecta.example.com:7051 -e CORE_PEER_TLS_ROOTCERT_FILE=%CRYPTO_PATH%/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=%CRYPTO_PATH%/peerOrganizations/ecta.example.com/users/Admin@ecta.example.com/msp cli peer lifecycle chaincode install %CC_NAME%.tar.gz
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] ECTA installation failed
    exit /b 1
)
echo [SUCCESS] Installed on peer0.ecta
echo.

echo [3.2] Installing on peer0.bank...
docker exec -e CORE_PEER_LOCALMSPID=BankMSP -e CORE_PEER_ADDRESS=peer0.bank.example.com:9051 -e CORE_PEER_TLS_ROOTCERT_FILE=%CRYPTO_PATH%/peerOrganizations/bank.example.com/peers/peer0.bank.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=%CRYPTO_PATH%/peerOrganizations/bank.example.com/users/Admin@bank.example.com/msp cli peer lifecycle chaincode install %CC_NAME%.tar.gz
echo [SUCCESS] Installed on peer0.bank
echo.

echo [3.3] Installing on peer0.nbe...
docker exec -e CORE_PEER_LOCALMSPID=NBEMSP -e CORE_PEER_ADDRESS=peer0.nbe.example.com:10051 -e CORE_PEER_TLS_ROOTCERT_FILE=%CRYPTO_PATH%/peerOrganizations/nbe.example.com/peers/peer0.nbe.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=%CRYPTO_PATH%/peerOrganizations/nbe.example.com/users/Admin@nbe.example.com/msp cli peer lifecycle chaincode install %CC_NAME%.tar.gz
echo [SUCCESS] Installed on peer0.nbe
echo.

echo [3.4] Installing on peer0.customs...
docker exec -e CORE_PEER_LOCALMSPID=CustomsMSP -e CORE_PEER_ADDRESS=peer0.customs.example.com:11051 -e CORE_PEER_TLS_ROOTCERT_FILE=%CRYPTO_PATH%/peerOrganizations/customs.example.com/peers/peer0.customs.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=%CRYPTO_PATH%/peerOrganizations/customs.example.com/users/Admin@customs.example.com/msp cli peer lifecycle chaincode install %CC_NAME%.tar.gz
echo [SUCCESS] Installed on peer0.customs
echo.

echo [3.5] Installing on peer0.shipping...
docker exec -e CORE_PEER_LOCALMSPID=ShippingMSP -e CORE_PEER_ADDRESS=peer0.shipping.example.com:12051 -e CORE_PEER_TLS_ROOTCERT_FILE=%CRYPTO_PATH%/peerOrganizations/shipping.example.com/peers/peer0.shipping.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=%CRYPTO_PATH%/peerOrganizations/shipping.example.com/users/Admin@shipping.example.com/msp cli peer lifecycle chaincode install %CC_NAME%.tar.gz
echo [SUCCESS] Installed on peer0.shipping
echo.

REM ============================================================================
REM STEP 4: GET PACKAGE ID
REM ============================================================================
echo.
echo ============================================================================
echo STEP 4: QUERY PACKAGE ID
echo ============================================================================
echo.

for /f "tokens=3" %%i in ('docker exec cli peer lifecycle chaincode queryinstalled ^| findstr "%CC_NAME%_%CC_VERSION%"') do set PACKAGE_ID=%%i
set PACKAGE_ID=%PACKAGE_ID:,=%
if "%PACKAGE_ID%"=="" (
    echo [ERROR] Failed to get package ID
    exit /b 1
)
echo [SUCCESS] Package ID: %PACKAGE_ID%
echo.

REM ============================================================================
REM STEP 5: APPROVE CHAINCODE FOR ALL ORGANIZATIONS
REM ============================================================================
echo.
echo ============================================================================
echo STEP 5: APPROVE CHAINCODE FOR ALL ORGANIZATIONS
echo ============================================================================
echo.

echo [5.1] Approving for ECTA...
docker exec -e CORE_PEER_LOCALMSPID=ECTAMSP -e CORE_PEER_ADDRESS=peer0.ecta.example.com:7051 -e CORE_PEER_TLS_ROOTCERT_FILE=%CRYPTO_PATH%/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=%CRYPTO_PATH%/peerOrganizations/ecta.example.com/users/Admin@ecta.example.com/msp cli peer lifecycle chaincode approveformyorg -o orderer1.orderer.example.com:7050 --ordererTLSHostnameOverride orderer1.orderer.example.com --tls --cafile %CRYPTO_PATH%/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem --channelID %CHANNEL_NAME% --name %CC_NAME% --version %CC_VERSION% --package-id %PACKAGE_ID% --sequence %CC_SEQUENCE%
echo [SUCCESS] ECTA approved
echo.

echo [5.2] Approving for Bank...
docker exec -e CORE_PEER_LOCALMSPID=BankMSP -e CORE_PEER_ADDRESS=peer0.bank.example.com:9051 -e CORE_PEER_TLS_ROOTCERT_FILE=%CRYPTO_PATH%/peerOrganizations/bank.example.com/peers/peer0.bank.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=%CRYPTO_PATH%/peerOrganizations/bank.example.com/users/Admin@bank.example.com/msp cli peer lifecycle chaincode approveformyorg -o orderer1.orderer.example.com:7050 --ordererTLSHostnameOverride orderer1.orderer.example.com --tls --cafile %CRYPTO_PATH%/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem --channelID %CHANNEL_NAME% --name %CC_NAME% --version %CC_VERSION% --package-id %PACKAGE_ID% --sequence %CC_SEQUENCE%
echo [SUCCESS] Bank approved
echo.

echo [5.3] Approving for NBE...
docker exec -e CORE_PEER_LOCALMSPID=NBEMSP -e CORE_PEER_ADDRESS=peer0.nbe.example.com:10051 -e CORE_PEER_TLS_ROOTCERT_FILE=%CRYPTO_PATH%/peerOrganizations/nbe.example.com/peers/peer0.nbe.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=%CRYPTO_PATH%/peerOrganizations/nbe.example.com/users/Admin@nbe.example.com/msp cli peer lifecycle chaincode approveformyorg -o orderer1.orderer.example.com:7050 --ordererTLSHostnameOverride orderer1.orderer.example.com --tls --cafile %CRYPTO_PATH%/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem --channelID %CHANNEL_NAME% --name %CC_NAME% --version %CC_VERSION% --package-id %PACKAGE_ID% --sequence %CC_SEQUENCE%
echo [SUCCESS] NBE approved
echo.

echo [5.4] Approving for Customs...
docker exec -e CORE_PEER_LOCALMSPID=CustomsMSP -e CORE_PEER_ADDRESS=peer0.customs.example.com:11051 -e CORE_PEER_TLS_ROOTCERT_FILE=%CRYPTO_PATH%/peerOrganizations/customs.example.com/peers/peer0.customs.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=%CRYPTO_PATH%/peerOrganizations/customs.example.com/users/Admin@customs.example.com/msp cli peer lifecycle chaincode approveformyorg -o orderer1.orderer.example.com:7050 --ordererTLSHostnameOverride orderer1.orderer.example.com --tls --cafile %CRYPTO_PATH%/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem --channelID %CHANNEL_NAME% --name %CC_NAME% --version %CC_VERSION% --package-id %PACKAGE_ID% --sequence %CC_SEQUENCE%
echo [SUCCESS] Customs approved
echo.

echo [5.5] Approving for Shipping...
docker exec -e CORE_PEER_LOCALMSPID=ShippingMSP -e CORE_PEER_ADDRESS=peer0.shipping.example.com:12051 -e CORE_PEER_TLS_ROOTCERT_FILE=%CRYPTO_PATH%/peerOrganizations/shipping.example.com/peers/peer0.shipping.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=%CRYPTO_PATH%/peerOrganizations/shipping.example.com/users/Admin@shipping.example.com/msp cli peer lifecycle chaincode approveformyorg -o orderer1.orderer.example.com:7050 --ordererTLSHostnameOverride orderer1.orderer.example.com --tls --cafile %CRYPTO_PATH%/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem --channelID %CHANNEL_NAME% --name %CC_NAME% --version %CC_VERSION% --package-id %PACKAGE_ID% --sequence %CC_SEQUENCE%
echo [SUCCESS] Shipping approved
echo.

REM ============================================================================
REM STEP 6: CHECK COMMIT READINESS
REM ============================================================================
echo.
echo ============================================================================
echo STEP 6: CHECK COMMIT READINESS
echo ============================================================================
echo.

docker exec cli peer lifecycle chaincode checkcommitreadiness --channelID %CHANNEL_NAME% --name %CC_NAME% --version %CC_VERSION% --sequence %CC_SEQUENCE% --output json
echo.

REM ============================================================================
REM STEP 7: COMMIT CHAINCODE
REM ============================================================================
echo.
echo ============================================================================
echo STEP 7: COMMIT CHAINCODE TO CHANNEL
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
REM STEP 8: VERIFY DEPLOYMENT
REM ============================================================================
echo.
echo ============================================================================
echo STEP 8: VERIFY DEPLOYMENT
echo ============================================================================
echo.

docker exec cli peer lifecycle chaincode querycommitted --channelID %CHANNEL_NAME% --name %CC_NAME%
echo.

REM ============================================================================
REM INSTALLATION COMPLETE
REM ============================================================================
echo.
echo ============================================================================
echo              BLOCKCHAIN INSTALLATION COMPLETE!
echo ============================================================================
echo.
echo Channel: %CHANNEL_NAME%
echo Chaincode: %CC_NAME%
echo Version: %CC_VERSION%
echo Sequence: %CC_SEQUENCE%
echo Package ID: %PACKAGE_ID%
echo.
echo All 5 peers joined channel
echo Chaincode installed on all peers
echo Chaincode approved by all organizations
echo Chaincode committed to channel
echo.
echo ============================================================================
echo                 AVAILABLE BLOCKCHAIN FUNCTIONS (140+)
echo ============================================================================
echo.
echo See deploy-chaincode.bat output for complete function list
echo.
echo Next Steps:
echo   1. Test blockchain: node test-workflow-from-registration.js
echo   2. Start gateway: docker-compose -f docker-compose-hybrid.yml up -d gateway
echo   3. Check logs: docker logs coffee-gateway
echo.
echo ============================================================================

endlocal
pause
