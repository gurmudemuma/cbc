@echo off
REM ============================================================================
REM STEP 4: COMMIT CHAINCODE TO CHANNEL
REM Commits the approved chaincode definition to the blockchain channel
REM ============================================================================

setlocal enabledelayedexpansion

echo.
echo ============================================================================
echo              STEP 4: COMMIT CHAINCODE TO CHANNEL
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

pause

echo.
echo [INFO] Committing chaincode definition...
echo This may take a few moments...
echo.

docker exec cli peer lifecycle chaincode commit -o orderer1.orderer.example.com:7050 --ordererTLSHostnameOverride orderer1.orderer.example.com --tls --cafile %CRYPTO_PATH%/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem --channelID %CHANNEL_NAME% --name %CC_NAME% --version %CC_VERSION% --sequence %CC_SEQUENCE% --peerAddresses peer0.ecta.example.com:7051 --tlsRootCertFiles %CRYPTO_PATH%/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt --peerAddresses peer0.bank.example.com:9051 --tlsRootCertFiles %CRYPTO_PATH%/peerOrganizations/bank.example.com/peers/peer0.bank.example.com/tls/ca.crt --peerAddresses peer0.nbe.example.com:10051 --tlsRootCertFiles %CRYPTO_PATH%/peerOrganizations/nbe.example.com/peers/peer0.nbe.example.com/tls/ca.crt

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Commit failed!
    echo.
    echo Troubleshooting:
    echo   1. Verify all organizations approved: Run 3-approve-chaincode.bat
    echo   2. Check commit readiness: docker exec cli peer lifecycle chaincode checkcommitreadiness ...
    echo   3. Check orderer logs: docker logs orderer1.orderer.example.com
    echo.
    pause
    exit /b 1
)

echo.
echo [SUCCESS] Chaincode committed to channel!
echo.

echo ============================================================================
echo Verifying Deployment...
echo ============================================================================
echo.

docker exec cli peer lifecycle chaincode querycommitted --channelID %CHANNEL_NAME% --name %CC_NAME%

echo.
echo ============================================================================
echo [SUCCESS] CHAINCODE DEPLOYMENT COMPLETE!
echo ============================================================================
echo.
echo Channel: %CHANNEL_NAME%
echo Chaincode: %CC_NAME%
echo Version: %CC_VERSION%
echo Sequence: %CC_SEQUENCE%
echo.
echo The chaincode is now active and ready to use!
echo.
echo Chaincode containers will start automatically on first invocation
echo.
echo Next Steps:
echo   1. Test chaincode: node test-workflow-from-registration.js
echo   2. Check status: scripts\verify-chaincode-status.bat
echo   3. View containers: docker ps --filter name=dev-peer
echo.
echo ============================================================================
echo.
echo AVAILABLE BLOCKCHAIN FUNCTIONS: 140+
echo.
echo Categories:
echo   * User Management (8)
echo   * Exporter Profile ^& Pre-Registration (11)
echo   * Export Workflow (7)
echo   * Sales Contract Registration (14)
echo   * Certificate Issuance (11)
echo   * Network Submission (9)
echo   * Document Issuance ^& Authentication (8) - NEW
echo   * ESW, Quality Certificates, GPS Plot, Customs, Shipping, Legal, and more...
echo.
echo See scripts\README.md for complete function list
echo.
echo ============================================================================

endlocal
pause
