@echo off
echo ========================================
echo Deploying Frontend Changes
echo ========================================

echo.
echo Step 1: Building frontend...
cd cbc\frontend
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Build failed!
    exit /b 1
)

echo.
echo Step 2: Copying build to container...
cd ..\..
docker cp cbc\frontend\dist\. coffee-frontend:/usr/share/nginx/html/

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Copy failed!
    exit /b 1
)

echo.
echo Step 3: Restarting frontend container...
docker restart coffee-frontend

echo.
echo ========================================
echo Frontend deployed successfully!
echo ========================================
echo.
echo Changes applied:
echo - Login.tsx: Added organization field to registration
echo - Layout.tsx: Updated network member menus
echo - navigation.service.ts: Created agency fetching service
echo.
