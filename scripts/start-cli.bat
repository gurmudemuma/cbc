@echo off
REM Start Fabric CLI Container
REM Used for manual blockchain operations like channel creation, chaincode deployment, etc.

setlocal enabledelayedexpansion

echo.
echo ==========================================
echo Fabric CLI - Interactive Container
echo ==========================================
echo.

REM Check if Docker is running
echo Checking Docker...
docker ps >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Please start Docker first.
    exit /b 1
)
echo [OK] Docker is running
echo.

REM Start CLI container
echo Starting Fabric CLI container...
docker-compose -f docker-compose-fabric.yml up cli

echo.
echo [OK] CLI container started
echo.

endlocal
