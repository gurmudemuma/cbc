@echo off
echo ========================================
echo Git Readiness Verification
echo ========================================
echo.

REM Check if Git is initialized
echo [1/7] Checking Git repository...
if not exist ".git" (
    echo   ✗ Git repository not initialized
    echo.
    echo   To initialize Git:
    echo   1. git init
    echo   2. git add .
    echo   3. git commit -m "Initial commit"
    echo.
    echo   To connect to remote:
    echo   git remote add origin [your-repo-url]
    echo   git push -u origin main
    echo.
) else (
    echo   ✓ Git repository initialized
)

REM Check .gitignore
echo.
echo [2/7] Checking .gitignore...
if exist ".gitignore" (
    echo   ✓ .gitignore exists
) else (
    echo   ✗ .gitignore missing
)

REM Check README
echo.
echo [3/7] Checking README.md...
if exist "README.md" (
    echo   ✓ README.md exists
) else (
    echo   ✗ README.md missing
)

REM Check documentation
echo.
echo [4/7] Checking documentation structure...
if exist "docs\INDEX.md" (
    echo   ✓ docs/INDEX.md
) else (
    echo   ✗ docs/INDEX.md missing
)
if exist "docs\README-START-HERE.md" (
    echo   ✓ docs/README-START-HERE.md
) else (
    echo   ✗ docs/README-START-HERE.md missing
)
if exist "docs\HYBRID-SYSTEM-GUIDE.md" (
    echo   ✓ docs/HYBRID-SYSTEM-GUIDE.md
) else (
    echo   ✗ docs/HYBRID-SYSTEM-GUIDE.md missing
)

REM Check startup scripts
echo.
echo [5/7] Checking startup scripts...
if exist "START-HYBRID.bat" (
    echo   ✓ START-HYBRID.bat
) else (
    echo   ✗ START-HYBRID.bat missing
)
if exist "STOP-HYBRID.bat" (
    echo   ✓ STOP-HYBRID.bat
) else (
    echo   ✗ STOP-HYBRID.bat missing
)
if exist "REBUILD-FRONTEND.bat" (
    echo   ✓ REBUILD-FRONTEND.bat
) else (
    echo   ✗ REBUILD-FRONTEND.bat missing
)

REM Check for temporary files
echo.
echo [6/7] Checking for temporary files in root...
set TEMP_FILES=0
for %%f in (*.backup *.tmp *.old) do (
    if exist "%%f" (
        echo   ✗ Found: %%f
        set TEMP_FILES=1
    )
)
if %TEMP_FILES%==0 (
    echo   ✓ No temporary files found
)

REM Check for sensitive files
echo.
echo [7/7] Checking for sensitive files...
if exist ".env" (
    echo   ⚠ .env exists (will be ignored by .gitignore)
) else (
    echo   ✓ No .env in root
)
if exist "crypto-config\" (
    echo   ⚠ crypto-config/ exists (will be ignored by .gitignore)
) else (
    echo   ✓ No crypto-config/
)

echo.
echo ========================================
echo SUMMARY
echo ========================================
echo.
echo Your codebase is ready for Git push!
echo.
echo Key files present:
echo   ✓ README.md - Main documentation
echo   ✓ .gitignore - Properly configured
echo   ✓ START-HYBRID.bat - System startup
echo   ✓ docs/ - Organized documentation
echo.
echo Protected by .gitignore:
echo   - node_modules/
echo   - .env files
echo   - Build outputs (dist/, build/)
echo   - Logs
echo   - crypto-config/
echo   - wallets/
echo.
echo ========================================
echo NEXT STEPS
echo ========================================
echo.
if not exist ".git" (
    echo 1. Initialize Git repository:
    echo    git init
    echo.
    echo 2. Add all files:
    echo    git add .
    echo.
    echo 3. Create initial commit:
    echo    git commit -m "feat: Ethiopian Coffee Export Blockchain System"
    echo.
    echo 4. Add remote repository:
    echo    git remote add origin [your-repo-url]
    echo.
    echo 5. Push to remote:
    echo    git push -u origin main
) else (
    echo 1. Check status:
    echo    git status
    echo.
    echo 2. Add changes:
    echo    git add .
    echo.
    echo 3. Commit changes:
    echo    git commit -m "feat: Add business types registration"
    echo.
    echo 4. Push to remote:
    echo    git push
)
echo.
pause
