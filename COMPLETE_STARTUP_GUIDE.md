# 🚀 Complete System Startup Guide

**Coffee Blockchain Consortium - Full System Startup**

This guide will walk you through starting the entire CBC system from scratch.

---

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- [ ] Docker installed and running
- [ ] Docker Compose installed
- [ ] Node.js (v16+) and npm installed
- [ ] Go (v1.20+) installed
- [ ] At least 8GB RAM available
- [ ] At least 20GB disk space available
- [ ] Ports available: 3000-3004, 5173, 7050-7054, 9050-9054

---

## 🎯 Quick Start (Recommended)

### Option 1: Automated Startup Script

```bash
# Make the script executable
chmod +x start-system.sh

# Start everything
./start-system.sh
```

This will automatically:
1. Start the Fabric network
2. Deploy chaincode
3. Start all API services
4. Start the frontend
5. Display access URLs

---

## 📝 Manual Step-by-Step Startup

If you prefer manual control or the automated script fails, follow these steps:

---

## STEP 1: Prepare the Environment

### 1.1 Navigate to Project Root
```bash
cd /home/gu-da/CBC
```

### 1.2 Verify Prerequisites
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
netstat -tuln | grep -E ':(3000|3001|3002|3003|5173|7050|9050)'
```

### 1.3 Clean Previous Runs (if any)
```bash
# Stop any running containers
docker stop $(docker ps -aq) 2>/dev/null
docker rm $(docker ps -aq) 2>/dev/null

# Clean Docker volumes (optional, removes all data)
# docker volume prune -f

# Kill any Node processes on our ports
pkill -f "node.*3000" 2>/dev/null
pkill -f "node.*3001" 2>/dev/null
pkill -f "node.*3002" 2>/dev/null
pkill -f "node.*3003" 2>/dev/null
pkill -f "vite" 2>/dev/null
```

---

## STEP 2: Start Hyperledger Fabric Network

### 2.1 Navigate to Network Directory
```bash
cd /home/gu-da/CBC/network
```

### 2.2 Start the Network
```bash
# Start the network with channel creation
./network.sh up createChannel -c mychannel -ca

# This will:
# - Start orderer nodes
# - Start peer nodes for all organizations
# - Create the channel
# - Join peers to the channel
```

**Expected Output:**
```
✅ Network started successfully
✅ Channel 'mychannel' created
✅ Peers joined to channel
```

**Wait Time:** ~2-3 minutes

### 2.3 Verify Network is Running
```bash
docker ps

# You should see containers for:
# - orderer.example.com
# - peer0.org1.example.com
# - peer0.org2.example.com
# - ca_org1
# - ca_org2
```

---

## STEP 3: Deploy Chaincode

### 3.1 Deploy Coffee Export Chaincode
```bash
cd /home/gu-da/CBC/network

# Package, install, approve, and commit the chaincode
./network.sh deployCC -ccn coffee-export -ccp ../chaincode/coffee-export -ccl go

# This will:
# - Package the chaincode
# - Install on all peers
# - Approve for all organizations
# - Commit to the channel
```

**Expected Output:**
```
✅ Chaincode packaged
✅ Chaincode installed on peers
✅ Chaincode approved by organizations
✅ Chaincode committed to channel
✅ Chaincode definition committed
```

**Wait Time:** ~3-5 minutes

### 3.2 Deploy User Management Chaincode
```bash
./network.sh deployCC -ccn user-management -ccp ../chaincode/user-management -ccl go
```

**Wait Time:** ~3-5 minutes

### 3.3 Verify Chaincode Deployment
```bash
# Check installed chaincode
docker exec peer0.org1.example.com peer lifecycle chaincode queryinstalled

# Check committed chaincode
docker exec peer0.org1.example.com peer lifecycle chaincode querycommitted -C mychannel
```

---

## STEP 4: Install API Dependencies

### 4.1 Install Exporter Bank API Dependencies
```bash
cd /home/gu-da/CBC/api/exporter-bank
npm install
```

### 4.2 Install National Bank API Dependencies
```bash
cd /home/gu-da/CBC/api/national-bank
npm install
```

### 4.3 Install NCAT API Dependencies
```bash
cd /home/gu-da/CBC/api/ncat
npm install
```

### 4.4 Install Shipping Line API Dependencies
```bash
cd /home/gu-da/CBC/api/shipping-line
npm install
```

**Total Wait Time:** ~5-10 minutes (all combined)

---

## STEP 5: Start API Services

**Important:** Open 4 separate terminal windows/tabs for this step.

### Terminal 1: Exporter Bank API
```bash
cd /home/gu-da/CBC/api/exporter-bank
npm run dev
```

**Expected Output:**
```
🚀 Exporter Bank API running on port 3000
✅ Connected to Fabric Network
```

### Terminal 2: National Bank API
```bash
cd /home/gu-da/CBC/api/national-bank
npm run dev
```

**Expected Output:**
```
🚀 National Bank API running on port 3001
✅ Connected to Fabric Network
```

### Terminal 3: NCAT API
```bash
cd /home/gu-da/CBC/api/ncat
npm run dev
```

**Expected Output:**
```
🚀 NCAT API running on port 3002
✅ Connected to Fabric Network
```

### Terminal 4: Shipping Line API
```bash
cd /home/gu-da/CBC/api/shipping-line
npm run dev
```

**Expected Output:**
```
🚀 Shipping Line API running on port 3003
✅ Connected to Fabric Network
```

**Wait Time:** ~30 seconds per service

---

## STEP 6: Install Frontend Dependencies

### 6.1 Navigate to Frontend Directory
```bash
cd /home/gu-da/CBC/frontend
```

### 6.2 Install Dependencies
```bash
npm install
```

**Wait Time:** ~2-3 minutes

---

## STEP 7: Start Frontend Application

### Terminal 5: Frontend (New Terminal)
```bash
cd /home/gu-da/CBC/frontend
npm run dev
```

**Expected Output:**
```
VITE v4.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**Wait Time:** ~10 seconds

---

## STEP 8: Verify System is Running

### 8.1 Check All Services
```bash
# Check Fabric Network
docker ps | grep -E "peer|orderer|ca"

# Check API Services
curl http://localhost:3000/health
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health

# Check Frontend
curl http://localhost:5173
```

### 8.2 Access the System

Open your browser and navigate to:

**Frontend Application:**
```
http://localhost:5173
```

**API Endpoints:**
- Exporter Bank: `http://localhost:3000`
- National Bank: `http://localhost:3001`
- NCAT: `http://localhost:3002`
- Shipping Line: `http://localhost:3003`

---

## STEP 9: Initial System Setup

### 9.1 Create Test Users

**Terminal 6: Create Users (New Terminal)**
```bash
cd /home/gu-da/CBC

# Create Exporter Bank user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "exporter1",
    "password": "password123",
    "email": "exporter1@example.com",
    "role": "exporter"
  }'

# Create National Bank user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "banker1",
    "password": "password123",
    "email": "banker1@example.com",
    "role": "banker"
  }'

# Create NCAT user
curl -X POST http://localhost:3002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "inspector1",
    "password": "password123",
    "email": "inspector1@example.com",
    "role": "inspector"
  }'

# Create Shipping Line user
curl -X POST http://localhost:3003/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "shipper1",
    "password": "password123",
    "email": "shipper1@example.com",
    "role": "shipper"
  }'
```

### 9.2 Login to Frontend

1. Open browser to `http://localhost:5173`
2. Select organization: **Exporter Bank**
3. Username: `exporter1`
4. Password: `password123`
5. Click **Sign In**

---

## STEP 10: Test the System

### 10.1 Create a Test Export

**Via Frontend:**
1. Navigate to "Create Export" page
2. Fill in the form:
   - Exporter Name: Test Coffee Exporters
   - Coffee Type: Arabica Premium
   - Quantity: 5000 kg
   - Destination: United States
   - Estimated Value: $75,000
3. Click "Create Export"

**Via API:**
```bash
# Get auth token first
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"exporter1","password":"password123"}' \
  | jq -r '.data.token')

# Create export
curl -X POST http://localhost:3000/api/exports \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "exporterName": "Test Coffee Exporters",
    "coffeeType": "Arabica Premium",
    "quantity": 5000,
    "destinationCountry": "United States",
    "estimatedValue": 75000
  }'
```

### 10.2 Verify Export Creation

```bash
# List all exports
curl -X GET http://localhost:3000/api/exports \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📊 System Status Dashboard

After startup, you should have:

| Component | Status | URL | Port |
|-----------|--------|-----|------|
| Fabric Network | ✅ Running | - | 7050-7054 |
| Exporter Bank API | ✅ Running | http://localhost:3000 | 3000 |
| National Bank API | ✅ Running | http://localhost:3001 | 3001 |
| NCAT API | ✅ Running | http://localhost:3002 | 3002 |
| Shipping Line API | ✅ Running | http://localhost:3003 | 3003 |
| Frontend | ✅ Running | http://localhost:5173 | 5173 |

---

## 🔧 Troubleshooting

### Issue: Port Already in Use

```bash
# Find process using port
lsof -i :3000  # Replace with your port

# Kill the process
kill -9 <PID>
```

### Issue: Docker Containers Not Starting

```bash
# Check Docker daemon
sudo systemctl status docker

# Restart Docker
sudo systemctl restart docker

# Check logs
docker logs <container_name>
```

### Issue: Chaincode Deployment Failed

```bash
# Clean and restart
cd /home/gu-da/CBC/network
./network.sh down
./network.sh up createChannel -c mychannel -ca
./network.sh deployCC -ccn coffee-export -ccp ../chaincode/coffee-export -ccl go
```

### Issue: API Cannot Connect to Fabric

```bash
# Check connection profile
ls -la /home/gu-da/CBC/network/organizations/peerOrganizations/

# Verify environment variables
cd /home/gu-da/CBC/api/exporter-bank
cat .env | grep FABRIC
```

### Issue: Frontend Build Errors

```bash
cd /home/gu-da/CBC/frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## 🛑 Stopping the System

### Stop All Services Gracefully

**Terminal Commands:**
1. Press `Ctrl+C` in each terminal running API services
2. Press `Ctrl+C` in the terminal running frontend
3. Stop Fabric network:

```bash
cd /home/gu-da/CBC/network
./network.sh down
```

### Complete Cleanup (Remove All Data)

```bash
cd /home/gu-da/CBC/network
./network.sh down

# Remove all Docker containers and volumes
docker stop $(docker ps -aq)
docker rm $(docker ps -aq)
docker volume prune -f
docker network prune -f

# Kill any remaining Node processes
pkill -f node
```

---

## 📝 Startup Checklist

Use this checklist to ensure everything is running:

- [ ] Docker daemon is running
- [ ] Fabric network is up (5+ containers)
- [ ] Coffee-export chaincode deployed
- [ ] User-management chaincode deployed
- [ ] Exporter Bank API running (port 3000)
- [ ] National Bank API running (port 3001)
- [ ] NCAT API running (port 3002)
- [ ] Shipping Line API running (port 3003)
- [ ] Frontend running (port 5173)
- [ ] Can access frontend in browser
- [ ] Can login with test credentials
- [ ] Can create test export

---

## 🎯 Quick Commands Reference

### Start Everything
```bash
# Automated
./start-system.sh

# Manual
cd network && ./network.sh up createChannel -c mychannel -ca
cd network && ./network.sh deployCC -ccn coffee-export -ccp ../chaincode/coffee-export -ccl go
cd api/exporter-bank && npm run dev &
cd api/national-bank && npm run dev &
cd api/ncat && npm run dev &
cd api/shipping-line && npm run dev &
cd frontend && npm run dev
```

### Stop Everything
```bash
# Stop Fabric
cd network && ./network.sh down

# Kill Node processes
pkill -f node
```

### Check Status
```bash
# Docker containers
docker ps

# API health
curl http://localhost:3000/health
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health

# Frontend
curl http://localhost:5173
```

---

## 📚 Next Steps After Startup

1. **Explore the Frontend**
   - Navigate through all pages
   - Test export creation workflow
   - View export history
   - Check dashboard statistics

2. **Test API Endpoints**
   - Review `postman-collection.json`
   - Import into Postman
   - Test all endpoints

3. **Monitor System**
   - Check Docker logs: `docker logs -f <container_name>`
   - Check API logs in terminal windows
   - Monitor resource usage: `docker stats`

4. **Read Documentation**
   - `README.md` - Project overview
   - `MASTER_INDEX.md` - Documentation hub
   - `NEW_FEATURES_README.md` - Feature guides
   - `DEVELOPER_NOTES.md` - Development tips

---

## ⏱️ Total Startup Time

| Phase | Time |
|-------|------|
| Fabric Network | 2-3 minutes |
| Chaincode Deployment | 6-10 minutes |
| API Dependencies | 5-10 minutes |
| API Startup | 2 minutes |
| Frontend Dependencies | 2-3 minutes |
| Frontend Startup | 10 seconds |
| **Total** | **17-28 minutes** |

*Note: Times are approximate and depend on your system specifications.*

---

## 🎉 Success Indicators

You'll know the system is fully operational when:

✅ All Docker containers are running  
✅ All API services respond to health checks  
✅ Frontend loads in browser  
✅ You can login successfully  
✅ You can create and view exports  
✅ No error messages in any terminal  

---

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review logs in terminal windows
3. Check `DEVELOPER_NOTES.md` for common issues
4. Review `network/log.txt` for Fabric network logs

---

**System Ready! 🚀**

Your Coffee Blockchain Consortium system is now fully operational and ready for use.

---

*Last Updated: January 2024*
