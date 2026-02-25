@echo off
REM Test CouchDB Integration Script
REM Verifies CouchDB instances are running and accessible

echo ========================================
echo CouchDB Integration Test
echo ========================================
echo.

echo Testing CouchDB instances...
echo.

echo 1. ECTA Peer0 CouchDB (port 5984)
curl -s http://admin:adminpw@localhost:5984/ >nul 2>&1
if errorlevel 1 (
    echo    [FAIL] Not accessible
) else (
    echo    [OK] Accessible
)

echo 2. ECTA Peer1 CouchDB (port 6984)
curl -s http://admin:adminpw@localhost:6984/ >nul 2>&1
if errorlevel 1 (
    echo    [FAIL] Not accessible
) else (
    echo    [OK] Accessible
)

echo 3. Bank Peer0 CouchDB (port 7984)
curl -s http://admin:adminpw@localhost:7984/ >nul 2>&1
if errorlevel 1 (
    echo    [FAIL] Not accessible
) else (
    echo    [OK] Accessible
)

echo 4. NBE Peer0 CouchDB (port 8984)
curl -s http://admin:adminpw@localhost:8984/ >nul 2>&1
if errorlevel 1 (
    echo    [FAIL] Not accessible
) else (
    echo    [OK] Accessible
)

echo 5. Customs Peer0 CouchDB (port 9984)
curl -s http://admin:adminpw@localhost:9984/ >nul 2>&1
if errorlevel 1 (
    echo    [FAIL] Not accessible
) else (
    echo    [OK] Accessible
)

echo 6. Shipping Peer0 CouchDB (port 10984)
curl -s http://admin:adminpw@localhost:10984/ >nul 2>&1
if errorlevel 1 (
    echo    [FAIL] Not accessible
) else (
    echo    [OK] Accessible
)

echo.
echo ========================================
echo Checking for channel databases...
echo ========================================
echo.

echo ECTA Peer0 databases:
curl -s http://admin:adminpw@localhost:5984/_all_dbs 2>nul | findstr "coffeechannel"
if errorlevel 1 (
    echo    [INFO] No channel databases yet (normal before channel creation)
) else (
    echo    [OK] Channel databases found
)

echo.
echo ========================================
echo CouchDB Web Interfaces:
echo ========================================
echo.
echo ECTA Peer0:    http://localhost:5984/_utils
echo ECTA Peer1:    http://localhost:6984/_utils
echo Bank Peer0:    http://localhost:7984/_utils
echo NBE Peer0:     http://localhost:8984/_utils
echo Customs Peer0: http://localhost:9984/_utils
echo Shipping Peer0: http://localhost:10984/_utils
echo.
echo Login: admin / adminpw
echo.

echo ========================================
echo Test Complete
echo ========================================
echo.
echo If all CouchDB instances show [OK], the integration is successful!
echo.
echo Next steps:
echo 1. Create channel: scripts\create-channel.bat
echo 2. Deploy chaincode: scripts\deploy-chaincode.bat
echo 3. Check databases appear in CouchDB
echo.

pause
