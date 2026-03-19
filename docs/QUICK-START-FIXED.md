# Quick Start - Fixed System

## What Was Fixed
- ✓ Exporter profiles now created with complete data during startup
- ✓ Dashboard displays actual profile data (not N/A values)
- ✓ Registration numbers auto-generated (ECTA-2026-NNNNNN format)
- ✓ Startup script optimized (faster initialization)
- ✓ CLI container added to startup sequence

## Start the System

### Windows
```bash
.\scripts\start-system.bat
```

### Linux/Mac
```bash
chmod +x scripts/start-system.sh
./scripts/start-system.sh
```

## What Happens During Startup
1. Cleans up previous containers
2. Starts blockchain infrastructure (20s)
3. Starts CLI container
4. Starts application services (postgres, redis, kafka)
5. Starts gateway and core services (10s)
6. **Runs seed script** → Creates users and profiles
7. Runs database diagnostic
8. Starts CBC services
9. Starts frontend

**Total time**: ~3-4 minutes

## Access the System

### Frontend
- URL: http://localhost:5173
- Admin: admin / admin123
- Exporter: exporter1 / password123

### Database
- Host: localhost:5432
- User: postgres
- Password: postgres
- Database: coffee_export_db

### Blockchain CLI
```bash
docker exec -it cli bash
```

## Verify Everything Works

### Check Database
```bash
docker-compose -f docker-compose-hybrid.yml exec -T gateway npm run check-db
```

### Check Users
```bash
docker-compose -f docker-compose-hybrid.yml exec -T gateway npm run verify-users
```

## Expected Dashboard Data

When you login as exporter1, you should see:
- **Business Name**: Ethiopian Coffee Exports Ltd
- **TIN**: TIN0000000002
- **Registration Number**: ECTA-2026-000001
- **Contact Person**: Abebe Kebede
- **Email**: contact@ethiopiancoffee.com
- **Phone**: +251911000002
- **Address**: Addis Ababa, Ethiopia

All values should be actual data from the database, not "N/A".

## Troubleshooting

### Profiles Still Showing N/A
1. Check database: `npm run check-db`
2. Verify profiles exist: `SELECT * FROM exporter_profiles;`
3. Restart system: `.\scripts\start-system.bat`

### Seed Script Failed
- Check logs: `docker-compose -f docker-compose-hybrid.yml logs gateway`
- Run manually: `docker-compose -f docker-compose-hybrid.yml exec -T gateway npm run seed`

### Slow Startup
- Normal: 3-4 minutes
- If longer: Check Docker resources and available disk space

## Key Files
- Startup: `scripts/start-system.bat` or `scripts/start-system.sh`
- Seed script: `coffee-export-gateway/src/scripts/seedUsers.js`
- Dashboard: `coffee-export-gateway/src/routes/exporter.routes.js`
- Database check: `coffee-export-gateway/src/scripts/checkDatabase.js`
