# CBC API Services - Complete Startup Guide

**Date:** 2024  
**Status:** ✅ READY TO START  
**Environment:** Docker + Local Services

---

## Quick Start (5 minutes)

### Step 1: Setup Production Environment
```bash
./setup-production-env.sh
```
This generates production-grade secrets and configures all services.

### Step 2: Start Services
```bash
./start-services.sh
```

### Step 3: Verify Services
```bash
./start-services.sh --status
```

---

## Prerequisites

### Required
- ✅ Docker & Docker Compose (for PostgreSQL and IPFS)
- ✅ Node.js v20+
- ✅ npm v11+
- ✅ Compiled code (dist folders)

### Optional
- curl (for health checks)
- lsof or netstat (for port checking)
- psql (for database testing)

---

## Environment Setup

### What the setup script does:

1. **Generates Secrets**
   - Creates production-grade JWT_SECRET (32 bytes)
   - Creates production-grade ENCRYPTION_KEY (32 bytes)

2. **Updates All .env Files**
   - Sets NODE_ENV=production
   - Updates JWT_SECRET (same for all services - SSO)
   - Updates ENCRYPTION_KEY
   - Sets DB_HOST=postgres (Docker)
   - Sets IPFS_HOST=ipfs (Docker)
   - Updates CORS_ORIGIN for Docker

3. **Services Updated**
   - commercial-bank (port 3001)
   - custom-authorities (port 3002)
   - ecta (port 3003)
   - exporter-portal (port 3004)
   - national-bank (port 3005)
   - ecx (port 3006)
   - shipping-line (port 3007)

---

## Docker Containers Required

### PostgreSQL
```bash
docker run -d --name postgres \
  -e POSTGRES_DB=coffee_export_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:15-alpine
```

### IPFS
```bash
docker run -d --name ipfs \
  -p 4001:4001 \
  -p 5001:5001 \
  -p 8080:8080 \
  ipfs/kubo:latest
```

### Or use Docker Compose
```bash
docker-compose -f docker-compose.postgres.yml up -d
```

---

## Starting Services

### Basic Start
```bash
./start-services.sh
```

### With Checks
```bash
./start-services.sh --check
```

### With Status
```bash
./start-services.sh --status
```

### With Health Check
```bash
./start-services.sh --health
```

### With Real-time Logs
```bash
./start-services.sh --tail
```

---

## Service Management Commands

### Check Prerequisites
```bash
./start-services.sh --check
```
Verifies:
- Node.js and npm installed
- API directory exists
- Compiled code exists
- PostgreSQL accessible
- IPFS accessible
- All ports available

### View Service Status
```bash
./start-services.sh --status
```
Shows:
- Running/stopped services
- PIDs
- Ports
- Count of running services

### View Logs
```bash
./start-services.sh --logs
```
Shows last 30 lines of each service log.

### Real-time Log Tailing
```bash
./start-services.sh --tail
```
Streams logs from all services in real-time.

### Check Service Health
```bash
./start-services.sh --health
```
Verifies:
- Services responding on ports
- Database connections active
- Health endpoints returning success

### Stop All Services
```bash
./start-services.sh --stop
```
Gracefully stops all services with 10-second timeout.

### Restart All Services
```bash
./start-services.sh --restart
```
Stops, waits, then starts all services.

### Show Help
```bash
./start-services.sh --help
```

---

## Troubleshooting

### Issue: "Compiled code not found"

**Solution:** Build the services
```bash
cd api/commercial-bank && npm run build
cd ../custom-authorities && npm run build
cd ../ecta && npm run build
cd ../exporter-portal && npm run build
cd ../national-bank && npm run build
cd ../ecx && npm run build
cd ../shipping-line && npm run build
```

Or build all at once:
```bash
for dir in api/*/; do (cd "$dir" && npm run build); done
```

### Issue: "Port already in use"

**Solution:** Kill the process using the port
```bash
# Find process using port 3001
lsof -i :3001

# Kill it
kill -9 <PID>

# Or kill all API ports
lsof -i :3001,:3002,:3003,:3004,:3005,:3006,:3007 | grep -v COMMAND | awk '{print $2}' | sort -u | xargs kill -9
```

### Issue: "PostgreSQL database is not accessible"

**Solution:** Check Docker container
```bash
# Check if container is running
docker ps | grep postgres

# Check container logs
docker logs postgres

# Check container IP
docker inspect postgres | grep IPAddress

# Test connection
psql -h <CONTAINER_IP> -U postgres -d coffee_export_db -c "SELECT 1;"
```

### Issue: "IPFS node is not accessible"

**Solution:** Check IPFS container
```bash
# Check if container is running
docker ps | grep ipfs

# Check container logs
docker logs ipfs

# Test connection
curl http://<CONTAINER_IP>:5001/api/v0/id
```

### Issue: "JWT_SECRET must be changed in production"

**Solution:** Run setup script
```bash
./setup-production-env.sh
```

### Issue: "Services not responding"

**Solution:** Check logs
```bash
./start-services.sh --logs

# Or check specific service
tail -f logs/commercial-bank.log
```

---

## Environment Variables

### Critical Variables
```bash
# Security
JWT_SECRET=<production-grade-secret>
ENCRYPTION_KEY=<32-byte-hex-key>

# Database
DB_HOST=postgres (Docker) or localhost (local)
DB_PORT=5432
DB_NAME=coffee_export_db
DB_USER=postgres
DB_PASSWORD=postgres

# IPFS
IPFS_HOST=ipfs (Docker) or localhost (local)
IPFS_PORT=5001

# Application
NODE_ENV=production
PORT=<service-port>
LOG_LEVEL=info
```

### Optional Variables
```bash
# Email
EMAIL_ENABLED=true
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=<email>
EMAIL_PASSWORD=<password>

# Monitoring
MONITORING_ENABLED=true
METRICS_PORT=9090

# Redis (optional)
REDIS_HOST=redis
REDIS_PORT=6379
```

---

## Service Ports

| Service | Port | URL |
|---------|------|-----|
| Commercial Bank | 3001 | http://localhost:3001 |
| Custom Authorities | 3002 | http://localhost:3002 |
| ECTA | 3003 | http://localhost:3003 |
| Exporter Portal | 3004 | http://localhost:3004 |
| National Bank | 3005 | http://localhost:3005 |
| ECX | 3006 | http://localhost:3006 |
| Shipping Line | 3007 | http://localhost:3007 |

---

## Log Files

All logs are stored in `/home/gu-da/cbc/logs/`:

```
logs/
├── commercial-bank.log
├── custom-authorities.log
├── ecta.log
├── exporter-portal.log
├── national-bank.log
├── ecx.log
└── shipping-line.log
```

View logs:
```bash
# View all logs
./start-services.sh --logs

# View specific service
tail -f logs/commercial-bank.log

# Real-time tailing
./start-services.sh --tail
```

---

## PID File

Service PIDs are stored in `.api-pids`:

```
commercial-bank:12345
custom-authorities:12346
ecta:12347
exporter-portal:12348
national-bank:12349
ecx:12350
shipping-line:12351
```

---

## Complete Startup Workflow

### 1. Prepare Environment
```bash
# Setup production environment
./setup-production-env.sh

# Verify setup
grep 'JWT_SECRET' api/*/.env | head -1
```

### 2. Start Docker Containers
```bash
# Start PostgreSQL and IPFS
docker-compose -f docker-compose.postgres.yml up -d

# Verify containers
docker ps
```

### 3. Check Prerequisites
```bash
./start-services.sh --check
```

### 4. Start Services
```bash
./start-services.sh
```

### 5. Verify Services
```bash
# Check status
./start-services.sh --status

# Check health
./start-services.sh --health

# View logs
./start-services.sh --logs
```

### 6. Monitor Services
```bash
# Real-time logs
./start-services.sh --tail
```

---

## Stopping Services

### Stop All Services
```bash
./start-services.sh --stop
```

### Stop Docker Containers
```bash
docker-compose -f docker-compose.postgres.yml down
```

### Stop Everything
```bash
./start-services.sh --stop
docker-compose -f docker-compose.postgres.yml down
```

---

## Health Check Endpoints

Each service has a health endpoint:

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
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

## Performance Monitoring

### Check Connection Pool
```bash
# View active connections
psql -h localhost -U postgres -d coffee_export_db -c "SELECT count(*) FROM pg_stat_activity;"
```

### Monitor Service Processes
```bash
# View running services
ps aux | grep "node dist"

# View memory usage
ps aux | grep "node dist" | awk '{print $2, $6}'
```

### Check Disk Usage
```bash
# Check logs size
du -sh logs/

# Check database size
psql -h localhost -U postgres -d coffee_export_db -c "SELECT pg_size_pretty(pg_database_size('coffee_export_db'));"
```

---

## Common Issues & Solutions

### Services Won't Start
1. Check prerequisites: `./start-services.sh --check`
2. Check logs: `./start-services.sh --logs`
3. Verify Docker containers: `docker ps`
4. Check ports: `lsof -i :3001-3007`

### Database Connection Issues
1. Verify PostgreSQL container: `docker ps | grep postgres`
2. Check container IP: `docker inspect postgres`
3. Test connection: `psql -h <IP> -U postgres -d coffee_export_db -c "SELECT 1;"`
4. Check logs: `docker logs postgres`

### IPFS Connection Issues
1. Verify IPFS container: `docker ps | grep ipfs`
2. Check container IP: `docker inspect ipfs`
3. Test connection: `curl http://<IP>:5001/api/v0/id`
4. Check logs: `docker logs ipfs`

### Port Conflicts
1. Find process: `lsof -i :<PORT>`
2. Kill process: `kill -9 <PID>`
3. Verify port free: `lsof -i :<PORT>` (should return nothing)

### JWT Secret Issues
1. Run setup: `./setup-production-env.sh`
2. Verify: `grep 'JWT_SECRET' api/*/.env | head -1`
3. Restart services: `./start-services.sh --restart`

---

## Advanced Usage

### Custom Environment Variables
```bash
# Set custom JWT_SECRET
export JWT_SECRET="your-custom-secret-here"

# Set custom database host
export DB_HOST="custom-db-host"

# Start services
./start-services.sh
```

### Build and Start
```bash
# Build all services
for dir in api/*/; do (cd "$dir" && npm run build); done

# Setup environment
./setup-production-env.sh

# Start services
./start-services.sh
```

### Restart Specific Service
```bash
# Stop all
./start-services.sh --stop

# Start all
./start-services.sh
```

---

## Verification Checklist

- [ ] Docker containers running (PostgreSQL, IPFS)
- [ ] Environment setup completed
- [ ] All .env files updated with production secrets
- [ ] Compiled code exists in all service directories
- [ ] All ports (3001-3007) are available
- [ ] Services started successfully
- [ ] All services responding on their ports
- [ ] Database connections active
- [ ] IPFS node accessible
- [ ] Logs being generated
- [ ] Health checks passing

---

## Support & Documentation

- **Database Configuration:** See DATABASE_CONFIGURATION_VERIFICATION.md
- **Script Comparison:** See START_SCRIPTS_COMPARISON.md
- **Architecture Overview:** See DATABASE_ARCHITECTURE_OVERVIEW.md
- **Quick Reference:** See DATABASE_QUICK_REFERENCE.md

---

## Summary

The CBC API services are now configured and ready to start:

1. ✅ Production environment setup script created
2. ✅ All .env files configured with production secrets
3. ✅ Enhanced start-services.sh with comprehensive management
4. ✅ Docker integration for PostgreSQL and IPFS
5. ✅ Complete startup guide and troubleshooting

**Next Step:** Run `./start-services.sh` to start all services!

---

**Status:** ✅ READY FOR PRODUCTION  
**Last Updated:** 2024  
**Version:** 1.0

