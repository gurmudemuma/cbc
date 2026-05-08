@echo off
REM ============================================================================
REM STEP 1: PACKAGE CHAINCODE
REM Creates a chaincode package ready for installation
REM ============================================================================

setlocal enabledelayedexpansion

echo.
echo ============================================================================
echo              STEP 1: PACKAGE CHAINCODE
echo ============================================================================
echo.

REM Configuration
set CC_NAME=ecta
set CC_VERSION=1.0
set CC_PATH=/opt/gopath/src/github.com/hyperledger/fabric/chaincode/ecta
set CC_LANG=node

echo Configuration:
echo   Chaincode Name: %CC_NAME%
echo   Version: %CC_VERSION%
echo   Language: %CC_LANG%
echo   Source Path: %CC_PATH%
echo.

pause

echo [INFO] Cleaning old packages...
docker exec cli rm -f /opt/gopath/src/github.com/hyperledger/fabric/peer/*.tar.gz 2>nul
echo.

echo [INFO] Packaging chaincode...
docker exec cli peer lifecycle chaincode package %CC_NAME%.tar.gz --path %CC_PATH% --lang %CC_LANG% --label %CC_NAME%_%CC_VERSION%

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Packaging failed!
    echo.
    echo Troubleshooting:
    echo   1. Check if chaincode source exists at: %CC_PATH%
    echo   2. Verify Docker containers are running: docker ps
    echo   3. Check CLI container logs: docker logs cli
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================================================
echo [SUCCESS] Chaincode Packaged Successfully!
echo ============================================================================
echo.
echo Package: %CC_NAME%.tar.gz
echo Label: %CC_NAME%_%CC_VERSION%
echo Location: CLI container at /opt/gopath/src/github.com/hyperledger/fabric/peer/
echo.
echo Next Step: Run 2-install-chaincode.bat to install on all peers
echo.
echo ============================================================================

endlocal
pause
