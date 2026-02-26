# Quick Reference Card - Hybrid Blockchain System

## 🚀 Quick Start (3 Commands)

```bash
# 1. Start everything
docker-compose -f docker-compose-hybrid.yml up -d

# 2. Wait 30 seconds
timeout /t 30

# 3. Verify
verify-setup.bat
```

---

## 📊 System Status: ✅ ALL CONFIGURATIONS VERIFIED

### PostgreSQL ✅
- **Database**: coffee_export_db
- **User**: postgres / postgres
- **Port**: 5432
- **Tables**: 30+ tables
- **Config**: `cbc/services/shared/database/db.config.ts`
- **Init**: `cbc/services/shared/database/init.sql` ✅ FIXED
- **Migrations**: 13 files ✅ ALL INCLUDED

### Fabric/Chaincode ✅
- **Port**: 3001
- **Functions**: 100+ functions
- **API**: REST (invoke, query, health)
- **Events**: Configured
- **Files**: `chaincode/ecta/index.js`, `server.js`

### Blockchain Bridge ✅
- **Port**: 3008
- **Components**: 15 TypeScript files
- **