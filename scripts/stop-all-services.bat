@echo off
REM Coffee Export System - Stop All Services Script (Windows)

echo.
echo ==========================================
echo Stopping All Coffee Export Services
echo ==========================================
echo.

echo Stopping application services...
docker-compose -f docker-compose-hybrid.yml down

echo Stopping blockchain network...
docker-compose -f docker-compose-fabric.yml down

echo Cleaning up volumes (optional - preserves data)...
REM Uncomment the next line to remove all data volumes
REM docker volume prune -f

echo Cleaning up networks...
docker network rm fabric-network 2>nul

echo.
echo [OK] All services stopped
echo.

echo To restart:
echo   Hybrid mode:     scripts\start-system.bat
echo   Full blockchain: scripts\start-full-blockchain.bat
echo.