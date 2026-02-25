# ☕ Coffee Export Blockchain - START HERE

## Quick Start (3 Steps)

### 1. Start the Complete Hybrid System
```bash
START-HYBRID.bat
```
Wait 3-4 minutes for all services to start.

### 2. Open Browser
```
http://localhost:5173
```

### 3. Register with Business Type
1. Click "Register here"
2. Fill account info
3. **Select your business type** (Union, Private Company, Individual, or Farmer Cooperative)
4. Complete registration

## What You Get

✅ **Full Hyperledger Fabric Network** - 3 Orderers, 6 Peers, 6 CouchDB instances
✅ **Smart Contracts** - Chaincode server with all business logic
✅ **Gateway API** - Unified API with business types support
✅ **Blockchain Bridge** - Syncs blockchain ↔ database
✅ **CBC Services** - ECTA, Banks, Customs, ECX, Shipping
✅ **Infrastructure** - PostgreSQL, Redis, Kafka
✅ **Modern Frontend** - React with business types registration

## Business Types Feature

The system supports 4 business types with different capital requirements:

| Type | Minimum Capital |
|------|----------------|
| Private Limited Company | 50,000,000 ETB |
| Union/Cooperative | 15,000,000 ETB |
| Individual Exporter | 10,000,000 ETB |
| Farmer Cooperative | 5,000,000 ETB |

When you register, select your business type and the system automatically applies the correct capital requirement!

## Test Credentials

**ECTA Admin** (to approve registrations):
- Username: `admin`
- Password: `admin123`

**Existing Exporter**:
- Username: `exporter1`
- Password: `password123`

## Service URLs

- Frontend: http://localhost:5173
- Gateway API: http://localhost:3000
- Chaincode: http://localhost:3001
- Blockchain Bridge: http://localhost:3008
- ECTA Service: http://localhost:3003

## Stopping the System

```bash
STOP-HYBRID.bat
```

## Troubleshooting

### Browser shows old code without business types?
Press `Ctrl + Shift + R` to hard refresh, or open Incognito window.

### Registration fails with 400 error?
Check gateway logs:
```bash
docker logs coffee-gateway --tail 20
```

### Services not starting?
Check all containers:
```bash
docker ps -a
```

## Documentation

- **HYBRID-SYSTEM-GUIDE.md** - Complete architecture and troubleshooting
- **BUSINESS-TYPES-IMPLEMENTED.md** - Business types feature details
- **docker-compose-hybrid.yml** - All service definitions

## Architecture

```
Fabric Network (Blockchain)
    ↓
Chaincode Server (Smart Contracts)
    ↓
Gateway API (Business Types Validation)
    ↓
Blockchain Bridge (Data Sync)
    ↓
CBC Services + Database
    ↓
Frontend (Registration Form)
```

## What's New - Business Types

✅ 4 business types with different capital requirements
✅ Dynamic validation based on selected type
✅ Helper text showing capital requirement
✅ Automatic capital calculation
✅ Stored in blockchain with user profile
✅ Synced to database via bridge

## Next Steps

1. **Start system**: `START-HYBRID.bat`
2. **Register**: Go to http://localhost:5173, click "Register here"
3. **Select business type**: Choose from dropdown
4. **Submit**: System validates and creates account
5. **Approve**: Login as admin to approve registration
6. **Use system**: Login as approved exporter

---

**Everything is ready! Just run START-HYBRID.bat and wait 3-4 minutes.**

For detailed information, see **HYBRID-SYSTEM-GUIDE.md**
