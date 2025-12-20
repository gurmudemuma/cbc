# PostgreSQL Database Configuration Checklist

## ✅ Configuration Complete

All 7 API services have been verified and configured with PostgreSQL database connectivity.

---

## Pre-Startup Checklist

### Prerequisites
- [ ] PostgreSQL installed and running on localhost:5432
- [ ] Database `coffee_export_db` exists
- [ ] PostgreSQL user `postgres` with password `postgres` exists
- [ ] Node.js and npm installed
- [ ] All dependencies installed (`npm install` in each service directory)

### Verify Prerequisites
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check database exists
psql -h localhost -U postgres -l | grep coffee_export_db

# Check Node.js
node --version
npm --version
```

---

## Configuration Files Checklist

### ✅ All .env Files Present and Configured

| Service | File Path | Status | DB Config |
|---------|-----------|--------|-----------|
| Commercial Bank | `/api/commercial-bank/.env` | ✅ | ✅ |
| National Bank | `/api/national-bank/.env` | ✅ | ✅ |
| ECTA | `/api/ecta/.env` | ✅ | ✅ |
| Shipping Line | `/api/shipping-line/.env` | ✅ | ✅ |
| Custom Authorities | `/api/custom-authorities/.env` | ✅ | ✅ |
| ECX | `/api/ecx/.env` | ✅ ✨ NEW | ✅ |
| Exporter Portal | `/api/exporter-portal/.env` | ✅ | ✅ |

### Verify All .env Files
```bash
# Check all .env files exist
find /home/gu-da/cbc/api -name ".env" -type f | sort

# Expected output:
# /home/gu-da/cbc/api/commercial-bank/.env
# /home/gu-da/cbc/api/custom-authorities/.env
# /home/gu-da/cbc/api/ecta/.env
# /home/gu-da/cbc/api/ecx/.env
# /home/gu-da/cbc/api/exporter-portal/.env
# /home/gu-da/cbc/api/national-bank/.env
# /home/gu-da/cbc/api/shipping-line/.env
```

---

## Database Configuration Checklist

### ✅ All Services Use Same Database Configuration

```
✅ DB_HOST=localhost
✅ DB_PORT=5432
✅ DB_NAME=coffee_export_db
✅ DB_USER=postgres
✅ DB_PASSWORD=postgres
✅ DB_SSL=false
✅ DB_POOL_MIN=2
✅ DB_POOL_MAX=10
```

### Verify Database Configuration
```bash
# Check Commercial Bank (reference)
grep "^DB_" /home/gu-da/cbc/api/commercial-bank/.env

# Check all services have same config
for service in commercial-bank national-bank ecta shipping-line custom-authorities ecx exporter-portal; do
  echo "=== $service ==="
  grep "^DB_" /home/gu-da/cbc/api/$service/.env
done
```

---

## Service Startup Checklist

### Before Starting Services
- [ ] PostgreSQL is running
- [ ] Database `coffee_export_db` exists
- [ ] All .env files are present
- [ ] All .env files have correct database configuration
- [ ] No services are already running on ports 3001-3007

### Check Ports Are Available
```bash
# Check if ports are available
netstat -tuln | grep -E '300[1-7]'

# If ports are in use, kill the processes
lsof -i :3001  # Replace 3001 with other ports as needed
kill -9 <PID>
```

---

## Service Startup Order

### Recommended Startup Order (Optional)
1. Commercial Bank API (3001) - Core service
2. National Bank API (3002)
3. ECTA API (3003)
4. Shipping Line API (3004)
5. Custom Authorities API (3005)
6. ECX API (3006)
7. Exporter Portal API (3007)

### Start All Services
```bash
# Terminal 1
cd /home/gu-da/cbc/api/commercial-bank && npm run dev

# Terminal 2
cd /home/gu-da/cbc/api/national-bank && npm run dev

# Terminal 3
cd /home/gu-da/cbc/api/ecta && npm run dev

# Terminal 4
cd /home/gu-da/cbc/api/shipping-line && npm run dev

# Terminal 5
cd /home/gu-da/cbc/api/custom-authorities && npm run dev

# Terminal 6
cd /home/gu-da/cbc/api/ecx && npm run dev

# Terminal 7
cd /home/gu-da/cbc/api/exporter-portal && npm run dev
```

---

## Startup Verification Checklist

### ✅ Expected Output for Each Service

After starting each service, verify you see:

```
[DatabasePool] info: Database pool configuration {
  "host": "localhost",
  "port": 5432,
  "database": "coffee_export_db",
  "user": "postgres",
  "ssl": false
}

[DatabasePool] info: Database pool initialized {
  "maxConnections": 20,
  "idleTimeout": 30000
}

[API_NAME] info: Testing PostgreSQL database connection
[API_NAME] info: Connected to PostgreSQL database
```

### Verify All Services Are Running
```bash
# Check all ports are listening
netstat -tuln | grep -E '300[1-7]'

# Or use lsof
lsof -i -P -n | grep -E '300[1-7]'

# Expected output:
# LISTEN  127.0.0.1:3001
# LISTEN  127.0.0.1:3002
# LISTEN  127.0.0.1:3003
# LISTEN  127.0.0.1:3004
# LISTEN  127.0.0.1:3005
# LISTEN  127.0.0.1:3006
# LISTEN  127.0.0.1:3007
```

---

## Post-Startup Verification

### ✅ All Services Connected to Database

- [ ] Commercial Bank API (3001) - Connected to database
- [ ] National Bank API (3002) - Connected to database
- [ ] ECTA API (3003) - Connected to database
- [ ] Shipping Line API (3004) - Connected to database
- [ ] Custom Authorities API (3005) - Connected to database
- [ ] ECX API (3006) - Connected to database
- [ ] Exporter Portal API (3007) - Connected to database

### Test Database Connectivity
```bash
# Test from command line
psql -h localhost -U postgres -d coffee_export_db -c "SELECT 1;"

# Expected output:
#  ?column?
# ----------
#         1
# (1 row)
```

---

## Troubleshooting Checklist

### If Service Won't Start

- [ ] Check PostgreSQL is running: `sudo systemctl status postgresql`
- [ ] Check database exists: `psql -h localhost -U postgres -l | grep coffee_export_db`
- [ ] Check .env file exists: `ls -la /home/gu-da/cbc/api/[service]/.env`
- [ ] Check .env has correct DB settings: `grep "^DB_" /home/gu-da/cbc/api/[service]/.env`
- [ ] Check dependencies installed: `npm install` in service directory
- [ ] Check port is not in use: `lsof -i :[port]`

### If Database Connection Fails

- [ ] Verify PostgreSQL is running: `sudo systemctl status postgresql`
- [ ] Verify database exists: `psql -h localhost -U postgres -d coffee_export_db`
- [ ] Verify user credentials: `psql -h localhost -U postgres`
- [ ] Check .env file DB settings match actual database
- [ ] Test connection manually: `psql -h localhost -U postgres -d coffee_export_db`

### If Port Already in Use

```bash
# Find process using port
lsof -i :3001  # Replace with actual port

# Kill process
kill -9 <PID>

# Restart service
cd /home/gu-da/cbc/api/[service] && npm run dev
```

---

## Configuration Documentation

### Reference Documents
- [ ] `DATABASE_CONFIGURATION_VERIFICATION.md` - Detailed verification report
- [ ] `DATABASE_CONFIG_SUMMARY.md` - Complete configuration summary
- [ ] `START_ALL_SERVICES.md` - Quick start guide
- [ ] `CONFIGURATION_CHECKLIST.md` - This checklist

### View Configuration Files
```bash
# View all .env files
for service in commercial-bank national-bank ecta shipping-line custom-authorities ecx exporter-portal; do
  echo "=== $service ==="
  cat /home/gu-da/cbc/api/$service/.env | grep "^DB_"
done
```

---

## Final Verification

### ✅ Configuration Status

- [x] All 7 API services have .env files
- [x] All .env files have database configuration
- [x] All services use same database: `coffee_export_db`
- [x] All services use same user: `postgres`
- [x] All services use same password: `postgres`
- [x] All services use same host: `localhost`
- [x] All services use same port: `5432`
- [x] All services have SSL disabled (development)
- [x] All services have identical pool settings
- [x] ECX API .env file created ✨ NEW
- [x] Commercial Bank API verified running with database connection

### ✅ Ready to Deploy

- [x] PostgreSQL database configured
- [x] All API services configured
- [x] All .env files present and correct
- [x] Database connection pool settings optimized
- [x] Documentation complete

---

## Quick Reference

### Start All Services (One Command Per Terminal)
```bash
# Terminal 1
cd /home/gu-da/cbc/api/commercial-bank && npm run dev

# Terminal 2
cd /home/gu-da/cbc/api/national-bank && npm run dev

# Terminal 3
cd /home/gu-da/cbc/api/ecta && npm run dev

# Terminal 4
cd /home/gu-da/cbc/api/shipping-line && npm run dev

# Terminal 5
cd /home/gu-da/cbc/api/custom-authorities && npm run dev

# Terminal 6
cd /home/gu-da/cbc/api/ecx && npm run dev

# Terminal 7
cd /home/gu-da/cbc/api/exporter-portal && npm run dev
```

### Verify All Services Running
```bash
netstat -tuln | grep -E '300[1-7]'
```

### Check Database Connection
```bash
psql -h localhost -U postgres -d coffee_export_db -c "SELECT 1;"
```

---

## Summary

✅ **All 7 API services are configured and ready to start**

- Commercial Bank API (3001) - ✅ VERIFIED RUNNING
- National Bank API (3002) - ✅ CONFIGURED
- ECTA API (3003) - ✅ CONFIGURED
- Shipping Line API (3004) - ✅ CONFIGURED
- Custom Authorities API (3005) - ✅ CONFIGURED
- ECX API (3006) - ✅ CONFIGURED (NEW)
- Exporter Portal API (3007) - ✅ CONFIGURED

**Next Step:** Start each service in separate terminals and verify database connections.

---

**Last Updated:** 2025-12-17
**Configuration Status:** ✅ COMPLETE
**Ready to Start:** ✅ YES
