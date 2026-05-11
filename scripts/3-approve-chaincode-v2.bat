@echo off
REM ============================================================================
REM STEP 3: APPROVE CHAINCODE FOR ALL ORGANIZATIONS (Fabric 2.3+ Compatible)
REM Uses direct peer approval without orderer transactions
REM ============================================================================

setlocal enabledelayedexpansion

echo.
echo ============================================================================
echo         STEP 3: APPROVE CHAINCODE FOR ALL ORGANIZATIONS
echo ============================================================================
echo.

REM Configuration
set CHANNEL_NAME=coffeechannel
set CC_NAME=ecta
set CC_VERSION=1.0
set CC_SEQUENCE=1
set CRYPTO_PATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config

echo Configuration:
echo   Channel: %CHANNEL_NAME%
echo   Chaincode: %CC_NAME%
echo   Version: %CC_VERSION%
echo   Sequence: %CC_SEQUENCE%
echo.

REM Get Package ID
echo [INFO] Querying Package ID...
for /f "tokens=3" %%i in ('docker exec cli peer lifecycle chaincode queryinstalled ^| findstr "%CC_NAME%_%CC_VERSION%"') do set PACKAGE_ID=%%i
set PACKAGE_ID=%PACKAGE_ID:,=%

if "%PACKAGE_ID%"=="" (
    echo [ERROR] Package ID not found!
    echo.
    echo Make sure you have run 2-install-chaincode.bat first
    echo Or manually provide the Package ID
    echo.
    set /p PACKAGE_ID="Enter Package ID (or press Ctrl+C to exit): "
    
    if "!PACKAGE_ID!"=="" (
        echo [ERROR] No Package ID provided
        pause
        exit /b 1
    )
)

echo [SUCCESS] Package ID: %PACKAGE_ID%
echo.

echo ============================================================================
echo IMPORTANT: Fabric 2.3+ Channel Participation Mode
echo ============================================================================
echo.
echo This script uses direct peer approval without orderer system channel.
echo Each organization approves the chaincode definition locally on their peer.
echo.

pause

echo [1/5] Approving for ECTA...
docker exec cli peer lifecycle chaincode approveformyorg ^
  --channelID %CHANNEL_NAME% ^
  --name %CC_NAME% ^
  --version %CC_VERSION% ^
  --package-id %PACKAGE_ID% ^
  --sequence %CC_SEQUENCE% ^
  --tls ^
  --cafile %CRYPTO_PATH%/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem ^
  --peerAddresses peer0.ecta.example.com:7051 ^
  --tlsRootCertFiles %CRYPTO_PATH%/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] ECTA approval failed
    echo.
    echo Troubleshooting:
    echo   1. Check if channel exists: docker exec cli peer channel list
    echo   2. Check peer logs: docker logs peer0.ecta.example.com
    echo   3. Verify package is installed: docker exec cli peer lifecycle chaincode queryinstalled
    echo.
    pause
    exit /b 1
)
echo [SUCCESS] ECTA approved
echo.

echo [2/5] Approving for Bank...
docker exec -e CORE_PEER_LOCALMSPID=BankMSP ^
  -e CORE_PEER_ADDRESS=peer0.bank.example.com:9051 ^
  -e CORE_PEER_TLS_ROOTCERT_FILE=%CRYPTO_PATH%/peerOrganizations/bank.example.com/peers/peer0.bank.example.com/tls/ca.crt ^
  -e CORE_PEER_MSPCONFIGPATH=%CRYPTO_PATH%/peerOrganizations/bank.example.com/users/Admin@bank.example.com/msp ^
  cli peer lifecycle chaincode approveformyorg ^
  --channelID %CHANNEL_NAME% ^
  --name %CC_NAME% ^
  --version %CC_VERSION% ^
  --package-id %PACKAGE_ID% ^
  --sequence %CC_SEQUENCE% ^
  --tls ^
  --cafile %CRYPTO_PATH%/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem ^
  --peerAddresses peer0.bank.example.com:9051 ^
  --tlsRootCertFiles %CRYPTO_PATH%/peerOrganizations/bank.example.com/peers/peer0.bank.example.com/tls/ca.crt

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Bank approval failed
    pause
    exit /b 1
)
echo [SUCCESS] Bank approved
echo.

echo [3/5] Approving for NBE...
docker exec -e CORE_PEER_LOCALMSPID=NBEMSP ^
  -e CORE_PEER_ADDRESS=peer0.nbe.example.com:10051 ^
  -e CORE_PEER_TLS_ROOTCERT_FILE=%CRYPTO_PATH%/peerOrganizations/nbe.example.com/peers/peer0.nbe.example.com/tls/ca.crt ^
  -e CORE_PEER_MSPCONFIGPATH=%CRYPTO_PATH%/peerOrganizations/nbe.example.com/users/Admin@nbe.example.com/msp ^
  cli peer lifecycle chaincode approveformyorg ^
  --channelID %CHANNEL_NAME% ^
  --name %CC_NAME% ^
  --version %CC_VERSION% ^
  --package-id %PACKAGE_ID% ^
  --sequence %CC_SEQUENCE% ^
  --tls ^
  --cafile %CRYPTO_PATH%/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem ^
  --peerAddresses peer0.nbe.example.com:10051 ^
  --tlsRootCertFiles %CRYPTO_PATH%/peerOrganizations/nbe.example.com/peers/peer0.nbe.example.com/tls/ca.crt

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] NBE approval failed
    pause
    exit /b 1
)
echo [SUCCESS] NBE approved
echo.

echo [4/5] Approving for Customs...
docker exec -e CORE_PEER_LOCALMSPID=CustomsMSP ^
  -e CORE_PEER_ADDRESS=peer0.customs.example.com:11051 ^
  -e CORE_PEER_TLS_ROOTCERT_FILE=%CRYPTO_PATH%/peerOrganizations/customs.example.com/peers/peer0.customs.example.com/tls/ca.crt ^
  -e CORE_PEER_MSPCONFIGPATH=%CRYPTO_PATH%/peerOrganizations/customs.example.com/users/Admin@customs.example.com/msp ^
  cli peer lifecycle chaincode approveformyorg ^
  --channelID %CHANNEL_NAME% ^
  --name %CC_NAME% ^
  --version %CC_VERSION% ^
  --package-id %PACKAGE_ID% ^
  --sequence %CC_SEQUENCE% ^
  --tls ^
  --cafile %CRYPTO_PATH%/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem ^
  --peerAddresses peer0.customs.example.com:11051 ^
  --tlsRootCertFiles %CRYPTO_PATH%/peerOrganizations/customs.example.com/peers/peer0.customs.example.com/tls/ca.crt

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Customs approval failed
    pause
    exit /b 1
)
echo [SUCCESS] Customs approved
echo.

echo [5/5] Approving for Shipping...
docker exec -e CORE_PEER_LOCALMSPID=ShippingMSP ^
  -e CORE_PEER_ADDRESS=peer0.shipping.example.com:12051 ^
  -e CORE_PEER_TLS_ROOTCERT_FILE=%CRYPTO_PATH%/peerOrganizations/shipping.example.com/peers/peer0.shipping.example.com/tls/ca.crt ^
  -e CORE_PEER_MSPCONFIGPATH=%CRYPTO_PATH%/peerOrganizations/shipping.example.com/users/Admin@shipping.example.com/msp ^
  cli peer lifecycle chaincode approveformyorg ^
  --channelID %CHANNEL_NAME% ^
  --name %CC_NAME% ^
  --version %CC_VERSION% ^
  --package-id %PACKAGE_ID% ^
  --sequence %CC_SEQUENCE% ^
  --tls ^
  --cafile %CRYPTO_PATH%/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem ^
  --peerAddresses peer0.shipping.example.com:12051 ^
  --tlsRootCertFiles %CRYPTO_PATH%/peerOrganizations/shipping.example.com/peers/peer0.shipping.example.com/tls/ca.crt

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Shipping approval failed
    pause
    exit /b 1
)
echo [SUCCESS] Shipping approved
echo.

echo ============================================================================
echo Checking Commit Readiness...
echo ============================================================================
echo.

docker exec cli peer lifecycle chaincode checkcommitreadiness ^
  --channelID %CHANNEL_NAME% ^
  --name %CC_NAME% ^
  --version %CC_VERSION% ^
  --sequence %CC_SEQUENCE% ^
  --output json

echo.
echo ============================================================================
echo [SUCCESS] Chaincode Approved by All Organizations!
echo ============================================================================
echo.
echo Channel: %CHANNEL_NAME%
echo Chaincode: %CC_NAME%
echo Version: %CC_VERSION%
echo Sequence: %CC_SEQUENCE%
echo Package ID: %PACKAGE_ID%
echo.
echo All 5 organizations have approved the chaincode definition
echo.
echo Next Step: Run 4-commit-chaincode.bat to commit to the channel
echo.
echo ============================================================================

endlocal
pause
