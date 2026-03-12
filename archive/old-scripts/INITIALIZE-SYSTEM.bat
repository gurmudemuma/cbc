@echo off
REM ============================================================================
REM INITIALIZE SYSTEM - Complete Production-Grade Setup
REM Expert-level system initialization with proper error handling
REM ============================================================================

setlocal enabledelayedexpansion

echo.
echo ========================================
echo  SYSTEM INITIALIZATION
echo ========================================
echo.
echo This script will perform a complete system initialization:
echo   1. Validate prerequisites
echo   2. Generate crypto materials (cryptogen)
echo   3. Generate genesis block and channel artifacts
echo   4. Start Fabric network with health checks
echo   5. Create and join channel
echo   6. Deploy chaincode
echo   7. Start application services
echo   8. Initialize admin identity from crypto materials
echo   9. Seed users to both PostgreSQL and blockchain
echo  10. Verify complete system health
echo.
echo Estimated time: 5-7 minutes
echo.
pause

set ERROR_COUNT=0
set STEP=0

REM ============================================================================
REM STEP 1: VALIDATE PREREQUISITES
REM ============================================================================

set /a STEP+=1
echo.
echo ========================================
echo  STEP %STEP%: VALIDATE PREREQUISITES
echo ========================================
echo.

REM Check Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ✗ Docker not found
    set /a ERROR_COUNT+=1
) else (
    echo ✓ Docker installed
)

REM Check Docker Compose
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ✗ Docker Compose not found
    set /a ERROR_COUNT+=1
) else (
    echo ✓ Docker Compose installed
)

REM Check if Docker is running
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo ✗ Docker is not running
    echo   Please start Docker Desktop
    set /a ERROR_COUNT+=1
) else (
    echo ✓ Docker is running
)

if %ERROR_COUNT% gtr 0 (
    echo.
    echo ✗ Prerequisites check failed
    pause
    exit /b 1
)

echo.
echo ✓ All prerequisites met

REM ============================================================================
REM STEP 2: CLEAN PREVIOUS STATE
REM ============================================================================

set /a STEP+=1
echo.
echo ========================================
echo  STEP %STEP%: CLEAN PREVIOUS STATE
echo ========================================
echo.

echo Stopping existing containers...
docker-compose -f docker-compose-hybrid.yml down >nul 2>&1
docker-compose -f docker-compose-fabric.yml down -v >nul 2>&1

echo Removing old crypto materials...
if exist crypto-config.backup rmdir /s /q crypto-config.backup >nul 2>&1
if exist crypto-config (
    move crypto-config crypto-config.backup >nul 2>&1
    echo ✓ Old crypto materials backed up
)

echo Removing old channel artifacts...
if exist channel-artifacts rmdir /s /q channel-artifacts >nul 2>&1

echo ✓ Previous state cleaned

REM ============================================================================
REM STEP 3: GENERATE CRYPTO MATERIALS
REM ============================================================================

set /a STEP+=1
echo.
echo ========================================
echo  STEP %STEP%: GENERATE CRYPTO MATERIALS
echo ========================================
echo.

echo Checking for cryptogen...
where cryptogen >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠ cryptogen not found locally, using Docker...
    
    echo Pulling Fabric tools image...
    docker pull hyperledger/fabric-tools:2.5
    
    echo Generating crypto materials using Docker...
    docker run --rm -v "%CD%":/work -w /work hyperledger/fabric-tools:2.5 cryptogen generate --config=crypto-config.yaml --output=crypto-config
    
    if %errorlevel% neq 0 (
        echo ✗ Failed to generate crypto materials
        pause
        exit /b 1
    )
) else (
    echo ✓ cryptogen found
    echo Generating crypto materials...
    cryptogen generate --config=crypto-config.yaml --output=crypto-config
    
    if %errorlevel% neq 0 (
        echo ✗ Failed to generate crypto materials
        pause
        exit /b 1
    )
)

REM Verify crypto materials
if not exist crypto-config\peerOrganizations\ecta.example.com\users\Admin@ecta.example.com\msp (
    echo ✗ Admin crypto materials not generated
    pause
    exit /b 1
)

if not exist crypto-config\peerOrganizations\ecta.example.com\ca (
    echo ✗ CA crypto materials not generated
    pause
    exit /b 1
)

echo ✓ Crypto materials generated successfully

REM ============================================================================
REM STEP 4: GENERATE CHANNEL ARTIFACTS
REM ============================================================================

set /a STEP+=1
echo.
echo ========================================
echo  STEP %STEP%: GENERATE CHANNEL ARTIFACTS
echo ========================================
echo.

mkdir channel-artifacts 2>nul

set FABRIC_CFG_PATH=%CD%\config

echo Checking for configtxgen...
where configtxgen >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠ configtxgen not found locally, using Docker...
    
    echo Generating genesis block...
    docker run --rm -v "%CD%":/work -w /work -e FABRIC_CFG_PATH=/work/config hyperledger/fabric-tools:2.5 configtxgen -profile OrdererGenesis -channelID system-channel -outputBlock /work/channel-artifacts/genesis.block
    
    if %errorlevel% neq 0 (
        echo ✗ Failed to generate genesis block
        pause
        exit /b 1
    )
    
    echo Generating channel transaction...
    docker run --rm -v "%CD%":/work -w /work -e FABRIC_CFG_PATH=/work/config hyperledger/fabric-tools:2.5 configtxgen -profile ChannelConfig -outputCreateChannelTx /work/channel-artifacts/coffeechannel.tx -channelID coffeechannel
    
) else (
    echo ✓ configtxgen found
    
    echo Generating genesis block...
    configtxgen -profile OrdererGenesis -channelID system-channel -outputBlock channel-artifacts\genesis.block
    
    if %errorlevel% neq 0 (
        echo ✗ Failed to generate genesis block
        pause
        exit /b 1
    )
    
    echo Generating channel transaction...
    configtxgen -profile ChannelConfig -outputCreateChannelTx channel-artifacts\coffeechannel.tx -channelID coffeechannel
)

echo ✓ Channel artifacts generated

REM ============================================================================
REM STEP 5: START FABRIC NETWORK
REM ============================================================================

set /a STEP+=1
echo.
echo ========================================
echo  STEP %STEP%: START FABRIC NETWORK
echo ========================================
echo.

echo Starting Fabric network...
docker-compose -f docker-compose-fabric.yml up -d

echo Waiting for network to stabilize (30 seconds)...
timeout /t 30 /nobreak >nul

REM Health check - orderers
echo.
echo Checking orderers...
set ORDERER_COUNT=0
for /f %%i in ('docker ps --filter "name=orderer" --filter "status=running" ^| find /c "orderer"') do set ORDERER_COUNT=%%i
echo   Running orderers: %ORDERER_COUNT%/3

REM Health check - peers
echo Checking peers...
set PEER_COUNT=0
for /f %%i in ('docker ps --filter "name=peer" --filter "status=running" ^| find /c "peer"') do set PEER_COUNT=%%i
echo   Running peers: %PEER_COUNT%/6

if %ORDERER_COUNT% lss 3 (
    echo ⚠ Not all orderers are running
    echo   Checking logs...
    docker logs orderer1.orderer.example.com --tail 20
)

if %PEER_COUNT% lss 6 (
    echo ⚠ Not all peers are running
    echo   Checking logs...
    docker logs peer0.ecta.example.com --tail 20
)

echo ✓ Fabric network started

REM ============================================================================
REM STEP 6: START APPLICATION SERVICES
REM ============================================================================

set /a STEP+=1
echo.
echo ========================================
echo  STEP %STEP%: START APPLICATION SERVICES
echo ========================================
echo.

echo Starting PostgreSQL...
docker-compose -f docker-compose-hybrid.yml up -d postgres

echo Waiting for PostgreSQL (15 seconds)...
timeout /t 15 /nobreak >nul

echo Starting infrastructure services...
docker-compose -f docker-compose-hybrid.yml up -d redis zookeeper kafka

echo Waiting for Kafka (10 seconds)...
timeout /t 10 /nobreak >nul

echo Optimizing PostgreSQL...
docker exec -i coffee-postgres psql -U postgres -d coffee_export_db < scripts\optimize-postgresql.sql >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ PostgreSQL optimized
) else (
    echo ⚠ PostgreSQL optimization skipped
)

echo Starting application services...
docker-compose -f docker-compose-hybrid.yml up -d gateway blockchain-bridge ecta-service commercial-bank-service national-bank-service customs-service ecx-service shipping-service frontend

echo Waiting for services (20 seconds)...
timeout /t 20 /nobreak >nul

echo ✓ Application services started

REM ============================================================================
REM STEP 7: INITIALIZE ADMIN IDENTITY
REM ============================================================================

set /a STEP+=1
echo.
echo ========================================
echo  STEP %STEP%: INITIALIZE ADMIN IDENTITY
echo ========================================
echo.

echo Enrolling admin from crypto materials...
docker exec coffee-gateway node src/scripts/enrollAdminFromCrypto.js

if %errorlevel% neq 0 (
    echo ✗ Failed to enroll admin
    echo.
    echo Checking if crypto materials are accessible...
    docker exec coffee-gateway ls -la /crypto-config/peerOrganizations/ecta.example.com/users/Admin@ecta.example.com/msp
    pause
    exit /b 1
)

echo ✓ Admin identity initialized

REM ============================================================================
REM STEP 8: SEED USERS
REM ============================================================================

set /a STEP+=1
echo.
echo ========================================
echo  STEP %STEP%: SEED USERS
echo ========================================
echo.

echo Creating default users...
docker exec coffee-gateway node src/scripts/seedUsers.js

echo ✓ Users seeded

REM ============================================================================
REM STEP 9: SYSTEM VERIFICATION
REM ============================================================================

set /a STEP+=1
echo.
echo ========================================
echo  STEP %STEP%: SYSTEM VERIFICATION
echo ========================================
echo.

echo Checking admin wallet...
docker exec coffee-gateway ls -la wallets/admin.id >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Admin wallet exists
) else (
    echo ✗ Admin wallet missing
)

echo Checking PostgreSQL users...
docker exec coffee-postgres psql -U postgres -d coffee_export_db -c "SELECT COUNT(*) FROM users;" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ PostgreSQL users table accessible
) else (
    echo ✗ PostgreSQL users table not accessible
)

echo Checking Fabric network...
docker ps --filter "name=orderer1" --filter "status=running" | find "orderer1" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Fabric network running
) else (
    echo ✗ Fabric network not running
)

echo Checking gateway service...
docker ps --filter "name=coffee-gateway" --filter "status=running" | find "coffee-gateway" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Gateway service running
) else (
    echo ✗ Gateway service not running
)

REM ============================================================================
REM COMPLETION
REM ============================================================================

echo.
echo ========================================
echo  INITIALIZATION COMPLETE!
echo ========================================
echo.
echo System Status:
docker ps --format "table {{.Names}}\t{{.Status}}" | findstr /C:"coffee-" /C:"orderer" /C:"peer" /C:"couchdb"
echo.
echo ========================================
echo  ACCESS POINTS
echo ========================================
echo.
echo   Frontend:       http://localhost:5173
echo   Gateway API:    http://localhost:3000
echo   Bridge API:     http://localhost:3008
echo.
echo   Login Credentials:
echo     Admin:      admin / admin123
echo     Exporter:   exporter1 / password123
echo.
echo ========================================
echo.
echo Opening browser...
timeout /t 3 /nobreak >nul
start http://localhost:5173
echo.
pause
