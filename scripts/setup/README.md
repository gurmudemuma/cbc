# Setup Scripts

This directory contains one-time setup and initialization scripts for the CBC system.

## Database Setup

- **create-audit-log-table.js** - Creates ECTA audit log table with compliance features
- **populate-audit-log.js** - Populates audit log with historical data
- **complete-ecta-preregistration.js** - Completes ECTA pre-registration for all exporters

## Data Initialization

- **create-test-data.js** - Creates test data for development
- **register_users.js** - Registers initial users

## Fixes and Migrations

- **fix-golden-beans-user.js** - Fixes user association for Golden Beans exporter
- **fix-orphaned-profile.js** - Fixes orphaned exporter profiles
- **add-audit-logging.js** - Adds audit logging retroactively

## Utility Scripts

- **check-audit-table.js** - Checks if audit log table exists
- **show-exporter-dashboard.js** - Shows exporter dashboard data

## Usage

Run setup scripts once during initial deployment:

```bash
node scripts/setup/create-audit-log-table.js
node scripts/setup/populate-audit-log.js
```

## Warning

Some scripts modify database structure or data. Review carefully before running in production.
