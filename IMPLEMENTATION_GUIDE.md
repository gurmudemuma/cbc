# Export Management System - Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing the recommended enhancements to the Coffee Export Management System.

---

## Table of Contents

1. [Testing Implementation](#1-testing-implementation)
2. [Monitoring & Alerting](#2-monitoring--alerting)
3. [Audit Logging](#3-audit-logging)
4. [Notification System](#4-notification-system)
5. [Caching & Performance](#5-caching--performance)
6. [Search & Pagination](#6-search--pagination)
7. [API Documentation](#7-api-documentation)
8. [Integration Steps](#8-integration-steps)

---

## 1. Testing Implementation

### Unit Tests

**Location:** `api/shared/__tests__/exportService.test.ts`

**Run tests:**
```bash
cd api
npm test
```

**Coverage report:**
```bash
npm run test:coverage
```

**What's tested:**
- ✅ Export creation with valid/invalid data
- ✅ Export retrieval by ID
- ✅ Status filtering
- ✅ FX approval/rejection
- ✅ Quality certification
- ✅ Payment confirmation
- ✅ Error handling

### Integration Tests

**Location:** `api/commercialbank/__tests__/export.integration.test.ts`

**What's tested:**
- ✅ Full API endpoint flows
- ✅ Request validation
- ✅ Error responses
- ✅ Authentication

### E2E Tests (Recommended)

**Setup with Playwright:**
```bash
npm install -D @playwright/test
npx playwright install
```

**Example E2E test structure:**
```typescript
// tests/e2e/export-workflow.spec.ts
test('complete export workflow', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('[name="username"]', 'testuser');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');
  
  // Create export
  await page.click('text=Create Export');
  await page.fill('[name="exporterName"]', 'Test Company');
  // ... fill other fields
  await page.click('text=Submit');
  
  // Verify creation
  await expect(page.locator('.success-message')).toBeVisible();
});
```

---

## 2. Monitoring & Alerting

### Setup

**Service:** `api/shared/monitoring.service.ts`

**Features:**
- ✅ API response time tracking
- ✅ Blockchain transaction monitoring
- ✅ SLA compliance checking
- ✅ System health monitoring
- ✅ Alert generation

### Integration

**Add to your controller:**
```typescript
import { monitoringService } from '../shared/monitoring.service';

// Track API response time
const startTime = Date.now();
// ... your code
monitoringService.trackAPIResponseTime(endpoint, Date.now() - startTime);

// Track blockchain transaction
monitoringService.trackBlockchainTransaction('createExport', duration, success);

// Check SLA compliance
monitoringService.checkSLACompliance(
  exportId,
  'fxApproval',
  startTime,
  endTime
);
```

### Configure SLA Thresholds

**Edit:** `api/shared/monitoring.service.ts`

```typescript
private slaConfig: SLAConfig = {
  fxApproval: 24,        // hours
  bankingApproval: 48,
  qualityApproval: 72,
  customsClearance: 48,
  totalProcessing: 240,
};
```

### View Metrics

```typescript
// Get metrics summary
const summary = monitoringService.getMetricsSummary(
  MetricType.API_RESPONSE_TIME,
  startDate,
  endDate
);

// Get recent alerts
const alerts = monitoringService.getRecentAlerts(100);
```

### Alert Integration

**Add to production (in `monitoring.service.ts`):**

```typescript
// Email alerts
import nodemailer from 'nodemailer';

private async sendEmailAlert(alert: Alert) {
  const transporter = nodemailer.createTransport({...});
  await transporter.sendMail({
    to: process.env.ALERT_EMAIL,
    subject: `[${alert.level}] ${alert.title}`,
    text: alert.message,
  });
}

// Slack alerts
import axios from 'axios';

private async sendSlackAlert(alert: Alert) {
  await axios.post(process.env.SLACK_WEBHOOK_URL, {
    text: `*${alert.title}*\n${alert.message}`,
    color: alert.level === 'critical' ? 'danger' : 'warning',
  });
}
```

---

## 3. Audit Logging

### Setup

**Service:** `api/shared/audit.service.ts`

**Features:**
- ✅ All state changes logged
- ✅ User action tracking
- ✅ Security event logging
- ✅ 90-day retention for audit logs
- ✅ 365-day retention for security logs

### Integration

**Add to controllers:**
```typescript
import { auditService, AuditAction } from '../shared/audit.service';

// Log export creation
auditService.logExportCreation(
  userId,
  exportId,
  exportData,
  { ipAddress: req.ip, userAgent: req.get('user-agent') }
);

// Log status change
auditService.logStatusChange(
  userId,
  exportId,
  oldStatus,
  newStatus,
  AuditAction.FX_APPROVED,
  { ipAddress: req.ip, reason: 'Approved by officer' }
);

// Log authentication
auditService.logAuthentication(
  userId,
  username,
  success,
  { ipAddress: req.ip, errorMessage: error?.message }
);
```

### Query Audit Logs

```typescript
// Query logs for compliance
const logs = await auditService.queryLogs({
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  userId: 'user123',
  action: AuditAction.FX_APPROVED,
});

// Generate compliance report
const report = await auditService.generateComplianceReport(
  new Date('2024-01-01'),
  new Date('2024-12-31')
);
```

### Log Storage

**Logs are stored in:**
- `logs/audit/audit-YYYY-MM-DD.log` - All audit events
- `logs/audit/security-YYYY-MM-DD.log` - Security events only

**For production, integrate with:**
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Splunk
- AWS CloudWatch
- Azure Monitor

---

## 4. Notification System

### Setup

**Service:** `api/shared/notification.service.ts`

**Channels:**
- ✅ Email
- ✅ SMS (Twilio integration ready)
- ✅ WebSocket (real-time)
- ✅ In-app notifications

### Email Configuration

**Add to `.env`:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@coffeeexport.com
FRONTEND_URL=http://localhost:5173
```

### WebSocket Setup

**In your server:**
```typescript
import { Server } from 'socket.io';
import { notificationService } from './shared/notification.service';

const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL }
});

// Set Socket.IO instance
notificationService.setSocketIO(io);

// Handle connections
io.on('connection', (socket) => {
  socket.on('authenticate', (userId) => {
    socket.join(`user:${userId}`);
  });
});
```

### Send Notifications

```typescript
// Status change notification
await notificationService.notifyStatusChange(
  exportId,
  oldStatus,
  newStatus,
  recipientId,
  recipientEmail
);

// FX decision notification
await notificationService.notifyFXDecision(
  exportId,
  approved,
  recipientId,
  recipientEmail,
  reason
);

// Action required notification
await notificationService.notifyActionRequired(
  exportId,
  'Please upload quality certificate',
  recipientId,
  recipientEmail
);

// SLA warning
await notificationService.notifySLAWarning(
  exportId,
  'FX Approval',
  4, // hours remaining
  recipientId,
  recipientEmail
);
```

### Frontend Integration

**React example:**
```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

// Authenticate
socket.emit('authenticate', userId);

// Listen for notifications
socket.on('notification', (notification) => {
  // Show toast/alert
  toast.info(notification.message);
  
  // Update notification center
  setNotifications(prev => [notification, ...prev]);
});
```

---

## 5. Caching & Performance

### Redis Setup

**Install Redis:**
```bash
# Ubuntu/Debian
sudo apt-get install redis-server

# macOS
brew install redis

# Start Redis
redis-server
```

**Configure in `.env`:**
```env
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
```

### Initialize Cache

**In your app startup:**
```typescript
import { CacheService } from './shared/cache.service';

const cacheService = CacheService.getInstance();
await cacheService.connect();
```

### Use Caching

**Service already exists:** `api/shared/cache.service.ts`

**Example usage:**
```typescript
import { CacheService, CacheKeys, CacheTTL } from './shared/cache.service';

const cache = CacheService.getInstance();

// Get or set pattern
const exports = await cache.getOrSet(
  CacheKeys.allExports(),
  async () => {
    // Fetch from blockchain
    return await exportService.getAllExports();
  },
  CacheTTL.MEDIUM // 5 minutes
);

// Invalidate cache on updates
await cache.delete(CacheKeys.export(exportId));
await cache.deletePattern('exports:*');
```

### Cache Strategy

**What to cache:**
- ✅ Export lists (5 min TTL)
- ✅ Individual exports (5 min TTL)
- ✅ Search results (5 min TTL)
- ✅ User profiles (15 min TTL)
- ✅ Statistics (15 min TTL)

**When to invalidate:**
- ❌ On any export creation/update
- ❌ On status changes
- ❌ On document uploads

---

## 6. Search & Pagination

### Setup

**Service:** `api/shared/search.service.ts`

**Features:**
- ✅ Full-text search
- ✅ Multiple filters (status, date, value, country)
- ✅ Sorting
- ✅ Pagination
- ✅ Faceted search
- ✅ CSV export

### Use Search Service

```typescript
import { searchService, SearchCriteria } from './shared/search.service';

// Build criteria from query params
const criteria = searchService.buildCriteriaFromParams(req.query);

// Search exports
const result = searchService.searchExports(allExports, criteria);

// Response includes:
// - result.data: paginated exports
// - result.pagination: page info
// - result.filters: applied filters
// - result.executionTime: search duration

// Get facets for filter UI
const facets = searchService.getFacets(allExports);
// Returns: { statuses, countries, qualityGrades, valueRanges }
```

### API Endpoint Example

```typescript
GET /api/exports?page=1&limit=20&status=FX_PENDING&search=coffee&minValue=10000
```

### Frontend Integration

**React example:**
```typescript
const [exports, setExports] = useState([]);
const [pagination, setPagination] = useState({});
const [filters, setFilters] = useState({
  page: 1,
  limit: 20,
  status: '',
  search: '',
});

const fetchExports = async () => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`/api/exports?${params}`);
  const data = await response.json();
  
  setExports(data.data);
  setPagination(data.pagination);
};

// Pagination controls
<Pagination
  page={pagination.page}
  totalPages={pagination.totalPages}
  onPageChange={(page) => setFilters({...filters, page})}
/>
```

---

## 7. API Documentation

### Setup Swagger

**Install dependencies:**
```bash
npm install swagger-ui-express swagger-jsdoc
```

**Configuration:** `api/shared/swagger.config.ts` (already created)

### Integrate with Express

**Add to your server:**
```typescript
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { swaggerOptions } from './shared/swagger.config';

const specs = swaggerJsdoc(swaggerOptions);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
```

### Access Documentation

**Open in browser:**
```
http://localhost:3001/api-docs
```

### Add JSDoc Comments

**Example:**
```typescript
/**
 * @swagger
 * /api/exports:
 *   get:
 *     summary: Get all exports
 *     tags: [Exports]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
public getAllExports = async (req, res) => {
  // ...
};
```

---

## 8. Integration Steps

### Step 1: Update Package Scripts

**Edit `api/package.json`:**
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:integration": "jest --testPathPattern=integration",
    "test:unit": "jest --testPathPattern=__tests__"
  }
}
```

### Step 2: Add Middleware

**Create `api/shared/middleware/index.ts`:**
```typescript
export { monitoringMiddleware, errorMonitoringMiddleware } from './monitoring.middleware';
```

**Update your Express app:**
```typescript
import { monitoringMiddleware, errorMonitoringMiddleware } from './shared/middleware';

// Add monitoring middleware
app.use(monitoringMiddleware);

// ... your routes

// Add error monitoring (must be last)
app.use(errorMonitoringMiddleware);
```

### Step 3: Update Controllers

**Replace existing controllers with enhanced versions:**

```typescript
// Before
import { ExportController } from './controllers/export.controller';

// After
import { EnhancedExportController } from '../shared/controllers/enhanced-export.controller';

const controller = new EnhancedExportController();
```

### Step 4: Initialize Services

**Add to app startup:**
```typescript
import { CacheService } from './shared/cache.service';
import { monitoringService } from './shared/monitoring.service';
import { notificationService } from './shared/notification.service';

// Initialize cache
const cache = CacheService.getInstance();
await cache.connect();

// Set Socket.IO for notifications
notificationService.setSocketIO(io);

// Start monitoring
monitoringService.recordSystemHealth('blockchain', true);
```

### Step 5: Environment Variables

**Add to `.env`:**
```env
# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@coffeeexport.com

# Frontend
FRONTEND_URL=http://localhost:5173

# Monitoring
ALERT_EMAIL=alerts@coffeeexport.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### Step 6: Run Tests

```bash
cd api
npm test
npm run test:coverage
```

**Expected output:**
```
PASS  shared/__tests__/exportService.test.ts
  ✓ should create export with valid data
  ✓ should retrieve export by ID
  ✓ should filter exports by status
  ...

Test Suites: 1 passed, 1 total
Tests:       15 passed, 15 total
Coverage:    75% statements, 70% branches
```

---

## Deployment Checklist

### Pre-Production

- [ ] All tests passing (>70% coverage)
- [ ] Redis configured and running
- [ ] Email SMTP configured
- [ ] Environment variables set
- [ ] Swagger documentation accessible
- [ ] Monitoring alerts configured
- [ ] Audit logs directory created
- [ ] WebSocket connections tested

### Production

- [ ] Use production Redis instance
- [ ] Configure log rotation
- [ ] Set up ELK/Splunk for log aggregation
- [ ] Configure PagerDuty/Slack alerts
- [ ] Enable HTTPS for all endpoints
- [ ] Set appropriate cache TTLs
- [ ] Configure backup for audit logs
- [ ] Monitor system health dashboard

---

## Monitoring Dashboard

### Recommended Metrics to Track

1. **Performance**
   - API response time (p50, p95, p99)
   - Blockchain query time
   - Cache hit rate

2. **Business**
   - Exports created per day
   - Approval rate by stage
   - Average processing time
   - SLA violations

3. **System Health**
   - Blockchain connection status
   - Redis connection status
   - Error rate
   - Alert count

### Tools

- **Grafana** - Visualization
- **Prometheus** - Metrics collection
- **ELK Stack** - Log aggregation
- **PagerDuty** - Incident management

---

## Support & Troubleshooting

### Common Issues

**1. Redis connection failed**
```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG

# Start Redis if not running
redis-server
```

**2. Tests failing**
```bash
# Clear Jest cache
npm test -- --clearCache

# Run with verbose output
npm test -- --verbose
```

**3. Email not sending**
- Check SMTP credentials
- Verify firewall allows SMTP port
- Test with nodemailer test account

**4. High cache memory usage**
- Reduce TTL values
- Implement cache size limits
- Monitor with `redis-cli info memory`

---

## Next Steps

1. ✅ Run all tests
2. ✅ Configure Redis
3. ✅ Set up email notifications
4. ✅ Enable monitoring
5. ✅ Deploy to staging
6. ✅ Load testing
7. ✅ Production deployment

---

**Version:** 1.0  
**Last Updated:** October 25, 2025  
**Status:** Ready for Implementation
