# 🔧 Export Routes Setup - All APIs

## ✅ Files Created

All export controller files have been created with **NO syntax errors**:

1. ✅ `/api/national-bank/src/controllers/export.controller.ts`
2. ✅ `/api/ncat/src/controllers/export.controller.ts`
3. ✅ `/api/custom-authorities/src/controllers/export.controller.ts`
4. ✅ `/api/shipping-line/src/controllers/export.controller.ts`
5. ✅ `/api/custom-authorities/src/routes/export.routes.ts` - Routes file created
6. ✅ `/api/custom-authorities/src/index.ts` - Routes registered

## 📋 What Still Needs to be Done

### For Each API (National Bank, ECTA, Shipping Line):

#### 1. Create Routes File

Create `/src/routes/export.routes.ts` for each:

**National Bank** (`/api/national-bank/src/routes/export.routes.ts`):
```typescript
import { Router } from 'express';
import { ExportController } from '../controllers/export.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const exportController = new ExportController();

router.get('/exports', authMiddleware, exportController.getAllExports);
router.get('/exports/:exportId', authMiddleware, exportController.getExport);
router.get('/exports/pending/fx', authMiddleware, exportController.getPendingFXApprovals);
router.post('/exports/:exportId/fx/approve', authMiddleware, exportController.approveFX);
router.post('/exports/:exportId/fx/reject', authMiddleware, exportController.rejectFX);
router.post('/exports/:exportId/fx/repatriate', authMiddleware, exportController.confirmFXRepatriation);

export default router;
```

**ECTA** (`/api/ncat/src/routes/export.routes.ts`):
```typescript
import { Router } from 'express';
import { ExportController } from '../controllers/export.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const exportController = new ExportController();

router.get('/exports', authMiddleware, exportController.getAllExports);
router.get('/exports/:exportId', authMiddleware, exportController.getExport);
router.get('/exports/pending/quality', authMiddleware, exportController.getPendingQualityInspections);
router.post('/exports/:exportId/quality/approve', authMiddleware, exportController.approveQuality);
router.post('/exports/:exportId/quality/reject', authMiddleware, exportController.rejectQuality);

export default router;
```

**Shipping Line** (`/api/shipping-line/src/routes/export.routes.ts`):
```typescript
import { Router } from 'express';
import { ExportController } from '../controllers/export.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const exportController = new ExportController();

router.get('/exports', authMiddleware, exportController.getAllExports);
router.get('/exports/:exportId', authMiddleware, exportController.getExport);
router.get('/exports/ready-for-shipment', authMiddleware, exportController.getReadyForShipment);
router.post('/exports/:exportId/shipment/schedule', authMiddleware, exportController.scheduleShipment);
router.post('/exports/:exportId/shipment/shipped', authMiddleware, exportController.markAsShipped);
router.post('/exports/:exportId/shipment/arrived', authMiddleware, exportController.markAsArrived);
router.post('/exports/:exportId/delivery/confirm', authMiddleware, exportController.confirmDelivery);

export default router;
```

#### 2. Register Routes in Main App

For each API, update `/src/index.ts`:

**Add import**:
```typescript
import exportRoutes from "./routes/export.routes";
```

**Register route** (add after other routes):
```typescript
app.use("/api", apiLimiter, exportRoutes);
```

## 🔍 Check Auth Middleware Export Name

Each API might export the auth middleware differently. Check the file:

```bash
# Check what's exported
grep "export" /home/gu-da/cbc/api/national-bank/src/middleware/auth.middleware.ts
```

Common exports:
- `export const authMiddleware` ✅ (Custom Authorities uses this)
- `export const authenticate`
- `export default authMiddleware`

**Adjust the import in routes file accordingly!**

## 🚀 Restart APIs After Changes

After creating routes and registering them:

```bash
# Stop all APIs
pkill -f "npm run dev"

# Start APIs (from start-system.sh or manually)
cd /home/gu-da/cbc/api/national-bank && npm run dev &
cd /home/gu-da/cbc/api/ncat && npm run dev &
cd /home/gu-da/cbc/api/shipping-line && npm run dev &
cd /home/gu-da/cbc/api/custom-authorities && npm run dev &
```

## ✅ Verification

Test each API's export endpoints:

```bash
# Login to get token
TOKEN=$(curl -s -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"bank_user","password":"Test123!@#"}' | jq -r '.data.token')

# Test National Bank
curl -H "Authorization: Bearer $TOKEN" http://localhost:3002/api/exports

# Test ECTA
curl -H "Authorization: Bearer $TOKEN" http://localhost:3003/api/exports

# Test Shipping Line
curl -H "Authorization: Bearer $TOKEN" http://localhost:3004/api/exports

# Test Custom Authorities
curl -H "Authorization: Bearer $TOKEN" http://localhost:3005/api/exports
```

## 📝 Summary

**Status**: 
- ✅ Controllers created (NO syntax errors)
- ✅ Custom Authorities routes created and registered
- ⏳ Need to create routes for: National Bank, ECTA, Shipping Line
- ⏳ Need to register routes in their index.ts files
- ⏳ Need to restart APIs

**No syntax errors exist** - just need to complete the route setup!
