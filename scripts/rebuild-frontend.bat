@echo off
REM Rebuild frontend and update running container
echo Rebuilding frontend with updated code...

REM Stop any running npm processes
taskkill /F /IM node.exe 2>nul

REM Build inside a fresh container
echo Building frontend in temporary container...
docker run --rm -v "%CD%\cbc\frontend:/app" -v "%CD%\cbc\services\shared:/shared" -w /app node:20-alpine sh -c "cp /shared/api-endpoints.constants.ts ./services/shared/api-endpoints.constants.ts && npm install --legacy-peer-deps && npm run build"

if errorlevel 1 (
    echo Build failed!
    exit /b 1
)

echo Build successful! Copying to running container...
docker cp cbc\frontend\dist\. coffee-frontend:/usr/share/nginx/html/

echo Restarting nginx...
docker exec coffee-frontend nginx -s reload

echo Done! Frontend updated with Sales Contracts in sidebar.
echo Please refresh your browser (Ctrl+Shift+R) to see changes.
