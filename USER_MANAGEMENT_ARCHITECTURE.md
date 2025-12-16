# User Management Architecture
## Hyperledger Fabric + PostgreSQL Integration

**System:** Coffee Export Consortium (CBC)
**Date:** 2024
**Architecture:** Hybrid Blockchain-Database User Management

---

## Table of Contents

1. [Overview](#overview)
2. [User Management Layers](#user-management-layers)
3. [Blockchain User Management (Hyperledger Fabric)](#blockchain-user-management)
4. [Database User Management (PostgreSQL)](#database-user-management)
5. [User Synchronization](#user-synchronization)
6. [Authentication Flow](#authentication-flow)
7. [Authorization Model](#authorization-model)
8. [User Lifecycle](#user-lifecycle)
9. [Data Consistency](#data-consistency)
10. [Security Considerations](#security-considerations)

---

## Overview

The CBC system implements a **dual-layer user management system**:

```
┌─────────────────────────────────────────────────────────────┐
│                    User Management System                   │
├────��────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Layer 1: Blockchain Identity (Hyperledger Fabric)  │  │
│  │  - X.509 Certificates (MSP)                         │  │
│  │  - User Chaincode (user-management)                 │  │
│  │  - Immutable Audit Trail                            │  │
│  │  - Consensus-based Validation                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↕                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Layer 2: Relational Database (PostgreSQL)          │  │
│  │  - User Profiles                                    │  │
│  │  - Session Management                               │  │
│  │  - Exporter Profiles                                │  │
│  │  - Audit Logs                                       │  │
│  │  - Quick Queries & Caching                          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Key Principles

1. **Blockchain as Source of Truth**
   - User registration immutable on blockchain
   - Password hashes stored on blockchain
   - Audit trail maintained on blockchain

2. **Database for Performance**
   - Caching layer for quick lookups
   - Session management
   - Exporter-specific data
   - Audit logs for compliance

3. **Synchronization**
   - Database mirrors blockchain state
   - Eventual consistency model
   - Conflict resolution strategies

---

## User Management Layers

### Layer 1: Blockchain (Hyperledger Fabric)

**Purpose:** Immutable identity and authentication source

**Components:**
- User Chaincode (`user-management`)
- X.509 Certificates (MSP)
- Wallet Management
- Consensus-based validation

**User Data on Blockchain:**
```typescript
interface BlockchainUser {
  id: string;                    // USER-{UUID}
  username: string;              // Unique, immutable
  passwordHash: string;          // bcrypt hash
  email: string;                 // Unique
  organizationId: string;        // Organization MSP
  role: string;                  // User role
  createdAt: string;             // ISO timestamp
  updatedAt: string;             // ISO timestamp
  lastLogin: string;             // ISO timestamp
  isActive: boolean;             // Account status
}
```

**Blockchain Transactions:**
```
RegisterUser(userId, username, passwordHash, email, organizationId, role)
GetUserByUsername(username)
GetUserByEmail(email)
GetUser(userId)
UpdateLastLogin(userId)
UpdatePassword(userId, newPasswordHash)
DeactivateUser(userId)
ActivateUser(userId)
GetAllUsers()
GetUsersByOrganization(organizationId)
UsernameExists(username)
EmailExists(email)
```

### Layer 2: Database (PostgreSQL)

**Purpose:** Performance, caching, and business logic

**Core Tables:**

#### 1. Users Table
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
    last_login TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    notes TEXT
);
```

**Indexes:**
- `idx_users_username` - Fast login lookups
- `idx_users_email` - Email verification
- `idx_users_organization_id` - Organization queries
- `idx_users_role` - Role-based queries
- `idx_users_is_active` - Active user filtering
- `idx_users_organization_role` - Combined queries

#### 2. Organizations Table
```sql
CREATE TABLE organizations (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    msp_id VARCHAR(255) NOT NULL UNIQUE,
    api_port INTEGER,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE
);
```

**Organizations:**
- `commercial-bank` (CommercialBankMSP, port 3001)
- `national-bank` (NationalBankMSP, port 3002)
- `ecta` (ECTAMSP, port 3003)
- `ecx` (ECXMSP, port 3006)
- `customs` (CustomsMSP, port 3005)
- `shipping-line` (ShippingLineMSP, port 3004)
- `exporter-portal` (ExporterPortalMSP, port 3007)

#### 3. User Roles Table
```sql
CREATE TABLE user_roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    permissions TEXT[],
    created_at TIMESTAMP WITH TIME ZONE
);
```

**Defined Roles:**
- Banking Officer
- FX Officer
- Quality Officer
- Lot Verifier
- Customs Officer
- Shipping Officer
- Exporter
- Admin

#### 4. User Sessions Table
```sql
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    last_activity TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);
```

**Purpose:**
- Track active sessions
- Prevent token reuse
- Monitor concurrent logins
- Audit user activity

#### 5. User Audit Logs Table
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
```

**Logged Actions:**
- LOGIN
- LOGOUT
- REGISTER
- PASSWORD_CHANGE
- PROFILE_UPDATE
- ROLE_CHANGE
- ACCOUNT_DEACTIVATION
- ACCOUNT_ACTIVATION

#### 6. Exporter Profiles Table
```sql
CREATE TABLE exporter_profiles (
    exporter_id UUID PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL UNIQUE,
    business_name VARCHAR(500) NOT NULL,
    tin VARCHAR(50) NOT NULL UNIQUE,
    registration_number VARCHAR(100) NOT NULL UNIQUE,
    business_type VARCHAR(50) NOT NULL,
    minimum_capital DECIMAL(15, 2),
    capital_verified BOOLEAN,
    office_address TEXT,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    status VARCHAR(50),
    approved_by VARCHAR(255),
    approved_at TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**Relationship:**
- Links blockchain user to exporter business data
- One-to-one relationship with users table
- Stores ECTA compliance information

---

## Blockchain User Management

### Fabric Identity Management

#### 1. X.509 Certificates (MSP)

**Certificate Structure:**
```
organizations/
├── peerOrganizations/
│   ├── commercialbank.coffee-export.com/
│   │   ├── peers/
│   │   │   └── peer0.commercialbank.coffee-export.com/
│   │   │       ├── msp/
│   │   │       │   ├── signcerts/
│   │   │       │   │   └── cert.pem
│   │   │       │   ├── keystore/
│   │   │       │   │   └── priv_sk
│   │   │       │   └── cacerts/
│   │   │       │       └── ca.pem
│   │   │       └── tls/
│   │   │           ├── server.crt
│   │   │           ├── server.key
│   │   │           └── ca.crt
│   │   └── users/
│   │       └── Admin@commercialbank.coffee-export.com/
│   │           └── msp/
│   │               ├── signcerts/
│   │               ├── keystore/
│   │               └── cacerts/
```

#### 2. Wallet Management

**Wallet Structure:**
```typescript
// File-based wallet at: /app/wallet/
{
  "admin": {
    "credentials": {
      "certificate": "-----BEGIN CERTIFICATE-----...",
      "privateKey": "-----BEGIN PRIVATE KEY-----..."
    },
    "mspId": "CommercialBankMSP",
    "type": "X.509"
  }
}
```

**Wallet Operations:**
```typescript
// Create wallet
const wallet = await Wallets.newFileSystemWallet(walletPath);

// Enroll admin
const identity: X509Identity = {
  credentials: { certificate, privateKey },
  mspId: 'CommercialBankMSP',
  type: 'X.509'
};
await wallet.put('admin', identity);

// Get identity
const identity = await wallet.get('admin');

// List identities
const identities = await wallet.list();
```

#### 3. User Chaincode Interaction

**Registration Flow:**
```typescript
// 1. Hash password
const passwordHash = await bcrypt.hash(password, 10);

// 2. Generate user ID
const userId = `USER-${uuidv4()}`;

// 3. Submit to blockchain
await userContract.submitTransaction(
  'RegisterUser',
  userId,
  username,
  passwordHash,
  email,
  organizationId,
  role
);

// 4. Retrieve created user
const user = await userContract.evaluateTransaction('GetUser', userId);
```

**Authentication Flow:**
```typescript
// 1. Query blockchain for user
const result = await userContract.evaluateTransaction(
  'GetUserByUsername',
  username
);
const user = JSON.parse(result.toString());

// 2. Verify password
const isValid = await bcrypt.compare(password, user.passwordHash);

// 3. Update last login
await userContract.submitTransaction('UpdateLastLogin', user.id);

// 4. Return user (without password)
return user;
```

---

## Database User Management

### PostgreSQL User Operations

#### 1. User Registration

**Process:**
```typescript
async registerUser(data: UserRegistrationData): Promise<User> {
  // Step 1: Hash password
  const passwordHash = await bcrypt.hash(data.password, 10);
  const userId = `USER-${uuidv4()}`;

  // Step 2: Register on blockchain
  await blockchainUserService.registerUser({
    username: data.username,
    password: data.password,
    email: data.email,
    organizationId: data.organizationId,
    role: data.role
  });

  // Step 3: Sync to database
  await db.query(
    `INSERT INTO users (id, username, password_hash, email, organization_id, role, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
    [userId, data.username, passwordHash, data.email, data.organizationId, data.role]
  );

  // Step 4: Return user
  return { id: userId, ...data };
}
```

#### 2. User Authentication

**Process:**
```typescript
async authenticateUser(username: string, password: string): Promise<User | null> {
  // Step 1: Try blockchain first (source of truth)
  try {
    const user = await blockchainUserService.authenticateUser({
      username,
      password
    });

    // Step 2: Update database cache
    await db.query(
      `UPDATE users SET last_login = NOW() WHERE id = $1`,
      [user.id]
    );

    // Step 3: Create session
    const sessionId = uuidv4();
    const tokenHash = crypto.createHash('sha256').update(sessionId).digest('hex');
    
    await db.query(
      `INSERT INTO user_sessions (id, user_id, token_hash, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '24 hours')`,
      [sessionId, user.id, tokenHash, ipAddress, userAgent]
    );

    return user;
  } catch (error) {
    return null;
  }
}
```

#### 3. Session Management

**Session Lifecycle:**
```typescript
// Create session
const session = {
  id: uuidv4(),
  user_id: userId,
  token_hash: hashToken(token),
  ip_address: req.ip,
  user_agent: req.get('user-agent'),
  created_at: new Date(),
  expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
  is_active: true
};

// Validate session
const session = await db.query(
  `SELECT * FROM user_sessions 
   WHERE token_hash = $1 AND is_active = true AND expires_at > NOW()`,
  [tokenHash]
);

// Invalidate session (logout)
await db.query(
  `UPDATE user_sessions SET is_active = false WHERE id = $1`,
  [sessionId]
);
```

#### 4. Audit Logging

**Logged Events:**
```typescript
async logUserAction(
  userId: string,
  action: string,
  details: any,
  ipAddress: string,
  userAgent: string
): Promise<void> {
  await db.query(
    `INSERT INTO user_audit_logs (user_id, action, details, ip_address, user_agent, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW())`,
    [userId, action, JSON.stringify(details), ipAddress, userAgent]
  );
}

// Example: Log login
await logUserAction(
  user.id,
  'LOGIN',
  { username: user.username, organization: user.organizationId },
  req.ip,
  req.get('user-agent')
);
```

---

## User Synchronization

### Synchronization Strategy

**Model:** Eventual Consistency with Blockchain as Source of Truth

```
┌──────────────────────────────────────────────��──────────────┐
│                  User Registration                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. API receives registration request                      │
│     ↓                                                       │
│  2. Validate input (email, username, password)             │
│     ↓                                                       │
│  3. Register on blockchain (SUBMIT TRANSACTION)            │
│     ├─ Hash password with bcrypt                           │
│     ├─ Generate user ID                                    │
│     ├─ Submit RegisterUser transaction                     │
│     └─ Wait for consensus                                  │
│     ↓                                                       │
│  4. Sync to PostgreSQL (INSERT)                            │
│     ├─ Insert user record                                  │
│     ├─ Create exporter profile (if applicable)             │
│     └─ Log audit event                                     │
│     ↓                                                       │
│  5. Return success response                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Synchronization Patterns

#### Pattern 1: Write-Through (Blockchain First)
```typescript
// 1. Write to blockchain
await blockchainUserService.registerUser(userData);

// 2. Write to database
await databaseUserService.registerUser(userData);

// 3. Return response
return { success: true, user: userData };
```

**Advantages:**
- Blockchain is always up-to-date
- Immutable audit trail
- Consensus-based validation

**Disadvantages:**
- Slower (blockchain latency)
- Potential inconsistency if DB write fails

#### Pattern 2: Write-Behind (Database First)
```typescript
// 1. Write to database
const user = await databaseUserService.registerUser(userData);

// 2. Queue blockchain write
await queue.enqueue({
  type: 'REGISTER_USER',
  data: userData,
  userId: user.id
});

// 3. Return response immediately
return { success: true, user };

// 4. Async: Write to blockchain
// (handled by background worker)
```

**Advantages:**
- Faster response time
- Better UX

**Disadvantages:**
- Potential inconsistency
- Requires reconciliation logic

#### Pattern 3: Dual-Write (Current Implementation)
```typescript
// 1. Write to blockchain
const blockchainUser = await blockchainUserService.registerUser(userData);

// 2. Write to database
const dbUser = await databaseUserService.registerUser(userData);

// 3. Verify consistency
if (blockchainUser.id !== dbUser.id) {
  throw new Error('Synchronization failed');
}

// 4. Return response
return { success: true, user: blockchainUser };
```

**Advantages:**
- Strong consistency
- Both systems in sync
- Audit trail on both

**Disadvantages:**
- Slowest approach
- Requires rollback logic

### Conflict Resolution

**Scenario 1: Blockchain Success, Database Failure**
```typescript
try {
  // Register on blockchain
  const blockchainUser = await blockchainUserService.registerUser(userData);
  
  // Try to sync to database
  try {
    await databaseUserService.registerUser(userData);
  } catch (dbError) {
    // Database write failed
    logger.error('Database sync failed', { userId: blockchainUser.id, error: dbError });
    
    // Queue for retry
    await retryQueue.enqueue({
      type: 'SYNC_USER',
      userId: blockchainUser.id,
      data: userData
    });
    
    // Still return success (blockchain is source of truth)
    return { success: true, user: blockchainUser, warning: 'Database sync pending' };
  }
} catch (error) {
  throw error;
}
```

**Scenario 2: Database Success, Blockchain Failure**
```typescript
try {
  // Register on blockchain
  const blockchainUser = await blockchainUserService.registerUser(userData);
} catch (blockchainError) {
  // Blockchain failed
  logger.error('Blockchain registration failed', { error: blockchainError });
  
  // Rollback database
  await databaseUserService.deleteUser(userData.username);
  
  // Return error
  throw new Error('User registration failed');
}
```

**Scenario 3: Data Mismatch**
```typescript
// Periodic reconciliation job
async function reconcileUsers() {
  // Get all users from blockchain
  const blockchainUsers = await blockchainUserService.getAllUsers();
  
  // Get all users from database
  const dbUsers = await databaseUserService.getAllUsers();
  
  // Find mismatches
  for (const bcUser of blockchainUsers) {
    const dbUser = dbUsers.find(u => u.id === bcUser.id);
    
    if (!dbUser) {
      // User in blockchain but not in database
      logger.warn('User missing in database', { userId: bcUser.id });
      await databaseUserService.registerUser(bcUser);
    } else if (JSON.stringify(bcUser) !== JSON.stringify(dbUser)) {
      // User data mismatch
      logger.warn('User data mismatch', { userId: bcUser.id });
      await databaseUserService.updateUser(bcUser);
    }
  }
}
```

---

## Authentication Flow

### Complete Authentication Sequence

```
┌─────────────────────────────────────────────────────────────┐
│                   Login Request                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Client sends credentials                               │
│     POST /api/auth/login                                   │
│     { username, password }                                 │
│     ↓                                                       │
│  2. API validates input                                    │
│     ├─ Check username format                               │
│     ├─ Check password strength                             │
│     └─ Rate limit check                                    │
│     ↓                                                       │
│  3. Query blockchain for user                              │
│     GetUserByUsername(username)                            │
│     ↓                                                       │
│  4. Verify password                                        │
│     bcrypt.compare(password, passwordHash)                 │
│     ↓                                                       │
│  5. Update last login (blockchain)                         │
│     UpdateLastLogin(userId)                                │
│     ↓                                                       │
│  6. Create session (database)                              │
│     INSERT INTO user_sessions                              │
│     ↓                                                       │
│  7. Generate JWT token                                     │
│     jwt.sign({                                             │
│       id: user.id,                                         │
│       username: user.username,                             │
│       organizationId: user.organizationId,                 │
│       role: user.role,                                     │
│       mspId: user.mspId                                    │
│     }, JWT_SECRET, { expiresIn: '24h' })                   │
│     ↓                                                       │
│  8. Log audit event (database)                             │
│     INSERT INTO user_audit_logs                            │
│     ↓                                                       │
│  9. Return token to client                                 │
│     { success: true, token, user }                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### JWT Token Structure

```typescript
{
  // Standard claims
  iss: "coffee-export-consortium",
  aud: "api-services",
  iat: 1704067200,
  exp: 1704153600,
  jti: "user-123-1704067200",
  
  // Custom claims
  id: "USER-550e8400-e29b-41d4-a716-446655440000",
  username: "exporter1",
  organizationId: "commercial-bank",
  role: "exporter",
  mspId: "CommercialBankMSP",
  permissions: ["create_export", "view_own_exports"]
}
```

### Token Validation

```typescript
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. Extract token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.substring(7);
    
    // 2. Check token blacklist (revoked tokens)
    if (await isTokenRevoked(token)) {
      return res.status(401).json({ error: 'Token has been revoked' });
    }
    
    // 3. Verify token signature
    const decoded = jwt.verify(token, JWT_SECRET) as AuthJWTPayload;
    
    // 4. Verify token claims
    if (decoded.iss !== 'coffee-export-consortium') {
      return res.status(401).json({ error: 'Invalid issuer' });
    }
    
    if (decoded.aud !== 'api-services') {
      return res.status(401).json({ error: 'Invalid audience' });
    }
    
    // 5. Check token expiration
    if (decoded.exp < Math.floor(Date.now() / 1000)) {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    // 6. Verify session is active
    const session = await db.query(
      `SELECT * FROM user_sessions 
       WHERE user_id = $1 AND is_active = true AND expires_at > NOW()`,
      [decoded.id]
    );
    
    if (session.rows.length === 0) {
      return res.status(401).json({ error: 'Session expired' });
    }
    
    // 7. Attach user to request
    (req as any).user = decoded;
    (req as any).token = token;
    
    next();
  } catch (error: any) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};
```

---

## Authorization Model

### Role-Based Access Control (RBAC)

**Role Hierarchy:**
```
┌─────────────────────────────────────────────────────────────┐
│                    Admin                                    │
│              (All permissions)                              │
└─────────────────────────────────────────────────────────────┘
                          ↓
        ┌─────────────────┼─────────────────┐
        ↓                 ↓                 ↓
    ┌────────┐      ┌──────────┐      ┌──────────┐
    │ ECTA   │      │ Banking  │      │ Customs  │
    │Officer │      │ Officer  │      │ Officer  │
    └─────��──┘      └──────────┘      └──────────┘
        ↓                 ↓                 ↓
    ┌────────┐      ┌──────────┐      ┌──────────┐
    │Quality │      │FX Officer│      │Shipping  │
    │Officer │      │          │      │Officer   │
    └────────┘      └──────────┘      └──────────┘
        ↓                 ↓                 ↓
    ┌────────┐      ┌──────────┐      ┌──────────┐
    │Lot     │      │Banking   │      │Exporter  │
    │Verifier│      │Officer   │      │          │
    └────────┘      └──────────┘      └──────────┘
```

**Permission Matrix:**

| Role | Permissions |
|------|-------------|
| **Admin** | manage_users, manage_roles, view_audit_logs, manage_system, approve_all, reject_all |
| **ECTA Officer** | validate_license, approve_quality, reject_quality, approve_contract, reject_contract, issue_origin_certificate, view_exports |
| **ECX Officer** | verify_lot, reject_lot, view_lots, view_exports |
| **Banking Officer** | verify_documents, reject_documents, submit_fx_application, view_exports, confirm_payment |
| **NBE Officer** | approve_fx, reject_fx, confirm_fx_repatriation, view_exports |
| **Customs Officer** | clear_customs, reject_customs, view_exports |
| **Shipping Officer** | schedule_shipment, confirm_shipment, notify_arrival, view_exports |
| **Exporter** | create_export, submit_to_ecx, submit_to_ecta, submit_to_bank, view_own_exports, update_profile |
| **Importer** | view_exports, confirm_delivery, submit_to_import_customs |
| **Auditor** | view_audit_logs, view_exports, view_all_data |

### Authorization Middleware

```typescript
// Role-based authorization
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role as UserRole)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        requiredRoles: allowedRoles,
        userRole: req.user?.role
      });
    }
    next();
  };
};

// Permission-based authorization
export const requirePermission = (...permissions: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userPermissions = req.user?.permissions || [];
    const hasPermission = permissions.some(perm => userPermissions.includes(perm));
    
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        requiredPermissions: permissions,
        userPermissions
      });
    }
    next();
  };
};

// Organization-based authorization
export const requireOrganization = (...allowedOrgs: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!allowedOrgs.includes(req.user?.organizationId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied for this organization',
        userOrganization: req.user?.organizationId,
        allowedOrganizations: allowedOrgs
      });
    }
    next();
  };
};

// MSP-based authorization (Fabric)
export const requireMSP = (...allowedMSPs: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!allowedMSPs.includes(req.user?.mspId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied for this MSP',
        userMSP: req.user?.mspId,
        allowedMSPs
      });
    }
    next();
  };
};
```

### Usage Examples

```typescript
// Example 1: ECTA Officer only
router.post('/approve-quality',
  authenticate,
  authorize(UserRole.ECTA_OFFICER),
  requireOrganization('ecta'),
  requireMSP('ECTAMSP'),
  controller.approveQuality
);

// Example 2: Banking Officers
router.post('/verify-documents',
  authenticate,
  authorize(UserRole.BANK_OFFICER, UserRole.NBE_OFFICER),
  requirePermission('verify_documents'),
  controller.verifyDocuments
);

// Example 3: Exporter Portal
router.post('/create-export',
  authenticate,
  authorize(UserRole.EXPORTER),
  requirePermission('create_export'),
  controller.createExport
);
```

---

## User Lifecycle

### User States

```
┌──────────────┐
│   PENDING    │  (Newly registered, awaiting approval)
└──────┬───────┘
       │
       ├─ APPROVED ──→ ┌────────────┐
       │               │   ACTIVE   │  (Can login and perform actions)
       │               └──────┬─────┘
       │                      │
       └─ REJECTED ──→ ┌──────────────┐
                       │   INACTIVE   │  (Cannot login)
                       └──────────────┘
                              ↑
                              │
                       ┌──────┴──────┐
                       │             │
                   SUSPENDED    DEACTIVATED
                   (Temporary)   (Permanent)
```

### User Registration Workflow

```
1. User Registration
   ├─ Validate input
   ├─ Check username/email uniqueness
   ├─ Hash password
   ├─ Register on blockchain
   ├─ Sync to database
   └─ Send verification email

2. Email Verification
   ├─ User clicks verification link
   ├─ Verify token
   ├─ Mark email as verified
   └─ Update blockchain

3. Profile Completion (for Exporters)
   ├─ Submit business information
   ├─ Upload documents
   ├─ ECTA verification
   └─ Approval/Rejection

4. Account Activation
   ├─ Admin approval
   ├─ Update blockchain status
   ├─ Update database status
   └─ Send activation email
```

### User Deactivation Workflow

```
1. Deactivation Request
   ├─ User initiates or admin requests
   ├─ Log audit event
   └─ Set is_active = false

2. Blockchain Update
   ├─ Call DeactivateUser transaction
   ├─ Update user status
   └─ Log on blockchain

3. Database Update
   ├─ Update users table
   ├─ Invalidate all sessions
   ├─ Log audit event
   └─ Notify user

4. Cleanup
   ├─ Revoke all tokens
   ├─ Close active sessions
   ├─ Archive user data
   └─ Send confirmation email
```

---

## Data Consistency

### Consistency Guarantees

**Blockchain (Hyperledger Fabric):**
- Strong consistency via consensus
- Immutable audit trail
- ACID transactions
- Ordering service ensures total order

**Database (PostgreSQL):**
- ACID transactions
- Foreign key constraints
- Triggers for data integrity
- Indexes for performance

### Synchronization Guarantees

**Write Operations:**
1. Blockchain write succeeds → Database write attempted
2. If database write fails → Retry queue
3. Periodic reconciliation job

**Read Operations:**
1. Try database cache first (fast)
2. If cache miss → Query blockchain (authoritative)
3. Update cache with blockchain data

### Conflict Resolution Strategy

**Priority:** Blockchain > Database

```typescript
async function resolveConflict(userId: string) {
  // Get user from blockchain (source of truth)
  const blockchainUser = await blockchainUserService.getUserById(userId);
  
  // Get user from database
  const dbUser = await databaseUserService.getUserById(userId);
  
  // Compare and resolve
  if (blockchainUser.isActive !== dbUser.isActive) {
    // Blockchain is authoritative
    await databaseUserService.updateUser({
      ...dbUser,
      isActive: blockchainUser.isActive
    });
  }
  
  if (blockchainUser.lastLogin !== dbUser.lastLogin) {
    // Update database with blockchain value
    await databaseUserService.updateLastLogin(userId, blockchainUser.lastLogin);
  }
}
```

---

## Security Considerations

### 1. Password Security

**Storage:**
- Blockchain: bcrypt hash (10 salt rounds)
- Database: bcrypt hash (10 salt rounds)
- Never store plaintext passwords

**Transmission:**
- HTTPS only
- TLS 1.2+
- No password in logs

**Requirements:**
- Minimum 8 characters
- Uppercase, lowercase, numbers, special characters
- No common passwords

### 2. Session Security

**Token Management:**
- JWT with 24-hour expiration
- Refresh tokens with 7-day expiration
- Token blacklist for revocation
- Secure token storage (httpOnly cookies)

**Session Tracking:**
- IP address validation
- User agent tracking
- Concurrent session limits
- Automatic timeout

### 3. Identity Security

**X.509 Certificates:**
- Unique per organization
- Stored in secure wallet
- Private key protection
- Certificate rotation policy

**MSP Identity:**
- Organization-based identity
- Peer authentication via mTLS
- Certificate pinning
- Revocation checking

### 4. Access Control

**Multi-level Authorization:**
1. Role-based (coarse-grained)
2. Permission-based (fine-grained)
3. Organization-based (organizational boundaries)
4. MSP-based (blockchain identity)
5. Ownership-based (resource ownership)

### 5. Audit Logging

**Logged Events:**
- User registration
- Login/logout
- Password changes
- Role changes
- Account deactivation
- Permission changes
- Data access

**Audit Trail:**
- Immutable on blockchain
- Queryable in database
- Timestamp and user tracking
- IP address and user agent

### 6. Data Protection

**Encryption at Rest:**
- Database encryption (TDE)
- Wallet encryption
- Certificate encryption

**Encryption in Transit:**
- TLS 1.2+ for all communications
- mTLS for peer-to-peer
- HTTPS for APIs

### 7. Threat Mitigation

**Brute Force Protection:**
- Rate limiting on login (100 attempts/15 min)
- Account lockout after failed attempts
- Progressive delays

**SQL Injection Prevention:**
- Parameterized queries
- Input validation
- ORM usage

**XSS Prevention:**
- Output escaping
- Content-Type headers
- CSP headers

**CSRF Prevention:**
- CSRF tokens
- SameSite cookies
- Origin validation

---

## Best Practices

### For Developers

1. **Always use blockchain as source of truth**
   ```typescript
   // ✅ Good
   const user = await blockchainUserService.getUser(userId);
   
   // ❌ Bad
   const user = await databaseUserService.getUser(userId);
   ```

2. **Implement proper error handling**
   ```typescript
   try {
     await blockchainUserService.registerUser(userData);
   } catch (error) {
     if (error.message.includes('already exists')) {
       throw new Error('User already registered');
     }
     throw error;
   }
   ```

3. **Log all security events**
   ```typescript
   await logUserAction(
     user.id,
     'LOGIN',
     { username: user.username },
     req.ip,
     req.get('user-agent')
   );
   ```

4. **Validate all inputs**
   ```typescript
   if (!username || username.length < 3) {
     throw new Error('Invalid username');
   }
   ```

5. **Use environment variables for secrets**
   ```typescript
   const JWT_SECRET = process.env.JWT_SECRET;
   if (!JWT_SECRET) {
     throw new Error('JWT_SECRET not configured');
   }
   ```

### For Operations

1. **Regular backups**
   - Database backups (daily)
   - Wallet backups (secure storage)
   - Certificate backups

2. **Monitoring**
   - Failed login attempts
   - Unusual access patterns
   - Database performance
   - Blockchain network health

3. **Maintenance**
   - Certificate rotation
   - Password policy updates
   - Dependency updates
   - Security patches

4. **Disaster Recovery**
   - Backup restoration procedures
   - Failover mechanisms
   - Data recovery plans
   - Communication procedures

---

## Troubleshooting

### Common Issues

**Issue 1: User not found in blockchain**
```
Solution:
1. Check if user was registered successfully
2. Verify blockchain network is running
3. Check wallet contains admin identity
4. Review blockchain logs for errors
```

**Issue 2: Database sync failed**
```
Solution:
1. Check database connection
2. Verify user table exists
3. Check for unique constraint violations
4. Review database logs
```

**Issue 3: Token validation failed**
```
Solution:
1. Verify JWT_SECRET is correct
2. Check token expiration
3. Verify token signature
4. Check token blacklist
```

**Issue 4: Session expired**
```
Solution:
1. Check session timeout settings
2. Verify database connection
3. Check user_sessions table
4. Review session logs
```

---

## Conclusion

The CBC user management system implements a robust hybrid approach:

✅ **Strengths:**
- Blockchain provides immutable audit trail
- Database provides performance and caching
- Multi-level authorization
- Comprehensive audit logging
- Strong security practices

⚠️ **Considerations:**
- Eventual consistency model
- Requires synchronization logic
- Conflict resolution needed
- Monitoring and maintenance required

The system is production-ready with proper monitoring and maintenance procedures in place.

---

**Document Version:** 1.0
**Last Updated:** 2024
**Next Review:** Quarterly
