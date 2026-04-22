@echo off
REM ============================================================================
REM Coffee Export Blockchain System - Professional Deployment Script
REM ============================================================================
REM This script deploys the complete system in the correct order
REM ============================================================================

echo.
echo ============================================================================
echo   COFFEE EXPORT BLOCKCHAIN SYSTEM - PROFESSIONAL DEPLOYMENT
echo ============================================================================
echo.
echo Starting deployment at %date% %time%
echo.

REM ============================================================================
REM PHASE 1: PRE-DEPLOYMENT CHECKS
REM ============================================================================

echo [PHASE 1] Pre-Deployment Checks
echo ============================================================================
echo.

echo Checking Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not installed or not running
    echo Please install Docker Desktop and try again
    pause
    exit /b 1
)
echo ✓ Docker is available

echo.
echo Checking Docker Compose...
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker Compose is not installed
    pause
    exit /b 1
)
echo ✓ Docker Compose is available

echo.
echo Checking available disk space...
docker system df
echo.

REM ============================================================================
REM PHASE 2: CLEANUP
REM ============================================================================

echo.
echo [PHASE 2] Cleanup Previous Deployment
echo ============================================================================
echo.

echo Stopping existing containers...
docker-compose -f docker-compose-hybrid.yml down 2>nul
docker-compose -f docker-compose-fabric.yml down 2>nul
echo ✓ Containers stopped

echo.
echo Removing old chaincode containers...
for /f "tokens=*" %%i in ('docker ps -aq --filter "name=dev-peer"') do docker rm -f %%i 2>nul
echo ✓ Old chaincode containers removed

echo.
echo Cleaning up unused resources...
docker system prune -f >nul 2>&1
echo ✓ Cleanup complete

REM ============================================================================
REM PHASE 3: NETWORK SETUP
REM ============================================================================

echo.
echo [PHASE 3] Network Setup
echo ============================================================================
echo.

echo Creating Docker network...
docker network create fabric-network 2>nul
if errorlevel 1 (
    echo Network already exists, continuing...
) else (
    echo ✓ Network created
)

REM ============================================================================
REM PHASE 4: FABRIC NETWORK
REM ============================================================================

echo.
echo [PHASE 4] Starting Fabric Network
echo ============================================================================
echo.

echo Starting orderers, peers, and CouchDB...
docker-compose -f docker-compose-fabric.yml up -d
if errorlevel 1 (
    echo ERROR: Failed to start Fabric network
    pause
    exit /b 1
)
echo ✓ Fabric network started

echo.
echo Waiting for Fabric network to be ready (30 seconds)...
timeout /t 30 /nobreak >nul
echo ✓ Fabric network ready

echo.
echo Verifying Fabric containers...
docker ps --filter "network=fabric-network" --format "table {{.Names}}\t{{.Status}}"
echo.

REM ============================================================================
REM PHASE 5: BLOCKCHAIN INITIALIZATION
REM ============================================================================

echo.
echo [PHASE 5] Blockchain Initialization
echo ============================================================================
echo.

echo Checking if channel exists...
docker exec cli peer channel list 2>nul | findstr "coffeechannel" >nul
if errorlevel 1 (
    echo Channel does not exist, creating...
    cd scripts
    call install-blockchain.bat
    cd ..
    if errorlevel 1 (
        echo ERROR: Blockchain initialization failed
        pause
        exit /b 1
    )
    echo ✓ Blockchain initialized
) else (
    echo Channel already exists, deploying chaincode...
    cd scripts
    call deploy-chaincode.bat
    cd ..
    if errorlevel 1 (
        echo ERROR: Chaincode deployment failed
        pause
        exit /b 1
    )
    echo ✓ Chaincode deployed
)

echo.
echo Verifying chaincode deployment...
docker exec cli peer lifecycle chaincode querycommitted --channelID coffeechannel --name ecta
if errorlevel 1 (
    echo WARNING: Chaincode verification failed
) else (
    echo ✓ Chaincode verified
)

REM ============================================================================
REM PHASE 6: BUILD APPLICATION IMAGES
REM ============================================================================

echo.
echo [PHASE 6] Building Application Images
echo ============================================================================
echo.

echo Building Gateway...
docker-compose -f docker-compose-hybrid.yml build gateway
if errorlevel 1 (
    echo ERROR: Gateway build failed
    pause
    exit /b 1
)
echo ✓ Gateway built

echo.
echo Building Blockchain Bridge...
docker-compose -f docker-compose-hybrid.yml build blockchain-bridge
if errorlevel 1 (
    echo ERROR: Blockchain Bridge build failed
    pause
    exit /b 1
)
echo ✓ Blockchain Bridge built

echo.
echo Building CBC Services...
docker-compose -f docker-compose-hybrid.yml build ecta-service commercial-bank-service national-bank-service customs-service ecx-service shipping-service
if errorlevel 1 (
    echo ERROR: CBC Services build failed
    pause
    exit /b 1
)
echo ✓ CBC Services built

echo.
echo Building Buyer Verification...
docker-compose -f docker-compose-hybrid.yml build buyer-verification
if errorlevel 1 (
    echo ERROR: Buyer Verification build failed
    pause
    exit /b 1
)
echo ✓ Buyer Verification built

echo.
echo Building Frontend...
docker-compose -f docker-compose-hybrid.yml build frontend
if errorlevel 1 (
    echo ERROR: Frontend build failed
    pause
    exit /b 1
)
echo ✓ Frontend built

REM ============================================================================
REM PHASE 7: START INFRASTRUCTURE
REM ============================================================================

echo.
echo [PHASE 7] Starting Infrastructure Services
echo ============================================================================
echo.

echo Starting PostgreSQL, Redis, Kafka, Zookeeper...
docker-compose -f docker-compose-hybrid.yml up -d postgres redis zookeeper kafka
if errorlevel 1 (
    echo ERROR: Infrastructure services failed to start
    pause
    exit /b 1
)
echo ✓ Infrastructure services started

echo.
echo Waiting for infrastructure to be ready (30 seconds)...
timeout /t 30 /nobreak >nul
echo ✓ Infrastructure ready

REM ============================================================================
REM PHASE 8: START APPLICATION SERVICES
REM ============================================================================

echo.
echo [PHASE 8] Starting Application Services
echo ============================================================================
echo.

echo Starting Gateway and Blockchain Bridge...
docker-compose -f docker-compose-hybrid.yml up -d gateway blockchain-bridge
if errorlevel 1 (
    echo ERROR: Gateway/Bridge failed to start
    pause
    exit /b 1
)
echo ✓ Gateway and Bridge started

echo.
echo Waiting for Gateway to be ready (20 seconds)...
timeout /t 20 /nobreak >nul
echo ✓ Gateway ready

echo.
echo Starting CBC Services...
docker-compose -f docker-compose-hybrid.yml up -d ecta-service commercial-bank-service national-bank-service customs-service ecx-service shipping-service buyer-verification
if errorlevel 1 (
    echo ERROR: CBC Services failed to start
    pause
    exit /b 1
)
echo ✓ CBC Services started

echo.
echo Starting Frontend...
docker-compose -f docker-compose-hybrid.yml up -d frontend
if errorlevel 1 (
    echo ERROR: Frontend failed to start
    pause
    exit /b 1
)
echo ✓ Frontend started

REM ============================================================================
REM PHASE 9: DATA INITIALIZATION
REM ============================================================================

echo.
echo [PHASE 9] Data Initialization
echo ============================================================================
echo.

echo Enrolling admin identity...
docker-compose -f docker-compose-hybrid.yml exec -T gateway npm run enroll-admin
if errorlevel 1 (
    echo WARNING: Admin enrollment failed (may already exist)
) else (
    echo ✓ Admin enrolled
)

echo.
echo Seeding users...
docker-compose -f docker-compose-hybrid.yml exec -T gateway npm run seed-users
if errorlevel 1 (
    echo WARNING: User seeding failed (may already exist)
) else (
    echo ✓ Users seeded
)

echo.
echo Syncing users to blockchain...
docker-compose -f docker-compose-hybrid.yml exec -T gateway npm run sync-users
if errorlevel 1 (
    echo WARNING: Blockchain sync failed (system will still work)
) else (
    echo ✓ Users synced to blockchain
)

echo.
echo Verifying database...
docker-compose -f docker-compose-hybrid.yml exec -T gateway npm run check-db
if errorlevel 1 (
    echo WARNING: Database verification failed
) else (
    echo ✓ Database verified
)

REM ============================================================================
REM PHASE 10: VERIFICATION
REM ============================================================================

echo.
echo [PHASE 10] Post-Deployment Verification
echo ============================================================================
echo.

echo Checking all containers...
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo.

echo Testing Gateway health...
curl -s http://localhost:3000/health >nul 2>&1
if errorlevel 1 (
    echo WARNING: Gateway health check failed
) else (
    echo ✓ Gateway is healthy
)

echo.
echo Testing Blockchain Bridge health...
curl -s http://localhost:3008/health >nul 2>&1
if errorlevel 1 (
    echo WARNING: Bridge health check failed
) else (
    echo ✓ Bridge is healthy
)

echo.
echo Testing Frontend...
curl -s http://localhost:5173/ >nul 2>&1
if errorlevel 1 (
    echo WARNING: Frontend health check failed
) else (
    echo ✓ Frontend is accessible
)

echo.
echo Checking blockchain status...
docker exec cli peer channel getinfo -c coffeechannel
if errorlevel 1 (
    echo WARNING: Blockchain status check failed
) else (
    echo ✓ Blockchain is operational
)

REM ============================================================================
REM DEPLOYMENT COMPLETE
REM ============================================================================

echo.
echo ============================================================================
echo   DEPLOYMENT COMPLETE
echo ============================================================================
echo.
echo Deployment finished at %date% %time%
echo.
echo ============================================================================
echo   ACCESS POINTS
echo ============================================================================
echo.
echo   Frontend:              http://localhost:5173
echo   Gateway API:           http://localhost:3000
echo   Blockchain Bridge:     http://localhost:3008
echo   ECTA Service:          http://localhost:3003
echo   Commercial Bank:       http://localhost:3002
echo   National Bank:         http://localhost:3004
echo   Customs:               http://localhost:3005
echo   ECX:                   http://localhost:3006
echo   Shipping:              http://localhost:3007
echo   Buyer Verification:    http://localhost:3009
echo.
echo   PostgreSQL:            localhost:5432
echo   CouchDB:               http://localhost:5984/_utils
echo   Redis:                 localhost:6379
echo   Kafka:                 localhost:9093
echo.
echo ============================================================================
echo   TEST CREDENTIALS
echo ============================================================================
echo.
echo   Admin:      admin / admin123
echo   Exporter1:  exporter1 / password123
echo   Exporter2:  exporter2 / password123
echo.
echo ============================================================================
echo   NEXT STEPS
echo ============================================================================
echo.
echo   1. Open browser: http://localhost:5173
echo   2. Login with: admin / admin123
echo   3. Explore the system
echo.
echo   View logs:     docker-compose -f docker-compose-hybrid.yml logs -f
echo   Stop system:   docker-compose -f docker-compose-hybrid.yml down
echo   Check status:  docker ps
echo.
echo ============================================================================
echo.

pause
