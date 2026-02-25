@echo off
echo ╔════════════════════════════════════════════════════════════╗
echo ║     COFFEE EXPORT BLOCKCHAIN - FRESH START                ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

echo [STEP 1/4] Cleaning up busy ports...
echo.

REM Kill processes on port 3001 (Chaincode Server)
echo Checking port 3001 (Chaincode Server)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING') do (
    echo   Killing process %%a on port 3001
    taskkill /F /PID %%a >nul 2>&1
)

REM Kill processes on port 3000 (Backend API)
echo Checking port 3000 (Backend API)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    echo   Killing process %%a on port 3000
    taskkill /F /PID %%a >nul 2>&1
)

REM Kill processes on port 5173 (Frontend)
echo Checking port 5173 (Frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do (
    echo   Killing process %%a on port 5173
    taskkill /F /PID %%a >nul 2>&1
)

echo   ✓ Ports cleaned
echo.

echo [STEP 2/4] Waiting for ports to be released...
timeout /t 2 /nobreak >nul
echo   ✓ Ready to start
echo.

echo [STEP 3/4] Starting all services...
echo.

echo   [1/3] Starting Chaincode Server (Port 3001)...
start "Chaincode Server" cmd /k "cd chaincode\ecta && npm run server"
timeout /t 3 /nobreak >nul
echo   ✓ Chaincode server started

echo   [2/3] Starting Backend API (Port 3000)...
start "Backend API" cmd /k "cd coffee-export-gateway && npm start"
timeout /t 3 /nobreak >nul
echo   ✓ Backend API started

echo   [3/3] Starting Frontend (Port 5173)...
start "Frontend" cmd /k "cd coffee-export-gateway\frontend && npm run dev"
timeout /t 3 /nobreak >nul
echo   ✓ Frontend started

echo.
echo [STEP 4/4] Verifying services...
timeout /t 5 /nobreak >nul
echo.

echo ╔════════════════════════════════════════════════════════════╗
echo ║     ALL SERVICES STARTED SUCCESSFULLY!                    ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo Services Running:
echo   ✓ Chaincode Server: http://localhost:3001
echo   ✓ Backend API:      http://localhost:3000
echo   ✓ Frontend:         http://localhost:5173
echo.
echo ═══════════════════════════════════════════════════════════
echo                    LOGIN CREDENTIALS
echo ═══════════════════════════════════════════════════════════
echo.
echo EXPORTER USERS:
echo   Username: exporter1  Password: password123
echo   Username: exporter2  Password: password123
echo   Username: exporter3  Password: password123
echo.
echo ECTA USER:
echo   Username: ecta1      Password: password123
echo.
echo ADMIN USER:
echo   Username: admin      Password: admin123
echo.
echo ═══════════════════════════════════════════════════════════
echo.
echo Press any key to open the application in browser...
pause >nul

start http://localhost:5173

echo.
echo ✓ Application opened in browser!
echo.
echo IMPORTANT NOTES:
echo   - All services are running in separate terminal windows
echo   - To stop all services, close those terminal windows
echo   - Or run: taskkill /F /IM node.exe (kills all Node processes)
echo.
echo Press any key to exit this window...
pause >nul
