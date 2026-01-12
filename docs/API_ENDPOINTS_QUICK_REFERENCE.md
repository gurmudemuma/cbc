# API Endpoints Quick Reference

## Quick Start

### Frontend Usage
```javascript
// 1. Import endpoint constants
import { EXPORTER_ENDPOINTS, EXPORT_ENDPOINTS } from '../config/api.endpoints';

// 2. Use in API calls
apiClient.get(EXPORTER_ENDPOINTS.PROFILE)
apiClient.get(EXPORT_ENDPOINTS.EXPORT_DETAILS(exportId))
```

### Backend Usage
```typescript
// 1. Import from shared constants
import { EXPORTER_ENDPOINTS } from '@shared/api-endpoints.constants';

// 2. Use in routes
router.get(EXPORTER_ENDPOINTS.PROFILE, controller.getProfile);
```

## Service Ports (Development)

| Service | Port | URL |
|---------|------|-----|
| Commercial Bank | 3001 | http://localhost:3001 |
| Custom Authorities | 3002 | http://localhost:3002 |
| ECTA | 3003 | http://localhost:3003 |
| Exporter Portal | 3004 | http://localhost:3004 |
| National Bank | 3005 | http://localhost:3005 |
| ECX | 3006 | http://localhost:3006 |
| Shipping Line | 3007 | http://localhost:3007 |

## Common Endpoints

### Authentication (All Services)
```javascript
AUTH_ENDPOINTS.LOGIN              // POST /api/auth/login
AUTH_ENDPOINTS.REGISTER           // POST /api/auth/register
AUTH_ENDPOINTS.LOGOUT             // POST /api/auth/logout
AUTH_ENDPOINTS.REFRESH            // POST /api/auth/refresh
AUTH_ENDPOINTS.PROFILE            // GET /api/auth/profile
```

### Exporter Management
```javascript
EXPORTER_ENDPOINTS.PROFILE                    // GET/PUT /api/exporter/profile
EXPORTER_ENDPOINTS.PROFILE_REGISTER           // POST /api/exporter/profile/register
EXPORTER_ENDPOINTS.PROFILE_VERIFICATION       // GET /api/exporter/profile/verification
EXPORTER_ENDPOINTS.APPLICATIONS               // GET /api/exporter/applications
EXPORTER_ENDPOINTS.APPLICATION_DETAILS(id)    // GET /api/exporter/applications/:id
EXPORTER_ENDPOINTS.APPLICATION_SUBMIT(type)   // POST /api/exporter/applications/:type
EXPORTER_ENDPOINTS.SUPPORT_TICKETS            // GET/POST /api/exporter/support/tickets
EXPORTER_ENDPOINTS.SUPPORT_FAQ                // GET /api/exporter/support/faq
```

### Export Workflow
```javascript
EXPORT_ENDPOINTS.EXPORTS                      // GET/POST /api/exports
EXPORT_ENDPOINTS.EXPORT_DETAILS(id)           // GET /api/exports/:id
EXPORT_ENDPOINTS.EXPORT_UPDATE(id)            // PUT /api/exports/:id
EXPORT_ENDPOINTS.EXPORT_STATISTICS            // GET /api/exports/statistics
EXPORT_ENDPOINTS.EXPORT_DOCUMENTS(id)         // GET /api/exports/:id/documents
EXPORT_ENDPOINTS.EXPORT_DOCUMENT_VERIFY(id)   // POST /api/exports/:id/documents/verify
EXPORT_ENDPOINTS.EXPORTS_PENDING              // GET /api/exports/pending
EXPORT_ENDPOINTS.EXPORTS_READY_FOR_SHIPMENT   // GET /api/exports/ready-for-shipment
```

### Pre-Registration (ECTA)
```javascript
// Exporters
PREREGISTRATION_ENDPOINTS.EXPORTERS                    // GET /api/preregistration/exporters
PREREGISTRATION_ENDPOINTS.EXPORTERS_PENDING            // GET /api/preregistration/exporters/pending
PREREGISTRATION_ENDPOINTS.EXPORTER_APPROVE(id)         // POST /api/preregistration/exporters/:id/approve
PREREGISTRATION_ENDPOINTS.EXPORTER_REJECT(id)          // POST /api/preregistration/exporters/:id/reject
PREREGISTRATION_ENDPOINTS.EXPORTER_VALIDATE(id)        // GET /api/preregistration/exporters/:id/validate

// Laboratories
PREREGISTRATION_ENDPOINTS.LABORATORIES                 // GET /api/preregistration/laboratories
PREREGISTRATION_ENDPOINTS.LABORATORIES_PENDING         // GET /api/preregistration/laboratories/pending
PREREGISTRATION_ENDPOINTS.LABORATORY_APPROVE(id)       // POST /api/preregistration/laboratories/:id/approve

// Tasters
PREREGISTRATION_ENDPOINTS.TASTERS                      // GET /api/preregistration/tasters
PREREGISTRATION_ENDPOINTS.TASTERS_PENDING              // GET /api/preregistration/tasters/pending
PREREGISTRATION_ENDPOINTS.TASTER_APPROVE(id)           // POST /api/preregistration/tasters/:id/approve

// Competence Certificates
PREREGISTRATION_ENDPOINTS.COMPETENCE_CERTIFICATES      // GET /api/preregistration/competence-certificates
PREREGISTRATION_ENDPOINTS.COMPETENCE_PENDING           // GET /api/preregistration/competence-certificates/pending
PREREGISTRATION_ENDPOINTS.COMPETENCE_APPROVE(id)       // POST /api/preregistration/competence-certificates/:id/approve

// Export Licenses
PREREGISTRATION_ENDPOINTS.EXPORT_LICENSES              // GET /api/preregistration/export-licenses
PREREGISTRATION_ENDPOINTS.LICENSES_PENDING             // GET /api/preregistration/export-licenses/pending
PREREGISTRATION_ENDPOINTS.LICENSE_APPROVE(id)          // POST /api/preregistration/export-licenses/:id/approve
```

### Quality Management (ECTA)
```javascript
QUALITY_ENDPOINTS.QUALITY_CHECKS          // GET /api/quality
QUALITY_ENDPOINTS.QUALITY_PENDING         // GET /api/quality/pending
QUALITY_ENDPOINTS.QUALITY_APPROVE(id)     // POST /api/quality/:id/approve
QUALITY_ENDPOINTS.QUALITY_REJECT(id)      // POST /api/quality/:id/reject
QUALITY_ENDPOINTS.QUALITY_STATISTICS      // GET /api/quality/statistics
```

### License Management (ECTA)
```javascript
LICENSE_ENDPOINTS.LICENSES                // GET /api/licenses
LICENSE_ENDPOINTS.LICENSE_DETAILS(id)     // GET /api/licenses/:id
LICENSE_ENDPOINTS.LICENSE_APPLY           // POST /api/licenses/apply
LICENSE_ENDPOINTS.LICENSE_RENEW(id)       // POST /api/licenses/:id/renew
LICENSE_ENDPOINTS.LICENSE_VERIFY(id)      // GET /api/licenses/:id/verify
```

### Contract Management (ECTA)
```javascript
CONTRACT_ENDPOINTS.CONTRACTS              // GET /api/contracts
CONTRACT_ENDPOINTS.CONTRACT_DETAILS(id)   // GET /api/contracts/:id
CONTRACT_ENDPOINTS.CONTRACT_VERIFY(id)    // POST /api/contracts/:id/verify
CONTRACT_ENDPOINTS.CONTRACT_APPROVE(id)   // POST /api/contracts/:id/approve
CONTRACT_ENDPOINTS.CONTRACT_REJECT(id)    // POST /api/contracts/:id/reject
```

### Foreign Exchange (National Bank)
```javascript
FX_ENDPOINTS.FX_APPROVALS                 // GET /api/fx/approvals
FX_ENDPOINTS.FX_APPROVAL_DETAILS(id)      // GET /api/fx/approvals/:id
FX_ENDPOINTS.FX_APPROVE(id)               // POST /api/fx/approvals/:id/approve
FX_ENDPOINTS.FX_REJECT(id)                // POST /api/fx/approvals/:id/reject
FX_ENDPOINTS.FX_PENDING                   // GET /api/fx/pending
FX_ENDPOINTS.FX_RATES                     // GET/POST /api/fx/rates
FX_ENDPOINTS.FX_STATISTICS                // GET /api/fx/statistics
```

### Monetary Policy (National Bank)
```javascript
// Policies
MONETARY_ENDPOINTS.POLICIES               // GET/POST /api/monetary/policies
MONETARY_ENDPOINTS.POLICY_DETAILS(id)     // GET /api/monetary/policies/:id
MONETARY_ENDPOINTS.POLICY_ACTIVATE(id)    // POST /api/monetary/policies/:id/activate
MONETARY_ENDPOINTS.POLICY_DEACTIVATE(id)  // POST /api/monetary/policies/:id/deactivate

// Controls
MONETARY_ENDPOINTS.CONTROLS               // GET /api/monetary/controls
MONETARY_ENDPOINTS.CONTROL_DETAILS(id)    // GET /api/monetary/controls/:id
MONETARY_ENDPOINTS.CONTROL_ENABLE(id)     // POST /api/monetary/controls/:id/enable
MONETARY_ENDPOINTS.CONTROL_DISABLE(id)    // POST /api/monetary/controls/:id/disable

// Compliance
MONETARY_ENDPOINTS.COMPLIANCE             // GET /api/monetary/compliance
MONETARY_ENDPOINTS.COMPLIANCE_DETAILS(id) // GET /api/monetary/compliance/:id
MONETARY_ENDPOINTS.COMPLIANCE_RUN         // POST /api/monetary/compliance/run
MONETARY_ENDPOINTS.COMPLIANCE_STATISTICS  // GET /api/monetary/compliance/statistics

// Exports
MONETARY_ENDPOINTS.EXPORTS_TRANSACTIONS   // GET /api/monetary/exports/transactions
MONETARY_ENDPOINTS.EXPORTS_CURRENCY       // GET /api/monetary/exports/currency
MONETARY_ENDPOINTS.EXPORTS_REPORTS        // GET /api/monetary/exports/reports

// Admin
MONETARY_ENDPOINTS.ADMIN_SETTINGS         // GET/PUT /api/monetary/admin/settings
MONETARY_ENDPOINTS.ADMIN_AUDIT            // GET /api/monetary/admin/audit
MONETARY_ENDPOINTS.STATISTICS             // GET /api/monetary/statistics
```

### Customs (Custom Authorities)
```javascript
CUSTOMS_ENDPOINTS.CUSTOMS_CLEARANCE       // GET /api/customs/clearance
CUSTOMS_ENDPOINTS.CUSTOMS_PENDING         // GET /api/customs/pending
CUSTOMS_ENDPOINTS.CUSTOMS_CLEAR(id)       // POST /api/exports/:id/export-customs/clear
CUSTOMS_ENDPOINTS.CUSTOMS_REJECT(id)      // POST /api/exports/:id/export-customs/reject
CUSTOMS_ENDPOINTS.CUSTOMS_STATISTICS      // GET /api/customs/statistics
```

### Lot Verification (ECX)
```javascript
LOT_VERIFICATION_ENDPOINTS.LOT_VERIFICATION   // GET /api/lot-verification
LOT_VERIFICATION_ENDPOINTS.LOT_PENDING        // GET /api/lot-verification/pending/verification
LOT_VERIFICATION_ENDPOINTS.LOT_VERIFY(id)     // POST /api/lot-verification/:id/verify
LOT_VERIFICATION_ENDPOINTS.LOT_REJECT(id)     // POST /api/lot-verification/:id/reject
```

### Shipment (Shipping Line)
```javascript
SHIPMENT_ENDPOINTS.SHIPMENTS              // GET /api/shipment
SHIPMENT_ENDPOINTS.SHIPMENT_DETAILS(id)   // GET /api/shipment/:id
SHIPMENT_ENDPOINTS.SHIPMENT_SCHEDULE(id)  // POST /api/exports/:id/shipment/schedule
SHIPMENT_ENDPOINTS.SHIPMENT_UPDATE(id)    // PUT /api/exports/:id/shipment/update
SHIPMENT_ENDPOINTS.SHIPMENT_COMPLETE(id)  // POST /api/exports/:id/shipment/complete
```

### User Management
```javascript
USER_ENDPOINTS.USERS                      // GET/POST /api/users
USER_ENDPOINTS.USER_DETAILS(id)           // GET /api/users/:id
USER_ENDPOINTS.USER_UPDATE(id)            // PUT /api/users/:id
USER_ENDPOINTS.USER_DELETE(id)            // DELETE /api/users/:id
```

## Patterns

### Static Endpoint
```javascript
// Constant value
EXPORT_ENDPOINTS.EXPORTS  // '/api/exports'

// Usage
apiClient.get(EXPORT_ENDPOINTS.EXPORTS)
```

### Dynamic Endpoint (with ID)
```javascript
// Function that takes ID parameter
EXPORT_ENDPOINTS.EXPORT_DETAILS(id)  // '/api/exports/:id'

// Usage
const exportId = '123';
apiClient.get(EXPORT_ENDPOINTS.EXPORT_DETAILS(exportId))
// Results in: GET /api/exports/123
```

### Dynamic Endpoint (with Type)
```javascript
// Function that takes type parameter
EXPORTER_ENDPOINTS.APPLICATION_SUBMIT(type)  // '/api/exporter/applications/:type'

// Usage
const applicationType = 'license';
apiClient.post(EXPORTER_ENDPOINTS.APPLICATION_SUBMIT(applicationType), data)
// Results in: POST /api/exporter/applications/license
```

## Environment Variables

### Frontend (.env)
```bash
# Development
VITE_API_EXPORTER_PORTAL=http://localhost:3004
VITE_API_COMMERCIAL_BANK=http://localhost:3001
VITE_API_ECTA=http://localhost:3003
VITE_API_NATIONAL_BANK=http://localhost:3005
VITE_API_CUSTOM_AUTHORITIES=http://localhost:3002
VITE_API_ECX=http://localhost:3006
VITE_API_SHIPPING_LINE=http://localhost:3007

# Production
VITE_API_BASE_URL=https://api.coffeeexport.com
VITE_ENV=production
```

### Backend (.env)
```bash
PORT=3004
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

## File Locations

- **Shared Constants**: `cbc/api/shared/api-endpoints.constants.ts`
- **Frontend Config**: `cbc/frontend/src/config/api.config.js`
- **Frontend Endpoints**: `cbc/frontend/src/config/api.endpoints.js`
- **Documentation**: `cbc/docs/API_ENDPOINT_ARCHITECTURE.md`
- **Migration Guide**: `cbc/scripts/migrate-to-shared-endpoints.md`

## Common Tasks

### Add New Endpoint
1. Add to `cbc/api/shared/api-endpoints.constants.ts`
2. Export in `cbc/frontend/src/config/api.endpoints.js`
3. Use in service files

### Update Existing Endpoint
1. Update in `cbc/api/shared/api-endpoints.constants.ts`
2. Changes automatically propagate to all usages

### Find Endpoint Definition
1. Check `cbc/api/shared/api-endpoints.constants.ts`
2. Search for endpoint group (e.g., `EXPORT_ENDPOINTS`)

## Tips

- ✅ Always use constants, never hardcode paths
- ✅ Use function-based endpoints for dynamic IDs
- ✅ Import only the endpoint groups you need
- ✅ Check TypeScript autocomplete for available endpoints
- ❌ Don't hardcode `/api/` prefix in service calls
- ❌ Don't use template literals for dynamic paths
- ❌ Don't duplicate endpoint definitions

## Need More Info?

- Full documentation: `cbc/docs/API_ENDPOINT_ARCHITECTURE.md`
- Implementation details: `cbc/docs/SINGLE_SOURCE_OF_TRUTH_IMPLEMENTATION.md`
- Migration guide: `cbc/scripts/migrate-to-shared-endpoints.md`
