@echo off
echo ============================================
echo Hybrid System Status Check
echo ============================================
echo.

echo Container Status:
echo ==================
docker-compose -f docker-compose-hybrid.yml ps
echo.

echo Health Checks:
echo ==================
echo.

echo [Infrastructure]
echo Postgres:
docker exec coffee-postgres pg_isready -U postgres 2>nul || echo Not running
echo.
echo Redis:
docker exec coffee-redis redis-cli ping 2>nul || echo Not running
echo.
echo Zookeeper:
docker exec coffee-zookeeper echo "ruok" | nc localhost 2181 2>nul || echo Not running
echo.
echo Kafka:
docker exec coffee-kafka kafka-broker-api-versions --bootstrap-server localhost:9092 2>nul | findstr "ApiVersion" >nul && echo Ready || echo Not ready
echo.

echo [Application Services]
echo Chaincode Server:
curl -s http://localhost:3001/health 2>nul | findstr "ok" >nul && echo Healthy || echo Not responding
echo.
echo Gateway:
curl -s http://localhost:3000/health 2>nul | findstr "ok" >nul && echo Healthy || echo Not responding
echo.
echo Blockchain Bridge:
curl -s http://localhost:3008/health 2>nul | findstr "ok" >nul && echo Healthy || echo Not responding
echo.
echo ECTA Service:
curl -s http://localhost:3003/health 2>nul | findstr "ok" >nul && echo Healthy || echo Not responding
echo.

echo Port Bindings:
echo ==================
netstat -an | findstr "5173 3000 3001 3002 3003 3004 3005 3006 3007 3008 5432 6379 9092 9093"
echo.

echo Recent Logs (last 20 lines):
echo ==================
docker-compose -f docker-compose-hybrid.yml logs --tail=20
echo.

pause
