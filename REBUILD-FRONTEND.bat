@echo off
echo ========================================
echo Rebuilding Frontend with Business Types
echo ========================================
echo.

echo [1/3] Stopping old frontend container...
docker stop coffee-frontend 2>nul
docker rm coffee-frontend 2>nul
echo   Done

echo.
echo [2/3] Building new frontend image with business types...
docker-compose -f docker-compose-hybrid.yml build frontend
if errorlevel 1 (
    echo   ERROR: Build failed
    pause
    exit /b 1
)
echo   Done

echo.
echo [3/3] Starting frontend container...
docker-compose -f docker-compose-hybrid.yml up -d frontend
if errorlevel 1 (
    echo   ERROR: Failed to start frontend
    pause
    exit /b 1
)

echo.
echo Waiting for frontend to be ready...
timeout /t 10 /nobreak >nul

echo.
echo ========================================
echo FRONTEND REBUILT SUCCESSFULLY!
echo ========================================
echo.
echo Frontend is now running with business types!
echo.
echo Access: http://localhost:5173
echo.
echo The registration form now includes:
echo   - Business Type dropdown
echo   - 4 options with capital requirements
echo   - Dynamic helper text
echo.
echo IMPORTANT:
echo   1. Open browser to http://localhost:5173
echo   2. Press Ctrl + Shift + R to hard refresh
echo   3. Click "Register here"
echo   4. You should see BUSINESS TYPE field
echo.
echo Check logs:
echo   docker logs coffee-frontend
echo.
pause

start http://localhost:5173
