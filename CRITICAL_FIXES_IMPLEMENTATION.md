# 🔧 Critical Security Fixes Implementation Guide

This document provides step-by-step implementation for all critical security issues.

---

## Fix #1: Remove Hardcoded JWT Secrets

### Problem
JWT secrets have hardcoded fallbacks that compromise security.

### Solution

#### Step 1: Update Auth Middleware (All Services)

Create a new file: `api/shared/security.config.ts`

```typescript
export class SecurityConfig {
  private static validateJWTSecret(secret: string | undefined): string {
    if (!secret) {
      throw new Error(
        'SECURITY ERROR: JWT_SECRET environment variable is required'
      );
    }

    if (process.env.NODE_ENV === 'production') {
      if (secret.length < 64) {
        throw new Error(
          'SECURITY ERROR: JWT_SECRET must be at least 64 characters in production'
        );
      }
      
      if (secret.includes('dev') || secret.includes('test') || secret.includes('change')) {
        throw new Error(
          'SECURITY ERROR: JWT_SECRET appears to be a development secret'
        );
      }
    }

    return secret;
  }

  public static getJWTSecret(): string {
    return this.validateJWTSecret(process.env.JWT_SECRET);
  }

  public static getJWTExpiresIn(): string {
    return process.env.JWT_EXPIRES_IN || '1h'; // Reduced from 24h
  }
}
```

#### Step 2: Update All Auth Controllers

Replace in `api/*/src/controllers/auth.controller.ts`:

```typescript
import { SecurityConfig } from '../../shared/security.config';

export class AuthController {
  private JWT_SECRET: string;
  private JWT_EXPIRES_IN: string;

  constructor() {
    // Remove all hardcoded secrets and validation logic
    this.JWT_SECRET = SecurityConfig.getJWTSecret();
    this.JWT_EXPIRES_IN = SecurityConfig.getJWTExpiresIn();
  }
  
  // Rest of the code...
}
```

#### Step 3: Update All Auth Middleware

Replace in `api/*/src/middleware/auth.middleware.ts`:

```typescript
import { SecurityConfig } from '../../shared/security.config';

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "No token provided",
      });
      return;
    }

    const token = authHeader.substring(7);
    const JWT_SECRET = SecurityConfig.getJWTSecret();
    
    const decoded = jwt.verify(token, JWT_SECRET) as AuthJWTPayload;
    req.user = decoded;
    next();
  } catch (error: unknown) {
    // ... error handling
  }
};
```

#### Step 4: Update .env.example Files

Update all `api/*/.env.example` files:

```bash
# CRITICAL: Generate a strong, unique JWT secret for each service
# Production: Use a secrets management system (AWS Secrets Manager, HashiCorp Vault, etc.)
# Generate with: openssl rand -base64 64
JWT_SECRET=
JWT_EXPIRES_IN=1h

# SECURITY: Never commit actual secrets to version control
# SECURITY: Use different secrets for each environment
# SECURITY: Rotate secrets regularly (every 90 days)
```

#### Step 5: Add Startup Validation

Add to each `api/*/src/index.ts` before starting server:

```typescript
import { SecurityConfig } from '../shared/security.config';

// Validate security configuration before starting
try {
  SecurityConfig.getJWTSecret();
  console.log('✅ Security configuration validated');
} catch (error) {
  console.error('❌ Security configuration error:', error);
  process.exit(1);
}
```

---

## Fix #2: Strengthen Password Validation

### Problem
Inconsistent and weak password requirements across services.

### Solution

#### Step 1: Create Shared Password Validator

Create `api/shared/password.validator.ts`:

```typescript
import { body, ValidationChain } from 'express-validator';

export class PasswordValidator {
  private static readonly MIN_LENGTH = 12;
  private static readonly MAX_LENGTH = 128;
  
  // Common weak passwords to reject
  private static readonly WEAK_PASSWORDS = new Set([
    'password', 'password123', '12345678', 'qwerty', 'abc123',
    'password1', '123456789', '1234567890', 'admin', 'letmein',
    'welcome', 'monkey', 'dragon', 'master', 'sunshine'
  ]);

  public static validatePassword(): ValidationChain {
    return body('password')
      .trim()
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: this.MIN_LENGTH, max: this.MAX_LENGTH })
      .withMessage(`Password must be between ${this.MIN_LENGTH} and ${this.MAX_LENGTH} characters`)
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage(
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'
      )
      .custom((value: string) => {
        if (this.WEAK_PASSWORDS.has(value.toLowerCase())) {
          throw new Error('Password is too common. Please choose a stronger password');
        }
        return true;
      })
      .custom((value: string) => {
        // Check for sequential characters
        if (/(.)\1{2,}/.test(value)) {
          throw new Error('Password cannot contain more than 2 repeated characters');
        }
        return true;
      });
  }

  public static validatePasswordConfirmation(): ValidationChain {
    return body('passwordConfirmation')
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Password confirmation does not match password');
        }
        return true;
      });
  }

  public static async hashPassword(password: string): Promise<string> {
    const bcrypt = require('bcryptjs');
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    return await bcrypt.hash(password, saltRounds);
  }

  public static async verifyPassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    const bcrypt = require('bcryptjs');
    return await bcrypt.compare(password, hash);
  }
}
```

#### Step 2: Update All Validation Middleware

Replace in `api/*/src/middleware/validation.middleware.ts`:

```typescript
import { PasswordValidator } from '../../shared/password.validator';

export const validateRegister = [
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage("Username can only contain letters, numbers, underscores, and hyphens"),
  
  PasswordValidator.validatePassword(),
  PasswordValidator.validatePasswordConfirmation(),
  
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),
  
  handleValidationErrors,
];

export const validateLogin = [
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required"),
  
  body("password")
    .notEmpty()
    .withMessage("Password is required"),
  
  handleValidationErrors,
];
```

---

## Fix #3: Add Input Sanitization

### Problem
No sanitization of user inputs before blockchain submission.

### Solution

#### Step 1: Create Input Sanitizer

Create `api/shared/input.sanitizer.ts`:

```typescript
import DOMPurify from 'isomorphic-dompurify';

export class InputSanitizer {
  private static readonly MAX_STRING_LENGTH = 1000;
  private static readonly MAX_TEXT_LENGTH = 10000;

  /**
   * Sanitize string input to prevent XSS and injection attacks
   */
  public static sanitizeString(input: string, maxLength?: number): string {
    if (!input) return '';
    
    const limit = maxLength || this.MAX_STRING_LENGTH;
    
    // Trim and limit length
    let sanitized = input.trim().substring(0, limit);
    
    // Remove HTML tags and scripts
    sanitized = DOMPurify.sanitize(sanitized, { 
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: []
    });
    
    // Remove null bytes and control characters
    sanitized = sanitized.replace(/\0/g, '').replace(/[\x00-\x1F\x7F]/g, '');
    
    return sanitized;
  }

  /**
   * Sanitize numeric input
   */
  public static sanitizeNumber(input: any): number {
    const num = parseFloat(input);
    if (isNaN(num) || !isFinite(num)) {
      throw new Error('Invalid number format');
    }
    return num;
  }

  /**
   * Sanitize and validate positive number
   */
  public static sanitizePositiveNumber(input: any, max?: number): number {
    const num = this.sanitizeNumber(input);
    if (num <= 0) {
      throw new Error('Number must be positive');
    }
    if (max && num > max) {
      throw new Error(`Number must not exceed ${max}`);
    }
    return num;
  }

  /**
   * Sanitize export request data
   */
  public static sanitizeExportRequest(data: any): any {
    return {
      exporterName: this.sanitizeString(data.exporterName, 100),
      coffeeType: this.sanitizeString(data.coffeeType, 50),
      quantity: this.sanitizePositiveNumber(data.quantity, 1000000),
      destinationCountry: this.sanitizeString(data.destinationCountry, 100),
      estimatedValue: this.sanitizePositiveNumber(data.estimatedValue, 100000000),
    };
  }

  /**
   * Sanitize ID format
   */
  public static sanitizeId(id: string): string {
    const sanitized = this.sanitizeString(id, 100);
    if (!/^[A-Z0-9-]+$/i.test(sanitized)) {
      throw new Error('Invalid ID format');
    }
    return sanitized;
  }

  /**
   * Sanitize date string
   */
  public static sanitizeDate(dateString: string): string {
    const sanitized = this.sanitizeString(dateString, 30);
    const date = new Date(sanitized);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date format');
    }
    return date.toISOString();
  }

  /**
   * Sanitize object recursively
   */
  public static sanitizeObject(obj: any, maxDepth: number = 5): any {
    if (maxDepth <= 0) {
      throw new Error('Maximum object depth exceeded');
    }

    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item, maxDepth - 1));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = this.sanitizeString(key, 100);
      
      if (typeof value === 'string') {
        sanitized[sanitizedKey] = this.sanitizeString(value);
      } else if (typeof value === 'number') {
        sanitized[sanitizedKey] = this.sanitizeNumber(value);
      } else if (typeof value === 'object') {
        sanitized[sanitizedKey] = this.sanitizeObject(value, maxDepth - 1);
      } else {
        sanitized[sanitizedKey] = value;
      }
    }

    return sanitized;
  }
}
```

#### Step 2: Update Export Controller

Update `api/exporter-bank/src/controllers/export.controller.ts`:

```typescript
import { InputSanitizer } from '../../shared/input.sanitizer';

export class ExportController {
  public createExport = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = req.user as AuthJWTPayload;
      
      // Sanitize all inputs
      const sanitizedData = InputSanitizer.sanitizeExportRequest(req.body);
      
      const exportId = `EXP-${uuidv4()}`;
      const contract = fabricGateway.getExportContract();

      await contract.submitTransaction(
        "CreateExportRequest",
        exportId,
        user.organizationId || "BANK-001",
        sanitizedData.exporterName,
        sanitizedData.coffeeType,
        sanitizedData.quantity.toString(),
        sanitizedData.destinationCountry,
        sanitizedData.estimatedValue.toString()
      );

      res.status(201).json({
        success: true,
        message: "Export request created successfully",
        data: { exportId },
      });
    } catch (error: unknown) {
      next(error);
    }
  };
}
```

---

## Fix #4: Secure Document Encryption

### Problem
Encryption key randomly generated or not properly managed.

### Solution

#### Step 1: Create Encryption Service

Create `api/shared/encryption.service.ts`:

```typescript
import crypto from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(crypto.scrypt);

export class EncryptionService {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32;
  private static readonly IV_LENGTH = 16;
  private static readonly SALT_LENGTH = 32;
  private static readonly TAG_LENGTH = 16;

  /**
   * Get encryption key from environment or key management service
   */
  private static getEncryptionKey(): Buffer {
    const keyString = process.env.ENCRYPTION_KEY;
    
    if (!keyString) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }

    if (process.env.NODE_ENV === 'production' && keyString.length < 64) {
      throw new Error('ENCRYPTION_KEY must be at least 64 characters in production');
    }

    // Derive a proper key from the string
    return crypto.createHash('sha256').update(keyString).digest();
  }

  /**
   * Encrypt data
   */
  public static async encrypt(data: Buffer): Promise<Buffer> {
    try {
      const key = this.getEncryptionKey();
      const iv = crypto.randomBytes(this.IV_LENGTH);
      const salt = crypto.randomBytes(this.SALT_LENGTH);

      // Derive key with salt
      const derivedKey = (await scrypt(key, salt, this.KEY_LENGTH)) as Buffer;

      const cipher = crypto.createCipheriv(this.ALGORITHM, derivedKey, iv);
      
      const encrypted = Buffer.concat([
        cipher.update(data),
        cipher.final()
      ]);

      const tag = cipher.getAuthTag();

      // Combine: salt + iv + tag + encrypted data
      return Buffer.concat([salt, iv, tag, encrypted]);
    } catch (error) {
      throw new Error(`Encryption failed: ${error}`);
    }
  }

  /**
   * Decrypt data
   */
  public static async decrypt(encryptedData: Buffer): Promise<Buffer> {
    try {
      const key = this.getEncryptionKey();

      // Extract components
      const salt = encryptedData.slice(0, this.SALT_LENGTH);
      const iv = encryptedData.slice(
        this.SALT_LENGTH,
        this.SALT_LENGTH + this.IV_LENGTH
      );
      const tag = encryptedData.slice(
        this.SALT_LENGTH + this.IV_LENGTH,
        this.SALT_LENGTH + this.IV_LENGTH + this.TAG_LENGTH
      );
      const encrypted = encryptedData.slice(
        this.SALT_LENGTH + this.IV_LENGTH + this.TAG_LENGTH
      );

      // Derive key with salt
      const derivedKey = (await scrypt(key, salt, this.KEY_LENGTH)) as Buffer;

      const decipher = crypto.createDecipheriv(this.ALGORITHM, derivedKey, iv);
      decipher.setAuthTag(tag);

      return Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]);
    } catch (error) {
      throw new Error(`Decryption failed: ${error}`);
    }
  }

  /**
   * Encrypt string
   */
  public static async encryptString(text: string): Promise<string> {
    const buffer = Buffer.from(text, 'utf8');
    const encrypted = await this.encrypt(buffer);
    return encrypted.toString('base64');
  }

  /**
   * Decrypt string
   */
  public static async decryptString(encryptedText: string): Promise<string> {
    const buffer = Buffer.from(encryptedText, 'base64');
    const decrypted = await this.decrypt(buffer);
    return decrypted.toString('utf8');
  }

  /**
   * Generate a secure random key
   */
  public static generateKey(): string {
    return crypto.randomBytes(32).toString('base64');
  }
}
```

#### Step 2: Update Export Controller

Update document upload in `api/exporter-bank/src/controllers/export.controller.ts`:

```typescript
import { EncryptionService } from '../../shared/encryption.service';

public uploadDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
      return;
    }

    // Encrypt file before uploading to IPFS
    const encryptedBuffer = await EncryptionService.encrypt(req.file.buffer);

    // Upload to IPFS
    const cid = await ipfsService.uploadFile(encryptedBuffer, req.file.originalname);

    // Store CID in blockchain
    const exportId = req.params.exportId;
    const docType = req.body.docType;
    
    const contract = fabricGateway.getExportContract();
    await contract.submitTransaction(
      "AddDocument",
      exportId,
      docType,
      cid
    );

    res.status(200).json({
      success: true,
      message: "Document uploaded and encrypted successfully",
      data: { cid },
    });
  } catch (error: unknown) {
    next(error);
  }
};
```

---

## Fix #5: Implement Comprehensive Rate Limiting

### Problem
Missing or insufficient rate limiting across services.

### Solution

#### Step 1: Create Rate Limiting Configuration

Create `api/shared/rate-limit.config.ts`:

```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

export class RateLimitConfig {
  private static redisClient: Redis | null = null;

  private static getRedisClient(): Redis | undefined {
    if (process.env.REDIS_URL) {
      if (!this.redisClient) {
        this.redisClient = new Redis(process.env.REDIS_URL);
      }
      return this.redisClient;
    }
    return undefined;
  }

  /**
   * Strict rate limit for authentication endpoints
   */
  public static authLimiter() {
    const redis = this.getRedisClient();
    
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 requests per window
      message: {
        success: false,
        message: 'Too many authentication attempts. Please try again later.',
      },
      standardHeaders: true,
      legacyHeaders: false,
      store: redis ? new RedisStore({
        client: redis,
        prefix: 'rl:auth:',
      }) : undefined,
      // Skip successful requests
      skipSuccessfulRequests: true,
    });
  }

  /**
   * Standard rate limit for API endpoints
   */
  public static apiLimiter() {
    const redis = this.getRedisClient();
    
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // 100 requests per window
      message: {
        success: false,
        message: 'Too many requests. Please try again later.',
      },
      standardHeaders: true,
      legacyHeaders: false,
      store: redis ? new RedisStore({
        client: redis,
        prefix: 'rl:api:',
      }) : undefined,
    });
  }

  /**
   * Strict rate limit for blockchain write operations
   */
  public static blockchainWriteLimiter() {
    const redis = this.getRedisClient();
    
    return rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 10, // 10 writes per minute
      message: {
        success: false,
        message: 'Too many blockchain operations. Please slow down.',
      },
      standardHeaders: true,
      legacyHeaders: false,
      store: redis ? new RedisStore({
        client: redis,
        prefix: 'rl:blockchain:',
      }) : undefined,
      keyGenerator: (req) => {
        // Rate limit per user
        return req.user?.userId || req.ip;
      },
    });
  }

  /**
   * Rate limit for file uploads
   */
  public static uploadLimiter() {
    const redis = this.getRedisClient();
    
    return rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 20, // 20 uploads per hour
      message: {
        success: false,
        message: 'Too many file uploads. Please try again later.',
      },
      standardHeaders: true,
      legacyHeaders: false,
      store: redis ? new RedisStore({
        client: redis,
        prefix: 'rl:upload:',
      }) : undefined,
    });
  }
}
```

#### Step 2: Apply Rate Limiting to All Services

Update `api/*/src/index.ts`:

```typescript
import { RateLimitConfig } from '../shared/rate-limit.config';

// Apply rate limiting
app.use('/api/auth/login', RateLimitConfig.authLimiter());
app.use('/api/auth/register', RateLimitConfig.authLimiter());
app.use('/api/auth', RateLimitConfig.apiLimiter());

// Apply blockchain write limiter to mutation endpoints
app.use('/api/exports', RateLimitConfig.apiLimiter());
app.post('/api/exports', RateLimitConfig.blockchainWriteLimiter());
app.put('/api/exports/:id/*', RateLimitConfig.blockchainWriteLimiter());

// Apply upload limiter
app.post('/api/exports/:id/documents', RateLimitConfig.uploadLimiter());
```

---

## Deployment Checklist

Before deploying these fixes:

- [ ] Generate strong JWT secrets for each service
- [ ] Generate encryption keys
- [ ] Set up Redis for distributed rate limiting
- [ ] Update all .env files
- [ ] Test authentication flow
- [ ] Test password validation
- [ ] Test input sanitization
- [ ] Test encryption/decryption
- [ ] Test rate limiting
- [ ] Update documentation
- [ ] Train team on new security measures
- [ ] Set up secret rotation schedule

---

## Environment Variables Required

Add to all service .env files:

```bash
# Security (REQUIRED)
JWT_SECRET=<generate-with-openssl-rand-base64-64>
ENCRYPTION_KEY=<generate-with-openssl-rand-base64-64>
BCRYPT_ROUNDS=12

# Rate Limiting (Optional but recommended)
REDIS_URL=redis://localhost:6379

# Token Configuration
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
```

---

## Testing Commands

```bash
# Generate JWT secret
openssl rand -base64 64

# Generate encryption key
openssl rand -base64 64

# Test password strength
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "WeakPass",
    "passwordConfirmation": "WeakPass",
    "email": "test@example.com"
  }'

# Should fail with password requirements error
```

---

**Implementation Priority:** CRITICAL  
**Estimated Time:** 2-3 days  
**Testing Time:** 1-2 days  
**Deployment:** Staged rollout recommended
