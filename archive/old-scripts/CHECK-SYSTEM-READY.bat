@echo off
REM ============================================================================
REM CHECK SYSTEM READINESS
REM Verify all prerequisites before running PRODUCTION-FABRIC-DEPLOY.bat
REM ============================================================================

echo.
echo ========================================
echo  SYSTEM READINESS CHECK
echo ========================================
echo.

set READY=1

REM ============================================================================
REM CHECK 1: Docker Running
REM ============================================================================

echo [1/10] Checking Docker...
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo   ✗ Docker is not running
    set READY=0
) else (
    echo   ✓ Docker is running
)

REM ============================================================================
REM CHECK 2: Orderers Running
REM ============================================================================

echo [2/10] Checking orderers...
set ORDERER_COUNT=0
for /f %%i in ('docker ps --filter "name=orderer" --filter "status=running" ^| find /c "orderer"') do set ORDERER_COUNT=%%i

if %ORDERER_COUNT% lss 3 (
    echo   ✗ Only %ORDERER_COUNT%/3 orderers running
    set READY=0
) else (
    echo   ✓ All 3 orderers running
)

REM ============================================================================
REM CHECK 3: Peers Running
REM ============================================================================

echo [3/10] Checking peers...
set PEER_COUNT=0
for /f %%i in ('docker ps --filter "name=peer" --filter "status=running" ^| find /c "peer"') do set PEER_COUNT=%%i

if %PEER_COUNT% lss 6 (
    echo   ✗ Only %PEER_COUNT%/6 peers running
    set READY=0
) else (
    echo   ✓ All 6 peers running
)

REM ============================================================================
REM CHECK 4: CLI Container
REM ============================================================================

echo [4/10] Checking CLI container...
docker ps --filter "name=cli" --filter "status=running" | find "cli" >nul 2>&1
if %errorlevel% neq 0 (
    echo   ✗ CLI container not running
    set READY=0
) else (
    echo   ✓ CLI container running
)

REM ============================================================================
REM CHECK 5: Gateway Service
REM ============================================================================

echo [5/10] Checking gateway service...
docker ps --filter "name=coffee-gateway" --filter "status=running" | find "coffee-gateway" >nul 2>&1
if %errorlevel% neq 0 (
    echo   ✗ Gateway service not running
    set READY=0
) else (
    echo   ✓ Gateway service running
)

REM ============================================================================
REM CHECK 6: PostgreSQL
REM ============================================================================

echo [6/10] Checking PostgreSQL...
docker ps --filter "name=coffee-postgres" --filter "status=running" | find "coffee-postgres" >nul 2>&1
if %errorlevel% neq 0 (
    echo   ✗ PostgreSQL not running
    set READY=0
) else (
    echo   ✓ PostgreSQL running
)

REM ============================================================================
REM CHECK 7: Crypto Materials
REM ============================================================================

echo [7/10] Checking crypto materials...
if not exist crypto-config\peerOrganizations\ecta.example.com\users\Admin@ecta.example.com\msp (
    echo   ✗ Crypto materials not found
    set READY=0
) else (
    echo   ✓ Crypto materials exist
)

REM ============================================================================
REM CHECK 8: Admin Wallet
REM ============================================================================

echo [8/10] Checking admin wallet...
docker exec coffee-gateway ls wallets/admin.id >nul 2>&1
if %errorlevel% neq 0 (
    echo   ✗ Admin wallet not found
    set READY=0
) else (
    echo   ✓ Admin wallet exists
)

REM ============================================================================
REM CHECK 9: Channel Artifacts Directory
REM ============================================================================

echo [9/10] Checking channel-artifacts directory...
if not exist channel-artifacts (
    echo   ⚠ Creating channel-artifacts directory...
    mkdir channel-artifacts
    echo   ✓ Directory created
) else (
    echo   ✓ Directory exists
)

REM ============================================================================
REM CHECK 10: Chaincode Directory
REM ============================================================================

echo [10/10] Checking chaincode...
docker exec cli ls /opt/gopath/src/github.com/hyperledger/fabric/chaincode/ecta/package.json >nul 2>&1
if %errorlevel% neq 0 (
    echo   ✗ Chaincode not accessible in CLI container
    set READY=0
) else (
    echo   ✓ Chaincode accessible
)

REM ============================================================================
REM SUMMARY
REM ============================================================================

echo.
echo ========================================
echo  READINESS SUMMARY
echo ========================================
echo.

if %READY% equ 1 (
    echo ✓ SYSTEM READY FOR DEPLOYMENT
    echo.
    echo All prerequisites met. You can now run:
    echo   ./PRODUCTION-FABRIC-DEPLOY.bat
    echo.
    echo This will:
    echo   1. Create channel using Channel Participation API
    echo   2. Join all orderers and peers
    echo   3. Deploy chaincode
    echo   4. Seed users to blockchain
    echo.
    echo Estimated time: 10-15 minutes
    echo.
) else (
    echo ✗ SYSTEM NOT READY
    echo.
    echo Please fix the issues above before running deployment.
    echo.
    echo Common fixes:
    echo   - Start Docker Desktop
    echo   - Run: docker-compose -f docker-compose-fabric.yml up -d
    echo   - Run: docker-compose -f docker-compose-hybrid.yml up -d
    echo   - Generate crypto: docker run --rm -v "%CD%":/work -w /work hyperledger/fabric-tools:2.5 cryptogen generate --config=crypto-config.yaml --output=crypto-config
    echo   - Enroll admin: docker exec coffee-gateway node src/scripts/enrollAdminFromCrypto.js
    echo.
)

echo ========================================
echo.

if %READY% equ 1 (
    echo Press any key to run PRODUCTION-FABRIC-DEPLOY.bat...
    pause >nul
    call PRODUCTION-FABRIC-DEPLOY.bat
) else (
    pause
)

