@echo off
REM Start Hyperledger Fabric Network for Coffee Export Consortium
REM This script starts the complete Fabric network with all organizations

echo ========================================
echo Starting Fabric Network
echo ========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

echo Step 1: Cleaning up old containers and volumes...
docker-compose -f docker-compose-fabric.yml down -v
docker volume prune -f

echo.
echo Step 2: Starting Fabric network containers...
docker-compose -f docker-compose-fabric.yml up -d

echo.
echo Step 3: Waiting for containers to be ready...
timeout /t 10 /nobreak >nul

echo.
echo Step 4: Checking container status...
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo.
echo ========================================
echo Fabric Network Started Successfully!
echo ========================================
echo.
echo Next steps:
echo 1. Create channel: scripts\create-channel.bat
echo 2. Deploy chaincode: scripts\deploy-chaincode.bat
echo 3. Start backend: cd coffee-export-gateway ^&^& npm start
echo.
pause
