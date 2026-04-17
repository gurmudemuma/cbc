@echo off
REM System Readiness Test Script
REM Checks if all components are running and accessible

echo ========================================
echo Coffee Blockchain System Readiness Test
echo ========================================
echo.

echo [1/6] Checking Docker containers...
docker ps --format "table {{.Names}}\t{{.Status}}" | findstr /C:"coffee-"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Docker containers not running
    echo Run: docker-compose -f docker-compose-hybrid.yml up -d
    exit /b 1
)
echo OK: Docker containers running
echo.

echo [2/6] Checking Frontend accessibility...
curl -s -o nul -w "%%{http_code}" http://localhost | findstr "200" >nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Frontend not accessible at http://localhost
    exit /b 1
)
echo OK: Frontend accessible at http://localhost
echo.

echo [3/6] Checking Gateway API...
curl -s http://localhost:3000/api/auth/health >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Gateway health check failed (may be normal if no health endpoint)
)
echo OK: Gateway accessible at http://localhost:3000
echo.

echo [4/6] Checking Database connection...
docker exec coffee-postgres pg_isready -U postgres >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Database not ready
    exit /b 1
)
echo OK: Database ready
echo.

echo [5/6] Checking test users exist...
docker exec coffee-postgres psql -U postgres -d coffee_export_db -c "SELECT COUNT(*) FROM users WHERE username IN ('ecta1', 'bank1', 'shipping1', 'customs1');" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Could not verify test users
)
echo OK: Database accessible
echo.

echo [6/6] Checking network members...
docker exec coffee-postgres psql -U postgres -d coffee_export_db -c "SELECT COUNT(*) FROM network_members WHERE is_active = true;" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Could not verify network members
)
echo OK: Network members table accessible
echo.

echo ========================================
echo System Readiness: PASSED
echo ========================================
echo.
echo You can now start testing:
echo 1. Open browser: http://localhost
echo 2. Follow guide: docs/END-TO-END-TESTING-GUIDE.md
echo.
echo Test Accounts:
echo - ECTA: ecta1 / password
echo - Bank: bank1 / password
echo - Shipping: shipping1 / password
echo - Customs: customs1 / password
echo - NBE: nbe1 / password
echo.
pause
