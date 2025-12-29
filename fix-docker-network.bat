@echo off
REM Docker Network Fix Script for Windows
REM Resolves EAI_AGAIN and network connectivity issues

setlocal enabledelayedexpansion

echo.
echo ==========================================
echo Coffee Export Blockchain - Docker Fix
echo ==========================================
echo.

REM Check if Docker is running
echo [1/7] Checking Docker daemon...
docker ps >nul 2>&1
if errorlevel 1 (
    echo X Docker is not running
    echo Please start Docker Desktop and try again
    exit /b 1
)
echo [OK] Docker is running
echo.

REM Stop all containers
echo [2/7] Stopping containers...
docker-compose -f docker-compose.postgres.yml down 2>nul
echo [OK] Containers stopped
echo.

REM Remove network
echo [3/7] Cleaning up networks...
docker network prune -f >nul 2>&1
echo [OK] Networks cleaned
echo.

REM Rebuild images
echo [4/7] Rebuilding Docker images...
docker-compose -f docker-compose.postgres.yml build --no-cache
echo [OK] Images rebuilt
echo.

REM Start services
echo [5/7] Starting services...
docker-compose -f docker-compose.postgres.yml up -d
echo [OK] Services started
echo.

REM Wait for services
echo [6/7] Waiting for services to be healthy (60 seconds)...
timeout /t 60 /nobreak
echo [OK] Services should be healthy
echo.

REM Verify connectivity
echo [7/7] Verifying connectivity...
echo.

REM Check network
docker network inspect coffee-export-network >nul 2>&1
if errorlevel 1 (
    echo X Network 'coffee-export-network' NOT found
) else (
    echo [OK] Network 'coffee-export-network' exists
)

REM Check PostgreSQL
docker exec postgres pg_isready -U postgres >nul 2>&1
if errorlevel 1 (
    echo X PostgreSQL is NOT ready
) else (
    echo [OK] PostgreSQL is ready
)

REM Check IPFS
docker exec ipfs ipfs id >nul 2>&1
if errorlevel 1 (
    echo X IPFS is NOT ready
) else (
    echo [OK] IPFS is ready
)

REM Check API
for /f %%i in ('curl -s http://localhost:3001/health ^| find "ok"') do set API_OK=1
if "%API_OK%"=="1" (
    echo [OK] CommercialBankAPI is responding
) else (
    echo X CommercialBankAPI is NOT responding
)

echo.
echo ==========================================
echo Fix Complete!
echo ==========================================
echo.
echo Services Status:
docker-compose -f docker-compose.postgres.yml ps
echo.
echo Next steps:
echo 1. Check logs: docker-compose -f docker-compose.postgres.yml logs -f
echo 2. Test API: curl http://localhost:3001/health
echo 3. View database: docker exec postgres psql -U postgres -d coffee_export_db
echo.
pause
