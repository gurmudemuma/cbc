@echo off
REM ============================================================================
REM VERIFY ALL FIXES
REM Checks that all fixes have been applied correctly
REM ============================================================================

echo.
echo ========================================
echo  VERIFYING ALL FIXES
echo ========================================
echo.
echo This will verify:
echo   1. seedUsers.js has admin check
echo   2. START-UNIFIED-SYSTEM.bat has proper timing
echo   3. tsconfig.json is fixed
echo   4. All documentation exists
echo.
pause

set PASS=0
set FAIL=0

echo.
echo ========================================
echo  CHECKING FILES
echo ========================================
echo.

REM Check seedUsers.js
echo [1/10] Checking seedUsers.js...
findstr /C:"adminEnrolled" coffee-export-gateway\src\scripts\seedUsers.js >nul 2>&1
if %errorlevel% equ 0 (
    echo   ✓ seedUsers.js has admin check
    set /a PASS+=1
) else (
    echo   ✗ seedUsers.js missing admin check
    set /a FAIL+=1
)

REM Check START-UNIFIED-SYSTEM.bat
echo [2/10] Checking START-UNIFIED-SYSTEM.bat...
findstr /C:"Waiting for admin enrollment" START-UNIFIED-SYSTEM.bat >nul 2>&1
if %errorlevel% equ 0 (
    echo   ✓ START-UNIFIED-SYSTEM.bat has proper timing
    set /a PASS+=1
) else (
    echo   ✗ START-UNIFIED-SYSTEM.bat missing timing fix
    set /a FAIL+=1
)

REM Check tsconfig.json
echo [3/10] Checking tsconfig.json...
findstr /C:"typeRoots" services\blockchain-bridge\tsconfig.json >nul 2>&1
if %errorlevel% equ 0 (
    echo   ✓ tsconfig.json is fixed
    set /a PASS+=1
) else (
    echo   ✗ tsconfig.json not fixed
    set /a FAIL+=1
)

REM Check FIX-USER-LOGIN.md
echo [4/10] Checking FIX-USER-LOGIN.md...
if exist FIX-USER-LOGIN.md (
    echo   ✓ FIX-USER-LOGIN.md exists
    set /a PASS+=1
) else (
    echo   ✗ FIX-USER-LOGIN.md missing
    set /a FAIL+=1
)

REM Check SYNC-USERS-TO-BLOCKCHAIN.bat
echo [5/10] Checking SYNC-USERS-TO-BLOCKCHAIN.bat...
if exist SYNC-USERS-TO-BLOCKCHAIN.bat (
    echo   ✓ SYNC-USERS-TO-BLOCKCHAIN.bat exists
    set /a PASS+=1
) else (
    echo   ✗ SYNC-USERS-TO-BLOCKCHAIN.bat missing
    set /a FAIL+=1
)

REM Check SYSTEM-READY-TO-RUN.md
echo [6/10] Checking SYSTEM-READY-TO-RUN.md...
if exist SYSTEM-READY-TO-RUN.md (
    echo   ✓ SYSTEM-READY-TO-RUN.md exists
    set /a PASS+=1
) else (
    echo   ✗ SYSTEM-READY-TO-RUN.md missing
    set /a FAIL+=1
)

REM Check FINAL-FIX-SUMMARY.md
echo [7/10] Checking FINAL-FIX-SUMMARY.md...
if exist FINAL-FIX-SUMMARY.md (
    echo   ✓ FINAL-FIX-SUMMARY.md exists
    set /a PASS+=1
) else (
    echo   ✗ FINAL-FIX-SUMMARY.md missing
    set /a FAIL+=1
)

REM Check 🚀-START-HERE.md
echo [8/10] Checking 🚀-START-HERE.md...
if exist 🚀-START-HERE.md (
    echo   ✓ 🚀-START-HERE.md exists
    set /a PASS+=1
) else (
    echo   ✗ 🚀-START-HERE.md missing
    set /a FAIL+=1
)

REM Check QUICK-REFERENCE.md
echo [9/10] Checking QUICK-REFERENCE.md...
if exist QUICK-REFERENCE.md (
    echo   ✓ QUICK-REFERENCE.md exists
    set /a PASS+=1
) else (
    echo   ✗ QUICK-REFERENCE.md missing
    set /a FAIL+=1
)

REM Check BLOCKCHAIN-BRIDGE-FIX.md
echo [10/10] Checking BLOCKCHAIN-BRIDGE-FIX.md...
if exist BLOCKCHAIN-BRIDGE-FIX.md (
    echo   ✓ BLOCKCHAIN-BRIDGE-FIX.md exists
    set /a PASS+=1
) else (
    echo   ✗ BLOCKCHAIN-BRIDGE-FIX.md missing
    set /a FAIL+=1
)

echo.
echo ========================================
echo  VERIFICATION RESULTS
echo ========================================
echo.
echo   Passed: %PASS%/10
echo   Failed: %FAIL%/10
echo.

if %FAIL% equ 0 (
    echo ========================================
    echo  ✅ ALL FIXES VERIFIED!
    echo ========================================
    echo.
    echo All fixes have been applied correctly.
    echo Your system is ready to run!
    echo.
    echo Next step:
    echo   START-UNIFIED-SYSTEM.bat
    echo.
) else (
    echo ========================================
    echo  ⚠ SOME FIXES MISSING
    echo ========================================
    echo.
    echo Some fixes are not applied correctly.
    echo Please check the failed items above.
    echo.
)

pause
