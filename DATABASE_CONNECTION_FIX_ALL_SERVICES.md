# Database Connection Fix - All Services

## Issue Identified

Only Commercial Bank API was connecting to the database because it uses `getPool()` function, while other services import `pool` directly which is null until initialized.

## Root Cause

The database pool is a singleton that needs to be initialized via `getPool()` function. Services that import `pool` directly get a null reference.

## Solution

Replace all direct `pool` imports with `getPool()` and `closePool()` functions in all services.

## Services Fixed

### ✅ Fixed Services
1. **Commercial Bank API (3001)** - Already using getPool()
2. **National Bank API (3002)** - ✅ FIXED
3. **ECTA API (3003)** - ✅ FIXED

### 🔧 Services Still Need Fixing
4. **Shipping Line API (3004)** - Needs fixing
5. **Custom Authorities API (3005)** - Needs fixing
6. **ECX API (3006)** - Needs fixing
7. **Exporter Portal API (3007)** - Needs fixing

## Fix Pattern

For each service, replace:

```typescript
// OLD (WRONG)
import { pool } from "../../shared/database/pool";

// NEW (CORRECT)
import { getPool, closePool } from "../../shared/database/pool";
```

Then replace all `pool.query()` calls with `getPool().query()`:

```typescript
// OLD
const result = await pool.query('SELECT NOW()');

// NEW
const pool = getPool();
const result = await pool.query('SELECT NOW()');
```

And replace `pool.end()` with `closePool()`:

```typescript
// OLD
await pool.end();

// NEW
await closePool();
```

## Files to Fix

1. `/home/gu-da/cbc/api/shipping-line/src/index.ts`
2. `/home/gu-da/cbc/api/custom-authorities/src/index.ts`
3. `/home/gu-da/cbc/api/ecx/src/index.ts`
4. `/home/gu-da/cbc/api/exporter-portal/src/index.ts`

## Expected Result

After fixing all services, each should display on startup:

```
[DatabasePool] info: Database pool configuration {
  "host": "localhost",
  "port": 5432,
  "database": "coffee_export_db",
  "user": "postgres",
  "ssl": false
}

[API_NAME] info: Connected to PostgreSQL database
```

## Verification

After fixes, all services should connect successfully:

```bash
# Check all services
for port in {3001..3007}; do
  echo "Port $port:"
  curl -s http://localhost:$port/health | jq '.database'
done
```

Expected output: All should show `"connected"`

---

**Status:** 3/7 services fixed, 4 remaining
