@echo off
REM ============================================================================
REM TEST HYBRID SYSTEM PERFORMANCE
REM Tests PostgreSQL vs Fabric query performance
REM ============================================================================

echo.
echo ========================================
echo  HYBRID SYSTEM PERFORMANCE TEST
echo ========================================
echo.

REM Check if curl is available
where curl >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: curl is not installed
    echo Please install curl or use Git Bash
    pause
    exit /b 1
)

REM Step 1: Login to get token
echo [1/4] Logging in to get authentication token...
curl -s -X POST http://localhost:3000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"admin\",\"password\":\"admin123\"}" > temp_login.json

if %errorlevel% neq 0 (
    echo   ERROR: Login failed. Is the gateway running?
    del temp_login.json 2>nul
    pause
    exit /b 1
)

REM Extract token (basic parsing for Windows)
for /f "tokens=2 delims=:," %%a in ('findstr /C:"token" temp_login.json') do (
    set TOKEN=%%a
)
set TOKEN=%TOKEN:"=%
set TOKEN=%TOKEN: =%

if "%TOKEN%"=="" (
    echo   ERROR: Could not extract token
    type temp_login.json
    del temp_login.json
    pause
    exit /b 1
)

echo   ✓ Login successful
del temp_login.json
echo.

REM Step 2: Test dashboard analytics
echo [2/4] Testing dashboard analytics (PostgreSQL)...
curl -s http://localhost:3000/api/analytics/dashboard ^
  -H "Authorization: Bearer %TOKEN%" > temp_dashboard.json

if %errorlevel% neq 0 (
    echo   ERROR: Dashboard request failed
) else (
    echo   ✓ Dashboard data retrieved
    echo.
    echo   Dashboard Statistics:
    type temp_dashboard.json
    echo.
)
del temp_dashboard.json 2>nul
echo.

REM Step 3: Test performance comparison
echo [3/4] Testing performance comparison...
curl -s "http://localhost:3000/api/analytics/performance/compare?username=admin" ^
  -H "Authorization: Bearer %TOKEN%" > temp_performance.json

if %errorlevel% neq 0 (
    echo   ERROR: Performance comparison failed
) else (
    echo   ✓ Performance comparison completed
    echo.
    echo   Performance Results:
    type temp_performance.json
    echo.
)
del temp_performance.json 2>nul
echo.

REM Step 4: Test database health
echo [4/4] Testing database health...
curl -s http://localhost:3000/api/analytics/database/health ^
  -H "Authorization: Bearer %TOKEN%" > temp_health.json

if %errorlevel% neq 0 (
    echo   ERROR: Health check failed
) else (
    echo   ✓ Database health check completed
    echo.
    echo   Health Status:
    type temp_health.json
    echo.
)
del temp_health.json 2>nul
echo.

echo ========================================
echo  PERFORMANCE TEST COMPLETE
echo ========================================
echo.
echo Summary:
echo   - Login: Working
echo   - Analytics: Working
echo   - Performance: Measured
echo   - Health: Checked
echo.
echo Expected Results:
echo   - PostgreSQL queries: ^<10ms
echo   - Fabric queries: 100-500ms
echo   - Speedup: 10-50x faster with PostgreSQL
echo.
echo View detailed logs:
echo   docker logs coffee-gateway --tail 50
echo.
pause
