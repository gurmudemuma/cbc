@echo off
echo ============================================
echo Starting Coffee Export Hybrid System (Clean)
echo ============================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo Step 1: Cleaning up old containers and orphans...
docker-compose -f docker-compose-hybrid.yml down --remove-orphans
docker-compose -f docker-compose-fabric.yml down --remove-orphans 2>nul

echo.
echo Step 2: Removing old volumes (optional - press Ctrl+C to skip)...
timeout /t 5
docker volume prune -f

echo.
echo Step 3: Building all services...
echo This may take 10-15 minutes on first run...
docker-compose -f docker-compose-hybrid.yml build --parallel

if %errorlevel% neq 0 (
    echo.
    echo Build failed! Retrying without parallel...
    docker-compose -f docker-compose-hybrid.yml build
    
    if %errorlevel% neq 0 (
        echo.
        echo ERROR: Build failed. Check the logs above.
        echo.
        echo Common issues:
        echo   - Network timeout: Run 'docker pull node:20-alpine' first
        echo   - Low disk space: Run 'docker system prune -f'
        echo   - Memory issues: Increase Docker memory in settings
        echo.
        pause
        exit /b 1
    )
)

echo.
echo Step 4: Starting infrastructure services...
docker-compose -f docker-compose-hybrid.yml up -d postgres redis zookeeper

echo Waiting for infrastructure (30 seconds)...
timeout /t 30 /nobreak >nul

echo.
echo Step 5: Starting Kafka...
docker-compose -f docker-compose-hybrid.yml up -d kafka

echo Waiting for Kafka (20 seconds)...
timeout /t 20 /nobreak >nul

echo.
echo Step 6: Starting chaincode server...
docker-compose -f docker-compose-hybrid.yml up -d chaincode-server

echo Waiting for chaincode (15 seconds)...
timeout /t 15 /nobreak >nul

echo.
echo Step 7: Starting gateway and bridge...
docker-compose -f docker-compose-hybrid.yml up -d gateway blockchain-bridge

echo Waiting for gateway/bridge (15 seconds)...
timeout /t 15 /nobreak >nul

echo.
echo Step 8: Starting CBC services...
docker-compose -f docker-compose-hybrid.yml up -d ecta-service commercial-bank-service national-bank-service customs-service ecx-service shipping-service

echo Waiting for CBC services (15 seconds)...
timeout /t 15 /nobreak >nul

echo.
echo Step 9: Starting frontend...
docker-compose -f docker-compose-hybrid.yml up -d frontend

echo.
echo Step 10: Checking service status...
timeout /t 5 /nobreak >nul
docker-compose -f docker-compose-hybrid.yml ps

echo.
echo Step 11: Checking service health...
echo.
echo Postgres:
docker exec coffee-postgres pg_isready -U postgres
echo.
echo Redis:
docker exec coffee-redis redis-cli ping
echo.
echo Kafka:
docker exec coffee-kafka kafka-broker-api-versions --bootstrap-server localhost:9092 2>nul | findstr "ApiVersion" >nul && echo Kafka is ready || echo Kafka is starting...
echo.

echo.
echo ============================================
echo Hybrid System Started!
echo ============================================
echo.
echo Services:
echo   - Frontend:          http://localhost:5173
echo   - Gateway API:       http://localhost:3000
echo   - Blockchain Bridge: http://localhost:3008
echo   - Chaincode Server:  http://localhost:3001
echo   - ECTA Service:      http://localhost:3003
echo   - PostgreSQL:        localhost:5432
echo   - Redis:             localhost:6379
echo   - Kafka:             localhost:9093
echo.
echo Useful commands:
echo   View all logs:       docker-compose -f docker-compose-hybrid.yml logs -f
echo   View service logs:   docker-compose -f docker-compose-hybrid.yml logs -f [service-name]
echo   Restart service:     docker-compose -f docker-compose-hybrid.yml restart [service-name]
echo   Stop all:            docker-compose -f docker-compose-hybrid.yml down
echo.
pause
