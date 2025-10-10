# ⚡ Quick Start Commands Reference

**Coffee Blockchain Consortium - Essential Commands**

---

## 🚀 Starting the System

### Automated Start (Recommended)
```bash
cd /home/gu-da/CBC
./start-system.sh
```

### Clean Start (Remove all data)
```bash
./start-system.sh --clean
```

### Skip Dependencies Installation
```bash
./start-system.sh --skip-deps
```

---

## 🛑 Stopping the System

### Stop All Services
```bash
# Stop APIs and Frontend
tmux kill-session -t cbc-apis
tmux kill-session -t cbc-frontend
pkill -f 'ipfs daemon'

# Stop Blockchain Network
cd /home/gu-da/CBC/network
./network.sh down
```

### Quick Stop (Kill all)
```bash
pkill -f 'npm run dev'
pkill -f 'ipfs daemon'
cd /home/gu-da/CBC/network && ./network.sh down
```

---

## 📊 Checking Status

### Check All Services
```bash
# Docker containers
docker ps

# API Services
curl http://localhost:3001/health  # Exporter Bank
curl http://localhost:3002/health  # National Bank
curl http://localhost:3003/health  # NCAT
curl http://localhost:3004/health  # Shipping Line

# Frontend
curl http://localhost:5173

# IPFS
curl http://localhost:5001/api/v0/version
```

### Check Ports
```bash
netstat -tuln | grep -E ':(3001|3002|3003|3004|5173|5001)'
```

### Check Processes
```bash
ps aux | grep -E 'node|ipfs|peer|orderer'
```

---

## 📝 View Logs

### Using tmux
```bash
# View API logs
tmux attach-session -t cbc-apis

# View Frontend logs
tmux attach-session -t cbc-frontend

# Detach from tmux: Ctrl+B, then D
```

### Using log files
```bash
# All logs
tail -f /home/gu-da/CBC/logs/*.log

# Specific service
tail -f /home/gu-da/CBC/logs/exporter-bank.log
tail -f /home/gu-da/CBC/logs/national-bank.log
tail -f /home/gu-da/CBC/logs/ncat.log
tail -f /home/gu-da/CBC/logs/shipping-line.log
tail -f /home/gu-da/CBC/logs/frontend.log
tail -f /home/gu-da/CBC/logs/ipfs.log

# Docker logs
docker logs -f peer0.exporterbank.coffee-export.com
docker logs -f orderer.coffee-export.com
```

---

## 👤 User Management

### Register New User
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "Test123!@#",
    "email": "test@example.com",
    "organizationId": "exporter",
    "role": "exporter"
  }'
```

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "Test123!@#"
  }'
```

### Get Token (for API calls)
```bash
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"Test123!@#"}' \
  | jq -r '.data.token')

echo $TOKEN
```

---

## 📦 Export Management

### Create Export
```bash
curl -X POST http://localhost:3001/api/exports \
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

### Get All Exports
```bash
curl -X GET http://localhost:3001/api/exports \
  -H "Authorization: Bearer $TOKEN"
```

### Get Export by ID
```bash
curl -X GET http://localhost:3001/api/exports/EXP-xxxxx \
  -H "Authorization: Bearer $TOKEN"
```

### Get Export History
```bash
curl -X GET http://localhost:3001/api/exports/EXP-xxxxx/history \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔧 Blockchain Operations

### Query Chaincode
```bash
# Query all exports
docker exec peer0.exporterbank.coffee-export.com peer chaincode query \
  -C coffeechannel \
  -n coffee-export \
  -c '{"function":"GetAllExports","Args":[]}'

# Query specific export
docker exec peer0.exporterbank.coffee-export.com peer chaincode query \
  -C coffeechannel \
  -n coffee-export \
  -c '{"function":"GetExportRequest","Args":["EXP-xxxxx"]}'
```

### Invoke Chaincode
```bash
docker exec peer0.exporterbank.coffee-export.com peer chaincode invoke \
  -C coffeechannel \
  -n coffee-export \
  -c '{"function":"CreateExportRequest","Args":["EXP-001","BANK-001","Test Exporter","Arabica","5000","USA","75000"]}'
```

### Check Installed Chaincode
```bash
docker exec peer0.exporterbank.coffee-export.com peer lifecycle chaincode queryinstalled
```

### Check Committed Chaincode
```bash
docker exec peer0.exporterbank.coffee-export.com peer lifecycle chaincode querycommitted -C coffeechannel
```

---

## 🐳 Docker Commands

### View All Containers
```bash
docker ps -a
```

### View Container Logs
```bash
docker logs <container_name>
docker logs -f <container_name>  # Follow logs
```

### Restart Container
```bash
docker restart <container_name>
```

### Remove All Containers
```bash
docker stop $(docker ps -aq)
docker rm $(docker ps -aq)
```

### Clean Docker System
```bash
docker system prune -a --volumes
```

---

## 🌐 Access URLs

| Service | URL | Port |
|---------|-----|------|
| Frontend | http://localhost:5173 | 5173 |
| Exporter Bank API | http://localhost:3001 | 3001 |
| National Bank API | http://localhost:3002 | 3002 |
| NCAT API | http://localhost:3003 | 3003 |
| Shipping Line API | http://localhost:3004 | 3004 |
| IPFS API | http://localhost:5001 | 5001 |
| IPFS Gateway | http://localhost:8080 | 8080 |

---

## 🔍 Debugging

### Check Network Connectivity
```bash
# Ping peer
docker exec peer0.exporterbank.coffee-export.com ping -c 3 orderer.coffee-export.com

# Check DNS resolution
docker exec peer0.exporterbank.coffee-export.com nslookup orderer.coffee-export.com
```

### Check Fabric Network
```bash
# Check channel
docker exec peer0.exporterbank.coffee-export.com peer channel list

# Get channel info
docker exec peer0.exporterbank.coffee-export.com peer channel getinfo -c coffeechannel
```

### Check API Connection to Fabric
```bash
# Test connection profile
cat /home/gu-da/CBC/network/organizations/peerOrganizations/exporterbank.coffee-export.com/connection-exporterbank.json

# Check wallet
ls -la /home/gu-da/CBC/api/exporter-bank/wallet/
```

### Check Environment Variables
```bash
# API environment
cat /home/gu-da/CBC/api/exporter-bank/.env

# Frontend environment
cat /home/gu-da/CBC/frontend/.env
```

---

## 🧪 Testing

### Run API Tests
```bash
cd /home/gu-da/CBC/api/exporter-bank
npm test
```

### Run Specific Test
```bash
npm test -- auth.test.ts
```

### Run Tests with Coverage
```bash
npm test -- --coverage
```

---

## 📦 Package Management

### Install Dependencies
```bash
# All APIs
for api in exporter-bank national-bank ncat shipping-line; do
  cd /home/gu-da/CBC/api/$api && npm install
done

# Frontend
cd /home/gu-da/CBC/frontend && npm install
```

### Update Dependencies
```bash
npm update
```

### Check for Outdated Packages
```bash
npm outdated
```

---

## 🔄 Restart Individual Services

### Restart API Service
```bash
# Find and kill process
lsof -ti:3001 | xargs kill -9

# Restart
cd /home/gu-da/CBC/api/exporter-bank
npm run dev
```

### Restart Frontend
```bash
# Find and kill process
lsof -ti:5173 | xargs kill -9

# Restart
cd /home/gu-da/CBC/frontend
npm run dev
```

### Restart IPFS
```bash
pkill -f 'ipfs daemon'
ipfs daemon &
```

### Restart Blockchain Network
```bash
cd /home/gu-da/CBC/network
./network.sh down
./network.sh up
```

---

## 📊 Monitoring

### Check System Resources
```bash
# Docker stats
docker stats

# System resources
htop  # or top

# Disk usage
df -h
du -sh /home/gu-da/CBC/*
```

### Check Network Traffic
```bash
# Monitor port
sudo tcpdump -i any port 3001

# Monitor all HTTP traffic
sudo tcpdump -i any port 80 or port 3001 or port 3002
```

---

## 🔐 Security

### Generate New JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Check Open Ports
```bash
sudo netstat -tuln | grep LISTEN
```

### Check Firewall Status
```bash
sudo ufw status
```

---

## 📚 Documentation

### View Documentation
```bash
# Main README
cat /home/gu-da/CBC/README.md

# Complete startup guide
cat /home/gu-da/CBC/COMPLETE_STARTUP_GUIDE.md

# Master index
cat /home/gu-da/CBC/MASTER_INDEX.md

# Features
cat /home/gu-da/CBC/NEW_FEATURES_README.md
```

### Open in Browser
```bash
# If you have a markdown viewer
mdless /home/gu-da/CBC/README.md
```

---

## 🆘 Emergency Commands

### Complete System Reset
```bash
cd /home/gu-da/CBC
./start-system.sh --clean
```

### Force Stop Everything
```bash
pkill -9 -f node
pkill -9 -f ipfs
docker stop $(docker ps -aq)
docker rm $(docker ps -aq)
```

### Clean and Restart
```bash
cd /home/gu-da/CBC/network
./network.sh down
docker system prune -f
./start-system.sh --clean
```

---

## 💡 Tips & Tricks

### Run in Background
```bash
# Using nohup
nohup ./start-system.sh > startup.log 2>&1 &

# Using screen
screen -S cbc
./start-system.sh
# Detach: Ctrl+A, then D
# Reattach: screen -r cbc
```

### Create Aliases
```bash
# Add to ~/.bashrc
alias cbc-start='cd /home/gu-da/CBC && ./start-system.sh'
alias cbc-stop='cd /home/gu-da/CBC/network && ./network.sh down && pkill -f node && pkill -f ipfs'
alias cbc-logs='tail -f /home/gu-da/CBC/logs/*.log'
alias cbc-status='docker ps && netstat -tuln | grep -E ":(3001|3002|3003|3004|5173)"'

# Reload
source ~/.bashrc
```

### Quick Health Check Script
```bash
#!/bin/bash
echo "=== System Health Check ==="
echo "Docker: $(docker ps | wc -l) containers"
echo "APIs: $(netstat -tuln | grep -E ':(3001|3002|3003|3004)' | wc -l)/4"
echo "Frontend: $(netstat -tuln | grep ':5173' | wc -l)/1"
echo "IPFS: $(netstat -tuln | grep ':5001' | wc -l)/1"
```

---

## 📞 Getting Help

### Check Logs First
```bash
tail -f /home/gu-da/CBC/logs/*.log
```

### Review Documentation
```bash
ls -la /home/gu-da/CBC/*.md
```

### Check System Status
```bash
docker ps
netstat -tuln | grep LISTEN
ps aux | grep node
```

---

**Quick Reference Card - Keep this handy!** 📋

*Last Updated: January 2024*
