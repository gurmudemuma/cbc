# Quick Start - Start All APIs

## 🚀 One Command to Start Everything

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

## 📍 Services Running On

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

## ✅ Verify Services

```bash
# Check all services
./start-all-apis.sh --health

# Test specific service
curl http://localhost:3001/health
```

---

## 📊 Common Commands

```bash
# Start
./start-all-apis.sh

# Status
./start-all-apis.sh --status

# Logs
./start-all-apis.sh --logs

# Stop
./start-all-apis.sh --stop

# Restart
./start-all-apis.sh --restart

# Help
./start-all-apis.sh --help
```

---

## 🐛 Troubleshooting

```bash
# Check prerequisites
./start-all-apis.sh --check

# View logs
./start-all-apis.sh --logs

# Check health
./start-all-apis.sh --health
```

---

## 📚 Full Documentation

See `START_ALL_APIS_GUIDE.md` for detailed information.

---

**Status:** ✅ Ready to use
