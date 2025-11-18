# 🚀 Starting Services - Quick Guide

## Prerequisites

Before starting the services, ensure you have:
- ✅ Docker running
- ✅ Redis installed (`redis-server` command available)
- ✅ Node.js and npm installed
- ✅ All dependencies installed (`npm install` in `/api`)

---

## Option 1: Start Everything (Recommended)

### Using the Main Startup Script

```bash
# From project root
./start-system.sh
```

This script will:
1. ✅ Check prerequisites
2. ✅ Start Redis server automatically
3. ✅ Start blockchain network
4. ✅ Deploy chaincodes
5. ✅ Start all 5 API services
6. ✅ Start frontend

---

## Option 2: Start Services Individually

### 1. Start Redis (Required First!)

```bash
# Start Redis in daemon mode
redis-server --daemonize yes

# Or using npm script
cd api
npm run redis:start

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

### 2. Start Blockchain Network

```bash
cd network
./network.sh up createChannel
./network.sh deployCC -ccn coffee-export -ccp ../chaincode/coffee-export -ccl golang
./network.sh deployCC -ccn user-management -ccp ../chaincode/user-management -ccl golang
```

### 3. Start API Services

```bash
# Using the API startup script (includes Redis check)
./scripts/start-apis.sh

# Or start each service individually
cd api/commercialbank && npm run dev     # Port 3001
cd api/national-bank && npm run dev     # Port 3002
cd api/ncat && npm run dev              # Port 3003
cd api/shipping-line && npm run dev     # Port 3004
cd api/custom-authorities && npm run dev # Port 3005
```

### 4. Start Frontend (Optional)

```bash
cd frontend
npm run dev  # Port 5173
```

---

## Option 3: Using NPM Scripts

### Start Redis + All APIs

```bash
cd api

# Start Redis (automatically runs before start:all)
npm run start:all

# Or manually
npm run redis:start
npm run dev:all
```

### Check Redis Status

```bash
cd api
npm run redis:status
# Should return: PONG
```

### Stop Redis

```bash
cd api
npm run redis:stop
```

---

## Service URLs

Once everything is running:

| Service | URL | Purpose |
|---------|-----|---------|
| **Redis** | `localhost:6379` | Caching layer |
| **commercialbank API** | http://localhost:3001 | Export management |
| **National Bank API** | http://localhost:3002 | FX approvals |
| **ECTA API** | http://localhost:3003 | Quality certification |
| **Shipping Line API** | http://localhost:3004 | Shipment management |
| **Custom Authorities API** | http://localhost:3005 | Customs clearance |
| **Frontend** | http://localhost:5173 | User interface |

---

## Verification

### Check All Services

```bash
# Check Redis
redis-cli ping

# Check APIs
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3004/health
curl http://localhost:3005/health

# Check blockchain
docker ps | grep hyperledger
```

### Check Logs

```bash
# API logs
tail -f logs/commercialbank.log
tail -f logs/national-bank.log
tail -f logs/ncat.log
tail -f logs/shipping-line.log
tail -f logs/custom-authorities.log

# Redis logs
redis-cli INFO
```

---

## Troubleshooting

### Redis Not Starting

```bash
# Check if Redis is installed
redis-server --version

# Install Redis (Ubuntu/Debian)
sudo apt-get install redis-server

# Install Redis (macOS)
brew install redis

# Start Redis manually
redis-server
```

### Port Already in Use

```bash
# Check what's using the port
lsof -i :6379  # Redis
lsof -i :3001  # commercialbank
lsof -i :3002  # National Bank

# Kill process on port
kill -9 $(lsof -t -i:6379)
```

### Cache Not Working

```bash
# Check Redis connection
redis-cli ping

# Check Redis keys
redis-cli KEYS '*'

# Clear all cache
redis-cli FLUSHALL

# Restart Redis
redis-cli shutdown
redis-server --daemonize yes
```

### API Can't Connect to Redis

Check your `.env` files have:
```env
REDIS_URL=redis://localhost:6379
# REDIS_PASSWORD=  # If you set a password
```

---

## Stopping Services

### Stop Everything

```bash
# Stop APIs
pkill -f "ts-node-dev"
pkill -f "npm run dev"

# Stop Redis
redis-cli shutdown
# Or using npm
cd api && npm run redis:stop

# Stop blockchain
cd network
./network.sh down
```

### Stop Individual Services

```bash
# Stop specific API
kill $(cat logs/commercialbank.pid)
kill $(cat logs/national-bank.pid)

# Stop Redis
redis-cli shutdown

# Stop frontend
# Press Ctrl+C in the terminal running it
```

---

## Quick Commands Reference

```bash
# Start Redis
redis-server --daemonize yes

# Check Redis
redis-cli ping

# Stop Redis
redis-cli shutdown

# View Redis stats
redis-cli INFO stats

# Monitor Redis commands
redis-cli MONITOR

# Clear cache
redis-cli FLUSHALL

# Check cache size
redis-cli DBSIZE
```

---

## Performance Tips

### Redis Configuration

For production, configure Redis in `/etc/redis/redis.conf`:

```conf
# Maximum memory
maxmemory 256mb

# Eviction policy (remove least recently used keys)
maxmemory-policy allkeys-lru

# Save to disk
save 900 1
save 300 10
save 60 10000

# Enable AOF for durability
appendonly yes
```

### Cache Monitoring

```bash
# Watch cache hit rate
redis-cli INFO stats | grep keyspace

# Monitor slow queries
redis-cli SLOWLOG GET 10
```

---

## Development Workflow

### Typical Startup Sequence

```bash
# 1. Start Redis (once per session)
redis-server --daemonize yes

# 2. Start blockchain (if not running)
cd network && ./network.sh up createChannel

# 3. Start APIs
./scripts/start-apis.sh

# 4. Start frontend (optional)
cd frontend && npm run dev

# 5. Verify everything
redis-cli ping
curl http://localhost:3001/health
```

### Hot Reload

All services use `ts-node-dev` for hot reload:
- Edit any `.ts` file
- Service automatically restarts
- No need to manually restart

---

## Next Steps

Once all services are running:

1. **Test the APIs** - See `BEST_PRACTICES_QUICK_START.md`
2. **Run tests** - `cd api && npm test`
3. **Check documentation** - See `FINAL_SUMMARY.md`
4. **Monitor performance** - Check Redis stats and logs

---

**Generated:** October 30, 2025  
**Status:** ✅ COMPLETE  
**Redis Integration:** ✅ READY
