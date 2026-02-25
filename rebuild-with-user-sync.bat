@echo off
echo ========================================
echo Rebuilding Services with User Sync
echo ========================================
echo.

echo Step 1: Stopping all services...
docker-compose -f docker-compose-hybrid.yml down

echo.
echo Step 2: Rebuilding blockchain-bridge with user sync...
docker-compose -f docker-compose-hybrid.yml build blockchain-bridge

echo.
echo Step 3: Rebuilding gateway service...
docker-compose -f docker-compose-hybrid.yml build gateway

echo.
echo Step 4: Rebuilding frontend with fixed nginx config...
docker-compose -f docker-compose-hybrid.yml build frontend

echo.
echo Step 5: Starting all services...
docker-compose -f docker-compose-hybrid.yml up -d

echo.
echo Step 6: Waiting for services to initialize (60 seconds)...
timeout /t 60 /nobreak

echo.
echo Step 7: Checking service status...
docker-compose -f docker-compose-hybrid.yml ps

echo.
echo Step 8: Checking blockchain-bridge logs...
docker-compose -f docker-compose-hybrid.yml logs blockchain-bridge --tail=50

echo.
echo ========================================
echo Rebuild Complete!
echo ========================================
echo.
echo Services Status:
echo - PostgreSQL: Should be healthy
echo - Redis: Should be healthy
echo - Kafka: Should be healthy
echo - Chaincode Server: Should be healthy
echo - Gateway: Should be healthy
echo - Blockchain Bridge: Should be initializing users
echo - Frontend: Should be running
echo.
echo User Sync Features:
echo - Users are created in both PostgreSQL and Blockchain
echo - Test users are automatically initialized
echo - User status updates sync via Kafka
echo.
echo API Endpoints:
echo - Frontend: http://localhost:5173
echo - Gateway: http://localhost:3000
echo - Blockchain Bridge: http://localhost:3008
echo - Chaincode Server: http://localhost:3001
echo.
echo User Sync Endpoints:
echo - POST http://localhost:3008/users/initialize - Initialize test users
echo - POST http://localhost:3008/users/sync - Sync users to blockchain
echo.
echo Test Users Created:
echo - admin / admin123 (admin)
echo - exporter1 / password123 (exporter)
echo - exporter2 / password123 (exporter)
echo - bank1 / password123 (bank)
echo - ecta1 / password123 (ecta)
echo - customs1 / password123 (customs)
echo - nbe1 / password123 (nbe)
echo - ecx1 / password123 (ecx)
echo - shipping1 / password123 (shipping)
echo.
pause
