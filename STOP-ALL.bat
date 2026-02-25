@echo off
echo ╔════════════════════════════════════════════════════════════╗
echo ║     COFFEE EXPORT BLOCKCHAIN - STOP ALL SERVICES          ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

echo Stopping all services...
echo.

REM Kill processes on port 3001 (Chaincode Server)
echo [1/3] Stopping Chaincode Server (Port 3001)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING') do (
    echo   Killing process %%a
    taskkill /F /PID %%a >nul 2>&1
)
echo   ✓ Chaincode server stopped

REM Kill processes on port 3000 (Backend API)
echo [2/3] Stopping Backend API (Port 3000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    echo   Killing process %%a
    taskkill /F /PID %%a >nul 2>&1
)
echo   ✓ Backend API stopped

REM Kill processes on port 5173 (Frontend)
echo [3/3] Stopping Frontend (Port 5173)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do (
    echo   Killing process %%a
    taskkill /F /PID %%a >nul 2>&1
)
echo   ✓ Frontend stopped

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║     ALL SERVICES STOPPED SUCCESSFULLY!                    ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo All ports are now free:
echo   ✓ Port 3001 (Chaincode Server)
echo   ✓ Port 3000 (Backend API)
echo   ✓ Port 5173 (Frontend)
echo.
echo You can now run START-ALL.bat to restart the services.
echo.
pause
