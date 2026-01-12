@echo off
REM Start ESW API Server (Port 3008)

echo ========================================
echo Starting ESW API Server
echo ========================================

cd api\esw

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
)

REM Start the server
echo Starting ESW API on port 3008...
npm run dev
