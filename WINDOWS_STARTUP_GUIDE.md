# CBC Windows Startup Guide

## Quick Start (3 Options)

### Option 1: Use the Windows Batch File (Easiest) ✅

```batch
# Start everything with one command
start-all.bat

# Stop everything
start-all.bat stop

# Show help
start-all.bat help
```

**What it does:**
1. Starts Docker infrastructure (PostgreSQL, Redis, IPFS)
2. Starts all 7 API services
3. Starts frontend on port 5173
4. Shows you all access URLs

---

### Option 2: Use Docker Compose (Recommended for Development)

```powershell
# 1. Start infrastructure
docker-compose -f docker-compose.postgres.yml up -d

# 2. Wait 30 seconds for database to be ready
Start-Sleep -Seconds 30

# 3. Start API services
docker-compose -f docker-compose.apis.yml up -d

# 4. Start frontend (in separate terminal)
cd frontend
npm run dev
```

**Benefits:**
- Better control over each layer
- Easier to restart individual services
- Better for debugging

---

### Option 3: Fix WSL for Bash Scripts

If you want to use the `.sh` bash scripts on Windows, you need WSL (Windows Subsystem for Linux).

#### Install/Fix WSL:

```powershell
# Run PowerShell as Administrator

# 1. Enable WSL
wsl --install

# 2. Restart your computer

# 3. After restart, set up Ubuntu (default)
# Follow the prompts to create a username/password

# 4. Update WSL
wsl --update

# 5. Set WSL 2 as default
wsl --set-default-version 2
```

#### After WSL is installed:

```powershell
# Navigate to your project in WSL
wsl
cd /mnt/c/project/cbc

# Now you can run bash scripts
./start-all.sh
```

**Or use Git Bash (simpler alternative):**

1. Install Git for Windows: https://git-scm.com/download/win
2. Open Git Bash terminal
3. Navigate to project: `cd /c/project/cbc`
4. Run: `./start-all.sh`

---

## Troubleshooting

### Issue: "Docker daemon is not running"

**Solution:**
1. Open Docker Desktop
2. Wait for it to fully start (whale icon in system tray)
3. Run `start-all.bat` again

### Issue: "Port already in use"

**Solution:**
```powershell
# Stop all services first
start-all.bat stop

# Or stop Docker containers
docker-compose -f docker-compose.postgres.yml down
docker-compose -f docker-compose.apis.yml down

# Then start again
start-all.bat
```

### Issue: "node_modules not found"

**Solution:**
```powershell
# Install frontend dependencies
cd frontend
npm install

# Install API dependencies (if needed)
cd ..\api\commercial-bank
npm install
# Repeat for other API services
```

### Issue: WSL Error "execvpe(/bin/bash) failed"

**Solutions:**
1. **Use the batch file instead:** `start-all.bat`
2. **Reinstall WSL:** `wsl --unregister Ubuntu` then `wsl --install`
3. **Use Git Bash:** Install Git for Windows

---

## Service URLs

Once started, access services at:

| Service | URL | Port |
|---------|-----|------|
| **Frontend** | http://localhost:5173 | 5173 |
| Commercial Bank API | http://localhost:3001 | 3001 |
| Custom Authorities API | http://localhost:3002 | 3002 |
| ECTA API | http://localhost:3003 | 3003 |
| Exporter Portal API | http://localhost:3004 | 3004 |
| National Bank API | http://localhost:3005 | 3005 |
| ECX API | http://localhost:3006 | 3006 |
| Shipping Line API | http://localhost:3007 | 3007 |
| PostgreSQL | localhost:5432 | 5432 |
| Redis | localhost:6379 | 6379 |
| IPFS | localhost:5001 | 5001 |

---

## Useful Commands

### Check what's running:
```powershell
# Check Docker containers
docker ps

# Check ports in use
netstat -ano | findstr ":5173"
netstat -ano | findstr ":3001"
```

### View logs:
```powershell
# Infrastructure logs
docker-compose -f docker-compose.postgres.yml logs -f

# API logs
docker-compose -f docker-compose.apis.yml logs -f

# Specific service
docker logs -f cbc-commercial-bank
```

### Restart services:
```powershell
# Restart everything
start-all.bat stop
start-all.bat

# Restart just APIs
docker-compose -f docker-compose.apis.yml restart

# Restart specific service
docker-compose -f docker-compose.apis.yml restart commercial-bank
```

---

## Development Workflow

### Typical startup:
```batch
REM 1. Start infrastructure (once per day)
docker-compose -f docker-compose.postgres.yml up -d

REM 2. Start APIs (when developing backend)
docker-compose -f docker-compose.apis.yml up -d

REM 3. Start frontend (when developing frontend)
cd frontend
npm run dev
```

### When making changes:
```powershell
# Frontend: Changes auto-reload (Vite HMR)

# APIs: Restart the specific service
docker-compose -f docker-compose.apis.yml restart commercial-bank

# Database: Migrations
docker exec postgres psql -U postgres -d coffee_export_db -f /path/to/migration.sql
```

---

## Why Bash Scripts Fail on Windows

The `.sh` files are **bash scripts** designed for Linux/Mac. Windows uses:
- **PowerShell** (`.ps1` files)
- **Command Prompt** (`.bat` files)

To run bash scripts on Windows, you need:
1. **WSL** (Windows Subsystem for Linux) - Full Linux environment
2. **Git Bash** - Lightweight bash emulator
3. **Cygwin** - Unix-like environment

**Recommendation:** Use `start-all.bat` instead - it's native Windows and works perfectly!

---

## Quick Reference

```batch
REM Start everything
start-all.bat

REM Stop everything  
start-all.bat stop

REM Just infrastructure
docker-compose -f docker-compose.postgres.yml up -d

REM Just APIs
docker-compose -f docker-compose.apis.yml up -d

REM Just frontend
cd frontend && npm run dev

REM Check status
docker ps

REM View logs
docker-compose -f docker-compose.apis.yml logs -f
```

---

## Next Steps

1. ✅ Run `start-all.bat` to start the system
2. ✅ Open http://localhost:5173 in your browser
3. ✅ Check that all services are running: `docker ps`
4. ✅ View logs if needed: `docker-compose -f docker-compose.apis.yml logs -f`

**Happy coding! 🚀**
