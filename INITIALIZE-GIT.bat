@echo off
echo ========================================
echo Git Repository Initialization
echo ========================================
echo.
echo This script will:
echo 1. Initialize Git repository
echo 2. Add all files
echo 3. Create initial commit
echo.
echo Press Ctrl+C to cancel, or
pause
echo.

REM Initialize Git
echo [1/3] Initializing Git repository...
git init
if errorlevel 1 (
    echo   ✗ Failed to initialize Git
    echo   Make sure Git is installed: https://git-scm.com/download/win
    pause
    exit /b 1
)
echo   ✓ Git repository initialized
echo.

REM Add all files
echo [2/3] Adding all files...
git add .
if errorlevel 1 (
    echo   ✗ Failed to add files
    pause
    exit /b 1
)
echo   ✓ All files staged
echo.

REM Create initial commit
echo [3/3] Creating initial commit...
git commit -m "feat: Ethiopian Coffee Export Blockchain System" -m "Complete hybrid blockchain system for coffee export management" -m "Features:" -m "- Business types registration with dynamic capital requirements" -m "- Hyperledger Fabric blockchain network (3 Orderers, 6 Peers)" -m "- Application services (Gateway, Bridge, CBC Services)" -m "- Infrastructure (PostgreSQL, Redis, Kafka)" -m "- Single command deployment (START-HYBRID.bat)"

if errorlevel 1 (
    echo   ✗ Failed to create commit
    pause
    exit /b 1
)
echo   ✓ Initial commit created
echo.

echo ========================================
echo SUCCESS!
echo ========================================
echo.
echo Git repository initialized successfully!
echo.
echo NEXT STEPS:
echo.
echo 1. Add your remote repository:
echo    git remote add origin [your-repo-url]
echo.
echo    Examples:
echo    - GitHub: git remote add origin https://github.com/username/repo.git
echo    - GitLab: git remote add origin https://gitlab.com/username/repo.git
echo    - Bitbucket: git remote add origin https://bitbucket.org/username/repo.git
echo.
echo 2. Push to remote:
echo    git push -u origin main
echo.
echo    (If your default branch is 'master', use: git push -u origin master)
echo.
echo 3. Verify push:
echo    git status
echo.
echo ========================================
pause
