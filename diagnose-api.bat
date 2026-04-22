@echo off
echo ========================================
echo API Endpoint Diagnostics
echo ========================================
echo.

set GATEWAY=http://localhost:3000

echo Getting auth token...
curl -s -X POST %GATEWAY%/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"admin\",\"password\":\"admin123\"}" > temp_token.json

for /f "tokens=2 delims=:," %%a in ('findstr /C:"token" temp_token.json') do set TOKEN=%%a
set TOKEN=%TOKEN:"=%
set TOKEN=%TOKEN: =%

echo Token: %TOKEN%
echo.

echo Testing /api/users endpoint...
curl -v -H "Authorization: Bearer %TOKEN%" %GATEWAY%/api/users 2>&1 | findstr "HTTP"
echo.

echo Testing /api/ecta/pre-registrations endpoint...
curl -v -H "Authorization: Bearer %TOKEN%" %GATEWAY%/api/ecta/pre-registrations 2>&1 | findstr "HTTP"
echo.

echo Testing /api/sales-contracts endpoint...
curl -v -H "Authorization: Bearer %TOKEN%" %GATEWAY%/api/sales-contracts 2>&1 | findstr "HTTP"
echo.

echo Testing /api/document-requests endpoint...
curl -v -H "Authorization: Bearer %TOKEN%" %GATEWAY%/api/document-requests 2>&1 | findstr "HTTP"
echo.

echo Testing /api/exports endpoint...
curl -v -H "Authorization: Bearer %TOKEN%" %GATEWAY%/api/exports 2>&1 | findstr "HTTP"
echo.

echo Checking gateway logs for errors...
echo ========================================
docker logs coffee-gateway --tail 50 | findstr "error"
echo ========================================

del temp_token.json 2>nul
pause
