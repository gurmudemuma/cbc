# 🎯 START HERE - Coffee Blockchain Consortium

**Welcome! This is your starting point for the CBC system.**

---

## ⚡ Quick Start (5 Minutes)

### Step 1: Make Script Executable
```bash
cd /home/gu-da/CBC
chmod +x start-system.sh
```

### Step 2: Start Everything
```bash
./start-system.sh
```

### Step 3: Access the System
Open your browser to: **http://localhost:5173**

**Default Login:**
- Organization: Exporter Bank
- Username: `testuser`
- Password: `Test123!@#`

---

## 📚 Essential Documentation

| Document | Purpose | When to Read |
|----------|---------|--------------|
| **WHAT_STARTS.md** | What start-system.sh does | Before first run |
| **COMPLETE_STARTUP_GUIDE.md** | Detailed startup instructions | If automated script fails |
| **QUICK_START_COMMANDS.md** | Command reference | Daily operations |
| **INCOMPLETE_TASKS_COMPLETED.md** | What was completed | Understanding the codebase |
| **README.md** | Project overview | Understanding the project |
| **MASTER_INDEX.md** | Documentation hub | Finding specific docs |

---

## 🎯 What You Need to Know

### System Components

1. **Blockchain Network** (Hyperledger Fabric)
   - 4 Organizations: Exporter Bank, National Bank, NCAT, Shipping Line
   - 2 Chaincodes: coffee-export, user-management
   - Channel: coffeechannel

2. **API Services** (4 Node.js/TypeScript services)
   - Exporter Bank API: Port 3001
   - National Bank API: Port 3002
   - NCAT API: Port 3003
   - Shipping Line API: Port 3004

3. **Frontend** (React/TypeScript)
   - Port: 5173
   - Multi-organization portal

4. **IPFS** (Document Storage)
   - API Port: 5001
   - Gateway Port: 8080

### Startup Time
- **First time:** 20-30 minutes (includes dependency installation)
- **Subsequent starts:** 5-10 minutes

---

## 🚀 Startup Options

### Option 1: Automated (Recommended)
```bash
./start-system.sh
```
✅ Starts everything automatically  
✅ Checks prerequisites  
✅ Handles errors gracefully  

### Option 2: Clean Start
```bash
./start-system.sh --clean
```
✅ Removes all previous data  
✅ Fresh blockchain network  
✅ Clean wallets and certificates  

### Option 3: Manual Start
Follow: **COMPLETE_STARTUP_GUIDE.md**

---

## 🛑 Stopping the System

### Quick Stop
```bash
# Stop APIs and Frontend
tmux kill-session -t cbc-apis
tmux kill-session -t cbc-frontend
pkill -f 'ipfs daemon'

# Stop Blockchain
cd /home/gu-da/CBC/network
./network.sh down
```

### Alternative (if not using tmux)
```bash
pkill -f 'npm run dev'
pkill -f 'ipfs daemon'
cd /home/gu-da/CBC/network && ./network.sh down
```

---

## 📊 Checking Status

### Quick Check
```bash
# All services
docker ps
netstat -tuln | grep -E ':(3001|3002|3003|3004|5173)'

# Health endpoints
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3004/health
```

### View Logs
```bash
# Using tmux
tmux attach-session -t cbc-apis      # APIs
tmux attach-session -t cbc-frontend  # Frontend

# Using log files
tail -f /home/gu-da/CBC/logs/*.log
```

---

## 🎓 Learning Path

### Day 1: Get Started
1. ✅ Run `./start-system.sh`
2. ✅ Access frontend at http://localhost:5173
3. ✅ Create a test export
4. ✅ View export history

### Day 2: Explore APIs
1. ✅ Read **QUICK_START_COMMANDS.md**
2. ✅ Test API endpoints with curl
3. ✅ Import Postman collection
4. ✅ Create users for all organizations

### Day 3: Understand Architecture
1. ✅ Read **README.md**
2. ✅ Review **ARCHITECTURE.md**
3. ✅ Explore chaincode in `/chaincode`
4. ✅ Review API code in `/api`

### Week 2: Development
1. ✅ Read **DEVELOPER_NOTES.md**
2. ✅ Run tests: `npm test`
3. ✅ Make code changes
4. ✅ Test your changes

---

## 🔧 Common Issues & Solutions

### Issue: Port Already in Use
```bash
# Find and kill process
lsof -ti:3001 | xargs kill -9
```

### Issue: Docker Not Running
```bash
sudo systemctl start docker
```

### Issue: Chaincode Deployment Failed
```bash
cd /home/gu-da/CBC/network
./network.sh down
./start-system.sh --clean
```

### Issue: API Can't Connect to Fabric
```bash
# Check connection profile exists
ls -la /home/gu-da/CBC/network/organizations/peerOrganizations/

# Regenerate if missing
cd /home/gu-da/CBC/network
./scripts/ccp-generate.sh
```

### Issue: Frontend Won't Start
```bash
cd /home/gu-da/CBC/frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## 📦 System Requirements

### Minimum
- **OS:** Linux (Ubuntu 20.04+)
- **RAM:** 8GB
- **Disk:** 20GB free
- **CPU:** 4 cores

### Recommended
- **OS:** Linux (Ubuntu 22.04)
- **RAM:** 16GB
- **Disk:** 50GB free
- **CPU:** 8 cores

### Software
- Docker 20.10+
- Docker Compose 1.29+
- Node.js 16+
- npm 8+
- Go 1.20+
- IPFS 0.18+

---

## 🎯 First-Time Setup Checklist

- [ ] Clone repository
- [ ] Install prerequisites (Docker, Node.js, Go, IPFS)
- [ ] Make start script executable: `chmod +x start-system.sh`
- [ ] Run startup script: `./start-system.sh`
- [ ] Wait for all services to start (~20-30 min first time)
- [ ] Access frontend: http://localhost:5173
- [ ] Create test user
- [ ] Login and explore
- [ ] Create test export
- [ ] View export history
- [ ] Check all documentation

---

## 📞 Getting Help

### 1. Check Documentation
```bash
ls -la /home/gu-da/CBC/*.md
```

### 2. Check Logs
```bash
tail -f /home/gu-da/CBC/logs/*.log
docker logs <container_name>
```

### 3. Check System Status
```bash
docker ps
netstat -tuln | grep LISTEN
```

### 4. Review Troubleshooting
See **COMPLETE_STARTUP_GUIDE.md** → Troubleshooting section

---

## 🎉 Success Indicators

You'll know everything is working when:

✅ `docker ps` shows 10+ containers  
✅ All health endpoints respond (3001-3004)  
✅ Frontend loads at http://localhost:5173  
✅ You can login successfully  
✅ You can create and view exports  
✅ No errors in logs  

---

## 🚀 Next Steps After Startup

### Immediate (First Hour)
1. Explore the frontend interface
2. Create test exports
3. View export history
4. Test different user roles

### Short-term (First Day)
1. Test API endpoints with curl
2. Import Postman collection
3. Review chaincode functions
4. Understand the workflow

### Medium-term (First Week)
1. Read all documentation
2. Run test suites
3. Understand architecture
4. Make small code changes

### Long-term (First Month)
1. Deploy to staging
2. Conduct integration testing
3. Set up monitoring
4. Plan production deployment

---

## 📋 Quick Command Reference

### Start System
```bash
./start-system.sh
```

### Stop System
```bash
cd network && ./network.sh down
pkill -f node
pkill -f ipfs
```

### Check Status
```bash
docker ps
curl http://localhost:3001/health
```

### View Logs
```bash
tail -f logs/*.log
```

### Create User
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"Test123!@#","email":"test@example.com","organizationId":"exporter","role":"exporter"}'
```

---

## 🎓 Documentation Map

```
START_HERE.md (You are here!)
├── COMPLETE_STARTUP_GUIDE.md (Detailed startup)
├── QUICK_START_COMMANDS.md (Command reference)
├── INCOMPLETE_TASKS_COMPLETED.md (What was completed)
├── README.md (Project overview)
├── MASTER_INDEX.md (Documentation hub)
├── ARCHITECTURE.md (System architecture)
├── DEVELOPER_NOTES.md (Development guide)
├── DEPLOYMENT_GUIDE.md (Production deployment)
└── NEW_FEATURES_README.md (Feature documentation)
```

---

## 💡 Pro Tips

1. **Use tmux** for managing multiple services
2. **Create aliases** for common commands (see QUICK_START_COMMANDS.md)
3. **Keep logs open** in a separate terminal
4. **Use --clean flag** when things go wrong
5. **Read error messages** carefully - they're usually helpful

---

## 🎯 Your First 5 Minutes

```bash
# 1. Navigate to project
cd /home/gu-da/CBC

# 2. Start everything
./start-system.sh

# 3. Wait for startup (grab coffee ☕)
# Watch the progress in terminal

# 4. Open browser
# Go to: http://localhost:5173

# 5. Login
# Organization: Exporter Bank
# Username: testuser
# Password: Test123!@#

# 6. Explore!
# Create an export, view history, check dashboard
```

---

## ✅ System Ready Checklist

After running `./start-system.sh`, verify:

- [ ] No errors in terminal output
- [ ] `docker ps` shows 10+ containers
- [ ] Port 3001 responds: `curl http://localhost:3001/health`
- [ ] Port 3002 responds: `curl http://localhost:3002/health`
- [ ] Port 3003 responds: `curl http://localhost:3003/health`
- [ ] Port 3004 responds: `curl http://localhost:3004/health`
- [ ] Frontend loads: http://localhost:5173
- [ ] Can login to frontend
- [ ] Can create test export
- [ ] Can view export list

---

## 🎉 You're Ready!

The Coffee Blockchain Consortium system is now at your fingertips.

**Start with:** `./start-system.sh`

**Then explore:** http://localhost:5173

**Need help?** Check **COMPLETE_STARTUP_GUIDE.md**

**Happy coding!** ☕🚀

---

*Last Updated: January 2024*
*Version: 1.0.0*
