# Inter-Service Communication Guide

Complete guide for testing and verifying communication between all services in the Coffee Blockchain Consortium.

---

## Overview

The system consists of 4 API services that communicate through:
1. **Hyperledger Fabric Blockchain** - Primary data layer
2. **REST APIs** - Service-to-service HTTP communication
3. **WebSocket** - Real-time event notifications
4. **IPFS** - Distributed file storage

---

## Service Architecture

### Services and Ports

| Service | Port | Organization | MSP ID |
|---------|------|--------------|--------|
| Exporter Bank API | 3001 | ExporterBank | ExporterBankMSP |
| National Bank API | 3002 | NationalBank | NationalBankMSP |
| NCAT API | 3003 | NCAT | NCATMSP |
| Shipping Line API | 3004 | ShippingLine | ShippingLineMSP |
| Frontend | 5173 | - | - |

### Blockchain Network

| Component | Port | Description |
|-----------|------|-------------|
| Orderer | 7050 | Ordering service |
| Peer0 ExporterBank | 7051 | ExporterBank peer |
| Peer0 NationalBank | 8051 | NationalBank peer |
| Peer0 NCAT | 9051 | NCAT peer |
| Peer0 ShippingLine | 10051 | ShippingLine peer |

### Supporting Services

| Service | Port | Description |
|---------|------|-------------|
| IPFS API | 5001 | IPFS daemon API |
| IPFS Gateway | 8080 | IPFS HTTP gateway |

---

## Quick Test

Run the comprehensive test suite:

```bash
./scripts/test-inter-communication.sh
```

This script tests:
- ✅ Health checks for all services
- ✅ Rate limiting functionality
- ✅ WebSocket connections
- ✅ Blockchain connectivity
- ✅ IPFS integration

---

## Manual Testing

### 1. Health Check Tests

Test each service individually:

```bash
# Exporter Bank
curl http://localhost:3001/health

# National Bank
curl http://localhost:3002/health

# NCAT
curl http://localhost:3003/health

# Shipping Line
curl http://localhost:3004/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "exporter-bank-api",
  "version": "1.0.0"
}
```

Or use the health check script:
```bash
./scripts/check-health.sh
```

### 2. Rate Limiting Tests

Test rate limiting on each service:

```bash
# Test Exporter Bank (should allow 100 requests, then block)
for i in {1..105}; do
  curl -s http://localhost:3001/health
done
```

Or use the rate limiting test script:
```bash
./scripts/test-rate-limiting.sh
```

Expected behavior:
- First 100 requests: HTTP 200 OK
- Requests 101+: HTTP 429 Too Many Requests

### 3. Authentication Flow

Test user registration and login:

```bash
# Register a user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "SecurePass123!@#",
    "email": "test@example.com",
    "role": "exporter"
  }'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "SecurePass123!@#"
  }'
```

Or use the authentication test script:
```bash
./test-authentication.sh
```

### 4. Blockchain Communication

Test blockchain read/write operations:

```bash
# Get JWT token first
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"SecurePass123!@#"}' \
  | jq -r '.token')

# Query blockchain
curl -X GET http://localhost:3001/api/coffee/exports \
  -H "Authorization: Bearer $TOKEN"

# Create export record
curl -X POST http://localhost:3001/api/coffee/exports \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "exportId": "EXP001",
    "quantity": 1000,
    "origin": "Ethiopia",
    "destination": "USA"
  }'
```

### 5. Cross-Organization Communication

Test that organizations can read each other's data:

```bash
# Create export as Exporter Bank
EXPORTER_TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"exporter1","password":"SecurePass123!@#"}' \
  | jq -r '.token')

curl -X POST http://localhost:3001/api/coffee/exports \
  -H "Authorization: Bearer $EXPORTER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"exportId":"EXP001","quantity":1000}'

# Read as National Bank
BANK_TOKEN=$(curl -s -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"banker1","password":"SecurePass123!@#"}' \
  | jq -r '.token')

curl -X GET http://localhost:3002/api/coffee/exports/EXP001 \
  -H "Authorization: Bearer $BANK_TOKEN"
```

### 6. WebSocket Communication

Test real-time updates:

```bash
# Use the WebSocket test script
node ./scripts/test-websocket.js
```

Or manually with a WebSocket client:
```javascript
const io = require('socket.io-client');
const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log('Connected to WebSocket');
});

socket.on('export-created', (data) => {
  console.log('New export created:', data);
});

socket.on('export-updated', (data) => {
  console.log('Export updated:', data);
});
```

### 7. IPFS Integration

Test document upload and retrieval:

```bash
# Upload document
curl -X POST http://localhost:3001/api/documents/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/document.pdf" \
  -F "exportId=EXP001"

# Response includes IPFS hash
# {
#   "success": true,
#   "ipfsHash": "QmXxx...",
#   "url": "http://localhost:8080/ipfs/QmXxx..."
# }

# Retrieve document
curl http://localhost:8080/ipfs/QmXxx...
```

---

## Communication Patterns

### 1. Blockchain-Based Communication

All services write to and read from the shared blockchain ledger:

```
┌─────────────────┐
│ Exporter Bank   │──┐
└─────────────────┘  │
                     │
┌─────────────────┐  │    ┌──────────────────┐
│ National Bank   │──┼───▶│  Blockchain      │
└─────────────────┘  │    │  (Shared Ledger) │
                     │    └──────────────────┘
┌─────────────────┐  │
│ NCAT            │──┤
└─────────────────┘  │
                     │
┌─────────────────┐  │
│ Shipping Line   │──┘
└─────────────────┘
```

### 2. Event-Driven Communication

Services emit events that others can subscribe to:

```
Service A                    Service B
   │                            │
   │──── Emit Event ────────────▶│
   │     (via WebSocket)         │
   │                             │
   │◀─── Acknowledge ────────────│
```

### 3. REST API Communication

Direct HTTP calls between services (when needed):

```
Service A                    Service B
   │                            │
   │──── HTTP Request ──────────▶│
   │     GET /api/resource       │
   │                             │
   │◀─── HTTP Response ──────────│
   │     200 OK + Data           │
```

---

## Troubleshooting

### Services Not Communicating

1. **Check if all services are running:**
   ```bash
   ./scripts/check-health.sh
   ```

2. **Check blockchain network:**
   ```bash
   docker ps | grep hyperledger
   ```

3. **Check logs:**
   ```bash
   tail -f logs/exporter-bank.log
   tail -f logs/national-bank.log
   tail -f logs/ncat.log
   tail -f logs/shipping-line.log
   ```

4. **Verify network connectivity:**
   ```bash
   # From inside a container
   docker exec -it peer0.exporterbank.coffee-export.com ping peer0.nationalbank.coffee-export.com
   ```

### Rate Limiting Issues

If you're being rate limited:

1. **Wait 15 minutes** for the rate limit window to reset
2. **Check rate limit configuration** in `.env` files:
   ```
   RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
   RATE_LIMIT_MAX_REQUESTS=100
   ```
3. **Increase limits** for testing (not recommended for production)

### Authentication Failures

1. **Verify user exists:**
   ```bash
   # Check wallet directory
   ls -la api/exporter-bank/wallet/
   ```

2. **Re-register user:**
   ```bash
   ./scripts/register-test-users.sh
   ```

3. **Check JWT secret** is consistent across services

### Blockchain Connection Issues

1. **Verify connection profiles exist:**
   ```bash
   ls -la network/organizations/peerOrganizations/*/connection-*.json
   ```

2. **Check peer is reachable:**
   ```bash
   curl http://localhost:7051
   ```

3. **Verify chaincode is installed:**
   ```bash
   docker exec peer0.exporterbank.coffee-export.com peer lifecycle chaincode queryinstalled
   ```

### IPFS Issues

1. **Check IPFS daemon is running:**
   ```bash
   curl http://localhost:5001/api/v0/version
   ```

2. **Restart IPFS:**
   ```bash
   ipfs daemon &
   ```

3. **Check IPFS configuration** in `.env` files

---

## Performance Monitoring

### Response Time Benchmarks

Expected response times (95th percentile):

| Operation | Expected Time |
|-----------|---------------|
| Health check | < 50ms |
| User login | < 200ms |
| Blockchain query | < 500ms |
| Blockchain write | < 2s |
| Document upload | < 5s |
| WebSocket message | < 100ms |

### Load Testing

Test system under load:

```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Test health endpoint
ab -n 1000 -c 10 http://localhost:3001/health

# Test with authentication
ab -n 100 -c 5 -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/coffee/exports
```

---

## Security Considerations

### Network Security

1. **All services use HTTPS in production**
2. **JWT tokens expire after 24 hours**
3. **Rate limiting prevents abuse**
4. **Input validation on all endpoints**
5. **CORS configured for allowed origins only**

### Blockchain Security

1. **Private channels** for sensitive data
2. **Access control** via MSP identities
3. **Endorsement policies** require multiple organizations
4. **Immutable audit trail** of all transactions

### API Security

1. **Helmet.js** security headers
2. **bcrypt** password hashing
3. **Input sanitization** prevents injection attacks
4. **File upload validation** (type, size)
5. **Environment variable validation**

---

## Best Practices

### For Developers

1. **Always use health checks** before making requests
2. **Implement retry logic** for blockchain operations
3. **Handle rate limiting** gracefully (exponential backoff)
4. **Validate all inputs** before sending to blockchain
5. **Use WebSocket** for real-time updates instead of polling
6. **Cache frequently accessed data** (with appropriate TTL)
7. **Log all errors** with context for debugging

### For Operations

1. **Monitor health endpoints** continuously
2. **Set up alerts** for service failures
3. **Rotate logs** to prevent disk space issues
4. **Backup wallets** regularly
5. **Monitor blockchain** for consensus issues
6. **Scale services** based on load
7. **Keep dependencies updated** for security patches

---

## Quick Reference Commands

```bash
# Start all services
./scripts/dev-apis.sh

# Stop all services
./scripts/stop-apis.sh

# Check health
./scripts/check-health.sh

# Test communication
./scripts/test-inter-communication.sh

# Register test users
./scripts/register-test-users.sh

# View logs
tail -f logs/*.log

# Check blockchain
docker ps | grep hyperledger

# Check IPFS
curl http://localhost:5001/api/v0/version
```

---

## Status Summary

### ✅ Working Features

- [x] All services start successfully
- [x] Health checks respond correctly
- [x] Rate limiting enforced
- [x] Authentication flow complete
- [x] Blockchain read/write operations
- [x] Cross-organization data access
- [x] WebSocket real-time updates
- [x] IPFS document storage
- [x] Input validation and sanitization
- [x] Security headers and CORS

### 🔄 In Progress

- [ ] Advanced analytics dashboard
- [ ] Mobile application
- [ ] Enhanced reporting

### 📋 Planned

- [ ] Multi-channel support
- [ ] GraphQL API
- [ ] Service mesh implementation

---

## Support

For issues or questions:
1. Check the logs in `logs/` directory
2. Review the troubleshooting section above
3. Consult the main README.md
4. Check DOCUMENTATION_INDEX.md for related guides

---

**Last Updated:** Consolidation Phase  
**Status:** All inter-service communication verified and working
