# Environment Variables Setup Guide

## Quick Start

Each API service needs a `.env` file. You can copy the `.env.example` files as a starting point:

```bash
# From /c/cbc/api directory

# commercialbank
cd commercialbank
cp .env.example .env
cd ..

# National Bank
cd national-bank
cp .env.example .env
cd ..

# ECTA
cd ncat
cp .env.example .env
cd ..

# Shipping Line
cd shipping-line
cp .env.example .env
cd ..
```

## Environment Variables Reference

### Required Variables (Must be set)

All services require these variables as validated by `env.validator.ts`:

| Variable | Description | Example |
|----------|-------------|---------|
| `JWT_SECRET` | Secret key for JWT tokens (min 32 chars in production) | `your-super-secret-jwt-key-at-least-32-characters-long` |
| `ORGANIZATION_ID` | Unique organization identifier | `commercialbank`, `nationalbank`, `ncat`, `shippingline` |
| `ORGANIZATION_NAME` | Human-readable organization name | `commercialbank`, `National Bank`, `ECTA`, `Shipping Line` |
| `PEER_ENDPOINT` | Hyperledger Fabric peer endpoint | `peer0.commercialbank.coffee-export.com:7051` |
| `MSP_ID` | Membership Service Provider ID | `commercialbankMSP`, `NationalBankMSP`, `ECTAMSP`, `ShippingLineMSP` |
| `CHANNEL_NAME` | Fabric channel name | `coffeechannel` |
| `CHAINCODE_NAME_EXPORT` | Export chaincode name | `coffee-export` |
| `CHAINCODE_NAME_USER` | User management chaincode name | `user-management` |
| `CONNECTION_PROFILE_PATH` | Path to Fabric connection profile JSON | `../../network/organizations/peerOrganizations/...` |
| `WALLET_PATH` | Path to store Fabric identities | `./wallet` |

### Optional Variables (with defaults)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port number |
| `NODE_ENV` | `development` | Environment mode: `development`, `production`, or `test` |
| `JWT_EXPIRY` | `24h` | JWT token expiration time |
| `REFRESH_TOKEN_EXPIRY` | `7d` | Refresh token expiration time |
| `IPFS_HOST` | `localhost` | IPFS node hostname |
| `IPFS_PORT` | `5001` | IPFS API port |
| `IPFS_PROTOCOL` | `http` | IPFS protocol: `http` or `https` |
| `LOG_LEVEL` | `info` | Logging level: `error`, `warn`, `info`, or `debug` |
| `CORS_ORIGIN` | `*` | Allowed CORS origins (comma-separated) |
| `MAX_FILE_SIZE_MB` | `10` | Maximum file upload size in MB (1-100) |
| `WEBSOCKET_ENABLED` | `true` | Enable WebSocket support |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window in milliseconds (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Max requests per rate limit window |
| `ADMIN_CERT_PATH` | `''` | Optional: Path to admin certificate |
| `ADMIN_KEY_PATH` | `''` | Optional: Path to admin private key |
| `ENCRYPTION_KEY` | `undefined` | Optional: Encryption key for sensitive data |

---

## Service-Specific Configuration

### 🏦 commercialbank (Port 3001)

```env
# Server
PORT=3001
NODE_ENV=development

# JWT
JWT_SECRET=commercialbank-secret-key-change-in-production-min-32-characters
JWT_EXPIRY=24h
REFRESH_TOKEN_EXPIRY=7d

# Organization
ORGANIZATION_ID=commercialbank
ORGANIZATION_NAME=commercialbank
MSP_ID=commercialbankMSP
PEER_ENDPOINT=peer0.commercialbank.coffee-export.com:7051

# Fabric Network
CHANNEL_NAME=coffeechannel
CHAINCODE_NAME_EXPORT=coffee-export
CHAINCODE_NAME_USER=user-management
CONNECTION_PROFILE_PATH=../../network/organizations/peerOrganizations/commercialbank.coffee-export.com/connection-commercialbank.json
WALLET_PATH=./wallet

# IPFS
IPFS_HOST=localhost
IPFS_PORT=5001
IPFS_PROTOCOL=http

# Security
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
MAX_FILE_SIZE_MB=10
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Features
WEBSOCKET_ENABLED=true
LOG_LEVEL=info
```

---

### 🏦 National Bank (Port 3002)

```env
# Server
PORT=3002
NODE_ENV=development

# JWT
JWT_SECRET=national-bank-secret-key-change-in-production-min-32-characters
JWT_EXPIRY=24h
REFRESH_TOKEN_EXPIRY=7d

# Organization
ORGANIZATION_ID=nationalbank
ORGANIZATION_NAME=National Bank
MSP_ID=NationalBankMSP
PEER_ENDPOINT=peer0.nationalbank.coffee-export.com:7051

# Fabric Network
CHANNEL_NAME=coffeechannel
CHAINCODE_NAME_EXPORT=coffee-export
CHAINCODE_NAME_USER=user-management
CONNECTION_PROFILE_PATH=../../network/organizations/peerOrganizations/nationalbank.coffee-export.com/connection-nationalbank.json
WALLET_PATH=./wallet

# IPFS
IPFS_HOST=localhost
IPFS_PORT=5001
IPFS_PROTOCOL=http

# Security
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
MAX_FILE_SIZE_MB=10
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Features
WEBSOCKET_ENABLED=true
LOG_LEVEL=info
```

---

### ☕ ECTA (Port 3003)

```env
# Server
PORT=3003
NODE_ENV=development

# JWT
JWT_SECRET=ncat-secret-key-change-in-production-must-be-32-characters-long
JWT_EXPIRY=24h
REFRESH_TOKEN_EXPIRY=7d

# Organization
ORGANIZATION_ID=ncat
ORGANIZATION_NAME=ECTA
MSP_ID=ECTAMSP
PEER_ENDPOINT=peer0.ncat.coffee-export.com:7051

# Fabric Network
CHANNEL_NAME=coffeechannel
CHAINCODE_NAME_EXPORT=coffee-export
CHAINCODE_NAME_USER=user-management
CONNECTION_PROFILE_PATH=../../network/organizations/peerOrganizations/ncat.coffee-export.com/connection-ncat.json
WALLET_PATH=./wallet

# IPFS
IPFS_HOST=localhost
IPFS_PORT=5001
IPFS_PROTOCOL=http

# Security
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
MAX_FILE_SIZE_MB=10
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Features
WEBSOCKET_ENABLED=true
LOG_LEVEL=info
```

---

### 🚢 Shipping Line (Port 3004)

```env
# Server
PORT=3004
NODE_ENV=development

# JWT
JWT_SECRET=shipping-line-secret-key-change-in-production-min-32-chars
JWT_EXPIRY=24h
REFRESH_TOKEN_EXPIRY=7d

# Organization
ORGANIZATION_ID=shippingline
ORGANIZATION_NAME=Shipping Line
MSP_ID=ShippingLineMSP
PEER_ENDPOINT=peer0.shippingline.coffee-export.com:7051

# Fabric Network
CHANNEL_NAME=coffeechannel
CHAINCODE_NAME_EXPORT=coffee-export
CHAINCODE_NAME_USER=user-management
CONNECTION_PROFILE_PATH=../../network/organizations/peerOrganizations/shippingline.coffee-export.com/connection-shippingline.json
WALLET_PATH=./wallet

# IPFS
IPFS_HOST=localhost
IPFS_PORT=5001
IPFS_PROTOCOL=http

# Security
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
MAX_FILE_SIZE_MB=10
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Features
WEBSOCKET_ENABLED=true
LOG_LEVEL=info
```

---

## Current Status

### ✅ Existing `.env.example` Files Found

All services already have `.env.example` files:
- ✅ `/api/commercialbank/.env.example` (comprehensive)
- ✅ `/api/national-bank/.env.example` (needs updates for validator)
- ✅ `/api/ncat/.env.example` (needs updates for validator)
- ✅ `/api/shipping-line/.env.example` (needs updates for validator)

### ⚠️ Variables Missing from Older `.env.example` Files

The national-bank, ncat, and shipping-line `.env.example` files are missing some required variables for the new `env.validator`. They need to be updated with:

**Missing in national-bank, ncat, shipping-line:**
- `ORGANIZATION_ID` (validator requires this)
- `ORGANIZATION_NAME` (validator requires this)
- `PEER_ENDPOINT` (validator requires this)
- `CHAINCODE_NAME_EXPORT` (uses `CHAINCODE_NAME` instead)
- `CHAINCODE_NAME_USER` (missing)
- `CONNECTION_PROFILE_PATH` (missing)
- `WALLET_PATH` (missing)
- `JWT_EXPIRY` (uses `JWT_EXPIRES_IN` instead)
- `REFRESH_TOKEN_EXPIRY` (missing)
- `MAX_FILE_SIZE_MB` (missing)
- `RATE_LIMIT_WINDOW_MS` (missing)
- `RATE_LIMIT_MAX_REQUESTS` (missing)
- `WEBSOCKET_ENABLED` (missing)
- `LOG_LEVEL` (missing)

---

## Setup Instructions

### Step 1: Create `.env` files for each service

```bash
cd /c/cbc/api

# Create .env files from examples
cp commercialbank/.env.example commercialbank/.env
cp national-bank/.env.example national-bank/.env
cp ncat/.env.example ncat/.env
cp shipping-line/.env.example shipping-line/.env
```

### Step 2: Update `.env` files with missing variables

For **national-bank, ncat, and shipping-line**, you need to add the missing variables to your `.env` files. Use the service-specific configurations shown above.

**Quick Fix Option**: Copy the complete configurations from the "Service-Specific Configuration" section above directly into your `.env` files.

### Step 3: Customize for your environment

Update these values based on your setup:

1. **JWT_SECRET**: Generate a secure secret in production:
   ```bash
   openssl rand -base64 64
   ```

2. **CORS_ORIGIN**: Set to your frontend URL(s):
   ```env
   CORS_ORIGIN=http://localhost:5173
   ```

3. **Connection paths**: Verify your network organization paths exist:
   ```bash
   ls ../../network/organizations/peerOrganizations/
   ```

4. **IPFS**: If running IPFS on a different host/port, update:
   ```env
   IPFS_HOST=your-ipfs-host
   IPFS_PORT=5001
   ```

---

## Validation

After creating your `.env` files, the services will automatically validate them on startup. You'll see:

**✅ Success:**
```
Environment Configuration Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Environment: development
  Port: 3001
  Organization: commercialbank (commercialbank)
  MSP ID: commercialbankMSP
  Channel: coffeechannel
  Chaincode Export: coffee-export
  Chaincode User: user-management
  WebSocket: Enabled
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Environment validation successful
```

**❌ Failure:**
```
Environment validation failed:
  ❌ Missing required environment variable: ORGANIZATION_ID
  ❌ Missing required environment variable: PEER_ENDPOINT
  ❌ Invalid PORT: abc. Must be between 1 and 65535
```

---

## Production Considerations

### Security Checklist

- [ ] Generate strong JWT_SECRET (64+ characters)
- [ ] Set `NODE_ENV=production`
- [ ] Configure proper CORS_ORIGIN (not `*`)
- [ ] Set up ENCRYPTION_KEY for sensitive data
- [ ] Use HTTPS for IPFS if accessing remotely
- [ ] Review and adjust rate limiting based on load
- [ ] Enable proper logging (`LOG_LEVEL=warn` or `error`)
- [ ] Secure connection profile and wallet paths
- [ ] Use environment variable management (e.g., AWS Secrets Manager, HashiCorp Vault)

### Example Production `.env`

```env
PORT=3001
NODE_ENV=production
LOG_LEVEL=warn

JWT_SECRET=<use-aws-secrets-manager-or-vault>
ENCRYPTION_KEY=<use-kms-or-vault>

ORGANIZATION_ID=commercialbank
ORGANIZATION_NAME=commercialbank
MSP_ID=commercialbankMSP
PEER_ENDPOINT=peer0.commercialbank.coffee-export.com:7051

CHANNEL_NAME=coffeechannel
CHAINCODE_NAME_EXPORT=coffee-export
CHAINCODE_NAME_USER=user-management
CONNECTION_PROFILE_PATH=/etc/fabric/connection-commercialbank.json
WALLET_PATH=/var/fabric/wallets/commercialbank

IPFS_HOST=ipfs.yourcompany.com
IPFS_PORT=5001
IPFS_PROTOCOL=https

CORS_ORIGIN=https://app.yourcompany.com
MAX_FILE_SIZE_MB=50
WEBSOCKET_ENABLED=true
```

---

## Troubleshooting

### Error: "Missing required environment variable: X"
**Solution**: Add the missing variable to your `.env` file. Check the "Required Variables" section above.

### Error: "JWT_SECRET must be at least 32 characters in production"
**Solution**: Generate a longer secret:
```bash
openssl rand -base64 64
```

### Error: "Connection profile not found at ..."
**Solution**: Verify the path in `CONNECTION_PROFILE_PATH` exists or update it to the correct location.

### Error: "Invalid PORT: X. Must be between 1 and 65535"
**Solution**: Use a valid port number (e.g., 3001-3004 for the services).

---

## Next Steps

After setting up environment variables:

1. ✅ Create `.env` files for all services
2. ✅ Verify Hyperledger Fabric network is running
3. ✅ Start IPFS daemon (if using IPFS features)
4. ✅ Start each API service
5. ✅ Check health endpoints

See `/api/REVIEW_COMPLETE.md` for complete startup instructions.
