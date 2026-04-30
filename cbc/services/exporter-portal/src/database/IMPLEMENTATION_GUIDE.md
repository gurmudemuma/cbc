# Sales Contract Workflow - Database Implementation Guide

## Overview

This guide provides instructions for implementing and managing the database schema for the Sales Contract Workflow feature.

## Files Created

### Migration Files (SQL)

Located in `src/migrations/`:

1. **001_create_contract_drafts_table.sql**
   - Creates the main `contract_drafts` table
   - Defines all columns with appropriate data types
   - Adds constraints for data validation
   - Creates 8 indexes for query optimization

2. **002_create_contract_history_table.sql**
   - Creates the `contract_history` table for version control
   - Tracks all changes with actor information
   - Stores changes as JSONB for flexibility
   - Creates 6 indexes for efficient querying

3. **003_create_contract_notifications_table.sql**
   - Creates the `contract_notifications` table
   - Tracks all notifications sent to parties
   - Supports 8 notification types
   - Creates 7 indexes for notification queries

4. **004_create_contract_permissions_table.sql**
   - Creates the `contract_permissions` table
   - Manages access control for contracts
   - Supports 5 permission types
   - Creates 7 indexes for permission lookups

### Rollback Files (SQL)

Located in `src/migrations/`:

1. **001_rollback_create_contract_drafts_table.sql**
   - Drops all indexes for contract_drafts
   - Drops the contract_drafts table with CASCADE

2. **002_rollback_create_contract_history_table.sql**
   - Drops all indexes for contract_history
   - Drops the contract_history table

3. **003_rollback_create_contract_notifications_table.sql**
   - Drops all indexes for contract_notifications
   - Drops the contract_notifications table

4. **004_rollback_create_contract_permissions_table.sql**
   - Drops all indexes for contract_permissions
   - Drops the contract_permissions table

### TypeScript Files

1. **src/types/contract.types.ts**
   - Defines all TypeScript interfaces and enums
   - Enums: ContractStatus, ContractHistoryAction, ActorType, NotificationType, PermissionType, PaymentTerms
   - Interfaces: ContractDraft, ContractHistory, ContractNotification, ContractPermission
   - Request/Response types for API endpoints

2. **src/database/migration-runner.ts**
   - Utility for running migrations programmatically
   - Functions: runMigrations(), rollbackMigrations(), getMigrationStatus()
   - Tracks executed migrations in schema_migrations table
   - Supports rollback to specific versions

3. **src/database/init-schema.ts**
   - Direct schema initialization without migration files
   - Functions: initializeContractSchema(), dropContractSchema()
   - Useful for development and testing
   - Creates all tables and indexes in one operation

### Documentation Files

1. **src/database/SCHEMA.md**
   - Comprehensive schema documentation
   - Detailed column descriptions
   - Constraint and index documentation
   - Common query examples
   - Performance considerations

2. **src/database/IMPLEMENTATION_GUIDE.md** (this file)
   - Implementation instructions
   - Setup procedures
   - Usage examples
   - Troubleshooting guide

## Setup Instructions

### Option 1: Using Migration Runner (Recommended)

```typescript
// In your application startup code (e.g., src/index.ts)
import { runMigrations } from './database/migration-runner';
import path from 'path';

async function startServer() {
  try {
    // Initialize database pool
    const pool = initializePool();
    
    // Run migrations
    const migrationsDir = path.join(__dirname, 'migrations');
    await runMigrations(migrationsDir);
    
    // Start server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}
```

### Option 2: Using Schema Initializer

```typescript
// In your application startup code
import { initializeContractSchema } from './database/init-schema';

async function startServer() {
  try {
    // Initialize database pool
    const pool = initializePool();
    
    // Initialize schema
    await initializeContractSchema();
    
    // Start server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}
```

### Option 3: Manual SQL Execution

```bash
# Connect to your PostgreSQL database
psql -U postgres -d coffee_export_db

# Run migrations in order
\i src/migrations/001_create_contract_drafts_table.sql
\i src/migrations/002_create_contract_history_table.sql
\i src/migrations/003_create_contract_notifications_table.sql
\i src/migrations/004_create_contract_permissions_table.sql
```

## Database Connection Configuration

Ensure your `.env` file contains the following variables:

```env
# PostgreSQL Connection
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/coffee_export_db

# OR individual parameters
DB_HOST=localhost
DB_PORT=5432
DB_NAME=coffee_export_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false
```

## Verification

### Check if tables were created successfully

```sql
-- List all tables
\dt

-- Check contract_drafts table structure
\d contract_drafts

-- Check indexes
\di

-- Count records in each table
SELECT COUNT(*) FROM contract_drafts;
SELECT COUNT(*) FROM contract_history;
SELECT COUNT(*) FROM contract_notifications;
SELECT COUNT(*) FROM contract_permissions;
```

### Check migration status

```typescript
import { getMigrationStatus } from './database/migration-runner';
import path from 'path';

const migrationsDir = path.join(__dirname, 'migrations');
await getMigrationStatus(migrationsDir);
```

## Usage Examples

### Creating a Contract

```typescript
import { getPool } from '@shared/database/pool';
import { ContractDraft, ContractStatus } from './types/contract.types';

const pool = getPool();

const newContract: ContractDraft = {
  draft_id: 'uuid-here',
  exporter_id: 'exporter-uuid',
  buyer_id: null,
  buyer_email: 'buyer@example.com',
  buyer_name: 'John Buyer',
  coffee_type: 'Arabica',
  quantity_bags: 100,
  unit_price: 5.50,
  currency: 'USD',
  payment_terms: 'Letter of Credit',
  delivery_location: 'Port of Djibouti',
  delivery_date: new Date('2024-06-01'),
  lc_number: null,
  ecta_reference_number: null,
  status: ContractStatus.DRAFT,
  blockchain_tx_hash: null,
  created_at: new Date(),
  last_modified_at: new Date(),
  finalized_at: null,
};

const result = await pool.query(
  `INSERT INTO contract_drafts (
    draft_id, exporter_id, buyer_email, buyer_name, coffee_type,
    quantity_bags, unit_price, currency, payment_terms,
    delivery_location, delivery_date, status
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
  RETURNING *`,
  [
    newContract.draft_id,
    newContract.exporter_id,
    newContract.buyer_email,
    newContract.buyer_name,
    newContract.coffee_type,
    newContract.quantity_bags,
    newContract.unit_price,
    newContract.currency,
    newContract.payment_terms,
    newContract.delivery_location,
    newContract.delivery_date,
    newContract.status,
  ]
);

console.log('Contract created:', result.rows[0]);
```

### Recording Contract History

```typescript
import { ContractHistoryAction, ActorType } from './types/contract.types';

const historyEntry = await pool.query(
  `INSERT INTO contract_history (
    draft_id, version_number, status, actor_type, actor_id,
    action, changes
  ) VALUES ($1, $2, $3, $4, $5, $6, $7)
  RETURNING *`,
  [
    draftId,
    1,
    'DRAFT',
    ActorType.EXPORTER,
    exporterId,
    ContractHistoryAction.CREATED,
    JSON.stringify({ initial_creation: true }),
  ]
);

console.log('History entry created:', historyEntry.rows[0]);
```

### Sending a Notification

```typescript
import { NotificationType } from './types/contract.types';

const notification = await pool.query(
  `INSERT INTO contract_notifications (
    draft_id, recipient_id, recipient_email, notification_type,
    subject, message, action_link
  ) VALUES ($1, $2, $3, $4, $5, $6, $7)
  RETURNING *`,
  [
    draftId,
    buyerId,
    buyerEmail,
    NotificationType.CONTRACT_SENT,
    'New Sales Contract from Exporter',
    'You have received a new sales contract. Please review and respond.',
    `https://buyer-portal.example.com/contracts/${draftId}`,
  ]
);

console.log('Notification created:', notification.rows[0]);
```

### Granting Permissions

```typescript
import { PermissionType } from './types/contract.types';

const permission = await pool.query(
  `INSERT INTO contract_permissions (
    draft_id, user_id, user_email, permission_type
  ) VALUES ($1, $2, $3, $4)
  RETURNING *`,
  [
    draftId,
    buyerId,
    buyerEmail,
    PermissionType.RESPOND,
  ]
);

console.log('Permission granted:', permission.rows[0]);
```

### Querying Contracts

```typescript
// Get all contracts for an exporter
const exporterContracts = await pool.query(
  'SELECT * FROM contract_drafts WHERE exporter_id = $1 ORDER BY created_at DESC',
  [exporterId]
);

// Get contracts by status
const draftContracts = await pool.query(
  'SELECT * FROM contract_drafts WHERE status = $1 ORDER BY created_at DESC',
  ['DRAFT']
);

// Get contracts for a buyer
const buyerContracts = await pool.query(
  'SELECT * FROM contract_drafts WHERE buyer_email = $1 ORDER BY created_at DESC',
  [buyerEmail]
);

// Get contract with full history
const contractWithHistory = await pool.query(
  `SELECT 
    cd.*,
    json_agg(json_build_object(
      'version', ch.version_number,
      'action', ch.action,
      'actor_type', ch.actor_type,
      'created_at', ch.created_at
    )) as history
  FROM contract_drafts cd
  LEFT JOIN contract_history ch ON cd.draft_id = ch.draft_id
  WHERE cd.draft_id = $1
  GROUP BY cd.draft_id`,
  [draftId]
);
```

## Rollback Procedure

### Rollback All Migrations

```typescript
import { rollbackMigrations } from './database/migration-runner';
import path from 'path';

const migrationsDir = path.join(__dirname, 'migrations');
await rollbackMigrations(migrationsDir, 0); // Rollback to version 0
```

### Rollback Specific Version

```typescript
// Rollback to version 2 (keeps versions 1 and 2)
await rollbackMigrations(migrationsDir, 2);
```

### Manual Rollback

```bash
# Connect to database
psql -U postgres -d coffee_export_db

# Run rollback migrations in reverse order
\i src/migrations/004_rollback_create_contract_permissions_table.sql
\i src/migrations/003_rollback_create_contract_notifications_table.sql
\i src/migrations/002_rollback_create_contract_history_table.sql
\i src/migrations/001_rollback_create_contract_drafts_table.sql
```

## Troubleshooting

### Issue: "relation does not exist" error

**Cause**: Tables haven't been created yet.

**Solution**: Run migrations using one of the setup options above.

### Issue: "duplicate key value violates unique constraint"

**Cause**: Attempting to insert duplicate version numbers for the same contract.

**Solution**: Ensure version_number is incremented for each new history entry.

### Issue: "foreign key constraint violation"

**Cause**: Attempting to insert a record with a non-existent draft_id.

**Solution**: Ensure the contract exists in contract_drafts before creating related records.

### Issue: "value too long for type character varying"

**Cause**: Inserting a value longer than the column allows.

**Solution**: Check column length constraints in SCHEMA.md and truncate values accordingly.

### Issue: Slow queries

**Cause**: Missing indexes or inefficient query patterns.

**Solution**: 
- Verify all indexes are created: `\di`
- Use EXPLAIN ANALYZE to check query plans
- Consider adding composite indexes for common filter combinations

## Performance Optimization

### Query Optimization Tips

1. **Use indexes for WHERE clauses**
   ```sql
   -- Good: Uses index
   SELECT * FROM contract_drafts WHERE exporter_id = $1;
   
   -- Bad: Full table scan
   SELECT * FROM contract_drafts WHERE LOWER(buyer_name) = LOWER($1);
   ```

2. **Use composite indexes for multiple conditions**
   ```sql
   -- Good: Uses composite index
   SELECT * FROM contract_drafts WHERE exporter_id = $1 AND status = $2;
   
   -- Less efficient: Uses single index
   SELECT * FROM contract_drafts WHERE exporter_id = $1 OR status = $2;
   ```

3. **Limit result sets**
   ```sql
   -- Good: Limits results
   SELECT * FROM contract_drafts WHERE exporter_id = $1 LIMIT 50;
   
   -- Bad: Retrieves all records
   SELECT * FROM contract_drafts WHERE exporter_id = $1;
   ```

4. **Use EXPLAIN ANALYZE**
   ```sql
   EXPLAIN ANALYZE
   SELECT * FROM contract_drafts WHERE exporter_id = $1 AND status = $2;
   ```

### Index Maintenance

```sql
-- Analyze table statistics
ANALYZE contract_drafts;

-- Reindex if needed
REINDEX TABLE contract_drafts;

-- Check index size
SELECT schemaname, tablename, indexname, pg_size_pretty(pg_relation_size(indexrelid)) 
FROM pg_indexes 
WHERE tablename LIKE 'contract_%' 
ORDER BY pg_relation_size(indexrelid) DESC;
```

## Backup and Recovery

### Backup Database

```bash
# Full database backup
pg_dump -U postgres coffee_export_db > backup.sql

# Compressed backup
pg_dump -U postgres coffee_export_db | gzip > backup.sql.gz

# Backup specific table
pg_dump -U postgres -t contract_drafts coffee_export_db > contract_drafts_backup.sql
```

### Restore Database

```bash
# Restore from backup
psql -U postgres coffee_export_db < backup.sql

# Restore from compressed backup
gunzip -c backup.sql.gz | psql -U postgres coffee_export_db

# Restore specific table
psql -U postgres coffee_export_db < contract_drafts_backup.sql
```

## Monitoring

### Monitor Table Sizes

```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE tablename LIKE 'contract_%'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Monitor Active Connections

```sql
SELECT 
  datname,
  usename,
  application_name,
  state,
  query
FROM pg_stat_activity
WHERE datname = 'coffee_export_db';
```

### Monitor Slow Queries

```sql
-- Enable slow query logging
ALTER SYSTEM SET log_min_duration_statement = 1000; -- 1 second
SELECT pg_reload_conf();

-- View slow queries
SELECT query, calls, mean_time, max_time 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

## Next Steps

After setting up the database schema:

1. **Create Backend Services** (Task 2)
   - ContractService for CRUD operations
   - NotificationService for email/in-app notifications
   - ECTAService for ECTA API integration
   - ValidationService for contract validation

2. **Implement API Endpoints** (Tasks 4-7)
   - Contract CRUD endpoints
   - Contract action endpoints
   - Contract retrieval endpoints
   - Buyer portal endpoints

3. **Add Business Logic** (Tasks 8-14)
   - Validation middleware
   - Blockchain integration
   - ECTA registration
   - Notification delivery

4. **Build Frontend Components** (Tasks 18-25)
   - Dashboard with tabs
   - Draft form
   - Negotiation form
   - History timeline
   - Buyer portal

5. **Implement Security** (Tasks 26-30)
   - Role-based access control
   - Contract ownership verification
   - Email verification
   - Contract locking
   - Audit logging

## Support

For issues or questions:
1. Check SCHEMA.md for detailed schema documentation
2. Review common queries in SCHEMA.md
3. Check troubleshooting section above
4. Review migration files for SQL syntax
5. Check TypeScript types for data structure validation
