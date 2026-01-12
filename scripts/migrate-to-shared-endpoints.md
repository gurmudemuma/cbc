# Migration Guide: Shared API Endpoints

## Overview
This guide helps you migrate existing frontend service files to use the new shared API endpoint constants.

## What Changed

### Before (Hardcoded Paths)
```javascript
// Old approach - hardcoded strings
apiClient.get('/exporter/profile')
apiClient.post('/exports', data)
apiClient.get(`/exports/${exportId}`)
```

### After (Shared Constants)
```javascript
// New approach - shared constants
import { EXPORTER_ENDPOINTS, EXPORT_ENDPOINTS } from '../config/api.endpoints';

apiClient.get(EXPORTER_ENDPOINTS.PROFILE)
apiClient.post(EXPORT_ENDPOINTS.EXPORT_SUBMIT, data)
apiClient.get(EXPORT_ENDPOINTS.EXPORT_DETAILS(exportId))
```

## Files Already Migrated

✅ `cbc/frontend/src/services/exporterService.js`
✅ `cbc/frontend/src/services/ectaPreRegistration.js`

## Files To Migrate

The following files still use hardcoded endpoint paths and should be updated:

### 1. monetaryService.js
**Location**: `cbc/frontend/src/services/monetaryService.js`

**Endpoints to replace**:
- `/fx/approvals` → `FX_ENDPOINTS.FX_APPROVALS`
- `/api/fx/approvals/${id}` → `FX_ENDPOINTS.FX_APPROVAL_DETAILS(id)`
- `/api/fx/approvals/${id}/approve` → `FX_ENDPOINTS.FX_APPROVE(id)`
- `/api/fx/approvals/${id}/reject` → `FX_ENDPOINTS.FX_REJECT(id)`
- `/fx/rates` → `FX_ENDPOINTS.FX_RATES`
- `/fx/statistics` → `FX_ENDPOINTS.FX_STATISTICS`
- `/monetary/policies` → `MONETARY_ENDPOINTS.POLICIES`
- `/api/monetary/policies/${id}` → `MONETARY_ENDPOINTS.POLICY_DETAILS(id)`
- `/api/monetary/policies/${id}/activate` → `MONETARY_ENDPOINTS.POLICY_ACTIVATE(id)`
- `/api/monetary/policies/${id}/deactivate` → `MONETARY_ENDPOINTS.POLICY_DEACTIVATE(id)`
- `/monetary/controls` → `MONETARY_ENDPOINTS.CONTROLS`
- `/api/monetary/controls/${id}` → `MONETARY_ENDPOINTS.CONTROL_DETAILS(id)`
- `/api/monetary/controls/${id}/enable` → `MONETARY_ENDPOINTS.CONTROL_ENABLE(id)`
- `/api/monetary/controls/${id}/disable` → `MONETARY_ENDPOINTS.CONTROL_DISABLE(id)`
- `/monetary/compliance` → `MONETARY_ENDPOINTS.COMPLIANCE`
- `/api/monetary/compliance/${id}` → `MONETARY_ENDPOINTS.COMPLIANCE_DETAILS(id)`
- `/monetary/compliance/run` → `MONETARY_ENDPOINTS.COMPLIANCE_RUN`
- `/monetary/compliance/statistics` → `MONETARY_ENDPOINTS.COMPLIANCE_STATISTICS`
- `/monetary/exports/transactions` → `MONETARY_ENDPOINTS.EXPORTS_TRANSACTIONS`
- `/monetary/exports/currency` → `MONETARY_ENDPOINTS.EXPORTS_CURRENCY`
- `/monetary/exports/reports` → `MONETARY_ENDPOINTS.EXPORTS_REPORTS`
- `/monetary/admin/settings` → `MONETARY_ENDPOINTS.ADMIN_SETTINGS`
- `/monetary/admin/audit` → `MONETARY_ENDPOINTS.ADMIN_AUDIT`
- `/monetary/statistics` → `MONETARY_ENDPOINTS.STATISTICS`

**Add import**:
```javascript
import { FX_ENDPOINTS, MONETARY_ENDPOINTS } from '../config/api.endpoints';
```

### 2. Other Service Files

Check these files for hardcoded endpoints:
- `cbc/frontend/src/services/bankingService.js`
- `cbc/frontend/src/services/customsService.js`
- `cbc/frontend/src/services/ectaService.js`
- `cbc/frontend/src/services/ecxService.js`
- `cbc/frontend/src/services/shippingService.js`
- `cbc/frontend/src/services/qualityService.js`
- `cbc/frontend/src/services/licenseService.js`
- `cbc/frontend/src/services/contractService.js`

## Step-by-Step Migration Process

### Step 1: Identify Hardcoded Endpoints
Search for patterns like:
```javascript
apiClient.get('/api/
apiClient.post('/api/
apiClient.put('/api/
apiClient.delete('/api/
```

### Step 2: Find Matching Constants
Look up the endpoint in `cbc/api/shared/api-endpoints.constants.ts`:
- Authentication → `AUTH_ENDPOINTS`
- Exporter → `EXPORTER_ENDPOINTS`
- Exports → `EXPORT_ENDPOINTS`
- Pre-registration → `PREREGISTRATION_ENDPOINTS`
- Quality → `QUALITY_ENDPOINTS`
- Licenses → `LICENSE_ENDPOINTS`
- Contracts → `CONTRACT_ENDPOINTS`
- FX → `FX_ENDPOINTS`
- Monetary → `MONETARY_ENDPOINTS`
- Customs → `CUSTOMS_ENDPOINTS`
- Lot Verification → `LOT_VERIFICATION_ENDPOINTS`
- Shipment → `SHIPMENT_ENDPOINTS`
- Users → `USER_ENDPOINTS`

### Step 3: Add Import Statement
At the top of the file, add:
```javascript
import { ENDPOINT_GROUP_1, ENDPOINT_GROUP_2 } from '../config/api.endpoints';
```

### Step 4: Replace Hardcoded Strings
Replace each hardcoded path with the corresponding constant:

**Static endpoints**:
```javascript
// Before
apiClient.get('/api/exports')

// After
apiClient.get(EXPORT_ENDPOINTS.EXPORTS)
```

**Dynamic endpoints with IDs**:
```javascript
// Before
apiClient.get(`/api/exports/${exportId}`)

// After
apiClient.get(EXPORT_ENDPOINTS.EXPORT_DETAILS(exportId))
```

### Step 5: Test
1. Check for TypeScript/linting errors
2. Test the API calls in development
3. Verify all endpoints still work correctly

## Common Patterns

### Pattern 1: List Endpoints
```javascript
// Before
apiClient.get('/api/exports')

// After
apiClient.get(EXPORT_ENDPOINTS.EXPORTS)
```

### Pattern 2: Detail Endpoints
```javascript
// Before
apiClient.get(`/api/exports/${id}`)

// After
apiClient.get(EXPORT_ENDPOINTS.EXPORT_DETAILS(id))
```

### Pattern 3: Action Endpoints
```javascript
// Before
apiClient.post(`/api/exports/${id}/approve`)

// After
apiClient.post(EXPORT_ENDPOINTS.EXPORT_APPROVE(id))
```

### Pattern 4: Nested Resources
```javascript
// Before
apiClient.get(`/api/exports/${id}/documents`)

// After
apiClient.get(EXPORT_ENDPOINTS.EXPORT_DOCUMENTS(id))
```

## Inconsistency Fixes

Some services had inconsistent paths (mixing `/api/` prefix). These are now standardized:

### Fixed: Monetary Service
```javascript
// Before (inconsistent)
apiClient.get('/fx/approvals')           // Missing /api/
apiClient.get('/api/fx/approvals/${id}') // Has /api/

// After (consistent)
apiClient.get(FX_ENDPOINTS.FX_APPROVALS)           // /api/fx/approvals
apiClient.get(FX_ENDPOINTS.FX_APPROVAL_DETAILS(id)) // /api/fx/approvals/${id}
```

## Adding New Endpoints

If you need an endpoint that doesn't exist in the constants:

1. **Add to shared constants** (`cbc/api/shared/api-endpoints.constants.ts`):
```typescript
export const YOUR_ENDPOINTS = {
  YOUR_ENDPOINT: '/api/your/path',
  YOUR_DETAIL: (id: string) => `/api/your/path/${id}`,
} as const;
```

2. **Export in frontend** (`cbc/frontend/src/config/api.endpoints.js`):
```javascript
import { YOUR_ENDPOINTS } from '../../../api/shared/api-endpoints.constants';
export { YOUR_ENDPOINTS };
```

3. **Use in service**:
```javascript
import { YOUR_ENDPOINTS } from '../config/api.endpoints';
apiClient.get(YOUR_ENDPOINTS.YOUR_ENDPOINT);
```

## Verification Checklist

After migration, verify:
- [ ] All imports are correct
- [ ] No hardcoded endpoint strings remain
- [ ] All API calls use constants
- [ ] Dynamic IDs use function-based endpoints
- [ ] No TypeScript/linting errors
- [ ] API calls work in development
- [ ] Tests pass (if applicable)

## Benefits of Migration

1. **Type Safety**: Autocomplete and type checking
2. **Consistency**: Same paths in frontend and backend
3. **Maintainability**: Update once, apply everywhere
4. **Error Prevention**: No more typos in paths
5. **Refactoring**: Easy to rename endpoints
6. **Documentation**: Self-documenting code

## Need Help?

- Check `cbc/docs/API_ENDPOINT_ARCHITECTURE.md` for detailed documentation
- Review migrated files: `exporterService.js`, `ectaPreRegistration.js`
- Look at `cbc/api/shared/api-endpoints.constants.ts` for all available constants
