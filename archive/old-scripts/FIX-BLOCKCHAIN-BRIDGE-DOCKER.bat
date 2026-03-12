@echo off
REM ============================================================================
REM FIX BLOCKCHAIN BRIDGE - Docker-based fix (no Node.js required on host)
REM ============================================================================

echo.
echo ========================================
echo  FIXING BLOCKCHAIN BRIDGE (Docker)
echo ========================================
echo.
echo This fix works inside Docker - no Node.js needed on your machine!
echo.

REM Step 1: Check if Docker is running
echo [1/3] Checking Docker...
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo   ERROR: Docker is not running
    echo   Please start Docker Desktop
    pause
    exit /b 1
)
echo   ✓ Docker is running
echo.

REM Step 2: Rebuild blockchain-bridge with fixed config
echo [2/3] Rebuilding blockchain-bridge service...
echo   This will compile TypeScript inside Docker with the fixed config
docker-compose -f docker-compose-hybrid.yml build blockchain-bridge
if %errorlevel% neq 0 (
    echo   ERROR: Build failed
    echo   Check the error messages above
    pause
    exit /b 1
)
echo   ✓ Blockchain bridge rebuilt successfully
echo.

REM Step 3: Restart the service
echo [3/3] Restarting blockchain-bridge service...
docker-compose -f docker-compose-hybrid.yml up -d blockchain-bridge
if %errorlevel% neq 0 (
    echo   ERROR: Failed to start service
    pause
    exit /b 1
)
echo   ✓ Service restarted
echo.

REM Wait a moment for service to initialize
echo Waiting for service to initialize...
timeout /t 5 /nobreak >nul
echo.

REM Check service status
echo Checking service status...
docker ps --filter "name=coffee-bridge" --format "table {{.Names}}\t{{.Status}}"
echo.

echo ========================================
echo  BLOCKCHAIN BRIDGE FIXED!
echo ========================================
echo.
echo The TypeScript configuration has been fixed and the service
echo has been rebuilt inside Docker.
echo.
echo Verify the fix:
echo   1. Check logs: docker logs coffee-bridge --tail 50
echo   2. Check health: curl http://localhost:3008/health
echo   3. View status: docker ps ^| findstr bridge
echo.
echo The service should now be running without TypeScript errors!
echo.
pause
