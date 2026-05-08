@echo off
echo.
echo ========================================
echo   Restarting Backend with Test Users
echo ========================================
echo.

echo Stopping any running backend processes...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq npm*" 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Starting backend...
echo.
echo You should see:
echo   - Coffee Export Gateway running on port 3000
echo   - Test users initialized
echo   - Running in MOCK MODE
echo.
echo Press Ctrl+C to stop the backend
echo.

npm start
