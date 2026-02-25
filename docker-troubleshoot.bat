@echo off
echo ============================================
echo Docker Troubleshooting Tool
echo ============================================
echo.

echo Checking Docker status...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [FAIL] Docker is not running
    echo Please start Docker Desktop
    pause
    exit /b 1
) else (
    echo [OK] Docker is running
)

echo.
echo Checking Docker connectivity...
docker pull hello-world >nul 2>&1
if %errorlevel% neq 0 (
    echo [FAIL] Cannot connect to Docker registry
    echo.
    echo Possible solutions:
    echo 1. Check your internet connection
    echo 2. Restart Docker Desktop
    echo 3. Check firewall/antivirus settings
    echo 4. Try using a VPN if behind corporate firewall
    echo.
    echo To configure Docker for slow connections:
    echo   - Open Docker Desktop Settings
    echo   - Go to Docker Engine
    echo   - Add: "max-concurrent-downloads": 3
    echo.
) else (
    echo [OK] Docker registry is accessible
    docker rmi hello-world >nul 2>&1
)

echo.
echo Checking existing images...
echo.
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

echo.
echo Checking running containers...
echo.
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo.
echo Disk space usage...
docker system df

echo.
echo ============================================
echo Troubleshooting complete
echo ============================================
pause
