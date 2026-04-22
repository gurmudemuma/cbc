@echo off
REM ============================================================================
REM Deployment Status Check Script
REM ============================================================================

echo.
echo ============================================================================
echo   COFFEE EXPORT BLOCKCHAIN - DEPLOYMENT STATUS
echo ============================================================================
echo.

REM Check Docker
echo [1/10] Checking Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not available
) else (
    echo ✓ Docker is running
)

REM Check Fabric Network
echo.
echo [2/10] Checking Fabric Network...
docker ps --filter "network=fabric-network" --format "{{.Names}}" | find "orderer" >nul 2>&1
if errorlevel 1 (
    echo ❌ Fabric network is not running
) else (
    echo ✓ Fabric network is running
    docker ps --filter "network=fabric-network" --format "  - {{.Names}}: {{.Status}}"
)

REM Check Blockchain Channel
echo.
echo [3/10] Checking Blockchain Channel...
docker exec cli peer channel list 2>nul | findstr "coffeechannel" >nul
if errorlevel 1 (
    echo ❌ Channel not created
) else (
    echo ✓ Channel exists: coffeechannel
)

REM Check Chaincode
echo.
echo [4/10] Checking Chaincode...
docker exec cli peer lifecycle chaincode querycommitted --channelID coffeechannel --name ecta 2>nul | findstr "Version" >nul
if errorlevel 1 (
    echo ❌ Chaincode not deployed
) else (
    echo ✓ Chaincode deployed
    docker exec cli peer lifecycle chaincode querycommitted --channelID coffeechannel --name ecta 2>nul | findstr "Version"
)

REM Check PostgreSQL
echo.
echo [5/10] Checking PostgreSQL...
docker ps --filter "name=coffee-postgres" --format "{{.Status}}" | find "Up" >nul 2>&1
if errorlevel 1 (
    echo ❌ PostgreSQL is not running
) else (
    echo ✓ PostgreSQL is running
)

REM Check Gateway
echo.
echo [6/10] Checking Gateway Service...
curl -s http://localhost:3000/health >nul 2>&1
if errorlevel 1 (
    echo ❌ Gateway is not responding
) else (
    echo ✓ Gateway is healthy
)

REM Check Blockchain Bridge
echo.
echo [7/10] Checking Blockchain Bridge...
curl -s http://localhost:3008/health >nul 2>&1
if errorlevel 1 (
    echo ❌ Bridge is not responding
) else (
    echo ✓ Bridge is healthy
)

REM Check CBC Services
echo.
echo [8/10] Checking CBC Services...
docker ps --filter "name=coffee-ecta" --format "{{.Status}}" | find "Up" >nul 2>&1
if errorlevel 1 (
    echo ❌ ECTA Service is not running
) else (
    echo ✓ ECTA Service is running
)

REM Check Frontend
echo.
echo [9/10] Checking Frontend...
curl -s http://localhost:5173/ >nul 2>&1
if errorlevel 1 (
    echo ❌ Frontend is not accessible
) else (
    echo ✓ Frontend is accessible
)

REM Check All Containers
echo.
echo [10/10] Container Summary...
echo.
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | findstr /V "NAMES"
echo.

REM Summary
echo.
echo ============================================================================
echo   SUMMARY
echo ============================================================================
echo.

set /a total=0
set /a running=0

for /f %%i in ('docker ps -q') do set /a running+=1
for /f %%i in ('docker ps -aq') do set /a total+=1

echo Total Containers: %total%
echo Running: %running%
echo.

if %running% GEQ 20 (
    echo ✓ System appears to be fully deployed
) else (
    echo ⚠ Some services may not be running
)

echo.
echo ============================================================================
echo   ACCESS POINTS
echo ============================================================================
echo.
echo   Frontend:    http://localhost:5173
echo   Gateway:     http://localhost:3000
echo   Bridge:      http://localhost:3008
echo   CouchDB:     http://localhost:5984/_utils
echo.
echo ============================================================================
echo.

pause
