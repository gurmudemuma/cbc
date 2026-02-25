@echo off
echo ╔════════════════════════════════════════════════════════════╗
echo ║     FIX ESBUILD LOCK ISSUE                                 ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo This script will fix the "EBUSY: resource busy or locked" error
echo that occurs when esbuild.exe is locked by a running process.
echo.

echo [STEP 1/4] Stopping all Node.js processes...
echo.

REM Kill all node processes
taskkill /F /IM node.exe >nul 2>&1
echo   ✓ All Node.js processes stopped

echo.
echo [STEP 2/4] Waiting for file locks to be released...
timeout /t 3 /nobreak >nul
echo   ✓ File locks should be released

echo.
echo [STEP 3/4] Cleaning npm cache...
cd coffee-export-gateway\frontend
call npm cache clean --force
echo   ✓ npm cache cleaned

echo.
echo [STEP 4/4] Reinstalling dependencies...
echo.
echo This may take a few minutes...
echo.

call npm install

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ╔════════════════════════════════════════════════════════════╗
    echo ║     FIX COMPLETE!                                          ║
    echo ╚════════════════════════════════════════════════════════════╝
    echo.
    echo Dependencies installed successfully.
    echo You can now run START-ALL.bat
) else (
    echo.
    echo ╔════════════════════════════════════════════════════════════╗
    echo ║     INSTALLATION FAILED                                    ║
    echo ╚════════════════════════════════════════════════════════════╝
    echo.
    echo If the error persists, try these steps:
    echo   1. Close ALL terminal windows
    echo   2. Restart your computer
    echo   3. Run this script again
    echo.
    echo Or try manual cleanup:
    echo   1. Delete: coffee-export-gateway\frontend\node_modules
    echo   2. Run: npm install
)

echo.
pause
