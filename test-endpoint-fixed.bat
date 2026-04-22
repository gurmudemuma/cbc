@echo off
setlocal enabledelayedexpansion

echo Getting token...
curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"admin123\"}" > token.json

echo.
echo Token response:
type token.json
echo.

echo Extracting token...
for /f "tokens=2 delims=:" %%a in ('findstr /C:"token" token.json') do (
    set TOKENLINE=%%a
    set TOKENLINE=!TOKENLINE:,=!
    set TOKENLINE=!TOKENLINE:"=!
    set TOKENLINE=!TOKENLINE: =!
    set TOKEN=!TOKENLINE!
)

echo Token: !TOKEN!
echo.

echo Testing exporter dashboard...
curl -v -H "Authorization: Bearer !TOKEN!" http://localhost:3000/api/exporter/dashboard

echo.
echo Testing exports...
curl -v -H "Authorization: Bearer !TOKEN!" http://localhost:3000/api/exports

del token.json
pause
