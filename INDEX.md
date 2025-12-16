# Coffee Export Consortium - Documentation Index

## 🎯 Start Here

New to the project? Start with these files in order:

1. **[README.md](README.md)** - Project overview and quick start
2. **[QUICK_START.md](QUICK_START.md)** - Get running in 5 minutes
3. **[docs/SETUP.md](docs/SETUP.md)** - Detailed setup instructions

## 📚 Documentation

### Getting Started
- [README.md](README.md) - Project overview
- [QUICK_START.md](QUICK_START.md) - Quick reference
- [docs/SETUP.md](docs/SETUP.md) - Developer setup guide

### Architecture & Design
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - System architecture
- [docs/api-spec.yaml](docs/api-spec.yaml) - API specification (OpenAPI 3.0)

### Operations
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) - Production deployment
- [docs/PERFORMANCE.md](docs/PERFORMANCE.md) - Performance testing

### Contributing
- [CONTRIBUTING.md](CONTRIBUTING.md) - How to contribute
- [SECURITY.md](SECURITY.md) - Security policy
- [CHANGELOG.md](CHANGELOG.md) - Version history

### Project Status
- [WHAT_WAS_ADDED.md](WHAT_WAS_ADDED.md) - Recent improvements
- [COMPLETION_SUMMARY.md](COMPLETION_SUMMARY.md) - Detailed completion report

## 🧪 Testing

### Test Files
```
chaincode/coffee-export/contract_test.go
apis/commercial-bank/src/__tests__/auth.test.ts
apis/national-bank/src/__tests__/fx-rates.test.ts
apis/shared/__tests__/integration.test.ts
frontend/src/__tests__/App.test.tsx
```

### Running Tests
```bash
npm test                  # All tests
npm run test:apis         # API tests only
npm run test:frontend     # Frontend tests only
npm run test:chaincode    # Chaincode tests only
npm run test:coverage     # Coverage report
```

## 🛠️ Utilities

### Scripts
- `./verify-completion.sh` - Verify project setup
- `./scripts/start.sh` - Start the network
- `./cleanup-system.sh` - Clean restart
- `./diagnose-api-issues.sh` - Diagnose problems

### Configuration
- `.env` - Environment variables
- `docker-compose.yml` - Container orchestration
- `package.json` - Node.js dependencies and scripts

## 📁 Project Structure

```
cbc/
├── apis/                    # Microservices
│   ├── commercial-bank/
│   ├── national-bank/
│   ├── ecta/
│   ├── ecx/
│   ├── shipping-line/
│   ├── custom-authorities/
│   └── shared/
├── chaincode/              # Smart contracts
│   ├── coffee-export/
│   └── user-management/
├── frontend/               # React app
├── network/                # Fabric network config
├── scripts/                # Utility scripts
└── docs/                   # Documentation

```

## 🔗 Quick Links

### APIs (when running)
- Commercial Bank: http://localhost:3001
- National Bank: http://localhost:3002
- ECTA: http://localhost:3003
- ECX: http://localhost:3004
- Shipping Line: http://localhost:3005
- Custom Authorities: http://localhost:3006

### Frontend
- Web UI: http://localhost:3000

### Monitoring
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001

## 🆘 Getting Help

1. Check [README.md](README.md) for overview
2. Review [docs/SETUP.md](docs/SETUP.md) for setup issues
3. Run `./diagnose-api-issues.sh` for diagnostics
4. Check [SECURITY.md](SECURITY.md) for security issues
5. See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution questions

## 📊 Project Status

- **Version**: 2.0.0
- **Status**: Production Ready
- **Documentation**: 90% Complete
- **Test Coverage**: 40% (Target: 80%)
- **Last Updated**: 2025-12-12

---

**Tip**: Bookmark this file for easy navigation!
