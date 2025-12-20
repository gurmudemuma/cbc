# Quick Start Guide - Fixed Configuration

**Status:** ✅ All configuration fixes applied and ready to use

---

## Prerequisites

- Docker & Docker Compose installed
- Node.js 18+ installed
- npm 8+ installed
- Git installed

---

## Step 1: Create Docker Network

```bash
docker network create coffee-export-network
```

**Verify:**
```bash
docker network ls | grep coffee-export
```

---

## Step 2: Install Dependencies

```bash
npm install --legacy-peer-deps
```

This installs dependencies for all workspaces (root, all APIs, frontend).

---

## Step 3: Create Environment Files

### For Development

```bash
# Create .env files from templates for all services
cp api/commercial-bank/.env.template api/commercial-bank/.env
cp api/custom-authorities/.env.template api/custom-authorities/.env
cp api/ecta/.env.template api/ecta/.env
cp api/ecx/.env.template api/ecx/.env
cp api/exporter-portal/.env.template api/exporter-portal/.env
cp api/national-bank/.env.template api/national-bank/.env
cp api/shipping-line/.env.template api/shipping-line/.env
cp frontend/.env.template frontend/.env
```

**Default values are already set for development:**
- Database: localhost:5432
- Redis: localhost:6379
- IPFS: localhost:5001
- All APIs: localhost:3001-3007
- Frontend: localhost:5173

---

## Step 4: Start Infrastructure Services

```bash
# Start PostgreSQL, Redis, and IPFS
docker-compose -f docker-compose.postgres.yml up -d

# Verify services are running
docker-compose -f docker-compose.postgres.yml ps
```

**Expected Output:**
```
NAME                COMMAND                  SERVICE      STATUS
postgres            "docker-entrypoint.s…"   postgres     Up (healthy)
redis               "redis-server"           redis        Up (healthy)
ipfs                "/sbin/tini -- /usr/…"   ipfs         Up (healthy)
```

---

## Step 5: Start API Services

```bash
# Start all 7 API services
docker-compose -f docker-compose.apis.yml up -d

# Verify services are running
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

---

## Step 6: Start Frontend

```bash
# Navigate to frontend directory
cd frontend

# Start development server
npm run dev
```

**Expected Output:**
```
  VITE v7.2.2  ready in 123 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

Open browser to `http://localhost:5173`

---

## Verify All Services

### Health Check Endpoints

```bash
# Test each service
curl http://localhost:3001/health  # Commercial Bank
curl http://localhost:3002/health  # Custom Authorities
curl http://localhost:3003/health  # ECTA
curl http://localhost:3004/health  # Exporter Portal
curl http://localhost:3005/health  # National Bank
curl http://localhost:3006/health  # ECX
curl http://localhost:3007/health  # Shipping Line
curl http://localhost:5173/health  # Frontend
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Database Connection

```bash
# Connect to PostgreSQL
psql -h localhost -U postgres -d coffee_export_db

# List tables
\dt

# Exit
\q
```

### Redis Connection

```bash
# Test Redis
redis-cli ping

# Expected: PONG
```

---

## Common Commands

### Development

```bash
# Build all services
npm run build

# Run tests
npm run test

# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run type-check

# Start all services
npm run dev
```

### Docker Management

```bash
# View logs
docker-compose -f docker-compose.apis.yml logs -f

# View specific service logs
docker-compose -f docker-compose.apis.yml logs -f commercial-bank

# Stop all services
docker-compose -f docker-compose.apis.yml down

# Stop infrastructure
docker-compose -f docker-compose.postgres.yml down

# Remove all containers and volumes
docker-compose -f docker-compose.apis.yml down -v
docker-compose -f docker-compose.postgres.yml down -v
```

### Database

```bash
# Connect to database
psql -h localhost -U postgres -d coffee_export_db

# Backup database
pg_dump -h localhost -U postgres coffee_export_db > backup.sql

# Restore database
psql -h localhost -U postgres coffee_export_db < backup.sql
```

---

## Troubleshooting

### Services Won't Start

```bash
# Check logs
docker-compose -f docker-compose.apis.yml logs

# Restart services
docker-compose -f docker-compose.apis.yml restart

# Rebuild images
docker-compose -f docker-compose.apis.yml build --no-cache
```

### Database Connection Failed

```bash
# Check PostgreSQL
docker logs postgres

# Test connection
docker exec postgres psql -U postgres -d coffee_export_db -c "SELECT 1"

# Restart PostgreSQL
docker-compose -f docker-compose.postgres.yml restart postgres
```

### Port Already in Use

```bash
# Find process using port
lsof -i :3001

# Kill process
kill -9 <PID>

# Or change port in docker-compose file
```

### API Health Check Failing

```bash
# Check service logs
docker logs cbc-commercial-bank

# Check environment variables
docker exec cbc-commercial-bank env | grep DB_

# Verify database is running
docker exec postgres pg_isready -U postgres
```

### Frontend API Calls Failing

```bash
# Check browser console for errors
# Check network tab for failed requests
# Verify API services are running
docker-compose -f docker-compose.apis.yml ps

# Check Vite proxy configuration
cat frontend/vite.config.js | grep -A 5 "proxy:"
```

---

## Production Deployment

### Before Production

1. **Generate Strong Secrets**
   ```bash
   JWT_SECRET=$(openssl rand -base64 32)
   ENCRYPTION_KEY=$(openssl rand -hex 32)
   REDIS_PASSWORD=$(openssl rand -base64 16)
   ```

2. **Create Production Environment Files**
   ```bash
   cp api/commercial-bank/.env.production.template api/commercial-bank/.env.production
   # ... repeat for all services
   ```

3. **Update All CHANGE_ME Values**
   - Replace with actual production values
   - Use strong passwords
   - Configure production domains
   - Set up SSL certificates

4. **Enable HTTPS/TLS**
   - Configure SSL certificates
   - Update nginx.conf for HTTPS
   - Set FORCE_HTTPS=true

5. **Configure Secrets Management**
   - Use HashiCorp Vault
   - Or AWS Secrets Manager
   - Or similar service

6. **Run Security Audit**
   - Check for hardcoded secrets
   - Verify SSL/TLS configuration
   - Test authentication
   - Verify authorization

7. **Perform Load Testing**
   - Test with expected traffic
   - Monitor resource usage
   - Identify bottlenecks

8. **Deploy to Production**
   - Use production docker-compose file
   - Monitor logs
   - Set up alerting
   - Have rollback plan ready

---

## File Structure

```
/home/gu-da/cbc/
├── api/
│   ├── commercial-bank/
│   │   ├── .env                    # Development config
│   │   ├── .env.template           # Template
│   │   ├─��� .env.production.template # Production template
│   │   └── src/
│   ├── custom-authorities/
│   ├── ecta/
│   ├── ecx/
│   ├── exporter-portal/
│   ├── national-bank/
│   ├── shipping-line/
│   ├── shared/
│   ├── .prettierrc                 # Prettier config
│   ├── .eslintrc.js                # ESLint config
│   ├── jest.config.js              # Jest config
│   └── tsconfig.base.json          # TypeScript base config
├── frontend/
│   ├── .env                        # Development config
│   ├── .env.template               # Template
│   ├── vite.config.js              # Vite config (FIXED)
│   ├── nginx.conf                  # Nginx config (FIXED)
│   └── src/
├── docker-compose.postgres.yml     # Infrastructure (FIXED)
├── docker-compose.apis.yml         # API services (FIXED)
├── package.json                    # Root config (UPDATED)
├── CONFIGURATION_AUDIT_REPORT.md   # Audit report
├── CONFIGURATION_FIX_GUIDE.md      # Fix guide
├── CONFIGURATION_FIXES_APPLIED.md  # Summary of fixes
└── QUICK_START_FIXED_CONFIG.md     # This file
```

---

## Key Improvements Made

✅ **Docker Configuration**
- Version standardized to 3.8
- Redis service added
- Environment files properly loaded
- All services have healthchecks

✅ **Frontend Configuration**
- Vite proxy rules fixed
- Port mappings corrected
- Nginx API gateway fixed

✅ **TypeScript Configuration**
- Strict mode enabled
- Path aliases added
- Type safety improved

✅ **Code Quality**
- Jest configuration corrected
- Prettier configuration added
- ESLint configuration consistent

✅ **Environment Configuration**
- Production templates created
- Security checklist included
- All services have templates

✅ **Development Experience**
- Root-level npm scripts added
- Easier workspace management
- Better CI/CD integration

---

## Support

For detailed information, see:
- `CONFIGURATION_AUDIT_REPORT.md` - Full audit details
- `CONFIGURATION_FIX_GUIDE.md` - Detailed fix instructions
- `CONFIGURATION_QUICK_CHECKLIST.md` - Verification checklist
- `CONFIGURATION_FIXES_APPLIED.md` - Summary of all fixes

---

## Next Steps

1. ✅ Follow steps 1-6 above to start the system
2. ✅ Verify all services are running
3. ✅ Test API endpoints
4. ✅ Test frontend functionality
5. ✅ Review and fix any TypeScript errors
6. ✅ Run tests and linting
7. ✅ Prepare for production deployment

---

**Status:** Ready to use
**Last Updated:** 2024
