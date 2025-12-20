# 🚀 Complete Startup Guide - Coffee Export Consortium

## Overview

This guide covers all startup scripts and how to use them to get the entire system running.

---

## 📋 Quick Start (5 Minutes)

### Option 1: Start Everything with One Command

```bash
# Start the entire system (infrastructure → database → APIs → frontend)
./start-all.sh
```

This will:
1. ✅ Start PostgreSQL, Redis, IPFS
2. ✅ Initialize database and run migrations
3. ✅ Start all 7 API services
4. ✅ Start the React/Vite frontend
5. ✅ Display access points and next steps

### Option 2: Start Components Individually

```bash
# Terminal 1: Start infrastructure
./start-infrastructure.sh

# Terminal 2: Initialize database
./init-database.sh

# Terminal 3: Start APIs
./start-all-apis.sh

# Terminal 4: Start frontend
./start-frontend.sh
```

---

## 🔧 Available Scripts

### 1. **start-all.sh** - Master Startup Script
**Purpose:** Start the entire system in the correct order

**Usage:**
```bash
./start-all.sh              # Start everything
./start-all.sh --check      # Check prerequisites
./start-all.sh --status     # Show system status
./start-all.sh --logs       # View all logs
./start-all.sh --stop       # Stop everything
./start-all.sh --restart    # Restart everything
```

**What it does:**
- Starts infrastructure (PostgreSQL, Redis, IPFS)
- Initializes database
- Starts all 7 API services
- Starts frontend
- Displays comprehensive status

**Best for:** First-time startup or complete system restart

---

### 2. **start-infrastructure.sh** - Infrastructure Services
**Purpose:** Start PostgreSQL, Redis, IPFS using Docker

**Usage:**
```bash
./start-infrastructure.sh              # Start infrastructure
./start-infrastructure.sh --check      # Check prerequisites
./start-infrastructure.sh --status     # Show status
./start-infrastructure.sh --logs       # View logs
./start-infrastructure.sh --stop       # Stop services
./start-infrastructure.sh --restart    # Restart services
```

**What it does:**
- Creates Docker network
- Starts PostgreSQL container
- Starts Redis container
- Starts IPFS container
- Verifies health of all services

**Best for:** Starting infrastructure only

---

### 3. **init-database.sh** - Database Initialization
**Purpose:** Create database and run migrations

**Usage:**
```bash
./init-database.sh              # Initialize database
./init-database.sh --check      # Check prerequisites
./init-database.sh --migrate    # Run migrations only
./init-database.sh --verify     # Verify database schema
./init-database.sh --reset      # Reset database (DROP and recreate)
```

**What it does:**
- Creates `coffee_export_db` database
- Runs all migration scripts
- Verifies database schema
- Lists all tables

**Best for:** Database setup and maintenance

---

### 4. **start-all-apis.sh** - API Services
**Purpose:** Start all 7 API services

**Usage:**
```bash
./start-all-apis.sh              # Start all APIs
./start-all-apis.sh --check      # Check prerequisites
./start-all-apis.sh --status     # Show status
./start-all-apis.sh --logs       # View logs
./start-all-apis.sh --health     # Check health
./start-all-apis.sh --stop       # Stop services
```

**What it does:**
- Starts Commercial Bank API (3001)
- Starts National Bank API (3002)
- Starts ECTA API (3003)
- Starts Shipping Line API (3004)
- Starts Custom Authorities API (3005)
- Starts ECX API (3006)
- Starts Exporter Portal API (3007)
- Performs health checks

**Best for:** Starting API services only

---

### 5. **start-frontend.sh** - Frontend Service
**Purpose:** Start React/Vite frontend

**Usage:**
```bash
./start-frontend.sh              # Start frontend
./start-frontend.sh --check      # Check prerequisites
./start-frontend.sh --status     # Show status
./start-frontend.sh --logs       # View logs
./start-frontend.sh --build      # Build for production
./start-frontend.sh --stop       # Stop frontend
```

**What it does:**
- Starts Vite dev server on port 5173
- Configures environment variables
- Performs health checks

**Best for:** Starting frontend only

---

### 6. **stop-all.sh** - Stop All Services
**Purpose:** Stop all running services

**Usage:**
```bash
./stop-all.sh              # Stop all services gracefully
./stop-all.sh --clean      # Stop and clean up logs/PIDs
./stop-all.sh --force      # Force stop all services
./stop-all.sh --logs       # Clean up logs only
```

**What it does:**
- Stops frontend
- Stops API services
- Stops infrastructure
- Optionally cleans up logs and PID files

**Best for:** Shutting down the system

---

### 7. **verify-system.sh** - System Verification
**Purpose:** Comprehensive system diagnostics

**Usage:**
```bash
./verify-system.sh              # Full verification
./verify-system.sh --quick      # Quick check
./verify-system.sh --detailed   # Detailed diagnostics
./verify-system.sh --docker     # Check Docker
./verify-system.sh --database   # Check database
./verify-system.sh --apis       # Check APIs
./verify-system.sh --frontend   # Check frontend
```

**What it does:**
- Checks system requirements
- Verifies Docker status
- Tests infrastructure connectivity
- Tests database connectivity
- Tests all API services
- Tests frontend
- Checks port availability
- Checks disk space and memory
- Analyzes logs for errors
- Provides recommendations

**Best for:** Troubleshooting and diagnostics

---

## 📊 Startup Sequence

### Automatic (Using start-all.sh)
```
1. Check prerequisites
2. Create Docker network
3. Start PostgreSQL, Redis, IPFS
4. Wait for infrastructure (45 seconds)
5. Create database
6. Run migrations
7. Verify database schema
8. Wait for database (30 seconds)
9. Start all 7 API services
10. Wait for APIs (30 seconds)
11. Start frontend
12. Wait for frontend (15 seconds)
13. Display summary and access points
```

**Total time:** ~2-3 minutes

### Manual (Using individual scripts)
```
Terminal 1: ./start-infrastructure.sh
Terminal 2: ./init-database.sh
Terminal 3: ./start-all-apis.sh
Terminal 4: ./start-frontend.sh
```

---

## 🌐 Access Points

Once everything is running:

### Frontend
- **URL:** http://localhost:5173
- **Purpose:** User interface for exporters

### API Services
- **Commercial Bank:** http://localhost:3001
- **National Bank:** http://localhost:3002
- **ECTA:** http://localhost:3003
- **Shipping Line:** http://localhost:3004
- **Custom Authorities:** http://localhost:3005
- **ECX:** http://localhost:3006
- **Exporter Portal:** http://localhost:3007

### API Documentation
- **Swagger UI:** http://localhost:3001/api-docs

### Infrastructure
- **PostgreSQL:** localhost:5432 (user: postgres, password: postgres)
- **Redis:** localhost:6379
- **IPFS:** localhost:5001

---

## ✅ Verification Checklist

After startup, verify everything is working:

```bash
# 1. Check system status
./verify-system.sh

# 2. Check infrastructure
./start-infrastructure.sh --status

# 3. Check APIs
./start-all-apis.sh --status

# 4. Check frontend
./start-frontend.sh --status

# 5. Test API endpoints
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3004/health
curl http://localhost:3005/health
curl http://localhost:3006/health
curl http://localhost:3007/health

# 6. Test frontend
curl http://localhost:5173

# 7. Test database
psql -h localhost -U postgres -d coffee_export_db -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
```

---

## 🔍 Monitoring & Logs

### View Logs

```bash
# View all logs
./start-all.sh --logs

# View API logs
./start-all-apis.sh --logs

# View frontend logs
./start-frontend.sh --logs

# View infrastructure logs
./start-infrastructure.sh --logs

# Tail logs in real-time
./start-all-apis.sh --tail
./start-frontend.sh --tail
./start-infrastructure.sh --tail
```

### Check Status

```bash
# Full system status
./start-all.sh --status

# Individual component status
./start-infrastructure.sh --status
./start-all-apis.sh --status
./start-frontend.sh --status
```

---

## 🛠️ Troubleshooting

### Issue: Docker daemon not running

```bash
# Start Docker
sudo systemctl start docker

# Verify
docker ps
```

### Issue: Port already in use

```bash
# Find what's using the port
lsof -i :3001

# Kill the process
kill -9 <PID>

# Or stop all services
./stop-all.sh --force
```

### Issue: Database connection failed

```bash
# Check PostgreSQL container
docker ps | grep postgres

# Check database exists
psql -h localhost -U postgres -l | grep coffee_export_db

# Reinitialize database
./init-database.sh --reset
```

### Issue: API services won't start

```bash
# Check logs
./start-all-apis.sh --logs

# Check prerequisites
./start-all-apis.sh --check

# Reinstall dependencies
cd api/commercial-bank && npm install --legacy-peer-deps
```

### Issue: Frontend won't start

```bash
# Check logs
./start-frontend.sh --logs

# Check prerequisites
./start-frontend.sh --check

# Reinstall dependencies
cd frontend && npm install
```

### Issue: Services not responding

```bash
# Run full verification
./verify-system.sh

# Check detailed diagnostics
./verify-system.sh --detailed

# Check specific component
./verify-system.sh --database
./verify-system.sh --apis
```

---

## 🔄 Common Workflows

### First-Time Setup

```bash
# 1. Start everything
./start-all.sh

# 2. Verify system
./verify-system.sh

# 3. Open frontend
open http://localhost:5173
```

### Daily Startup

```bash
# Start everything
./start-all.sh

# Check status
./verify-system.sh --quick
```

### Restart After Crash

```bash
# Stop everything
./stop-all.sh --force

# Wait a moment
sleep 5

# Start everything
./start-all.sh
```

### Clean Restart

```bash
# Stop and clean up
./stop-all.sh --clean

# Wait a moment
sleep 5

# Start everything
./start-all.sh
```

### Maintenance

```bash
# Stop everything
./stop-all.sh

# Perform maintenance
# ...

# Start everything
./start-all.sh
```

### Debugging

```bash
# Run diagnostics
./verify-system.sh --detailed

# Check specific component
./verify-system.sh --database
./verify-system.sh --apis

# View logs
./start-all-apis.sh --logs
./start-frontend.sh --logs
./start-infrastructure.sh --logs
```

---

## 📝 Environment Variables

### Database Configuration
```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=coffee_export_db
DB_USER=postgres
DB_PASSWORD=postgres
```

### Frontend Configuration
```bash
FRONTEND_PORT=5173
VITE_API_URL=http://localhost:3001
```

### API Configuration
```bash
NODE_ENV=development
PORT=3001-3007
CORS_ORIGIN=http://localhost:5173
```

---

## 🚨 Emergency Procedures

### Force Stop Everything

```bash
./stop-all.sh --force
```

### Kill All Node Processes

```bash
pkill -f node
pkill -f npm
```

### Stop All Docker Containers

```bash
docker stop $(docker ps -q)
```

### Reset Everything

```bash
# Stop everything
./stop-all.sh --force

# Remove Docker containers
docker-compose -f docker-compose.postgres.yml down -v
docker-compose -f docker-compose.apis.yml down -v

# Clean up
rm -rf logs/*
rm -f .api-pids .frontend-pid

# Start fresh
./start-all.sh
```

---

## 📊 System Requirements

### Minimum
- 4GB RAM
- 10GB disk space
- Docker and Docker Compose
- Node.js 16+
- npm 8+

### Recommended
- 8GB RAM
- 20GB disk space
- Docker and Docker Compose
- Node.js 18+
- npm 9+

---

## 🎯 Next Steps

1. **Start the system**
   ```bash
   ./start-all.sh
   ```

2. **Verify everything is running**
   ```bash
   ./verify-system.sh
   ```

3. **Open the frontend**
   ```
   http://localhost:5173
   ```

4. **Create your first export**
   - Login with your credentials
   - Fill in export details
   - Submit for approval

5. **Monitor the system**
   ```bash
   ./start-all-apis.sh --logs
   ./start-frontend.sh --logs
   ```

---

## 📞 Support

### Getting Help

1. **Check logs**
   ```bash
   ./start-all-apis.sh --logs
   ./start-frontend.sh --logs
   ./start-infrastructure.sh --logs
   ```

2. **Run diagnostics**
   ```bash
   ./verify-system.sh --detailed
   ```

3. **Check specific component**
   ```bash
   ./verify-system.sh --database
   ./verify-system.sh --apis
   ./verify-system.sh --docker
   ```

4. **Review documentation**
   - MANDATORY_STARTUP_REQUIREMENTS.md
   - STARTUP_SCRIPTS_ANALYSIS.md
   - MASTER_STARTUP_GUIDE.md

---

## 📚 Related Documentation

- **MANDATORY_STARTUP_REQUIREMENTS.md** - What services are required
- **STARTUP_SCRIPTS_ANALYSIS.md** - Analysis of startup coverage
- **MASTER_STARTUP_GUIDE.md** - Original startup guide
- **QUICK_START_GUIDE.md** - Quick reference
- **DATABASE_CONFIGURATION_VERIFICATION.md** - Database setup details

---

**Status:** ✅ Complete Startup Solution
**Last Updated:** 2025-12-17
**Version:** 2.0.0
