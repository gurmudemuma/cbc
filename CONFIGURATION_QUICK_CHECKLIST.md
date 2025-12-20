# Configuration Quick Checklist

## Pre-Deployment Verification

### 🔴 CRITICAL - Must Fix

- [ ] **Docker Network**
  - [ ] Network exists: `docker network create coffee-export-network`
  - [ ] Network name: `coffee-export-network`

- [ ] **Redis Service**
  - [ ] Redis added to `docker-compose.postgres.yml`
  - [ ] Redis port: 6379
  - [ ] Redis healthcheck configured

- [ ] **Environment Variables**
  - [ ] All `.env` files created from templates
  - [ ] JWT_SECRET is strong (32+ chars)
  - [ ] ENCRYPTION_KEY is strong (32 bytes hex)
  - [ ] DB_PASSWORD is strong
  - [ ] REDIS_PASSWORD is strong

- [ ] **Docker Compose Files**
  - [ ] `docker-compose.postgres.yml` version: 3.8
  - [ ] `docker-compose.apis.yml` version: 3.8
  - [ ] All services have `env_file` directive
  - [ ] All services depend on postgres and redis
  - [ ] Network is NOT external in postgres compose

- [ ] **Vite Proxy Configuration**
  - [ ] All rewrite rules correct (remove prefix)
  - [ ] No double path prefixes
  - [ ] All API endpoints mapped correctly

- [ ] **Nginx Configuration**
  - [ ] API gateway references removed or fixed
  - [ ] WebSocket configuration correct
  - [ ] Client max body size matches API config

### 🟠 HIGH - Should Fix

- [ ] **TypeScript Configuration**
  - [ ] `strict: true` enabled
  - [ ] `noImplicitAny: true` enabled
  - [ ] All type errors resolved

- [ ] **Jest Configuration**
  - [ ] Service names corrected
  - [ ] Coverage paths updated
  - [ ] All tests passing

- [ ] **Code Quality**
  - [ ] ESLint configuration standardized
  - [ ] Prettier configuration added to API
  - [ ] `npm run lint` passes
  - [ ] `npm run format:check` passes

- [ ] **Production Templates**
  - [ ] `.env.production.template` created for all services
  - [ ] Production-safe defaults set
  - [ ] HTTPS configured
  - [ ] SSL enabled for database

### 🟡 MEDIUM - Nice to Have

- [ ] **Documentation**
  - [ ] Configuration guide created
  - [ ] Deployment guide created
  - [ ] Troubleshooting guide created

- [ ] **Root Scripts**
  - [ ] Root `package.json` has workspace scripts
  - [ ] `npm run build` works at root
  - [ ] `npm run test` works at root
  - [ ] `npm run lint` works at root

- [ ] **Database**
  - [ ] Migration files verified
  - [ ] Backup strategy documented
  - [ ] SSL enabled in production

---

## Service Startup Verification

### Start Infrastructure
```bash
# Create network
docker network create coffee-export-network

# Start infrastructure
docker-compose -f docker-compose.postgres.yml up -d

# Verify services
docker-compose -f docker-compose.postgres.yml ps
```

**Expected Output:**
```
NAME                COMMAND                  SERVICE      STATUS
postgres            "docker-entrypoint.s…"   postgres     Up (healthy)
redis               "redis-server"           redis        Up (healthy)
ipfs                "/sbin/tini -- /usr/…"   ipfs         Up (healthy)
```

### Start APIs
```bash
# Start all APIs
docker-compose -f docker-compose.apis.yml up -d

# Verify services
docker-compose -f docker-compose.apis.yml ps
```

**Expected Output:**
```
NAME                           COMMAND                  SERVICE              STATUS
cbc-commercial-bank            "node api/commercial-…" commercial-bank      Up (healthy)
cbc-custom-authorities         "node api/custom-auth…" custom-authorities   Up (healthy)
cbc-ecta                       "node api/ecta/dist/s…" ecta                 Up (healthy)
cbc-exporter-portal            "node api/exporter-po…" exporter-portal      Up (healthy)
cbc-national-bank              "node api/national-ba…" national-bank        Up (healthy)
cbc-ecx                        "node api/ecx/dist/sr…" ecx                  Up (healthy)
cbc-shipping-line              "node api/shipping-li…" shipping-line        Up (healthy)
```

### Start Frontend
```bash
# Development
cd frontend
npm run dev

# Expected: Server running at http://localhost:5173
```

---

## Health Check Endpoints

### Test Each Service

```bash
# Commercial Bank
curl http://localhost:3001/health

# Custom Authorities
curl http://localhost:3002/health

# ECTA
curl http://localhost:3003/health

# Exporter Portal
curl http://localhost:3004/health

# National Bank
curl http://localhost:3005/health

# ECX
curl http://localhost:3006/health

# Shipping Line
curl http://localhost:3007/health

# Frontend
curl http://localhost:5173/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

## Database Verification

```bash
# Connect to database
psql -h localhost -U postgres -d coffee_export_db

# List tables
\dt

# Check migrations
SELECT * FROM pg_tables WHERE schemaname = 'public';

# Exit
\q
```

---

## API Connectivity Test

### From Frontend
```javascript
// Test API connectivity
fetch('http://localhost:3001/health')
  .then(r => r.json())
  .then(d => console.log('Commercial Bank:', d))
  .catch(e => console.error('Error:', e));

fetch('http://localhost:3002/health')
  .then(r => r.json())
  .then(d => console.log('Custom Authorities:', d))
  .catch(e => console.error('Error:', e));

// ... repeat for other services
```

---

## Environment Variable Verification

```bash
# Check commercial-bank environment
docker exec cbc-commercial-bank env | grep -E "DB_|JWT_|REDIS_"

# Check custom-authorities environment
docker exec cbc-custom-authorities env | grep -E "DB_|JWT_|REDIS_"

# ... repeat for other services
```

---

## Docker Image Verification

```bash
# List images
docker images | grep cbc

# Check image sizes
docker images --format "table {{.Repository}}\t{{.Size}}" | grep cbc

# Inspect image
docker inspect cbc-commercial-bank:latest
```

---

## Network Verification

```bash
# List networks
docker network ls

# Inspect coffee-export network
docker network inspect coffee-export-network

# Test connectivity between containers
docker exec cbc-commercial-bank ping postgres
docker exec cbc-commercial-bank ping redis
docker exec cbc-commercial-bank ping ipfs
```

---

## Performance Baseline

### Memory Usage
```bash
docker stats --no-stream
```

**Expected (Development):**
- postgres: 100-200 MB
- redis: 10-20 MB
- ipfs: 50-100 MB
- Each API: 150-300 MB
- Total: ~1-2 GB

### Disk Usage
```bash
docker system df
```

---

## Security Verification

### Check for Hardcoded Secrets
```bash
# Search for common patterns
grep -r "password" api/ --include="*.ts" --include="*.js" | grep -v node_modules | grep -v ".env"
grep -r "secret" api/ --include="*.ts" --include="*.js" | grep -v node_modules | grep -v ".env"
grep -r "key" api/ --include="*.ts" --include="*.js" | grep -v node_modules | grep -v ".env"
```

**Expected:** No results (all secrets in .env files)

### Check Environment Files
```bash
# Verify .env files are in .gitignore
cat .gitignore | grep ".env"

# Verify no .env files in git
git ls-files | grep ".env"
```

**Expected:** No .env files tracked in git

### Check HTTPS Configuration
```bash
# For production, verify HTTPS is enforced
grep -r "https" frontend/nginx.conf
grep -r "FORCE_HTTPS" api/
```

---

## Logs Verification

### Check for Errors
```bash
# Commercial Bank logs
docker logs cbc-commercial-bank | grep -i error

# Custom Authorities logs
docker logs cbc-custom-authorities | grep -i error

# Database logs
docker logs postgres | grep -i error

# Redis logs
docker logs redis | grep -i error

# IPFS logs
docker logs ipfs | grep -i error
```

**Expected:** No critical errors

### Check for Warnings
```bash
# All services
docker-compose -f docker-compose.apis.yml logs | grep -i warn
```

---

## Build Verification

### TypeScript Build
```bash
# Build all services
npm run build

# Check for errors
echo $?  # Should be 0
```

### Docker Build
```bash
# Build all images
docker-compose -f docker-compose.apis.yml build

# Check for errors
echo $?  # Should be 0
```

### Frontend Build
```bash
cd frontend
npm run build

# Check dist folder
ls -la dist/
```

---

## Testing Verification

### Unit Tests
```bash
npm run test
```

**Expected:** All tests passing

### Linting
```bash
npm run lint
```

**Expected:** No errors

### Type Checking
```bash
npm run type-check
```

**Expected:** No type errors

---

## Deployment Readiness Checklist

### Before Staging
- [ ] All critical fixes applied
- [ ] All tests passing
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] All services healthy
- [ ] Database connected
- [ ] Redis connected
- [ ] IPFS connected
- [ ] API endpoints responding
- [ ] Frontend loads
- [ ] API calls work from frontend

### Before Production
- [ ] All high priority fixes applied
- [ ] Security audit completed
- [ ] Load testing passed
- [ ] HTTPS configured
- [ ] SSL certificates installed
- [ ] Secrets management configured
- [ ] Monitoring configured
- [ ] Logging configured
- [ ] Backup strategy implemented
- [ ] Disaster recovery plan documented
- [ ] Team trained on deployment
- [ ] Rollback plan documented

---

## Quick Troubleshooting

### Services Won't Start
```bash
# Check network
docker network ls | grep coffee-export

# Check logs
docker-compose -f docker-compose.apis.yml logs

# Restart services
docker-compose -f docker-compose.apis.yml restart
```

### Database Connection Failed
```bash
# Check postgres
docker logs postgres

# Test connection
docker exec postgres psql -U postgres -d coffee_export_db -c "SELECT 1"
```

### API Health Check Failing
```bash
# Check logs
docker logs cbc-commercial-bank

# Check environment
docker exec cbc-commercial-bank env | grep DB_

# Restart service
docker-compose -f docker-compose.apis.yml restart commercial-bank
```

### Frontend API Calls Failing
```bash
# Check proxy configuration
cat frontend/vite.config.js | grep -A 5 "proxy:"

# Check browser console for errors
# Check network tab for failed requests
# Verify API services are running
docker-compose -f docker-compose.apis.yml ps
```

---

## Support Resources

- **Configuration Audit Report:** `CONFIGURATION_AUDIT_REPORT.md`
- **Fix Guide:** `CONFIGURATION_FIX_GUIDE.md`
- **Docker Documentation:** https://docs.docker.com/
- **TypeScript Documentation:** https://www.typescriptlang.org/
- **Vite Documentation:** https://vitejs.dev/
- **Express Documentation:** https://expressjs.com/

---

**Last Updated:** 2024
**Status:** Ready for use
