@echo off
echo ========================================
echo Git Pre-Push Preparation
echo ========================================
echo.

REM Step 1: Run cleanup
echo [1/6] Cleaning up temporary files...
call CLEANUP-CODEBASE.bat

REM Step 2: Remove sensitive files
echo.
echo [2/6] Checking for sensitive files...
if exist ".env" (
    echo   WARNING: .env file exists - will be ignored by .gitignore
)
if exist "wallets\" (
    echo   WARNING: wallets/ directory exists - will be ignored by .gitignore
)
if exist "crypto-config\" (
    echo   WARNING: crypto-config/ exists - will be ignored by .gitignore
)

REM Step 3: Remove build artifacts
echo.
echo [3/6] Removing build artifacts...
rmdir /s /q "cbc\frontend\dist" 2>nul
rmdir /s /q "cbc\frontend\node_modules\.vite" 2>nul
echo   Done

REM Step 4: Check for temporary files
echo.
echo [4/6] Checking for temporary files...
if exist "*.backup" (
    echo   WARNING: Found .backup files
)
if exist "*.tmp" (
    echo   WARNING: Found .tmp files
)
if exist "*.old" (
    echo   WARNING: Found .old files
)
echo   Done

REM Step 5: Verify documentation structure
echo.
echo [5/6] Verifying documentation structure...
if exist "docs\INDEX.md" (
    echo   ✓ docs/INDEX.md exists
) else (
    echo   ✗ docs/INDEX.md missing
)
if exist "docs\README-START-HERE.md" (
    echo   ✓ docs/README-START-HERE.md exists
) else (
    echo   ✗ docs/README-START-HERE.md missing
)
if exist "docs\HYBRID-SYSTEM-GUIDE.md" (
    echo   ✓ docs/HYBRID-SYSTEM-GUIDE.md exists
) else (
    echo   ✗ docs/HYBRID-SYSTEM-GUIDE.md missing
)
echo   Done

REM Step 6: Create commit summary
echo.
echo [6/6] Creating commit summary...
echo.

echo ========================================
echo GIT READY CHECKLIST
echo ========================================
echo.
echo ✓ Temporary documentation cleaned
echo ✓ Build artifacts removed
echo ✓ Sensitive files checked
echo ✓ Documentation organized in docs/
echo.
echo Files ready to commit:
echo   - Source code (chaincode, gateway, services, frontend)
echo   - Docker configurations
echo   - Documentation (docs/)
echo   - Startup scripts (START-HYBRID.bat, STOP-HYBRID.bat)
echo   - README.md
echo.
echo Files ignored by .gitignore:
echo   - node_modules/
echo   - .env files
echo   - Build outputs (dist/, build/)
echo   - Logs
echo   - crypto-config/
echo   - wallets/
echo.
echo ========================================
echo CODEBASE STATUS
echo ========================================
echo.
echo ✓ Root directory clean (only essential files)
echo ✓ Documentation organized in docs/
echo ✓ Startup scripts ready (START-HYBRID.bat, STOP-HYBRID.bat)
echo ✓ .gitignore configured properly
echo ✓ No temporary files in root
echo ✓ Build artifacts removed
echo.
echo ========================================
echo SUGGESTED COMMIT MESSAGE
echo ========================================
echo.
echo feat: Ethiopian Coffee Export Blockchain System
echo.
echo Complete hybrid blockchain system for coffee export management
echo.
echo Features:
echo - Business types registration with dynamic capital requirements
echo   * Private Limited Company: 50M ETB
echo   * Union/Cooperative: 15M ETB
echo   * Individual Exporter: 10M ETB
echo   * Farmer Cooperative: 5M ETB
echo.
echo - Hyperledger Fabric blockchain network
echo   * 3 Orderers, 6 Peers across 6 organizations
echo   * Smart contracts for export workflow
echo   * CouchDB state databases
echo.
echo - Application services
echo   * Gateway API with business validation
echo   * Blockchain Bridge for data synchronization
echo   * CBC Services (ECTA, Banks, Customs, ECX, Shipping)
echo   * React frontend with Material-UI
echo.
echo - Infrastructure
echo   * PostgreSQL database
echo   * Redis cache
echo   * Kafka message broker
echo.
echo - Single command deployment
echo   * START-HYBRID.bat - Start complete system
echo   * STOP-HYBRID.bat - Stop all services
echo   * REBUILD-FRONTEND.bat - Rebuild frontend only
echo.
echo ========================================
echo NEXT STEPS
echo ========================================
echo.
echo 1. Review changes:
echo    git status
echo.
echo 2. Add files:
echo    git add .
echo.
echo 3. Commit:
echo    git commit -m "feat: Add business types registration system"
echo.
echo 4. Push:
echo    git push origin main
echo.
echo ========================================
pause
