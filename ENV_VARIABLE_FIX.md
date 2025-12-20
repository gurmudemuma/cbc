# Environment Variable Fix - Shell Syntax Issue

## Problem

The error showed:
```
Failed to connect to PostgreSQL database {
  "error": {
    "errno": -3008,
    "code": "ENOTFOUND",
    "hostname": "${DB_HOST:-postgres}"
  }
}
```

The hostname was literally `"${DB_HOST:-postgres}"` instead of being interpolated to `"postgres"`.

## Root Cause

The `.env` files contained **shell variable syntax** like:
```bash
DB_HOST=${DB_HOST:-postgres}
IPFS_HOST=${IPFS_HOST:-ipfs}
REDIS_HOST=${REDIS_HOST:-redis}
```

However, the `dotenv` package (used by Node.js) **does NOT interpolate shell variables**. It reads these as literal strings, not as variable references.

## Solution

Removed all shell variable syntax and replaced with direct values:

### Before (Incorrect)
```bash
DB_HOST=${DB_HOST:-postgres}
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_secure_password
IPFS_HOST=${IPFS_HOST:-ipfs}
REDIS_HOST=${REDIS_HOST:-redis}
```

### After (Correct)
```bash
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
IPFS_HOST=ipfs
REDIS_HOST=redis
```

## Files Fixed

All 5 API services `.env` files were updated:

1. ✅ `/api/commercial-bank/.env`
2. ✅ `/api/national-bank/.env`
3. ✅ `/api/ecta/.env`
4. ✅ `/api/shipping-line/.env`
5. ✅ `/api/custom-authorities/.env`

## Changes Made

### Database Configuration
- `DB_HOST=${DB_HOST:-postgres}` → `DB_HOST=postgres`
- `DB_PASSWORD=your_secure_password` → `DB_PASSWORD=postgres`

### IPFS Configuration
- `IPFS_HOST=${IPFS_HOST:-ipfs}` → `IPFS_HOST=ipfs`

### Redis Configuration
- `REDIS_HOST=${REDIS_HOST:-redis}` → `REDIS_HOST=redis`

## Why This Works

1. **Docker Compose Environment Variables**: The docker-compose file already sets these values via the `environment` section
2. **Direct Values**: Using direct values in `.env` ensures dotenv reads them correctly
3. **Docker Network**: Services communicate via Docker network using service names (postgres, ipfs, redis)

## Environment Variable Precedence

When running with Docker Compose:

```
Docker Compose environment variables (highest priority)
    ↓
.env file values
    ↓
Default values in code (lowest priority)
```

So even if `.env` has `DB_HOST=postgres`, the docker-compose `environment` section can override it.

## Testing

After the fix, the connection should work:

```bash
# Start services
docker-compose -f docker-compose.postgres.yml up -d

# Check logs
docker-compose -f docker-compose.postgres.yml logs commercialbank-api

# Should see:
# [CommercialBankAPI] info: Connected to PostgreSQL database
```

## For Local Development

If running locally without Docker, update `.env` files:

```bash
# For local development (not Docker)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=coffee_export_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false

IPFS_HOST=localhost
IPFS_PORT=5001

REDIS_HOST=localhost
REDIS_PORT=6379
```

## Key Takeaway

**dotenv does NOT support shell variable syntax like `${VAR:-default}`**

Always use direct values in `.env` files. If you need environment-specific values, use:
1. Docker Compose `environment` section (for Docker)
2. System environment variables (for local development)
3. Direct values in `.env` (fallback)

## Related Files

- `DATABASE_CONNECTION_FIX.md` - Database connection pool fix
- `IPFS_IMPLEMENTATION.md` - IPFS setup guide
- `docker-compose.postgres.yml` - Docker configuration
