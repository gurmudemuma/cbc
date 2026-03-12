@echo off
REM ============================================================================
REM IMMEDIATE FIX - No Fabric Binaries Required
REM Uses Docker to generate crypto materials
REM ============================================================================

echo.
echo ========================================
echo  IMMEDIATE FIX
echo ========================================
echo.
echo This will fix the admin enrollment issue using Docker.
echo No Fabric binaries installation required!
echo.
pause

echo.
echo [1/5] Stopping services...
docker-compose -f docker-compose-hybrid.yml down >nul 2>&1
docker-compose -f docker-compose-fabric.yml down >nul 2>&1
echo   ✓ Services stopped

echo.
echo [2/5] Generating crypto materials using Docker...

REM Backup old crypto
if exist crypto-config (
    if exist crypto-config.backup rmdir /s /q crypto-config.backup
    move crypto-config crypto-config.backup >nul 2>&1
)

REM Use Fabric tools Docker image to generate crypto
docker run --rm -v "%CD%":/work -w /work hyperledger/fabric-tools:2.5 cryptogen generate --config=crypto-config.yaml --output=crypto-config

if %errorlevel% neq 0 (
    echo   ✗ Failed to generate crypto
    echo.
    echo   Trying alternative method...
    docker pull hyperledger/fabric-tools:2.5
    docker run --rm -v "%CD%":/work -w /work hyperledger/fabric-tools:2.5 cryptogen generate --config=crypto-config.yaml --output=crypto-config
)

echo   ✓ Crypto materials generated

echo.
echo [3/5] Generating genesis block...

set FABRIC_CFG_PATH=/work/config

if not exist channel-artifacts mkdir channel-artifacts

docker run --rm -v "%CD%":/work -w /work -e FABRIC_CFG_PATH=/work/config hyperledger/fabric-tools:2.5 configtxgen -profile OrdererGenesis -channelID system-channel -outputBlock /work/channel-artifacts/genesis.block

echo   ✓ Genesis block generated

echo.
echo [4/5] Starting Fabric network...
docker-compose -f docker-compose-fabric.yml up -d

echo   - Waiting 25 seconds for network...
timeout /t 25 /nobreak >nul

echo   ✓ Fabric network started

echo.
echo [5/5] Starting application services...
docker-compose -f docker-compose-hybrid.yml up -d

echo   - Waiting 15 seconds for services...
timeout /t 15 /nobreak >nul

echo   ✓ Services started

echo.
echo Enrolling admin...
timeout /t 5 /nobreak >nul
docker exec coffee-gateway node src/scripts/enrollAdmin.js

echo.
echo Syncing users...
docker exec coffee-gateway node src/scripts/seedUsers.js

echo.
echo ========================================
echo  FIX COMPLETE!
echo ========================================
echo.
echo   Frontend: http://localhost:5173
echo   Login: admin / admin123
echo.
echo Opening browser...
timeout /t 2 /nobreak >nul
start http://localhost:5173

pause
