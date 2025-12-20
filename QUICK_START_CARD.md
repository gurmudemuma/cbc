# CBC API Services - Quick Start Card

## 🚀 Start Services (30 seconds)

```bash
# 1. Start Docker containers
docker-compose -f docker-compose.postgres.yml up -d

# 2. Start API services
./start-services.sh

# 3. Done! Services running on ports 3001-3007
```

---

## 📋 Essential Commands

| Command | Purpose |
|---------|---------|
| `./start-services.sh` | Start all services |
| `./start-services.sh --check` | Verify prerequisites |
| `./start-services.sh --status` | Show service status |
| `./start-services.sh --logs` | View recent logs |
| `./start-services.sh --tail` | Real-time logs |
| `./start-services.sh --health` | Check health |
| `./start-services.sh --stop` | Stop all services |
| `./start-services.sh --restart` | Restart services |

---

## 🔧 Setup (One-time)

```bash
# Generate production secrets and update .env files
./setup-production-env.sh
```

---

## 🌐 Service URLs

| Service | Port | URL |
|---------|------|-----|
| Commercial Bank | 3001 | http://localhost:3001 |
| Custom Authorities | 3002 | http://localhost:3002 |
| ECTA | 3003 | http://localhost:3003 |
| Exporter Portal | 3004 | http://localhost:3004 |
| National Bank | 3005 | http://localhost:3005 |
| ECX | 3006 | http://localhost:3006 |
| Shipping Line | 3007 | http://localhost:3007 |

---

## 🐳 Docker Containers

```bash
# Start containers
docker-compose -f docker-compose.postgres.yml up -d

# Stop containers
docker-compose -f docker-compose.postgres.yml down

# View logs
docker-compose -f docker-compose.postgres.yml logs -f
```

---

## 📊 Database

- **Host:** postgres (Docker) or localhost (local)
- **Port:** 5432
- **Database:** coffee_export_db
- **User:** postgres
- **Password:** postgres

---

## 🔐 Security

- **JWT_SECRET:** 64 characters (production-grade)
- **ENCRYPTION_KEY:** 64 characters (production-grade)
- **NODE_ENV:** production
- **SSL:** Available

---

## 🆘 Troubleshooting

### Port in use?
```bash
lsof -i :3001 | grep -v COMMAND | awk '{print $2}' | xargs kill -9
```

### Database not accessible?
```bash
docker ps | grep postgres
docker logs postgres
```

### Services won't start?
```bash
./start-services.sh --check
./start-services.sh --logs
```

### Need to rebuild?
```bash
for dir in api/*/; do (cd "$dir" && npm run build); done
```

---

## 📚 Documentation

- **Startup Guide:** `STARTUP_GUIDE.md`
- **Quick Reference:** `DATABASE_QUICK_REFERENCE.md`
- **Architecture:** `DATABASE_ARCHITECTURE_OVERVIEW.md`
- **Database Config:** `DATABASE_CONFIGURATION_VERIFICATION.md`

---

## ✅ Verification

```bash
# Check prerequisites
./start-services.sh --check

# Check service status
./start-services.sh --status

# Check service health
./start-services.sh --health

# View logs
./start-services.sh --logs
```

---

## 🎯 Common Workflows

### Start and Monitor
```bash
./start-services.sh
./start-services.sh --tail
```

### Check Status
```bash
./start-services.sh --status
./start-services.sh --health
```

### Stop and Restart
```bash
./start-services.sh --stop
./start-services.sh --restart
```

### View Logs
```bash
./start-services.sh --logs
./start-services.sh --tail
```

---

## 🔄 Full Workflow

```bash
# 1. Setup (one-time)
./setup-production-env.sh

# 2. Start Docker
docker-compose -f docker-compose.postgres.yml up -d

# 3. Check prerequisites
./start-services.sh --check

# 4. Start services
./start-services.sh

# 5. Monitor
./start-services.sh --tail

# 6. Verify
./start-services.sh --status
./start-services.sh --health
```

---

## 📞 Quick Help

```bash
./start-services.sh --help
```

---

**Status:** ✅ READY TO USE  
**Version:** 1.0  
**Last Updated:** 2024

