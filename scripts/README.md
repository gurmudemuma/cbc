# CBC Scripts

Utility scripts for managing CBC services.

## Available Scripts

### start-all.sh
Starts all services (infrastructure, APIs, and frontend).

```bash
./scripts/start-all.sh
```

**Options:**
- `--no-frontend` - Skip frontend startup

**What it does:**
1. Starts PostgreSQL, Redis, IPFS
2. Waits for PostgreSQL to be ready
3. Starts all 7 API services
4. Starts frontend (optional)

### stop-all.sh
Stops all running services.

```bash
./scripts/stop-all.sh
```

**What it does:**
1. Stops all API services
2. Stops infrastructure
3. Kills frontend process

### verify-all.sh
Verifies all services are running and healthy.

```bash
./scripts/verify-all.sh
```

**Checks:**
- Docker installation
- PostgreSQL connectivity
- Redis connectivity
- IPFS status
- All 7 API services health
- Database connection pool

**Exit codes:**
- `0` - All services verified
- `1` - One or more services failed

## Quick Reference

```bash
# Start everything
./scripts/start-all.sh

# Stop everything
./scripts/stop-all.sh

# Verify setup
./scripts/verify-all.sh

# View logs
docker-compose -f docker-compose.postgres.yml logs -f
docker-compose -f docker-compose.apis.yml logs -f

# Check status
docker ps
```

## Manual Commands

### Start Infrastructure Only
```bash
docker-compose -f docker-compose.postgres.yml up -d
```

### Start APIs Only
```bash
docker-compose -f docker-compose.apis.yml up -d
```

### Stop Infrastructure Only
```bash
docker-compose -f docker-compose.postgres.yml down
```

### Stop APIs Only
```bash
docker-compose -f docker-compose.apis.yml down
```

### View Service Logs
```bash
# Infrastructure logs
docker-compose -f docker-compose.postgres.yml logs -f

# API logs
docker-compose -f docker-compose.apis.yml logs -f

# Specific service
docker logs -f cbc-commercial-bank
```

### Restart a Service
```bash
docker-compose -f docker-compose.apis.yml restart cbc-commercial-bank
```

### Check Service Status
```bash
docker ps
docker ps -a  # Include stopped containers
```

## Troubleshooting

### Port Already in Use
```bash
./scripts/stop-all.sh
# Wait a few seconds
./scripts/start-all.sh
```

### Services Not Starting
```bash
# Check logs
docker-compose -f docker-compose.postgres.yml logs
docker-compose -f docker-compose.apis.yml logs

# Verify setup
./scripts/verify-all.sh
```

### Database Connection Issues
```bash
# Test PostgreSQL
docker exec postgres pg_isready -U postgres

# Test Redis
docker exec redis redis-cli ping

# Check connection pool
curl http://localhost:3001/health | jq .
```

---

**See Also:**
- [Quick Start Guide](../docs/QUICK_START.md)
- [Troubleshooting Guide](../docs/TROUBLESHOOTING.md)
