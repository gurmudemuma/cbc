@echo off
REM Test chaincode functions
REM This script tests various chaincode functions to verify deployment

echo ========================================
echo Testing ECTA Chaincode Functions
echo ========================================
echo.

set CHANNEL_NAME=coffeechannel
set CHAINCODE_NAME=ecta
set ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem
set PEER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt

echo Test 1: Initialize Ledger
echo ---------------------------
docker exec cli peer chaincode invoke -o orderer1.orderer.example.com:7050 --tls --cafile %ORDERER_CA% -C %CHANNEL_NAME% -n %CHAINCODE_NAME% --peerAddresses peer0.ecta.example.com:7051 --tlsRootCertFiles %PEER_CA% -c "{\"function\":\"InitLedger\",\"Args\":[]}"

echo.
echo Waiting 5 seconds...
timeout /t 5 /nobreak >nul

echo.
echo Test 2: Submit Pre-Registration
echo --------------------------------
docker exec cli peer chaincode invoke -o orderer1.orderer.example.com:7050 --tls --cafile %ORDERER_CA% -C %CHANNEL_NAME% -n %CHAINCODE_NAME% --peerAddresses peer0.ecta.example.com:7051 --tlsRootCertFiles %PEER_CA% -c "{\"function\":\"SubmitPreRegistration\",\"Args\":[\"{\\\"exporterId\\\":\\\"TEST001\\\",\\\"companyName\\\":\\\"Test Coffee Exporter\\\",\\\"tin\\\":\\\"1234567890\\\",\\\"capitalETB\\\":5000000,\\\"licenseNumber\\\":\\\"LIC-2024-001\\\"}\"]}"

echo.
echo Waiting 5 seconds...
timeout /t 5 /nobreak >nul

echo.
echo Test 3: Query Exporter Profile
echo -------------------------------
docker exec cli peer chaincode query -C %CHANNEL_NAME% -n %CHAINCODE_NAME% -c "{\"function\":\"GetExporterProfile\",\"Args\":[\"TEST001\"]}"

echo.
echo Test 4: Create Export Request
echo ------------------------------
docker exec cli peer chaincode invoke -o orderer1.orderer.example.com:7050 --tls --cafile %ORDERER_CA% -C %CHANNEL_NAME% -n %CHAINCODE_NAME% --peerAddresses peer0.ecta.example.com:7051 --tlsRootCertFiles %PEER_CA% -c "{\"function\":\"CreateExportRequest\",\"Args\":[\"{\\\"exportId\\\":\\\"EXP001\\\",\\\"exporterId\\\":\\\"TEST001\\\",\\\"coffeeType\\\":\\\"Arabica\\\",\\\"quantity\\\":1000,\\\"destinationCountry\\\":\\\"USA\\\",\\\"estimatedValue\\\":50000}\"]}"

echo.
echo Waiting 5 seconds...
timeout /t 5 /nobreak >nul

echo.
echo Test 5: Query Export Request
echo -----------------------------
docker exec cli peer chaincode query -C %CHANNEL_NAME% -n %CHAINCODE_NAME% -c "{\"function\":\"GetExportRequest\",\"Args\":[\"EXP001\"]}"

echo.
echo Test 6: Update Export Workflow
echo -------------------------------
docker exec cli peer chaincode invoke -o orderer1.orderer.example.com:7050 --tls --cafile %ORDERER_CA% -C %CHANNEL_NAME% -n %CHAINCODE_NAME% --peerAddresses peer0.ecta.example.com:7051 --tlsRootCertFiles %PEER_CA% -c "{\"function\":\"UpdateExportWorkflow\",\"Args\":[\"EXP001\",\"ectaContract\",\"{\\\"status\\\":\\\"approved\\\",\\\"approvedBy\\\":\\\"ECTA Officer\\\"}\"]}"

echo.
echo Waiting 5 seconds...
timeout /t 5 /nobreak >nul

echo.
echo Test 7: Query Updated Export
echo -----------------------------
docker exec cli peer chaincode query -C %CHANNEL_NAME% -n %CHAINCODE_NAME% -c "{\"function\":\"GetExportRequest\",\"Args\":[\"EXP001\"]}"

echo.
echo Test 8: Issue Quality Certificate
echo ----------------------------------
docker exec cli peer chaincode invoke -o orderer1.orderer.example.com:7050 --tls --cafile %ORDERER_CA% -C %CHANNEL_NAME% -n %CHAINCODE_NAME% --peerAddresses peer0.ecta.example.com:7051 --tlsRootCertFiles %PEER_CA% -c "{\"function\":\"IssueQualityCertificate\",\"Args\":[\"{\\\"certificateId\\\":\\\"CERT001\\\",\\\"exportId\\\":\\\"EXP001\\\",\\\"grade\\\":\\\"Grade 1\\\",\\\"cupScore\\\":85,\\\"issuedBy\\\":\\\"ECTA Quality Lab\\\"}\"]}"

echo.
echo Waiting 5 seconds...
timeout /t 5 /nobreak >nul

echo.
echo Test 9: Verify Certificate
echo ---------------------------
docker exec cli peer chaincode query -C %CHANNEL_NAME% -n %CHAINCODE_NAME% -c "{\"function\":\"VerifyCertificate\",\"Args\":[\"CERT001\"]}"

echo.
echo Test 10: Get Asset History
echo ---------------------------
docker exec cli peer chaincode query -C %CHANNEL_NAME% -n %CHAINCODE_NAME% -c "{\"function\":\"GetAssetHistory\",\"Args\":[\"TEST001\"]}"

echo.
echo ========================================
echo All Tests Completed!
echo ========================================
echo.
echo If all tests passed, your chaincode is working correctly.
echo You can now use the backend API to interact with the blockchain.
echo.
pause
