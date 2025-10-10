# Inter-Communication Quick Guide

**Quick reference for testing and verifying inter-service communication**

---

## 🚀 Quick Start

### 1. Start All Services

```bash
# Terminal 1 - Exporter Bank API
cd api/exporter-bank
npm run dev

# Terminal 2 - National Bank API
cd api/national-bank
npm run dev

# Terminal 3 - NCAT API
cd api/ncat
npm run dev

# Terminal 4 - Shipping Line API
cd api/shipping-line
npm run dev
```

### 2. Run Communication Tests

```bash
# Run all tests
./scripts/test-inter-communication.sh

# Or run individual tests:
./scripts/check-health.sh           # Health checks
./scripts/test-rate-limiting.sh     # Rate limiting
node ./scripts/test-websocket.js    # WebSocket
```

---

## 📡 Communication Endpoints

### HTTP/REST Endpoints

| Service | Port | Health | Auth | Main Endpoints |
|---------|------|--------|------|----------------|
| **Exporter Bank** | 3001 | `/health` | `/api/auth/*` | `/api/exports/*` |
| **National Bank** | 3002 | `/health` | `/api/auth/*` | `/api/fx/*` |
| **NCAT** | 3003 | `/health` | `/api/auth/*` | `/api/quality/*` |
| **Shipping Line** | 3004 | `/health` | `/api/auth/*` | `/api/shipments/*` |

### WebSocket Endpoints

| Service | WebSocket URL | Purpose |
|---------|---------------|---------|
| **Exporter Bank** | `ws://localhost:3001` | Export updates |
| **National Bank** | `ws://localhost:3002` | FX notifications |
| **NCAT** | `ws://localhost:3003` | Quality notifications |
| **Shipping Line** | `ws://localhost:3004` | Shipment notifications |

---

## 🧪 Manual Testing

### Test Health Endpoints

```bash
# Test all services
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3004/health

# Expected response:
# {"status":"ok","service":"[Service Name] API","timestamp":"..."}
```

### Test WebSocket Connection

```bash
# Install wscat if needed
npm install -g wscat

# Connect to a service
wscat -c ws://localhost:3001

# Send a ping
> {"event":"ping"}

# Expected response:
# < {"timestamp":1234567890}
```

### Test Rate Limiting

```bash
# Send multiple requests quickly
for i in {1..10}; do
  curl -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"test"}'
  echo ""
done

# Expected: First 5 return 401, then 429 (rate limited)
```

---

## 🔍 Verification Checklist

### ✅ Basic Communication
- [ ] All services respond to health checks
- [ ] All services accept HTTP requests
- [ ] CORS is configured correctly
- [ ] Rate limiting is working

### ✅ WebSocket Communication
- [ ] WebSocket connections can be established
- [ ] Ping/pong works
- [ ] Events are received
- [ ] Connections close gracefully

### ✅ Blockchain Communication
- [ ] All services connect to Fabric
- [ ] Services can read from blockchain
- [ ] Services can write to blockchain
- [ ] Data is consistent across services

### ✅ Shutdown Behavior
- [ ] Services shutdown gracefully (Ctrl+C)
- [ ] WebSocket connections close properly
- [ ] Fabric connections disconnect
- [ ] No hanging processes

---

## 🐛 Troubleshooting

### Service Won't Start

```bash
# Check if port is already in use
lsof -i :3001
lsof -i :3002
lsof -i :3003
lsof -i :3004

# Kill process if needed
kill -9 <PID>
```

### WebSocket Connection Fails

**Check CORS configuration:**
```bash
# In .env file
CORS_ORIGIN=http://localhost:5173
```

**Check WebSocket initialization:**
```bash
# Look for this in logs:
# "🔌 WebSocket service initialized"
```

### Rate Limiting Not Working

**Verify dependency:**
```bash
cd api/[service]
npm list express-rate-limit
```

**Check configuration:**
```typescript
// Should see in index.ts:
const authLimiter = rateLimit({ ... });
const apiLimiter = rateLimit({ ... });
```

### Fabric Connection Fails

**Check network path:**
```bash
# In .env file
FABRIC_NETWORK_PATH=../../network

# Verify path exists
ls -la ../../network/organizations
```

**Check Fabric network:**
```bash
cd network
./network.sh status
```

---

## 📊 Communication Flow

### Complete Export Workflow

```
1. CREATE EXPORT (Exporter Bank)
   POST /api/exports
   → Fabric: CreateExportRequest
   → WebSocket: export:created
   → Status: PENDING

2. APPROVE FX (National Bank)
   POST /api/fx/approve
   → Fabric: ApproveFX
   → WebSocket: fx:approved
   → Status: FX_APPROVED

3. CERTIFY QUALITY (NCAT)
   POST /api/quality/certify
   → Fabric: IssueQualityCertificate
   → WebSocket: quality:certified
   → Status: QUALITY_CERTIFIED

4. SCHEDULE SHIPMENT (Shipping Line)
   POST /api/shipments/schedule
   → Fabric: ScheduleShipment
   → WebSocket: shipment:scheduled
   → Status: SHIPMENT_SCHEDULED

5. CONFIRM SHIPMENT (Shipping Line)
   POST /api/shipments/confirm
   → Fabric: ConfirmShipment
   → WebSocket: shipment:confirmed
   → Status: SHIPPED

6. COMPLETE EXPORT (Exporter Bank)
   PUT /api/exports/:id/complete
   → Fabric: CompleteExport
   → WebSocket: export:completed
   → Status: COMPLETED
```

---

## 🔧 Configuration Quick Reference

### Environment Variables

**Required for all services:**
```bash
PORT=300X
NODE_ENV=development
JWT_SECRET=your-secret-here
CHANNEL_NAME=coffeechannel
CHAINCODE_NAME=coffee-export
FABRIC_NETWORK_PATH=../../network
```

**Optional but recommended:**
```bash
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173
IPFS_HOST=localhost
IPFS_PORT=5001
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

### Port Assignments

| Service | HTTP | WebSocket | Purpose |
|---------|------|-----------|---------|
| Exporter Bank | 3001 | 3001 | Export management |
| National Bank | 3002 | 3002 | FX approval |
| NCAT | 3003 | 3003 | Quality certification |
| Shipping Line | 3004 | 3004 | Shipment management |
| Frontend | 5173 | - | User interface |

---

## 📈 Monitoring

### Check Service Status

```bash
# Quick status check
./scripts/check-health.sh

# Detailed check with all tests
./scripts/test-inter-communication.sh
```

### View Logs

```bash
# Service logs show:
# - Startup messages
# - Fabric connection status
# - WebSocket initialization
# - Incoming requests
# - Errors and warnings

# Look for these indicators:
# ✅ "Connected to Hyperledger Fabric network"
# ✅ "WebSocket service initialized"
# ✅ "server running on port X"
```

### Monitor WebSocket Connections

```bash
# In service logs, look for:
# "Client connected: [socket-id] (User: [username])"
# "User [username] subscribed to export: [export-id]"
# "Emitted update for export: [export-id]"
```

---

## 🎯 Performance Expectations

### Response Times
- Health checks: < 50ms
- API requests: < 500ms
- Blockchain writes: 1-3 seconds
- WebSocket events: < 100ms

### Rate Limits
- Auth endpoints: 5 requests / 15 minutes
- API endpoints: 100 requests / 15 minutes

### Concurrent Connections
- Each service supports multiple WebSocket connections
- No hard limit on concurrent HTTP requests
- Fabric handles concurrent transactions

---

## 📚 Additional Resources

- **Full Documentation:** `INTER_COMMUNICATION_CHECK.md`
- **Fixes Applied:** `FIXES_APPLIED.md`
- **Review Report:** `CODEBASE_REVIEW_REPORT.md`
- **Architecture:** `ARCHITECTURE.md`

---

## 🆘 Getting Help

### Common Issues

1. **"Connection refused"**
   - Service not running
   - Wrong port number
   - Firewall blocking

2. **"Too many requests"**
   - Rate limit hit (expected behavior)
   - Wait 15 minutes or restart service

3. **"Fabric connection failed"**
   - Network not running
   - Wrong network path
   - Missing credentials

4. **"WebSocket authentication error"**
   - Missing JWT token
   - Invalid token
   - Token expired

### Debug Mode

```bash
# Run with debug logging
DEBUG=* npm run dev

# Or set in .env
NODE_ENV=development
LOG_LEVEL=debug
```

---

**Quick Reference Version 1.0**
**Last Updated:** 2024
