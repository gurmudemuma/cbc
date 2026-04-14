@echo off
REM ============================================================================
REM COMPREHENSIVE CHAINCODE DEPLOYMENT SCRIPT
REM Handles all deployment scenarios: fresh install, upgrade, and redeploy
REM ============================================================================

setlocal enabledelayedexpansion

echo.
echo ============================================================================
echo                    ECTA CHAINCODE DEPLOYMENT
echo ============================================================================
echo.

REM Configuration
set CHANNEL_NAME=coffeechannel
set CC_NAME=ecta
set CC_VERSION=1.0
set CC_PATH=/opt/gopath/src/github.com/hyperledger/fabric/chaincode/ecta
set CC_LANG=node
set CRYPTO_PATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config

REM Check if chaincode is already deployed
echo [INFO] Checking current deployment status...
docker exec cli peer lifecycle chaincode querycommitted -C %CHANNEL_NAME% -n %CC_NAME% >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [INFO] Chaincode is already deployed. This will be an UPGRADE.
    set DEPLOYMENT_TYPE=UPGRADE
    
    REM Get current sequence
    for /f "tokens=*" %%i in ('docker exec cli peer lifecycle chaincode querycommitted -C %CHANNEL_NAME% -n %CC_NAME% 2^>^&1') do (
        echo %%i | findstr "Sequence" >nul
        if not errorlevel 1 (
            for /f "tokens=2 delims=:," %%j in ("%%i") do set CURRENT_SEQ=%%j
        )
    )
    set CURRENT_SEQ=!CURRENT_SEQ: =!
    set /a NEW_SEQ=!CURRENT_SEQ!+1
    echo [INFO] Current Sequence: !CURRENT_SEQ!
    echo [INFO] New Sequence: !NEW_SEQ!
) else (
    echo [INFO] No existing chaincode found. This will be a FRESH INSTALL.
    set DEPLOYMENT_TYPE=FRESH
    set NEW_SEQ=1
)

echo.
echo ============================================================================
echo DEPLOYMENT TYPE: %DEPLOYMENT_TYPE%
echo SEQUENCE: %NEW_SEQ%
echo ============================================================================
echo.

REM Step 1: Clean up old chaincode containers and images
echo [STEP 1/9] Cleaning up old chaincode containers...
for /f "tokens=*" %%i in ('docker ps -a --filter "name=dev-peer" --format "{{.Names}}"') do (
    echo   Removing container: %%i
    docker rm -f %%i 2>nul
)
echo [SUCCESS] Old containers removed
echo.

echo [STEP 2/9] Removing old chaincode images...
for /f "tokens=*" %%i in ('docker images --filter "reference=dev-peer*" --format "{{.Repository}}:{{.Tag}}"') do (
    echo   Removing image: %%i
    docker rmi -f %%i 2>nul
)
echo [SUCCESS] Old images removed
echo.

REM Step 2: Package chaincode
echo [STEP 3/9] Packaging chaincode...
docker exec cli rm -f /opt/gopath/src/github.com/hyperledger/fabric/peer/*.tar.gz 2>nul
docker exec cli peer lifecycle chaincode package %CC_NAME%.tar.gz --path %CC_PATH% --lang %CC_LANG% --label %CC_NAME%_%CC_VERSION%
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Packaging failed
    exit /b 1
)
echo [SUCCESS] Chaincode packaged
echo.

REM Step 3: Install on all peers
echo [STEP 4/9] Installing chaincode on all peers...
echo   Installing on ECTA peer...
docker exec -e CORE_PEER_LOCALMSPID=ECTAMSP -e CORE_PEER_ADDRESS=peer0.ecta.example.com:7051 -e CORE_PEER_TLS_ROOTCERT_FILE=%CRYPTO_PATH%/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=%CRYPTO_PATH%/peerOrganizations/ecta.example.com/users/Admin@ecta.example.com/msp cli peer lifecycle chaincode install %CC_NAME%.tar.gz
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] ECTA installation failed
    exit /b 1
)

echo   Installing on Bank peer...
docker exec -e CORE_PEER_LOCALMSPID=BankMSP -e CORE_PEER_ADDRESS=peer0.bank.example.com:9051 -e CORE_PEER_TLS_ROOTCERT_FILE=%CRYPTO_PATH%/peerOrganizations/bank.example.com/peers/peer0.bank.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=%CRYPTO_PATH%/peerOrganizations/bank.example.com/users/Admin@bank.example.com/msp cli peer lifecycle chaincode install %CC_NAME%.tar.gz

echo   Installing on NBE peer...
docker exec -e CORE_PEER_LOCALMSPID=NBEMSP -e CORE_PEER_ADDRESS=peer0.nbe.example.com:10051 -e CORE_PEER_TLS_ROOTCERT_FILE=%CRYPTO_PATH%/peerOrganizations/nbe.example.com/peers/peer0.nbe.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=%CRYPTO_PATH%/peerOrganizations/nbe.example.com/users/Admin@nbe.example.com/msp cli peer lifecycle chaincode install %CC_NAME%.tar.gz

echo   Installing on Customs peer...
docker exec -e CORE_PEER_LOCALMSPID=CustomsMSP -e CORE_PEER_ADDRESS=peer0.customs.example.com:11051 -e CORE_PEER_TLS_ROOTCERT_FILE=%CRYPTO_PATH%/peerOrganizations/customs.example.com/peers/peer0.customs.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=%CRYPTO_PATH%/peerOrganizations/customs.example.com/users/Admin@customs.example.com/msp cli peer lifecycle chaincode install %CC_NAME%.tar.gz

echo   Installing on Shipping peer...
docker exec -e CORE_PEER_LOCALMSPID=ShippingMSP -e CORE_PEER_ADDRESS=peer0.shipping.example.com:12051 -e CORE_PEER_TLS_ROOTCERT_FILE=%CRYPTO_PATH%/peerOrganizations/shipping.example.com/peers/peer0.shipping.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=%CRYPTO_PATH%/peerOrganizations/shipping.example.com/users/Admin@shipping.example.com/msp cli peer lifecycle chaincode install %CC_NAME%.tar.gz

echo [SUCCESS] Installed on all peers
echo.

REM Step 4: Get package ID
echo [STEP 5/9] Querying package ID...
for /f "tokens=3" %%i in ('docker exec cli peer lifecycle chaincode queryinstalled ^| findstr "%CC_NAME%_%CC_VERSION%"') do set PACKAGE_ID=%%i
set PACKAGE_ID=%PACKAGE_ID:,=%
if "%PACKAGE_ID%"=="" (
    echo [ERROR] Failed to get package ID
    exit /b 1
)
echo [SUCCESS] Package ID: %PACKAGE_ID%
echo.

REM Step 5: Approve for all organizations
echo [STEP 6/9] Approving chaincode for all organizations...
echo   Approving for ECTA...
docker exec -e CORE_PEER_LOCALMSPID=ECTAMSP -e CORE_PEER_ADDRESS=peer0.ecta.example.com:7051 -e CORE_PEER_TLS_ROOTCERT_FILE=%CRYPTO_PATH%/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=%CRYPTO_PATH%/peerOrganizations/ecta.example.com/users/Admin@ecta.example.com/msp cli peer lifecycle chaincode approveformyorg -o orderer1.orderer.example.com:7050 --ordererTLSHostnameOverride orderer1.orderer.example.com --tls --cafile %CRYPTO_PATH%/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem --channelID %CHANNEL_NAME% --name %CC_NAME% --version %CC_VERSION% --package-id %PACKAGE_ID% --sequence %NEW_SEQ%

echo   Approving for Bank...
docker exec -e CORE_PEER_LOCALMSPID=BankMSP -e CORE_PEER_ADDRESS=peer0.bank.example.com:9051 -e CORE_PEER_TLS_ROOTCERT_FILE=%CRYPTO_PATH%/peerOrganizations/bank.example.com/peers/peer0.bank.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=%CRYPTO_PATH%/peerOrganizations/bank.example.com/users/Admin@bank.example.com/msp cli peer lifecycle chaincode approveformyorg -o orderer1.orderer.example.com:7050 --ordererTLSHostnameOverride orderer1.orderer.example.com --tls --cafile %CRYPTO_PATH%/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem --channelID %CHANNEL_NAME% --name %CC_NAME% --version %CC_VERSION% --package-id %PACKAGE_ID% --sequence %NEW_SEQ%

echo   Approving for NBE...
docker exec -e CORE_PEER_LOCALMSPID=NBEMSP -e CORE_PEER_ADDRESS=peer0.nbe.example.com:10051 -e CORE_PEER_TLS_ROOTCERT_FILE=%CRYPTO_PATH%/peerOrganizations/nbe.example.com/peers/peer0.nbe.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=%CRYPTO_PATH%/peerOrganizations/nbe.example.com/users/Admin@nbe.example.com/msp cli peer lifecycle chaincode approveformyorg -o orderer1.orderer.example.com:7050 --ordererTLSHostnameOverride orderer1.orderer.example.com --tls --cafile %CRYPTO_PATH%/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem --channelID %CHANNEL_NAME% --name %CC_NAME% --version %CC_VERSION% --package-id %PACKAGE_ID% --sequence %NEW_SEQ%

echo   Approving for Customs...
docker exec -e CORE_PEER_LOCALMSPID=CustomsMSP -e CORE_PEER_ADDRESS=peer0.customs.example.com:11051 -e CORE_PEER_TLS_ROOTCERT_FILE=%CRYPTO_PATH%/peerOrganizations/customs.example.com/peers/peer0.customs.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=%CRYPTO_PATH%/peerOrganizations/customs.example.com/users/Admin@customs.example.com/msp cli peer lifecycle chaincode approveformyorg -o orderer1.orderer.example.com:7050 --ordererTLSHostnameOverride orderer1.orderer.example.com --tls --cafile %CRYPTO_PATH%/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem --channelID %CHANNEL_NAME% --name %CC_NAME% --version %CC_VERSION% --package-id %PACKAGE_ID% --sequence %NEW_SEQ%

echo   Approving for Shipping...
docker exec -e CORE_PEER_LOCALMSPID=ShippingMSP -e CORE_PEER_ADDRESS=peer0.shipping.example.com:12051 -e CORE_PEER_TLS_ROOTCERT_FILE=%CRYPTO_PATH%/peerOrganizations/shipping.example.com/peers/peer0.shipping.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=%CRYPTO_PATH%/peerOrganizations/shipping.example.com/users/Admin@shipping.example.com/msp cli peer lifecycle chaincode approveformyorg -o orderer1.orderer.example.com:7050 --ordererTLSHostnameOverride orderer1.orderer.example.com --tls --cafile %CRYPTO_PATH%/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem --channelID %CHANNEL_NAME% --name %CC_NAME% --version %CC_VERSION% --package-id %PACKAGE_ID% --sequence %NEW_SEQ%

echo [SUCCESS] All organizations approved
echo.

REM Step 6: Check commit readiness
echo [STEP 7/9] Checking commit readiness...
docker exec cli peer lifecycle chaincode checkcommitreadiness --channelID %CHANNEL_NAME% --name %CC_NAME% --version %CC_VERSION% --sequence %NEW_SEQ% --output json
echo.

REM Step 7: Commit chaincode
echo [STEP 8/9] Committing chaincode definition...
docker exec cli peer lifecycle chaincode commit -o orderer1.orderer.example.com:7050 --ordererTLSHostnameOverride orderer1.orderer.example.com --tls --cafile %CRYPTO_PATH%/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem --channelID %CHANNEL_NAME% --name %CC_NAME% --version %CC_VERSION% --sequence %NEW_SEQ% --peerAddresses peer0.ecta.example.com:7051 --tlsRootCertFiles %CRYPTO_PATH%/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt --peerAddresses peer0.bank.example.com:9051 --tlsRootCertFiles %CRYPTO_PATH%/peerOrganizations/bank.example.com/peers/peer0.bank.example.com/tls/ca.crt --peerAddresses peer0.nbe.example.com:10051 --tlsRootCertFiles %CRYPTO_PATH%/peerOrganizations/nbe.example.com/peers/peer0.nbe.example.com/tls/ca.crt

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Commit failed
    exit /b 1
)
echo [SUCCESS] Chaincode committed
echo.

REM Step 8: Verify deployment
echo [STEP 9/9] Verifying deployment...
docker exec cli peer lifecycle chaincode querycommitted --channelID %CHANNEL_NAME% --name %CC_NAME%
echo.

echo ============================================================================
echo                    DEPLOYMENT COMPLETE!
echo ============================================================================
echo.
echo Deployment Type: %DEPLOYMENT_TYPE%
echo Chaincode: %CC_NAME%
echo Version: %CC_VERSION%
echo Sequence: %NEW_SEQ%
echo Channel: %CHANNEL_NAME%
echo Package ID: %PACKAGE_ID%
echo.
echo ============================================================================
echo                 AVAILABLE BLOCKCHAIN FUNCTIONS (140+)
echo ============================================================================
echo.
echo USER MANAGEMENT (8): RegisterUser, GetUser, UpdateUserStatus, GetUsersByRole,
echo   GetPendingUsers, GetUsersByStatus, InitLedger
echo.
echo EXPORTER PROFILE ^& PRE-REGISTRATION (11): SubmitPreRegistration,
echo   GetExporterProfile, UpdateExporterProfile, CheckLicenseExpiry, RenewLicense,
echo   RevokeLicense, SuspendExporter, ReactivateExporter, ApprovePreRegistration,
echo   RejectPreRegistration, SubmitPreRegistrationStage
echo.
echo EXPORT WORKFLOW (7): CreateExportRequest, GetExportRequest, UpdateExportWorkflow,
echo   UpdateExportContract, UpdateBankingDetails, UpdateCustomsDetails,
echo   UpdateShippingDetails
echo.
echo SALES CONTRACT REGISTRATION (14): CreateShipment, RegisterSalesContract,
echo   ValidateMinimumPrice, ApproveSalesContract, GenerateCommercialInvoice,
echo   UpdatePaymentDetails, VerifyPayment, UpdatePackingList, GetShipment,
echo   GetShipmentsByExporter, GetPendingContractApprovals,
echo   GetPendingPaymentVerifications, SetMinimumPrice, GetMinimumPrice, GetPriceHistory
echo.
echo CERTIFICATE ISSUANCE (11): RequestCertificate, IssueCQICAuthorization,
echo   IssuePhytosanitaryCertificate, IssueCertificateOfOrigin, IssueEUDRCompliance,
echo   IssueICOCertificate, GetCertificate, GetCertificatesByShipment,
echo   GetPendingCertificates, RevokeCertificate, VerifyCertificate
echo.
echo NETWORK SUBMISSION (9): FinalizeContractFromDraft,
echo   RegisterSalesContractWithReference, GetContractByReference, GetReferenceByDraftId,
echo   SubmitToNetwork, UpdateOrganizationApproval, GetApprovalStatus,
echo   QueryContractsByStatus, QueryContractsByExporter
echo.
echo DOCUMENT ISSUANCE ^& AUTHENTICATION (8) - NEW FEATURE:
echo   - RecordDocumentIssuance: Record document issuance on blockchain
echo   - VerifyDocumentAuthenticity: Verify document by hash
echo   - RecordDocumentAuthentication: Record authentication event
echo   - RecordDocumentRevocation: Revoke issued document
echo   - GetDocument: Get document by ID
echo   - QueryDocumentsByExporter: Query exporter's documents
echo   - QueryDocumentsByIssuer: Query issuer's documents
echo   - QueryAuthenticationsBySubmission: Query submission authentications
echo.
echo Plus: ESW (3), Quality Certificates (2), Qualification Documents (3),
echo   Statutory Documents (4), Contract Drafts (3), GPS Plot (4),
echo   Certificate Bundle (2), Customs (5), Fumigation (3), Shipping (13),
echo   Legal Framework (10), Query Functions (5)
echo.
echo ============================================================================
echo.
echo Next Steps:
echo   1. Test with: node test-workflow-from-registration.js
echo   2. Verify blockchain functions are accessible
echo   3. Check chaincode logs: docker logs dev-peer0.ecta.example.com-ecta_%CC_VERSION%
echo.
echo ============================================================================

endlocal
