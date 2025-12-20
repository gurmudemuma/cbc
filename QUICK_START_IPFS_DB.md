# Quick Start: Database & IPFS Setup

## What Was Done

### 1. Database Connection Fixed ✅
- Fixed PostgreSQL connection pool configuration
- Updated all services to use new pool
- Added support for both `DATABASE_URL` and individual parameters

### 2. IPFS Implemented ✅
- Created complete IPFS service
- Added IPFS to docker-compose
- Integrated with all API services

---

## Start the System

```bash
# Navigate to project directory
cd /home/gu-da/cbc

# Start all services
docker-compose -f docker-compose.postgres.yml up -d

# Check status
docker-compose -f docker-compose.postgres.yml ps
```

---

## Verify Everything Works

### Check Database
```bash
# Test database connection
curl http://localhost:3001/health

# Should return:
# {
#   "status": "ok",
#   "database": "connected",
#   "service": "Commercial Bank API"
# }
```

### Check IPFS
```bash
# Test IPFS node
docker exec ipfs ipfs id

# Should return node information
```

### Check All Services
```bash
# All should show "healthy"
docker-compose -f docker-compose.postgres.yml ps

# Expected output:
# NAME                STATUS
# postgres            Up (healthy)
# ipfs                Up (healthy)
# commercialbank-api  Up (healthy)
# national-bank-api   Up (healthy)
# ecta-api            Up (healthy)
# shipping-line-api   Up (healthy)
# custom-authorities  Up (healthy)
# frontend            Up
```

---

## Upload a Document to IPFS

```bash
# Example: Upload a file
curl -X POST http://localhost:3001/api/documents/upload \
  -F "file=@/path/to/document.pdf" \
  -F "entityId=exporter-123" \
  -F "entityType=exporter_profile" \
  -F "documentType=business_registration"

# Response will include IPFS hash
```

---

## View Logs

```bash
# All services
docker-compose -f docker-compose.postgres.yml logs -f

# Specific service
docker-compose -f docker-compose.postgres.yml logs -f commercialbank-api

# IPFS logs
docker-compose -f docker-compose.postgres.yml logs -f ipfs

# Database logs
docker-compose -f docker-compose.postgres.yml logs -f postgres
```

---

## Stop Services

```bash
# Stop all services
docker-compose -f docker-compose.postgres.yml down

# Stop and remove volumes (WARNING: deletes data)
docker-compose -f docker-compose.postgres.yml down -v
```

---

## Environment Variables

### For Local Development

Create `.env` files in each API directory:

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=coffee_export_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false

# IPFS
IPFS_HOST=localhost
IPFS_PORT=5001
IPFS_PROTOCOL=http
IPFS_GATEWAY=https://ipfs.io
```

### For Docker Compose

Already configured in `docker-compose.postgres.yml`:
- Database: `postgres` service
- IPFS: `ipfs` service
- All APIs have correct environment variables

---

## Common Commands

```bash
# View IPFS node info
docker exec ipfs ipfs id

# List pinned files
docker exec ipfs ipfs pin ls

# Check IPFS storage
docker exec ipfs ipfs repo stat

# Run garbage collection
docker exec ipfs ipfs repo gc

# Check database
docker exec postgres psql -U postgres -d coffee_export_db -c "SELECT version();"

# View database tables
docker exec postgres psql -U postgres -d coffee_export_db -c "\dt"
```

---

## Troubleshooting

### Services won't start
```bash
# Check if ports are in use
lsof -i :3001
lsof -i :5001
lsof -i :5432

# Check Docker logs
docker-compose -f docker-compose.postgres.yml logs
```

### Database connection fails
```bash
# Check PostgreSQL is running
docker-compose -f docker-compose.postgres.yml ps postgres

# Check logs
docker-compose -f docker-compose.postgres.yml logs postgres

# Verify credentials
docker exec postgres psql -U postgres -c "SELECT 1"
```

### IPFS connection fails
```bash
# Check IPFS is running
docker-compose -f docker-compose.postgres.yml ps ipfs

# Check IPFS health
docker exec ipfs ipfs id

# Check logs
docker-compose -f docker-compose.postgres.yml logs ipfs
```

---

## API Endpoints

### Health Checks
```
GET /health          - API health
GET /ready           - API readiness
GET /live            - API liveness
```

### Database Operations
```
POST   /api/users/register      - Register user
POST   /api/auth/login          - Login
GET    /api/users/:id           - Get user
```

### Document Operations
```
POST   /api/documents/upload    - Upload document
GET    /api/documents/:id       - Get document
GET    /api/documents/entity/:id - List entity documents
DELETE /api/documents/:id       - Delete document
```

---

## Performance Tips

1. **Database:** Connection pool is set to 20 max connections
2. **IPFS:** Use local gateway for faster access
3. **Storage:** Monitor IPFS storage with `ipfs repo stat`
4. **Cleanup:** Run garbage collection regularly

---

## Documentation

- **Database Fix:** See `DATABASE_CONNECTION_FIX.md`
- **IPFS Guide:** See `IPFS_IMPLEMENTATION.md`
- **Full Summary:** See `IMPLEMENTATION_SUMMARY.md`

---

## Support

For issues:
1. Check logs: `docker-compose logs -f`
2. Review documentation files
3. Verify environment variables
4. Check Docker is running
5. Verify ports are available

---

## Next Steps

1. ✅ Start services
2. ✅ Verify health endpoints
3. ✅ Test document upload
4. ✅ Monitor logs
5. ✅ Deploy to production

**System is ready for use!**
