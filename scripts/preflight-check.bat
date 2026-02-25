@echo off
REM Pre-flight check before deploying Fabric network
REM Verifies all prerequisites are met

echo ========================================
echo Fabric Network Pre-flight Check
echo ========================================
echo.

set ERRORS=0

REM Check 1: Docker
echo [1/8] Checking Docker...
docker info >nul 2>&1
if errorlevel 1 (
    echo    [FAIL] Docker is not running
    set /a ERRORS+=1
) else (
    echo    [PASS] Docker is running
)

REM Check 2: Docker Compose
echo [2/8] Checking Docker Compose...
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo    [FAIL] Docker Compose not found
    set /a ERRORS+=1
) else (
    echo    [PASS] Docker Compose available
)

REM Check 3: Crypto Config
echo [3/8] Checking crypto-config...
if not exist "crypto-config\peerOrganizations\ecta.example.com" (
    echo    [FAIL] Crypto material not found
    set /a ERRORS+=1
) else (
    echo    [PASS] Crypto material exists
)

REM Check 4: Chaincode
echo [4/8] Checking chaincode...
if not exist "chaincode\ecta\index.js" (
    echo    [FAIL] Chaincode not found
    set /a ERRORS+=1
) else (
    echo    [PASS] Chaincode exists
)

REM Check 5: Chaincode Dependencies
echo [5/8] Checking chaincode dependencies...
if not exist "chaincode\ecta\node_modules" (
    echo    [WARN] Chaincode dependencies not installed
    echo           Run: cd chaincode\ecta ^&^& npm install
    set /a ERRORS+=1
) else (
    echo    [PASS] Chaincode dependencies installed
)

REM Check 6: Configuration Files
echo [6/8] Checking configuration files...
if not exist "config\configtx.yaml" (
    echo    [FAIL] configtx.yaml not found
    set /a ERRORS+=1
) else (
    echo    [PASS] Configuration files exist
)

REM Check 7: Docker Compose File
echo [7/8] Checking docker-compose-fabric.yml...
if not exist "docker-compose-fabric.yml" (
    echo    [FAIL] docker-compose-fabric.yml not found
    set /a ERRORS+=1
) else (
    echo    [PASS] Docker compose file exists
)

REM Check 8: Port Availability
echo [8/8] Checking port availability...
netstat -an | findstr ":7050" >nul 2>&1
if not errorlevel 1 (
    echo    [WARN] Port 7050 may be in use
)
netstat -an | findstr ":7051" >nul 2>&1
if not errorlevel 1 (
    echo    [WARN] Port 7051 may be in use
)

echo.
echo ========================================
echo Pre-flight Check Complete
echo ========================================
echo.

if %ERRORS% GTR 0 (
    echo Status: FAILED - %ERRORS% error^(s^) found
    echo.
    echo Please fix the errors above before deploying.
    echo.
    pause
    exit /b 1
)

echo Status: PASSED - All checks successful!
echo.
echo System is ready for Fabric network deployment.
echo.
echo Next steps:
echo 1. Run: start-real-fabric.bat
echo 2. Choose option 5 ^(Complete Setup^)
echo.
pause
exit /b 0
