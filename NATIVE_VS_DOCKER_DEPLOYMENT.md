# 🔧 Native vs Docker Deployment - Configuration Fix

## Problem

API services were running natively (not in Docker) but trying to connect to Docker containers using container names:

```
Error: getaddrinfo ENOTFOUND postgres
```

This failed because native Node.js processes can't resolve Docker container names.

## Solution

Changed `.env` files to use `localhost` instead of container names:

### Before (Docker Deployment)
```
DB_HOST=postgres          # ❌ Container name (only works in Docker)
REDIS_HOST=redis          # ❌ Container name (only works in Docker)
IPFS_HOST=ipfs            # ❌ Container name (only works in Docker)
```

### After (Native Deployment)
```
DB_HOST=localhost         # ✅ Works for native services
REDIS_HOST=localhost      # ✅ Works for native services
IPFS_HOST=localhost       # ✅ Works for native services
```

## Why This Works

### Docker Containers (Exposed to Host)
```
┌─────────────────────────────────────────┐
│         Docker Containers               │
│                                         │
│  postgres:5432 ──────┐                 │
│  redis:6379 ─────────┼─ Exposed to     │
│  ipfs:5001 ──────────┤ Host Machine    │
│                      │ via localhost   │
└──────────────────────┼─────────────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │  Native Node.js      │
            │  Services            │
            │  (3001-3007)         │
            │                      │
            │  Connect via:        │
            │  localhost:5432      │
            │  localhost:6379      │
            │  localhost:5001      │
            └──────────────────────┘
```

### Port Mapping
```
Docker Container    →    Host Machine
postgres:5432      →    localhost:5432
redis:6379         →    localhost:6379
ipfs:5001          →    localhost:5001
```

## Deployment Modes

### Mode 1: Native Services + Docker Infrastructure (Current)
```
✅ Infrastructure (PostgreSQL, Redis, IPFS) runs in Docker
✅ API Services run natively on host machine
✅ Configuration: DB_HOST=localhost
```

**Pros:**
- Easy debugging
- Direct access to logs
- Fast development

**Cons:**
- Services not isolated
- Port conflicts possible

### Mode 2: Full Docker Deployment (Alternative)
```
✅ Infrastructure runs in Docker
✅ API Services run in Docker
✅ Configuration: DB_HOST=postgres
```

**Pros:**
- Full isolation
- Easy deployment
- Consistent environment

**Cons:**
- More complex setup
- Requires Docker knowledge

## Current Configuration

All services are now configured for **Mode 1: Native Services + Docker Infrastructure**

```
✅ commercial-bank: DB_HOST=localhost REDIS_HOST=localhost IPFS_HOST=localhost
✅ custom-authorities: DB_HOST=localhost REDIS_HOST=localhost IPFS_HOST=localhost
✅ ecta: DB_HOST=localhost REDIS_HOST=localhost IPFS_HOST=localhost
✅ exporter-portal: DB_HOST=localhost REDIS_HOST=localhost IPFS_HOST=localhost
✅ national-bank: DB_HOST=localhost REDIS_HOST=localhost IPFS_HOST=localhost
✅ ecx: DB_HOST=localhost REDIS_HOST=localhost IPFS_HOST=localhost
✅ shipping-line: DB_HOST=localhost REDIS_HOST=localhost IPFS_HOST=localhost
```

## Verification

### Check Docker Containers
```bash
docker ps | grep -E "postgres|redis|ipfs"
```

Expected output:
```
postgres:15-alpine    0.0.0.0:5432->5432/tcp
redis:7-alpine        0.0.0.0:6379->6379/tcp
ipfs/kubo:latest      0.0.0.0:4001->4001/tcp, 127.0.0.1:5001->5001/tcp
```

### Test Connections
```bash
# Test PostgreSQL
PGPASSWORD=postgres psql -h localhost -U postgres -d coffee_export_db -c "SELECT 1"

# Test Redis
redis-cli -h localhost ping

# Test IPFS
curl http://localhost:5001/api/v0/id
```

## Next Steps

1. **Stop running services**
   ```bash
   ./stop-all.sh --force
   ```

2. **Kill any remaining processes**
   ```bash
   pkill -9 -f "node"
   pkill -9 -f "npm"
   ```

3. **Start the system**
   ```bash
   ./start-all.sh
   ```

4. **Verify services are healthy**
   ```bash
   ./verify-system.sh
   ```

## Expected Output

After restart, you should see:

```
✓ commercial-bank is healthy (DB: connected)
✓ custom-authorities is healthy (DB: connected)
✓ ecta is healthy (DB: connected)
✓ exporter-portal is healthy (DB: connected)
✓ national-bank is healthy (DB: connected)
✓ ecx is healthy (DB: connected)
✓ shipping-line is healthy (DB: connected)
```

## Troubleshooting

### Still Getting Connection Errors?

1. **Verify Docker containers are running**
   ```bash
   docker ps
   ```

2. **Check if ports are accessible**
   ```bash
   netstat -tuln | grep -E "5432|6379|5001"
   ```

3. **Test direct connection**
   ```bash
   telnet localhost 5432
   telnet localhost 6379
   telnet localhost 5001
   ```

4. **Check service logs**
   ```bash
   ./start-all-apis.sh --logs
   ```

### Services Still Won't Connect?

1. **Restart Docker containers**
   ```bash
   ./start-infrastructure.sh --restart
   ```

2. **Verify environment files**
   ```bash
   grep "DB_HOST\|REDIS_HOST\|IPFS_HOST" api/*/env
   ```

3. **Check for firewall issues**
   ```bash
   sudo ufw status
   ```

## Summary

✅ **Fixed:** Native services can now connect to Docker containers
✅ **Configuration:** All `.env` files use `localhost`
✅ **Verified:** Docker containers are exposed to host machine
✅ **Ready:** System is ready to start

---

**Status:** ✅ READY TO START
**Deployment Mode:** Native Services + Docker Infrastructure
**Date:** 2025-12-17
**Version:** 1.0.0
