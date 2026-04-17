@echo off
REM Test Document Collection Status Endpoint
REM Tests the /api/exporter/documents/collection-status endpoint

echo.
echo ========================================
echo   DOCUMENT COLLECTION STATUS TEST
echo ========================================
echo.

REM Step 1: Login as exporter
echo [1/2] Logging in as exporter...

curl -s -X POST http://localhost:3000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"exporter1\",\"password\":\"password123\"}" ^
  > temp_login.json

if %ERRORLEVEL% NEQ 0 (
  echo Failed to login
  exit /b 1
)

REM Extract token using PowerShell
for /f "delims=" %%i in ('powershell -Command "(Get-Content temp_login.json | ConvertFrom-Json).token"') do set TOKEN=%%i

if "%TOKEN%"=="" (
  echo Failed to extract token
  type temp_login.json
  del temp_login.json
  exit /b 1
)

echo Login successful
echo Token: %TOKEN:~0,20%...
del temp_login.json

REM Step 2: Get document collection status
echo.
echo [2/2] Fetching document collection status...

curl -s -X GET http://localhost:3000/api/exporter/documents/collection-status ^
  -H "Authorization: Bearer %TOKEN%" ^
  -H "Content-Type: application/json" ^
  > temp_status.json

if %ERRORLEVEL% NEQ 0 (
  echo Failed to fetch collection status
  exit /b 1
)

echo Collection status retrieved successfully
echo.
echo ========================================
echo   RESPONSE
echo ========================================
type temp_status.json
echo.
echo ========================================

del temp_status.json

echo.
echo TEST COMPLETED
echo.
