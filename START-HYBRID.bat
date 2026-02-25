@echo off
setlocal enabledelayedexpansion

echo ========================================
echo COFFEE EXPORT HYBRID SYSTEM
echo Complete Startup with Business Types
echo ========================================
echo.
echo This will start:
echo   BLOCKCHAIN LAYER:
echo     - Hyperledger Fabric (Peers, Orderers, CouchDB)
echo     - Chaincode Server (Port 3001)
echo.
echo   APPLICATION LAYER:
echo     - PostgreSQL Database
echo     - Redis Cache
echo     - Kafka Message Broker
echo     - Gateway API (Port 3000)
echo     - Blockchain Bridge (Port 3008)
echo     - CBC Services (ECTA, Bank, NBE, Customs, ECX, Shipping)
echo.
echo   FRONTEND:
echo     - Dev Server (Port 5173) with Business Types
echo.
echo Estimated time: 3-4 minutes
echo.
pause

REM ============================================
REM STEP 1: Clean up
REM ============================================
echo.
echo [1/7] Cleaning up existing containers...
docker-compose -f docker-compose-fabric.yml down 2>nul
docker-compose -f docker-compose-hybrid.yml down 2>nul
docker stop coffee-gateway 2>nul
docker rm coffee-gateway 2>nul
docker stop coffee-chaincode 2>nul
docker rm coffee-chaincode 2>nul
echo   Done

REM ============================================
REM STEP 2: Start Fabric Network
REM ============================================
echo.
echo [2/7] Starting Hyperledger Fabric network...
echo   Starting 3 Orderers, 6 Peers, 6 CouchDB instances...
docker-compose -f docker-compose-fabric.yml up -d
if errorlevel 1 (
    echo   ERROR: Failed to start Fabric network
    pause
    exit /b 1
)
echo   Waiting for Fabric to stabilize (20 seconds)...
timeout /t 20 /nobreak >nul
echo   Done

REM ============================================
REM STEP 3: Start Infrastructure Services
REM ============================================
echo.
echo [3/7] Starting infrastructure services...
echo   - PostgreSQL (Port 5432)
echo   - Redis (Port 6379)
echo   - Zookeeper + Kafka (Ports 2181, 9092)
docker-compose -f docker-compose-hybrid.yml up -d postgres redis zookeeper kafka
if errorlevel 1 (
    echo   ERROR: Failed to start infrastructure
    pause
    exit /b 1
)
echo   Waiting for infrastructure to be ready (15 seconds)...
timeout /t 15 /nobreak >nul
echo   Done

REM ============================================
REM STEP 4: Start Chaincode Server
REM ============================================
echo.
echo [4/7] Starting Chaincode Server...
docker-compose -f docker-compose-hybrid.yml up -d chaincode-server
if errorlevel 1 (
    echo   ERROR: Failed to start chaincode server
    pause
    exit /b 1
)

REM Connect chaincode to both networks
echo   Connecting chaincode to fabric-network...
docker network connect fabric-network coffee-chaincode 2>nul
echo   Waiting for chaincode to be healthy (15 seconds)...
timeout /t 15 /nobreak >nul
echo   Done

REM ============================================
REM STEP 5: Build and Start Gateway with Business Types
REM ============================================
echo.
echo [5/7] Building and starting Gateway with Business Types...
docker-compose -f docker-compose-hybrid.yml build gateway
if errorlevel 1 (
    echo   ERROR: Failed to build gateway
    pause
    exit /b 1
)

docker-compose -f docker-compose-hybrid.yml up -d gateway
if errorlevel 1 (
    echo   ERROR: Failed to start gateway
    pause
    exit /b 1
)

REM Connect gateway to fabric network
echo   Connecting gateway to fabric-network...
docker network connect fabric-network coffee-gateway 2>nul
echo   Waiting for gateway to be healthy (20 seconds)...
timeout /t 20 /nobreak >nul
echo   Done

REM ============================================
REM STEP 6: Start All CBC Services + Bridge
REM ============================================
echo.
echo [6/7] Starting CBC services and blockchain bridge...
echo   - Blockchain Bridge (Port 3008)
echo   - ECTA Service (Port 3003)
echo   - Commercial Bank (Port 3002)
echo   - National Bank (Port 3004)
echo   - Customs (Port 3005)
echo   - ECX (Port 3006)
echo   - Shipping (Port 3007)
docker-compose -f docker-compose-hybrid.yml up -d blockchain-bridge ecta-service commercial-bank-service national-bank-service customs-service ecx-service shipping-service
if errorlevel 1 (
    echo   WARNING: Some CBC services may have failed to start
)
echo   Waiting for services to initialize (15 seconds)...
timeout /t 15 /nobreak >nul
echo   Done

REM ============================================
REM STEP 7: Build and Start Frontend with Business Types
REM ============================================
echo.
echo [7/7] Building and starting Frontend with Business Types...
echo   This will build a fresh Docker image with the latest code
docker-compose -f docker-compose-hybrid.yml build frontend
if errorlevel 1 (
    echo   WARNING: Frontend build had issues
)
docker-compose -f docker-compose-hybrid.yml up -d frontend
if errorlevel 1 (
    echo   WARNING: Frontend failed to start
)
echo   Waiting for frontend to be ready (15 seconds)...
timeout /t 15 /nobreak >nul
echo   Done

REM ============================================
REM Verification
REM ============================================
echo.
echo ========================================
echo VERIFYING SERVICES
echo ========================================
echo.

docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" --filter "name=coffee-" --filter "name=peer0.ecta"

echo.
echo ========================================
echo HYBRID SYSTEM READY!
echo ========================================
echo.
echo BLOCKCHAIN LAYER:
echo   Fabric Network:  Running (fabric-network)
echo   Chaincode:       http://localhost:3001
echo.
echo APPLICATION LAYER:
echo   Gateway API:     http://localhost:3000
echo   Blockchain Bridge: http://localhost:3008
echo   PostgreSQL:      localhost:5432
echo   Redis:           localhost:6379
echo   Kafka:           localhost:9092
echo.
echo CBC SERVICES:
echo   ECTA:            http://localhost:3003
echo   Commercial Bank: http://localhost:3002
echo   National Bank:   http://localhost:3004
echo   Customs:         http://localhost:3005
echo   ECX:             http://localhost:3006
echo   Shipping:        http://localhost:3007
echo.
echo FRONTEND:
echo   Dev Server:      http://localhost:5173
echo.
echo ========================================
echo BUSINESS TYPES REGISTRATION
echo ========================================
echo.
echo The system now supports 4 business types:
echo.
echo   1. Private Limited Company
echo      Minimum Capital: 50,000,000 ETB
echo.
echo   2. Union/Cooperative
echo      Minimum Capital: 15,000,000 ETB
echo.
echo   3. Individual Exporter
echo      Minimum Capital: 10,000,000 ETB
echo.
echo   4. Farmer Cooperative
echo      Minimum Capital: 5,000,000 ETB
echo.
echo HOW TO REGISTER:
echo   1. Go to http://localhost:5173
echo   2. Click "Register here"
echo   3. Fill account info (username, email, password)
echo   4. Click "Next"
echo   5. SELECT YOUR BUSINESS TYPE from dropdown
echo   6. Fill business details
echo   7. Submit - system uses correct capital automatically
echo.
echo TEST CREDENTIALS:
echo   ECTA Admin:  admin / admin123
echo   Exporter:    exporter1 / password123
echo.
echo TROUBLESHOOTING:
echo   View Gateway logs:    docker logs coffee-gateway --tail 50
echo   View Chaincode logs:  docker logs coffee-chaincode --tail 50
echo   View Bridge logs:     docker logs coffee-bridge --tail 50
echo   Check all services:   docker ps
echo.
echo TO STOP EVERYTHING:
echo   STOP-HYBRID.bat
echo.
pause

REM Open browser
start http://localhost:5173

echo.
echo Browser opened! You should see the login page with business type registration.
echo.
echo IMPORTANT: If you see old code without business types:
echo   1. Press Ctrl + Shift + R to hard refresh
echo   2. Or open Incognito window
echo.
pause
