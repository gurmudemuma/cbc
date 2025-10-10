# API Services Status

## ✅ All Services Running Successfully

### Services Overview

| Service | Port | Status | Health Endpoint |
|---------|------|--------|-----------------|
| Exporter Bank API | 3001 | ✅ Running | http://localhost:3001/health |
| National Bank API | 3002 | ✅ Running | http://localhost:3002/health |
| NCAT API | 3003 | ✅ Running | http://localhost:3003/health |
| Shipping Line API | 3004 | ✅ Running | http://localhost:3004/health |

## Fixes Applied

### 1. Express Validator Dependency Issue
**Problem:** The shared modules (`/api/shared/`) were importing `express-validator`, but it wasn't installed at the parent api level.

**Solution:** 
- Added `express-validator` and `nodemailer` to `/home/gu-da/CBC/api/package.json`
- Ran `npm install` in the api directory

### 2. Environment Variables Loading Order
**Problem:** `dotenv.config()` was being called after importing route modules, causing JWT_SECRET to be undefined when controllers were instantiated.

**Solution:** 
- Moved `dotenv.config()` to the very first line in all API index.ts files:
  - `/api/exporter-bank/src/index.ts`
  - `/api/national-bank/src/index.ts`
  - `/api/ncat/src/index.ts`
  - `/api/shipping-line/src/index.ts`

## Management Scripts

### Start All APIs
```bash
./start-all-apis.sh
```

This script:
- Starts all four API services in the background
- Creates log files in the `logs/` directory
- Checks health status after startup
- Handles port conflicts automatically

### Stop All APIs
```bash
./stop-all-apis.sh
```

This script:
- Gracefully stops all running API services
- Cleans up PID files
- Ensures ports are freed

### View Logs
```bash
# View all logs in real-time
tail -f logs/*.log

# View specific service log
tail -f logs/exporter-bank.log
tail -f logs/national-bank.log
tail -f logs/ncat.log
tail -f logs/shipping-line.log
```

## Testing the APIs

### Health Check All Services
```bash
for port in 3001 3002 3003 3004; do
  echo "Port $port:"
  curl -s http://localhost:$port/health | jq .
done
```

### Individual Service Tests
```bash
# Exporter Bank API
curl http://localhost:3001/health

# National Bank API
curl http://localhost:3002/health

# NCAT API
curl http://localhost:3003/health

# Shipping Line API
curl http://localhost:3004/health
```

## Architecture

```
Coffee Blockchain Consortium
├── Hyperledger Fabric Network (Running)
│   ├── Orderer: localhost:7050
│   ├── Peer0 (Exporter Bank): localhost:7051
│   └── Chaincodes: coffee-export, user-management
│
├── API Services (All Running)
│   ├── Exporter Bank API: localhost:3001
│   ├── National Bank API: localhost:3002
│   ├── NCAT API: localhost:3003
│   └── Shipping Line API: localhost:3004
│
└── Shared Modules
    ├── password.validator.ts
    ├── security.config.ts
    ├── email.service.ts
    ├── input.sanitizer.ts
    └── websocket.service.ts
```

## Notes

- All services are running in development mode with hot-reload enabled
- Fabric network connection warnings during startup are normal and don't affect functionality
- Each service has its own wallet for Fabric authentication
- WebSocket services are initialized for real-time updates
- Rate limiting is configured for authentication and API endpoints

## Next Steps

1. **Start Frontend** (if needed):
   ```bash
   cd frontend/exporter-portal && npm run dev
   ```

2. **Test Authentication**:
   - Register users through each API
   - Test login functionality
   - Verify JWT token generation

3. **Test Blockchain Integration**:
   - Create export records
   - Query blockchain data
   - Test inter-service communication

## Troubleshooting

### Service Won't Start
1. Check if port is already in use: `lsof -i :PORT`
2. View service logs: `tail -f logs/SERVICE_NAME.log`
3. Verify .env file exists and has JWT_SECRET set

### Fabric Connection Issues
- Ensure Fabric network is running: `docker ps | grep hyperledger`
- Check connection profile exists in network/organizations/
- Verify admin wallet is enrolled

### Module Not Found Errors
- Run `npm install` in the specific api directory
- Check if shared dependencies are installed at `/api` level
