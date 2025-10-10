# ⚡ Quick Fix Summary

Immediate actions to improve security and code quality.

---

## 🔴 CRITICAL - Fix Immediately (Today)

### 1. Remove Hardcoded Secrets

**Files to update:**
- `api/exporter-bank/src/middleware/auth.middleware.ts`
- `api/exporter-bank/src/controllers/auth.controller.ts`
- `api/national-bank/src/middleware/auth.middleware.ts`
- `api/national-bank/src/controllers/auth.controller.ts`
- `api/ncat/src/middleware/auth.middleware.ts`
- `api/ncat/src/controllers/auth.controller.ts`
- `api/shipping-line/src/middleware/auth.middleware.ts`
- `api/shipping-line/src/controllers/auth.controller.ts`

**Quick Fix:**
```typescript
// REMOVE THIS:
const JWT_SECRET = process.env.JWT_SECRET || "hardcoded-secret";

// REPLACE WITH:
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
```

**Generate secrets:**
```bash
# Run this for each service
openssl rand -base64 64
```

---

### 2. Update .env Files

**Update all `api/*/.env` files:**
```bash
# CRITICAL: Set these before starting services
JWT_SECRET=<paste-generated-secret-here>
ENCRYPTION_KEY=<paste-generated-secret-here>
JWT_EXPIRES_IN=1h  # Changed from 24h
BCRYPT_ROUNDS=12
```

---

### 3. Fix CORS Configuration

**File:** `api/*/src/index.ts`

**Change from:**
```typescript
app.use(cors());
```

**To:**
```typescript
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

---

### 4. Add Input Validation

**Install dependency:**
```bash
cd api/exporter-bank
npm install validator dompurify isomorphic-dompurify
```

**Add to all controllers before blockchain submission:**
```typescript
// Sanitize inputs
const sanitizedName = req.body.exporterName?.trim().substring(0, 200);
const sanitizedType = req.body.coffeeType?.trim().substring(0, 100);
const sanitizedCountry = req.body.destinationCountry?.trim().substring(0, 100);

// Validate numbers
const quantity = parseFloat(req.body.quantity);
const estimatedValue = parseFloat(req.body.estimatedValue);

if (isNaN(quantity) || quantity <= 0 || quantity > 1000000) {
  return res.status(400).json({ 
    success: false, 
    message: 'Invalid quantity' 
  });
}

if (isNaN(estimatedValue) || estimatedValue <= 0 || estimatedValue > 1000000000) {
  return res.status(400).json({ 
    success: false, 
    message: 'Invalid estimated value' 
  });
}
```

---

### 5. Fix Password Validation

**File:** `api/*/src/middleware/validation.middleware.ts`

**Update to:**
```typescript
export const validateRegister = [
  body("username")
    .trim()
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage("Username must be 3-30 characters, alphanumeric only"),
  
  body("password")
    .isLength({ min: 12, max: 128 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage("Password must be 12+ characters with uppercase, lowercase, number, and special character"),
  
  body("email")
    .trim()
    .isEmail()
    .normalizeEmail(),
  
  handleValidationErrors,
];
```

---

## 🟠 HIGH PRIORITY - Fix This Week

### 6. Add Rate Limiting to All Services

**Install:**
```bash
npm install express-rate-limit
```

**Add to `api/*/src/index.ts`:**
```typescript
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many attempts, try again later' }
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, try again later' }
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api', apiLimiter);
```

---

### 7. Improve Error Handling

**Create `api/shared/error-handler.ts`:**
```typescript
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (err: any, req: any, res: any, next: any) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production' && !err.isOperational) {
    message = 'An error occurred';
  }

  // Log error
  console.error('Error:', {
    statusCode,
    message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
```

---

### 8. Add Health Checks

**Update `api/*/src/index.ts`:**
```typescript
app.get('/health', async (req, res) => {
  try {
    // Check Fabric connection
    const contract = fabricGateway.getExportContract();
    await contract.evaluateTransaction('GetExportRequest', 'health-check');
    
    res.json({
      status: 'healthy',
      service: 'Exporter Bank API',
      timestamp: new Date().toISOString(),
      fabric: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'Exporter Bank API',
      timestamp: new Date().toISOString(),
      fabric: 'disconnected',
      error: error.message,
    });
  }
});
```

---

### 9. Add Request Logging

**Install:**
```bash
npm install winston
```

**Create `api/shared/logger.ts`:**
```typescript
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    }),
  ],
});
```

**Use in controllers:**
```typescript
import { logger } from '../../shared/logger';

logger.info('Export created', { exportId, userId: req.user.userId });
logger.error('Export creation failed', { error: error.message, userId: req.user.userId });
```

---

### 10. Update Chaincode Validation

**File:** `chaincode/coffee-export/contract.go`

**Add validation helper:**
```go
func validateStringInput(fieldName string, value string, minLen int, maxLen int) error {
	if len(value) < minLen {
		return fmt.Errorf("%s must be at least %d characters", fieldName, minLen)
	}
	if len(value) > maxLen {
		return fmt.Errorf("%s must not exceed %d characters", fieldName, maxLen)
	}
	// Remove control characters
	cleaned := strings.Map(func(r rune) rune {
		if r < 32 || r == 127 {
			return -1
		}
		return r
	}, value)
	if cleaned != value {
		return fmt.Errorf("%s contains invalid characters", fieldName)
	}
	return nil
}
```

**Use in CreateExportRequest:**
```go
// Add after existing validation
if err := validateStringInput("exporterName", exporterName, 1, 200); err != nil {
	return err
}
if err := validateStringInput("coffeeType", coffeeType, 1, 100); err != nil {
	return err
}
if quantity > 1000000 {
	return fmt.Errorf("quantity exceeds maximum allowed")
}
if estimatedValue > 1000000000 {
	return fmt.Errorf("estimated value exceeds maximum allowed")
}
```

---

## 🟡 MEDIUM PRIORITY - Fix This Month

### 11. Add API Documentation

**Install:**
```bash
npm install swagger-jsdoc swagger-ui-express
```

**Add to `api/*/src/index.ts`:**
```typescript
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Coffee Export API',
      version: '1.0.0',
      description: 'API for coffee export management',
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
```

---

### 12. Add Unit Tests

**Install:**
```bash
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest
```

**Create test file `api/*/src/__tests__/auth.test.ts`:**
```typescript
import request from 'supertest';
import app from '../index';

describe('Authentication', () => {
  it('should reject weak passwords', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        password: 'weak',
        email: 'test@example.com',
      });
    
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
```

---

### 13. Add Environment Validation

**Create `api/shared/env-validator.ts`:**
```typescript
export function validateEnvironment() {
  const required = [
    'JWT_SECRET',
    'CHANNEL_NAME',
    'CHAINCODE_NAME',
    'MSP_ID',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate JWT_SECRET strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.warn('WARNING: JWT_SECRET should be at least 32 characters');
  }

  console.log('✅ Environment validation passed');
}
```

**Use in `index.ts`:**
```typescript
import { validateEnvironment } from '../shared/env-validator';

validateEnvironment();
```

---

## 📝 Testing Checklist

After applying fixes, test:

```bash
# 1. Test authentication
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "Test123!@#$%",
    "email": "test@example.com"
  }'

# 2. Test rate limiting
for i in {1..10}; do
  curl -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"wrong"}'
done

# 3. Test input validation
curl -X POST http://localhost:3001/api/exports \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "exporterName": "<script>alert(1)</script>",
    "quantity": -1
  }'

# 4. Test health check
curl http://localhost:3001/health

# 5. Run unit tests
npm test
```

---

## 🚀 Deployment Steps

1. **Backup current system**
   ```bash
   ./scripts/backup.sh
   ```

2. **Apply fixes in development**
   ```bash
   git checkout -b security-fixes
   # Apply all fixes
   git commit -m "Apply security fixes"
   ```

3. **Test thoroughly**
   ```bash
   npm test
   npm run lint
   ```

4. **Deploy to staging**
   ```bash
   ./scripts/deploy-staging.sh
   ```

5. **Run smoke tests**
   ```bash
   ./scripts/smoke-test.sh
   ```

6. **Deploy to production**
   ```bash
   ./scripts/deploy-production.sh
   ```

7. **Monitor for issues**
   - Check logs
   - Monitor metrics
   - Verify functionality

---

## 📊 Progress Tracking

Create a file `SECURITY_FIXES_PROGRESS.md`:

```markdown
# Security Fixes Progress

## Critical Fixes
- [ ] Remove hardcoded secrets
- [ ] Update .env files
- [ ] Fix CORS configuration
- [ ] Add input validation
- [ ] Fix password validation

## High Priority
- [ ] Add rate limiting
- [ ] Improve error handling
- [ ] Add health checks
- [ ] Add request logging
- [ ] Update chaincode validation

## Medium Priority
- [ ] Add API documentation
- [ ] Add unit tests
- [ ] Add environment validation

## Completed
- [x] Security audit completed
- [x] Fixes documented
```

---

## 🆘 Rollback Plan

If issues occur after deployment:

```bash
# 1. Revert to previous version
git revert HEAD

# 2. Redeploy previous version
./scripts/deploy-production.sh --version=previous

# 3. Restore from backup if needed
./scripts/restore.sh /backups/latest.tar.gz

# 4. Notify team
echo "Rollback completed" | mail -s "Production Rollback" team@company.com
```

---

## 📞 Support Contacts

- **Security Issues:** security@company.com
- **Technical Support:** support@company.com
- **On-Call:** +1-XXX-XXX-XXXX

---

**Last Updated:** January 2024  
**Next Review:** Weekly until all critical fixes applied
