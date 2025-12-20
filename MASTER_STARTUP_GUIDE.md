# 🚀 Master Startup Guide - All API Services

## ✅ System Status: READY TO START

All 7 API services are fully configured with:
- ✅ PostgreSQL database configuration
- ✅ npm dependencies installed
- ✅ Environment variables configured
- ✅ Connection profiles in place

---

## Prerequisites Checklist

Before starting services, verify:

- [ ] PostgreSQL is running on localhost:5432
- [ ] Database `coffee_export_db` exists
- [ ] User `postgres` with password `postgres` exists
- [ ] All 7 services have node_modules installed
- [ ] All .env files are present and configured

### Quick Verification

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check database exists
psql -h localhost -U postgres -l | grep coffee_export_db

# Check dependencies installed
ls /home/gu-da/cbc/api/*/node_modules | wc -l
# Should show 7 directories
```

---

## Quick Start - 7 Terminals Method

### Terminal 1: Commercial Bank API (Port 3001)
```bash
cd /home/gu-da/cbc/api/commercial-bank && npm run dev
```

### Terminal 2: National Bank API (Port 3002)
```bash
cd /home/gu-da/cbc/api/national-bank && npm run dev
```

### Terminal 3: ECTA API (Port 3003)
```bash
cd /home/gu-da/cbc/api/ecta && npm run dev
```

### Terminal 4: Shipping Line API (Port 3004)
```bash
cd /home/gu-da/cbc/api/shipping-line && npm run dev
```

### Terminal 5: Custom Authorities API (Port 3005)
```bash
cd /home/gu-da/cbc/api/custom-authorities && npm run dev
```

### Terminal 6: ECX API (Port 3006)
```bash
cd /home/gu-da/cbc/api/ecx && npm run dev
```

### Terminal 7: Exporter Portal API (Port 3007)
```bash
cd /home/gu-da/cbc/api/exporter-portal && npm run dev
```

---

## Startup Sequence

### Step 1: Verify Prerequisites (5 minutes)

```bash
# Check PostgreSQL
sudo systemctl status postgresql

# If not running, start it
sudo systemctl start postgresql

# Verify database
psql -h localhost -U postgres -d coffee_export_db -c "SELECT 1;"
```

### Step 2: Open 7 Terminal Windows

Use your terminal multiplexer or open 7 separate terminal windows:
- Terminal 1: Commercial Bank (3001)
- Terminal 2: National Bank (3002)
- Terminal 3: ECTA (3003)
- Terminal 4: Shipping Line (3004)
- Terminal 5: Custom Authorities (3005)
- Terminal 6: ECX (3006)
- Terminal 7: Exporter Portal (3007)

### Step 3: Start Services in Order

Start services in the order listed above. Each should take 5-10 seconds to start.

### Step 4: Verify All Services Running

```bash
# Check all ports are listening
netstat -tuln | grep -E '300[1-7]'

# Or use lsof
lsof -i -P -n | grep -E '300[1-7]'
```

### Step 5: Monitor Console Output

Each service should display:
```
✅ Environment validation successful
[DatabasePool] info: Database pool initialized
[API_NAME] info: Connected to PostgreSQL database
[API_NAME] info: Server is ready to accept request
```

---

## Service Details

### 1. Commercial Bank API (Port 3001)
- **Organization:** commercial-bank
- **MSP ID:** CommercialBankMSP
- **Status:** ✅ VERIFIED RUNNING
- **Database:** coffee_export_db
- **Start Command:** `cd /home/gu-da/cbc/api/commercial-bank && npm run dev`

### 2. National Bank API (Port 3002)
- **Organization:** nationalbank
- **MSP ID:** NationalBankMSP
- **Status:** ✅ CONFIGURED
- **Database:** coffee_export_db
- **Start Command:** `cd /home/gu-da/cbc/api/national-bank && npm run dev`

### 3. ECTA API (Port 3003)
- **Organization:** ecta
- **MSP ID:** ECTAMSP
- **Status:** ✅ CONFIGURED
- **Database:** coffee_export_db
- **Start Command:** `cd /home/gu-da/cbc/api/ecta && npm run dev`

### 4. Shipping Line API (Port 3004)
- **Organization:** shippingline
- **MSP ID:** ShippingLineMSP
- **Status:** ✅ CONFIGURED
- **Database:** coffee_export_db
- **Start Command:** `cd /home/gu-da/cbc/api/shipping-line && npm run dev`

### 5. Custom Authorities API (Port 3005)
- **Organization:** custom-authorities
- **MSP ID:** CustomAuthoritiesMSP
- **Status:** ✅ CONFIGURED
- **Database:** coffee_export_db
- **Start Command:** `cd /home/gu-da/cbc/api/custom-authorities && npm run dev`

### 6. ECX API (Port 3006)
- **Organization:** ecx
- **MSP ID:** ECXMSP
- **Status:** ✅ CONFIGURED (NEW)
- **Database:** coffee_export_db
- **Start Command:** `cd /home/gu-da/cbc/api/ecx && npm run dev`

### 7. Exporter Portal API (Port 3007)
- **Organization:** commercialbank
- **MSP ID:** CommercialBankMSP
- **Status:** ✅ CONFIGURED
- **Database:** coffee_export_db
- **Start Command:** `cd /home/gu-da/cbc/api/exporter-portal && npm run dev`

---

## Database Configuration (All Services)

```
Host:           localhost
Port:           5432
Database:       coffee_export_db
Username:       postgres
Password:       postgres
SSL:            false
Pool Min:       2
Pool Max:       10
Max Connections: 20
Idle Timeout:   30000ms
```

---

## Verification After Startup

### Check All Services Running

```bash
# Method 1: netstat
netstat -tuln | grep -E '300[1-7]'

# Method 2: lsof
lsof -i -P -n | grep -E '300[1-7]'

# Method 3: curl (test endpoints)
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3004/health
curl http://localhost:3005/health
curl http://localhost:3006/health
curl http://localhost:3007/health
```

### Check Database Connections

```bash
# Connect to database
psql -h localhost -U postgres -d coffee_export_db

# List tables
\dt

# Check connections
SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;
```

---

## Troubleshooting

### Service Won't Start

**Error:** `Cannot find module 'ts-node'`
```bash
# Solution: Reinstall dependencies
cd /home/gu-da/cbc/api/[service-name]
npm install --legacy-peer-deps --no-audit --no-fund
```

**Error:** `EADDRINUSE: address already in use :::3001`
```bash
# Solution: Kill process using port
lsof -i :3001
kill -9 <PID>
```

### Database Connection Failed

**Error:** `connect ECONNREFUSED 127.0.0.1:5432`
```bash
# Solution: Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl status postgresql
```

**Error:** `database "coffee_export_db" does not exist`
```bash
# Solution: Create database
psql -h localhost -U postgres -c "CREATE DATABASE coffee_export_db;"
```

### Port Already in Use

```bash
# Find what's using the port
lsof -i :3001

# Kill the process
kill -9 <PID>

# Or change the port in .env file
# DB_PORT=5433 (for example)
```

---

## Monitoring Services

### View Real-time Logs

Each terminal will show real-time logs from its service. Look for:
- Database connection messages
- API startup messages
- Request/response logs
- Error messages

### Check Service Health

```bash
# Check if service is responding
curl -s http://localhost:3001/health | jq .

# Check database connection
curl -s http://localhost:3001/db/health | jq .
```

### Monitor Database Connections

```bash
# Connect to database
psql -h localhost -U postgres -d coffee_export_db

# Check active connections
SELECT pid, usename, application_name, state FROM pg_stat_activity;

# Check connection count
SELECT count(*) FROM pg_stat_activity WHERE datname = 'coffee_export_db';
```

---

## Stopping Services

### Stop Individual Service

Press `Ctrl+C` in the terminal running the service.

### Stop All Services

Press `Ctrl+C` in each terminal window.

### Force Stop All Services

```bash
# Kill all Node.js processes
pkill -f "node"

# Or kill specific ports
lsof -i :3001 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

---

## Performance Monitoring

### Check CPU and Memory Usage

```bash
# Monitor all Node.js processes
top -p $(pgrep -d, node)

# Or use ps
ps aux | grep "node\|npm"
```

### Check Database Performance

```bash
# Connect to database
psql -h localhost -U postgres -d coffee_export_db

# Check slow queries
SELECT query, calls, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;

# Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) 
FROM pg_tables ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## Configuration Files Reference

| Service | .env File | Port |
|---------|-----------|------|
| Commercial Bank | `/api/commercial-bank/.env` | 3001 |
| National Bank | `/api/national-bank/.env` | 3002 |
| ECTA | `/api/ecta/.env` | 3003 |
| Shipping Line | `/api/shipping-line/.env` | 3004 |
| Custom Authorities | `/api/custom-authorities/.env` | 3005 |
| ECX | `/api/ecx/.env` | 3006 |
| Exporter Portal | `/api/exporter-portal/.env` | 3007 |

---

## Documentation Files

- `DATABASE_CONFIGURATION_VERIFICATION.md` - Database configuration details
- `DATABASE_CONFIG_SUMMARY.md` - Complete configuration summary
- `CONFIGURATION_CHECKLIST.md` - Pre-startup checklist
- `DEPENDENCIES_INSTALLED.md` - Dependencies installation status
- `QUICK_REFERENCE_DB_CONFIG.md` - Quick reference card
- `MASTER_STARTUP_GUIDE.md` - This file

---

## Quick Reference Commands

```bash
# Start all services (copy-paste into 7 terminals)
cd /home/gu-da/cbc/api/commercial-bank && npm run dev
cd /home/gu-da/cbc/api/national-bank && npm run dev
cd /home/gu-da/cbc/api/ecta && npm run dev
cd /home/gu-da/cbc/api/shipping-line && npm run dev
cd /home/gu-da/cbc/api/custom-authorities && npm run dev
cd /home/gu-da/cbc/api/ecx && npm run dev
cd /home/gu-da/cbc/api/exporter-portal && npm run dev

# Verify all running
netstat -tuln | grep -E '300[1-7]'

# Check database
psql -h localhost -U postgres -d coffee_export_db -c "SELECT 1;"

# Stop all services
pkill -f "node"
```

---

## Summary

✅ **All 7 API services are ready to start**

**Status:**
- ✅ PostgreSQL database configured
- ✅ All .env files configured
- ✅ All dependencies installed (5,404 packages)
- ✅ All connection profiles in place
- ✅ All services ready to start

**Next Step:** Follow the "Quick Start - 7 Terminals Method" above to start all services.

---

**Last Updated:** 2025-12-17
**System Status:** ✅ READY TO START
**All Services:** ✅ CONFIGURED & READY
