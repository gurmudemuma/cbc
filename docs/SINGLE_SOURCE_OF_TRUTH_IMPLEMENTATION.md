# Single Source of Truth Implementation

## Summary

The Coffee Blockchain Consortium (CBC) codebase has been updated to use a **single source of truth** for all API endpoints. This ensures frontend and backend always use identical endpoint paths, eliminating inconsistencies and reducing errors.

## What Was Implemented

### 1. Shared API Constants File
**Location**: `cbc/api/shared/api-endpoints.constants.ts`

This TypeScript file defines:
- All API endpoint paths (e.g., `/api/exports`, `/api/exporter/profile`)
- Service configurations (ports, MSP IDs, descriptions)
- Helper functions for URL building
- Type definitions for type safety

**Key Features**:
- Centralized endpoint definitions
- Function-based endpoints for dynamic IDs
- TypeScript types for autocomplete
- Environment-aware URL resolution

### 2. Frontend Configuration Updates

#### api.config.js
**Location**: `cbc/frontend/src/config/api.config.js`

**Changes**:
- Now imports service configurations from shared constants
- Automatically builds service URLs based on environment
- Supports development (localhost), staging, and production
- Uses environment variables with smart fallbacks

#### api.endpoints.js (NEW)
**Location**: `cbc/frontend/src/config/api.endpoints.js`

**Purpose**:
- Re-exports all endpoint constants from shared file
- Provides convenient access for frontend services
- Maintains single source of truth

### 3. Frontend Service Updates

#### Migrated Services:
1. **exporterService.js** ✅
   - Uses `EXPORTER_ENDPOINTS` and `EXPORT_ENDPOINTS`
   - All hardcoded paths replaced with constants

2. **ectaPreRegistration.js** ✅
   - Uses `EXPORTER_ENDPOINTS` and `PREREGISTRATION_ENDPOINTS`
   - All hardcoded paths replaced with constants

#### Pending Migration:
- monetaryService.js
- bankingService.js
- customsService.js
- ectaService.js
- ecxService.js
- shippingService.js
- qualityService.js
- licenseService.js
- contractService.js

See `cbc/scripts/migrate-to-shared-endpoints.md` for migration guide.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                  Single Source of Truth                      │
│         cbc/api/shared/api-endpoints.constants.ts           │
│                                                              │
│  - All endpoint paths defined here                          │
│  - Service configurations                                   │
│  - Type definitions                                         │
└──────────────────┬──────────────────────────────────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
         ▼                   ▼
┌────────────────┐   ┌────────────────┐
│   Frontend     │   │    Backend     │
│                │   │                │
│ api.config.js  │   │ Route files    │
│ api.endpoints  │   │ import from    │
│ Service files  │   │ @shared/...    │
└────────────────┘   └────────────────┘
```

## Endpoint Categories

### 1. Authentication (All Services)
- Login, register, logout, refresh, profile

### 2. Exporter Management
- Profile, applications, support tickets

### 3. Export Workflow
- Create, update, track exports
- Document management
- Status queries

### 4. Pre-Registration (ECTA)
- Exporter approval
- Laboratory registration
- Taster registration
- Competence certificates
- Export licenses

### 5. Quality Management (ECTA)
- Quality checks and approvals

### 6. License Management (ECTA)
- License applications and renewals

### 7. Contract Management (ECTA)
- Contract verification and approval

### 8. Foreign Exchange (National Bank)
- FX approvals and rates

### 9. Monetary Policy (National Bank)
- Policy management
- Exchange controls
- Compliance monitoring

### 10. Customs (Custom Authorities)
- Customs clearance

### 11. Lot Verification (ECX)
- Coffee lot verification

### 12. Shipment (Shipping Line)
- Shipment scheduling and tracking

### 13. User Management
- User CRUD operations

## Service Configuration

| Service | Port | Type | MSP ID |
|---------|------|------|--------|
| Commercial Bank | 3001 | Consortium | CommercialBankMSP |
| Custom Authorities | 3002 | Consortium | CustomAuthoritiesMSP |
| ECTA | 3003 | Consortium | ECTAMSP |
| Exporter Portal | 3004 | External | null |
| National Bank | 3005 | Consortium | NationalBankMSP |
| ECX | 3006 | Consortium | ECXMSP |
| Shipping Line | 3007 | Consortium | ShippingLineMSP |

## Environment Resolution

### Development
```
http://localhost:3004/api/exporter/profile
```
Each service runs on its own port.

### Staging
```
https://staging-api.coffeeexport.com/exporter-portal/api/exporter/profile
```
API gateway routes to services by path prefix.

### Production
```
https://api.coffeeexport.com/exporter-portal/api/exporter/profile
```
API gateway routes to services by path prefix.

## Usage Examples

### Frontend Service
```javascript
import { EXPORTER_ENDPOINTS, EXPORT_ENDPOINTS } from '../config/api.endpoints';

// Get profile
const profile = await apiClient.get(EXPORTER_ENDPOINTS.PROFILE);

// Get export details
const exportData = await apiClient.get(EXPORT_ENDPOINTS.EXPORT_DETAILS(exportId));

// Create export
const newExport = await apiClient.post(EXPORT_ENDPOINTS.EXPORT_SUBMIT, data);
```

### Backend Route
```typescript
import { EXPORTER_ENDPOINTS } from '@shared/api-endpoints.constants';

router.get(EXPORTER_ENDPOINTS.PROFILE, controller.getProfile);
router.post(EXPORTER_ENDPOINTS.PROFILE_REGISTER, controller.registerProfile);
```

## Benefits

### 1. Consistency
- Frontend and backend always use identical paths
- No more path mismatches between services

### 2. Type Safety
- TypeScript provides autocomplete
- Compile-time error checking
- IDE support for refactoring

### 3. Maintainability
- Update endpoint in one place
- Changes propagate automatically
- Easy to find all usages

### 4. Error Prevention
- No typos in endpoint paths
- Function-based endpoints ensure correct parameter usage
- Linting catches missing imports

### 5. Documentation
- Self-documenting code
- Clear endpoint organization
- Easy to understand API structure

### 6. Testing
- Easy to mock endpoints
- Consistent test setup
- Reduced test maintenance

## Issues Fixed

### 1. Inconsistent API Prefixes
**Before**: Some endpoints had `/api/`, others didn't
```javascript
apiClient.get('/fx/approvals')           // Missing /api/
apiClient.get('/api/fx/approvals/${id}') // Has /api/
```

**After**: All endpoints consistently use `/api/` prefix
```javascript
apiClient.get(FX_ENDPOINTS.FX_APPROVALS)           // /api/fx/approvals
apiClient.get(FX_ENDPOINTS.FX_APPROVAL_DETAILS(id)) // /api/fx/approvals/${id}
```

### 2. Port Number Discrepancies
**Before**: Comments and code had different port numbers

**After**: Single source of truth in `SERVICES` configuration

### 3. Hardcoded Strings
**Before**: Endpoint paths scattered across 20+ files

**After**: All paths defined in one file

### 4. Environment Variable Naming
**Before**: Inconsistent naming between frontend and backend

**After**: Standardized naming convention

## Migration Status

### Completed ✅
- [x] Create shared constants file
- [x] Update frontend API configuration
- [x] Create frontend endpoints re-export file
- [x] Migrate exporterService.js
- [x] Migrate ectaPreRegistration.js
- [x] Create documentation
- [x] Create migration guide

### Pending 🔄
- [ ] Migrate monetaryService.js
- [ ] Migrate remaining frontend services
- [ ] Update backend route files to use constants
- [ ] Add validation tests
- [ ] Update API documentation

### Future Enhancements 🚀
- [ ] Generate OpenAPI/Swagger specs from constants
- [ ] Add runtime endpoint validation
- [ ] Create endpoint usage analytics
- [ ] Implement service discovery
- [ ] Add API versioning support

## Files Created/Modified

### Created
1. `cbc/api/shared/api-endpoints.constants.ts` - Single source of truth
2. `cbc/frontend/src/config/api.endpoints.js` - Frontend re-exports
3. `cbc/docs/API_ENDPOINT_ARCHITECTURE.md` - Architecture documentation
4. `cbc/docs/SINGLE_SOURCE_OF_TRUTH_IMPLEMENTATION.md` - This file
5. `cbc/scripts/migrate-to-shared-endpoints.md` - Migration guide

### Modified
1. `cbc/frontend/src/config/api.config.js` - Uses shared constants
2. `cbc/frontend/src/services/exporterService.js` - Uses shared constants
3. `cbc/frontend/src/services/ectaPreRegistration.js` - Uses shared constants

## Next Steps

1. **Complete Frontend Migration**
   - Migrate remaining service files
   - Follow migration guide in `cbc/scripts/migrate-to-shared-endpoints.md`

2. **Update Backend Routes**
   - Import constants in route files
   - Replace hardcoded paths

3. **Add Tests**
   - Validate endpoint consistency
   - Test URL resolution in all environments

4. **Update Documentation**
   - Generate API documentation from constants
   - Update developer onboarding guides

5. **Monitor and Validate**
   - Check for any missed endpoints
   - Verify all services work correctly

## Related Documentation

- [API Endpoint Architecture](./API_ENDPOINT_ARCHITECTURE.md)
- [Migration Guide](../scripts/migrate-to-shared-endpoints.md)
- [Codebase Organization](../CODEBASE_ORGANIZATION.md)

## Questions?

For questions or issues:
1. Check the documentation files listed above
2. Review the shared constants file for available endpoints
3. Look at migrated service files for examples
4. Refer to the migration guide for step-by-step instructions
