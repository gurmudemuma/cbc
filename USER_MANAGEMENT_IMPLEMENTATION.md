# User Management Implementation Guide
## Practical Examples and Code Patterns

**System:** Coffee Export Consortium (CBC)
**Date:** 2024

---

## Table of Contents

1. [User Registration Implementation](#user-registration-implementation)
2. [User Authentication Implementation](#user-authentication-implementation)
3. [Session Management](#session-management)
4. [Authorization Patterns](#authorization-patterns)
5. [Exporter Profile Management](#exporter-profile-management)
6. [Database Queries](#database-queries)
7. [Error Handling](#error-handling)
8. [Testing](#testing)

---

## User Registration Implementation

### Step 1: Blockchain Registration

**File:** `apis/shared/userService.ts`

```typescript
async registerUser(data: UserRegistrationData): Promise<User> {
  try {
    // 1. Validate input
    if (!data.username || data.username.length < 3) {
      throw new Error('Username must be at least 3 characters');
    }
    
    if (!data.email || !isValidEmail(data.email)) {
      throw new Error('Invalid email address');
    }
    
    // 2. Check if user already exists
    const usernameExists = await this.usernameExists(data.username);
    if (usernameExists) {
      throw new Error('Username already taken');
    }
    
    const emailExists = await this.emailExists(data.email);
    if (emailExists) {
      throw new Error('Email already registered');
    }
    
    // 3. Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);
    
    // 4. Generate user ID
    const userId = `USER-${uuidv4()}`;
    
    // 5. Submit to blockchain
    await this.contract.submitTransaction(
      'RegisterUser',
      userId,
      data.username,
      passwordHash,
      data.email,
      data.organizationId,
      data.role
    );
    
    // 6. Retrieve created user
    const user = await this.getUserById(userId);
    
    return user;
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      throw new Error('User already exists');
    }
    throw error;
  }
}
```

### Step 2: Database Synchronization

**File:** `apis/commercial-bank/src/controllers/auth.controller.ts`

```typescript
async register(req: Request, res: Response): Promise<void> {
  try {
    const { username, password, email, organizationId, role } = req.body;
    
    // 1. Validate input
    if (!username || !password || !email) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
      return;
    }
    
    // 2. Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      res.status(400).json({
        success: false,
        message: 'Password does not meet requirements',
        errors: passwordValidation.errors
      });
      return;
    }
    
    // 3. Get user service
    const userService = await this.getUserService();
    
    // 4. Register on blockchain
    const newUser = await userService.registerUser({
      username,
      password,
      email,
      organizationId: organizationId || this.config.ORGANIZATION_ID,
      role: role || 'exporter'
    });
    
    // 5. Sync to database
    const pool = getPool();
    await pool.query(
      `INSERT INTO users (id, username, password_hash, email, organization_id, role, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        newUser.id,
        newUser.username,
        newUser.passwordHash,
        newUser.email,
        newUser.organizationId,
        newUser.role
      ]
    );
    
    // 6. Log audit event
    await pool.query(
      `INSERT INTO user_audit_logs (user_id, action, details, ip_address, user_agent, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        newUser.id,
        'REGISTER',
        JSON.stringify({ username, email, organization: organizationId }),
        req.ip,
        req.get('user-agent')
      ]
    );
    
    // 7. Generate JWT token
    const token = generateToken({
      id: newUser.id,
      username: newUser.username,
      organizationId: newUser.organizationId,
      role: newUser.role,
      mspId: this.config.MSP_ID,
      permissions: ROLE_PERMISSIONS[newUser.role as UserRole] || []
    });
    
    // 8. Return response
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          organizationId: newUser.organizationId,
          role: newUser.role
        },
        token
      }
    });
  } catch (error: any) {
    logger.error('Registration error', { error: error.message });
    
    res.status(500).json({
      success: false,
      message: error.message || 'Registration failed'
    });
  }
}
```

### Step 3: Exporter Profile Creation

**File:** `apis/commercial-bank/src/controllers/exporter-preregistration.controller.ts`

```typescript
async createExporterProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }
    
    const {
      businessName,
      tin,
      registrationNumber,
      businessType,
      officeAddress,
      city,
      region,
      contactPerson,
      email,
      phone
    } = req.body;
    
    // 1. Validate input
    if (!businessName || !tin || !registrationNumber) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
      return;
    }
    
    // 2. Check if profile already exists
    const pool = getPool();
    const existing = await pool.query(
      'SELECT * FROM exporter_profiles WHERE user_id = $1',
      [userId]
    );
    
    if (existing.rows.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Exporter profile already exists for this user'
      });
      return;
    }
    
    // 3. Check TIN uniqueness
    const tinExists = await pool.query(
      'SELECT * FROM exporter_profiles WHERE tin = $1',
      [tin]
    );
    
    if (tinExists.rows.length > 0) {
      res.status(400).json({
        success: false,
        message: 'TIN already registered'
      });
      return;
    }
    
    // 4. Create exporter profile
    const exporterId = uuidv4();
    const result = await pool.query(
      `INSERT INTO exporter_profiles (
        exporter_id, user_id, business_name, tin, registration_number,
        business_type, office_address, city, region, contact_person,
        email, phone, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
      RETURNING *`,
      [
        exporterId, userId, businessName, tin, registrationNumber,
        businessType, officeAddress, city, region, contactPerson,
        email, phone, 'PENDING_APPROVAL'
      ]
    );
    
    // 5. Log audit event
    await pool.query(
      `INSERT INTO user_audit_logs (user_id, action, details, ip_address, user_agent, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        userId,
        'CREATE_EXPORTER_PROFILE',
        JSON.stringify({ businessName, tin, businessType }),
        req.ip,
        req.get('user-agent')
      ]
    );
    
    // 6. Return response
    res.status(201).json({
      success: true,
      message: 'Exporter profile created successfully',
      data: {
        profile: result.rows[0]
      }
    });
  } catch (error: any) {
    logger.error('Exporter profile creation error', { error: error.message });
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create exporter profile'
    });
  }
}
```

---

## User Authentication Implementation

### Step 1: Login Handler

**File:** `apis/commercial-bank/src/controllers/auth.controller.ts`

```typescript
async login(req: Request, res: Response): Promise<void> {
  try {
    const { username, password } = req.body;
    
    // 1. Validate input
    if (!username || !password) {
      res.status(400).json({
        success: false,
        message: 'Username and password required'
      });
      return;
    }
    
    // 2. Check rate limiting
    const rateLimitKey = `login:${req.ip}`;
    const attempts = await redis.get(rateLimitKey);
    
    if (attempts && parseInt(attempts) > 5) {
      res.status(429).json({
        success: false,
        message: 'Too many login attempts. Please try again later.'
      });
      return;
    }
    
    // 3. Get user service
    const userService = await this.getUserService();
    
    // 4. Authenticate via blockchain
    const user = await userService.authenticateUser({ username, password });
    
    if (!user) {
      // Increment failed attempts
      await redis.incr(rateLimitKey);
      await redis.expire(rateLimitKey, 900); // 15 minutes
      
      res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
      return;
    }
    
    // 5. Clear rate limit
    await redis.del(rateLimitKey);
    
    // 6. Create session
    const pool = getPool();
    const sessionId = uuidv4();
    const tokenHash = crypto.createHash('sha256').update(sessionId).digest('hex');
    
    await pool.query(
      `INSERT INTO user_sessions (id, user_id, token_hash, ip_address, user_agent, expires_at, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '24 hours', NOW())`,
      [sessionId, user.id, tokenHash, req.ip, req.get('user-agent')]
    );
    
    // 7. Generate JWT token
    const token = generateToken({
      id: user.id,
      username: user.username,
      organizationId: user.organizationId,
      role: user.role,
      mspId: this.config.MSP_ID,
      permissions: ROLE_PERMISSIONS[user.role as UserRole] || []
    });
    
    // 8. Log audit event
    await pool.query(
      `INSERT INTO user_audit_logs (user_id, action, details, ip_address, user_agent, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        user.id,
        'LOGIN',
        JSON.stringify({ username, organization: user.organizationId }),
        req.ip,
        req.get('user-agent')
      ]
    );
    
    // 9. Return response
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          organizationId: user.organizationId,
          role: user.role
        },
        token
      }
    });
  } catch (error: any) {
    logger.error('Login error', { error: error.message });
    
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
}
```

### Step 2: Blockchain Authentication

**File:** `apis/shared/userService.ts`

```typescript
async authenticateUser(data: UserLoginData): Promise<User | null> {
  try {
    // 1. Query blockchain for user
    const result = await this.contract.evaluateTransaction(
      'GetUserByUsername',
      data.username
    );
    
    const user: User = JSON.parse(result.toString());
    
    // 2. Check if user is active
    if (!user.isActive) {
      throw new Error('User account is deactivated');
    }
    
    // 3. Verify password
    const isPasswordValid = await bcrypt.compare(
      data.password,
      user.passwordHash
    );
    
    if (!isPasswordValid) {
      return null;
    }
    
    // 4. Update last login on blockchain
    await this.contract.submitTransaction(
      'UpdateLastLogin',
      user.id
    );
    
    // 5. Return user (without password hash)
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  } catch (error: any) {
    if (error.message.includes('does not exist')) {
      return null;
    }
    throw error;
  }
}
```

---

## Session Management

### Session Creation

```typescript
async createSession(
  userId: string,
  token: string,
  ipAddress: string,
  userAgent: string
): Promise<string> {
  const pool = getPool();
  const sessionId = uuidv4();
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  
  await pool.query(
    `INSERT INTO user_sessions (
      id, user_id, token_hash, ip_address, user_agent,
      created_at, expires_at, is_active
    ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW() + INTERVAL '24 hours', true)`,
    [sessionId, userId, tokenHash, ipAddress, userAgent]
  );
  
  return sessionId;
}
```

### Session Validation

```typescript
async validateSession(token: string): Promise<boolean> {
  const pool = getPool();
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  
  const result = await pool.query(
    `SELECT * FROM user_sessions
     WHERE token_hash = $1
     AND is_active = true
     AND expires_at > NOW()`,
    [tokenHash]
  );
  
  return result.rows.length > 0;
}
```

### Session Invalidation (Logout)

```typescript
async invalidateSession(token: string): Promise<void> {
  const pool = getPool();
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  
  await pool.query(
    `UPDATE user_sessions
     SET is_active = false
     WHERE token_hash = $1`,
    [tokenHash]
  );
  
  // Also add to token blacklist
  await redis.setex(`blacklist:${token}`, 86400, '1');
}
```

### Session Cleanup

```typescript
async cleanupExpiredSessions(): Promise<void> {
  const pool = getPool();
  
  // Delete expired sessions
  await pool.query(
    `DELETE FROM user_sessions
     WHERE expires_at < NOW()`
  );
  
  // Log cleanup
  logger.info('Expired sessions cleaned up');
}

// Schedule cleanup (e.g., every hour)
schedule.scheduleJob('0 * * * *', cleanupExpiredSessions);
```

---

## Authorization Patterns

### Pattern 1: Role-Based Authorization

```typescript
// Middleware
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    if (!allowedRoles.includes(req.user.role as UserRole)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        requiredRoles: allowedRoles,
        userRole: req.user.role
      });
    }
    
    next();
  };
};

// Usage
router.post('/approve-quality',
  authenticate,
  authorize(UserRole.ECTA_OFFICER),
  controller.approveQuality
);
```

### Pattern 2: Permission-Based Authorization

```typescript
export const requirePermission = (...permissions: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const userPermissions = req.user.permissions || [];
    const hasPermission = permissions.some(perm =>
      userPermissions.includes(perm)
    );
    
    if (!hasPermission) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        requiredPermissions: permissions,
        userPermissions
      });
    }
    
    next();
  };
};

// Usage
router.post('/verify-documents',
  authenticate,
  requirePermission('verify_documents'),
  controller.verifyDocuments
);
```

### Pattern 3: Organization-Based Authorization

```typescript
export const requireOrganization = (...allowedOrgs: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    if (!allowedOrgs.includes(req.user.organizationId)) {
      return res.status(403).json({
        error: 'Access denied for this organization',
        userOrganization: req.user.organizationId,
        allowedOrganizations: allowedOrgs
      });
    }
    
    next();
  };
};

// Usage
router.post('/approve-fx',
  authenticate,
  authorize(UserRole.NBE_OFFICER),
  requireOrganization('national-bank'),
  controller.approveFX
);
```

### Pattern 4: Ownership-Based Authorization

```typescript
export const verifyOwnership = (resourceOwnerField: string = 'userId') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const resourceOwnerId = req.body[resourceOwnerField] || req.params[resourceOwnerField];
    
    // Allow if user is owner or admin
    if (resourceOwnerId && resourceOwnerId !== req.user.id && req.user.role !== UserRole.ADMIN) {
      return res.status(403).json({
        error: 'You do not have permission to access this resource'
      });
    }
    
    next();
  };
};

// Usage
router.get('/exports/:exportId',
  authenticate,
  verifyOwnership('exportId'),
  controller.getExport
);
```

---

## Exporter Profile Management

### Get Exporter Profile by User ID

```typescript
async getExporterProfileByUserId(userId: string): Promise<ExporterProfile | null> {
  const pool = getPool();
  
  const result = await pool.query(
    `SELECT * FROM exporter_profiles WHERE user_id = $1`,
    [userId]
  );
  
  return result.rows.length > 0 ? result.rows[0] : null;
}
```

### Update Exporter Profile

```typescript
async updateExporterProfile(
  exporterId: string,
  updates: Partial<ExporterProfile>
): Promise<ExporterProfile> {
  const pool = getPool();
  
  const fields = Object.keys(updates)
    .map((key, index) => `${key} = $${index + 1}`)
    .join(', ');
  
  const values = Object.values(updates);
  
  const result = await pool.query(
    `UPDATE exporter_profiles
     SET ${fields}, updated_at = NOW()
     WHERE exporter_id = $${values.length + 1}
     RETURNING *`,
    [...values, exporterId]
  );
  
  return result.rows[0];
}
```

### Approve Exporter Profile

```typescript
async approveExporterProfile(
  exporterId: string,
  approvedBy: string
): Promise<void> {
  const pool = getPool();
  
  await pool.query(
    `UPDATE exporter_profiles
     SET status = 'ACTIVE', approved_by = $1, approved_at = NOW(), updated_at = NOW()
     WHERE exporter_id = $2`,
    [approvedBy, exporterId]
  );
  
  // Log audit event
  await pool.query(
    `INSERT INTO user_audit_logs (user_id, action, details, created_at)
     VALUES ($1, $2, $3, NOW())`,
    [approvedBy, 'APPROVE_EXPORTER_PROFILE', JSON.stringify({ exporterId })]
  );
}
```

---

## Database Queries

### Get Active Users

```typescript
async getActiveUsers(): Promise<User[]> {
  const pool = getPool();
  
  const result = await pool.query(
    `SELECT * FROM users WHERE is_active = true ORDER BY created_at DESC`
  );
  
  return result.rows;
}
```

### Get Users by Organization

```typescript
async getUsersByOrganization(organizationId: string): Promise<User[]> {
  const pool = getPool();
  
  const result = await pool.query(
    `SELECT u.*, o.name as organization_name
     FROM users u
     JOIN organizations o ON u.organization_id = o.id
     WHERE u.organization_id = $1
     ORDER BY u.created_at DESC`,
    [organizationId]
  );
  
  return result.rows;
}
```

### Get Users by Role

```typescript
async getUsersByRole(role: string): Promise<User[]> {
  const pool = getPool();
  
  const result = await pool.query(
    `SELECT * FROM users WHERE role = $1 AND is_active = true ORDER BY created_at DESC`,
    [role]
  );
  
  return result.rows;
}
```

### Get User Statistics

```typescript
async getUserStatistics(): Promise<any> {
  const pool = getPool();
  
  const result = await pool.query(
    `SELECT
      COUNT(*) as total_users,
      COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
      COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_users,
      COUNT(DISTINCT organization_id) as organizations,
      COUNT(DISTINCT role) as roles
     FROM users`
  );
  
  return result.rows[0];
}
```

### Get User Activity

```typescript
async getUserActivity(userId: string, days: number = 30): Promise<any[]> {
  const pool = getPool();
  
  const result = await pool.query(
    `SELECT action, COUNT(*) as count, MAX(created_at) as last_activity
     FROM user_audit_logs
     WHERE user_id = $1 AND created_at > NOW() - INTERVAL '${days} days'
     GROUP BY action
     ORDER BY count DESC`,
    [userId]
  );
  
  return result.rows;
}
```

---

## Error Handling

### Custom Error Classes

```typescript
export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Authorization failed') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class UserNotFoundError extends Error {
  constructor(message: string = 'User not found') {
    super(message);
    this.name = 'UserNotFoundError';
  }
}

export class UserAlreadyExistsError extends Error {
  constructor(message: string = 'User already exists') {
    super(message);
    this.name = 'UserAlreadyExistsError';
  }
}
```

### Error Handler Middleware

```typescript
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Error', { error: err.message, stack: err.stack });
  
  if (err instanceof AuthenticationError) {
    return res.status(401).json({
      success: false,
      error: err.message,
      code: 'AUTHENTICATION_ERROR'
    });
  }
  
  if (err instanceof AuthorizationError) {
    return res.status(403).json({
      success: false,
      error: err.message,
      code: 'AUTHORIZATION_ERROR'
    });
  }
  
  if (err instanceof UserNotFoundError) {
    return res.status(404).json({
      success: false,
      error: err.message,
      code: 'USER_NOT_FOUND'
    });
  }
  
  if (err instanceof UserAlreadyExistsError) {
    return res.status(409).json({
      success: false,
      error: err.message,
      code: 'USER_ALREADY_EXISTS'
    });
  }
  
  // Default error
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
};
```

---

## Testing

### Unit Tests

```typescript
describe('UserService', () => {
  let userService: BlockchainUserService;
  let mockContract: jest.Mocked<Contract>;
  
  beforeEach(() => {
    mockContract = {
      submitTransaction: jest.fn(),
      evaluateTransaction: jest.fn()
    } as any;
    
    userService = new BlockchainUserService(mockContract);
  });
  
  describe('registerUser', () => {
    it('should register a new user', async () => {
      const userData = {
        username: 'testuser',
        password: 'TestPassword123!',
        email: 'test@example.com',
        organizationId: 'commercial-bank',
        role: 'exporter'
      };
      
      mockContract.submitTransaction.mockResolvedValue(Buffer.from(''));
      mockContract.evaluateTransaction.mockResolvedValue(
        Buffer.from(JSON.stringify({
          id: 'USER-123',
          ...userData,
          passwordHash: 'hashed',
          createdAt: new Date().toISOString(),
          isActive: true
        }))
      );
      
      const result = await userService.registerUser(userData);
      
      expect(result.username).toBe('testuser');
      expect(mockContract.submitTransaction).toHaveBeenCalledWith(
        'RegisterUser',
        expect.any(String),
        'testuser',
        expect.any(String),
        'test@example.com',
        'commercial-bank',
        'exporter'
      );
    });
    
    it('should throw error if username already exists', async () => {
      const userData = {
        username: 'existing',
        password: 'TestPassword123!',
        email: 'test@example.com',
        organizationId: 'commercial-bank',
        role: 'exporter'
      };
      
      mockContract.submitTransaction.mockRejectedValue(
        new Error('User already exists')
      );
      
      await expect(userService.registerUser(userData)).rejects.toThrow();
    });
  });
  
  describe('authenticateUser', () => {
    it('should authenticate valid user', async () => {
      const userData = {
        username: 'testuser',
        password: 'TestPassword123!'
      };
      
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      mockContract.evaluateTransaction.mockResolvedValue(
        Buffer.from(JSON.stringify({
          id: 'USER-123',
          username: 'testuser',
          passwordHash: hashedPassword,
          email: 'test@example.com',
          organizationId: 'commercial-bank',
          role: 'exporter',
          isActive: true
        }))
      );
      
      const result = await userService.authenticateUser(userData);
      
      expect(result).not.toBeNull();
      expect(result?.username).toBe('testuser');
    });
    
    it('should return null for invalid password', async () => {
      const userData = {
        username: 'testuser',
        password: 'WrongPassword123!'
      };
      
      const hashedPassword = await bcrypt.hash('CorrectPassword123!', 10);
      
      mockContract.evaluateTransaction.mockResolvedValue(
        Buffer.from(JSON.stringify({
          id: 'USER-123',
          username: 'testuser',
          passwordHash: hashedPassword,
          email: 'test@example.com',
          organizationId: 'commercial-bank',
          role: 'exporter',
          isActive: true
        }))
      );
      
      const result = await userService.authenticateUser(userData);
      
      expect(result).toBeNull();
    });
  });
});
```

### Integration Tests

```typescript
describe('Authentication Flow', () => {
  let app: Express;
  let pool: Pool;
  
  beforeAll(async () => {
    app = createApp();
    pool = getPool();
  });
  
  afterAll(async () => {
    await pool.end();
  });
  
  it('should complete full registration and login flow', async () => {
    // 1. Register user
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        password: 'TestPassword123!',
        email: 'test@example.com'
      });
    
    expect(registerRes.status).toBe(201);
    expect(registerRes.body.success).toBe(true);
    expect(registerRes.body.data.token).toBeDefined();
    
    const token = registerRes.body.data.token;
    
    // 2. Login user
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'testuser',
        password: 'TestPassword123!'
      });
    
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.data.token).toBeDefined();
    
    // 3. Access protected endpoint
    const protectedRes = await request(app)
      .get('/api/exports')
      .set('Authorization', `Bearer ${loginRes.body.data.token}`);
    
    expect(protectedRes.status).toBe(200);
  });
});
```

---

## Conclusion

This implementation guide provides practical patterns for:

✅ User registration with blockchain and database sync
✅ Authentication with rate limiting and session management
✅ Authorization with multiple levels (role, permission, organization, ownership)
✅ Exporter profile management
✅ Database queries for user management
✅ Error handling and testing

All patterns follow security best practices and are production-ready.

---

**Document Version:** 1.0
**Last Updated:** 2024
