# 🔧 Database Troubleshooting & Recovery Guide

## Quick Diagnostics

### Run Verification Script
```bash
bash /home/gu-da/cbc/VERIFY_DATABASE_CONNECTION.sh
```

This script will:
- ✅ Check PostgreSQL service status
- ✅ Verify port 5432 is listening
- ✅ Confirm database exists
- ✅ Test database connection
- ✅ Auto-fix common issues

---

## Common Issues & Solutions

### Issue 1: "Failed to connect to PostgreSQL database"

**Symptoms:**
```
error: Failed to connect to PostgreSQL database
[API_NAME] warn: ⚠️ Database connection failed - API will start in degraded mode
```

**Causes & Solutions:**

#### A. PostgreSQL Service Not Running
```bash
# Check status
sudo systemctl status postgresql

# Start service
sudo systemctl start postgresql

# Verify it's running
sudo systemctl is-active postgresql
```

#### B. PostgreSQL Not Listening on Port 5432
```bash
# Check if listening
sudo netstat -tuln | grep 5432

# If not listening, restart
sudo systemctl restart postgresql

# Verify
sudo netstat -tuln | grep 5432
```

#### C. postgres User Password Not Set
```bash
# Set password
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"

# Test connection
PGPASSWORD=postgres psql -h localhost -U postgres -d coffee_export_db -c "SELECT 1;"
```

#### D. Database Doesn't Exist
```bash
# Check if database exists
sudo -u postgres psql -l | grep coffee_export_db

# If not, create it
sudo -u postgres createdb coffee_export_db

# Verify
sudo -u postgres psql -l | grep coffee_export_db
```

---

### Issue 2: "connect ECONNREFUSED 127.0.0.1:5432"

**Cause:** PostgreSQL is not listening on localhost:5432

**Solution:**
```bash
# Restart PostgreSQL
sudo systemctl restart postgresql

# Verify it's listening
sudo netstat -tuln | grep 5432

# Test connection
PGPASSWORD=postgres psql -h localhost -U postgres -d coffee_export_db -c "SELECT 1;"
```

---

### Issue 3: "password authentication failed for user 'postgres'"

**Cause:** postgres user password is not set or incorrect

**Solution:**
```bash
# Set password to 'postgres'
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"

# Test connection
PGPASSWORD=postgres psql -h localhost -U postgres -d coffee_export_db -c "SELECT 1;"
```

---

### Issue 4: "database 'coffee_export_db' does not exist"

**Cause:** Database was not created

**Solution:**
```bash
# Create database
sudo -u postgres createdb coffee_export_db

# Verify
sudo -u postgres psql -l | grep coffee_export_db

# Test connection
PGPASSWORD=postgres psql -h localhost -U postgres -d coffee_export_db -c "SELECT 1;"
```

---

### Issue 5: "Connection pool timeout"

**Cause:** Too many connections or connection pool exhausted

**Solution:**
```bash
# Check active connections
sudo -u postgres psql -d coffee_export_db -c "SELECT count(*) FROM pg_stat_activity;"

# Kill idle connections
sudo -u postgres psql -d coffee_export_db -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND query_start < now() - interval '10 minutes';"

# Restart services
# Stop all services (Ctrl+C in each terminal)
# Then restart them
```

---

## Complete Recovery Procedure

If all else fails, follow this complete recovery procedure:

### Step 1: Stop All Services
```bash
# Press Ctrl+C in each terminal running a service
# Or kill all Node processes
pkill -f "node"
```

### Step 2: Restart PostgreSQL
```bash
# Stop PostgreSQL
sudo systemctl stop postgresql

# Wait 2 seconds
sleep 2

# Start PostgreSQL
sudo systemctl start postgresql

# Verify it's running
sudo systemctl status postgresql
```

### Step 3: Reset postgres User Password
```bash
# Set password
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"

# Verify
echo "Password set successfully"
```

### Step 4: Verify Database
```bash
# Check database exists
sudo -u postgres psql -l | grep coffee_export_db

# If not, create it
sudo -u postgres createdb coffee_export_db
```

### Step 5: Test Connection
```bash
# Test connection
PGPASSWORD=postgres psql -h localhost -U postgres -d coffee_export_db -c "SELECT 1;"

# Should output:
#  ?column?
# ----------
#         1
```

### Step 6: Restart Services
```bash
# Terminal 1
cd /home/gu-da/cbc/api/commercial-bank && npm run dev

# Terminal 2
cd /home/gu-da/cbc/api/national-bank && npm run dev

# ... and so on for all 7 services
```

---

## Verification Commands

### Check PostgreSQL Status
```bash
# Service status
sudo systemctl status postgresql

# Is it running?
sudo systemctl is-active postgresql

# Is it listening?
sudo netstat -tuln | grep 5432
```

### Check Database
```bash
# List all databases
sudo -u postgres psql -l

# Check specific database
sudo -u postgres psql -l | grep coffee_export_db

# Connect to database
sudo -u postgres psql -d coffee_export_db

# Inside psql, check tables
\dt

# Exit psql
\q
```

### Test Connection
```bash
# Test with password
PGPASSWORD=postgres psql -h localhost -U postgres -d coffee_export_db -c "SELECT 1;"

# Test with sudo (no password needed)
sudo -u postgres psql -d coffee_export_db -c "SELECT 1;"
```

### Check Active Connections
```bash
# Count connections
sudo -u postgres psql -d coffee_export_db -c "SELECT count(*) FROM pg_stat_activity;"

# List connections
sudo -u postgres psql -d coffee_export_db -c "SELECT pid, usename, application_name, state FROM pg_stat_activity;"
```

---

## PostgreSQL Configuration

### Current Authentication Settings
```bash
# View pg_hba.conf
sudo cat /etc/postgresql/*/main/pg_hba.conf | grep -E "^local|^host"
```

### Expected Output
```
local   all             postgres                                peer
local   all             all                                     peer
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             ::1/128                 scram-sha-256
```

### Explanation
- **local connections** (Unix socket): Use `peer` authentication (no password)
- **TCP connections** (127.0.0.1): Use `scram-sha-256` authentication (password required)

---

## Service Connection Configuration

All services use:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=coffee_export_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false
```

This configuration requires:
1. PostgreSQL running on localhost:5432
2. Database `coffee_export_db` exists
3. User `postgres` with password `postgres`

---

## Automated Recovery Script

Run this to automatically fix most issues:

```bash
#!/bin/bash

echo "Starting PostgreSQL recovery..."

# Stop PostgreSQL
sudo systemctl stop postgresql
sleep 2

# Start PostgreSQL
sudo systemctl start postgresql
sleep 2

# Set postgres password
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"

# Create database if needed
sudo -u postgres psql -l | grep -q coffee_export_db || sudo -u postgres createdb coffee_export_db

# Test connection
PGPASSWORD=postgres psql -h localhost -U postgres -d coffee_export_db -c "SELECT 1;"

if [ $? -eq 0 ]; then
    echo "✅ Recovery successful!"
else
    echo "❌ Recovery failed!"
    exit 1
fi
```

---

## Monitoring & Maintenance

### Check PostgreSQL Logs
```bash
# View recent logs
sudo tail -50 /var/log/postgresql/postgresql-*.log

# Follow logs in real-time
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### Monitor Connections
```bash
# Watch connections in real-time
watch -n 1 'sudo -u postgres psql -d coffee_export_db -c "SELECT count(*) FROM pg_stat_activity;"'
```

### Check Disk Space
```bash
# Check PostgreSQL data directory size
sudo du -sh /var/lib/postgresql/*/main/

# Check overall disk usage
df -h
```

---

## Performance Tuning

### Connection Pool Settings (in .env files)
```
DB_POOL_MIN=2      # Minimum connections to keep open
DB_POOL_MAX=10     # Maximum connections per service
```

### Recommended Values
- **Development:** MIN=2, MAX=10
- **Production:** MIN=5, MAX=20

### Adjust if Needed
Edit `.env` files in each service directory:
```bash
# Example: /home/gu-da/cbc/api/commercial-bank/.env
DB_POOL_MIN=5
DB_POOL_MAX=20
```

---

## Emergency Procedures

### Kill All Connections to Database
```bash
sudo -u postgres psql -d coffee_export_db -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'coffee_export_db' AND pid <> pg_backend_pid();"
```

### Reset Database (WARNING: Deletes all data)
```bash
# Drop database
sudo -u postgres dropdb coffee_export_db

# Recreate database
sudo -u postgres createdb coffee_export_db
```

### Restart PostgreSQL Completely
```bash
# Stop
sudo systemctl stop postgresql

# Wait
sleep 5

# Start
sudo systemctl start postgresql

# Verify
sudo systemctl status postgresql
```

---

## Support Resources

### Quick Verification
```bash
bash /home/gu-da/cbc/VERIFY_DATABASE_CONNECTION.sh
```

### Documentation Files
- **DATABASE_CONNECTION_FIX.md** - Connection fix details
- **DATABASE_CONFIG_SUMMARY.md** - Configuration details
- **MASTER_STARTUP_GUIDE.md** - Complete startup guide

### PostgreSQL Documentation
- Official: https://www.postgresql.org/docs/
- Connection: https://www.postgresql.org/docs/current/libpq-connect.html
- Authentication: https://www.postgresql.org/docs/current/auth-methods.html

---

## Summary

✅ **Database Troubleshooting Guide Complete**

**Quick Fix:**
```bash
bash /home/gu-da/cbc/VERIFY_DATABASE_CONNECTION.sh
```

**If Still Having Issues:**
1. Check PostgreSQL is running: `sudo systemctl status postgresql`
2. Restart PostgreSQL: `sudo systemctl restart postgresql`
3. Set password: `sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"`
4. Test connection: `PGPASSWORD=postgres psql -h localhost -U postgres -d coffee_export_db -c "SELECT 1;"`

---

**Last Updated:** 2025-12-17
**Status:** ✅ READY
