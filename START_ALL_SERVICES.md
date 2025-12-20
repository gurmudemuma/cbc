# Start All API Services - Quick Reference

## Prerequisites
- PostgreSQL running on localhost:5432
- Database `coffee_export_db` exists
- All `.env` files configured (✅ VERIFIED)

---

## Quick Start - All Services

### Option 1: Start Services in Separate Terminals

**Terminal 1 - Commercial Bank API (Port 3001)**
```bash
cd /home/gu-da/cbc/api/commercial-bank && npm run dev
```

**Terminal 2 - National Bank API (Port 3002)**
```bash
cd /home/gu-da/cbc/api/national-bank && npm run dev
```

**Terminal 3 - ECTA API (Port 3003)**
```bash
cd /home/gu-da/cbc/api/ecta && npm run dev
```

**Terminal 4 - Shipping Line API (Port 3004)**
```bash
cd /home/gu-da/cbc/api/shipping-line && npm run dev
```

**Terminal 5 - Custom Authorities API (Port 3005)**
```bash
cd /home/gu-da/cbc/api/custom-authorities && npm run dev
```

**Terminal 6 - ECX API (Port 3006)**
```bash
cd /home/gu-da/cbc/api/ecx && npm run dev
```

**Terminal 7 - Exporter Portal API (Port 3007)**
```bash
cd /home/gu-da/cbc/api/exporter-portal && npm run dev
```

---

## Service Status Check

### Verify All Services Are Running

```bash
# Check if all ports are listening
netstat -tuln | grep -E '300[1-7]'

# Or use lsof
lsof -i -P -n | grep -E '300[1-7]'
```

### Expected Output:
```
LISTEN  127.0.0.1:3001  (Commercial Bank)
LISTEN  127.0.0.1:3002  (National Bank)
LISTEN  127.0.0.1:3003  (ECTA)
LISTEN  127.0.0.1:3004  (Shipping Line)
LISTEN  127.0.0.1:3005  (Custom Authorities)
LISTEN  127.0.0.1:3006  (ECX)
LISTEN  127.0.0.1:3007  (Exporter Portal)
```

---

## Service Details

| Service | Port | Organization | Status |
|---------|------|--------------|--------|
| Commercial Bank | 3001 | CommercialBankMSP | ✅ VERIFIED |
| National Bank | 3002 | NationalBankMSP | ✅ CONFIGURED |
| ECTA | 3003 | ECTAMSP | ✅ CONFIGURED |
| Shipping Line | 3004 | ShippingLineMSP | ✅ CONFIGURED |
| Custom Authorities | 3005 | CustomAuthoritiesMSP | ✅ CONFIGURED |
| ECX | 3006 | ECXMSP | ✅ CONFIGURED |
| Exporter Portal | 3007 | CommercialBankMSP | ✅ CONFIGURED |

---

## Database Connection Verification

### Check Database Connection for Each Service

After starting a service, look for these log messages:

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

---

## Troubleshooting

### Service Won't Start

1. **Check Node.js is installed:**
   ```bash
   node --version
   npm --version
   ```

2. **Check dependencies are installed:**
   ```bash
   cd /home/gu-da/cbc/api/[service-name]
   npm install
   ```

3. **Check .env file exists:**
   ```bash
   ls -la /home/gu-da/cbc/api/[service-name]/.env
   ```

### Database Connection Failed

1. **Verify PostgreSQL is running:**
   ```bash
   sudo systemctl status postgresql
   ```

2. **Test database connection:**
   ```bash
   psql -h localhost -U postgres -d coffee_export_db -c "SELECT 1;"
   ```

3. **Check database exists:**
   ```bash
   psql -h localhost -U postgres -l | grep coffee_export_db
   ```

### Port Already in Use

If a port is already in use, you'll see an error like:
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solution:**
```bash
# Find process using the port
lsof -i :3001

# Kill the process
kill -9 <PID>
```

---

## Environment Variables Summary

All services share the same database configuration:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=coffee_export_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false
DB_POOL_MIN=2
DB_POOL_MAX=10
```

---

## Logs Location

Each service may create logs in:
- `/home/gu-da/cbc/api/[service-name]/logs/`

---

## Next Steps

1. ✅ Verify PostgreSQL is running
2. ✅ Start all services in separate terminals
3. ✅ Monitor console output for database connection messages
4. ✅ Verify all services are listening on their respective ports
5. ✅ Test API endpoints

---

**Configuration Status:** ✅ ALL SERVICES CONFIGURED & READY TO START
