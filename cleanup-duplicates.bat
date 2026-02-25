@echo off
echo ============================================
echo Cleaning Up Duplicate Files
echo ============================================
echo.

echo Creating backup of files to be removed...
if not exist ".cleanup-backup" mkdir ".cleanup-backup"

echo.
echo [1/6] Removing backup Dockerfiles...
if exist "cbc\services\commercial-bank\Dockerfile.backup" (
    move "cbc\services\commercial-bank\Dockerfile.backup" ".cleanup-backup\" >nul
    echo   - Removed commercial-bank Dockerfile.backup
)
if exist "cbc\services\custom-authorities\Dockerfile.backup" (
    move "cbc\services\custom-authorities\Dockerfile.backup" ".cleanup-backup\" >nul
    echo   - Removed custom-authorities Dockerfile.backup
)
if exist "cbc\services\ecx\Dockerfile.backup" (
    move "cbc\services\ecx\Dockerfile.backup" ".cleanup-backup\" >nul
    echo   - Removed ecx Dockerfile.backup
)
if exist "cbc\services\national-bank\Dockerfile.backup" (
    move "cbc\services\national-bank\Dockerfile.backup" ".cleanup-backup\" >nul
    echo   - Removed national-bank Dockerfile.backup
)
if exist "cbc\services\national-bank\Dockerfile.new" (
    move "cbc\services\national-bank\Dockerfile.new" ".cleanup-backup\" >nul
    echo   - Removed national-bank Dockerfile.new
)
if exist "cbc\services\shipping-line\Dockerfile.backup" (
    move "cbc\services\shipping-line\Dockerfile.backup" ".cleanup-backup\" >nul
    echo   - Removed shipping-line Dockerfile.backup
)
if exist "cbc\services\Dockerfile.template" (
    move "cbc\services\Dockerfile.template" ".cleanup-backup\" >nul
    echo   - Removed Dockerfile.template
)

echo.
echo [2/6] Removing duplicate startup scripts...
if exist "start-hybrid-system.bat" (
    move "start-hybrid-system.bat" ".cleanup-backup\" >nul
    echo   - Removed start-hybrid-system.bat
)
if exist "start-hybrid-fixed.bat" (
    move "start-hybrid-fixed.bat" ".cleanup-backup\" >nul
    echo   - Removed start-hybrid-fixed.bat
)

echo.
echo [3/6] Removing redundant fix scripts...
if exist "fix-docker-network.bat" (
    move "fix-docker-network.bat" ".cleanup-backup\" >nul
    echo   - Removed fix-docker-network.bat
)
if exist "fix-dockerfiles.bat" (
    move "fix-dockerfiles.bat" ".cleanup-backup\" >nul
    echo   - Removed fix-dockerfiles.bat
)

echo.
echo [4/6] Removing duplicate documentation...
if exist "DOCKER-NETWORK-FIX.md" (
    move "DOCKER-NETWORK-FIX.md" ".cleanup-backup\" >nul
    echo   - Removed DOCKER-NETWORK-FIX.md
)
if exist "STARTUP-ISSUES-FIXED.md" (
    move "STARTUP-ISSUES-FIXED.md" ".cleanup-backup\" >nul
    echo   - Removed STARTUP-ISSUES-FIXED.md
)

echo.
echo [5/6] Removing old backup files...
if exist "cbc\services\ecta\src\services\certificate-service.ts.old" (
    del /Q "cbc\services\ecta\src\services\certificate-service.ts.old" >nul
    echo   - Removed certificate-service.ts.old
)

echo.
echo [6/6] Consolidating documentation...
REM Keep only essential docs in root

echo.
echo ============================================
echo Cleanup Complete!
echo ============================================
echo.
echo Files moved to .cleanup-backup\ folder
echo You can safely delete this folder after verifying everything works.
echo.
echo Active Files:
echo   Startup:
echo     - start-hybrid-clean.bat (main startup)
echo     - check-hybrid-status.bat (status checker)
echo     - docker-troubleshoot.bat (diagnostics)
echo     - pull-images.bat (image downloader)
echo.
echo   Documentation:
echo     - README.md (main documentation)
echo     - QUICK-START.md (quick start guide)
echo     - CHANGELOG.md (version history)
echo     - CONTRIBUTING.md (contribution guide)
echo.
echo   System:
echo     - docker-compose-hybrid.yml (main compose file)
echo     - docker-compose-fabric.yml (fabric network)
echo.
pause
