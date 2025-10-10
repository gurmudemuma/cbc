# 🔧 Troubleshooting Guide

**Coffee Blockchain Consortium - Common Issues & Solutions**

---

## 🚨 Network Startup Issues

### Issue: Peer containers exit immediately with "cannot init crypto" error

**Symptoms:**
```
peer0.exporterbank.coffee-export.com  Exited (1)
Error: cannot init crypto specified path "/etc/hyperledger/fabric/msp" does not exist
```

**Cause:** Crypto material (certificates) not generated before starting network.

**Solution:**
```bash
cd /home/gu-da/CBC/network

# Generate certificates first
./scripts/generate-certs.sh

# Then start network
./network.sh up
```

**Or use the fixed start-system.sh:**
```bash
./start-system.sh --clean
```

---

### Issue: "Fabric binaries and docker images are out of sync" warning

**Symptoms:**
```
WARNING: Local fabric binaries and docker images are out of sync
LOCAL_VERSION=v2.5.0
DOCKER_IMAGE_VERSION=v2.5.13
```

**Cause:** Mismatch between installed Fabric binaries and Docker images.

**Solution 1 - Update binaries (Recommended):**
```bash
cd /home/gu-da/CBC
./scripts/install-fabric.sh
```

**Solution 2 - Use matching Docker images:**
Edit `/home/gu-da/CBC/network/docker/docker-compose.yml` and change image versions to match your binaries.

**Note:** This warning usually doesn't prevent the system from working, but it's best to keep versions in sync.

---

## 🐳 Docker Issues

### Issue: Port already in use

**Symptoms:**
```
⚠️ Warning: Port 3001 (Exporter Bank API) is already in use
```

**Solution:**
```bash
# Find process using the port
lsof -ti:3001

# Kill the process
lsof -ti:3001 | xargs kill -9

# Or kill all node processes
pkill -f node
```

---

### Issue: Docker daemon not running

**Symptoms:**
```
❌ Docker is not running
Cannot connect to the Docker daemon
```

**Solution:**
```bash
# Start Docker
sudo systemctl start docker

# Enable Docker to start on boot
sudo systemctl enable docker

# Check status
sudo systemctl status docker
```

---

### Issue: Permission denied accessing Docker

**Symptoms:**
```
permission denied while trying to connect to the Docker daemon socket
```

**Solution:**
```bash
# Add your user to docker group
sudo usermod -aG docker $USER

# Log out and log back in, or run:
newgrp docker

# Verify
docker ps
```

---

## 📦 Dependency Issues

### Issue: npm install fails

**Symptoms:**
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**Solution:**
```bash
cd /home/gu-da/CBC/api/exporter-bank  # or other service

# Clear cache
rm -rf node_modules package-lock.json
npm cache clean --force

# Reinstall
npm install --legacy-peer-deps
```

---

### Issue: Go module download fails

**Symptoms:**
```
go: module ... not found
```

**Solution:**
```bash
cd /home/gu-da/CBC/chaincode/coffee-export

# Clean and retry
go clean -modcache
go mod download
go mod tidy
```

---

## 🔗 Network Connectivity Issues

### Issue: API cannot connect to Fabric network

**Symptoms:**
```
Error: Failed to connect to Fabric network
Connection profile not found
```

**Solution:**
```bash
# Check if connection profiles exist
ls -la /home/gu-da/CBC/network/organizations/peerOrganizations/

# Regenerate connection profiles
cd /home/gu-da/CBC/network
./scripts/ccp-generate.sh

# Check if crypto material exists
ls -la /home/gu-da/CBC/network/organizations/peerOrganizations/exporterbank.coffee-export.com/
```

---

### Issue: Channel not found

**Symptoms:**
```
Error: channel 'coffeechannel' not found
```

**Solution:**
```bash
cd /home/gu-da/CBC/network

# Create channel
./network.sh createChannel

# Verify channel exists
docker exec peer0.exporterbank.coffee-export.com peer channel list
```

---

## 🔐 Chaincode Issues

### Issue: Chaincode not found or not approved

**Symptoms:**
```
Error: chaincode 'coffee-export' not found
Error: chaincode definition not agreed to by this org
```

**Solution:**
```bash
cd /home/gu-da/CBC/network

# Deploy chaincode
./network.sh deployCC -ccn coffee-export -ccp ../chaincode/coffee-export -ccl go

# Check installed chaincode
docker exec peer0.exporterbank.coffee-export.com peer lifecycle chaincode queryinstalled

# Check committed chaincode
docker exec peer0.exporterbank.coffee-export.com peer lifecycle chaincode querycommitted -C coffeechannel
```

---

### Issue: Chaincode deployment fails

**Symptoms:**
```
Error: failed to install chaincode
Error: proposal failed with status: 500
```

**Solution:**
```bash
# Check chaincode syntax
cd /home/gu-da/CBC/chaincode/coffee-export
go build

# Check Docker logs
docker logs peer0.exporterbank.coffee-export.com

# Try clean deployment
cd /home/gu-da/CBC/network
./network.sh down
./start-system.sh --clean
```

---

## 🌐 Frontend Issues

### Issue: Frontend won't start

**Symptoms:**
```
Error: Cannot find module 'vite'
Port 5173 already in use
```

**Solution:**
```bash
cd /home/gu-da/CBC/frontend

# Clear and reinstall
rm -rf node_modules package-lock.json
npm install

# If port is in use
lsof -ti:5173 | xargs kill -9

# Start frontend
npm run dev
```

---

### Issue: Frontend can't connect to API

**Symptoms:**
```
Network Error
CORS error
Failed to fetch
```

**Solution:**
```bash
# Check API is running
curl http://localhost:3001/health

# Check frontend .env file
cat /home/gu-da/CBC/frontend/.env

# Ensure VITE_API_URL is correct
# Should be: VITE_API_URL=http://localhost:3001

# Restart frontend
cd /home/gu-da/CBC/frontend
npm run dev
```

---

## 💾 IPFS Issues

### Issue: IPFS daemon won't start

**Symptoms:**
```
Error: lock /home/user/.ipfs/repo.lock: someone else has the lock
```

**Solution:**
```bash
# Kill existing IPFS process
pkill -f 'ipfs daemon'

# Remove lock file
rm -f ~/.ipfs/repo.lock

# Start IPFS
ipfs daemon
```

---

### Issue: IPFS not initialized

**Symptoms:**
```
Error: no IPFS repo found in /home/user/.ipfs
```

**Solution:**
```bash
# Initialize IPFS
ipfs init

# Start daemon
ipfs daemon
```

---

## 🔄 Complete System Reset

### When nothing else works:

```bash
cd /home/gu-da/CBC

# Stop everything
pkill -f node
pkill -f ipfs
cd network && ./network.sh down

# Clean everything
rm -rf network/organizations/peerOrganizations
rm -rf network/organizations/ordererOrganizations
rm -rf network/channel-artifacts
rm -rf network/system-genesis-block
rm -rf network/*.tar.gz
rm -rf api/*/wallet/*
rm -rf api/*/node_modules
rm -rf frontend/node_modules
docker system prune -af --volumes

# Fresh start
./start-system.sh --clean
```

---

## 📋 Diagnostic Commands

### Check System Status

```bash
# Docker containers
docker ps -a

# Network connectivity
docker network ls
docker network inspect coffee-export-network

# Peer logs
docker logs peer0.exporterbank.coffee-export.com
docker logs orderer.coffee-export.com

# API logs
tail -f /home/gu-da/CBC/logs/*.log

# Check ports
netstat -tuln | grep LISTEN
lsof -i -P -n | grep LISTEN
```

### Check Blockchain State

```bash
# Channel info
docker exec peer0.exporterbank.coffee-export.com peer channel getinfo -c coffeechannel

# Installed chaincode
docker exec peer0.exporterbank.coffee-export.com peer lifecycle chaincode queryinstalled

# Committed chaincode
docker exec peer0.exporterbank.coffee-export.com peer lifecycle chaincode querycommitted -C coffeechannel

# Query chaincode
docker exec peer0.exporterbank.coffee-export.com peer chaincode query \
  -C coffeechannel \
  -n coffee-export \
  -c '{"function":"GetAllExports","Args":[]}'
```

---

## 🆘 Emergency Recovery

### Scenario: Everything is broken

```bash
# 1. Stop all processes
pkill -9 -f node
pkill -9 -f ipfs
docker stop $(docker ps -aq)
docker rm $(docker ps -aq)

# 2. Clean Docker
docker system prune -af --volumes
docker network prune -f

# 3. Remove all generated files
cd /home/gu-da/CBC
rm -rf network/organizations/peerOrganizations
rm -rf network/organizations/ordererOrganizations
rm -rf network/channel-artifacts
rm -rf network/system-genesis-block
rm -rf network/*.tar.gz
rm -rf api/*/wallet/*
rm -rf logs/*

# 4. Reinstall dependencies
for dir in api/exporter-bank api/national-bank api/ncat api/shipping-line frontend; do
  cd /home/gu-da/CBC/$dir
  rm -rf node_modules package-lock.json
  npm install
done

# 5. Fresh start
cd /home/gu-da/CBC
./start-system.sh --clean
```

---

## 📞 Getting More Help

### Check Logs

```bash
# All logs
tail -f /home/gu-da/CBC/logs/*.log

# Specific service
tail -f /home/gu-da/CBC/logs/exporter-bank.log

# Docker logs
docker logs -f peer0.exporterbank.coffee-export.com
docker logs -f orderer.coffee-export.com
```

### Verify Configuration

```bash
# Run validation scripts
cd /home/gu-da/CBC
./scripts/verify-setup.sh
./scripts/validate-config.sh
./scripts/security-validation.sh
```

### Check Documentation

```bash
# List all documentation
ls -la /home/gu-da/CBC/*.md

# Read specific guides
cat /home/gu-da/CBC/START_HERE.md
cat /home/gu-da/CBC/COMPLETE_STARTUP_GUIDE.md
cat /home/gu-da/CBC/WHAT_STARTS.md
```

---

## 💡 Prevention Tips

1. **Always use `--clean` flag** when you want a fresh start
2. **Check logs immediately** when something fails
3. **Verify prerequisites** before starting (Docker, Node.js, Go, IPFS)
4. **Keep versions in sync** (Fabric binaries and Docker images)
5. **Don't skip dependency installation** unless you're sure they're up to date
6. **Monitor resource usage** (RAM, disk space, CPU)
7. **Use tmux or screen** to keep services running in background
8. **Regular backups** of important data (wallets, configurations)

---

## 🔍 Common Error Messages

| Error Message | Likely Cause | Solution |
|---------------|--------------|----------|
| "cannot init crypto" | Missing certificates | Run `./scripts/generate-certs.sh` |
| "port already in use" | Service already running | Kill process on that port |
| "channel not found" | Channel not created | Run `./network.sh createChannel` |
| "chaincode not found" | Chaincode not deployed | Run `./network.sh deployCC` |
| "connection refused" | Service not running | Start the service |
| "permission denied" | Docker permissions | Add user to docker group |
| "ENOSPC" | Disk space full | Free up disk space |
| "ENOMEM" | Out of memory | Close other applications |

---

**Last Updated:** January 2024  
**Version:** 1.0.0

*For more help, check the complete documentation in the project root.*
