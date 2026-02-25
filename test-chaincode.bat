@echo off
echo ========================================
echo Chaincode Testing Script
echo ========================================
echo.

echo [1/5] Checking if chaincode server is running...
curl -s http://localhost:3001/health >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ✗ Chaincode server not running
    echo   Starting chaincode server...
    docker-compose -f docker-compose-hybrid.yml up -d chaincode-server
    timeout /t 5 /nobreak > nul
)
echo ✓ Chaincode server is running

echo.
echo [2/5] Testing health endpoint...
curl -s http://localhost:3001/health
echo.

echo.
echo [3/5] Testing RegisterUser function...
curl -s -X POST http://localhost:3001/invoke ^
  -H "Content-Type: application/json" ^
  -d "{\"fcn\":\"RegisterUser\",\"args\":[\"{\\\"username\\\":\\\"test_user\\\",\\\"passwordHash\\\":\\\"hash123\\\",\\\"email\\\":\\\"test@test.com\\\",\\\"role\\\":\\\"exporter\\\",\\\"companyName\\\":\\\"Test Company\\\",\\\"tin\\\":\\\"123456\\\"}\"]}"
echo.

echo.
echo [4/5] Testing GetUser function...
curl -s -X POST http://localhost:3001/query ^
  -H "Content-Type: application/json" ^
  -d "{\"fcn\":\"GetUser\",\"args\":[\"test_user\"]}"
echo.

echo.
echo [5/5] Checking ledger state...
curl -s http://localhost:3001/ledger | findstr "count"
echo.

echo.
echo ========================================
echo Chaincode Test Complete!
echo ========================================
echo.
echo Chaincode server: http://localhost:3001
echo Health: http://localhost:3001/health
echo Ledger: http://localhost:3001/ledger
echo.
echo Available endpoints:
echo   POST /invoke - Execute chaincode function
echo   POST /query - Query chaincode function
echo   GET /health - Health check
echo   GET /ledger - View ledger state
echo   GET /history - View transaction history
echo.
pause
