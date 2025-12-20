# Coffee Export Blockchain - Best Practices Guide

## Overview
This guide outlines best practices for maintaining and extending the Coffee Export Blockchain codebase.

---

## 1. TypeScript Best Practices

### ✅ DO: Use Specific Types

```typescript
// Good
import { AuthenticatedRequest, ApiResponse } from '@shared/types';

export const getExports = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse<Export[]>>
): Promise<void> => {
  // Implementation
};
```

### ❌ DON'T: Use `any` Type

```typescript
// Bad
export const getExports = async (req: any, res: any): any => {
  // Implementation
};
```

### ✅ DO: Use Interfaces for Objects

```typescript
// Good
interface ExportFilter {
  status?: ExportStatus;
  organizationId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

const filterExports = (exports: Export[], filter: ExportFilter): Export[] => {
  // Implementation
};
```

### ✅ DO: Use Union Types for Status

```typescript
// Good
type ExportStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

interface Export {
  id: string;
  status: ExportStatus;
}
```

---

## 2. Logging Best Practices

### ✅ DO: Use Logger Service

```typescript
import { createLogger } from '@shared/logger';

const logger = createLogger('ExportController');

export const createExport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    logger.info('Creating new export', { userId: req.user?.id });
    // Implementation
    logger.info('Export created successfully', { exportId: export.id });
  } catch (error) {
    logger.error('Failed to create export', { error: error.message, userId: req.user?.id });
  }
};
```

### ❌ DON'T: Use console.log

```typescript
// Bad
console.log('Creating export');
console.error('Error:', error);
```

### ✅ DO: Include Context in Logs

```typescript
// Good
logger.info('Export status updated', {
  exportId: export.id,
  oldStatus: export.status,
  newStatus: newStatus,
  userId: req.user?.id,
  timestamp: new Date().toISOString(),
});
```

### ✅ DO: Use Appropriate Log Levels

```typescript
logger.debug('Detailed debugging information');
logger.info('General informational messages');
logger.warn('Warning messages for potential issues');
logger.error('Error messages for failures');
```

---

## 3. Error Handling Best Practices

### ✅ DO: Use AppError Class

```typescript
import { AppError } from '@shared/types';

export const getExport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const export = await exportService.getById(req.params.id);
    if (!export) {
      throw new AppError(
        'EXPORT_NOT_FOUND',
        'Export not found',
        404,
        { exportId: req.params.id }
      );
    }
    res.json({ success: true, data: export });
  } catch (error) {
    handleError(error, res);
  }
};
```

### ✅ DO: Provide Meaningful Error Messages

```typescript
// Good
throw new AppError(
  'INVALID_EXPORT_STATUS',
  'Cannot approve export with status DRAFT',
  400,
  { currentStatus: export.status, allowedStatuses: ['SUBMITTED'] }
);
```

### ❌ DON'T: Throw Generic Errors

```typescript
// Bad
throw new Error('Error');
throw new Error('Something went wrong');
```

---

## 4. Middleware Best Practices

### ✅ DO: Use Proper Middleware Types

```typescript
import { ExpressMiddleware } from '@shared/types';

export const requireRole = (allowedRoles: string[]): ExpressMiddleware => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
      });
    }
    next();
  };
};
```

### ✅ DO: Chain Middleware Properly

```typescript
// Good
router.post(
  '/exports',
  authMiddleware,
  requireRole(['EXPORTER', 'ADMIN']),
  validateRequest(createExportSchema),
  createExport
);
```

---

## 5. Database Best Practices

### ✅ DO: Use Connection Pooling

```typescript
// Connection pool is configured in db.config.ts
// Use it for all database operations
const result = await pool.query('SELECT * FROM exports WHERE id = $1', [exportId]);
```

### ✅ DO: Use Transactions for Multi-Step Operations

```typescript
const client = await pool.connect();
try {
  await client.query('BEGIN');
  
  // Step 1
  await client.query('UPDATE exports SET status = $1 WHERE id = $2', ['APPROVED', exportId]);
  
  // Step 2
  await client.query('INSERT INTO audit_logs (action, resource_id) VALUES ($1, $2)', ['APPROVE', exportId]);
  
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

### ✅ DO: Use Parameterized Queries

```typescript
// Good - Prevents SQL injection
const result = await pool.query(
  'SELECT * FROM exports WHERE id = $1 AND status = $2',
  [exportId, status]
);
```

### ❌ DON'T: Use String Concatenation

```typescript
// Bad - SQL injection vulnerability
const result = await pool.query(
  `SELECT * FROM exports WHERE id = '${exportId}' AND status = '${status}'`
);
```

---

## 6. API Response Best Practices

### ✅ DO: Use Consistent Response Format

```typescript
// Success Response
res.json({
  success: true,
  data: export,
  message: 'Export retrieved successfully',
});

// Error Response
res.status(400).json({
  success: false,
  error: 'Invalid export status',
  errors: {
    status: ['Status must be one of: DRAFT, SUBMITTED, APPROVED'],
  },
});

// Paginated Response
res.json({
  success: true,
  data: exports,
  pagination: {
    page: 1,
    limit: 10,
    total: 100,
    pages: 10,
  },
});
```

### ✅ DO: Include Timestamps

```typescript
res.json({
  success: true,
  data: export,
  timestamp: new Date().toISOString(),
  path: req.path,
});
```

---

## 7. Validation Best Practices

### ✅ DO: Validate Input Data

```typescript
import { z } from 'zod';

const createExportSchema = z.object({
  coffeeType: z.string().min(1).max(100),
  quantity: z.number().positive(),
  destination: z.string().min(1).max(100),
  estimatedValue: z.number().positive(),
});

router.post(
  '/exports',
  validateRequest(createExportSchema),
  createExport
);
```

### ✅ DO: Sanitize Input

```typescript
import { InputSanitizer } from '@shared/input.sanitizer';

const sanitized = {
  coffeeType: InputSanitizer.sanitizeString(req.body.coffeeType, 100),
  quantity: InputSanitizer.sanitizePositiveNumber(req.body.quantity),
};
```

---

## 8. Security Best Practices

### ✅ DO: Validate Authentication

```typescript
export const authMiddleware: ExpressMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Missing authentication token',
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded as any;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }
};
```

### ✅ DO: Use HTTPS in Production

```typescript
// Configured in security.best-practices.ts
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN }));
```

### ✅ DO: Implement Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

---

## 9. Testing Best Practices

### ✅ DO: Write Unit Tests

```typescript
describe('ExportService', () => {
  describe('createExport', () => {
    it('should create an export with valid data', async () => {
      const exportData = {
        coffeeType: 'Arabica',
        quantity: 100,
        destination: 'USA',
        estimatedValue: 5000,
      };
      
      const result = await exportService.create(exportData);
      
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.status).toBe('DRAFT');
    });
    
    it('should throw error with invalid data', async () => {
      const invalidData = { coffeeType: '' };
      
      await expect(exportService.create(invalidData)).rejects.toThrow();
    });
  });
});
```

### ✅ DO: Test Error Cases

```typescript
it('should return 404 when export not found', async () => {
  const response = await request(app)
    .get('/api/exports/invalid-id')
    .set('Authorization', `Bearer ${token}`);
  
  expect(response.status).toBe(404);
  expect(response.body.success).toBe(false);
});
```

---

## 10. Documentation Best Practices

### ✅ DO: Document API Endpoints

```typescript
/**
 * Create a new export
 * 
 * @route POST /api/exports
 * @param {Object} req.body - Export data
 * @param {string} req.body.coffeeType - Type of coffee
 * @param {number} req.body.quantity - Quantity in kg
 * @param {string} req.body.destination - Destination country
 * @param {number} req.body.estimatedValue - Estimated value in USD
 * @returns {Object} Created export object
 * @throws {AppError} If validation fails
 */
export const createExport = async (req: AuthenticatedRequest, res: Response) => {
  // Implementation
};
```

### ✅ DO: Document Complex Functions

```typescript
/**
 * Calculate export fees based on quantity and destination
 * 
 * @param {number} quantity - Quantity in kg
 * @param {string} destination - Destination country code
 * @returns {number} Total fees in USD
 * 
 * @example
 * const fees = calculateFees(1000, 'US');
 * // Returns: 150
 */
const calculateFees = (quantity: number, destination: string): number => {
  // Implementation
};
```

---

## 11. Performance Best Practices

### ✅ DO: Use Caching

```typescript
import { CacheService } from '@shared/cache.service';

const cacheService = new CacheService();

export const getExport = async (req: AuthenticatedRequest, res: Response) => {
  const cacheKey = `export:${req.params.id}`;
  
  // Try cache first
  let export = await cacheService.get<Export>(cacheKey);
  
  if (!export) {
    // Fetch from database
    export = await exportService.getById(req.params.id);
    
    // Cache for 1 hour
    await cacheService.set(cacheKey, export, 3600);
  }
  
  res.json({ success: true, data: export });
};
```

### ✅ DO: Use Pagination

```typescript
export const listExports = async (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;
  
  const { exports, total } = await exportService.list(offset, limit);
  
  res.json({
    success: true,
    data: exports,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
};
```

### ✅ DO: Use Indexes on Frequently Queried Fields

```sql
-- In database migrations
CREATE INDEX idx_exports_status ON exports(status);
CREATE INDEX idx_exports_exporter_id ON exports(exporter_id);
CREATE INDEX idx_exports_created_at ON exports(created_at);
```

---

## 12. Code Organization Best Practices

### ✅ DO: Follow Folder Structure

```
api/commercial-bank/
├── src/
│   ├── controllers/
│   │   ├── export.controller.ts
│   │   ├── auth.controller.ts
│   │   └── user.controller.ts
│   ├── routes/
│   │   ├── export.routes.ts
│   │   ├── auth.routes.ts
│   │   └── user.routes.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   └── error.middleware.ts
│   ├── services/
│   │   ├── export.service.ts
│   │   └── auth.service.ts
│   ├── types/
│   │   └── index.ts
│   └── index.ts
├── .env.template
├── Dockerfile
├── package.json
└── tsconfig.json
```

### ✅ DO: Separate Concerns

```typescript
// Controller - Handles HTTP requests
export const createExport = async (req: AuthenticatedRequest, res: Response) => {
  const data = req.body;
  const export = await exportService.create(data);
  res.json({ success: true, data: export });
};

// Service - Contains business logic
export class ExportService {
  async create(data: CreateExportRequest): Promise<Export> {
    // Validation
    // Database operations
    // Event emission
    return export;
  }
}

// Repository - Handles database operations
export class ExportRepository {
  async create(data: CreateExportRequest): Promise<Export> {
    const result = await pool.query(
      'INSERT INTO exports (...) VALUES (...) RETURNING *',
      [...]
    );
    return result.rows[0];
  }
}
```

---

## 13. Environment Configuration Best Practices

### ✅ DO: Use Environment Variables

```typescript
// .env.template
PORT=3001
NODE_ENV=development
LOG_LEVEL=debug
JWT_SECRET=your-secret-key-min-32-characters
DB_HOST=localhost
DB_PORT=5432
DB_NAME=coffee_export_db
```

### ✅ DO: Validate Environment on Startup

```typescript
import { envValidator } from '@shared/env.validator';

const config = envValidator.getConfig();

if (!config) {
  console.error('Failed to load environment configuration');
  process.exit(1);
}
```

---

## 14. Deployment Best Practices

### ✅ DO: Use Docker for Consistency

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

EXPOSE 3001

CMD ["node", "dist/src/index.js"]
```

### ✅ DO: Use Health Checks

```typescript
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});
```

---

## 15. Monitoring Best Practices

### ✅ DO: Implement Structured Logging

```typescript
logger.info('Export created', {
  exportId: export.id,
  exporterId: export.exporterId,
  status: export.status,
  timestamp: new Date().toISOString(),
  duration: Date.now() - startTime,
});
```

### ✅ DO: Track Metrics

```typescript
const metricsService = new MetricsService();

metricsService.recordCounter('exports_created', 1, {
  organization: req.user?.organizationId,
});

metricsService.recordHistogram('export_creation_duration', duration, {
  organization: req.user?.organizationId,
});
```

---

## Summary

| Category | Key Points |
|----------|-----------|
| **TypeScript** | Use specific types, avoid `any`, use interfaces |
| **Logging** | Use logger service, include context, appropriate levels |
| **Errors** | Use AppError class, meaningful messages, proper handling |
| **Middleware** | Use proper types, chain correctly, validate input |
| **Database** | Use connection pooling, transactions, parameterized queries |
| **API** | Consistent responses, include timestamps, proper status codes |
| **Validation** | Validate input, sanitize data, use schemas |
| **Security** | Authenticate, use HTTPS, rate limiting, helmet |
| **Testing** | Unit tests, error cases, integration tests |
| **Documentation** | Document endpoints, complex functions, examples |
| **Performance** | Use caching, pagination, indexes |
| **Organization** | Follow structure, separate concerns, clear naming |
| **Environment** | Use env variables, validate on startup |
| **Deployment** | Use Docker, health checks, monitoring |
| **Monitoring** | Structured logging, metrics, tracing |

---

**Last Updated**: 2024
**Version**: 1.0
