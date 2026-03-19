# Data Sync Strategy: PostgreSQL ↔ Blockchain

## Overview
The system uses a hybrid architecture where PostgreSQL is the primary data store and Hyperledger Fabric blockchain is the immutable audit log.

## Sync Flow

### 1. Initial Startup (Seeding Phase)
- **When**: During `npm run seed` in startup script
- **What**: Creates users and profiles in PostgreSQL only
- **Why**: Blockchain operations are disabled to avoid CLI container errors
- **Result**: All users exist in PostgreSQL with complete profiles

### 2. Post-Startup Sync (After System Ready)
- **When**: After all services are running, via `npm run sync-users`
- **What**: Syncs all PostgreSQL users to blockchain
- **Why**: Ensures blockchain has audit trail after system is stable
- **Result**: Users replicated to blockchain for immutability

### 3. Runtime Sync (During Operations)
- **When**: When users register or perform actions
- **What**: New registrations sync to blockchain automatically
- **Why**: Maintains real-time audit trail
- **Result**: All new data appears in both PostgreSQL and blockchain

## Execution Timeline

```
START SYSTEM
    ↓
[1] Start blockchain infrastructure (orderers, peers, CLI)
    ↓
[2] Start application services (PostgreSQL, gateway)
    ↓
[3] Seed database (PostgreSQL only - blockchain disabled)
    ↓
[4] Start CBC services and frontend
    ↓
[5] Sync users to blockchain (npm run sync-users)
    ↓
SYSTEM READY
    ↓
[6] New registrations sync automatically
```

## Commands

### Manual Sync
```bash
# Sync all existing users to blockchain
npm run sync-users

# Check database contents
npm run check-db

# Verify users exist
npm run verify-users
```

### Startup Scripts
```bash
# Windows
scripts/start-system.bat

# Linux/Mac
scripts/start-system.sh
```

## Data Consistency

### PostgreSQL (Primary)
- Users and profiles
- Qualifications (lab, taster, competence, license)
- Transactions and contracts
- Real-time operational data

### Blockchain (Audit Log)
- User registrations
- Status changes
- Transactions
- Immutable history

## Failure Handling

### If Blockchain Sync Fails
- System continues operating (PostgreSQL is primary)
- Users can still login and work
- Manually sync later: `npm run sync-users`
- No data loss

### If PostgreSQL Fails
- Blockchain has audit trail
- Can recover from blockchain records
- Requires manual data restoration

## Best Practices

1. **Always run startup script** - Ensures proper initialization order
2. **Monitor sync status** - Check logs for sync errors
3. **Regular backups** - Backup PostgreSQL regularly
4. **Verify sync** - Run `npm run check-db` to confirm data
