@echo off
echo ========================================
echo COFFEE EXPORT HYBRID SYSTEM
echo Complete Shutdown
echo ========================================
echo.

echo [1/4] Stopping Frontend Dev Server...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)
echo   Done

echo [2/4] Stopping all hybrid services...
docker-compose -f docker-compose-hybrid.yml down
echo   Done

echo [3/4] Stopping Fabric network...
docker-compose -f docker-compose-fabric.yml down
echo   Done

echo [4/4] Cleaning up networks...
docker network rm coffee-export-network 2>nul
docker network rm fabric-network 2>nul
echo   Done

echo.
echo ========================================
echo HYBRID SYSTEM STOPPED
echo ========================================
echo.
echo All services have been stopped:
echo   - Fabric Network (Peers, Orderers, CouchDB)
echo   - Chaincode Server
echo   - Gateway API
echo   - Blockchain Bridge
echo   - All CBC Services
echo   - Infrastructure (Postgres, Redis, Kafka)
echo   - Frontend Dev Server
echo.
echo To restart: START-HYBRID.bat
echo.
pause
