# Coffee Blockchain Consortium - System Startup Guide

## 🚀 Complete Step-by-Step Guide to Start the System

---

## 📋 Prerequisites

Before starting, ensure you have:
- ✅ Node.js 16.x or higher
- ✅ npm 8.x or higher
- ✅ Docker 20.x or higher
- ✅ Docker Compose 2.x or higher
- ✅ Go 1.19 or higher
- ✅ Hyperledger Fabric binaries (will be installed in Step 1)

---

## 🎯 Quick Start (For First Time Setup)

If this is your first time setting up the system, follow these steps in order:

### Step 1: Install Fabric Binaries and Docker Images

```bash
# From project root (/home/gu-da/CBC)
cd network

# Download Fabric binaries and Docker images
curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.5.0 1.5.5

# This will download:
# - Fabric binaries (peer, orderer, configtxgen, etc.) to ./bin
# - Fabric Docker images (peer, orderer, ca, tools, etc.)

# Add binaries to PATH (add to ~/.bashrc for permanent)
export PATH=$PWD/bin:$PATH

# Verify installation
peer version
orderer version
configtxgen --version
```

**Expected Output:**
```
peer:
 Version: 2.5.0
 Commit SHA: ...
 Go version: go1.19.x
```

---

### Step 2: Setup Environment

```bash
# Go back to project root
cd /home/gu-da/CBC

# Run setup script
chmod +x scripts/setup-env.sh
./scripts/setup-env.sh
```

**What this does:**
- ✅ Checks prerequisites (Node.js, Docker, Go)
- ✅ Installs chaincode dependencies
- ✅ Installs API dependencies for all 4 services
- ✅ Creates .env files from examples
- ✅ Makes all scripts executable
- ✅ Creates necessary directories

**Expected Output:**
```
✅ Environment setup completed successfully!
```

---

### Step 3: Generate Cryptographic Material

```bash
# Navigate to network directory
cd network

# Generate certificates for all organizations
./scripts/generate-certs.sh
```

**What this does:**
- Creates cryptographic material for all 4 peer organizations
- Creates cryptographic material for orderer organization
- Generates MSP (Membership Service Provider) directories
- Creates admin and user identities

**Expected Output:**
```
Certificates generated successfully
```

**Verify:**
```bash
# Check if directories were created
ls -la organizations/peerOrganizations/
# Should show:
# exporterbank.coffee-export.com/
# nationalbank.coffee-export.com/
# ncat.coffee-export.com/
# shippingline.coffee-export.com/

ls -la organizations/ordererOrganizations/
# Should show:
# coffee-export.com/
```

---

### Step 4: Start the Blockchain Network

```bash
# Still in /home/gu-da/CBC/network directory
./network.sh up
```

**What this does:**
- Starts Docker containers for:
  - 1 Orderer node
  - 4 Peer nodes (one for each organization)
  - 4 CouchDB instances (state database for each peer)

**Expected Output:**
```
Creating network "coffee-export" with the default driver
Creating orderer.coffee-export.com ... done
Creating peer0.exporterbank.coffee-export.com ... done
Creating peer0.nationalbank.coffee-export.com ... done
Creating peer0.ncat.coffee-export.com ... done
Creating peer0.shippingline.coffee-export.com ... done
```

**Verify:**
```bash
# Check running containers
docker ps

# Should show 9 containers running:
# - orderer.coffee-export.com
# - peer0.exporterbank.coffee-export.com
# - peer0.nationalbank.coffee-export.com
# - peer0.ncat.coffee-export.com
# - peer0.shippingline.coffee-export.com
# - couchdb0, couchdb1, couchdb2, couchdb3
```

---

### Step 5: Create the Channel

```bash
# Still in /home/gu-da/CBC/network directory
./network.sh createChannel
```

**What this does:**
- Creates a channel named "coffeechannel"
- Joins all 4 peer organizations to the channel
- Sets anchor peers for each organization

**Expected Output:**
```
Generating channel genesis block 'coffeechannel.block'
Creating channel coffeechannel
Joining ExporterBank peer to the channel...
Joining NationalBank peer to the channel...
Joining NCAT peer to the channel...
Joining ShippingLine peer to the channel...
Setting anchor peer for ExporterBank...
Setting anchor peer for NationalBank...
Setting anchor peer for NCAT...
Setting anchor peer for ShippingLine...
Channel 'coffeechannel' created and peers joined successfully
```

---

### Step 6: Deploy Coffee Export Chaincode

```bash
# Still in /home/gu-da/CBC/network directory
./network.sh deployCC -ccn coffee-export -ccp ../chaincode/coffee-export -ccl go
```

**What this does:**
- Packages the coffee-export chaincode
- Installs it on all 4 peer nodes
- Approves the chaincode for all 4 organizations
- Commits the chaincode to the channel

**Expected Output:**
```
Chaincode is packaged
Chaincode is installed on peer0.org1
Chaincode is installed on peer0.org2
Chaincode is installed on peer0.org3
Chaincode is installed on peer0.org4
Chaincode definition approved on peer0.org1
Chaincode definition approved on peer0.org2
Chaincode definition approved on peer0.org3
Chaincode definition approved on peer0.org4
Chaincode definition committed on channel 'coffeechannel'
```

**This takes 2-5 minutes** - be patient!

---

### Step 7: Deploy User Management Chaincode

```bash
# Still in /home/gu-da/CBC/network directory
./network.sh deployCC -ccn user-management -ccp ../chaincode/user-management -ccl go
```

**What this does:**
- Deploys the blockchain-based user authentication system
- Enables cross-service user authentication

**Expected Output:**
```
Chaincode is packaged
Chaincode is installed on all peers
Chaincode definition committed on channel 'coffeechannel'
```

---

### Step 8: Generate Connection Profiles

```bash
# Still in /home/gu-da/CBC/network directory
./scripts/ccp-generate.sh
```

**What this does:**
- Generates connection profiles for each organization
- Creates both JSON and YAML formats
- Places them in the correct directories

**Expected Output:**
```
Connection profiles generated for all organizations
```

**Verify:**
```bash
ls -la organizations/peerOrganizations/exporterbank.coffee-export.com/
# Should show:
# connection-exporterbank.json
# connection-exporterbank.yaml
```

---

### Step 9: Start API Services

Open **4 separate terminal windows** and run each command in a different terminal:

#### Terminal 1 - Exporter Bank API
```bash
cd /home/gu-da/CBC/api/exporter-bank
npm run dev
```

**Expected Output:**
```
🚀 Exporter Bank API server running on port 3001
✅ Connected to Hyperledger Fabric network
```

#### Terminal 2 - National Bank API
```bash
cd /home/gu-da/CBC/api/national-bank
npm run dev
```

**Expected Output:**
```
🚀 National Bank API server running on port 3002
✅ Connected to Hyperledger Fabric network
```

#### Terminal 3 - NCAT API
```bash
cd /home/gu-da/CBC/api/ncat
npm run dev
```

**Expected Output:**
```
🚀 NCAT API server running on port 3003
✅ Connected to Hyperledger Fabric network
```

#### Terminal 4 - Shipping Line API
```bash
cd /home/gu-da/CBC/api/shipping-line
npm run dev
```

**Expected Output:**
```
🚀 Shipping Line API server running on port 3004
✅ Connected to Hyperledger Fabric network
```

---

### Step 10: Start Frontend (Optional)

Open a **5th terminal window**:

```bash
cd /home/gu-da/CBC/frontend
npm run dev
```

**Expected Output:**
```
VITE v4.x.x  ready in xxx ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
```

**Access the frontend:**
Open your browser and go to: http://localhost:3000

---

## ✅ Verification - Test the System

### Test 1: Check Network Status

```bash
# In a new terminal
cd /home/gu-da/CBC/network

# Check all containers are running
docker ps --format "table {{.Names}}\t{{.Status}}"
```

**Expected:** All containers should show "Up" status

---

### Test 2: Test API Health Endpoints

```bash
# Test Exporter Bank API
curl http://localhost:3001/health

# Test National Bank API
curl http://localhost:3002/health

# Test NCAT API
curl http://localhost:3003/health

# Test Shipping Line API
curl http://localhost:3004/health
```

**Expected Response (for each):**
```json
{
  "status": "ok",
  "service": "Exporter Bank API",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### Test 3: Test User Registration (Cross-Service Authentication)

```bash
# Register a user in Exporter Bank (port 3001)
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "Test123!@#",
    "email": "test@example.com",
    "organizationId": "EXPORTER-BANK-001",
    "role": "exporter"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "USER-...",
      "username": "testuser",
      "email": "test@example.com",
      "organizationId": "EXPORTER-BANK-001",
      "role": "exporter"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### Test 4: Test Cross-Service Login

```bash
# Login from National Bank (port 3002) with user registered in Exporter Bank
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "Test123!@#"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "USER-...",
      "username": "testuser",
      "email": "test@example.com",
      "organizationId": "EXPORTER-BANK-001",
      "role": "exporter"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

✅ **Success!** User registered in one service can login to any service!

---

### Test 5: Query Blockchain Directly

```bash
# Query user from blockchain
docker exec cli peer chaincode query \
  -C coffeechannel \
  -n user-management \
  -c '{"function":"GetUserByUsername","Args":["testuser"]}'
```

**Expected Response:**
```json
{
  "id": "USER-...",
  "username": "testuser",
  "passwordHash": "$2a$10$...",
  "email": "test@example.com",
  "organizationId": "EXPORTER-BANK-001",
  "role": "exporter",
  "createdAt": "2024-01-15T10:30:00Z",
  "isActive": true
}
```

---

## 🔄 Restarting the System (After First Setup)

If you've already set up the system and just need to restart it:

### Quick Restart

```bash
# 1. Start the network
cd /home/gu-da/CBC/network
./network.sh up

# 2. Start API services (in separate terminals)
cd /home/gu-da/CBC/api/exporter-bank && npm run dev
cd /home/gu-da/CBC/api/national-bank && npm run dev
cd /home/gu-da/CBC/api/ncat && npm run dev
cd /home/gu-da/CBC/api/shipping-line && npm run dev

# 3. Start frontend (optional)
cd /home/gu-da/CBC/frontend && npm run dev
```

---

## 🛑 Stopping the System

### Stop API Services
Press `Ctrl+C` in each terminal running an API service

### Stop Frontend
Press `Ctrl+C` in the terminal running the frontend

### Stop Blockchain Network
```bash
cd /home/gu-da/CBC/network
./network.sh down
```

**What this does:**
- Stops all Docker containers
- Removes containers
- Preserves blockchain data in volumes

---

## 🧹 Clean Restart (Reset Everything)

If you want to completely reset the system:

```bash
cd /home/gu-da/CBC

# Clean everything
./scripts/clean.sh

# This removes:
# - All Docker containers and volumes
# - All cryptographic material
# - All blockchain data
# - Channel artifacts

# Then start from Step 3 (Generate Cryptographic Material)
```

---

## 🐛 Troubleshooting

### Issue: "Connection profile not found"

**Solution:**
```bash
cd /home/gu-da/CBC/network
./scripts/ccp-generate.sh
```

---

### Issue: "Failed to connect to Fabric network"

**Solution:**
```bash
# Check if network is running
docker ps

# If not running, start it
cd /home/gu-da/CBC/network
./network.sh up
```

---

### Issue: "Chaincode not found"

**Solution:**
```bash
cd /home/gu-da/CBC/network

# Redeploy chaincodes
./network.sh deployCC -ccn coffee-export -ccp ../chaincode/coffee-export -ccl go
./network.sh deployCC -ccn user-management -ccp ../chaincode/user-management -ccl go
```

---

### Issue: Port already in use

**Solution:**
```bash
# Check what's using the port
sudo lsof -i :3001  # or :3002, :3003, :3004, :3000

# Kill the process
kill -9 <PID>

# Or use different ports by editing .env files
```

---

### Issue: Docker containers not starting

**Solution:**
```bash
# Clean up Docker
docker system prune -a --volumes

# Restart Docker daemon
sudo systemctl restart docker

# Try starting network again
cd /home/gu-da/CBC/network
./network.sh up
```

---

## 📊 System Architecture Overview

```
┌────────────────────────────────────────────────────────────��┐
│                     Frontend (Port 3000)                     │
│                    React + Vite Application                  │
└────────────────────────┬─���──────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
┌────────▼────────┐              ┌──────▼──────────┐
│  API Services   │              │  API Services   │
├─────────────────┤              ├─────────────────┤
│ Exporter Bank   │              │ National Bank   │
│   (Port 3001)   │              │   (Port 3002)   │
├─────────────────┤              ├─────────────────┤
│      NCAT       │              │ Shipping Line   │
│   (Port 3003)   │              │   (Port 3004)   │
└────────┬────────┘              └────────┬────────┘
         │                                │
         └────────────┬───────────────────┘
                      │
         ┌────────────▼────────────┐
         │  Hyperledger Fabric     │
         │  Blockchain Network     │
         ├─────────────────────────┤
         │ • 1 Orderer Node        │
         │ • 4 Peer Nodes          │
         │ • 4 CouchDB Instances   │
         │ • 2 Chaincodes          │
         │   - coffee-export       │
         │   - user-management     │
         └─────────────────────────┘
```

---

## 📝 Port Reference

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Exporter Bank API | 3001 | http://localhost:3001 |
| National Bank API | 3002 | http://localhost:3002 |
| NCAT API | 3003 | http://localhost:3003 |
| Shipping Line API | 3004 | http://localhost:3004 |
| Orderer | 7050 | - |
| Peer 0 (Exporter Bank) | 7051 | - |
| Peer 0 (National Bank) | 8051 | - |
| Peer 0 (NCAT) | 9051 | - |
| Peer 0 (Shipping Line) | 10051 | - |

---

## 🎉 Success!

If all steps completed successfully, you now have:

✅ A running Hyperledger Fabric blockchain network
✅ 4 API services connected to the blockchain
✅ Blockchain-based user authentication working
✅ Cross-service authentication enabled
✅ Frontend application (optional)

**You can now:**
- Register users in any service
- Login from any service with the same credentials
- Create and manage coffee export requests
- Track shipments across organizations
- Issue quality certificates
- Manage foreign exchange rates

---

## 📚 Additional Resources

- **API Documentation:** See `postman-collection.json`
- **Architecture Details:** See `ARCHITECTURE.md`
- **Developer Notes:** See `DEVELOPER_NOTES.md`
- **Quick Reference:** See `QUICK_REFERENCE.md`

---

**System Startup Guide Created By:** Qodo AI Assistant
**Date:** 2024
**Status:** Complete and Ready to Use
