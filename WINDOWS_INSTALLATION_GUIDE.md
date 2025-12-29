# NPM Installation Troubleshooting Guide for Windows

## Quick Start

### Option 1: Using Command Prompt (Recommended)
1. Open Command Prompt (cmd.exe)
2. Navigate to the project: `cd C:\project\cbc`
3. Run: `install-dependencies.bat`

### Option 2: Using PowerShell
1. Open PowerShell as Administrator
2. Navigate to the project: `cd C:\project\cbc`
3. Run: `powershell -ExecutionPolicy Bypass -File install-dependencies.ps1`

### Option 3: Manual Installation (Step by Step)
```cmd
cd C:\project\cbc
npm config set registry https://registry.npmjs.org/
npm config set fetch-timeout 120000
npm config set fetch-retry-mintimeout 20000
npm config set fetch-retry-maxtimeout 120000
npm cache clean --force
npm ci --legacy-peer-deps --no-audit --no-fund
```

## Troubleshooting Steps

### If you get "ECONNRESET" errors:

1. **Check Internet Connection**
   - Open browser and visit https://www.google.com
   - If no connection, restart your router/modem

2. **Disable Antivirus Temporarily**
   - Windows Defender may block npm downloads
   - Temporarily disable real-time protection
   - Retry installation
   - Re-enable after installation completes

3. **Check Firewall Settings**
   - Ensure npm is allowed through Windows Firewall
   - Or temporarily disable firewall for testing

4. **Try Different Network**
   - If on corporate network, try personal hotspot
   - Corporate proxies may block npm registry

### If you get "EBUSY" or file lock errors:

1. **Close All Applications**
   - Close VS Code, File Explorer, antivirus
   - Close any npm/node processes

2. **Clear npm Cache**
   ```cmd
   npm cache clean --force
   ```

3. **Remove node_modules**
   ```cmd
   rmdir /s /q node_modules
   ```

4. **Retry Installation**
   ```cmd
   npm ci --legacy-peer-deps --no-audit --no-fund
   ```

### If npm is not found:

1. **Install Node.js**
   - Download from https://nodejs.org/
   - Use LTS version (recommended)
   - Run installer and follow prompts
   - Restart Command Prompt after installation

2. **Verify Installation**
   ```cmd
   node --version
   npm --version
   ```

## Windows-Specific Commands Reference

| Task | Command |
|------|---------|
| Navigate to directory | `cd C:\path\to\directory` |
| List files | `dir` |
| Remove directory | `rmdir /s /q directory_name` |
| Clear screen | `cls` |
| Check npm version | `npm --version` |
| Check Node version | `node --version` |
| View npm config | `npm config list` |
| Reset npm config | `npm config set registry https://registry.npmjs.org/` |

## Project Structure

```
C:\project\cbc\
├── package.json (root monorepo config)
├── package-lock.json
├── frontend/ (React frontend)
│   ├── package.json
│   └── node_modules/
├── api/ (Backend services)
│   ├── commercial-bank/
│   ├── custom-authorities/
│   ├── ecta/
│   ├── ecx/
│   ├── exporter-portal/
│   ├── national-bank/
│   ├── shipping-line/
│   └── shared/
└── node_modules/ (root dependencies)
```

## Installation Steps for This Project

1. **Install Root Dependencies**
   ```cmd
   cd C:\project\cbc
   npm ci --legacy-peer-deps --no-audit --no-fund
   ```

2. **Install Frontend Dependencies**
   ```cmd
   cd C:\project\cbc\frontend
   npm ci --legacy-peer-deps --no-audit --no-fund
   ```

3. **Verify Installation**
   ```cmd
   npm list --depth=0
   ```

## Common Issues and Solutions

### Issue: "npm: The term 'npm' is not recognized"
**Solution:** Node.js is not installed or not in PATH
- Install Node.js from https://nodejs.org/
- Restart Command Prompt
- Verify with `npm --version`

### Issue: "ECONNRESET" during installation
**Solution:** Network connectivity problem
- Check internet connection
- Disable antivirus temporarily
- Try again with: `npm install --legacy-peer-deps --no-audit --no-fund`

### Issue: "EBUSY: resource busy or locked"
**Solution:** Files are locked by another process
- Close all applications
- Run: `npm cache clean --force`
- Run: `rmdir /s /q node_modules`
- Retry installation

### Issue: "npm ERR! code ERESOLVE"
**Solution:** Dependency conflict
- Use: `npm install --legacy-peer-deps`
- This allows installation with peer dependency conflicts

## After Installation

### Run Development Server
```cmd
cd C:\project\cbc\frontend
npm run dev
```

### Build for Production
```cmd
cd C:\project\cbc\frontend
npm run build
```

### Run Tests
```cmd
npm test
```

### Lint Code
```cmd
npm run lint
npm run lint:fix
```

## Getting Help

If installation still fails:
1. Note the exact error message
2. Check the npm log: `C:\Users\[YourUsername]\AppData\Local\npm-cache\_logs\`
3. Try with verbose output: `npm install --verbose`
4. Check Node.js version compatibility: `node --version`

## Windows-Specific Notes

- Use `\` for paths (or `/` in npm commands)
- Command Prompt is more reliable than PowerShell for npm
- Close antivirus during installation if possible
- Ensure you have admin rights for some operations
- Use `rmdir /s /q` instead of `rm -rf` on Windows
- Use `dir` instead of `ls` on Windows
