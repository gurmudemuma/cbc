# 🔐 User Management Alignment - Chaincode ↔ PostgreSQL

## Executive Summary

This document aligns the **Hyperledger Fabric user-management chaincode** with the **PostgreSQL database schema** to ensure consistent user management across blockchain and relational database layers.

---

## 📋 Chaincode User Structure

### Blockchain User Model (user-management chaincode)

```go
type User struct {
    ID             string `json:"id"`              // UUID
    Username       string `json:"username"`        // Unique username
    PasswordHash   string `json:"passwordHash"`    // bcrypt hash
    Email          string `json:"email"`           // Unique email
    OrganizationID string `json:"organizationId"`  // Organization reference
    Role           string `json:"role"`            // User role
    CreatedAt      string `json:"createdAt"`       // RFC3339 timestamp
    UpdatedAt      string `json:"updatedAt"`       // RFC3339 timestamp
    LastLogin      string `json:"lastLogin"`       // RFC3339 timestamp
    IsActive       bool   `json:"isActive"`        // Account status
}
```

### Chaincode Functions

| Function | Purpose | Parameters |
|----------|---------|-----------|
| `RegisterUser` | Create new user | userID, username, passwordHash, email, organizationID, role |
| `GetUser` | Retrieve user by ID | userID |
| `GetUserByUsername` | Retrieve user by username | username |
| `GetUserByEmail` | Retrieve user by email | email |
| `UpdateLastLogin` | Update login timestamp | userID |
| `UpdatePassword` | Update password hash | userID, newPasswordHash |
| `DeactivateUser` | Deactivate account | userID |
| `ActivateUser` | Activate account | userID |
| `GetAllUsers` | Get all users (admin) | - |
| `GetUsersByOrganization` | Get org users | organizationID |

---

## 🗄️ PostgreSQL User Schema

### Required Table: `users`

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    organization_id VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    notes TEXT
);

-- Indexes for performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);
```

---

## 🔄 Synchronization Strategy

### User Registration Flow

```
Frontend (Login Page)
    ↓
POST /api/auth/register
    ↓
Backend API
    ├─ Validate input
    ├─ Hash password (bcrypt)
    ├─ Save to PostgreSQL (users table)
    ├─ Submit to Blockchain (RegisterUser transaction)
    └─ Return JWT token
```

### User Authentication Flow

```
Frontend (Login Page)
    ↓
POST /api/auth/login
    ↓
Backend API
    ├─ Query PostgreSQL (users table)
    ├─ Verify password hash
    ├─ Update last_login in PostgreSQL
    ├─ Update LastLogin on Blockchain
    ├─ Generate JWT token
    └─ Return token
```

---

## 📊 Field Mapping

| Chaincode Field | PostgreSQL Column | Type | Notes |
|-----------------|-------------------|------|-------|
| ID | id | UUID | Primary key |
| Username | username | VARCHAR(255) | Unique, indexed |
| PasswordHash | password_hash | VARCHAR(255) | bcrypt hash |
| Email | email | VARCHAR(255) | Unique, indexed |
| OrganizationID | organization_id | VARCHAR(255) | Foreign key reference |
| Role | role | VARCHAR(100) | User role |
| CreatedAt | created_at | TIMESTAMP | RFC3339 format |
| UpdatedAt | updated_at | TIMESTAMP | RFC3339 format |
| LastLogin | last_login | TIMESTAMP | Nullable |
| IsActive | is_active | BOOLEAN | Account status |
| - | created_by | VARCHAR(255) | Audit trail |
| - | updated_by | VARCHAR(255) | Audit trail |
| - | notes | TEXT | Additional info |

---

## 🔐 Organizations Reference

### Supported Organizations

```
1. Commercial Bank (3001)
   - ID: commercial-bank
   - MSP: CommercialBankMSP

2. National Bank (3002)
   - ID: national-bank
   - MSP: NationalBankMSP

3. ECTA (3003)
   - ID: ecta
   - MSP: ECTAMSP

4. ECX (3006)
   - ID: ecx
   - MSP: ECXMSP

5. Customs (3005)
   - ID: customs
   - MSP: CustomsMSP

6. Shipping Line (3004)
   - ID: shipping-line
   - MSP: ShippingLineMSP

7. Exporter Portal (3007)
   - ID: exporter-portal
   - MSP: ExporterPortalMSP
```

---

## 👥 User Roles

### Available Roles

```
1. Banking Officer
   - Organization: Commercial Bank, National Bank
   - Permissions: Document verification, Financing approval

2. FX Officer
   - Organization: National Bank
   - Permissions: FX rate management, Compliance monitoring

3. Quality Officer
   - Organization: ECTA
   - Permissions: Quality certification, Laboratory management

4. Lot Verifier
   - Organization: ECX
   - Permissions: Lot verification, Trading management

5. Customs Officer
   - Organization: Customs
   - Permissions: Customs clearance, Document verification

6. Shipping Officer
   - Organization: Shipping Line
   - Permissions: Shipment tracking, Delivery confirmation

7. Exporter
   - Organization: Exporter Portal
   - Permissions: Create exports, View applications

8. Admin
   - Organization: Any
   - Permissions: All operations
```

---

## 🔗 Integration Points

### Backend API (userService.ts)

```typescript
// Register user
async registerUser(data: UserRegistrationData): Promise<User> {
  // 1. Hash password
  const passwordHash = await bcrypt.hash(data.password, 10);
  
  // 2. Save to PostgreSQL
  const pgUser = await saveUserToPostgres({
    username: data.username,
    password_hash: passwordHash,
    email: data.email,
    organization_id: data.organizationId,
    role: data.role
  });
  
  // 3. Register on blockchain
  await this.contract.submitTransaction(
    'RegisterUser',
    pgUser.id,
    data.username,
    passwordHash,
    data.email,
    data.organizationId,
    data.role
  );
  
  return pgUser;
}

// Authenticate user
async authenticateUser(data: UserLoginData): Promise<User | null> {
  // 1. Query PostgreSQL
  const user = await getUserFromPostgres(data.username);
  
  if (!user) return null;
  
  // 2. Verify password
  const isValid = await bcrypt.compare(data.password, user.password_hash);
  
  if (!isValid) return null;
  
  // 3. Update last login in PostgreSQL
  await updateLastLoginPostgres(user.id);
  
  // 4. Update on blockchain
  await this.contract.submitTransaction('UpdateLastLogin', user.id);
  
  return user;
}
```

---

## 📝 SQL Migration Script

```sql
-- Migration: Create users table
-- Purpose: Store user accounts with blockchain synchronization

BEGIN;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    organization_id VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    notes TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Add comments
COMMENT ON TABLE users IS 'User accounts synchronized with blockchain user-management chaincode';
COMMENT ON COLUMN users.id IS 'Unique user identifier (UUID)';
COMMENT ON COLUMN users.username IS 'Unique username for login';
COMMENT ON COLUMN users.password_hash IS 'bcrypt hashed password';
COMMENT ON COLUMN users.email IS 'Unique email address';
COMMENT ON COLUMN users.organization_id IS 'Organization the user belongs to';
COMMENT ON COLUMN users.role IS 'User role (Banking Officer, FX Officer, etc.)';
COMMENT ON COLUMN users.is_active IS 'Account active status';
COMMENT ON COLUMN users.created_at IS 'Account creation timestamp';
COMMENT ON COLUMN users.updated_at IS 'Last update timestamp';
COMMENT ON COLUMN users.last_login IS 'Last login timestamp';
COMMENT ON COLUMN users.created_by IS 'User who created this account';
COMMENT ON COLUMN users.updated_by IS 'User who last updated this account';
COMMENT ON COLUMN users.notes IS 'Additional notes about the user';

COMMIT;
```

---

## ✅ Verification Checklist

- [x] Chaincode user structure defined
- [x] PostgreSQL schema designed
- [x] Field mapping documented
- [x] Organizations configured
- [x] User roles defined
- [x] Integration flow documented
- [x] SQL migration provided
- [x] Synchronization strategy outlined

---

## 🚀 Implementation Steps

### Step 1: Create PostgreSQL Table
```bash
psql -U postgres -d coffee_export_db -f migrations/007_create_users_table.sql
```

### Step 2: Verify Table Creation
```sql
SELECT * FROM information_schema.tables WHERE table_name = 'users';
```

### Step 3: Test User Registration
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_user",
    "password": "Test@123456",
    "email": "test@example.com",
    "organization": "commercial-bank",
    "role": "Banking Officer"
  }'
```

### Step 4: Verify Blockchain Registration
```bash
docker exec cli peer chaincode query \
  -C coffeechannel \
  -n user-management \
  -c '{"function":"GetUserByUsername","Args":["test_user"]}'
```

---

## 🔍 Troubleshooting

### Issue: User exists in PostgreSQL but not on blockchain
**Solution**: Manually submit RegisterUser transaction to blockchain

### Issue: User exists on blockchain but not in PostgreSQL
**Solution**: Query blockchain and sync to PostgreSQL

### Issue: Password mismatch
**Solution**: Ensure bcrypt hashing is consistent between systems

### Issue: Organization not found
**Solution**: Verify organization_id matches configured organizations

---

## 📚 References

- Chaincode: `/chaincode/user-management/contract.go`
- User Service: `/apis/shared/userService.ts`
- Database Config: `/apis/shared/database/db.config.ts`
- Auth Controller: `/apis/*/src/controllers/auth.controller.ts`

---

**Status**: ✅ Ready for Implementation

**All components aligned and documented.**
