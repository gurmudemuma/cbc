# ✅ What Does start-system.sh Start?

**Yes, `start-system.sh` starts EVERYTHING!**

---

## 🚀 Complete List of What Gets Started

### 1. **Blockchain Network** ✅
- **Orderer nodes** (consensus)
- **Peer nodes** for all 4 organizations:
  - Exporter Bank peer
  - National Bank peer
  - NCAT peer
  - Shipping Line peer
- **Certificate Authorities (CAs)** for all organizations
- **CouchDB** instances (state database)

**Total Docker Containers:** ~10-12

---

### 2. **Blockchain Channel** ✅
- Creates channel: `coffeechannel`
- Joins all peers to the channel
- Sets up anchor peers

---

### 3. **Chaincodes (Smart Contracts)** ✅
- **coffee-export** chaincode
  - Manages export requests
  - Handles export lifecycle
  - Tracks export status
- **user-management** chaincode
  - User authentication
  - Role management
  - Organization management

---

### 4. **API Services** ✅
All 4 API services running on Node.js/TypeScript:

| Service | Port | Purpose |
|---------|------|---------|
| **Exporter Bank API** | 3001 | Export creation & management |
| **National Bank API** | 3002 | Financial verification & approval |
| **NCAT API** | 3003 | Quality certification |
| **Shipping Line API** | 3004 | Shipping & logistics |

Each API includes:
- REST endpoints
- WebSocket server (real-time updates)
- Email service
- IPFS integration
- Fabric Gateway connection

---

### 5. **IPFS Daemon** ✅
- **Port:** 5001 (API)
- **Port:** 8080 (Gateway)
- **Purpose:** Distributed document storage

---

### 6. **Frontend Application** ✅
- **Port:** 5173
- **Framework:** React + TypeScript + Vite
- **Features:**
  - Multi-organization portal
  - Export management UI
  - Real-time updates
  - Document upload/download
  - Dashboard & analytics

---

## 📊 Complete System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    start-system.sh                          │
│                         ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Step 1-9: Prerequisites & Setup                     │  │
│  │  - Check Docker, Node.js, Go                         │  │
│  │  - Install dependencies                              │  │
│  │  - Create directories                                │  │
│  │  - Setup environment files                           │  │
│  └──────────────────────────────────────────────────────┘  │
│                         ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Step 10: Blockchain Network                         │  │
│  │  - Orderer (1 container)                             │  │
│  │  - Peers (4 containers)                              │  │
│  │  - CAs (4 containers)                                │  │
│  │  - CouchDB (4 containers)                            │  │
│  └──────────────────────────────────────────────────────┘  │
│                         ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Step 11: Channel Creation                           │  │
│  │  - Create 'coffeechannel'                            │  │
│  │  - Join all peers                                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                         ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Step 12: Chaincode Deployment                       │  │
│  │  - coffee-export chaincode                           │  │
│  │  - user-management chaincode                         │  │
│  └──────────────────────────────────────────────────────┘  │
│                         ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Step 13: Admin Enrollment                           │  │
│  │  - Enroll admin users for all orgs                   │  │
│  │  - Create identity wallets                           │  │
│  └──────────────────────────────────────────────────────┘  │
│                         ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Step 14: API Services                               │  │
│  │  - Exporter Bank API (port 3001)                     │  │
│  │  - National Bank API (port 3002)                     │  │
│  │  - NCAT API (port 3003)                              │  │
│  │  - Shipping Line API (port 3004)                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                         ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Step 15: IPFS Daemon                                │  │
│  │  - IPFS API (port 5001)                              │  │
│  │  - IPFS Gateway (port 8080)                          │  │
│  └──────────────────────────────────────────────────────┘  │
│                         ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Step 16: Frontend                                   │  │
│  │  - React App (port 5173)                             │  │
│  └──────────────────────────────────────────────────────┘  │
│                         ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Final: Verification                                 │  │
│  │  - Health checks                                     │  │
│  │  - Display access URLs                               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 What You Get After Running start-system.sh

### Running Processes

```bash
# Docker Containers (~13 containers)
- orderer.coffee-export.com
- peer0.exporterbank.coffee-export.com
- peer0.nationalbank.coffee-export.com
- peer0.ncat.coffee-export.com
- peer0.shippingline.coffee-export.com
- ca.exporterbank.coffee-export.com
- ca.nationalbank.coffee-export.com
- ca.ncat.coffee-export.com
- ca.shippingline.coffee-export.com
- couchdb0 (Exporter Bank)
- couchdb1 (National Bank)
- couchdb2 (NCAT)
- couchdb3 (Shipping Line)

# Node.js Processes (4 APIs)
- Exporter Bank API (npm run dev)
- National Bank API (npm run dev)
- NCAT API (npm run dev)
- Shipping Line API (npm run dev)

# Frontend Process
- Vite dev server (npm run dev)

# IPFS Process
- ipfs daemon
```

### Open Ports

```bash
# Blockchain Network
7050-7054  # Orderer
7051, 9051 # Exporter Bank Peer
8051, 9052 # National Bank Peer
10051, 9053 # NCAT Peer
11051, 9054 # Shipping Line Peer

# APIs
3001       # Exporter Bank API
3002       # National Bank API
3003       # NCAT API
3004       # Shipping Line API

# IPFS
5001       # IPFS API
8080       # IPFS Gateway

# Frontend
5173       # Vite dev server

# CouchDB
5984-5987  # CouchDB instances
```

---

## ✅ Verification Commands

After running `start-system.sh`, verify everything is running:

### Check Docker Containers
```bash
docker ps
# Should show ~13 containers
```

### Check API Services
```bash
curl http://localhost:3001/health  # Exporter Bank
curl http://localhost:3002/health  # National Bank
curl http://localhost:3003/health  # NCAT
curl http://localhost:3004/health  # Shipping Line
```

### Check Frontend
```bash
curl http://localhost:5173
# Should return HTML
```

### Check IPFS
```bash
curl http://localhost:5001/api/v0/version
# Should return IPFS version
```

### Check All Ports
```bash
netstat -tuln | grep -E ':(3001|3002|3003|3004|5173|5001|7050)'
# Should show all ports listening
```

---

## 🔍 What Does NOT Start Automatically

The script starts everything needed for the system to run. However, these are optional/manual:

### Optional Components
- ❌ **Monitoring** (Prometheus/Grafana) - Manual setup required
- ❌ **Production deployment** (Kubernetes) - Manual deployment
- ❌ **Email SMTP** - Requires configuration in .env files
- ❌ **External IPFS nodes** - Uses local IPFS only

### Manual Tasks
- ❌ **Creating test users** - You need to register users via API
- ❌ **Creating test exports** - You need to create via frontend/API
- ❌ **Configuring SMTP** - Edit .env files for email functionality

---

## 📋 Complete Startup Checklist

After `./start-system.sh` completes, you should have:

- [x] **13 Docker containers** running
- [x] **Blockchain network** operational
- [x] **Channel** created and peers joined
- [x] **2 Chaincodes** deployed and committed
- [x] **4 API services** running and responding
- [x] **IPFS daemon** running
- [x] **Frontend** accessible at http://localhost:5173
- [x] **Admin identities** enrolled
- [x] **Connection profiles** generated
- [x] **Wallets** created for all organizations

---

## 🎯 Summary

### YES, start-system.sh starts EVERYTHING:

✅ **Blockchain Network** (Fabric)  
✅ **Channel Creation**  
✅ **Chaincode Deployment**  
✅ **All 4 API Services**  
✅ **IPFS Daemon**  
✅ **Frontend Application**  
✅ **Admin Enrollment**  
✅ **Connection Profiles**  

### Total Components Started: **20+**
- 13 Docker containers
- 4 API services
- 1 Frontend app
- 1 IPFS daemon
- 2 Chaincodes
- 1 Channel

---

## 🚀 One Command, Complete System

```bash
./start-system.sh
```

**That's it!** Everything starts automatically.

---

## ⏱️ Startup Time

| Phase | Time |
|-------|------|
| Prerequisites & Setup | 2-3 min |
| Blockchain Network | 2-3 min |
| Channel Creation | 1 min |
| Chaincode Deployment | 6-10 min |
| API Services | 2-3 min |
| IPFS & Frontend | 1 min |
| **Total (First Time)** | **20-30 min** |
| **Total (Subsequent)** | **5-10 min** |

---

## 🎉 After Startup

Once complete, you can immediately:

1. **Access Frontend:** http://localhost:5173
2. **Use APIs:** http://localhost:3001-3004
3. **Upload Documents:** IPFS at port 5001
4. **Query Blockchain:** Via APIs or peer CLI
5. **Create Exports:** Via frontend or API
6. **View Real-time Updates:** WebSocket connections active

---

## 💡 Pro Tip

The script is **idempotent** - you can run it multiple times safely. It will:
- Skip already running services
- Reuse existing channels
- Skip already deployed chaincodes
- Only start what's needed

---

**Bottom Line:** `start-system.sh` is your **ONE-STOP** command to start the entire Coffee Blockchain Consortium system! 🚀☕

---

*Last Updated: January 2024*
