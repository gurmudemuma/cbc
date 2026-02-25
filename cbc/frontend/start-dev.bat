@echo off
echo.
echo ========================================
echo   Coffee Export Gateway - Frontend
echo   Development Server Startup
echo ========================================
echo.

echo [1/2] Testing backend connection...
node test-full-connection.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Backend connection test failed!
    echo Please start the backend first:
    echo   cd coffee-export-gateway
    echo   npm start
    echo.
    pause
    exit /b 1
)

echo.
echo [2/2] Starting frontend development server...
echo.
echo Frontend will be available at: http://localhost:5173
echo Press Ctrl+C to stop the server
echo.

npm run dev
