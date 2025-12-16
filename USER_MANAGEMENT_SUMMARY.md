# User Management Summary
## Quick Reference Guide

**System:** Coffee Export Consortium (CBC)
**Architecture:** Hyperledger Fabric + PostgreSQL Hybrid

---

## Quick Overview

### Two-Layer User Management

```
┌─────────────────────────────────────────┐
│  Blockchain (Hyperledger Fabric)        │
│  - Source of Truth                      │
│  - Immutable Audit Trail                │
│  - Consensus-based Validation           │
│  - X.509 Certificates (MSP)             │
└─────────────────────────────────────────┘
              ↕ Synchronization
┌─────────────────────────────────────────┐
│  Database (PostgreSQL)                  │
│  - Performance Cache                    │
│  - Session Management                   │
│  - Business Logic                       │
│  - Quick Queries                        │
└─────────────────────────────────────────┘
```

---

## Key Components

### 1. Blockchain Layer

**User Chaincode Transactions:**
- `RegisterUser` - Create new user
- `GetUserByUsername` - Query user
- `GetUserByEmail` - Query by email
- `UpdateLastLogin` - Update login timestamp
- `UpdatePassword` - Change password
- `DeactivateUser` - Disable account
- `ActivateUser` - Enable account

**Wallet Management:**
- File-based wallet at `/app/wallet/`
- X.509 identity per organization
- Admin identity for API operations

### 2. Database Layer

**Core Tables:**

| Table | Purpose |
|-------|---------|
| `users` | User accounts (synced from blockchain) |
| `organizations` | Organization definitions (7 orgs) |
| `user_roles` | Role definitions and permissions |
| `user_sessions` | Active sessions and tokens |
| `user_audit_logs` | Audit trail of user actions |
| `exporter_profiles` | Exporter business information |

**Organizations:**
- commercial-bank (CommercialBankMSP)
- national-bank (NationalBankMSP)
- ecta (ECTAMSP)
- ecx (ECXMSP)
- customs (CustomsMSP)
- shipping-line (ShippingLineMSP)
- exporter-portal (ExporterPortalMSP)

### 3. User Roles

| Role | Organization | Permissions |
|------|--------------|-------------|
| Banking Officer | Commercial/National Bank | verify_documents, approve_financing |
| FX Officer | National Bank | manage_fx_rates, approve_fx_requests |
| Quality Officer | ECTA | issue_certificates, grade_lots |
| Lot Verifier | ECX | verify_lots, check_prices |
| Customs Officer | Customs | clear_shipments, verify_documents |
| Shipping Officer | Shipping Line | track_shipments, confirm_delivery |
| Exporter | Exporter Portal | create_exports, view_applications |
| Admin | Any | all_operations |

---

## User Lifecycle

### Registration Flow

```
1. User submits registration
   ↓
2. Validate input (email, username, password)
   ↓
3. Hash password with bcrypt (10 rounds)
   ↓
4. Register on blockchain (SUBMIT TRANSACTION)
   ↓
5. Sync to PostgreSQL (INSERT)
   ↓
6. Create exporter profile (if applicable)
   ↓
7. Generate JWT token
   ↓
8. Return token to client
```

### Authentication Flow

```
1. User submits credentials
   ↓
2. Check rate limiting
   ↓
3. Query blockchain for user
   ↓
4. Verify password with bcrypt
   ↓
5. Update last login on blockchain
   ↓
6. Create session in database
   ↓
7. Generate JWT token (24h expiry)
   ↓
8. Log audit event
   ↓
9. Return token to client
```

### Authorization Flow

```
1. Client sends request with JWT token
   ↓
2. Extract token from Authorization header
   ↓
3. Verify token signature
   ↓
4. Check token expiration
   ↓
5. Verify session is active
   ↓
6. Check user role
   ↓
7. Check user permissions
   ↓
8. Check organization access
   ↓
9. Check resource ownership (if applicable)
   ↓
10. Allow/Deny request
```

---

## Data Synchronization

### Write-Through Pattern (Current)

```
API Request
    ↓
Blockchain Write (SUBMIT TRANSACTION)
    ↓
Database Write (INSERT/UPDATE)
    ↓
Return Response
```

**Advantages:**
- Blockchain always up-to-date
- Immutable audit trail
- Consensus-based validation

**Disadvantages:**
- Slower (blockchain latency ~2-5 seconds)
- Potential inconsistency if DB write fails

### Conflict Resolution

**Scenario 1: Blockchain Success, DB Failure**
- Queue for retry
- Return success (blockchain is source of truth)
- Background worker syncs later

**Scenario 2: DB Success, Blockchain Failure**
- Rollback database
- Return error
- User must retry

**Scenario 3: Data Mismatch**
- Periodic reconciliation job
- Blockchain data takes precedence
- Update database to match

---

## Security Features

### Authentication Security

✅ **Password Hashing**
- bcrypt with 10 salt rounds
- Never stored in plaintext
- Verified on every login

✅ **JWT Tokens**
- 24-hour expiration
- RS256 or HS256 algorithm
- Token blacklist for revocation
- Issuer and audience validation

✅ **Rate Limiting**
- 100 login attempts per 15 minutes
- Progressive delays
- IP-based tracking

### Authorization Security

✅ **Multi-Level Authorization**
1. Role-based (coarse-grained)
2. Permission-based (fine-grained)
3. Organization-based (boundaries)
4. MSP-based (blockchain identity)
5. Ownership-based (resource ownership)

✅ **Session Management**
- Active session tracking
- Concurrent session limits
- Automatic timeout
- IP and user agent validation

### Audit Logging

✅ **Logged Events**
- User registration
- Login/logout
- Password changes
- Role changes
- Account deactivation
- Permission changes
- Data access

✅ **Audit Trail**
- Immutable on blockchain
- Queryable in database
- Timestamp and user tracking
- IP address and user agent

---

## API Endpoints

### Authentication Endpoints

```
POST /api/auth/register
  Request: { username, password, email, organizationId, role }
  Response: { success, token, user }

POST /api/auth/login
  Request: { username, password }
  Response: { success, token, user }

POST /api/auth/logout
  Request: { Authorization: Bearer <token> }
  Response: { success }

POST /api/auth/refresh-token
  Request: { Authorization: Bearer <token> }
  Response: { success, token }
```

### User Management Endpoints

```
GET /api/users
  Authorization: Bearer <token>
  Response: { success, users }

GET /api/users/:userId
  Authorization: Bearer <token>
  Response: { success, user }

PUT /api/users/:userId
  Authorization: Bearer <token>
  Request: { email, role, ... }
  Response: { success, user }

DELETE /api/users/:userId
  Authorization: Bearer <token>
  Response: { success }
```

### Exporter Profile Endpoints

```
POST /api/exporter-profiles
  Authorization: Bearer <token>
  Request: { businessName, tin, registrationNumber, ... }
  Response: { success, profile }

GET /api/exporter-profiles/:userId
  Authorization: Bearer <token>
  Response: { success, profile }

PUT /api/exporter-profiles/:exporterId
  Authorization: Bearer <token>
  Request: { businessName, ... }
  Response: { success, profile }
```

---

## Database Schema

### Users Table

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    organization_id VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_organization_role ON users(organization_id, role);
```

### User Sessions Table

```sql
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- Indexes
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX idx_user_sessions_is_active ON user_sessions(is_active);
```

### User Audit Logs Table

```sql
CREATE TABLE user_audit_logs (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_user_audit_logs_user_id ON user_audit_logs(user_id);
CREATE INDEX idx_user_audit_logs_action ON user_audit_logs(action);
CREATE INDEX idx_user_audit_logs_created_at ON user_audit_logs(created_at);
```

### Exporter Profiles Table

```sql
CREATE TABLE exporter_profiles (
    exporter_id UUID PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL UNIQUE,
    business_name VARCHAR(500) NOT NULL,
    tin VARCHAR(50) NOT NULL UNIQUE,
    registration_number VARCHAR(100) NOT NULL UNIQUE,
    business_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    approved_by VARCHAR(255),
    approved_at TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_exporter_profiles_user_id ON exporter_profiles(user_id);
CREATE INDEX idx_exporter_profiles_status ON exporter_profiles(status);
CREATE INDEX idx_exporter_profiles_tin ON exporter_profiles(tin);
```

---

## Configuration

### Environment Variables

```bash
# JWT Configuration
JWT_SECRET=<min 64 chars in production>
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
JWT_ALGORITHM=RS256  # or HS256

# Blockchain Configuration
CONNECTION_PROFILE_PATH=/app/crypto/connection-profile.json
WALLET_PATH=/app/wallet
CHANNEL_NAME=coffeechannel
CHAINCODE_NAME_USER=user-management
CHAINCODE_NAME_EXPORT=coffee-export
MSP_ID=CommercialBankMSP
ORGANIZATION_ID=commercial-bank

# Database Configuration
DATABASE_URL=postgresql://user:password@postgres:5432/coffee_export_db
COUCHDB_PASSWORD=<secure password>

# Security Configuration
BCRYPT_ROUNDS=10
RATE_LIMIT_WINDOW=900000  # 15 minutes
RATE_LIMIT_MAX_ATTEMPTS=100
SESSION_TIMEOUT=86400000  # 24 hours
```

---

## Common Operations

### Register a New User

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "exporter1",
    "password": "SecurePassword123!",
    "email": "exporter@example.com",
    "organizationId": "commercial-bank",
    "role": "exporter"
  }'
```

### Login User

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "exporter1",
    "password": "SecurePassword123!"
  }'
```

### Access Protected Endpoint

```bash
curl -X GET http://localhost:3001/api/exports \
  -H "Authorization: Bearer <token>"
```

### Create Exporter Profile

```bash
curl -X POST http://localhost:3001/api/exporter-profiles \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "ABC Coffee Exports",
    "tin": "0123456789",
    "registrationNumber": "REG-2024-001",
    "businessType": "PRIVATE",
    "officeAddress": "123 Main St",
    "contactPerson": "John Doe",
    "email": "contact@abccoffee.com",
    "phone": "+251911234567"
  }'
```

---

## Troubleshooting

### Issue: User not found in blockchain

**Causes:**
- User not registered yet
- Blockchain network down
- Wallet missing admin identity

**Solution:**
1. Check blockchain network status
2. Verify wallet contains admin identity
3. Check user registration logs
4. Restart API service

### Issue: Database sync failed

**Causes:**
- Database connection lost
- Unique constraint violation
- Table doesn't exist

**Solution:**
1. Check database connection
2. Verify user table exists
3. Check for duplicate usernames/emails
4. Review database logs

### Issue: Token validation failed

**Causes:**
- Token expired
- Token signature invalid
- Token revoked
- JWT_SECRET mismatch

**Solution:**
1. Verify JWT_SECRET is correct
2. Check token expiration
3. Check token blacklist
4. Regenerate token

### Issue: Session expired

**Causes:**
- Session timeout (24 hours)
- User logged out
- Database connection lost

**Solution:**
1. User must login again
2. Check session timeout settings
3. Verify database connection

---

## Performance Optimization

### Database Indexes

✅ **Implemented:**
- `idx_users_username` - Fast login lookups
- `idx_users_email` - Email verification
- `idx_users_organization_id` - Organization queries
- `idx_users_role` - Role-based queries
- `idx_users_organization_role` - Combined queries
- `idx_user_sessions_user_id` - Session lookups
- `idx_user_audit_logs_user_id` - Audit queries

### Caching Strategy

✅ **Redis Cache:**
- User profiles (TTL: 1 hour)
- Organization data (TTL: 24 hours)
- Role permissions (TTL: 24 hours)
- Rate limit counters (TTL: 15 minutes)

### Query Optimization

✅ **Techniques:**
- Connection pooling
- Prepared statements
- Batch operations
- Pagination for large result sets

---

## Monitoring & Maintenance

### Key Metrics

- Active users
- Failed login attempts
- Session duration
- API response time
- Database query time
- Blockchain transaction time

### Maintenance Tasks

**Daily:**
- Monitor failed logins
- Check database performance
- Review error logs

**Weekly:**
- Analyze user activity
- Check session cleanup
- Review audit logs

**Monthly:**
- Reconcile blockchain and database
- Update security patches
- Review access patterns

**Quarterly:**
- Security audit
- Performance review
- Capacity planning

---

## References

- [USER_MANAGEMENT_ARCHITECTURE.md](./USER_MANAGEMENT_ARCHITECTURE.md) - Detailed architecture
- [USER_MANAGEMENT_IMPLEMENTATION.md](./USER_MANAGEMENT_IMPLEMENTATION.md) - Code examples
- [HYBRID_SECURITY_REVIEW.md](./HYBRID_SECURITY_REVIEW.md) - Security analysis

---

**Document Version:** 1.0
**Last Updated:** 2024
**Status:** Production Ready
