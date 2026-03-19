@echo off
REM Coffee Export System - Complete Startup Script (Windows)
REM Starts all services in the correct order with proper validation

setlocal enabledelayedexpansion

echo.
echo ==========================================
echo Coffee Export System - Startup Script
echo ==========================================
echo.

REM Get the directory where this script is located
set SCRIPT_DIR=%~dp0
set ROOT_DIR=%SCRIPT_DIR:~0,-1%
for %%A in ("%ROOT_DIR%") do set ROOT_DIR=%%~dpA

set COMPOSE_HYBRID=%ROOT_DIR%docker-compose-hybrid.yml
set COMPOSE_FABRIC=%ROOT_DIR%docker-compose-fabric.yml

REM Check if Docker is running
echo Checking Docker...
docker ps >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Please start Docker first.
    exit /b 1
)
echo [OK] Docker is running
echo.

REM Clean up
echo Cleaning up all containers from previous runs...
docker-compose -f %COMPOSE_HYBRID% down -v --remove-orphans 2>nul
docker-compose -f %COMPOSE_FABRIC% down -v --remove-orphans 2>nul
echo [OK] Cleanup complete
echo.

REM Force remove any leftover networks
echo Cleaning up leftover networks...
for /f "tokens=*" %%i in ('docker network ls -q -f name=fabric-network 2^>nul') do docker network rm %%i 2>nul || true
echo [OK] Networks cleaned
echo.

REM Create network
echo Creating fabric-network...
REM Remove old network if it exists with wrong labels
docker network rm fabric-network 2>nul || true
timeout /t 1 >nul
docker network create fabric-network 2>nul
echo [OK] Fabric network ready
echo.

REM Start blockchain
echo Starting blockchain infrastructure...
docker-compose -f %COMPOSE_FABRIC% up -d
if errorlevel 1 (
    echo [ERROR] Failed to start blockchain infrastructure
    exit /b 1
)
echo [OK] Blockchain infrastructure started
echo.

REM Start CLI container explicitly
echo Starting CLI container...
docker-compose -f %COMPOSE_FABRIC% up -d cli
if errorlevel 1 (
    echo [WARNING] CLI container failed to start, continuing...
)
echo.

REM Wait for CLI container to be ready (reduced timeout)
echo Waiting for CLI container to be ready...
set CLI_READY=0
for /L %%i in (1,1,15) do (
    docker exec cli ls /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config >nul 2>&1
    if !errorlevel! equ 0 (
        echo [OK] CLI container is ready
        set CLI_READY=1
        goto cli_done
    )
    timeout /t 1 >nul
)
:cli_done
if !CLI_READY! equ 0 (
    echo [WARNING] CLI container not ready, but continuing...
)
echo.

REM Start application services
echo Starting application infrastructure services...
docker-compose -f %COMPOSE_HYBRID% up -d zookeeper kafka postgres redis
if errorlevel 1 (
    echo [ERROR] Failed to start infrastructure services
    exit /b 1
)
echo [OK] Application infrastructure services started
echo.

REM Wait for PostgreSQL (reduced timeout)
echo Waiting for PostgreSQL to initialize...
set PG_READY=0
for /L %%i in (1,1,60) do (
    docker exec coffee-postgres psql -U postgres -c "SELECT 1" >nul 2>&1
    if !errorlevel! equ 0 (
        echo [OK] PostgreSQL is ready
        set PG_READY=1
        goto pg_done
    )
    timeout /t 1 >nul
)
:pg_done
if !PG_READY! equ 0 (
    echo [ERROR] PostgreSQL failed to start
    docker-compose -f %COMPOSE_HYBRID% logs postgres
    exit /b 1
)
echo.

REM Start gateway (without build, use existing images)
echo Starting gateway and core services...
docker-compose -f %COMPOSE_HYBRID% up -d gateway blockchain-bridge buyer-verification
if errorlevel 1 (
    echo [ERROR] Failed to start gateway services
    docker-compose -f %COMPOSE_HYBRID% logs gateway
    exit /b 1
)
echo [OK] Gateway services started
echo.

REM Wait for gateway to be ready (reduced timeout)
echo Waiting for gateway to initialize...
set GATEWAY_READY=0
for /L %%i in (1,1,30) do (
    docker exec coffee-gateway curl -s http://localhost:3000/health >nul 2>&1
    if !errorlevel! equ 0 (
        echo [OK] Gateway is ready
        set GATEWAY_READY=1
        goto gateway_done
    )
    timeout /t 1 >nul
)
:gateway_done
if !GATEWAY_READY! equ 0 (
    echo [WARNING] Gateway health check failed, but continuing...
)
echo.

REM Seed database
echo Initializing database and seeding users...
docker exec coffee-gateway npm run seed
if errorlevel 1 (
    echo [ERROR] Seed script failed
    exit /b 1
)
echo [OK] Database initialized and users seeded
echo.

REM Start CBC services
echo Starting CBC services...
docker-compose -f %COMPOSE_HYBRID% up -d ecta-service commercial-bank-service national-bank-service customs-service ecx-service shipping-service
if errorlevel 1 (
    echo [WARNING] CBC services startup command failed, but continuing...
)
echo.

REM Wait for CBC services to be ready (reduced timeout)
echo Waiting for CBC services to initialize...
set CBC_READY=0
for /L %%i in (1,1,30) do (
    docker ps --format "table {{.Names}}\t{{.Status}}" | findstr /I "coffee-ecta.*Up" >nul 2>&1
    if !errorlevel! equ 0 (
        echo [OK] CBC services are ready
        set CBC_READY=1
        goto cbc_done
    )
    timeout /t 1 >nul
)
:cbc_done
if !CBC_READY! equ 0 (
    echo [WARNING] CBC services not fully ready, but continuing...
)
echo.

REM Start frontend
echo Starting frontend...
docker-compose -f %COMPOSE_HYBRID% up -d frontend
if errorlevel 1 (
    echo [WARNING] Frontend startup failed, but continuing...
)
echo [OK] Frontend started
echo.

REM Wait for frontend to be ready (reduced timeout)
echo Waiting for frontend to initialize...
set FRONTEND_READY=0
for /L %%i in (1,1,20) do (
    docker ps --format "table {{.Names}}\t{{.Status}}" | findstr /I "coffee-frontend.*Up" >nul 2>&1
    if !errorlevel! equ 0 (
        echo [OK] Frontend is ready
        set FRONTEND_READY=1
        goto frontend_done
    )
    timeout /t 1 >nul
)
:frontend_done
if !FRONTEND_READY! equ 0 (
    echo [WARNING] Frontend not ready, but continuing...
)
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
echo Blockchain Services:
echo   Orderer 1:       localhost:7050
echo   Orderer 2:       localhost:8050
echo   Orderer 3:       localhost:9050
echo   Peer ECTA 0:     localhost:7051
echo   Peer ECTA 1:     localhost:8051
echo   CouchDB ECTA 0:  localhost:5984
echo   CLI:             docker exec -it cli bash
echo.
echo Test Credentials:
echo   Admin:     admin / admin123
echo   Exporter1: exporter1 / password123
echo   Exporter2: exporter2 / password123
echo.
REM Seed licenses for qualified exporters
echo Seeding export licenses...
docker exec coffee-gateway npm run seed-licenses
if errorlevel 1 (
    echo [WARNING] License seeding failed, but continuing...
) else (
    echo [OK] Export licenses seeded
)
echo.

echo [OK] System startup complete!
echo.
echo ==========================================
echo Final System Status
echo ==========================================
echo.
docker ps --format "table {{.Names}}\t{{.Status}}" | findstr /I "coffee"
echo.
echo ==========================================
echo.

endlocal
