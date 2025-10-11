# Windows Startup Guide (Git Bash)

This guide is optimized for running the Coffee Blockchain Consortium on Windows with Git Bash.

## Prerequisites
- ✅ Docker Desktop running
- ✅ Node.js installed
- ✅ Go installed
- ✅ Fabric binaries installed (already done)

## Step-by-Step Startup

### Step 1: Start Blockchain Network
```bash
cd network
./network.sh up
```

Wait for output showing all containers are created (~2-3 minutes).

### Step 2: Create Channel
```bash
./network.sh createChannel
```

### Step 3: Deploy Chaincode
```bash
# Deploy coffee-export chaincode
./network.sh deployCC -ccn coffee-export -ccp ../chaincode/coffee-export -ccl golang

# Deploy user-management chaincode (optional)
./network.sh deployCC -ccn user-management -ccp ../chaincode/user-management -ccl golang
```

This will take ~5-10 minutes for each chaincode.

### Step 4: Verify Network
```bash
docker ps
```

You should see 5+ containers running:
- orderer.coffee-export.com
- peer0.exporterbank.coffee-export.com
- peer0.nationalbank.coffee-export.com
- peer0.ncat.coffee-export.com
- peer0.shippingline.coffee-export.com
- cli

### Step 5: Start APIs (in separate terminals)

**Terminal 2 - Exporter Bank API:**
```bash
cd api/exporter-bank
npm install  # First time only
npm run dev
```

**Terminal 3 - National Bank API:**
```bash
cd api/national-bank
npm install  # First time only
npm run dev
```

**Terminal 4 - NCAT API:**
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

### Step 6: Start Frontend

**Terminal 6 - Frontend:**
```bash
cd frontend
npm install  # First time only
npm run dev
```

## Access the System

- Frontend: http://localhost:5173
- Exporter Bank API: http://localhost:3001
- National Bank API: http://localhost:3002
- NCAT API: http://localhost:3003
- Shipping Line API: http://localhost:3004

## Troubleshooting

### Port Already in Use
```bash
# Kill node processes
taskkill /F /IM node.exe
```

### Network Won't Start
```bash
cd network
./network.sh down
docker system prune -f
./network.sh up
```

### Check Docker Logs
```bash
docker logs orderer.coffee-export.com
docker logs peer0.exporterbank.coffee-export.com
```

## Stopping the System

1. Press Ctrl+C in each terminal running APIs and frontend
2. Stop blockchain:
```bash
cd network
./network.sh down
```

## Quick Restart (After First Setup)

If everything is already installed and you just want to restart:

```bash
# Terminal 1
cd network && ./network.sh up

# Terminal 2-5: Start APIs (in separate terminals)
cd api/exporter-bank && npm run dev
cd api/national-bank && npm run dev
cd api/ncat && npm run dev
cd api/shipping-line && npm run dev

# Terminal 6: Start frontend
cd frontend && npm run dev
```

## Notes

- IPFS is optional and not required for basic functionality
- The automated `start-system.sh` script is Linux-optimized and may not work properly on Windows
- Use this manual process for more control and better Windows compatibility
