@echo off
REM Coffee Export System - Full Blockchain Startup Script (Windows)
REM Starts complete system with Hyperledger Fabric network

setlocal enabledelayedexpansion

echo.
echo ==========================================
echo Coffee Export System - Full Blockchain
echo ==========================================
echo.

REM Configuration
set FABRIC_COMPOSE=..\docker-compose-fabric.yml
set HYBRID_COMPOSE=..\docker-compose-hybrid.yml
set TIMEOUT=300
set HEALTH_CHECK_INTERVAL=10

REM Check if Docker is running
echo Checking Docker...
docker ps >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Please start Docker first.
    exit /b 1
)
echo [OK] Docker is running
echo.

REM Create fabric network if it doesn't exist
echo Creating fabric network...
docker network create fabric-network 2>nul
echo [OK] Fabric network ready
echo.

REM Step 1: Start Fabric Infrastructure (Orderers, Peers, CouchDB)
echo ==========================================
echo Step 1: Starting Hyperledger Fabric Network
echo ==========================================
echo.

echo Starting CouchDB databases...
docker-compose -f %FABRIC_COMPOSE% up -d ^
    couchdb0.ecta ^
    couchdb1.ecta ^
    couchdb0.bank ^
    couchdb0.nbe ^
    couchdb0.customs ^
    couchdb0.shipping

echo Waiting for CouchDB to initialize...
timeout /t 30 /nobreak >nul

echo Starting Orderer nodes...
docker-compose -f %FABRIC_COMPOSE% up -d ^
    orderer1.orderer.example.com ^
    orderer2.orderer.example.com ^
    orderer3.orderer.example.com

echo Waiting for Orderers to start...
timeout /t 20 /nobreak >nul

echo Starting Peer nodes...
docker-compose -f %FABRIC_COMPOSE% up -d ^
    peer0.ecta.example.com ^
    peer1.ecta.example.com ^
    peer0.bank.example.com ^
    peer0.nbe.example.com ^
    peer0.customs.example.com ^
    peer0.shipping.example.com

echo Starting CLI tool...
docker-compose -f %FABRIC_COMPOSE% up -d cli

echo [OK] Fabric network started
echo.

REM Wait for fabric network to be ready
echo Waiting for Fabric network to stabilize...
timeout /t 60 /nobreak >nul

REM Step 2: Start Application Services
echo ==========================================
echo Step 2: Starting Application Services
echo ==========================================
echo.

echo Starting infrastructure services...
docker-compose -f %HYBRID_COMPOSE% up -d ^
    zookeeper ^
    kafka ^
    postgres ^
    redis

echo Waiting for PostgreSQL...
set /a elapsed=0
:wait_postgres
docker ps --filter "name=coffee-postgres" --format "{{.Status}}" | findstr /i "healthy" >nul
if errorlevel 1 (
    if !elapsed! lss %TIMEOUT% (
        timeout /t %HEALTH_CHECK_INTERVAL% /nobreak >nul
        set /a elapsed=!elapsed!+%HEALTH_CHECK_INTERVAL%
        goto wait_postgres
    ) else (
        echo [ERROR] PostgreSQL failed to start
        exit /b 1
    )
)
echo [OK] PostgreSQL is ready
echo.

echo Starting gateway and core services...
docker-compose -f %HYBRID_COMPOSE% up -d ^
    gateway ^
    blockchain-bridge ^
    buyer-verification

echo Starting organization services...
docker-compose -f %HYBRID_COMPOSE% up -d ^
    ecta-service ^
    commercial-bank-service ^
    national-bank-service ^
    customs-service ^
    ecx-service ^
    shipping-service

echo Starting frontend...
docker-compose -f %HYBRID_COMPOSE% up -d frontend

echo [OK] Application services started
echo.

REM Step 3: Deploy Chaincode
echo ==========================================
echo Step 3: Deploying Smart Contracts
echo ==========================================
echo.

echo Deploying chaincode to Fabric network...
REM Note: This would run the chaincode deployment script
echo [INFO] Run 'scripts\deploy-chaincode-v1.9.sh' to deploy smart contracts
echo.

REM Final status
echo ==========================================
echo Full Blockchain System Status
echo ==========================================
echo.

echo Blockchain Network:
echo   Orderers:        3 nodes (Raft consensus)
echo   Peers:           6 nodes across 5 organizations
echo   State Database:  CouchDB (6 instances)
echo   Channel:         coffeechannel
echo   Chaincode:       ecta (ready to deploy)
echo.

echo Application Services:
echo   Frontend:        http://localhost:5173
echo   Gateway API:     http://localhost:3000
echo   ECTA Service:    http://localhost:3003
echo   PostgreSQL:      localhost:5432
echo   Redis:           localhost:6379
echo.

echo CouchDB Interfaces:
echo   ECTA Peer0:      http://localhost:5984
echo   ECTA Peer1:      http://localhost:6984
echo   Bank:            http://localhost:7984
echo   NBE:             http://localhost:8984
echo   Customs:         http://localhost:9984
echo   Shipping:        http://localhost:10984
echo   Credentials:     admin/adminpw
echo.

echo Test Credentials:
echo   Username: Ella
echo   Password: password123
echo.

echo Next Steps:
echo   1. Deploy chaincode: scripts\deploy-chaincode-v1.9.sh
echo   2. Open http://localhost:5173 in your browser
echo   3. Login and test the full blockchain system
echo   4. Check CouchDB at http://localhost:5984/_utils
echo.

echo [OK] Full blockchain system startup complete!
echo.

endlocal