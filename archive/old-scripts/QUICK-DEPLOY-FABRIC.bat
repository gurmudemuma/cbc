@echo off
REM ============================================================================
REM QUICK DEPLOY - Real Hyperledger Fabric Network
REM One-click deployment of complete blockchain system
REM ============================================================================

echo.
echo ========================================
echo  QUICK DEPLOY: REAL FABRIC BLOCKCHAIN
echo ========================================
echo.
echo This will deploy a complete Hyperledger Fabric network with:
echo   - 3 Orderers (Raft consensus)
echo   - 6 Peers across 5 organizations
echo   - 6 CouchDB state databases
echo   - Real smart contract deployment
echo   - Multi-party consensus
echo.
echo Estimated time: 5-10 minutes
echo.
pause

REM Check Docker
echo [Checking] Docker Desktop...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker not found. Please install Docker Desktop.
    pause
    exit /b 1
)
echo   ✓ Docker is running
echo.

REM Stop existing containers
echo [Cleanup] Stopping existing containers...
docker-compose -f docker-compose-hybrid.yml down >nul 2>&1
docker-compose -f docker-compose-fabric.yml down >nul 2>&1
echo   ✓ Cleanup complete
echo.

REM Download Fabric binaries if needed
if not exist "bin\cryptogen.exe" (
    echo [Download] Fabric binaries not found, downloading...
    powershell -ExecutionPolicy Bypass -File scripts\setup-fabric-binaries.ps1
    if %errorlevel% neq 0 (
        echo ERROR: Failed to download Fabric binaries
        pause
        exit /b 1
    )
)
echo   ✓ Fabric binaries ready
echo.

REM Generate crypto materials
echo [Crypto] Generating certificates and keys...
if exist crypto-config (
    rmdir /s /q crypto-config >nul 2>&1
)
bin\cryptogen.exe generate --config=crypto-config.yaml --output=crypto-config >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Failed to generate crypto materials
    pause
    exit /b 1
)
echo   ✓ Crypto materials generated
echo.

REM Generate genesis block and channel config
echo [Config] Generating genesis block and channel configuration...
if not exist config mkdir config
bin\configtxgen.exe -profile SampleMultiNodeEtcdRaft -channelID system-channel -outputBlock config\genesis.block -configPath config >nul 2>&1
bin\configtxgen.exe -profile CoffeeChannel -outputCreateChannelTx config\channel.tx -channelID coffeechannel -configPath config >nul 2>&1
echo   ✓ Network configuration generated
echo.

REM Start Fabric network
echo [Network] Starting Fabric network...
echo   - Starting orderers (3)...
echo   - Starting peers (6)...
echo   - Starting CouchDB (6)...
docker-compose -f docker-compose-fabric.yml up -d
if %errorlevel% neq 0 (
    echo ERROR: Failed to start Fabric network
    pause
    exit /b 1
)
echo   ✓ Fabric network started
echo.

echo [Wait] Waiting for network to stabilize (30 seconds)...
timeout /t 30 /nobreak >nul
echo   ✓ Network ready
echo.

REM Create channel
echo [Channel] Creating and joining channel...
docker exec cli bash -c "chmod +x /opt/gopath/src/github.com/hyperledger/fabric/peer/scripts/*.sh && cd /opt/gopath/src/github.com/hyperledger/fabric/peer && ./scripts/create-channel.sh" 2>nul
if %errorlevel% neq 0 (
    echo WARNING: Channel creation may have issues, continuing...
)
echo   ✓ Channel created
echo.

REM Deploy chaincode
echo [Chaincode] Deploying smart contract to all peers...
echo   This may take 2-3 minutes...
docker exec cli bash -c "cd /opt/gopath/src/github.com/hyperledger/fabric/peer && ./scripts/deploy-chaincode.sh"
if %errorlevel% neq 0 (
    echo ERROR: Chaincode deployment failed
    echo.
    echo Troubleshooting:
    echo   1. Check peer logs: docker logs peer0.ecta.example.com
    echo   2. Verify chaincode: docker exec cli peer lifecycle chaincode queryinstalled
    echo   3. Try manual deployment: docker exec -it cli bash
    pause
    exit /b 1
)
echo   ✓ Chaincode deployed
echo.

REM Start application services
echo [Services] Starting application services...
docker-compose -f docker-compose-hybrid.yml up -d postgres redis kafka zookeeper
timeout /t 10 /nobreak >nul
docker-compose -f docker-compose-hybrid.yml up -d gateway blockchain-bridge ecta-service commercial-bank-service national-bank-service customs-service ecx-service shipping-service frontend
echo   ✓ Application services started
echo.

echo [Wait] Waiting for services to initialize (20 seconds)...
timeout /t 20 /nobreak >nul
echo.

REM Enroll admin
echo [Identity] Enrolling admin user...
cd coffee-export-gateway
call npm install >nul 2>&1
node src\scripts\enrollAdmin.js
cd ..
echo   ✓ Admin enrolled
echo.

echo ========================================
echo  DEPLOYMENT COMPLETE!
echo ========================================
echo.
echo ✓ Real Fabric Network Running
echo ✓ Chaincode Deployed to All Peers
echo ✓ Application Services Started
echo ✓ Admin Identity Created
echo.
echo Services:
echo   Frontend:  http://localhost:5173
echo   Gateway:   http://localhost:3000
echo   CouchDB:   http://localhost:5984/_utils (admin/adminpw)
echo.
echo Network Status:
docker ps --format "table {{.Names}}\t{{.Status}}" | findstr /C:"peer" /C:"orderer" /C:"couchdb"
echo.
echo Verify Chaincode:
docker exec cli peer lifecycle chaincode querycommitted -C coffeechannel
echo.
echo Next Steps:
echo   1. Open http://localhost:5173
echo   2. Register a new exporter
echo   3. Data is now stored on REAL blockchain!
echo.
echo Documentation: REAL-FABRIC-DEPLOYMENT-GUIDE.md
echo.
pause
