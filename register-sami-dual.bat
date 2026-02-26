@echo off
echo ========================================
echo Register User "sami" in BOTH Databases
echo ========================================
echo.

echo Step 1: Registering user "sami" via API...
curl -X POST http://localhost:3000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"sami\",\"password\":\"password123\",\"email\":\"sami@example.com\",\"phone\":\"+251911234567\",\"companyName\":\"Sami Coffee Exports\",\"tin\":\"TIN_SAMI_2024\",\"capitalETB\":50000000,\"address\":\"Addis Ababa, Ethiopia\",\"contactPerson\":\"Sami Ahmed\",\"businessType\":\"PRIVATE_EXPORTER\"}"

echo.
echo.
echo Step 2: Logging in as ECTA admin...
for /f "tokens=*" %%a in ('curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"ecta1\",\"password\":\"password123\"}" ^| findstr /C:"token"') do set TOKEN_LINE=%%a

echo.
echo.
echo Step 3: Approving user "sami"...
curl -X POST http://localhost:3000/api/ecta/registrations/sami/approve ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer %TOKEN%" ^
  -d "{\"comments\":\"Approved by ECTA - All requirements met\"}"

echo.
echo.
echo Step 4: Verifying user "sami" can login...
curl -X POST http://localhost:3000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"sami\",\"password\":\"password123\"}"

echo.
echo.
echo ========================================
echo Registration Complete!
echo ========================================
echo.
echo Login credentials:
echo   Username: sami
echo   Password: password123
echo.
pause
