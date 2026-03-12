@echo off
REM ============================================================================
REM FIX CRYPTO MATERIALS
REM Generates missing crypto materials for Fabric network
REM ============================================================================

echo.
echo ========================================
echo  FIX CRYPTO MATERIALS
echo ========================================
echo.
echo The Fabric network needs crypto materials (certificates).
echo This script will generate them.
echo.
pause

echo.
echo [1/4] Checking if crypto-config exists...
if exist crypto-config (
    echo   ✓ crypto-config directory exists
    echo.
    echo   Checking if it has content...
    dir crypto-config\peerOrganizations >nul 2>&1
    if %errorlevel% equ 0 (
        echo   ✓ Crypto materials found
        echo.
        echo   Do you want to regenerate? (This will delete existing materials)
        choice /C YN /M "Regenerate crypto materials"
        if errorlevel 2 goto :skip_generate
    ) else (
        echo   ✗ crypto-config is empty
    )
) else (
    echo   ✗ crypto-config directory missing
)

echo.
echo [2/4] Generating crypto materials...
echo   This may take 1-2 minutes...
echo.

REM Check if cryptogen exists
where cryptogen >nul 2>&1
if %errorlevel% neq 0 (
    echo   ✗ cryptogen not found!
    echo.
    echo   You need to install Fabric binaries first.
    echo   Run: scripts\setup-fabric-binaries.ps1
    echo.
    pause
    exit /b 1
)

REM Generate crypto materials
cryptogen generate --config=config\crypto-config.yaml --output=crypto-config
if %errorlevel% neq 0 (
    echo   ✗ Failed to generate crypto materials
    pause
    exit /b 1
)

echo   ✓ Crypto materials generated

:skip_generate

echo.
echo [3/4] Generating genesis block...

REM Check if configtxgen exists
where configtxgen >nul 2>&1
if %errorlevel% neq 0 (
    echo   ✗ configtxgen not found!
    echo.
    echo   You need to install Fabric binaries first.
    echo   Run: scripts\setup-fabric-binaries.ps1
    echo.
    pause
    exit /b 1
)

REM Set environment
set FABRIC_CFG_PATH=%CD%\config

REM Generate genesis block
if not exist channel-artifacts mkdir channel-artifacts
configtxgen -profile OrdererGenesis -channelID system-channel -outputBlock channel-artifacts\genesis.block
if %errorlevel% neq 0 (
    echo   ✗ Failed to generate genesis block
    pause
    exit /b 1
)

echo   ✓ Genesis block generated

echo.
echo [4/4] Verification...
echo.

REM Check key directories
if exist crypto-config\peerOrganizations\ecta.example.com\peers\peer0.ecta.example.com\msp (
    echo   ✓ ECTA peer crypto materials exist
) else (
    echo   ✗ ECTA peer crypto materials missing
)

if exist crypto-config\ordererOrganizations\orderer.example.com\orderers\orderer1.orderer.example.com\msp (
    echo   ✓ Orderer crypto materials exist
) else (
    echo   ✗ Orderer crypto materials missing
)

if exist channel-artifacts\genesis.block (
    echo   ✓ Genesis block exists
) else (
    echo   ✗ Genesis block missing
)

echo.
echo ========================================
echo  CRYPTO MATERIALS READY!
echo ========================================
echo.
echo Next steps:
echo   1. Stop any running containers: STOP-UNIFIED-SYSTEM.bat
echo   2. Start the system: START-UNIFIED-SYSTEM.bat
echo.
pause
