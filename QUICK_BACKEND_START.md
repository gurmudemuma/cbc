# ⚡ Quick Backend Start

## 🚀 Start All Services (Recommended)

```bash
cd /home/gu-da/cbc/apis
npm run dev:all
```

**That's it!** All 7 services will start on ports 3001-3007.

---

## 📊 Services Running

| Service | Port | URL |
|---------|------|-----|
| Commercial Bank | 3001 | http://localhost:3001 |
| National Bank | 3002 | http://localhost:3002 |
| ECTA | 3003 | http://localhost:3003 |
| Shipping Line | 3004 | http://localhost:3004 |
| Customs | 3005 | http://localhost:3005 |
| ECX | 3006 | http://localhost:3006 |
| Exporter Portal | 3007 | http://localhost:3007 |

---

## ✅ Verify Services

```bash
# Check all services
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3004/health
curl http://localhost:3005/health
curl http://localhost:3006/health
curl http://localhost:3007/health
```

**Expected Response**:
```json
{
  "status": "ok",
  "uptime": 123.456,
  "fabric": "connected",
  "database": "connected"
}
```

---

## 🔧 Individual Services

### Start One Service
```bash
cd /home/gu-da/cbc/apis/commercial-bank
npm run dev
```

### Available Services
```bash
# Commercial Bank
cd /home/gu-da/cbc/apis/commercial-bank && npm run dev

# National Bank
cd /home/gu-da/cbc/apis/national-bank && npm run dev

# ECTA
cd /home/gu-da/cbc/apis/ecta && npm run dev

# Shipping Line
cd /home/gu-da/cbc/apis/shipping-line && npm run dev

# Customs
cd /home/gu-da/cbc/apis/custom-authorities && npm run dev

# ECX
cd /home/gu-da/cbc/apis/ecx && npm run dev

# Exporter Portal
cd /home/gu-da/cbc/apis/exporter-portal && npm run dev
```

---

## 🛑 Stop Services

```bash
# Press Ctrl+C in the terminal
# Or kill all node processes
pkill -f "node"
```

---

## 🐳 Docker Alternative

```bash
# Start with Docker
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## 🔍 Troubleshooting

### Port Already in Use
```bash
lsof -i :3001
kill -9 <PID>
```

### Database Connection Failed
```bash
psql -U postgres -d coffee_export_db -c "SELECT 1;"
```

### Blockchain Not Connected
```bash
docker ps | grep fabric
```

---

## 📝 Full Guide

See `BACKEND_STARTUP_GUIDE.md` for complete documentation.

---

**Ready?** Run: `cd /home/gu-da/cbc/apis && npm run dev:all`
