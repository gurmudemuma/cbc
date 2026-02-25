# Coffee Export Blockchain - Documentation Index

## Quick Start

- **[README-START-HERE.md](README-START-HERE.md)** - Quick start guide for getting the system running
- **[GIT-GUIDE.md](GIT-GUIDE.md)** - Git setup and push guide

## System Documentation

- **[HYBRID-SYSTEM-GUIDE.md](HYBRID-SYSTEM-GUIDE.md)** - Complete hybrid architecture guide
  - Architecture overview
  - Network topology
  - Service ports
  - Troubleshooting
  - Development workflows

## Architecture

- **[architecture/system-overview.md](architecture/system-overview.md)** - High-level system architecture
- **[CODEBASE.md](CODEBASE.md)** - Codebase structure and organization

## Features

- **Business Types Registration** - Support for 4 business types with different capital requirements
  - Private Limited Company: 50M ETB
  - Union/Cooperative: 15M ETB
  - Individual Exporter: 10M ETB
  - Farmer Cooperative: 5M ETB

## Integration

- **[USER-SYNC-IMPLEMENTATION.md](USER-SYNC-IMPLEMENTATION.md)** - User synchronization between blockchain and database
- **[USER-SYNC-COMPLETE.md](USER-SYNC-COMPLETE.md)** - User sync completion status

## Getting Started

1. Read [README-START-HERE.md](README-START-HERE.md)
2. Run `START-HYBRID.bat` from root directory
3. Access system at http://localhost:5173
4. Refer to [HYBRID-SYSTEM-GUIDE.md](HYBRID-SYSTEM-GUIDE.md) for detailed information

## Support

For issues and troubleshooting, see:
- [HYBRID-SYSTEM-GUIDE.md](HYBRID-SYSTEM-GUIDE.md) - Troubleshooting section
- Check service logs: `docker logs <service-name>`
- Verify services: `docker ps`

## Project Structure

```
coffee-export-blockchain/
├── README.md                    # Main documentation
├── START-HYBRID.bat            # Start all services
├── STOP-HYBRID.bat             # Stop all services
├── REBUILD-FRONTEND.bat        # Rebuild frontend
├── docs/                       # Documentation
│   ├── INDEX.md               # This file
│   ├── README-START-HERE.md   # Quick start
│   ├── HYBRID-SYSTEM-GUIDE.md # Complete guide
│   └── architecture/          # Architecture docs
├── chaincode/                  # Smart contracts
├── coffee-export-gateway/      # Gateway API
├── cbc/                        # CBC services & frontend
├── services/                   # Blockchain bridge
└── docker-compose-*.yml        # Docker configurations
```

## Key Commands

### System Management
```bash
# Start everything
START-HYBRID.bat

# Stop everything
STOP-HYBRID.bat

# Rebuild frontend
REBUILD-FRONTEND.bat

# View logs
docker logs coffee-gateway --tail 50
docker logs coffee-chaincode --tail 50

# Check status
docker ps
```

### Git Management
```bash
# Verify Git readiness
VERIFY-GIT-READY.bat

# Initialize Git repository
INITIALIZE-GIT.bat

# Prepare for push
GIT-READY.bat
```

---

**For the latest updates, see the main [README.md](../README.md) in the root directory.**
