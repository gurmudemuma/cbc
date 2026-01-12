# CBC Scripts

Utility scripts for the Coffee Blockchain Consortium platform.

## 📁 Directory Structure

```
scripts/
├── testing/          # Test and verification scripts
├── setup/            # Setup and initialization scripts
├── start-all.sh      # Start all API services
├── stop-all.sh       # Stop all services
├── verify-all.sh     # Verify system setup
└── README.md         # This file
```

## 🧪 Testing Scripts

Located in `testing/` directory. Used for testing and verifying system functionality.

### Integration Tests
- **verify-full-integration.js** - Comprehensive integration test across all services
- **comprehensive-verification.js** - Verifies exporters and ECTA workflows
- **system-consistency-check.js** - Cross-system data consistency checks

### Component Tests
- **test-frontend-data.js** - Tests frontend data endpoints
- **test-ecta-login.js** - Tests ECTA authentication
- **test-export-creation.js** - Tests export creation workflow
- **test-exporter-view.js** - Tests exporter dashboard views

### Verification Scripts
- **verify-exporter-workflow.js** - Verifies complete exporter workflow
- **verify_bank_stats.js** - Verifies bank statistics
- **verify_ecta_stats.js** - Verifies ECTA statistics
- **verify_stats_api.js** - Verifies statistics APIs

### Usage
```bash
# Run from project root
node scripts/testing/verify-full-integration.js
node scripts/testing/test-frontend-data.js
```

## 🔧 Setup Scripts

Located in `setup/` directory. Used for initial setup and data initialization.

### Database Setup
- **create-audit-log-table.js** - Creates ECTA audit log table with compliance features
- **populate-audit-log.js** - Populates audit log with historical data
- **complete-ecta-preregistration.js** - Completes ECTA pre-registration for all exporters

### Data Initialization
- **create-test-data.js** - Creates test data for development
- **register_users.js** - Registers initial users

### Fixes and Migrations
- **fix-golden-beans-user.js** - Fixes user association for Golden Beans exporter
- **fix-orphaned-profile.js** - Fixes orphaned exporter profiles
- **add-audit-logging.js** - Adds audit logging retroactively

### Utility Scripts
- **check-audit-table.js** - Checks if audit log table exists
- **show-exporter-dashboard.js** - Shows exporter dashboard data

### Usage
```bash
# Run from project root
node scripts/setup/create-audit-log-table.js
node scripts/setup/populate-audit-log.js
```

⚠️ **Warning**: Setup scripts modify database structure or data. Review carefully before running in production.

## 🚀 Service Management Scripts

Located in root `scripts/` directory.

### start-all.sh
Starts all API services in development mode.

```bash
./scripts/start-all.sh
```

### stop-all.sh
Stops all running services.

```bash
./scripts/stop-all.sh
```

### verify-all.sh
Verifies system setup and configuration.

```bash
./scripts/verify-all.sh
```

## 📊 SQL Scripts

Database migration and update scripts.

- **add_rejection_tracking.sql** - Adds rejection tracking to applications
- **add_taster_verification.sql** - Adds taster verification fields
- **allow_pending_applications.sql** - Allows pending application status
- **update_status_constraints.sql** - Updates status field constraints

### Usage
```bash
psql -U postgres -d coffee_export_db -f scripts/add_rejection_tracking.sql
```

## 🔍 Quick Reference

### Run Full Integration Test
```bash
node scripts/testing/verify-full-integration.js
```

### Test Frontend Data
```bash
node scripts/testing/test-frontend-data.js
```

### Setup Audit Log
```bash
node scripts/setup/create-audit-log-table.js
node scripts/setup/populate-audit-log.js
```

### Start All Services
```bash
./scripts/start-all.sh
```

### Stop All Services
```bash
./scripts/stop-all.sh
```

## 📝 Script Categories

### Production Scripts ✅
Safe to run in production:
- `start-all.sh`
- `stop-all.sh`
- `verify-all.sh`

### Development Scripts 🔧
For development and testing only:
- All scripts in `testing/`
- `create-test-data.js`
- `show-exporter-dashboard.js`

### Setup Scripts ⚙️
Run once during deployment:
- `create-audit-log-table.js`
- `populate-audit-log.js`
- `complete-ecta-preregistration.js`

### Maintenance Scripts 🔨
For fixing issues and migrations:
- `fix-golden-beans-user.js`
- `fix-orphaned-profile.js`
- `add-audit-logging.js`

## 🛡️ Best Practices

1. **Always backup** before running setup or maintenance scripts
2. **Test in development** before running in production
3. **Review SQL scripts** before executing
4. **Check logs** after running scripts
5. **Verify results** with testing scripts

## 📞 Support

If a script fails:
1. Check the error message
2. Review the script documentation
3. Verify prerequisites are met
4. Check service logs
5. Run verification scripts

## 🔗 Related Documentation

- [Integration Status](../docs/INTEGRATION_COMPLETE.md)
- [Verification Guide](../docs/VERIFICATION_GUIDE.md)
- [Database Architecture](../docs/DATABASE_ARCHITECTURE_OVERVIEW.md)
- [Main README](../README.md)
