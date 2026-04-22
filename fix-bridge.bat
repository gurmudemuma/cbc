@echo off
echo ========================================
echo Fixing Blockchain Bridge Service
echo ========================================
echo.

echo Step 1: Stopping blockchain bridge...
docker-compose -f docker-compose-hybrid.yml stop blockchain-bridge
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to stop bridge
    pause
    exit /b 1
)
echo Bridge stopped successfully
echo.

echo Step 2: Rebuilding blockchain bridge with fix...
docker-compose -f docker-compose-hybrid.yml build blockchain-bridge
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to rebuild bridge
    pause
    exit /b 1
)
echo Bridge rebuilt successfully
echo.

echo Step 3: Starting blockchain bridge...
docker-compose -f docker-compose-hybrid.yml up -d blockchain-bridge
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to start bridge
    pause
    exit /b 1
)
echo Bridge started successfully
echo.

echo Step 4: Waiting 10 seconds for initialization...
timeout /t 10 /nobreak
echo.

echo Step 5: Checking bridge logs...
echo ========================================
docker logs coffee-bridge --tail 50
echo ========================================
echo.

echo Step 6: Testing services...
echo.
echo Testing Gateway (port 3000):
curl -s http://localhost:3000/health
echo.
echo.
echo Testing Bridge (port 3008):
curl -s http://localhost:3008/health
echo.
echo.
echo Testing Frontend (port 5173):
curl -s http://localhost:5173/ | findstr "html"
echo.

echo ========================================
echo Fix complete! Check the logs above.
echo ========================================
echo.
echo To view live logs, run:
echo docker logs coffee-bridge -f
echo.
pause
