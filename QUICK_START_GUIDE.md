# Quick Start Guide - Exporter Portal & Commercial Bank

## 🚀 Starting the Services

### 1. Start Exporter Portal (External Entity)

```bash
cd api/exporter-portal
npm install
cp .env.example .env
# Edit .env if needed
npm run dev
```

**Port:** 3007  
**Type:** External entity (SDK-based)  
**For:** Coffee exporters

### 2. Start Commercial Bank (Consortium Member)

```bash
cd api/commercial-bank
npm install
cp .env.example .env
# Edit .env if needed
npm run dev
```

**Port:** 3001  
**Type:** Consortium member (full peer)  
**For:** Bank officers

### 3. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

**Port:** 5173

---

## 👤 User Types & Login

### External Exporter

1. Open: `http://localhost:5173`
2. Select: **"Exporter Portal"**
3. Login or Register
4. Redirected to: `/exports` (My Exports)

**What you can do:**
- ✅ Create export requests
- ✅ Upload documents
- ✅ Track your exports
- ❌ Cannot approve or view others' exports

### Bank Officer (Commercial Bank)

1. Open: `http://localhost:5173`
2. Select: **"Commercial Bank"**
3. Login with bank credentials
4. Redirected to: `/banking` (Banking Operations)

**What you can do:**
- ✅ Review all export documents
- ✅ Verify banking information
- ✅ Submit to NBE for FX approval
- ✅ View all exports
- ✅ Manage users

---

## 🔑 Test Credentials

### Exporter Portal
```
Username: exporter1
Password: password123
Organization: Exporter Portal
```

### Commercial Bank
```
Username: banker1
Password: password123
Organization: Commercial Bank
```

---

## 📡 API Endpoints

### Exporter Portal (3007)
- Health: `http://localhost:3007/health`
- Login: `POST http://localhost:3007/api/auth/login`
- Register: `POST http://localhost:3007/api/auth/register`
- Create Export: `POST http://localhost:3007/api/exports`

### Commercial Bank (3001)
- Health: `http://localhost:3001/health`
- Login: `POST http://localhost:3001/api/auth/login`
- All Exports: `GET http://localhost:3001/api/exports`
- Verify: `POST http://localhost:3001/api/exports/:id/verify`

---

## 🧪 Testing

### Create Export Request (Exporter)

```bash
# 1. Login as exporter
curl -X POST http://localhost:3007/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "exporter1",
    "password": "password123"
  }'

# 2. Create export (use token from login)
curl -X POST http://localhost:3007/api/exports \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "exportId": "EXP-2024-001",
    "coffeeType": "Arabica Grade 2",
    "quantity": 5000,
    "destinationCountry": "United States",
    "estimatedValue": 75000
  }'
```

### Review Export (Bank Officer)

```bash
# 1. Login as bank officer
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "banker1",
    "password": "password123"
  }'

# 2. Get all exports
curl -X GET http://localhost:3001/api/exports \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔍 Troubleshooting

### Exporter Portal not connecting?

Check:
1. Commercial Bank peer is running (Exporter Portal uses it as gateway)
2. Connection profile path is correct in `.env`
3. Client identity is enrolled: `npm run enroll`

### Commercial Bank not starting?

Check:
1. Fabric network is running
2. Peer node is accessible
3. Crypto materials exist
4. Admin identity is enrolled

### Frontend routing issues?

Check:
1. Organization value matches exactly: `exporter-portal` or `commercial-bank`
2. API endpoints are correct in `api.config.js`
3. Backend services are running

---

## 📚 More Information

- **Architecture:** See `ARCHITECTURE_CLARIFICATION.md`
- **Exporter Portal:** See `api/exporter-portal/README.md`
- **Commercial Bank:** See `api/commercial-bank/README.md`

---

## 🎯 Key Differences

| Feature | Exporter Portal | Commercial Bank |
|---------|----------------|-----------------|
| Login Label | "Exporter Portal" | "Commercial Bank" |
| Default Route | `/exports` | `/banking` |
| Port | 3007 | 3001 |
| Type | External (SDK) | Consortium (Peer) |
| Can Create | Own exports | All exports |
| Can Approve | ❌ No | ✅ Yes |

---

**Ready to start!** 🚀
