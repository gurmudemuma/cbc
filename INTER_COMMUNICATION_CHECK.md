# Coffee Export Consortium - Inter-Communication Check

**Date:** 2024
**Purpose:** Verify all inter-service communication paths and integration points

---

## 🔍 COMMUNICATION ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│                    (Port 5173/3000)                             │
│  - React/Vue Application                                        │
│  - WebSocket Client                                             │
│  - HTTP REST Client                                             │
└────────┬────────────────────────────────────────────────────────┘
         │
         │ HTTP/REST + WebSocket
         │
    ┌────┴──────────────────────��──────────────────────────────┐
    │                                                            │
    ▼                  ▼                  ▼                     ▼
┌─────────┐      ┌─────────┐      ┌─────────┐      ┌──────────────┐
│Exporter │      │National │      │  NCAT   │      │  Shipping    │
│  Bank   │      │  Bank   │      │   API   │      │   Line API   │
│  API    │      │   API   │      │         │      │              │
│:3001    │      │  :3002  │      │  :3003  │      │    :3004     │
└────┬────┘      └────┬────┘      └────┬────┘      └──────┬───────┘
     │                │                 │                   │
     │                │                 │                   │
     └────────────────┴─────────────────┴───────────────────┘
                              │
                              │ Fabric SDK
                              ▼
                    ┌──────────────────┐
                    │  Hyperledger     │
                    │  Fabric Network  │
                    │  - coffeechannel │
                    │  - coffee-export │
                    │  - user-mgmt     │
                    └──────────────────┘
```

---

## ✅ COMMUNICATION PATHS TO VERIFY

### 1. Frontend → API Services (HTTP/REST)

**Endpoints to Check:**

#### Exporter Bank API (Port 3001)
- `GET /health` - Health check
- `POST /api/auth/login` - Authentication
- `POST /api/auth/register` - Registration
- `POST /api/exports` - Create export
- `GET /api/exports` - List exports
- `GET /api/exports/:id` - Get export details
- `PUT /api/exports/:id/complete` - Complete export
- `PUT /api/exports/:id/cancel` - Cancel export

#### National Bank API (Port 3002)
- `GET /health` - Health check
- `POST /api/auth/login` - Authentication
- `GET /api/fx/pending` - Get pending FX approvals
- `GET /api/fx/exports` - List all exports
- `GET /api/fx/exports/:id` - Get export details
- `POST /api/fx/approve` - Approve FX
- `POST /api/fx/reject` - Reject FX

#### NCAT API (Port 3003)
- `GET /health` - Health check
- `POST /api/auth/login` - Authentication
- `GET /api/quality/pending` - Get pending quality certifications
- `GET /api/quality/exports` - List all exports
- `GET /api/quality/exports/:id` - Get export details
- `POST /api/quality/certify` - Issue quality certificate
- `POST /api/quality/reject` - Reject quality

#### Shipping Line API (Port 3004)
- `GET /health` - Health check
- `POST /api/auth/login` - Authentication
- `GET /api/shipments/ready` - Get exports ready for shipment
- `GET /api/shipments/exports` - List all exports
- `GET /api/shipments/exports/:id` - Get export details
- `POST /api/shipments/schedule` - Schedule shipment
- `POST /api/shipments/confirm` - Confirm shipment

---

### 2. Frontend → API Services (WebSocket)

**WebSocket Connections:**

Each API now provides WebSocket endpoint on the same port as HTTP:
- `ws://localhost:3001` - Exporter Bank WebSocket
- `ws://localhost:3002` - National Bank WebSocket
- `ws://localhost:3003` - NCAT WebSocket
- `ws://localhost:3004` - Shipping Line WebSocket

**WebSocket Events (Client → Server):**
- `subscribe:export` - Subscribe to export updates
- `unsubscribe:export` - Unsubscribe from export
- `ping` - Connection health check

**WebSocket Events (Server → Client):**
- `export:updated` - Export status changed
- `export:created` - New export created
- `fx:approved` - FX approved
- `fx:rejected` - FX rejected
- `quality:certified` - Quality certified
- `quality:rejected` - Quality rejected
- `shipment:scheduled` - Shipment scheduled
- `shipment:confirmed` - Shipment confirmed
- `export:completed` - Export completed
- `export:cancelled` - Export cancelled
- `notification` - General notification
- `pong` - Response to ping

---

### 3. API Services → Hyperledger Fabric

**Connection Details:**

Each API connects to Fabric using:
- **Connection Profile:** `network/organizations/peerOrganizations/[org]/connection-[org].json`
- **Wallet:** Local file system wallet in `api/[service]/wallet/`
- **Identity:** Admin user from MSP
- **Channel:** `coffeechannel` (configurable via CHANNEL_NAME)
- **Chaincode:** `coffee-export` (configurable via CHAINCODE_NAME)

**Fabric Operations by Service:**

#### Exporter Bank → Fabric
- `CreateExportRequest` - Create new export
- `GetExportRequest` - Read export
- `GetAllExports` - Query all exports
- `GetExportsByStatus` - Query by status
- `GetExportHistory` - Get transaction history
- `CompleteExport` - Mark export complete
- `CancelExport` - Cancel export

#### National Bank → Fabric
- `GetExportRequest` - Read export
- `GetAllExports` - Query all exports
- `GetExportsByStatus` - Query pending exports
- `ApproveFX` - Approve foreign exchange
- `RejectFX` - Reject foreign exchange

#### NCAT → Fabric
- `GetExportRequest` - Read export
- `GetAllExports` - Query all exports
- `GetExportsByStatus` - Query FX approved exports
- `IssueQualityCertificate` - Issue quality certificate
- `RejectQuality` - Reject quality

#### Shipping Line → Fabric
- `GetExportRequest` - Read export
- `GetAllExports` - Query all exports
- `GetExportsByStatus` - Query quality certified exports
- `ScheduleShipment` - Schedule shipment
- `ConfirmShipment` - Confirm shipment

---

### 4. API Services → IPFS (Optional)

**IPFS Integration:**

All APIs have IPFS service available via shared service:
- **Host:** `localhost:5001` (configurable via IPFS_HOST/PORT)
- **Protocol:** `http` (configurable via IPFS_PROTOCOL)
- **Gateway:** `https://ipfs.io` (configurable via IPFS_GATEWAY)

**IPFS Operations:**
- Upload documents (certificates, invoices, etc.)
- Retrieve documents by hash
- Pin important documents
- Store document metadata

**Fallback:** If IPFS unavailable, falls back to local file storage in `uploads/` directory.

---

### 5. API Services → Email Service (SMTP)

**Email Integration:**

All APIs can send emails via shared email service:
- **SMTP Host:** Configurable (default: smtp.gmail.com)
- **SMTP Port:** Configurable (default: 587)
- **Authentication:** Username/password from environment

**Email Notifications:**
- Export created
- FX approved/rejected
- Quality certified/rejected
- Shipment scheduled/confirmed
- Export completed/cancelled
- Welcome emails
- Password reset

---

## 🧪 VERIFICATION TESTS

### Test 1: Health Check All Services

```bash
# Test all health endpoints
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3004/health

# Expected Response (each):
{
  "status": "ok",
  "service": "[Service Name] API",
  "timestamp": "2024-XX-XXTXX:XX:XX.XXXZ"
}
```

**Status:** ⏳ Pending Verification

---

### Test 2: WebSocket Connection Test

```javascript
// Test WebSocket connection to each service
const testWebSocket = (port, serviceName) => {
  const ws = new WebSocket(`ws://localhost:${port}`, {
    headers: {
      'Authorization': 'Bearer YOUR_JWT_TOKEN'
    }
  });

  ws.on('open', () => {
    console.log(`✅ Connected to ${serviceName}`);
    ws.send(JSON.stringify({ event: 'ping' }));
  });

  ws.on('message', (data) => {
    console.log(`📨 ${serviceName}:`, data);
  });

  ws.on('error', (error) => {
    console.error(`❌ ${serviceName} error:`, error);
  });
};

// Test all services
testWebSocket(3001, 'Exporter Bank');
testWebSocket(3002, 'National Bank');
testWebSocket(3003, 'NCAT');
testWebSocket(3004, 'Shipping Line');
```

**Status:** ⏳ Pending Verification

---

### Test 3: Rate Limiting Test

```bash
# Test auth rate limiting (should block after 5 requests)
for i in {1..10}; do
  echo "Request $i:"
  curl -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"test"}' \
    -w "\nStatus: %{http_code}\n\n"
  sleep 1
done

# Expected: First 5 requests return 401 (unauthorized)
# Requests 6-10 return 429 (too many requests)
```

**Status:** ⏳ Pending Verification

---

### Test 4: Fabric Connection Test

```bash
# Check if APIs can connect to Fabric
# Look for these log messages on startup:

# ✅ Expected logs:
# "🚀 [Service] API server running on port [PORT]"
# "🔌 WebSocket service initialized"
# "✅ Connected to Hyperledger Fabric network"

# ❌ Error logs to watch for:
# "❌ Failed to connect to Fabric network"
# "Connection profile not found"
# "Admin identity not found"
```

**Status:** ⏳ Pending Verification

---

### Test 5: End-to-End Export Flow

```javascript
// Complete export workflow testing all inter-service communication

// 1. Exporter Bank creates export
POST http://localhost:3001/api/exports
{
  "exporterBankId": "EB001",
  "exporterName": "Test Exporter",
  "coffeeType": "Arabica",
  "quantity": 1000,
  "destinationCountry": "USA",
  "estimatedValue": 50000
}
// Expected: 201 Created, WebSocket event "export:created"

// 2. National Bank approves FX
POST http://localhost:3002/api/fx/approve
{
  "exportId": "[EXPORT_ID]",
  "fxApprovalId": "FX001",
  "approvedBy": "NB Admin"
}
// Expected: 200 OK, WebSocket event "fx:approved"

// 3. NCAT certifies quality
POST http://localhost:3003/api/quality/certify
{
  "exportId": "[EXPORT_ID]",
  "qualityCertId": "QC001",
  "qualityGrade": "Grade A",
  "certifiedBy": "NCAT Inspector"
}
// Expected: 200 OK, WebSocket event "quality:certified"

// 4. Shipping Line schedules shipment
POST http://localhost:3004/api/shipments/schedule
{
  "exportId": "[EXPORT_ID]",
  "shipmentId": "SH001",
  "vesselName": "Coffee Carrier",
  "departureDate": "2024-12-01",
  "arrivalDate": "2024-12-15",
  "shippingLineId": "SL001"
}
// Expected: 200 OK, WebSocket event "shipment:scheduled"

// 5. Shipping Line confirms shipment
POST http://localhost:3004/api/shipments/confirm
{
  "exportId": "[EXPORT_ID]"
}
// Expected: 200 OK, WebSocket event "shipment:confirmed"

// 6. Exporter Bank completes export
PUT http://localhost:3001/api/exports/[EXPORT_ID]/complete
// Expected: 200 OK, WebSocket event "export:completed"
```

**Status:** ⏳ Pending Verification

---

### Test 6: Cross-Service Data Consistency

```bash
# Verify all services see the same export data

# Get export from Exporter Bank
EXPORT_EB=$(curl -s http://localhost:3001/api/exports/[EXPORT_ID])

# Get export from National Bank
EXPORT_NB=$(curl -s http://localhost:3002/api/fx/exports/[EXPORT_ID])

# Get export from NCAT
EXPORT_NCAT=$(curl -s http://localhost:3003/api/quality/exports/[EXPORT_ID])

# Get export from Shipping Line
EXPORT_SL=$(curl -s http://localhost:3004/api/shipments/exports/[EXPORT_ID])

# All should return identical data (from blockchain)
```

**Status:** ⏳ Pending Verification

---

### Test 7: Graceful Shutdown Test

```bash
# Start a service
cd api/exporter-bank
npm run dev &
PID=$!

# Wait for startup
sleep 5

# Send SIGTERM
kill -TERM $PID

# Expected logs:
# "🛑 SIGTERM received. Shutting down gracefully..."
# "HTTP server closed"
# "WebSocket service closed"
# "Fabric gateway disconnected"

# Verify clean exit (code 0)
wait $PID
echo "Exit code: $?"
```

**Status:** ⏳ Pending Verification

---

### Test 8: Large Payload Test

```bash
# Test 10MB body size limit
# Create a ~9MB JSON payload
dd if=/dev/zero bs=1M count=9 | base64 > large_payload.txt

curl -X POST http://localhost:3001/api/exports \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d @large_payload.txt

# Expected: Should accept (under 10MB limit)

# Create a ~11MB JSON payload
dd if=/dev/zero bs=1M count=11 | base64 > too_large_payload.txt

curl -X POST http://localhost:3001/api/exports \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d @too_large_payload.txt

# Expected: 413 Payload Too Large
```

**Status:** ⏳ Pending Verification

---

## 🔧 COMMUNICATION ISSUES CHECKLIST

### Potential Issues to Monitor

#### 1. WebSocket Connection Issues
- [ ] CORS errors on WebSocket connections
- [ ] Authentication failures
- [ ] Connection drops/reconnects
- [ ] Message delivery failures

**Solution:** Check CORS_ORIGIN in .env matches frontend URL

---

#### 2. Fabric Connection Issues
- [ ] Connection profile not found
- [ ] Admin identity not enrolled
- [ ] Channel not found
- [ ] Chaincode not found
- [ ] MSP ID mismatch

**Solution:** Verify FABRIC_NETWORK_PATH and ensure network is running

---

#### 3. Rate Limiting Issues
- [ ] Legitimate requests being blocked
- [ ] Rate limits too restrictive
- [ ] Rate limit headers not present

**Solution:** Adjust rate limit windows/max values if needed

---

#### 4. CORS Issues
- [ ] Preflight requests failing
- [ ] Credentials not allowed
- [ ] Headers blocked

**Solution:** Verify CORS configuration in each API

---

#### 5. Authentication Issues
- [ ] JWT token not accepted across services
- [ ] Token expiration
- [ ] Invalid signatures

**Solution:** Ensure each service uses correct JWT_SECRET

---

## 📊 COMMUNICATION FLOW DIAGRAMS

### Export Creation Flow

```
Frontend                Exporter Bank API         Fabric Network
   │                           │                        │
   │  POST /api/exports        │                        │
   ├──────────────────────────>│                        │
   │                           │  CreateExportRequest   │
   │                           ├───────────────────────>│
   │                           │                        │
   │                           │  Transaction Success   │
   │                           │<───────────────────────┤
   │                           │                        │
   │  201 Created              │                        │
   │<──────────────────────────┤                        │
   │                           │                        │
   │  WS: export:created       │                        │
   │<══════════════════════════│                        │
   │                           │                        │
```

### FX Approval Flow

```
Frontend            National Bank API         Fabric Network        Exporter Bank
   │                       │                        │                     │
   │  POST /api/fx/approve │                        │                     │
   ├────���─────────────────>│                        │                     │
   │                       │  ApproveFX             │                     │
   │                       ├───────────────────────>│                     │
   │                       │                        │                     │
   │                       │  Transaction Success   │                     │
   │                       │<───────────────────────┤                     │
   │                       │                        │                     │
   │  200 OK               │                        │                     │
   │<──────────────────────┤                        │                     │
   │                       │                        │                     │
   │  WS: fx:approved      │                        │                     │
   │<══════════════════════│                        │                     │
   │                       │                        │                     │
   │                       │  WS: fx:approved       │                     │
   │                       ├────────────────────────┼────────────────────>│
   │                       │                        │                     │
   │                       │                        │  WS: fx:approved    │
   │                       │                        │  (to subscribed     │
   │                       │                        │   clients)          │
   │<══════════════════════┼════════════════════════┼═════════════════════│
```

---

## 🎯 INTER-COMMUNICATION VERIFICATION MATRIX

| From → To | HTTP/REST | WebSocket | Fabric | IPFS | Email |
|-----------|-----------|-----------|--------|------|-------|
| **Frontend → Exporter Bank** | ✅ | ✅ | N/A | N/A | N/A |
| **Frontend → National Bank** | ✅ | ✅ | N/A | N/A | N/A |
| **Frontend → NCAT** | ✅ | ✅ | N/A | N/A | N/A |
| **Frontend → Shipping Line** | ✅ | ✅ | N/A | N/A | N/A |
| **Exporter Bank → Fabric** | N/A | N/A | ✅ | N/A | N/A |
| **National Bank → Fabric** | N/A | N/A | ✅ | N/A | N/A |
| **NCAT → Fabric** | N/A | N/A | ✅ | N/A | N/A |
| **Shipping Line → Fabric** | N/A | N/A | ✅ | N/A | N/A |
| **All APIs → IPFS** | N/A | N/A | N/A | ✅ | N/A |
| **All APIs → Email** | N/A | N/A | N/A | N/A | ✅ |

**Legend:**
- ✅ = Communication path exists and configured
- N/A = Not applicable for this combination

---

## 🚀 QUICK START VERIFICATION

### Step 1: Start All Services

```bash
# Terminal 1 - Exporter Bank
cd api/exporter-bank
npm run dev

# Terminal 2 - National Bank
cd api/national-bank
npm run dev

# Terminal 3 - NCAT
cd api/ncat
npm run dev

# Terminal 4 - Shipping Line
cd api/shipping-line
npm run dev

# Terminal 5 - Frontend
cd frontend
npm run dev
```

### Step 2: Check All Health Endpoints

```bash
./scripts/check-health.sh
```

### Step 3: Test WebSocket Connections

```bash
# Use wscat or similar tool
wscat -c ws://localhost:3001 -H "Authorization: Bearer YOUR_TOKEN"
```

### Step 4: Run Integration Tests

```bash
npm run test:integration
```

---

## 📝 NOTES

### Current Status
- ✅ All APIs have WebSocket support
- ✅ All APIs have rate limiting
- ✅ All APIs have graceful shutdown
- ✅ All APIs connect to Fabric
- ✅ All APIs have consistent configuration
- ⏳ Integration tests pending
- ⏳ Load tests pending

### Known Limitations
1. **No Direct API-to-API Communication:** Services only communicate via blockchain
2. **No Event Bus:** WebSocket events are per-service, not cross-service
3. **No API Gateway:** Frontend must connect to 4 separate APIs
4. **No Service Discovery:** Hardcoded ports and URLs

### Recommendations for Future
1. Consider implementing API Gateway for unified frontend interface
2. Add service mesh for better inter-service communication
3. Implement distributed tracing (OpenTelemetry)
4. Add centralized logging (ELK stack)
5. Implement circuit breakers for resilience

---

## ✅ VERIFICATION SIGN-OFF

| Check | Status | Notes |
|-------|--------|-------|
| All APIs start successfully | ⏳ | Pending |
| Health endpoints respond | ⏳ | Pending |
| WebSocket connections work | ⏳ | Pending |
| Rate limiting functions | ⏳ | Pending |
| Fabric connections succeed | ⏳ | Pending |
| Graceful shutdown works | ⏳ | Pending |
| End-to-end flow completes | ⏳ | Pending |
| Cross-service data consistent | ⏳ | Pending |

**Status Legend:**
- ✅ Verified and working
- ⏳ Pending verification
- ❌ Issues found
- 🔧 In progress

---

**End of Inter-Communication Check**
