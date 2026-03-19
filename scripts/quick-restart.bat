@echo off
REM Quick Restart Script - Restarts services without full cleanup
REM Use this when you just need to restart services quickly

setlocal enabledelayedexpansion

echo.
echo ==========================================
echo Coffee Export System - Quick Restart
echo ==========================================
echo.

set COMPOSE_HYBRID=docker-compose-hybrid.yml

REM Restart gateway only
echo Restarting gateway...
docker-compose -f %COMPOSE_HYBRID% restart gateway
if errorlevel 1 (
    echo [ERROR] Failed to restart gateway
    exit /b 1
)
echo [OK] Gateway restarted
echo.

REM Wait for gateway to be ready (shorter timeout)
echo Waiting for gateway...
set GATEWAY_READY=0
for /L %%i in (1,1,20) do (
    timeout /t 1 /nobreak >nul
    docker exec coffee-gateway curl -s http://localhost:3000/health >nul 2>&1
    if !errorlevel! equ 0 (
        echo [OK] Gateway is ready
        set GATEWAY_READY=1
        goto done
    )
)
:done

if !GATEWAY_READY! equ 0 (
    echo [WARNING] Gateway may not be fully ready
    echo [INFO] Check logs with: docker logs coffee-gateway
)

echo.
echo [OK] Quick restart complete!
echo.
echo Service URLs:
echo   Frontend:    http://localhost:5173
echo   Gateway API: http://localhost:3000
echo.

endlocal
