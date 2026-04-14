@echo off
REM Coffee Export System - Complete Startup Script (Windows)
REM Starts all services in the correct order with health checks

setlocal enabledelayedexpansion

echo.
echo ==========================================
echo Coffee Export System - Startup Script
echo ==========================================
echo.

REM Get script directory and change to project root
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%\.."

REM Configuration
set COMPOSE_FILE=docker-compose-hybrid.yml
set FABRIC_COMPOSE_FILE=docker-compose-fabric.yml
set TIMEOUT=300
set HEALTH_CHECK_INTERVAL=5

REM Check if Docker is running
echo Checking Docker...
docker ps >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Please start Docker first.
    exit /b 1
)
echo [OK] Docker is running
echo.

REM Start infrastructure services
echo Starting infrastructure services...
docker-compose -f %COMPOSE_FILE% up -d --remove-orphans ^
    zookeeper ^
    kafka ^
    postgres ^
    redis

echo [OK] Infrastructure services started
echo.

REM Wait for PostgreSQL
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

REM Start blockchain services (from docker-compose-fabric.yml)
echo Starting blockchain orderers...
docker-compose -f %FABRIC_COMPOSE_FILE% up -d --remove-orphans ^
    orderer1.orderer.example.com ^
    orderer2.orderer.example.com ^
    orderer3.orderer.example.com

echo [OK] Orderers started
echo.

echo Starting CouchDB databases...
docker-compose -f %FABRIC_COMPOSE_FILE% up -d --remove-orphans ^
    couchdb0.ecta ^
    couchdb1.ecta ^
    couchdb0.bank ^
    couchdb0.nbe ^
    couchdb0.customs ^
    couchdb0.shipping

echo [OK] CouchDB databases started
echo.

echo Starting blockchain peers...
docker-compose -f %FABRIC_COMPOSE_FILE% up -d --remove-orphans ^
    peer0.ecta.example.com ^
    peer1.ecta.example.com ^
    peer0.bank.example.com ^
    peer0.nbe.example.com ^
    peer0.customs.example.com ^
    peer0.shipping.example.com

echo [OK] Blockchain peers started
echo.

echo Starting CLI tool...
docker-compose -f %FABRIC_COMPOSE_FILE% up -d --remove-orphans cli

echo [OK] CLI tool started
echo.

REM Start gateway and core services
echo Starting gateway, blockchain-bridge, and buyer-verification...
docker-compose -f %COMPOSE_FILE% up -d --remove-orphans ^
    gateway ^
    blockchain-bridge ^
    buyer-verification

echo [OK] Gateway and core services started
echo.

REM Wait for gateway
echo Waiting for gateway...
set /a elapsed=0
:wait_gateway
docker ps --filter "name=coffee-gateway" --format "{{.Status}}" | findstr /i "healthy" >nul
if errorlevel 1 (
    if !elapsed! lss %TIMEOUT% (
        timeout /t %HEALTH_CHECK_INTERVAL% /nobreak >nul
        set /a elapsed=!elapsed!+%HEALTH_CHECK_INTERVAL%
        goto wait_gateway
    ) else (
        echo [WARNING] Gateway health check timeout, continuing...
    )
)
echo [OK] Gateway is ready
echo.

REM Start CBC services
echo Starting CBC services...
docker-compose -f %COMPOSE_FILE% up -d --remove-orphans ^
    ecta-service ^
    commercial-bank-service ^
    national-bank-service ^
    customs-service ^
    ecx-service ^
    shipping-service

echo [OK] CBC services started
echo.

REM Start frontend
echo Starting frontend...
docker-compose -f %COMPOSE_FILE% up -d --remove-orphans frontend

echo [OK] Frontend started
echo.

REM Final status
echo ==========================================
echo System Status
echo ==========================================
echo.

echo Service URLs:
echo   Frontend:        http://localhost:5173
echo   Gateway API:     http://localhost:3000
echo   ECTA Service:    http://localhost:3003
echo   PostgreSQL:      localhost:5432
echo   Redis:           localhost:6379
echo.

echo Test Credentials:
echo   Admin:     admin / admin123
echo   Exporter:  exporter1 / password123
echo   ECTA:      ecta1 / password123
echo.

echo Next Steps:
echo   1. Open http://localhost:5173 in your browser
echo   2. Login with test credentials
echo   3. Navigate to 'My Applications' to test the system
echo.

echo [OK] System startup complete!
echo.

endlocal
