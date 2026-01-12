# Coffee Blockchain Consortium (CBC)

A comprehensive blockchain-based system for managing Ethiopian coffee exports with multiple stakeholders including exporters, ECTA, banks, customs authorities, and shipping lines.

## 🚀 Quick Start

Get CBC running in 5 minutes:

```bash
# 1. Install dependencies
npm install

# 2. Start infrastructure (PostgreSQL)
docker-compose -f docker-compose.postgres.yml up -d

# 3. Start all API services
./start-all-apis.sh

# 4. Start frontend
cd frontend && npm run dev
```

**That's it!** All services are now running.

## 📚 Documentation

- **[Integration Status](./docs/INTEGRATION_COMPLETE.md)** - ⭐ Current system status (START HERE)
- **[Quick Start (Windows)](./docs/QUICK_START_WINDOWS.md)** - Windows-specific setup
- **[Verification Guide](./docs/VERIFICATION_GUIDE.md)** - How to verify system
- **[Database Architecture](./docs/DATABASE_ARCHITECTURE_OVERVIEW.md)** - Database design
- **[Full Documentation Index](./docs/INDEX.md)** - All documentation

## 📍 Service URLs

Once running, access services at:

| Service | URL | Port | Status |
|---------|-----|------|--------|
| Frontend | http://localhost:5173 | 5173 | ✅ |
| Exporter Portal API | http://localhost:3004 | 3004 | ✅ |
| ECTA API | http://localhost:3001 | 3001 | ✅ |
| Commercial Bank API | http://localhost:3002 | 3002 | ✅ |
| National Bank API | http://localhost:3003 | 3003 | ✅ |
| Custom Authorities API | http://localhost:3005 | 3005 | ✅ |
| ECX API | http://localhost:3006 | 3006 | ✅ |
| Shipping Line API | http://localhost:3007 | 3007 | ⚠️ |
| PostgreSQL | localhost:5432 | 5432 | ✅ |

## 🏗️ Project Structure

```
cbc/
├── docs/                          # 📚 Documentation
│   ├── INDEX.md                   # Documentation index
│   ├── INTEGRATION_COMPLETE.md    # ⭐ Current system status
│   ├── QUICK_START_WINDOWS.md     # Windows setup guide
│   └── ...                        # Other documentation
├── scripts/                       # 🔧 Utility scripts
│   ├── testing/                   # Test and verification scripts
│   │   ├── verify-full-integration.js
│   │   ├── comprehensive-verification.js
│   │   └── ...
│   ├── setup/                     # Setup and initialization scripts
│   │   ├── create-audit-log-table.js
│   │   ├── populate-audit-log.js
│   │   └── ...
│   └── README.md                  # Scripts documentation
├── api/                           # 🔌 API Microservices
│   ├── exporter-portal/           # Exporter Portal API
│   ├── ecta/                      # ECTA API
│   ├── commercial-bank/           # Commercial Bank API
│   ├── national-bank/             # National Bank API
│   ├── custom-authorities/        # Custom Authorities API
│   ├── ecx/                       # ECX API
│   ├── shipping-line/             # Shipping Line API
│   └── shared/                    # Shared utilities
├── frontend/                      # 🎨 Frontend Application
│   ├── src/                       # Source code
│   ├── public/                    # Static files
│   └── package.json               # Dependencies
├── config/                        # ⚙️ Configuration files
├── docker-compose.postgres.yml    # Infrastructure setup
├── start-all-apis.sh              # Start all API services
├── stop-all.sh                    # Stop all services
└── README.md                      # This file
```

## 🔧 Common Tasks

### Start All Services
```bash
# Infrastructure
docker-compose -f docker-compose.postgres.yml up -d

# APIs
./start-all-apis.sh

# Frontend
cd frontend && npm run dev
```

### Stop All Services
```bash
./stop-all.sh
```

### Verify System Integration
```bash
node scripts/testing/verify-full-integration.js
```

### Test Frontend Data
```bash
node scripts/testing/test-frontend-data.js
```

### View Service Health
```bash
# Check all services
curl http://localhost:3004/health | jq .
curl http://localhost:3001/health | jq .
# ... etc
```

## 📋 Prerequisites

- **Node.js 18+** - For running services
- **PostgreSQL** - Database (via Docker or local)
- **Docker** (optional) - For containerized PostgreSQL
- **4GB RAM** - Minimum for all services
- **Ports 3001-3007, 5173, 5432** - Must be available

## ✅ System Status

**Integration Status**: ✅ FULLY OPERATIONAL

- 6/7 Services Running
- 9 Database Tables Verified
- 4 Qualified Exporters
- 20 Audit Log Entries
- Data Integrity: Clean

See [INTEGRATION_COMPLETE.md](./docs/INTEGRATION_COMPLETE.md) for details.

## 🚨 Troubleshooting

### Port Already in Use
```bash
./stop-all.sh
# Wait a few seconds
./start-all-apis.sh
```

### Database Connection Issues
```bash
# Test PostgreSQL
psql -U postgres -d coffee_export_db -c "SELECT NOW();"

# Or with Docker
docker exec postgres pg_isready -U postgres
```

### API Not Responding
```bash
# Check service health
curl http://localhost:3004/health

# View logs
cd api/exporter-portal && npm run dev
```

For more troubleshooting, see [Verification Guide](./docs/VERIFICATION_GUIDE.md).

## 📖 Key Features

### ✅ Exporter Pre-Registration
- Profile registration and verification
- Capital verification (ETB 15M+ requirement)
- Laboratory certification (2-year validity)
- Coffee taster qualification (3-year validity)
- Competence certificate issuance (1-year validity)
- Export license issuance (1-year validity)

### ✅ ECTA Integration
- Qualification verification
- License management
- Audit logging with 7-year retention
- Compliance tracking

### ✅ Export Workflow
- Export request creation
- Multi-stakeholder approval process
- Payment verification
- Customs clearance
- Shipping coordination

## 🔐 Security

- JWT-based authentication
- Role-based access control (RBAC)
- Immutable audit logs
- 7-year compliance retention
- Database-level constraints

## 📊 Test Credentials

### Exporters
- **exporter1** / password123 → anaaf (fully qualified)
- **goldenbeans** / password123 → Golden Beans Export PLC (fully qualified)

### ECTA Officials
- **ecta1** / password123 → ECTA Official

See [INTEGRATION_COMPLETE.md](./docs/INTEGRATION_COMPLETE.md) for more credentials.

## 🎯 Next Steps

1. **Read**: [Integration Status](./docs/INTEGRATION_COMPLETE.md)
2. **Setup**: Follow [Quick Start](#-quick-start)
3. **Verify**: Run `node scripts/testing/verify-full-integration.js`
4. **Access**: http://localhost:5173
5. **Explore**: [Full Documentation](./docs/INDEX.md)

## 📝 Scripts Reference

### Testing Scripts
Located in `scripts/testing/`:
- `verify-full-integration.js` - Complete integration test
- `comprehensive-verification.js` - Exporter & ECTA verification
- `test-frontend-data.js` - Frontend data endpoints test

### Setup Scripts
Located in `scripts/setup/`:
- `create-audit-log-table.js` - Create audit log table
- `populate-audit-log.js` - Populate audit data
- `complete-ecta-preregistration.js` - Complete ECTA pre-registration

See [Scripts README](./scripts/README.md) for complete list.

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run integration tests: `node scripts/testing/verify-full-integration.js`
4. Submit a pull request

## 📞 Support

1. Check [Integration Status](./docs/INTEGRATION_COMPLETE.md)
2. Run verification: `node scripts/testing/verify-full-integration.js`
3. Review [Documentation Index](./docs/INDEX.md)
4. Check service health endpoints

---

**Status**: ✅ Production Ready  
**Last Updated**: December 30, 2025  
**Version**: 1.0.0  
**Integration**: Complete
