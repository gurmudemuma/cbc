# Security Documentation

Comprehensive security implementation and best practices for the Coffee Blockchain Consortium.

---

## Table of Contents

1. [Security Overview](#security-overview)
2. [Authentication & Authorization](#authentication--authorization)
3. [Input Validation & Sanitization](#input-validation--sanitization)
4. [Rate Limiting](#rate-limiting)
5. [Password Security](#password-security)
6. [Network Security](#network-security)
7. [Blockchain Security](#blockchain-security)
8. [API Security](#api-security)
9. [File Upload Security](#file-upload-security)
10. [Environment Security](#environment-security)
11. [Security Testing](#security-testing)
12. [Security Audit Results](#security-audit-results)
13. [Incident Response](#incident-response)

---

## Security Overview

### Security Layers

```
┌─────────────────────────────────────────┐
│  Application Layer                      │
│  - Input Validation                     │
│  - Authentication/Authorization         │
│  - Rate Limiting                        │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│  API Layer                              │
│  - Helmet.js Headers                    │
│  - CORS Configuration                   │
│  - JWT Token Validation                 │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│  Blockchain Layer                       │
│  - MSP Identity Management              │
│  - Endorsement Policies                 │
│  - Private Data Collections             │
└─────────────────────────────────────────┘
           ↓
┌──────────────────────────────────��──────┐
│  Infrastructure Layer                   │
│  - Network Isolation                    │
│  - TLS/SSL Encryption                   │
│  - Firewall Rules                       │
└─────────────────────────────────────────┘
```

### Security Principles

1. **Defense in Depth** - Multiple layers of security
2. **Least Privilege** - Minimal access rights
3. **Fail Secure** - Default to deny access
4. **Separation of Duties** - No single point of control
5. **Audit Everything** - Comprehensive logging

---

## Authentication & Authorization

### JWT Token-Based Authentication

All API endpoints (except public ones) require JWT authentication:

```javascript
// Token structure
{
  "userId": "user123",
  "username": "exporter1",
  "role": "exporter",
  "organization": "ExporterBank",
  "iat": 1234567890,
  "exp": 1234654290
}
```

### Token Configuration

```env
JWT_SECRET=minimum-32-characters-change-in-production
JWT_EXPIRY=24h
REFRESH_TOKEN_EXPIRY=7d
```

**Security Requirements:**
- ✅ JWT secret must be at least 32 characters
- ✅ Different secrets for each environment
- ✅ Tokens expire after 24 hours
- ✅ Refresh tokens for extended sessions
- ✅ Token validation on every request

### Role-Based Access Control (RBAC)

Roles and permissions:

| Role | Permissions |
|------|-------------|
| **exporter** | Create exports, upload documents, view own exports |
| **banker** | Approve financing, view all exports, create transactions |
| **inspector** | Approve quality, add inspection reports, view all exports |
| **shipper** | Update shipping status, view assigned shipments |
| **admin** | Full system access, user management |

### Implementation

```typescript
// Middleware for authentication
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Middleware for authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};
```

---

## Input Validation & Sanitization

### XSS Prevention

All user inputs are sanitized using DOMPurify:

```typescript
import DOMPurify from 'isomorphic-dompurify';

const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
};
```

**Protected Against:**
- ✅ Script injection: `<script>alert('xss')</script>`
- ✅ Event handlers: `<img src=x onerror=alert('xss')>`
- ✅ JavaScript protocols: `<a href="javascript:alert('xss')">`
- ✅ Data URIs: `<img src="data:text/html,<script>...">`

### SQL Injection Prevention

Using parameterized queries and input validation:

```typescript
// Bad - vulnerable to SQL injection
const query = `SELECT * FROM users WHERE username = '${username}'`;

// Good - parameterized query
const query = 'SELECT * FROM users WHERE username = ?';
db.query(query, [username]);
```

**Protected Against:**
- ✅ Classic injection: `' OR '1'='1`
- ✅ Comment injection: `admin'--`
- ✅ UNION attacks: `' UNION SELECT * FROM passwords--`
- ✅ Blind injection: `' AND SLEEP(5)--`

### Input Validation Rules

```typescript
// Using express-validator
const validateExport = [
  body('exportId')
    .trim()
    .isLength({ min: 3, max: 50 })
    .matches(/^[A-Z0-9-]+$/)
    .withMessage('Invalid export ID format'),
  
  body('quantity')
    .isInt({ min: 1, max: 1000000 })
    .withMessage('Quantity must be between 1 and 1,000,000'),
  
  body('origin')
    .trim()
    .isLength({ min: 2, max: 100 })
    .matches(/^[a-zA-Z\s-]+$/)
    .withMessage('Invalid origin format'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address')
];
```

### Validation Testing

Test input sanitization:

```bash
./test-input-sanitization.sh
```

---

## Rate Limiting

### Configuration

```env
RATE_LIMIT_WINDOW_MS=900000      # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100      # 100 requests per window
AUTH_RATE_LIMIT_MAX=5            # 5 auth attempts per window
```

### Implementation

```typescript
import rateLimit from 'express-rate-limit';

// General rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // 100 requests per window
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for authentication
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later',
  skipSuccessfulRequests: true,
});

app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);
```

### Rate Limit Response

```json
{
  "error": "Too many requests",
  "retryAfter": 900,
  "message": "Please try again in 15 minutes"
}
```

### Testing

```bash
./scripts/test-rate-limiting.sh
```

---

## Password Security

### Password Requirements

**Minimum Requirements:**
- ✅ 12-128 characters length
- ✅ At least one uppercase letter (A-Z)
- ✅ At least one lowercase letter (a-z)
- ✅ At least one number (0-9)
- ✅ At least one special character (!@#$%^&*)
- ✅ No common passwords (checked against list)
- ✅ No sequential characters (abc, 123)
- ✅ No repeated characters (aaa, 111)

### Password Validation

```typescript
const validatePassword = (password: string): ValidationResult => {
  const errors: string[] = [];
  
  // Length check
  if (password.length < 12 || password.length > 128) {
    errors.push('Password must be between 12 and 128 characters');
  }
  
  // Complexity checks
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Common password check
  if (isCommonPassword(password)) {
    errors.push('Password is too common');
  }
  
  // Sequential characters
  if (hasSequentialChars(password)) {
    errors.push('Password contains sequential characters');
  }
  
  // Repeated characters
  if (hasRepeatedChars(password)) {
    errors.push('Password contains too many repeated characters');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};
```

### Password Hashing

Using bcrypt with 12 rounds:

```typescript
import bcrypt from 'bcryptjs';

// Hash password
const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

// Verify password
const verifyPassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
```

**Configuration:**
```env
BCRYPT_ROUNDS=12
```

### Testing

```bash
./test-authentication.sh
```

---

## Network Security

### CORS Configuration

```typescript
import cors from 'cors';

const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
```

### Security Headers (Helmet.js)

```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: {
    action: 'deny'
  },
  noSniff: true,
  xssFilter: true
}));
```

### TLS/SSL Configuration

**Production Requirements:**
- ✅ TLS 1.2 or higher
- ✅ Strong cipher suites only
- ✅ Valid SSL certificates
- ✅ HSTS enabled
- ✅ Certificate pinning (optional)

---

## Blockchain Security

### MSP Identity Management

Each organization has its own MSP (Membership Service Provider):

```yaml
Organizations:
  - &ExporterBank
    Name: ExporterBankMSP
    ID: ExporterBankMSP
    MSPDir: organizations/peerOrganizations/exporterbank/msp
    
  - &NationalBank
    Name: NationalBankMSP
    ID: NationalBankMSP
    MSPDir: organizations/peerOrganizations/nationalbank/msp
```

### Endorsement Policies

Require multiple organizations to endorse transactions:

```javascript
// Chaincode endorsement policy
const policy = {
  identities: [
    { role: { name: "member", mspId: "ExporterBankMSP" }},
    { role: { name: "member", mspId: "NationalBankMSP" }},
    { role: { name: "member", mspId: "NCATMSP" }}
  ],
  policy: {
    "2-of": [
      { "signed-by": 0 },
      { "signed-by": 1 },
      { "signed-by": 2 }
    ]
  }
};
```

### Private Data Collections

Sensitive data stored in private collections:

```json
{
  "name": "exporterBankPrivateDetails",
  "policy": "OR('ExporterBankMSP.member', 'NationalBankMSP.member')",
  "requiredPeerCount": 1,
  "maxPeerCount": 2,
  "blockToLive": 1000,
  "memberOnlyRead": true,
  "memberOnlyWrite": true
}
```

### Access Control in Chaincode

```go
// Check caller's MSP ID
func (s *SmartContract) CreateExport(ctx contractapi.TransactionContextInterface, exportData string) error {
    // Get caller's MSP ID
    mspID, err := ctx.GetClientIdentity().GetMSPID()
    if err != nil {
        return fmt.Errorf("failed to get MSP ID: %v", err)
    }
    
    // Only ExporterBank can create exports
    if mspID != "ExporterBankMSP" {
        return fmt.Errorf("only ExporterBank can create exports")
    }
    
    // ... rest of the logic
}
```

---

## API Security

### Request Logging

Using Morgan for HTTP request logging:

```typescript
import morgan from 'morgan';

// Custom token for user ID
morgan.token('user', (req: any) => req.user?.userId || 'anonymous');

// Log format
const logFormat = ':remote-addr - :user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms';

app.use(morgan(logFormat, {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));
```

### Error Handling

Never expose sensitive information in errors:

```typescript
// Bad - exposes internal details
res.status(500).json({ 
  error: error.message,
  stack: error.stack 
});

// Good - generic error message
res.status(500).json({ 
  error: 'Internal server error',
  requestId: req.id 
});

// Log full error internally
logger.error('Database error', {
  error: error.message,
  stack: error.stack,
  requestId: req.id,
  userId: req.user?.userId
});
```

### API Versioning

```typescript
// Version 1 (deprecated)
app.use('/api/v1/', v1Router);

// Version 2 (current)
app.use('/api/v2/', v2Router);

// Default to latest
app.use('/api/', v2Router);
```

---

## File Upload Security

### Configuration

```env
MAX_FILE_SIZE_MB=10
ALLOWED_FILE_TYPES=application/pdf,image/jpeg,image/png,image/jpg
```

### Implementation

```typescript
import multer from 'multer';
import path from 'path';

const storage = multer.memoryStorage();

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB || '10')) * 1024 * 1024
  },
  fileFilter
});
```

### Validation

```typescript
const validateFile = (file: Express.Multer.File): void => {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File too large');
  }
  
  // Check MIME type
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    throw new Error('Invalid file type');
  }
  
  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error('Invalid file extension');
  }
  
  // Scan for malware (in production)
  // await scanFile(file.buffer);
};
```

---

## Environment Security

### Environment Variable Validation

```typescript
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().regex(/^\d+$/),
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  JWT_SECRET: z.string().min(32),
  DATABASE_URL: z.string().url(),
  CORS_ORIGIN: z.string(),
  // ... more validations
});

const validateEnv = () => {
  try {
    envSchema.parse(process.env);
  } catch (error) {
    console.error('Environment validation failed:', error);
    process.exit(1);
  }
};
```

### Secrets Management

**Development:**
- Use `.env` files (never commit to git)
- Different secrets per developer

**Production:**
- Use secret management service (AWS Secrets Manager, HashiCorp Vault)
- Rotate secrets regularly
- Audit secret access

### .env.example Template

```env
# SECURITY: Never commit actual secrets to git
# Copy this file to .env and fill in real values

JWT_SECRET=CHANGE_THIS_TO_RANDOM_32_CHAR_STRING
DATABASE_PASSWORD=CHANGE_THIS
API_KEY=CHANGE_THIS
```

---

## Security Testing

### Automated Tests

```bash
# Test authentication
./test-authentication.sh

# Test input sanitization
./test-input-sanitization.sh

# Test rate limiting
./scripts/test-rate-limiting.sh

# Run all security tests
npm run test:security
```

### Manual Security Checklist

- [ ] All endpoints require authentication (except public ones)
- [ ] Rate limiting is enforced
- [ ] Input validation on all user inputs
- [ ] XSS protection enabled
- [ ] SQL injection protection
- [ ] CSRF protection (for stateful apps)
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] Passwords hashed with bcrypt
- [ ] JWT secrets are strong and unique
- [ ] File uploads validated
- [ ] Error messages don't leak information
- [ ] Logging doesn't include sensitive data
- [ ] HTTPS enforced in production
- [ ] Dependencies regularly updated
- [ ] Security audit performed

---

## Security Audit Results

### ✅ Implemented Security Features

1. **Authentication & Authorization**
   - JWT token-based authentication
   - Role-based access control
   - Token expiration and refresh

2. **Input Security**
   - XSS prevention with DOMPurify
   - SQL injection prevention
   - Input validation with express-validator
   - Output encoding

3. **Rate Limiting**
   - General API rate limiting (100 req/15min)
   - Strict auth rate limiting (5 req/15min)
   - Per-IP tracking

4. **Password Security**
   - Strong password requirements
   - bcrypt hashing (12 rounds)
   - Common password checking
   - No password in logs

5. **Network Security**
   - CORS configuration
   - Helmet.js security headers
   - TLS/SSL in production

6. **API Security**
   - Request logging
   - Error handling
   - API versioning

7. **File Upload Security**
   - File type validation
   - Size limits
   - MIME type checking

8. **Blockchain Security**
   - MSP identity management
   - Endorsement policies
   - Private data collections
   - Access control in chaincode

### 🔍 Security Test Results

All security tests passing:

```
✅ Password validation tests: PASSED
✅ Input sanitization tests: PASSED
✅ Rate limiting tests: PASSED
✅ Authentication flow tests: PASSED
✅ Authorization tests: PASSED
✅ File upload validation: PASSED
✅ XSS prevention: PASSED
✅ SQL injection prevention: PASSED
```

---

## Incident Response

### Security Incident Procedure

1. **Detection**
   - Monitor logs for suspicious activity
   - Set up alerts for security events
   - Regular security audits

2. **Containment**
   - Isolate affected systems
   - Revoke compromised credentials
   - Block malicious IPs

3. **Investigation**
   - Analyze logs
   - Identify attack vector
   - Assess damage

4. **Recovery**
   - Patch vulnerabilities
   - Restore from backups if needed
   - Reset compromised credentials

5. **Post-Incident**
   - Document incident
   - Update security measures
   - Train team on lessons learned

### Emergency Contacts

```
Security Team Lead: security@coffeeexport.com
DevOps Team: devops@coffeeexport.com
Emergency Hotline: +1-XXX-XXX-XXXX
```

---

## Security Best Practices

### For Developers

1. ✅ Never commit secrets to git
2. ✅ Always validate and sanitize user input
3. ✅ Use parameterized queries
4. ✅ Keep dependencies updated
5. ✅ Follow principle of least privilege
6. ✅ Log security events
7. ✅ Use HTTPS in production
8. ✅ Implement proper error handling
9. ✅ Regular security code reviews
10. ✅ Security testing in CI/CD

### For Operations

1. ✅ Regular security audits
2. ✅ Monitor logs continuously
3. ✅ Keep systems patched
4. ✅ Backup regularly
5. ✅ Rotate secrets periodically
6. ✅ Implement network segmentation
7. ✅ Use firewalls and IDS/IPS
8. ✅ Disaster recovery plan
9. ✅ Incident response plan
10. ✅ Security awareness training

---

## Compliance

### Standards & Regulations

- **GDPR** - Data protection and privacy
- **PCI DSS** - Payment card security (if applicable)
- **SOC 2** - Security controls
- **ISO 27001** - Information security management

### Data Protection

- Personal data encrypted at rest and in transit
- Data retention policies
- Right to be forgotten
- Data breach notification procedures

---

## Security Updates

### Recent Security Fixes

See [CHANGELOG.md](./CHANGELOG.md) for complete list of security updates.

### Reporting Security Issues

**DO NOT** open public issues for security vulnerabilities.

Email: security@coffeeexport.com

Include:
- Description of vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

---

**Last Updated:** Security Consolidation Phase  
**Status:** All security features implemented and tested  
**Next Review:** Quarterly security audit scheduled
