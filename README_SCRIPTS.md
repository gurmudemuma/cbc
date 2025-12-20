# Scripts to Start All APIs - Complete Package

## 🎯 What You Have

A complete package to start all 7 API services with a single command.

---

## ⚡ Quick Start (Choose One)

### Linux/macOS
```bash
./start-all-apis.sh
```

### Windows
```cmd
start-all-apis.bat
```

### Docker
```bash
docker-compose -f docker-compose.apis.yml up
```

---

## 📦 What's Included

### Scripts (3)
- ✅ `start-all-apis.sh` - Bash script for Linux/macOS
- ✅ `start-all-apis.bat` - Batch script for Windows
- ✅ `docker-compose.apis.yml` - Docker Compose configuration

### Documentation (5)
- ✅ `START_HERE.md` - Quick start guide
- ✅ `QUICK_START.md` - One-page reference
- ✅ `START_ALL_APIS_GUIDE.md` - Comprehensive guide
- ✅ `START_ALL_APIS_SUMMARY.md` - Feature summary
- ✅ `SCRIPTS_CREATED.md` - Script details
- ✅ `FINAL_SUMMARY.md` - Complete summary
- ✅ `README_SCRIPTS.md` - This file

---

## 📍 Services

All 7 API services will start on these ports:

```
3001 - Commercial Bank API
3002 - Custom Authorities API
3003 - ECTA API
3004 - Exporter Portal API
3005 - National Bank API
3006 - ECX API
3007 - Shipping Line API
```

---

## 🎯 Common Commands

```bash
# Start all services
./start-all-apis.sh

# Check prerequisites
./start-all-apis.sh --check

# View service status
./start-all-apis.sh --status

# View logs
./start-all-apis.sh --logs

# Tail logs in real-time
./start-all-apis.sh --tail

# Check service health
./start-all-apis.sh --health

# Stop all services
./start-all-apis.sh --stop

# Restart all services
./start-all-apis.sh --restart

# Show help
./start-all-apis.sh --help
```

---

## ✅ Verify Services

```bash
# Check all services
./start-all-apis.sh --health

# Or test manually
curl http://localhost:3001/health
```

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **START_HERE.md** | ⭐ Start here for quick setup |
| **QUICK_START.md** | One-page quick reference |
| **START_ALL_APIS_GUIDE.md** | Comprehensive guide with all options |
| **START_ALL_APIS_SUMMARY.md** | Summary of all features |
| **SCRIPTS_CREATED.md** | Details about all scripts |
| **FINAL_SUMMARY.md** | Complete summary |
| **README_SCRIPTS.md** | This file |

---

## 🚀 Getting Started

1. **Read START_HERE.md** for quick overview
2. **Run the script** to start all services
3. **Verify services** are running with health checks
4. **Test endpoints** to confirm everything works
5. **Read full guide** for advanced options

---

## 🔧 Prerequisites

### For Scripts
- Node.js 14+
- npm 6+
- PostgreSQL 12+

### For Docker
- Docker 20.10+
- Docker Compose 1.29+

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
lsof -i :3001
kill -9 <PID>
```

### Database Connection Failed
```bash
psql -h localhost -U postgres -d coffee_export_db -c "SELECT 1"
```

### Services Won't Start
```bash
./start-all-apis.sh --check
./start-all-apis.sh --logs
```

---

## 📊 Features

- ✅ Start all 7 services with one command
- ✅ Automatic prerequisite checking
- ✅ Port availability verification
- ✅ Health check monitoring
- ✅ Comprehensive logging
- ✅ Service status tracking
- ✅ Graceful shutdown
- ✅ Error handling
- ✅ Cross-platform support
- ✅ Docker support

---

## 🎓 Examples

### Start and Monitor
```bash
# Terminal 1
./start-all-apis.sh

# Terminal 2
./start-all-apis.sh --tail
```

### Docker Compose
```bash
docker-compose -f docker-compose.apis.yml up -d
docker-compose -f docker-compose.apis.yml logs -f
docker-compose -f docker-compose.apis.yml down
```

### Check Status
```bash
./start-all-apis.sh --status
./start-all-apis.sh --health
```

---

## 📋 File Locations

```
/home/gu-da/cbc/
├── start-all-apis.sh
├── start-all-apis.bat
├── docker-compose.apis.yml
├── START_HERE.md
├── QUICK_START.md
├── START_ALL_APIS_GUIDE.md
├── START_ALL_APIS_SUMMARY.md
├── SCRIPTS_CREATED.md
├── FINAL_SUMMARY.md
└── README_SCRIPTS.md
```

---

## ✨ Key Features

### Bash Script
- Colored output
- Comprehensive checks
- Health monitoring
- Real-time logging
- Service management
- Graceful shutdown

### Batch Script
- Windows compatible
- Service management
- Health checks
- Logging
- Error handling

### Docker Compose
- Complete stack
- PostgreSQL included
- Redis included
- Health checks
- Auto-restart
- Production-ready

---

## 🎯 Next Steps

1. **Start Services**
   ```bash
   ./start-all-apis.sh
   ```

2. **Verify Running**
   ```bash
   ./start-all-apis.sh --health
   ```

3. **Test Endpoints**
   ```bash
   curl http://localhost:3001/health
   ```

4. **Read Documentation**
   - START_HERE.md for quick start
   - START_ALL_APIS_GUIDE.md for comprehensive guide

---

## 📞 Support

1. Check prerequisites: `./start-all-apis.sh --check`
2. View logs: `./start-all-apis.sh --logs`
3. Check health: `./start-all-apis.sh --health`
4. Read documentation for detailed help

---

## ✅ Status

- ✅ All scripts created
- ✅ All documentation complete
- ✅ All 7 APIs configured
- ✅ Database connections verified
- ✅ Health checks implemented
- ✅ Ready for production

---

**Version:** 1.0
**Status:** ✅ COMPLETE
**Last Updated:** 2024

---

## 🎉 You're Ready!

**Everything is set up. Just run:**

```bash
./start-all-apis.sh
```

**All 7 API services will start automatically!**
