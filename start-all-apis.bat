@echo off
setlocal enabledelayedexpansion
REM ============================================================================
REM Start All APIs Simple Script
REM ============================================================================

set SCRIPT_DIR=%~dp0
set LOG_DIR=%SCRIPT_DIR%logs
set SERVICES="commercial-bank:3001" "custom-authorities:3002" "ecta:3003" "exporter-portal:3004" "national-bank:3005" "ecx:3006" "shipping-line:3007"

REM Handle arguments
set COMMAND=%~1
if "%COMMAND%"=="" set COMMAND=start

if "%COMMAND%"=="stop" goto :stop_all_services
if "%COMMAND%"=="logs" goto :show_logs
if "%COMMAND%"=="check" goto :check_prerequisites
if "%COMMAND%"=="help" goto :show_help

:start
echo [INFO] Starting API Services...

if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

for %%s in (%SERVICES%) do (
    for /f "tokens=1,2 delims=:" %%a in ("%%~s") do (
        echo [INFO] Starting %%a on port %%b...
        set NODE_ENV=development
        start "CBC-%%a" cmd /k "cd /d %SCRIPT_DIR%api\%%a && npm run dev"
        timeout /t 2 /nobreak >nul
    )
)

echo.
echo [OK] All services started.
echo [INFO] Waiting 20 seconds for services to initialize...
timeout /t 20 /nobreak >nul

goto :check_health

:check_health
echo.
echo [INFO] Checking Service Health...
for %%s in (%SERVICES%) do (
    for /f "tokens=1,2 delims=:" %%a in ("%%~s") do (
        powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:%%b/health' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200) { Write-Host '[OK] %%a is healthy' -ForegroundColor Green } } catch { Write-Host '[ERROR] %%a is not responding' -ForegroundColor Red }"
    )
)
echo.
echo [INFO] Startup complete!
goto :eof

:stop_all_services
echo [INFO] Stopping all CBC services...
taskkill /FI "WINDOWTITLE eq CBC-*" /T /F >nul 2>&1
echo [OK] Services stopped.
goto :eof

:show_logs
echo [INFO] Logs are in %LOG_DIR%
goto :eof

:check_prerequisites
echo [INFO] Checking prerequisites...
node --version
npm --version
goto :eof

:show_help
echo Usage: start-all-apis.bat [start|stop|logs|check|help]
goto :eof
