@echo off
echo Getting token...
curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"admin123\"}" > token.json

echo.
echo Testing exporter dashboard...
for /f "tokens=2 delims=:," %%a in ('findstr /C:"token" token.json') do set TOKEN=%%a
set TOKEN=%TOKEN:"=%
set TOKEN=%TOKEN: =%

curl -v -H "Authorization: Bearer %TOKEN%" http://localhost:3000/api/exporter/dashboard

del token.json
pause
