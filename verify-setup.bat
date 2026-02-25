@echo off
echo ========================================
echo COMPLETE SYSTEM VERIFICATION
echo PostgreSQL + Fabric + Hybrid Bridge
echo ========================================
echo.

set ERRORS=0
set WARNINGS=0

echo ============================================
echo PHASE 1: Prerequisites
echo ============================================
echo.

echo [1/15] Checking Docker...
docker --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ✗ Docker not found - Please install Docker Desktop
    set /a ERRORS+=1
) else (
    echo ✓ Docker installed
)

echo [2/15] Checking Docker Compose...
docker-compose --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ✗ Docker Compose not found
    set /a ERRORS+=1
) else (
    echo ✓ Docker Compose installed
)

echo [3/15] Checking Node.js...
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ⚠ Node.js not found (needed for tests)
    set /a WARNINGS+=1
) else (
    echo ✓ Node.js installed
)

echo.
echo ============================================
echo PHASE 2: Infrastructure Services
echo ============================================
echo.

echo [4/15] Checking PostgreSQL container...
docker ps | findstr coffee-postgres >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ✗ PostgreSQL container not running
    echo   Run: docker-compose -f docker-compose-hybrid.yml up -d postgres
    set /a ERRORS+=1
) else (
    echo ✓ PostgreSQL container running
)

echo [5/15] Checking PostgreSQL connection...
docker exec coffee-postgres psql -U postgres -d coffee_export_db -c "SELECT 1" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ✗ Cannot connect to PostgreSQL
    set /a ERRORS+=1
) else (
    echo ✓ PostgreSQL connection successful
)

echo [6/15] Checking database tables...
docker exec coffee-postgres psql -U postgres -d coffee_export_db -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ✗ Cannot query tables
    set /a ERRORS+=1
) else (
    echo ✓ Database tables accessible
    docker exec coffee-postgres psql -U postgres -d coffee_export_db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'" 2>nul
)

echo [7/15] Checking hybrid system tables...
docker exec coffee-postgres psql -U postgres -d coffee_export_db -c "\dt sync_log" 2>nul | findstr "sync_log" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ⚠ Hybrid system tables not found (sync_log, reconciliation_log)
    echo   These will be created on first bridge startup
    set /a WARNINGS+=1
) else (
    echo ✓ Hybrid system tables exist
)

echo [8/15] Checking Redis...
docker ps | findstr coffee-redis >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ✗ Redis container not running
    set /a ERRORS+=1
) else (
    echo ✓ Redis container running
)

echo [9/15] Checking Kafka...
docker ps | findstr coffee-kafka >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ✗ Kafka container not running
    set /a ERRORS+=1
) else (
    echo ✓ Kafka container running
)

echo.
echo ============================================
echo PHASE 3: Blockchain Services
echo ============================================
echo.

echo [10/15] Checking Chaincode server container...
docker ps | findstr coffee-chaincode >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ✗ Chaincode container not running
    echo   Run: docker-compose -f docker-compose-hybrid.yml up -d chaincode-server
    set /a ERRORS+=1
) else (
    echo ✓ Chaincode container running
)

echo [11/15] Checking Chaincode health...
curl -s http://localhost:3001/health 2>nul | findstr "ok" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ✗ Chaincode health check failed
    set /a ERRORS+=1
) else (
    echo ✓ Chaincode health check passed
)

echo [12/15] Testing Chaincode invoke...
curl -s -X POST http://localhost:3001/invoke -H "Content-Type: application/json" -d "{\"fcn\":\"GetUser\",\"args\":[\"test\"]}" 2>nul | findstr "success" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ⚠ Chaincode invoke test inconclusive
    set /a WARNINGS+=1
) else (
    echo ✓ Chaincode invoke working
)

echo.
echo ============================================
echo PHASE 4: Hybrid Bridge Service
echo ============================================
echo.

echo [13/15] Checking Blockchain Bridge...
docker ps | findstr coffee-bridge >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ⚠ Blockchain Bridge not running
    echo   This is optional for basic testing
    set /a WARNINGS+=1
) else (
    echo ✓ Blockchain Bridge running
    
    echo [13a] Checking Bridge health...
    curl -s http://localhost:3008/health 2>nul | findstr "healthy" >nul 2>&1
    if %ERRORLEVEL% NEQ 0 (
        echo ⚠ Bridge health check failed
        set /a WARNINGS+=1
    ) else (
        echo ✓ Bridge health check passed
    )
)

echo.
echo ============================================
echo PHASE 5: Application Services
echo ============================================
echo.

echo [14/15] Checking Gateway service...
docker ps | findstr coffee-gateway >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ⚠ Gateway not running
    set /a WARNINGS+=1
) else (
    echo ✓ Gateway running
)

echo [15/15] Checking Frontend...
docker ps | findstr coffee-frontend >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ⚠ Frontend not running
    set /a WARNINGS+=1
) else (
    echo ✓ Frontend running
)

echo.
echo ========================================
echo VERIFICATION SUMMARY
echo ========================================
echo.

if %ERRORS% EQU 0 (
    if %WARNINGS% EQU 0 (
        echo ✓✓✓ ALL CHECKS PASSED! ✓✓✓
        echo.
        echo System is fully operational:
        echo   ✓ PostgreSQL: localhost:5432 (coffee_export_db)
        echo   ✓ Chaincode: http://localhost:3001
        echo   ✓ Kafka: localhost:9092
        echo   ✓ Redis: localhost:6379
        echo   ✓ Bridge: http://localhost:3008
        echo   ✓ Gateway: http://localhost:3000
        echo   ✓ Frontend: http://localhost:5173
        echo.
        echo ========================================
        echo NEXT STEPS
        echo ========================================
        echo.
        echo 1. Run integration tests:
        echo    node tests/test-hybrid-integration.js
        echo.
        echo 2. Test chaincode manually:
        echo    test-chaincode.bat
        echo.
        echo 3. Access the application:
        echo    http://localhost:5173
        echo.
        echo 4. View API documentation:
        echo    http://localhost:3000/api-docs
        echo.
        echo 5. Monitor Bridge health:
        echo    curl http://localhost:3008/health
        echo.
    ) else (
        echo ✓ CORE CHECKS PASSED (with %WARNINGS% warnings)
        echo.
        echo Essential services are running:
        echo   ✓ PostgreSQL: localhost:5432
        echo   ✓ Chaincode: http://localhost:3001
        echo.
        echo Optional services have warnings:
        echo   ⚠ %WARNINGS% warning(s) - see above
        echo.
        echo The system is functional for basic testing.
        echo To start all services:
        echo   docker-compose -f docker-compose-hybrid.yml up -d
    )
) else (
    echo ✗✗✗ VERIFICATION FAILED ✗✗✗
    echo.
    echo %ERRORS% critical error(s) found
    echo %WARNINGS% warning(s) found
    echo.
    echo ========================================
    echo QUICK FIX
    echo ========================================
    echo.
    echo Start all services:
    echo   docker-compose -f docker-compose-hybrid.yml up -d
    echo.
    echo Wait 30 seconds, then run this script again:
    echo   verify-setup.bat
    echo.
    echo If problems persist, check logs:
    echo   docker-compose -f docker-compose-hybrid.yml logs
)

echo.
echo ========================================
echo CONFIGURATION FILES
echo ========================================
echo.
echo PostgreSQL Config: cbc/services/shared/database/db.config.ts
echo Database Init: cbc/services/shared/database/init.sql
echo Migrations: cbc/services/shared/database/migrations/
echo Chaincode: chaincode/ecta/index.js
echo Bridge: services/blockchain-bridge/
echo Docker: docker-compose-hybrid.yml
echo.
echo Full documentation: COMPLETE-SYSTEM-VERIFICATION.md
echo.
pause
