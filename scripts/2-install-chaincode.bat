@echo off
REM ============================================================================
REM STEP 2: INSTALL CHAINCODE ON ALL PEERS
REM Installs the packaged chaincode on all 5 organization peers
REM ============================================================================

setlocal enabledelayedexpansion

echo.
echo ============================================================================
echo              STEP 2: INSTALL CHAINCODE ON ALL PEERS
echo ============================================================================
echo.

REM Configuration
set CC_NAME=ecta
set CC_VERSION=1.0
set CRYPTO_PATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config

echo Configuration:
echo   Chaincode: %CC_NAME%
echo   Version: %CC_VERSION%
echo   Package: %CC_NAME%.tar.gz
echo.
echo Installing on 5 peers (ECTA, Bank, NBE, Customs, Shipping)...
echo.

pause

echo [1/5] Installing on peer0.ecta...
docker exec -e CORE_PEER_LOCALMSPID=ECTAMSP -e CORE_PEER_ADDRESS=peer0.ecta.example.com:7051 -e CORE_PEER_TLS_ROOTCERT_FILE=%CRYPTO_PATH%/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=%CRYPTO_PATH%/peerOrganizations/ecta.example.com/users/Admin@ecta.example.com/msp cli peer lifecycle chaincode install %CC_NAME%.tar.gz
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] ECTA installation failed
    pause
    exit /b 1
)
echo [SUCCESS] Installed on peer0.ecta
echo.

echo [2/5] Installing on peer0.bank...
docker exec -e CORE_PEER_LOCALMSPID=BankMSP -e CORE_PEER_ADDRESS=peer0.bank.example.com:9051 -e CORE_PEER_TLS_ROOTCERT_FILE=%CRYPTO_PATH%/peerOrganizations/bank.example.com/peers/peer0.bank.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=%CRYPTO_PATH%/peerOrganizations/bank.example.com/users/Admin@bank.example.com/msp cli peer lifecycle chaincode install %CC_NAME%.tar.gz
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Bank installation may have failed
)
echo [SUCCESS] Installed on peer0.bank
echo.

echo [3/5] Installing on peer0.nbe...
docker exec -e CORE_PEER_LOCALMSPID=NBEMSP -e CORE_PEER_ADDRESS=peer0.nbe.example.com:10051 -e CORE_PEER_TLS_ROOTCERT_FILE=%CRYPTO_PATH%/peerOrganizations/nbe.example.com/peers/peer0.nbe.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=%CRYPTO_PATH%/peerOrganizations/nbe.example.com/users/Admin@nbe.example.com/msp cli peer lifecycle chaincode install %CC_NAME%.tar.gz
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] NBE installation may have failed
)
echo [SUCCESS] Installed on peer0.nbe
echo.

echo [4/5] Installing on peer0.customs...
docker exec -e CORE_PEER_LOCALMSPID=CustomsMSP -e CORE_PEER_ADDRESS=peer0.customs.example.com:11051 -e CORE_PEER_TLS_ROOTCERT_FILE=%CRYPTO_PATH%/peerOrganizations/customs.example.com/peers/peer0.customs.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=%CRYPTO_PATH%/peerOrganizations/customs.example.com/users/Admin@customs.example.com/msp cli peer lifecycle chaincode install %CC_NAME%.tar.gz
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Customs installation may have failed
)
echo [SUCCESS] Installed on peer0.customs
echo.

echo [5/5] Installing on peer0.shipping...
docker exec -e CORE_PEER_LOCALMSPID=ShippingMSP -e CORE_PEER_ADDRESS=peer0.shipping.example.com:12051 -e CORE_PEER_TLS_ROOTCERT_FILE=%CRYPTO_PATH%/peerOrganizations/shipping.example.com/peers/peer0.shipping.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=%CRYPTO_PATH%/peerOrganizations/shipping.example.com/users/Admin@shipping.example.com/msp cli peer lifecycle chaincode install %CC_NAME%.tar.gz
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Shipping installation may have failed
)
echo [SUCCESS] Installed on peer0.shipping
echo.

echo ============================================================================
echo Querying Package ID...
echo ============================================================================
echo.

for /f "tokens=3" %%i in ('docker exec cli peer lifecycle chaincode queryinstalled ^| findstr "%CC_NAME%_%CC_VERSION%"') do set PACKAGE_ID=%%i
set PACKAGE_ID=%PACKAGE_ID:,=%

if "%PACKAGE_ID%"=="" (
    echo [ERROR] Failed to get package ID
    echo Run: docker exec cli peer lifecycle chaincode queryinstalled
    pause
    exit /b 1
)

echo [SUCCESS] Package ID: %PACKAGE_ID%
echo.

echo ============================================================================
echo [SUCCESS] Chaincode Installed on All Peers!
echo ============================================================================
echo.
echo Package ID: %PACKAGE_ID%
echo Installed on: 5 peers
echo.
echo IMPORTANT: Save this Package ID for the next step!
echo.
echo Next Step: Run 3-approve-chaincode.bat with this Package ID
echo.
echo ============================================================================

endlocal
pause
