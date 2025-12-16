# Quick Start Guide

Get the Coffee Blockchain Consortium up and running in minutes.

---

## Prerequisites

### Required Software

- **Docker** 20.10+ and Docker Compose
- **Node.js** 16+ and npm
- **Go** 1.19+ (for chaincode)
- **Git**
- **curl** (for testing)

### System Requirements

- **OS:** Linux (Ubuntu 20.04+), macOS, or Windows with WSL2
- **RAM:** 8GB minimum, 16GB recommended
- **Disk:** 20GB free space
- **CPU:** 4 cores recommended

### Check Prerequisites

```bash
# Check Docker
docker --version
docker-compose --version

# Check Node.js
node --version
npm --version

# Check Go
go version

# Check available ports
./scripts/validate-config.sh
```

---

## Quick Start (5 Minutes)

### 1. Clone and Setup

```bash
# Clone repository
git clone <repository-url>
cd cbc

# Install dependencies
npm install
cd api && npm install
cd commercialbank && npm install && cd ..
cd national-bank && npm install && cd ..
cd ncat && npm install && cd ..
cd shipping-line && npm install && cd ..
cd ../..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### 2. Configure Environment

```bash
# Copy environment templates
cp .env.example .env
cp api/commercialbank/.env.example api/commercialbank/.env
cp api/national-bank/.env.example api/national-bank/.env
cp api/ncat/.env.example api/ncat/.env
cp api/shipping-line/.env.example api/shipping-line/.env
cp frontend/.env.example frontend/.env

# Update JWT secrets (IMPORTANT!)
# Edit each .env file and change JWT_SECRET to a unique random string
```

### 3. Start the System

```bash
# Start everything with one command
./start-system.sh
```

This script will:
- ✅ Start the blockchain network
- ✅ Create the channel
- ✅ Deploy chaincode
- ✅ Start all API services
- ✅ Start the frontend
- ✅ Register test users

### 4. Verify Installation

```bash
# Check all services are healthy
./scripts/check-health.sh

# Expected output:
# ✅ commercialbank API (port 3001) is healthy
# ✅ National Bank API (port 3002) is healthy
# ✅ ECTA API (port 3003) is healthy
# ✅ Shipping Line API (port 3004) is healthy
```

### 5. Access the Application

Open your browser:
- **Frontend:** http://localhost:5173
- **commercialbank API:** http://localhost:3001
- **National Bank API:** http://localhost:3002
- **ECTA API:** http://localhost:3003
- **Shipping Line API:** http://localhost:3004

**Test Credentials:**
- Username: `exporter1` / Password: `SecurePass123!@#`
- Username: `banker1` / Password: `SecurePass123!@#`
- Username: `inspector1` / Password: `SecurePass123!@#`
- Username: `shipper1` / Password: `SecurePass123!@#`

---

## Manual Step-by-Step Setup

If the automated script doesn't work, follow these manual steps:

### Step 1: Start Blockchain Network

```bash
cd network

# Generate crypto material
./network.sh up createChannel -c coffeechannel

# This will:
# - Generate certificates for all organizations
# - Start Docker containers
# - Create the channel
# - Join all peers to the channel
```

**Verify:**
```bash
docker ps | grep hyperledger
# Should show orderer and 4 peer containers running
```

### Step 2: Deploy Chaincode

```bash
# Deploy user management chaincode
./network.sh deployCC -ccn user-management -ccp ../chaincode/user-management -ccl go

# Deploy coffee export chaincode
./network.sh deployCC -ccn coffee-export -ccp ../chaincode/coffee-export -ccl go
```

**Verify:**
```bash
docker exec peer0.commercialbank.coffee-export.com peer lifecycle chaincode queryinstalled
# Should show both chaincodes installed
```

### Step 3: Start IPFS (Optional but Recommended)

```bash
# Install IPFS
cd go-ipfs
./install.sh

# Start IPFS daemon
ipfs daemon &

# Verify
curl http://localhost:5001/api/v0/version
```

### Step 4: Start API Services

```bash
cd api

# Option A: Start all services with tmux (recommended for development)
../scripts/dev-apis.sh

# Option B: Start services individually
cd commercialbank && npm run dev &
cd ../national-bank && npm run dev &
cd ../ncat && npm run dev &
cd ../shipping-line && npm run dev &
```

**Verify:**
```bash
# Check health endpoints
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3004/health
```

### Step 5: Register Test Users

```bash
./scripts/register-test-users.sh
```

This creates test users for each organization.

### Step 6: Start Frontend

```bash
cd frontend
npm run dev
```

Access at: http://localhost:5173

---

## Platform-Specific Instructions

### Linux (Ubuntu/Debian)

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Go
wget https://go.dev/dl/go1.19.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.19.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc
```

### macOS

```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Docker Desktop
brew install --cask docker

# Install Node.js
brew install node

# Install Go
brew install go
```

### Windows (with Git Bash)

This guide is optimized for running the Coffee Blockchain Consortium on Windows with Git Bash.

#### Prerequisites
- ✅ Docker Desktop running
- ✅ Node.js installed
- ✅ Go installed
- ✅ Fabric binaries installed (already done)

#### Step-by-Step Startup

##### Step 1: Start Blockchain Network
```bash
cd network
./network.sh up
```

Wait for output showing all containers are created (~2-3 minutes).

##### Step 2: Create Channel
```bash
./network.sh createChannel
```

##### Step 3: Deploy Chaincode
```bash
# Deploy coffee-export chaincode
./network.sh deployCC -ccn coffee-export -ccp ../chaincode/coffee-export -ccl golang

# Deploy user-management chaincode (optional)
./network.sh deployCC -ccn user-management -ccp ../chaincode/user-management -ccl golang
```

This will take ~5-10 minutes for each chaincode.

##### Step 4: Verify Network
```bash
docker ps
```

You should see 5+ containers running:
- orderer.coffee-export.com
- peer0.commercialbank.coffee-export.com
- peer0.nationalbank.coffee-export.com
- peer0.ncat.coffee-export.com
- peer0.shippingline.coffee-export.com
- cli

##### Step 5: Start APIs (in separate terminals)

**Terminal 2 - commercialbank API:**
```bash
cd api/commercialbank
npm install  # First time only
npm run dev
```

**Terminal 3 - National Bank API:**
```bash
cd api/national-bank
npm install  # First time only
npm run dev
```

**Terminal 4 - ECTA API:**
```bash
cd api/ncat
npm install  # First time only
npm run dev
```

**Terminal 5 - Shipping Line API:**
```bash
cd api/shipping-line
npm install  # First time only
npm run dev
```

##### Step 6: Start Frontend

**Terminal 6 - Frontend:**
```bash
cd frontend
npm install  # First time only
npm run dev
```

#### Access the System

- Frontend: http://localhost:5173
- commercialbank API: http://localhost:3001
- National Bank API: http://localhost:3002
- ECTA API: http://localhost:3003
- Shipping Line API: http://localhost:3004

#### Troubleshooting

##### Port Already in Use
```bash
# Kill node processes
taskkill /F /IM node.exe
```

##### Network Won't Start
```bash
cd network
./network.sh down
docker system prune -f
./network.sh up
```

##### Check Docker Logs
```bash
docker logs orderer.coffee-export.com
docker logs peer0.commercialbank.coffee-export.com
```

#### Stopping the System

1. Press Ctrl+C in each terminal running APIs and frontend
2. Stop blockchain:
```bash
cd network
./network.sh down
```

#### Quick Restart (After First Setup)

If everything is already installed and you just want to restart:

```bash
# Terminal 1
cd network && ./network.sh up

# Terminal 2-5: Start APIs (in separate terminals)
cd api/commercialbank && npm run dev
cd api/national-bank && npm run dev
cd api/ncat && npm run dev
cd api/shipping-line && npm run dev

# Terminal 6: Start frontend
cd frontend && npm run dev
```

#### Notes

- IPFS is optional and not required for basic functionality
- The automated `start-system.sh` script is Linux-optimized and may not work properly on Windows
- Use this manual process for more control and better Windows compatibility

---

## System Architecture

```
┌────────────────────────────────────────────────────────────┐
│                     Frontend (Port 5173)                   │
│                    React + Vite Application                │
└────────────────────────┬───────────────────────────────────┘
                         │
         ┌───────���───────┴───────────────┐
         │                               │
┌────────▼────────┐              ┌──────▼──────────┐
│  API Services   │              │  API Services   │
├─────────────────┤              ├─────────────────┤
│ commercialbank   │              │ National Bank   │
│   (Port 3001)   │              │   (Port 3002)   │
├─────────────────┤              ├─────────────────┤
│      ECTA       │              │ Shipping Line   │
│   (Port 3003)   │              │   (Port 3004)   │
└────────┬────────┘              └────────┬────────┘
         │                                │
         └────────────┬───────────────────┘
                      │
         ┌────────────▼────────────┐
         │  Hyperledger Fabric     │
         │  Blockchain Network     │
         ├────────────���────────────┤
         │ • 1 Orderer Node        │
         │ • 4 Peer Nodes          │
         │ • 4 CouchDB Instances   │
         │ • 2 Chaincodes          │
         │   - coffee-export       │
         │   - user-management     │
         └─────────────────────────┘
```

---

## Port Reference

| Service | Port | URL |
|---------|------|-----|
| Frontend | 5173 | http://localhost:5173 |
| commercialbank API | 3001 | http://localhost:3001 |
| National Bank API | 3002 | http://localhost:3002 |
| ECTA API | 3003 | http://localhost:3003 |
| Shipping Line API | 3004 | http://localhost:3004 |
| Orderer | 7050 | - |
| Peer 0 (commercialbank) | 7051 | - |
| Peer 0 (National Bank) | 8051 | - |
| Peer 0 (ECTA) | 9051 | - |
| Peer 0 (Shipping Line) | 10051 | - |

---

## Startup Checklist

Use this checklist to ensure everything is running:

- [ ] Docker daemon is running
- [ ] Fabric network is up (5+ containers)
- [ ] Coffee-export chaincode deployed
- [ ] User-management chaincode deployed
- [ ] commercialbank API running (port 3001)
- [ ] National Bank API running (port 3002)
- [ ] ECTA API running (port 3003)
- [ ] Shipping Line API running (port 3004)
- [ ] Frontend running (port 5173)
- [ ] Can access frontend in browser
- [ ] Can login with test credentials
- [ ] Can create test export

---

## Common Issues & Solutions

### Port Already in Use

```bash
# Check what's using the port
lsof -i :3001

# Kill the process
kill $(lsof -t -i:3001)
```

### Docker Containers Not Starting

```bash
# Check Docker daemon
sudo systemctl status docker

# Restart Docker
sudo systemctl restart docker

# Check logs
docker logs <container_name>
```

### Chaincode Deployment Failed

```bash
cd /home/gu-da/CBC/network
./network.sh down
./network.sh up createChannel -c mychannel -ca
./network.sh deployCC -ccn coffee-export -ccp ../chaincode/coffee-export -ccl go
```

### API Cannot Connect to Fabric

```bash
# Check connection profile
ls -la /home/gu-da/CBC/network/organizations/peerOrganizations/

# Verify environment variables
cd /home/gu-da/CBC/api/commercialbank
cat .env | grep FABRIC
```

### Frontend Build Errors

```bash
cd /home/gu-da/CBC/frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## Stopping the System

### Stop All Services

```bash
# Stop API services
./scripts/stop-apis.sh

# Stop blockchain network
cd network
./network.sh down

# Stop IPFS
pkill ipfs

# Stop frontend
# Press Ctrl+C in the terminal running the frontend
```

### Clean Everything

```bash
# Remove all containers, volumes, and generated files
./scripts/clean.sh

# This will:
# - Stop all Docker containers
# - Remove volumes
# - Clean up generated crypto material
# - Remove wallet files
# - Clear logs
```

---

For detailed information, see README.md or other documentation files.

