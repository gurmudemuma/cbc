@echo off
REM Coffee Export System - Complete Startup Script (Windows)
REM Starts all services in the correct order with health checks

setlocal enabledelayedexpansion

echo.
echo ==========================================
echo Coffee Export System - Startup Script
echo ==========================================
echo.

REM Configuration
set COMPOSE_FILE=docker-compose-hybrid.yml
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
docker-compose -f %COMPOSE_FILE% up -d ^
    coffee-zookeeper ^
    coffee-kafka ^
    coffee-postgres ^
    coffee-redis

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

REM Start blockchain services
echo Starting blockchain services...
docker-compose -f %COMPOSE_FILE% up -d ^
    peer0.ecta.example.com ^
    peer1.ecta.example.com ^
    peer0.customs.example.com ^
    peer0.shipping.example.com ^
    peer0.nbe.example.com ^
    peer0.bank.example.com ^
    orderer1.orderer.example.com ^
    orderer2.orderer.example.com ^
    orderer3.orderer.example.com

echo [OK] Blockchain services started
echo.

REM Start gateway and core services
echo Starting gateway and core services...
docker-compose -f %COMPOSE_FILE% up -d ^
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
docker-compose -f %COMPOSE_FILE% up -d ^
    ecta-service ^
    commercial-bank ^
    national-bank ^
    customs ^
    ecx ^
    shipping

echo [OK] CBC services started
echo.

REM Start frontend
echo Starting frontend...
docker-compose -f %COMPOSE_FILE% up -d frontend

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
echo   Username: Ella
echo   Password: password123
echo.

echo Next Steps:
echo   1. Open http://localhost:5173 in your browser
echo   2. Login with test credentials
echo   3. Navigate to 'My Applications' to test the system
echo.

echo [OK] System startup complete!
echo.

endlocal
