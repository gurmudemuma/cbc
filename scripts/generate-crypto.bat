@echo off
echo ========================================
echo Generating Crypto Materials
echo ========================================
echo.

echo Step 1: Creating fabric-network...
docker network create fabric-network 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Network created
) else (
    echo [INFO] Network already exists
)
echo.

echo Step 2: Generating crypto materials using cryptogen...
docker run --rm -v "%CD%:/work" -w /work hyperledger/fabric-tools:2.5 cryptogen generate --config=./crypto-config.yaml --output="./crypto-config"
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to generate crypto materials
    exit /b 1
)
echo [SUCCESS] Crypto materials generated
echo.

echo Step 3: Verifying crypto materials...
docker run --rm -v "%CD%:/work" -w /work hyperledger/fabric-tools:2.5 ls -la ./crypto-config/peerOrganizations/ecta.example.com/users/
echo.

echo ========================================
echo Crypto Generation Complete!
echo ========================================
echo.
echo Generated:
echo   - Orderer certificates (3 orderers)
echo   - Peer certificates (6 peers)
echo   - User certificates (Admin + users for each org)
echo   - TLS certificates for all nodes
echo.
echo Next: Run start-system.bat to start the blockchain network
echo.
pause
