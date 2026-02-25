# ☕ Coffee Export Blockchain System

A hybrid blockchain system for Ethiopian coffee export management with business types support.

## Quick Start

### Start Everything
```bash
START-HYBRID.bat
```
Wait 3-4 minutes. System will be ready at http://localhost:5173

### Stop Everything
```bash
STOP-HYBRID.bat
```

## What's Included

### Blockchain Layer
- Hyperledger Fabric network (3 Orderers, 6 Peers)
- Smart contracts (Chaincode server)
- CouchDB state databases

### Application Layer
- Gateway API with business types validation
- Blockchain Bridge (data synchronization)
- CBC Services (ECTA, Banks, Customs, ECX, Shipping)

### Infrastructure
- PostgreSQL database
- Redis cache
- Kafka message broker

### Frontend
- React application with business types registration
- Nginx production server

## Business Types Feature

The system supports 4 business types with different capital requirements:

| Business Type | Minimum Capital (ETB) |
|--------------|----------------------|
| Private Limited Company | 50,000,000 |
| Union/Cooperative | 15,000,000 |
| Individual Exporter | 10,000,000 |
| Farmer Cooperative | 5,000,000 |

## Registration

1. Go to http://localhost:5173
2. Click "Register here"
3. Fill account information
4. **Select your business type** from dropdown
5. Complete business profile
6. Submit for ECTA approval

## Test Credentials

**ECTA Admin** (approve registrations):
- Username: `admin`
- Password: `admin123`

**Existing Exporter**:
- Username: `exporter1`
- Password: `password123`

## Service Ports

- Frontend: 5173
- Gateway API: 3000
- Chaincode: 3001
- ECTA Service: 3003
- Blockchain Bridge: 3008
- PostgreSQL: 5432
- Redis: 6379
- Kafka: 9092

## Documentation

See the `docs/` folder for complete documentation:

- **[docs/INDEX.md](docs/INDEX.md)** - Documentation index
- **[docs/README-START-HERE.md](docs/README-START-HERE.md)** - Detailed quick start guide
- **[docs/HYBRID-SYSTEM-GUIDE.md](docs/HYBRID-SYSTEM-GUIDE.md)** - Complete architecture and troubleshooting
- **[docs/GIT-GUIDE.md](docs/GIT-GUIDE.md)** - Git setup and push guide
- **[docs/GIT-PUSH-READY.md](docs/GIT-PUSH-READY.md)** - Git readiness status

## Git Setup

To push this codebase to Git:

```bash
# Verify readiness
VERIFY-GIT-READY.bat

# Initialize and commit
INITIALIZE-GIT.bat

# Add remote and push
git remote add origin [your-repo-url]
git push -u origin main
```

See `docs/GIT-GUIDE.md` for detailed instructions.

## Maintenance

### Rebuild Frontend Only
```bash
REBUILD-FRONTEND.bat
```

### View Logs
```bash
docker logs coffee-gateway --tail 50
docker logs coffee-chaincode --tail 50
docker logs coffee-frontend --tail 50
```

### Check Status
```bash
docker ps
```

## Architecture

```
Fabric Network → Chaincode → Gateway → Bridge → CBC Services
                                ↓
                            Frontend
```

## Key Files

### Startup Scripts
- `START-HYBRID.bat` - Start complete system
- `STOP-HYBRID.bat` - Stop all services
- `REBUILD-FRONTEND.bat` - Rebuild frontend only

### Configuration
- `docker-compose-fabric.yml` - Fabric network
- `docker-compose-hybrid.yml` - Application services

### Business Logic
- `coffee-export-gateway/src/routes/auth.routes.js` - Registration with business types
- `cbc/frontend/src/pages/Login.tsx` - Registration form

## Development

The system uses Docker for all services. Code changes require rebuilding:

**Gateway changes:**
```bash
docker-compose -f docker-compose-hybrid.yml build gateway
docker-compose -f docker-compose-hybrid.yml up -d gateway
```

**Frontend changes:**
```bash
REBUILD-FRONTEND.bat
```

## Support

For issues, check:
1. Service logs: `docker logs <service-name>`
2. Service status: `docker ps`
3. Documentation: `HYBRID-SYSTEM-GUIDE.md`

---

**Built with Hyperledger Fabric, Node.js, React, and Docker**
