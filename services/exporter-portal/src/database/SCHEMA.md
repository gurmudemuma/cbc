# Sales Contract Workflow Database Schema

## Overview

This document describes the database schema for the Sales Contract Workflow feature. The schema consists of four main tables that support contract creation, negotiation, version control, notifications, and access control.

## Tables

### 1. contract_drafts

Main table for storing draft sales contracts.

#### Columns

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| draft_id | UUID | PRIMARY KEY | Unique identifier for the contract |
| exporter_id | UUID | NOT NULL | ID of the exporter who created the contract |
| buyer_id | UUID | NULLABLE | ID of the buyer (null until buyer accepts) |
| buyer_email | VARCHAR(255) | NOT NULL | Email address of the buyer |
| buyer_name | VARCHAR(255) | NOT NULL | Name of the buyer |
| coffee_type | VARCHAR(100) | NOT NULL | Type of coffee (e.g., Arabica, Robusta) |
| quantity_bags | INTEGER | NOT NULL, >= 1 | Number of bags (minimum 1) |
| unit_price | DECIMAL(10,2) | NOT NULL, > 0 | Price per bag |
| currency | VARCHAR(3) | NOT NULL, ISO 4217 | Currency code (e.g., USD, EUR) |
| payment_terms | VARCHAR(50) | NOT NULL | Payment terms (e.g., "Letter of Credit") |
| delivery_location | VARCHAR(255) | NOT NULL | Port or city for delivery |
| delivery_date | DATE | NOT NULL, future | Expected delivery date |
| lc_number | VARCHAR(50) | NULLABLE | Letter of Credit number |
| ecta_reference_number | VARCHAR(50) | NULLABLE | ECTA registration reference number |
| status | VARCHAR(50) | NOT NULL, DEFAULT 'DRAFT' | Contract status (DRAFT, COUNTERED, ACCEPTED, REJECTED, FINALIZED) |
| blockchain_tx_hash | VARCHAR(255) | NULLABLE | Blockchain transaction hash |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |
| last_modified_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last modification timestamp |
| finalized_at | TIMESTAMP | NULLABLE | Finalization timestamp |

#### Constraints

- `check_quantity_positive`: quantity_bags >= 1
- `check_unit_price_positive`: unit_price > 0
- `check_valid_status`: status IN ('DRAFT', 'COUNTERED', 'ACCEPTED', 'REJECTED', 'FINALIZED')
- `check_valid_currency`: currency matches ISO 4217 format (3 uppercase letters)
- `check_delivery_date_future`: delivery_date > CURRENT_DATE OR status != 'DRAFT'

#### Indexes

- `idx_contract_drafts_exporter_id`: Single column index on exporter_id
- `idx_contract_drafts_buyer_email`: Single column index on buyer_email
- `idx_contract_drafts_status`: Single column index on status
- `idx_contract_drafts_created_at`: Single column index on created_at
- `idx_contract_drafts_ecta_reference`: Single column index on ecta_reference_number
- `idx_contract_drafts_buyer_id`: Single column index on buyer_id
- `idx_contract_drafts_exporter_status`: Composite index on (exporter_id, status)
- `idx_contract_drafts_buyer_email_status`: Composite index on (buyer_email, status)

#### Usage

- Retrieve all contracts for an exporter: `SELECT * FROM contract_drafts WHERE exporter_id = $1`
- Retrieve contracts by status: `SELECT * FROM contract_drafts WHERE status = $1`
- Retrieve contracts for a buyer: `SELECT * FROM contract_drafts WHERE buyer_email = $1`

---

### 2. contract_history

Maintains version control and audit trail of all contract changes.

#### Columns

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| history_id | UUID | PRIMARY KEY | Unique identifier for history entry |
| draft_id | UUID | NOT NULL, FK | Reference to contract_drafts |
| version_number | INTEGER | NOT NULL | Version number (incremented with each change) |
| status | VARCHAR(50) | NOT NULL | Contract status at this version |
| actor_type | VARCHAR(20) | NOT NULL | Type of actor (EXPORTER, BUYER, SYSTEM) |
| actor_id | UUID | NOT NULL | ID of the actor who made the change |
| action | VARCHAR(50) | NOT NULL | Action performed (CREATED, MODIFIED, SENT, ACCEPTED, REJECTED, COUNTERED, FINALIZED) |
| changes | JSONB | NULLABLE | JSON object containing field changes |
| rejection_reason | TEXT | NULLABLE | Reason for rejection (if action is REJECTED) |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Timestamp of the change |

#### Constraints

- `fk_contract_history_draft`: Foreign key to contract_drafts(draft_id) with CASCADE delete
- `check_valid_actor_type`: actor_type IN ('EXPORTER', 'BUYER', 'SYSTEM')
- `check_valid_action`: action IN ('CREATED', 'MODIFIED', 'SENT', 'ACCEPTED', 'REJECTED', 'COUNTERED', 'FINALIZED')
- `unique_draft_version`: UNIQUE(draft_id, version_number)

#### Indexes

- `idx_contract_history_draft_id`: Single column index on draft_id
- `idx_contract_history_created_at`: Single column index on created_at
- `idx_contract_history_actor_id`: Single column index on actor_id
- `idx_contract_history_status`: Single column index on status
- `idx_contract_history_draft_version`: Composite index on (draft_id, version_number DESC)
- `idx_contract_history_draft_action`: Composite index on (draft_id, action)

#### Usage

- Get all versions of a contract: `SELECT * FROM contract_history WHERE draft_id = $1 ORDER BY version_number`
- Get latest version: `SELECT * FROM contract_history WHERE draft_id = $1 ORDER BY version_number DESC LIMIT 1`
- Get history by action: `SELECT * FROM contract_history WHERE draft_id = $1 AND action = $2`

---

### 3. contract_notifications

Tracks all notifications sent to parties about contract activity.

#### Columns

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| notification_id | UUID | PRIMARY KEY | Unique identifier for notification |
| draft_id | UUID | NOT NULL, FK | Reference to contract_drafts |
| recipient_id | UUID | NOT NULL | ID of the recipient |
| recipient_email | VARCHAR(255) | NOT NULL | Email address of the recipient |
| notification_type | VARCHAR(50) | NOT NULL | Type of notification |
| subject | VARCHAR(255) | NOT NULL | Email subject line |
| message | TEXT | NOT NULL | Notification message body |
| action_link | VARCHAR(500) | NULLABLE | Link to take action (e.g., buyer portal) |
| is_read | BOOLEAN | DEFAULT FALSE | Whether notification has been read |
| sent_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | When notification was sent |
| read_at | TIMESTAMP | NULLABLE | When notification was read |

#### Notification Types

- `CONTRACT_SENT`: Exporter sends contract to buyer
- `CONTRACT_ACCEPTED`: Buyer accepts contract
- `CONTRACT_REJECTED`: Buyer rejects contract
- `CONTRACT_COUNTERED`: Buyer submits counter-offer
- `COUNTER_ACCEPTED`: Exporter accepts counter-offer
- `CONTRACT_FINALIZED`: Contract finalized to blockchain
- `ECTA_REGISTERED`: ECTA registration complete
- `CERTIFICATE_READY`: Certificate generated and ready

#### Constraints

- `fk_contract_notifications_draft`: Foreign key to contract_drafts(draft_id) with CASCADE delete
- `check_valid_notification_type`: notification_type IN (valid types listed above)

#### Indexes

- `idx_contract_notifications_draft_id`: Single column index on draft_id
- `idx_contract_notifications_recipient_id`: Single column index on recipient_id
- `idx_contract_notifications_recipient_email`: Single column index on recipient_email
- `idx_contract_notifications_sent_at`: Single column index on sent_at
- `idx_contract_notifications_is_read`: Single column index on is_read
- `idx_contract_notifications_recipient_unread`: Composite index on (recipient_id, is_read)
- `idx_contract_notifications_draft_type`: Composite index on (draft_id, notification_type)

#### Usage

- Get unread notifications for user: `SELECT * FROM contract_notifications WHERE recipient_id = $1 AND is_read = FALSE`
- Get all notifications for contract: `SELECT * FROM contract_notifications WHERE draft_id = $1 ORDER BY sent_at DESC`
- Mark as read: `UPDATE contract_notifications SET is_read = TRUE, read_at = NOW() WHERE notification_id = $1`

---

### 4. contract_permissions

Manages access control and permissions for contracts.

#### Columns

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| permission_id | UUID | PRIMARY KEY | Unique identifier for permission |
| draft_id | UUID | NOT NULL, FK | Reference to contract_drafts |
| user_id | UUID | NOT NULL | ID of the user |
| user_email | VARCHAR(255) | NULLABLE | Email address of the user |
| permission_type | VARCHAR(50) | NOT NULL | Type of permission |
| granted_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | When permission was granted |
| expires_at | TIMESTAMP | NULLABLE | When permission expires |

#### Permission Types

- `VIEW`: Can view contract details
- `EDIT`: Can edit contract (only for DRAFT status)
- `RESPOND`: Can respond to contract (for buyers)
- `FINALIZE`: Can finalize contract to blockchain
- `ADMIN`: Full administrative access

#### Constraints

- `fk_contract_permissions_draft`: Foreign key to contract_drafts(draft_id) with CASCADE delete
- `check_valid_permission_type`: permission_type IN ('VIEW', 'EDIT', 'RESPOND', 'FINALIZE', 'ADMIN')

#### Indexes

- `idx_contract_permissions_draft_id`: Single column index on draft_id
- `idx_contract_permissions_user_id`: Single column index on user_id
- `idx_contract_permissions_user_email`: Single column index on user_email
- `idx_contract_permissions_granted_at`: Single column index on granted_at
- `idx_contract_permissions_expires_at`: Single column index on expires_at
- `idx_contract_permissions_user_draft`: Composite index on (user_id, draft_id)
- `idx_contract_permissions_draft_type`: Composite index on (draft_id, permission_type)

#### Usage

- Check if user has permission: `SELECT * FROM contract_permissions WHERE draft_id = $1 AND user_id = $2 AND permission_type = $3`
- Get all permissions for contract: `SELECT * FROM contract_permissions WHERE draft_id = $1`
- Get active permissions: `SELECT * FROM contract_permissions WHERE user_id = $1 AND (expires_at IS NULL OR expires_at > NOW())`

---

## Relationships

```
contract_drafts (1) ──── (N) contract_history
    │
    ├──── (N) contract_notifications
    │
    └──── (N) contract_permissions
```

## Foreign Key Relationships

- `contract_history.draft_id` → `contract_drafts.draft_id` (CASCADE DELETE)
- `contract_notifications.draft_id` → `contract_drafts.draft_id` (CASCADE DELETE)
- `contract_permissions.draft_id` → `contract_drafts.draft_id` (CASCADE DELETE)

## Cascade Delete Behavior

When a contract is deleted from `contract_drafts`:
- All related history entries are deleted
- All related notifications are deleted
- All related permissions are deleted

## Common Queries

### Get all contracts for an exporter with their latest status
```sql
SELECT 
  cd.*,
  ch.action as latest_action,
  ch.created_at as latest_change
FROM contract_drafts cd
LEFT JOIN contract_history ch ON cd.draft_id = ch.draft_id
WHERE cd.exporter_id = $1
ORDER BY cd.created_at DESC
```

### Get contracts awaiting buyer response
```sql
SELECT * FROM contract_drafts 
WHERE status = 'COUNTERED' 
AND buyer_email = $1
ORDER BY last_modified_at DESC
```

### Get contract timeline
```sql
SELECT 
  version_number,
  action,
  actor_type,
  created_at,
  changes,
  rejection_reason
FROM contract_history
WHERE draft_id = $1
ORDER BY version_number ASC
```

### Get unread notifications for a user
```sql
SELECT * FROM contract_notifications
WHERE recipient_id = $1 
AND is_read = FALSE
ORDER BY sent_at DESC
```

## Performance Considerations

1. **Indexes**: All frequently queried columns have indexes for fast lookups
2. **Composite Indexes**: Used for common filter combinations (exporter_id + status, buyer_email + status)
3. **Foreign Keys**: Cascade delete ensures referential integrity
4. **JSONB**: Used for flexible change tracking in contract_history
5. **Constraints**: Database-level validation ensures data integrity

## Migration Files

Migration files are located in `src/migrations/`:

- `001_create_contract_drafts_table.sql`: Creates contract_drafts table and indexes
- `002_create_contract_history_table.sql`: Creates contract_history table and indexes
- `003_create_contract_notifications_table.sql`: Creates contract_notifications table and indexes
- `004_create_contract_permissions_table.sql`: Creates contract_permissions table and indexes

Rollback files:
- `001_rollback_create_contract_drafts_table.sql`
- `002_rollback_create_contract_history_table.sql`
- `003_rollback_create_contract_notifications_table.sql`
- `004_rollback_create_contract_permissions_table.sql`

## Running Migrations

### Using the migration runner:
```typescript
import { runMigrations } from './database/migration-runner';
import path from 'path';

const migrationsDir = path.join(__dirname, 'migrations');
await runMigrations(migrationsDir);
```

### Using the schema initializer:
```typescript
import { initializeContractSchema } from './database/init-schema';

await initializeContractSchema();
```

### Manual SQL execution:
```bash
psql -U postgres -d coffee_export_db -f src/migrations/001_create_contract_drafts_table.sql
psql -U postgres -d coffee_export_db -f src/migrations/002_create_contract_history_table.sql
psql -U postgres -d coffee_export_db -f src/migrations/003_create_contract_notifications_table.sql
psql -U postgres -d coffee_export_db -f src/migrations/004_create_contract_permissions_table.sql
```

## Rollback Procedure

To rollback migrations:

```typescript
import { rollbackMigrations } from './database/migration-runner';
import path from 'path';

const migrationsDir = path.join(__dirname, 'migrations');
await rollbackMigrations(migrationsDir, 0); // Rollback to version 0 (all)
```

## Data Validation

### At Database Level
- Quantity must be >= 1 bag
- Unit price must be > 0
- Currency must be valid ISO 4217 code (3 uppercase letters)
- Status must be one of the valid values
- Delivery date must be in the future (for DRAFT contracts)

### At Application Level
- Email format validation
- Coffee type validation against supported varieties
- Delivery location validation against valid ports/cities
- Payment terms validation against approved list

## Audit Trail

All changes to contracts are tracked in `contract_history`:
- Who made the change (actor_id, actor_type)
- What changed (changes JSONB field)
- When it changed (created_at timestamp)
- Why it changed (action field)

This provides a complete audit trail for compliance and debugging.
