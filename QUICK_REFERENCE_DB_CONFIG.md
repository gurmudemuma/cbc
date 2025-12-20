# Quick Reference - PostgreSQL Database Configuration

## ✅ Status: COMPLETE & VERIFIED

All 7 API services configured with PostgreSQL database connectivity.

---

## Database Connection Details

```
Host:       localhost
Port:       5432
Database:   coffee_export_db
User:       postgres
Password:   postgres
SSL:        false
```

---

## All Services Configuration

| Service | Port | Status | .env File |
|---------|------|--------|-----------|
| Commercial Bank | 3001 | ✅ RUNNING | `/api/commercial-bank/.env` |
| National Bank | 3002 | ✅ READY | `/api/national-bank/.env` |
| ECTA | 3003 | ✅ READY | `/api/ecta/.env` |
| Shipping Line | 3004 | ✅ READY | `/api/shipping-line/.env` |
| Custom Authorities | 3005 | ✅ READY | `/api/custom-authorities/.env` |
| ECX | 3006 | ✅ READY | `/api/ecx/.env` ✨ NEW |
| Exporter Portal | 3007 | ✅ READY | `/api/exporter-portal/.env` |

---

## Start All Services

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

## Verify Services Running

```bash
# Check all ports listening
netstat -tuln | grep -E '300[1-7]'

# Or
lsof -i -P -n | grep -E '300[1-7]'
```

---

## Verify Database Connection

```bash
# Test PostgreSQL connection
psql -h localhost -U postgres -d coffee_export_db -c "SELECT 1;"

# Expected output:
#  ?column?
# ----------
#         1
```

---

## Database Settings (All Services)

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

## Expected Startup Output

Each service should show:

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

[API_NAME] info: Connected to PostgreSQL database
```

---

## Troubleshooting

### PostgreSQL Not Running
```bash
sudo systemctl start postgresql
sudo systemctl status postgresql
```

### Database Doesn't Exist
```bash
psql -h localhost -U postgres -c "CREATE DATABASE coffee_export_db;"
```

### Port Already in Use
```bash
lsof -i :3001  # Replace with port number
kill -9 <PID>
```

### Connection Refused
```bash
# Check PostgreSQL is listening
sudo netstat -tuln | grep 5432

# Check credentials
psql -h localhost -U postgres
```

---

## Documentation Files

- `DATABASE_CONFIGURATION_VERIFICATION.md` - Detailed verification
- `DATABASE_CONFIG_SUMMARY.md` - Complete summary
- `START_ALL_SERVICES.md` - Startup guide
- `CONFIGURATION_CHECKLIST.md` - Pre-startup checklist
- `CONFIGURATION_COMPLETE.md` - Task completion report

---

## Key Points

✅ All 7 services configured
✅ All use same database
✅ All have identical settings
✅ Commercial Bank verified running
✅ ECX API .env created
✅ Ready to start all services

---

**Last Updated:** 2025-12-17
**Status:** ✅ COMPLETE
