# Coffee Export Blockchain (CBC)

A comprehensive blockchain-based system for managing coffee exports with multiple stakeholders including exporters, banks, authorities, and shipping lines.

## 🚀 Quick Start

Get CBC running in 5 minutes:

```bash
# 1. Start all services
./scripts/start-all.sh

# 2. Verify setup
./scripts/verify-all.sh

# 3. Access frontend

# Open http://localhost:5173 in your browser

# Open http://localhost:3000 in your browser

```

**That's it!** All services are now running.

## 📚 Documentation

- **[Quick Start Guide](./docs/QUICK_START.md)** - 5-minute setup (START HERE)
- **[Setup Guide](./docs/SETUP.md)** - Detailed configuration
- **[Architecture](./docs/ARCHITECTURE.md)** - System design overview
- **[Database Guide](./docs/DATABASE.md)** - Database configuration
- **[API Documentation](./docs/API.md)** - API reference
- **[Troubleshooting](./docs/TROUBLESHOOTING.md)** - Common issues and solutions
- **[Full Documentation Index](./docs/README.md)** - All documentation

## 🛠️ Scripts

All scripts are in the `./scripts` directory:

```bash
./scripts/start-all.sh      # Start all services
./scripts/stop-all.sh       # Stop all services
./scripts/verify-all.sh     # Verify setup
```

See [Scripts Guide](./scripts/README.md) for more details.

## 📍 Service URLs

Once running, access services at:

| Service | URL | Port |
|---------|-----|------|

| Frontend | http://localhost:5173 | 5173 |

| Frontend | http://localhost:3000 | 3000 |

| Commercial Bank API | http://localhost:3001 | 3001 |
| Custom Authorities API | http://localhost:3002 | 3002 |
| ECTA API | http://localhost:3003 | 3003 |
| Exporter Portal API | http://localhost:3004 | 3004 |
| National Bank API | http://localhost:3005 | 3005 |
| ECX API | http://localhost:3006 | 3006 |
| Shipping Line API | http://localhost:3007 | 3007 |
| PostgreSQL | localhost:5432 | 5432 |
| Redis | localhost:6379 | 6379 |
| IPFS | http://localhost:5001 | 5001 |

## 🏗️ Project Structure

```
/home/gu-da/cbc/
├── docs/                          # Documentation
│   ├── README.md                  # Documentation index
│   ├── QUICK_START.md             # 5-minute setup
│   ├── SETUP.md                   # Detailed setup
│   ├── ARCHITECTURE.md            # System design
│   ├── DATABASE.md                # Database guide
│   ├── API.md                     # API documentation
│   ├── TROUBLESHOOTING.md         # Troubleshooting
│   └── REFERENCE/                 # Reference documentation
├── scripts/                       # Utility scripts
│   ├── start-all.sh               # Start all services
│   ├── stop-all.sh                # Stop all services
│   ├── verify-all.sh              # Verify setup
│   └── README.md                  # Scripts guide
├── services/                           # API services
│   ├── commercial-bank/           # Commercial Bank API
│   ├── custom-authorities/        # Custom Authorities API
│   ├── ecta/                      # ECTA API
│   ├── ecx/                       # ECX API
│   ├── exporter-portal/           # Exporter Portal API
│   ├── national-bank/             # National Bank API
│   ├── shipping-line/             # Shipping Line API
│   └── shared/                    # Shared utilities
├── frontend/                      # Frontend application
│   ├── src/                       # Source code
│   ├── public/                    # Static files
│   └── package.json               # Dependencies
├── config/                        # Configuration files
│   ├── configtx.yaml              # Blockchain config
│   ├── core.yaml                  # Core config
│   └── orderer.yaml               # Orderer config
├── docker-compose.postgres.yml    # Infrastructure (PostgreSQL, Redis, IPFS)
├── docker-compose.apis.yml        # API services
├── package.json                   # Root dependencies
└── README.md                      # This file
```

## 🔧 Common Tasks

### Start Development
```bash
./scripts/start-all.sh
```

### Stop All Services
```bash
./scripts/stop-all.sh
```

### Verify Setup
```bash
./scripts/verify-all.sh
```

### View Logs
```bash
# Infrastructure logs
docker-compose -f docker-compose.postgres.yml logs -f

# API logs
docker-compose -f docker-compose.apis.yml logs -f

# Specific service
docker logs -f cbc-commercial-bank
```

### Check Service Status
```bash
docker ps
```

### Restart a Service
```bash
docker-compose -f docker-compose.apis.yml restart cbc-commercial-bank
```

## 📋 Prerequisites

- **Docker** & **Docker Compose** - For running services
- **Node.js 18+** - For frontend development
- **Git** - For version control
- **4GB RAM** - Minimum for all services
- **Ports 3000-3007, 5432, 6379, 5001** - Must be available

## 🚨 Troubleshooting

### Port Already in Use
```bash
./scripts/stop-all.sh
# Wait a few seconds
./scripts/start-all.sh
```

### Services Not Starting
```bash
# Check logs
docker-compose -f docker-compose.postgres.yml logs
docker-compose -f docker-compose.apis.yml logs

# Verify setup
./scripts/verify-all.sh
```

### Database Connection Issues
```bash
# Test PostgreSQL
docker exec postgres pg_isready -U postgres

# Test Redis
docker exec redis redis-cli ping

# Check API health
curl http://localhost:3001/health | jq .
```

For more troubleshooting, see [Troubleshooting Guide](./docs/TROUBLESHOOTING.md).

## 📖 Documentation Structure

All documentation is organized in the `./docs` directory:

- **Getting Started** - Quick start and setup guides
- **Architecture** - System design and data flow
- **Database** - Database configuration and management
- **Development** - Development guides and best practices
- **Deployment** - Production deployment procedures
- **Reference** - Configuration and environment reference

See [Documentation Index](./docs/README.md) for complete list.

## 🔐 Security

- All services run in Docker containers
- Database credentials are in `.env` file (not committed)
- HTTPS recommended for production
- See [Deployment Guide](./docs/DEPLOYMENT.md) for production security

## 📊 System Architecture

CBC consists of:

1. **Frontend** - React-based user interface
2. **API Services** - 7 microservices for different stakeholders
3. **Database** - PostgreSQL for persistent data
4. **Cache** - Redis for caching and sessions
5. **IPFS** - Distributed file storage
6. **Blockchain** - Hyperledger Fabric for immutable records

See [Architecture Guide](./docs/ARCHITECTURE.md) for detailed information.

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📝 License

See LICENSE file for details.

## 📞 Support

1. Check [Documentation](./docs/README.md)
2. Run verification script: `./scripts/verify-all.sh`
3. Review [Troubleshooting Guide](./docs/TROUBLESHOOTING.md)
4. Check service logs: `docker logs -f <service-name>`

## 🎯 Next Steps

1. **Read**: [Quick Start Guide](./docs/QUICK_START.md)
2. **Run**: `./scripts/start-all.sh`
3. **Verify**: `./scripts/verify-all.sh`

4. **Access**: http://localhost:5173

4. **Access**: http://localhost:3000

5. **Explore**: [Full Documentation](./docs/README.md)

---

**Status**: ✓ Ready to Use
**Last Updated**: 2025-12-19
**Version**: 1.0
