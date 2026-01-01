# Windows Installation Instructions

## Quick Start (Recommended)

### Method 1: Using Batch Script (Easiest)

1. Open **Command Prompt** (cmd.exe)
   - Press `Win + R`
   - Type `cmd`
   - Press Enter

2. Navigate to project:
   ```cmd
   cd C:\project\cbc
   ```

3. Run the installation script:
   ```cmd
   install-all.bat
   ```

4. Wait for installation to complete (5-15 minutes)

### Method 2: Manual Installation

If the batch script doesn't work, run these commands in Command Prompt:

```cmd
cd C:\project\cbc
npm config set registry https://registry.npmjs.org/
npm config set fetch-timeout 120000
npm config set fetch-retry-mintimeout 20000
npm config set fetch-retry-maxtimeout 120000
npm cache clean --force
npm ci --legacy-peer-deps --no-audit --no-fund
```

## If Installation Fails

### Error: "npm: The term 'npm' is not recognized"
- Node.js is not installed
- Download from: https://nodejs.org/ (LTS version)
- Install and restart Command Prompt
- Try again

### Error: "ECONNRESET" or network errors
1. Check internet connection
2. Disable antivirus temporarily
3. Disable Windows Firewall temporarily
4. Try again

### Error: "EBUSY" or file lock errors
1. Close all applications (VS Code, File Explorer, etc.)
2. Run: `npm cache clean --force`
3. Run: `rmdir /s /q node_modules`
4. Try installation again

## After Installation

### Start Development Server
```cmd
cd C:\project\cbc\frontend
npm run dev
```

### Build for Production
```cmd
cd C:\project\cbc\frontend
npm run build
```

## Important Notes

- Use **Command Prompt** (cmd.exe), not PowerShell
- Installation requires internet connection
- First installation takes 5-15 minutes
- Do NOT close the window during installation
- If interrupted, run the script again

## For More Help

See: `WINDOWS_INSTALLATION_GUIDE.md`

## System Requirements

- Windows 7 or later
- Node.js 14+ (download from nodejs.org)
- npm 6+ (comes with Node.js)
- Internet connection
- 500MB free disk space
