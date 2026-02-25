@echo off
echo ========================================
echo Verifying User Synchronization Setup
echo ========================================
echo.

echo Checking if services are running...
docker-compose -f docker-compose-hybrid.yml ps
echo.

echo ========================================
echo Test 1: Check PostgreSQL Users
echo ========================================
docker exec -it coffee-postgres psql -U postgres -d coffee_export_db -c "SELECT username, role, status FROM users ORDER BY username;"
echo.

echo ========================================
echo Test 2: Check Blockchain Bridge Health
echo ========================================
curl -s http://localhost:3008/health
echo.
echo.

echo ========================================
echo Test 3: Check Gateway Health
echo ========================================
curl -s http://localhost:3000/health
echo.
echo.

echo ========================================
echo Test 4: Test User Login (exporter1)
echo ========================================
curl -s -X POST http://localhost:3000/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"exporter1\",\"password\":\"password123\"}"
echo.
echo.

echo ========================================
echo Test 5: Query User from Blockchain
echo ========================================
curl -s -X POST http://localhost:3001/query ^
  -H "Content-Type: application/json" ^
  -d "{\"fcn\":\"GetUser\",\"args\":[\"exporter1\"]}"
echo.
echo.

echo ========================================
echo Test 6: Check Blockchain Bridge Logs
echo ========================================
docker-compose -f docker-compose-hybrid.yml logs blockchain-bridge --tail=30 | findstr /C:"user" /C:"User" /C:"initialized"
echo.

echo ========================================
echo Verification Complete!
echo ========================================
echo.
echo If all tests passed, the user sync system is working correctly.
echo.
echo Next Steps:
echo 1. Access frontend at http://localhost:5173
echo 2. Login with: exporter1 / password123
echo 3. Test user registration and other features
echo.
pause
