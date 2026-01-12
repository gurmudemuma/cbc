# API Endpoint Architecture - Single Source of Truth

## Overview

This document describes the unified API endpoint architecture for the Coffee Blockchain Consortium (CBC). All API endpoints are now defined in a single source of truth to ensure consistency between frontend and backend.

## Architecture Principles

### 1. Single Source of Truth
All API endpoint paths are defined in:
```
cbc/api/shared/api-endpoints.constants.ts
```

Both frontend and backend reference this file to ensure:
- No endpoint path mismatches
- Consistent naming conventions
- Easy maintenance and updates
- Type safety (TypeScript)

### 2. Service Configuration
Each service has a standardized configuration including:
- **Service ID**: Unique identifier (e.g., 'exporter-portal')
- **Port**: Development port number
- **MSP ID**: Hyperledger Fabric MSP identifier (null for external entities)
- **Description**: Service purpose
- **Type**: 'consortium' or 'external'
- **Order**: Workflow sequence number

### 3. Environment-Based URL Resolution
The system automatically resolves URLs based on environment:

**Development** (localhost):
- Each service runs on its own port
- Example: `http://localhost:3004/api/exporter/profile`

**Staging**:
- API gateway with service-specific paths
- Example: `https://staging-api.coffeeexport.com/exporter-portal/api/exporter/profile`

**Production**:
- API gateway with service-specific paths
- Example: `https://api.coffeeexport.com/exporter-portal/api/exporter/profile`

## Service Ports

| Service | Port | Type | Description |
|---------|------|------|-------------|
| Commercial Bank | 3001 | Consortium | Document verification, FX submission |
| Custom Authorities | 3002 | Consortium | Export clearance |
| ECTA | 3003 | Consortium | Licensing, quality, contracts |
| Exporter Portal | 3004 | External | Exporter interface |
| National Bank | 3005 | Consortium | Foreign exchange approval |
| ECX | 3006 | Consortium | Lot verification |
| Shipping Line | 3007 | Consortium | Shipment management |

## Endpoint Categories

### Authentication (All Services)
```typescript
AUTH_ENDPOINTS = {
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  LOGOUT: '/api/auth/logout',
  REFRESH: '/api/auth/refresh',
  PROFILE: '/api/auth/profile',
}
```

### Exporter Management
```typescript
EXPORTER_ENDPOINTS = {
  PROFILE: '/api/exporter/profile',
  PROFILE_REGISTER: '/api/exporter/profile/register',
  APPLICATIONS: '/api/exporter/applications',
  SUPPORT_TICKETS: '/api/exporter/support/tickets',
  // ... more endpoints
}
```

### Export Workflow
```typescript
EXPORT_ENDPOINTS = {
  EXPORTS: '/api/exports',
  EXPORT_DETAILS: (id) => `/api/exports/${id}`,
  EXPORT_STATISTICS: '/api/exports/statistics',
  // ... more endpoints
}
```

### Pre-Registration (ECTA)
```typescript
PREREGISTRATION_ENDPOINTS = {
  EXPORTERS: '/api/preregistration/exporters',
  EXPORTERS_PENDING: '/api/preregistration/exporters/pending',
  EXPORTER_APPROVE: (id) => `/api/preregistration/exporters/${id}/approve`,
  // ... more endpoints
}
```

### Foreign Exchange (National Bank)
```typescript
FX_ENDPOINTS = {
  FX_APPROVALS: '/api/fx/approvals',
  FX_PENDING: '/api/fx/pending',
  FX_RATES: '/api/fx/rates',
  // ... more endpoints
}
```

## Usage Examples

### Frontend Service Files

```javascript
// Import shared endpoint constants
import { EXPORTER_ENDPOINTS, EXPORT_ENDPOINTS } from '../config/api.endpoints';

// Use constants instead of hardcoded strings
const getProfile = async () => {
  const response = await apiClient.get(EXPORTER_ENDPOINTS.PROFILE);
  return response.data;
};

const getExportDetails = async (exportId) => {
  const response = await apiClient.get(EXPORT_ENDPOINTS.EXPORT_DETAILS(exportId));
  return response.data;
};
```

### Backend Route Files

```typescript
// Import shared endpoint constants
import { EXPORTER_ENDPOINTS } from '@shared/api-endpoints.constants';

// Use constants for route definitions
router.get(EXPORTER_ENDPOINTS.PROFILE, controller.getProfile);
router.post(EXPORTER_ENDPOINTS.PROFILE_REGISTER, controller.registerProfile);
```

## Migration Guide

### For Frontend Developers

1. **Import endpoint constants**:
   ```javascript
   import { EXPORTER_ENDPOINTS, EXPORT_ENDPOINTS } from '../config/api.endpoints';
   ```

2. **Replace hardcoded paths**:
   ```javascript
   // Before
   apiClient.get('/exporter/profile')
   
   // After
   apiClient.get(EXPORTER_ENDPOINTS.PROFILE)
   ```

3. **Use function-based endpoints for dynamic IDs**:
   ```javascript
   // Before
   apiClient.get(`/exports/${exportId}`)
   
   // After
   apiClient.get(EXPORT_ENDPOINTS.EXPORT_DETAILS(exportId))
   ```

### For Backend Developers

1. **Import shared constants**:
   ```typescript
   import { EXPORTER_ENDPOINTS } from '@shared/api-endpoints.constants';
   ```

2. **Use constants in route definitions**:
   ```typescript
   // Before
   router.get('/api/exporter/profile', controller.getProfile);
   
   // After
   router.get(EXPORTER_ENDPOINTS.PROFILE, controller.getProfile);
   ```

## Environment Variables

### Frontend (.env files)

```bash
# Development
VITE_API_EXPORTER_PORTAL=http://localhost:3004
VITE_API_COMMERCIAL_BANK=http://localhost:3001
VITE_API_ECTA=http://localhost:3003
# ... other services

# Production
VITE_API_BASE_URL=https://api.coffeeexport.com
VITE_ENV=production

# Staging
VITE_API_BASE_URL=https://staging-api.coffeeexport.com
VITE_ENV=staging
```

### Backend (.env files)

Each service has its own .env file with:
```bash
PORT=3004
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

# External API endpoints for inter-service communication
COMMERCIAL_BANK_API=http://localhost:3001
ECTA_API=http://localhost:3003
# ... other services
```

## Benefits

1. **Consistency**: Frontend and backend always use the same endpoint paths
2. **Type Safety**: TypeScript provides autocomplete and type checking
3. **Maintainability**: Update endpoints in one place
4. **Refactoring**: Easy to rename or restructure endpoints
5. **Documentation**: Self-documenting code with clear endpoint definitions
6. **Testing**: Easier to mock and test with constants
7. **Error Prevention**: Eliminates typos in endpoint paths

## File Structure

```
cbc/
├── api/
│   └── shared/
│       └── api-endpoints.constants.ts    # Single source of truth
└── frontend/
    └── src/
        ├── config/
        │   ├── api.config.js              # Service URLs and configuration
        │   └── api.endpoints.js           # Re-exports shared constants
        └── services/
            ├── exporterService.js         # Uses shared constants
            ├── ectaPreRegistration.js     # Uses shared constants
            └── monetaryService.js         # Uses shared constants
```

## Adding New Endpoints

1. **Add to shared constants** (`cbc/api/shared/api-endpoints.constants.ts`):
   ```typescript
   export const NEW_FEATURE_ENDPOINTS = {
     FEATURE_LIST: '/api/feature',
     FEATURE_DETAILS: (id: string) => `/api/feature/${id}`,
   } as const;
   ```

2. **Export in frontend** (`cbc/frontend/src/config/api.endpoints.js`):
   ```javascript
   import { NEW_FEATURE_ENDPOINTS } from '../../../api/shared/api-endpoints.constants';
   export { NEW_FEATURE_ENDPOINTS };
   ```

3. **Use in services**:
   ```javascript
   import { NEW_FEATURE_ENDPOINTS } from '../config/api.endpoints';
   apiClient.get(NEW_FEATURE_ENDPOINTS.FEATURE_LIST);
   ```

## Best Practices

1. **Always use constants**: Never hardcode endpoint paths
2. **Use function-based endpoints**: For dynamic parameters (IDs, etc.)
3. **Keep paths consistent**: All services use `/api` prefix
4. **Document new endpoints**: Add comments explaining purpose
5. **Update both frontend and backend**: When adding new endpoints
6. **Test thoroughly**: Verify endpoints work in all environments

## Troubleshooting

### Endpoint Not Found (404)
- Check that the endpoint constant matches the backend route definition
- Verify the service is running on the correct port
- Check CORS configuration allows the request

### Import Errors
- Ensure the shared constants file is accessible from frontend
- Check TypeScript/JavaScript module resolution
- Verify file paths in import statements

### Environment-Specific Issues
- Check environment variables are set correctly
- Verify API gateway routing in production/staging
- Test with correct VITE_ENV value

## Related Documentation

- [Codebase Organization](../CODEBASE_ORGANIZATION.md)
- [API Service Architecture](./API_SERVICE_ARCHITECTURE.md)
- [Environment Configuration](./ENVIRONMENT_CONFIGURATION.md)
