# Scripts Update Summary

## ✅ All Scripts Updated Successfully

### 1. **Scripts Directory** (`/scripts`)
Updated files:
- ✅ `enroll-admins.sh` - Fixed API paths (banker → commercialbank, nb-regulatory → national-bank)
- ✅ `start-apis.sh` - Updated all API directory references
- ✅ `stop-apis.sh` - Updated PID file and log file names
- ✅ `dev-apis.sh` - Updated development startup paths
- ✅ `clean.sh` - Updated cleanup paths
- ✅ `fix-configurations.sh` - Updated configuration paths
- ✅ `setup-env.sh` - Updated environment setup paths
- ✅ `validate-all.sh` - Updated validation paths
- ✅ `security-validation.sh` - Updated security check paths
- ✅ `register-test-users-improved.sh` - Updated API references
- ✅ `register-test-users.sh` - Updated API references
- ✅ `register-working-users.sh` - Already correct (uses ports, not paths)

### 2. **Root Directory Scripts**
Updated files:
- ✅ `standardize-naming.sh` - Updated API directory names
- ✅ `complete-fix.sh` - Updated all references
- ✅ `fix-all-remaining.sh` - Updated all references
- ✅ `kill-api-processes.sh` - Updated process names
- ✅ `start-system.sh` - Updated startup paths
- ✅ `check-existing-users.sh` - Updated API paths

### 3. **Network Scripts** (`/network/scripts`)
Updated files:
- ✅ `generate-connection-profiles.sh` - Changed localhost to Docker hostnames
- ✅ Added CustomAuthorities to profile generation

### 4. **Key Changes Made**

#### Directory Name Updates:
```bash
api/banker/ → api/commercialbank/
api/nb-regulatory/ → api/national-bank/
```

#### API Name Updates:
```bash
"Banker API" → "commercialbank API"
"NB Regulatory API" → "National Bank API"
```

#### Log File Updates:
```bash
logs/banker.log → logs/commercialbank.log
logs/nb-regulatory.log → logs/national-bank.log
```

#### PID File Updates:
```bash
logs/banker.pid → logs/commercialbank.pid
logs/nb-regulatory.pid → logs/national-bank.pid
```

#### Network Configuration Updates:
```bash
"grpcs://localhost:7051" → "grpcs://peer0.commercialbank.coffee-export.com:7051"
"grpcs://localhost:8051" → "grpcs://peer0.nationalbank.coffee-export.com:8051"
etc.
```

### 5. **Docker & Environment Configuration**

#### Updated in docker-compose.yml:
- ✅ All peer URLs use Docker network hostnames
- ✅ Admin certificate paths: `/app/crypto/users/Admin@...`
- ✅ Connection profiles: `/app/crypto/connection-*.json`
- ✅ JWT_SECRET: 88 characters (meets security requirements)

#### Updated .env files:
- ✅ All 5 services have correct .env files
- ✅ CORS origins include Docker network
- ✅ IPFS_HOST=ipfs (not localhost)
- ✅ Admin paths point to mounted crypto directories

### 6. **Connection Profiles**

All connection profiles updated:
- ✅ commercialbank.coffee-export.com
- ✅ nationalbank.coffee-export.com
- ✅ ncat.coffee-export.com
- ✅ shippingline.coffee-export.com
- ✅ customauthorities.coffee-export.com

Changed from `grpcs://localhost:PORT` to `grpcs://peer0.ORG.coffee-export.com:PORT`

### 7. **File Permissions**

Fixed admin certificate permissions:
```bash
# All admin private keys: 644
network/organizations/peerOrganizations/*/users/Admin@*/msp/keystore/priv_sk

# All admin certificates: 644
network/organizations/peerOrganizations/*/users/Admin@*/msp/signcerts/*-cert.pem
```

## 🎯 Verification Commands

Test that all updates work:
```bash
# 1. Re-enroll admins with new paths
cd /home/gu-da/cbc/scripts
./enroll-admins.sh

# 2. Restart API services with updated configuration
cd /home/gu-da/cbc
docker-compose up -d --force-recreate national-bank-api commercialbank-api ncat-api shipping-line-api custom-authorities-api

# 3. Check service health
docker ps --filter "name=-api"

# 4. Test user registration
cd /home/gu-da/cbc/scripts
./register-working-users.sh

# 5. Verify logs
docker logs national-bank-api 2>&1 | tail -20
```

## 📝 Total Files Updated

- **Scripts directory**: 11 files
- **Root directory**: 6 files  
- **Network scripts**: 1 file
- **Connection profiles**: 5 files (already done)
- **Environment files**: 5 files (already done)
- **docker-compose.yml**: 1 file (already done)

**Total: 29 files updated**

## ⚠️ Deprecated Directories

Old directories still exist but are no longer used:
- `/api/banker/` - DEPRECATED
- `/api/nb-regulatory/` - DEPRECATED

See `/api/MIGRATION_NOTE.md` for details.

## ✅ Status: All Scripts Updated and Ready\!

All scripts now use:
- ✅ Correct API directory names
- ✅ Docker network hostnames (not localhost)
- ✅ Proper certificate paths
- ✅ Consistent naming conventions
- ✅ All 5 organizations included
