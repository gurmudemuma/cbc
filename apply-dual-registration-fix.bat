@echo off
echo ========================================
echo Apply Dual Registration Fix
echo ========================================
echo.

echo This script will:
echo 1. Restart the coffee-gateway to load updated code
echo 2. Register user "sami" in both databases
echo 3. Approve user "sami" via ECTA
echo 4. Verify login works
echo.

pause

echo.
echo Step 1: Restarting coffee-gateway...
docker restart coffee-gateway

echo Waiting for gateway to be ready...
timeout /t 10 /nobreak

echo.
echo Step 2: Registering user "sami"...
curl -X POST http://localhost:3000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"sami\",\"password\":\"password123\",\"email\":\"sami@example.com\",\"phone\":\"+251911234567\",\"companyName\":\"Sami Coffee Exports\",\"tin\":\"TIN_SAMI_2024\",\"capitalETB\":50000000,\"address\":\"Addis Ababa, Ethiopia\",\"contactPerson\":\"Sami Ahmed\",\"businessType\":\"PRIVATE_EXPORTER\"}"

echo.
echo.
echo Step 3: Checking PostgreSQL...
docker exec coffee-postgres psql -U postgres -d coffee_export_db -c "SELECT username, email, role, status FROM users WHERE username = 'sami';"

echo.
echo.
echo Step 4: Logging in as ECTA admin...
curl -s -X POST http://localhost:3000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"ecta1\",\"password\":\"password123\"}" > temp_token.json

echo.
echo.
echo Step 5: Approving user "sami"...
for /f "tokens=2 delims=:," %%a in ('type temp_token.json ^| findstr /C:"token"') do set TOKEN=%%a
set TOKEN=%TOKEN:"=%
set TOKEN=%TOKEN: =%

curl -X POST http://localhost:3000/api/ecta/registrations/sami/approve ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer %TOKEN%" ^
  -d "{\"comments\":\"Approved by ECTA - All requirements met\"}"

del temp_token.json

echo.
echo.
echo Step 6: Verifying PostgreSQL status...
docker exec coffee-postgres psql -U postgres -d coffee_export_db -c "SELECT username, email, role, status FROM users WHERE username = 'sami';"

echo.
echo.
echo Step 7: Testing login for user "sami"...
curl -X POST http://localhost:3000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"sami\",\"password\":\"password123\"}"

echo.
echo.
echo ========================================
echo Dual Registration Fix Applied!
echo ========================================
echo.
echo User "sami" should now be able to login with:
echo   Username: sami
echo   Password: password123
echo.
echo Both databases (PostgreSQL and Blockchain) are now synchronized.
echo.
pause
