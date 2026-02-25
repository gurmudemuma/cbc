@echo off
echo ========================================
echo Rebuilding Fixed Services
echo ========================================
echo.

echo Stopping all services...
docker-compose -f docker-compose-hybrid.yml down

echo.
echo Rebuilding services with fixes...
echo.

REM Rebuild gateway (syntax fix)
echo [1/10] Rebuilding Gateway...
docker-compose -f docker-compose-hybrid.yml build gateway

REM Rebuild bridge (connection profile fix)
echo [2/10] Rebuilding Bridge...
docker-compose -f docker-compose-hybrid.yml build blockchain-bridge

REM Rebuild CBC services (CMD path fixes)
echo [3/10] Rebuilding ECTA...
docker-compose -f docker-compose-hybrid.yml build ecta-service

echo [4/10] Rebuilding Commercial Bank...
docker-compose -f docker-compose-hybrid.yml build commercial-bank-service

echo [5/10] Rebuilding National Bank...
docker-compose -f docker-compose-hybrid.yml build national-bank-service

echo [6/10] Rebuilding Customs...
docker-compose -f docker-compose-hybrid.yml build customs-service

echo [7/10] Rebuilding ECX...
docker-compose -f docker-compose-hybrid.yml build ecx-service

echo [8/10] Rebuilding Shipping...
docker-compose -f docker-compose-hybrid.yml build shipping-service

echo [9/10] Rebuilding ESW...
docker-compose -f docker-compose-hybrid.yml build esw-service

echo [10/10] Rebuilding Frontend...
docker-compose -f docker-compose-hybrid.yml build frontend

echo.
echo ========================================
echo Rebuild Complete!
echo ========================================
echo.
echo Starting services...
docker-compose -f docker-compose-hybrid.yml up -d

echo.
echo Waiting for services to start...
timeout /t 10 /nobreak >nul

echo.
echo Checking service status...
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo.
echo ========================================
echo Done! Check logs with:
echo   docker logs [service-name]
echo ========================================
