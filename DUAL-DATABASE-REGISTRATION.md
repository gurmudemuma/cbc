# Dual Database Registration System

## Overview

The Coffee Blockchain Consortium uses a **DUAL DATABASE** architecture where user data is stored in BOTH:

1. **PostgreSQL** - Traditional relational database for CBC application data
2. **CouchDB** (via Hyperledger Fabric) - Blockchain ledger for immutable records

## Why Dual Registration?

- **PostgreSQL**: Fast queries, complex joins, application state
- **Blockchain**: Immutable audit trail, distributed consensus, tamper-proof records
- **Synchronization**: Both databases must stay in sync for the system to work correctly

## Registration Flow

### 1. User Registration (`POST /api/auth/register`)

When a new exporter registers:

```javascript
// STEP 1: Validate input
- Check required fields (username, password, email, companyName, tin, capitalETB)
- Validate minimum capital requirements based on business type
- Check for duplicate username/email/TIN

// STEP 2: Register in PostgreSQL
INSERT INTO users (
  username, password_hash, email, phone, company_name, tin,
  capital_etb, address, contact_person, role, status
) VALUES (...);

// STEP 3: Register on Blockchain (CouchDB)
await fabricService.registerUser({
  username, passwordHash, email, phone, companyName, tin,
  capitalETB, address, contactPerson, role: 'exporter'
});

// STEP 4: Send confirmation email
notificationService.notifyRegistrationSubmitted(...);
```

**Initial Status**: `pending_approval` in BOTH databases

### 2. ECTA Approval (`POST /api/ecta/registrations/:username/approve`)

When ECTA approves a registration:

```javascript
// STEP 1: Update Blockchain (CouchDB)
await fabricService.updateUserStatus(username, {
  status: 'approved',
  approvedBy: req.user.id,
  comments: comments
});

// STEP 2: Update PostgreSQL
UPDATE users 
SET status = 'approved', updated_at = NOW() 
WHERE username = :username;

// STEP 3: Approve profile stage
await fabricService.submitTransaction(
  'ApprovePreRegistration', username, 'profile'
);

// STEP 4: Send approval email
notificationService.notifyProfileApproved(...);
```

**Final Status**: `approved` in BOTH databases

### 3. User Login (`POST /api/auth/login`)

When a user logs in:

```javascript
// STEP 1: Get user from Blockchain
const user = await fabricService.getUser(username);

// STEP 2: Verify password
const validPassword = await bcrypt.compare(password, user.passwordHash);

// STEP 3: Check approval status
if (user.status === 'pending_approval') {
  return 403 - Account pending approval
}

if (user.status === 'rejected') {
  return 403 - Account rejected
}

// STEP 4: Generate JWT token
const token = jwt.sign({ id, role, companyName, status }, JWT_SECRET);
```

## Database Schemas

### PostgreSQL Schema

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  company_name VARCHAR(255),
  tin VARCHAR(100) UNIQUE,
  capital_etb NUMERIC(15,2),
  address TEXT,
  contact_person VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  status VARCHAR(50) DEFAULT 'pending_approval',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Blockchain Schema (CouchDB)

```javascript
{
  "docType": "user",
  "username": "sami",
  "passwordHash": "$2a$10$...",
  "email": "sami@example.com",
  "phone": "+251911234567",
  "companyName": "Sami Coffee Exports",
  "tin": "TIN_SAMI_2024",
  "capitalETB": 50000000,
  "address": "Addis Ababa, Ethiopia",
  "contactPerson": "Sami Ahmed",
  "role": "exporter",
  "status": "approved",
  "registeredAt": "2024-01-15T10:30:00Z",
  "approvedAt": "2024-01-16T14:20:00Z",
  "approvedBy": "ecta1"
}
```

## Synchronization Points

### Registration
- ✅ PostgreSQL INSERT
- ✅ Blockchain RegisterUser
- ✅ Rollback on failure

### Approval
- ✅ Blockchain UpdateUserStatus
- ✅ PostgreSQL UPDATE
- ✅ Email notification

### Rejection
- ✅ Blockchain UpdateUserStatus
- ✅ PostgreSQL UPDATE
- ✅ Email notification

### Login
- ✅ Blockchain query (source of truth for auth)
- ✅ JWT generation

## Troubleshooting

### User exists in PostgreSQL but not Blockchain

```bash
# Check PostgreSQL
docker exec coffee-postgres psql -U postgres -d coffee_export_db -c "SELECT username, status FROM users WHERE username = 'sami';"

# Check Blockchain
docker exec coffee-gateway node -e "const fabricService = require('./src/services/fabric-chaincode'); fabricService.getUser('sami').then(u => console.log(JSON.stringify(u, null, 2))).catch(e => console.error(e.message));"
```

**Solution**: Re-register the user via API to create in both databases

### User exists in Blockchain but not PostgreSQL

```bash
# Manually insert into PostgreSQL
docker exec coffee-postgres psql -U postgres -d coffee_export_db -c "
INSERT INTO users (username, password_hash, email, phone, company_name, tin, capital_etb, address, contact_person, role, status)
VALUES ('sami', '\$2a\$10\$...', 'sami@example.com', '+251911234567', 'Sami Coffee Exports', 'TIN_SAMI_2024', 50000000, 'Addis Ababa', 'Sami Ahmed', 'exporter', 'approved');
"
```

### User can't login after approval

1. Check status in both databases
2. Verify password hash matches
3. Check JWT_SECRET environment variable
4. Review gateway logs: `docker logs coffee-gateway --tail 50`

## Testing Dual Registration

### Test Script: `register-sami-dual.bat`

```batch
# 1. Register user
curl -X POST http://localhost:3000/api/auth/register ...

# 2. Login as ECTA admin
curl -X POST http://localhost:3000/api/auth/login ...

# 3. Approve user
curl -X POST http://localhost:3000/api/ecta/registrations/sami/approve ...

# 4. Verify login
curl -X POST http://localhost:3000/api/auth/login ...
```

### Verification Queries

```bash
# PostgreSQL
docker exec coffee-postgres psql -U postgres -d coffee_export_db -c "SELECT username, email, role, status FROM users WHERE username = 'sami';"

# Blockchain
docker exec coffee-gateway node -e "const fabricService = require('./src/services/fabric-chaincode'); fabricService.getUser('sami').then(u => console.log(JSON.stringify(u, null, 2))).catch(e => console.error(e.message));"
```

## API Endpoints

### Registration
- `POST /api/auth/register` - Register new user (dual database)
- `GET /api/auth/registration-status/:username` - Check registration status

### Approval (ECTA only)
- `POST /api/ecta/registrations/:username/approve` - Approve user (dual database)
- `POST /api/ecta/registrations/:username/reject` - Reject user (dual database)
- `GET /api/ecta/registrations` - List all registrations

### Authentication
- `POST /api/auth/login` - Login (checks blockchain)
- `GET /api/exporter/profile` - Get user profile

## Best Practices

1. **Always use the API** - Don't manually insert into databases
2. **Check both databases** - When troubleshooting, verify both sources
3. **Monitor logs** - Watch for sync errors in gateway and bridge logs
4. **Test registration flow** - Use the test script to verify dual registration
5. **Backup both databases** - PostgreSQL dumps + Blockchain snapshots

## Future Enhancements

- [ ] Automatic reconciliation service
- [ ] Sync health monitoring dashboard
- [ ] Automatic retry on sync failures
- [ ] Conflict resolution strategies
- [ ] Real-time sync status indicators

## Support

For issues with dual registration:
1. Check logs: `docker logs coffee-gateway --tail 100`
2. Verify database connectivity
3. Test with curl commands
4. Review this documentation

---

**Last Updated**: 2024-01-15
**System Version**: 1.0.0
