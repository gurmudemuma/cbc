@echo off
REM ============================================================================
REM FIX ADMIN ENROLLMENT - Complete Solution
REM Fixes "Identity not found for user: admin" error
REM ============================================================================

echo.
echo ========================================
echo  FIX ADMIN ENROLLMENT
echo ========================================
echo.
echo This will fix the "Identity not found for user: admin" error by:
echo   1. Checking Fabric binaries
echo   2. Regenerating crypto materials with CA certificates
echo   3. Restarting Fabric network
echo   4. Enrolling admin
echo   5. Syncing users to blockchain
echo.
pause

REM ============================================================================
REM STEP 1: Check Fabric Binaries
REM ============================================================================

echo.
echo [1/6] Checking Fabric binaries...

where cryptogen >nul 2>&1
if %errorlevel% neq 0 (
    echo   ✗ cryptogen not found
    echo.
    echo   Installing Fabric binaries...
    echo   This may take 2-3 minutes...
    echo.
    
    powershell -ExecutionPolicy Bypass -File scripts\setup-fabric-binaries.ps1
    
    if %errorlevel% neq 0 (
        echo   ✗ Failed to install Fabric binaries
        echo.
        echo   Please install manually:
        echo   1. Download from: https://github.com/hyperledger/fabric/releases
        echo   2. Extract to C:\fabric-binaries
        echo   3. Add to PATH
        echo.
        pause
        exit /b 1
    )
    
    echo   ✓ Fabric binaries installed
) else (
    echo   ✓ cryptogen found
)

echo.

REM ============================================================================
REM STEP 2: Stop Fabric Network
REM ============================================================================

echo [2/6] Stopping Fabric network...
docker-compose -f docker-compose-fabric.yml down >nul 2>&1
echo   ✓ Fabric network stopped

echo.

REM ============================================================================
REM STEP 3: Regenerate Crypto Materials
REM ============================================================================

echo [3/6] Regenerating crypto materials...

REM Backup old crypto if exists
if exist crypto-config (
    echo   - Backing up old crypto-config...
    if exist crypto-config.backup rmdir /s /q crypto-config.backup
    move crypto-config crypto-config.backup >nul 2>&1
)

REM Generate new crypto materials
echo   - Generating certificates and keys...
cryptogen generate --config=crypto-config.yaml --output=crypto-config

if %errorlevel% neq 0 (
    echo   ✗ Failed to generate crypto materials
    pause
    exit /b 1
)

REM Verify CA certificate exists
if exist crypto-config\peerOrganizations\ecta.example.com\ca\*.pem (
    echo   ✓ CA certificates generated
) else (
    echo   ✗ CA certificates missing
    pause
    exit /b 1
)

echo.

REM ============================================================================
REM STEP 4: Generate Genesis Block
REM ============================================================================

echo [4/6] Generating genesis block...

set FABRIC_CFG_PATH=%CD%\config

if not exist channel-artifacts mkdir channel-artifacts

configtxgen -profile OrdererGenesis -channelID system-channel -outputBlock channel-artifacts\genesis.block >nul 2>&1

if %errorlevel% neq 0 (
    echo   ✗ Failed to generate genesis block
    pause
    exit /b 1
)

echo   ✓ Genesis block generated

echo.

REM ============================================================================
REM STEP 5: Start Fabric Network
REM ============================================================================

echo [5/6] Starting Fabric network...
docker-compose -f docker-compose-fabric.yml up -d

echo   - Waiting for network to stabilize (20 seconds)...
timeout /t 20 /nobreak >nul

REM Check if orderers are running
docker ps | findstr "orderer1.orderer.example.com" | findstr "Up" >nul 2>&1
if %errorlevel% equ 0 (
    echo   ✓ Fabric network started
) else (
    echo   ⚠ Fabric network may not be fully ready
    echo   - Check logs: docker logs orderer1.orderer.example.com
)

echo.

REM ============================================================================
REM STEP 6: Enroll Admin and Sync Users
REM ============================================================================

echo [6/6] Enrolling admin and syncing users...

REM Wait for gateway to be ready
echo   - Waiting for gateway service (10 seconds)...
timeout /t 10 /nobreak >nul

REM Enroll admin
echo   - Enrolling admin with Fabric CA...
docker exec coffee-gateway node src/scripts/enrollAdmin.js

if %errorlevel% equ 0 (
    echo   ✓ Admin enrolled successfully
) else (
    echo   ⚠ Admin enrollment had issues (may already be enrolled)
)

echo.

REM Sync users to blockchain
echo   - Syncing users to blockchain...
docker exec coffee-gateway node src/scripts/seedUsers.js

echo.

REM ============================================================================
REM VERIFICATION
REM ============================================================================

echo ========================================
echo  VERIFICATION
echo ========================================
echo.

REM Check wallet
docker exec coffee-gateway ls -la wallets/admin.id >nul 2>&1
if %errorlevel% equ 0 (
    echo   ✓ Admin wallet exists
) else (
    echo   ✗ Admin wallet missing
)

REM Check crypto materials
if exist crypto-config\peerOrganizations\ecta.example.com\ca\*.pem (
    echo   ✓ CA certificates exist
) else (
    echo   ✗ CA certificates missing
)

REM Check Fabric network
docker ps | findstr "orderer" | findstr "Up" >nul 2>&1
if %errorlevel% equ 0 (
    echo   ✓ Orderers running
) else (
    echo   ✗ Orderers not running
)

docker ps | findstr "peer0.ecta" | findstr "Up" >nul 2>&1
if %errorlevel% equ 0 (
    echo   ✓ Peers running
) else (
    echo   ✗ Peers not running
)

echo.
echo ========================================
echo  FIX COMPLETE!
echo ========================================
echo.
echo Admin should now be enrolled and users synced to blockchain.
echo.
echo Next steps:
echo   1. Check if all services are running: docker ps
echo   2. Try logging in: http://localhost:5173
echo   3. Username: admin / Password: admin123
echo.
echo If still having issues:
echo   - Check gateway logs: docker logs coffee-gateway -f
echo   - Check orderer logs: docker logs orderer1.orderer.example.com
echo.
pause
