@echo off
echo ========================================
echo Chaincode Deployment Verification
echo ========================================
echo.

echo Checking if chaincode is deployed to Fabric...
echo.

echo 1. Checking installed chaincode on peers...
echo.
echo [ECTA Peer0]
docker exec cli peer lifecycle chaincode queryinstalled 2>nul
echo.

echo [Bank Peer0]
docker exec -e CORE_PEER_LOCALMSPID=BankMSP -e CORE_PEER_ADDRESS=peer0.bank.example.com:9051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/bank.example.com/peers/peer0.bank.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/bank.example.com/users/Admin@bank.example.com/msp cli peer lifecycle chaincode queryinstalled 2>nul
echo.

echo 2. Checking committed chaincode on channel...
echo.
docker exec cli peer lifecycle chaincode querycommitted --channelID coffeechannel 2>nul
echo.

echo 3. Checking chaincode server status...
echo.
curl -s http://localhost:3001/health
echo.
echo.

echo 4. Checking chaincode container...
echo.
docker ps --filter "name=coffee-chaincode" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo.

echo ========================================
echo Analysis
echo ========================================
echo.
echo If you see:
echo   - "Installed chaincodes on peer" = Chaincode IS deployed to Fabric
echo   - "No installed chaincodes" = Chaincode NOT deployed (using mock)
echo.
echo Current Mode:
docker logs coffee-chaincode --tail 5 2>nul | findstr "Chaincode Server"
echo.

echo ========================================
echo Recommendation
echo ========================================
echo.
echo Your system is currently using a MOCK chaincode server.
echo This is NOT a true blockchain smart contract.
echo.
echo To deploy real chaincode to Fabric:
echo   1. Run: scripts\deploy-chaincode.bat
echo   2. Update gateway to use Fabric SDK
echo   3. Restart services
echo.
echo For development/testing, the mock is acceptable.
echo For production, you MUST deploy to real Fabric.
echo.
pause
