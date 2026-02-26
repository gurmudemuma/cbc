@echo off
echo ========================================
echo Verify Dual Registration System
echo ========================================
echo.
echo This script verifies that ALL registration paths
echo correctly write to BOTH databases:
echo   1. PostgreSQL (CBC application database)
echo   2. CouchDB (Blockchain ledger via Fabric)
echo.
pause

echo.
echo ========================================
echo TEST 1: Public Registration Endpoint
echo ========================================
echo Testing: POST /api/auth/register
echo.

echo Creating test user "testuser1"...
curl -X POST http://localhost:3000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"testuser1\",\"password\":\"password123\",\"email\":\"testuser1@example.com\",\"phone\":\"+251911234567\",\"companyName\":\"Test Company 1\",\"tin\":\"TIN_TEST_001\",\"capitalETB\":50000000,\"address\":\"Addis Ababa\",\"contactPerson\":\"Test User 1\",\"businessType\":\"PRIVATE_EXPORTER\"}"

echo.
echo.
echo Checking PostgreSQL...
docker exec coffee-postgres psql -U postgres -d coffee_export_db -c "SELECT username, email, role, status, company_name FROM users WHERE username = 'testuser1';"

echo.
echo Checking Blockchain...
docker exec coffee-gateway node -e "const fabricService = require('./src/services/fabric-chaincode'); fabricService.getUser('testuser1').then(u => console.log('✓ Found on blockchain:', u.username, '-', u.status)).catch(e => console.error('✗ Not found on blockchain:', e.message));"

echo.
echo.
echo ========================================
echo TEST 2: Test Users Initialization
echo ========================================
echo Testing: createUser() helper function
echo.

echo Restarting gateway to trigger test user initialization...
docker restart coffee-gateway
timeout /t 10 /nobreak

echo.
echo Checking test users in PostgreSQL...
docker exec coffee-postgres psql -U postgres -d coffee_export_db -c "SELECT username, role, status FROM users WHERE username IN ('admin', 'exporter1', 'exporter2', 'bank1', 'ecta1') ORDER BY username;"

echo.
echo Checking test users on Blockchain...
docker exec coffee-gateway node -e "const fabricService = require('./src/services/fabric-chaincode'); Promise.all(['admin', 'exporter1', 'exporter2', 'bank1', 'ecta1'].map(u => fabricService.getUser(u).then(user => console.log('✓', u, '-', user.status)).catch(e => console.error('✗', u, '- NOT FOUND')))).catch(e => console.error(e));"

echo.
echo.
echo ========================================
echo TEST 3: Approval Process
echo ========================================
echo Testing: POST /api/ecta/registrations/:username/approve
echo.

echo Logging in as ECTA admin...
curl -s -X POST http://localhost:3000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"ecta1\",\"password\":\"password123\"}" > temp_token.json

for /f "tokens=2 delims=:," %%a in ('type temp_token.json ^| findstr /C:"token"') do set TOKEN=%%a
set TOKEN=%TOKEN:"=%
set TOKEN=%TOKEN: =%

echo.
echo Approving testuser1...
curl -X POST http://localhost:3000/api/ecta/registrations/testuser1/approve ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer %TOKEN%" ^
  -d "{\"comments\":\"Test approval\"}"

del temp_token.json

echo.
echo.
echo Checking PostgreSQL status...
docker exec coffee-postgres psql -U postgres -d coffee_export_db -c "SELECT username, status FROM users WHERE username = 'testuser1';"

echo.
echo Checking Blockchain status...
docker exec coffee-gateway node -e "const fabricService = require('./src/services/fabric-chaincode'); fabricService.getUser('testuser1').then(u => console.log('✓ Status:', u.status)).catch(e => console.error('✗ Error:', e.message));"

echo.
echo.
echo ========================================
echo TEST 4: Login After Approval
echo ========================================
echo Testing: POST /api/auth/login
echo.

echo Attempting login for testuser1...
curl -X POST http://localhost:3000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"testuser1\",\"password\":\"password123\"}"

echo.
echo.
echo ========================================
echo VERIFICATION SUMMARY
echo ========================================
echo.

echo Counting users in PostgreSQL...
docker exec coffee-postgres psql -U postgres -d coffee_export_db -c "SELECT COUNT(*) as total_users, COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_users, COUNT(CASE WHEN status = 'pending_approval' THEN 1 END) as pending_users FROM users;"

echo.
echo.
echo ========================================
echo CLEANUP (Optional)
echo ========================================
echo.
set /p CLEANUP="Do you want to delete test user 'testuser1'? (Y/N): "
if /i "%CLEANUP%"=="Y" (
  echo Deleting testuser1 from PostgreSQL...
  docker exec coffee-postgres psql -U postgres -d coffee_export_db -c "DELETE FROM users WHERE username = 'testuser1';"
  echo Note: Blockchain records are immutable and cannot be deleted
)

echo.
echo ========================================
echo Verification Complete!
echo ========================================
echo.
echo If all tests passed, the dual registration system is working correctly.
echo All new users will be registered in BOTH databases.
echo.
pause
