@echo off
REM Complete Fabric Network Startup Script
REM This script starts the entire Coffee Export Blockchain system with real Fabric

echo ========================================
echo Coffee Export Blockchain Consortium
echo Real Hyperledger Fabric Network Setup
echo ========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo Docker is running...
echo.

echo What would you like to do?
echo.
echo 1. Start Fabric Network (First time setup)
echo 2. Create Channel
echo 3. Deploy Chaincode
echo 4. Start Backend Gateway
echo 5. Complete Setup (All steps)
echo 6. Stop Network
echo 7. View Network Status
echo.
set /p choice="Enter your choice (1-7): "

if "%choice%"=="1" goto start_network
if "%choice%"=="2" goto create_channel
if "%choice%"=="3" goto deploy_chaincode
if "%choice%"=="4" goto start_backend
if "%choice%"=="5" goto complete_setup
if "%choice%"=="6" goto stop_network
if "%choice%"=="7" goto network_status
goto invalid_choice

:start_network
echo.
echo Starting Fabric Network...
call scripts\start-fabric-network.bat
goto end

:create_channel
echo.
echo Creating Channel...
call scripts\create-channel.bat
goto end

:deploy_chaincode
echo.
echo Deploying Chaincode...
call scripts\deploy-chaincode.bat
goto end

:start_backend
echo.
echo Starting Backend Gateway...
echo.
echo Make sure FABRIC_TEST_MODE=false in coffee-export-gateway/.env
echo.
cd coffee-export-gateway
start cmd /k "npm start"
cd ..
echo Backend started in new window
pause
goto end

:complete_setup
echo.
echo ========================================
echo Running Complete Setup
echo ========================================
echo.
echo This will:
echo 1. Start Fabric network
echo 2. Create channel
echo 3. Deploy chaincode
echo 4. Start backend gateway
echo.
echo This may take 10-15 minutes...
echo.
pause

echo.
echo Step 1/4: Starting Fabric Network...
call scripts\start-fabric-network.bat

echo.
echo Waiting 30 seconds for network to stabilize...
timeout /t 30 /nobreak >nul

echo.
echo Step 2/4: Creating Channel...
call scripts\create-channel.bat

echo.
echo Waiting 10 seconds...
timeout /t 10 /nobreak >nul

echo.
echo Step 3/4: Deploying Chaincode...
call scripts\deploy-chaincode.bat

echo.
echo Step 4/4: Starting Backend Gateway...
echo.
echo Updating .env file...
cd coffee-export-gateway
powershell -Command "(Get-Content .env) -replace 'FABRIC_TEST_MODE=true', 'FABRIC_TEST_MODE=false' | Set-Content .env"
echo.
echo Starting backend...
start cmd /k "npm start"
cd ..

echo.
echo ========================================
echo Complete Setup Finished!
echo ========================================
echo.
echo Your Coffee Export Blockchain is now running with real Fabric!
echo.
echo Access the system:
echo - Frontend: http://localhost:5173
echo - Backend API: http://localhost:3000
echo - Backend Health: http://localhost:3000/health
echo.
pause
goto end

:stop_network
echo.
echo Stopping Fabric Network...
docker-compose -f docker-compose-fabric.yml down
echo.
echo Network stopped.
pause
goto end

:network_status
echo.
echo ========================================
echo Network Status
echo ========================================
echo.
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo.
echo.
echo Container Logs (last 10 lines):
echo.
echo --- Orderer1 ---
docker logs --tail 10 orderer1.orderer.example.com 2>&1
echo.
echo --- ECTA Peer0 ---
docker logs --tail 10 peer0.ecta.example.com 2>&1
echo.
pause
goto end

:invalid_choice
echo.
echo Invalid choice. Please run the script again.
pause
goto end

:end
echo.
echo Script completed.
