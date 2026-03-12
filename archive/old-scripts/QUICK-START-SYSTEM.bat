@echo off
REM ============================================================================
REM QUICK START SYSTEM - Fast startup with automatic fixes
REM ============================================================================

echo.
echo ========================================
echo  QUICK START SYSTEM
echo ========================================
echo.

REM Check if crypto materials exist
if not exist crypto-config\peerOrganizations (
    echo Crypto materials missing. Generating...
    echo.
    
    REM Check for cryptogen
    where cryptogen >nul 2>&1
    if %errorlevel% neq 0 (
        echo ERROR: Fabric binaries not installed!
        echo.
        echo Please run: powershell -ExecutionPolicy Bypass -File scripts\setup-fabric-binaries.ps1
        echo.
        pause
        exit /b 1
    )
    
    REM Generate crypto
    echo Generating crypto materials...
    cryptogen generate --config=crypto-config.yaml --output=crypto-config
    
    REM Generate genesis block
    echo Generating genesis block...
    set FABRIC_CFG_PATH=%CD%\config
    if not exist channel-artifacts mkdir channel-artifacts
    configtxgen -profile OrdererGenesis -channelID system-channel -outputBlock channel-artifacts\genesis.block
    
    echo ✓ Crypto materials generated
    echo.
)

echo Starting Fabric network...
docker-compose -f docker-compose-fabric.yml up -d

echo.
echo Waiting for Fabric to stabilize (15 seconds)...
timeout /t 15 /nobreak >nul

echo.
echo Starting application services...
docker-compose -f docker-compose-hybrid.yml up -d

echo.
echo Waiting for services (15 seconds)...
timeout /t 15 /nobreak >nul

echo.
echo Enrolling admin...
docker exec coffee-gateway node src/scripts/enrollAdmin.js 2>nul

echo.
echo Creating users...
docker exec coffee-gateway node src/scripts/seedUsers.js

echo.
echo ========================================
echo  SYSTEM STARTED!
echo ========================================
echo.
echo   Frontend: http://localhost:5173
echo   Login: admin / admin123
echo.
echo Opening browser...
timeout /t 2 /nobreak >nul
start http://localhost:5173

pause
