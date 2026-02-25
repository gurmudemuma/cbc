@echo off
echo ============================================
echo Pulling Docker Images for Hybrid System
echo ============================================
echo.
echo This will download images one at a time to avoid timeout issues.
echo.

echo [1/4] Pulling PostgreSQL...
docker pull postgres:14-alpine
if %errorlevel% neq 0 (
    echo ERROR: Failed to pull postgres image
    echo Retrying...
    docker pull postgres:14-alpine
)

echo.
echo [2/4] Pulling Redis...
docker pull redis:7-alpine
if %errorlevel% neq 0 (
    echo ERROR: Failed to pull redis image
    echo Retrying...
    docker pull redis:7-alpine
)

echo.
echo [3/4] Pulling Zookeeper...
docker pull confluentinc/cp-zookeeper:7.5.0
if %errorlevel% neq 0 (
    echo ERROR: Failed to pull zookeeper image
    echo Retrying...
    docker pull confluentinc/cp-zookeeper:7.5.0
)

echo.
echo [4/4] Pulling Kafka...
docker pull confluentinc/cp-kafka:7.5.0
if %errorlevel% neq 0 (
    echo ERROR: Failed to pull kafka image
    echo Retrying...
    docker pull confluentinc/cp-kafka:7.5.0
)

echo.
echo ============================================
echo All images pulled successfully!
echo ============================================
echo.
echo You can now run: docker-compose -f docker-compose-hybrid.yml up -d
echo.
pause
