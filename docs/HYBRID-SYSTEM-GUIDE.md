# Coffee Export Hybrid System - Complete Guide

## Architecture Overview

The Coffee Export system is a **HYBRID ARCHITECTURE** combining:

### 1. Blockchain Layer (Hyperledger Fabric)
- **3 Orderer Nodes** (Raft consensus)
- **6 Peer Nodes** (ECTA x2, Bank, NBE, Customs, Shipping)
- **6 CouchDB Instances** (State database for each peer)
- **Chaincode Server** (Smart contracts as a service)

### 2. Application Layer (Microservices)
- **Gateway API** - Unified API gateway with business types support
- **Blockchain Bridge** - Syncs data between blockchain and database
- **CBC Services** - Organization-specific services (ECTA, Banks, Customs, etc.)

### 3. Infrastructure Layer
- **PostgreSQL** - Relational database for CBC services
- **Redis** - Caching and session management
- **Kafka** - Event streaming and message broker
- **Zookeeper** - Kafka coordination

### 4. Frontend Layer
- **React + Vite** - Modern SPA with business types registration

## Network Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FABRIC NETWORK                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │ Orderer1 │  │ Orderer2 │  │ Orderer3 │                 │
│  └──────────┘  └──────────┘  └──────────┘                 │
│                                                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐         │
│  │Peer ECTA│ │Peer Bank│ │Peer NBE │ │Peer Cust│ ...     │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘         │
│       │           │           │           │                 │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐         │
│  │CouchDB  │ │CouchDB  │ │CouchDB  │ │CouchDB  │         │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘         │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ Connected to both networks
                          │
┌─────────────────────────────────────────────────────────────┐
│              COFFEE-EXPORT-NETWORK                          │
│                                                              │
│  ┌──────────────┐      ┌──────────────┐                   │
│  │  Chaincode   │◄────►│   Gateway    │                   │
│  │   Server     │      │     API      │                   │
│  │  (Port 3001) │      │  (Port 3000) │                   │
│  └──────────────┘      └──────────────┘                   │
│                               │                             │
│                               ▼                             │
│  ┌──────────────┐      ┌──────────────┐                   │
│  │  Blockchain  │      │     CBC      │                   │
│  │    Bridge    │◄────►│   Services   │                   │
│  │  (Port 3008) │      │ (3002-3007)  │                   │
│  └──────────────┘      └──────────────┘                   │
│         │                      │                            │
│         ▼                      ▼                            │
│  ┌──────────────────────────────────┐                     │
│  │  PostgreSQL │ Redis │ Kafka      │                     │
│  └──────────────────────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
                  ┌──────────────┐
                  │   Frontend   │
                  │  (Port 5173) │
                  └──────────────┘
```

## Business Types Feature

### Implemented Capital Requirements

According to Ethiopian coffee export regulations:

| Business Type | Minimum Capital (ETB) | Description |
|--------------|----------------------|-------------|
| Private Limited Company | 50,000,000 | Private companies engaged in coffee export |
| Union/Cooperative | 15,000,000 | Coffee unions and cooperative societies |
| Individual Exporter | 10,000,000 | Individual entrepreneurs |
| Farmer Cooperative | 5,000,000 | Farmer-owned cooperatives |

### How It Works

1. **Frontend** - User selects business type from dropdown
2. **Gateway** - Validates capital based on selected type
3. **Blockchain** - Stores business type with user profile
4. **Database** - CBC services sync business type via bridge

## Starting the System

### Quick Start

```bash
START-HYBRID.bat
```

This will:
1. Start Fabric network (2 minutes)
2. Start infrastructure services (15 seconds)
3. Start chaincode server (15 seconds)
4. Start gateway with business types (20 seconds)
5. Start all CBC services (15 seconds)
6. Start frontend dev server (15 seconds)

**Total time: ~3-4 minutes**

### Manual Start (Step by Step)

```bash
# 1. Start Fabric
docker-compose -f docker-compose-fabric.yml up -d

# 2. Start Infrastructure
docker-compose -f docker-compose-hybrid.yml up -d postgres redis zookeeper kafka

# 3. Start Chaincode
docker-compose -f docker-compose-hybrid.yml up -d chaincode-server
docker network connect fabric-network coffee-chaincode

# 4. Start Gateway
docker-compose -f docker-compose-hybrid.yml up -d gateway
docker network connect fabric-network coffee-gateway

# 5. Start CBC Services
docker-compose -f docker-compose-hybrid.yml up -d blockchain-bridge ecta-service commercial-bank-service national-bank-service customs-service ecx-service shipping-service

# 6. Start Frontend
cd cbc/frontend
npm run dev
```

## Stopping the System

```bash
STOP-HYBRID.bat
```

Or manually:
```bash
docker-compose -f docker-compose-hybrid.yml down
docker-compose -f docker-compose-fabric.yml down
```

## Service Ports

### Blockchain Layer
- Chaincode Server: 3001
- Peer0 ECTA: 7051
- Peer1 ECTA: 8051
- Peer0 Bank: 9051
- Peer0 NBE: 10051
- Peer0 Customs: 11051
- Peer0 Shipping: 12051
- Orderer1: 7050
- Orderer2: 8050
- Orderer3: 9050

### Application Layer
- Gateway API: 3000
- Commercial Bank: 3002
- ECTA Service: 3003
- National Bank: 3004
- Customs: 3005
- ECX: 3006
- Shipping: 3007
- Blockchain Bridge: 3008

### Infrastructure
- PostgreSQL: 5432
- Redis: 6379
- Kafka: 9092
- Zookeeper: 2181

### Frontend
- Dev Server: 5173

## Testing Business Types Registration

### 1. Access Frontend
```
http://localhost:5173
```

### 2. Register New Exporter

1. Click "Register here"
2. **Step 1 - Account Info:**
   - Username: `testunion`
   - Email: `test@union.com`
   - Password: `password123`
3. Click "Next"
4. **Step 2 - Business Profile:**
   - Business Name: `Test Coffee Union`
   - **Business Type:** Select "Union/Cooperative (Min. 15M ETB)"
   - TIN: `TIN123456`
   - Office Address: `Addis Ababa`
   - City: `Addis Ababa`
   - Region: `Addis Ababa`
   - Contact Person: `John Doe`
   - Phone: `+251911234567`
5. Click "Complete Registration"

### 3. Expected Result

✅ Success message:
```
Registration successful! Your account has been created and submitted 
for ECTA approval. You can now log in.
```

### 4. Verify in Gateway Logs

```bash
docker logs coffee-gateway --tail 20
```

You should see:
```json
{
  "username": "testunion",
  "businessType": "UNION",
  "capitalETB": 15000000,
  ...
}
```

### 5. Approve Registration (ECTA)

1. Login as ECTA admin:
   - Username: `admin`
   - Password: `admin123`
2. Go to ECTA Pre-Registration Management
3. Find pending application
4. Click "Approve"

### 6. Login as Approved Exporter

1. Logout
2. Login with:
   - Username: `testunion`
   - Password: `password123`
3. Access exporter dashboard

## Troubleshooting

### Frontend Shows Old Code (No Business Types)

**Problem:** Browser cached old JavaScript

**Solution:**
1. Press `Ctrl + Shift + R` (hard refresh)
2. Or open Incognito window
3. Or clear browser cache completely

### Gateway Can't Connect to Chaincode

**Problem:** Chaincode not on fabric-network

**Solution:**
```bash
docker network connect fabric-network coffee-chaincode
docker restart coffee-gateway
```

### Registration Returns 400 Error

**Problem:** Business type not being sent or capital too low

**Check:**
1. Open browser DevTools (F12)
2. Go to Network tab
3. Submit registration
4. Check request payload - should include `businessType`

**Verify Gateway:**
```bash
docker logs coffee-gateway --tail 30
```

Look for:
```
[Registration] Received request body: {
  "businessType": "UNION",  // <-- Should be present
  "capitalETB": 15000000
}
```

### Services Not Starting

**Check Docker:**
```bash
docker ps -a
docker logs <container-name>
```

**Check Networks:**
```bash
docker network ls
docker network inspect fabric-network
docker network inspect coffee-export-network
```

### Database Connection Issues

**Check PostgreSQL:**
```bash
docker logs coffee-postgres
docker exec -it coffee-postgres psql -U postgres -d coffee_export_db -c "\dt"
```

## Monitoring

### View All Services
```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### View Logs
```bash
# Gateway
docker logs coffee-gateway -f

# Chaincode
docker logs coffee-chaincode -f

# Blockchain Bridge
docker logs coffee-bridge -f

# ECTA Service
docker logs coffee-ecta -f

# PostgreSQL
docker logs coffee-postgres -f
```

### Health Checks
```bash
# Gateway
curl http://localhost:3000/health

# Chaincode
curl http://localhost:3001/health

# Bridge
curl http://localhost:3008/health
```

## Development

### Rebuild Gateway with Changes
```bash
cd coffee-export-gateway
docker build -t coffee-gateway:latest .
docker stop coffee-gateway
docker rm coffee-gateway
docker run -d --name coffee-gateway --network fabric-network -p 3000:3000 -e ... coffee-gateway:latest
docker network connect coffee-export-network coffee-gateway
```

### Rebuild Frontend
```bash
cd cbc/frontend
rm -rf node_modules/.vite
npm run dev
```

### Update Chaincode
```bash
cd chaincode/ecta
# Make changes
docker-compose -f ../../docker-compose-hybrid.yml up -d --build chaincode-server
```

## Production Deployment

For production, use:
```bash
docker-compose -f docker-compose-hybrid.yml up -d
```

This builds and starts all services including the production frontend (nginx).

Frontend will be available on port 5173 (mapped to nginx port 80).

## Key Files

- `docker-compose-fabric.yml` - Fabric network definition
- `docker-compose-hybrid.yml` - Application services definition
- `START-HYBRID.bat` - Complete system startup
- `STOP-HYBRID.bat` - Complete system shutdown
- `coffee-export-gateway/src/routes/auth.routes.js` - Business types validation
- `cbc/frontend/src/pages/Login.tsx` - Business types registration form

## Support

For issues:
1. Check logs: `docker logs <service-name>`
2. Verify networks: `docker network inspect fabric-network`
3. Check ports: `netstat -an | findstr "3000 3001 5173"`
4. Restart system: `STOP-HYBRID.bat` then `START-HYBRID.bat`

---

**System is ready when you see all services running and frontend accessible at http://localhost:5173**
