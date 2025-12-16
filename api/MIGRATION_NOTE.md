# API Directory Migration Note

## Old Directory Names → New Directory Names

The following API directories have been renamed for consistency:

- `banker/` → `commercialbank/` (commercialbank API - Port 3001)
- `nb-regulatory/` → `national-bank/` (National Bank API - Port 3002)

## Status

- ✅ **commercialbank/** - Active, fully configured
- ✅ **national-bank/** - Active, fully configured
- ✅ **ncat/** - Active, fully configured
- ✅ **shipping-line/** - Active, fully configured
- ✅ **custom-authorities/** - Active, fully configured

- ⚠️ **banker/** - DEPRECATED (use commercialbank instead)
- ⚠️ **nb-regulatory/** - DEPRECATED (use national-bank instead)

## Updated Scripts

All scripts in `/scripts` and root directory have been updated to use the new directory names:
- `enroll-admins.sh`
- `register-working-users.sh`
- `start-apis.sh`
- `stop-apis.sh`
- And all other automation scripts

## Docker Configuration

Docker Compose and all Dockerfiles are configured to use:
- **commercialbank-api** container
- **national-bank-api** container
- **ncat-api** container
- **shipping-line-api** container
- **custom-authorities-api** container

## Environment Variables

All `.env` files have been created in the correct directories with proper:
- JWT secrets (88+ characters)
- Admin certificate paths (`/app/crypto/...`)
- Docker network hostnames (not localhost)
- Connection profile paths

## Next Steps

The old `banker/` and `nb-regulatory/` directories can be safely removed once you've verified all functionality works with the new structure.

```bash
# To remove old directories (optional):
cd /home/gu-da/cbc/api
rm -rf banker/ nb-regulatory/
```
