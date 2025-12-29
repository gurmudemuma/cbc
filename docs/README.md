# CBC Documentation

Welcome to the Coffee Export Blockchain (CBC) documentation. This directory contains all project documentation organized by topic.

## 📚 Quick Navigation

### Getting Started
- **[QUICK_START.md](./QUICK_START.md)** - 5-minute setup guide (START HERE)
- **[SETUP.md](./SETUP.md)** - Detailed setup instructions
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture overview

### Database & Infrastructure
- **[DATABASE.md](./DATABASE.md)** - Database configuration and connection
- **[DOCKER.md](./DOCKER.md)** - Docker setup and management
- **[INFRASTRUCTURE.md](./INFRASTRUCTURE.md)** - Infrastructure overview

### Development
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Development guide
- **[API.md](./API.md)** - API documentation
- **[FRONTEND.md](./FRONTEND.md)** - Frontend documentation

### Deployment & Operations
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment guide
- **[MONITORING.md](./MONITORING.md)** - Monitoring and logging
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Troubleshooting guide

### Reference
- **[CONFIGURATION.md](./CONFIGURATION.md)** - Configuration reference
- **[PORTS.md](./PORTS.md)** - Port mapping reference
- **[ENVIRONMENT.md](./ENVIRONMENT.md)** - Environment variables reference

## 🚀 Quick Start

```bash
# 1. Start infrastructure
docker-compose -f docker-compose.postgres.yml up -d

# 2. Start APIs
docker-compose -f docker-compose.apis.yml up -d

# 3. Verify setup
./scripts/verify-all.sh

# 4. Start frontend
cd frontend && npm start
```

## 📋 Project Structure

```
/home/gu-da/cbc/
├── docs/                          ← You are here
│   ├── README.md                  ← Documentation index
│   ├── QUICK_START.md             ← 5-minute setup
│   ├── SETUP.md                   ← Detailed setup
│   ├── ARCHITECTURE.md            ← System design
│   ├── DATABASE.md                ← Database guide
│   ├── DOCKER.md                  ← Docker guide
│   ├── DEVELOPMENT.md             ← Dev guide
│   ├── API.md                     ← API docs
│   ├── DEPLOYMENT.md              ← Production guide
│   ├── TROUBLESHOOTING.md         ← Troubleshooting
│   └── REFERENCE/                 ← Reference docs
│       ├── CONFIGURATION.md
│       ├── PORTS.md
│       └── ENVIRONMENT.md
├── scripts/                       ← Utility scripts
│   ├── start-all.sh               ← Start everything
│   ├── stop-all.sh                ← Stop everything
│   ├── verify-all.sh              ← Verify setup
│   └── README.md                  ← Scripts guide
├── api/                           ← API services
├── frontend/                      ← Frontend application
├── config/                        ← Configuration files
├── docker-compose.postgres.yml    ← Infrastructure
├── docker-compose.apis.yml        ← API services
├── package.json                   ← Root dependencies
└── README.md                      ← Main README
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
docker-compose -f docker-compose.postgres.yml logs -f
docker-compose -f docker-compose.apis.yml logs -f
```

### Check Service Status
```bash
docker ps
```

## 📞 Support

1. Check relevant documentation file
2. Run verification script
3. Review troubleshooting guide
4. Check service logs

## 📝 Documentation Standards

- All guides are kept up-to-date
- Examples are tested and working
- Commands are copy-paste ready
- Troubleshooting covers common issues

---

**Last Updated**: 2025-12-19
**Status**: ✓ Organized and Current
