@echo off
echo ========================================
echo Seeding Database with Initial Data
echo ========================================
echo.

echo Step 1: Enrolling Admin...
docker exec coffee-gateway node src/scripts/enrollAdminFromCrypto.js
if %ERRORLEVEL% NEQ 0 (
    echo [WARN] Admin enrollment may have already been done
)
echo.

echo Step 2: Seeding Users...
docker exec coffee-gateway node src/scripts/seedUsers.js
if %ERRORLEVEL% NEQ 0 (
    echo [WARN] Users may already exist
)
echo.

echo Step 3: Seeding Buyers...
docker exec coffee-gateway node src/scripts/seedBuyers.js
if %ERRORLEVEL% NEQ 0 (
    echo [WARN] Buyers may already exist
)
echo.

echo Step 4: Seeding Licenses...
docker exec coffee-gateway node src/scripts/seedLicenses.js
if %ERRORLEVEL% NEQ 0 (
    echo [WARN] Licenses may already exist
)
echo.

echo Step 5: Syncing to Blockchain...
docker exec coffee-gateway node src/scripts/syncUsersToBlockchain.js
if %ERRORLEVEL% NEQ 0 (
    echo [WARN] Blockchain sync may have issues
)
echo.

echo ========================================
echo Database Seeding Complete!
echo ========================================
echo.
echo Now run: .\test-all-workflows.bat
echo.
pause
