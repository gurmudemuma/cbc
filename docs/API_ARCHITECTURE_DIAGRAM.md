# API Architecture Diagram

## Single Source of Truth Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    SINGLE SOURCE OF TRUTH                        │
│         cbc/api/shared/api-endpoints.constants.ts               │
│                                                                  │
│  • All endpoint paths defined here                              │
│  • Service configurations (ports, MSP IDs)                      │
│  • Type definitions for TypeScript                              │
│  • Helper functions for URL building                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
┌─────────────────┐             ┌─────────────────┐
│   FRONTEND      │             │    BACKEND      │
│                 │             │                 │
│ api.config.js   │             │ Route files     │
│ api.endpoints   │             │ import from     │
│ Service files   │             │ @shared/...     │
└─────────────────┘             └─────────────────┘
```

## Service Architecture

```
Development (localhost):
┌──────────────────────────────────────────────────────────────┐
│  Frontend (Port 5173)                                         │
│  http://localhost:5173                                        │
└───────────────────┬──────────────────────────────────────────┘
                    │
                    │ API Calls
                    │
    ┌───────────────┴───────────────┐
    │                               │
    ▼                               ▼
┌─────────────────┐         ┌─────────────────┐
│ Exporter Portal │         │ Commercial Bank │
│ Port 3004       │         │ Port 3001       │
└─────────────────┘         └─────────────────┘
    │                               │
    ▼                               ▼
┌─────────────────┐         ┌─────────────────┐
│ ECTA            │         │ National Bank   │
│ Port 3003       │         │ Port 3005       │
└─────────────────┘         └─────────────────┘
```


## Production/Staging (API Gateway)

```
┌──────────────────────────────────────────────────────────────┐
│  Frontend                                                     │
│  https://app.coffeeexport.com                                │
└───────────────────┬──────────────────────────────────────────┘
                    │
                    │ API Calls
                    │
                    ▼
┌──────────────────────────────────────────────────────────────┐
│  API Gateway                                                  │
│  https://api.coffeeexport.com                                │
│                                                               │
│  Routes by service path:                                     │
│  /exporter-portal/* → Exporter Portal Service               │
│  /commercial-bank/* → Commercial Bank Service               │
│  /ecta/*            → ECTA Service                          │
│  /national-bank/*   → National Bank Service                 │
│  /custom-authorities/* → Custom Authorities Service         │
│  /ecx/*             → ECX Service                           │
│  /shipping-line/*   → Shipping Line Service                 │
└───────────────────┬──────────────────────────────────────────┘
                    │
    ┌───────────────┴───────────────┐
    │                               │
    ▼                               ▼
┌─────────────────┐         ┌─────────────────┐
│ Service 1       │         │ Service 2       │
│ (Internal)      │         │ (Internal)      │
└─────────────────┘         └─────────────────┘
```

## Endpoint Resolution Flow

```
1. Frontend Service Call
   ↓
   import { EXPORT_ENDPOINTS } from '../config/api.endpoints'
   ↓
   apiClient.get(EXPORT_ENDPOINTS.EXPORT_DETAILS(exportId))
   ↓
2. Endpoint Constant Resolution
   ↓
   EXPORT_ENDPOINTS.EXPORT_DETAILS(exportId)
   → '/api/exports/123'
   ↓
3. URL Building (api.config.js)
   ↓
   Development: http://localhost:3004/api/exports/123
   Production:  https://api.coffeeexport.com/exporter-portal/api/exports/123
   ↓
4. API Request
   ↓
   Backend receives request at defined endpoint
```

## Data Flow Example

```
User Action: Get Export Details
        ↓
┌─────────────────────────────────────────────────────────────┐
│ Frontend Component                                           │
│ exportDetails.jsx                                           │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Frontend Service                                             │
│ exporterService.js                                          │
│                                                              │
│ import { EXPORT_ENDPOINTS } from '../config/api.endpoints'  │
│ apiClient.get(EXPORT_ENDPOINTS.EXPORT_DETAILS(exportId))   │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Shared Constants                                             │
│ api-endpoints.constants.ts                                  │
│                                                              │
│ EXPORT_ENDPOINTS.EXPORT_DETAILS = (id) => `/api/exports/${id}` │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ HTTP Request                                                 │
│ GET http://localhost:3004/api/exports/123                   │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Backend Route                                                │
│ export.routes.ts                                            │
│                                                              │
│ router.get(EXPORT_ENDPOINTS.EXPORT_DETAILS(':id'), ...)    │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Backend Controller                                           │
│ export.controller.ts                                        │
│                                                              │
│ Returns export data                                         │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
        Response to Frontend
```

## Service Port Mapping

```
┌─────────────────────┬──────┬─────────────┬──────────────────┐
│ Service             │ Port │ Type        │ MSP ID           │
├─────────────────────┼──────┼─────────────┼──────────────────┤
│ Commercial Bank     │ 3001 │ Consortium  │ CommercialBankMSP│
│ Custom Authorities  │ 3002 │ Consortium  │ CustomAuthoritiesMSP│
│ ECTA                │ 3003 │ Consortium  │ ECTAMSP          │
│ Exporter Portal     │ 3004 │ External    │ null             │
│ National Bank       │ 3005 │ Consortium  │ NationalBankMSP  │
│ ECX                 │ 3006 │ Consortium  │ ECXMSP           │
│ Shipping Line       │ 3007 │ Consortium  │ ShippingLineMSP  │
└─────────────────────┴──────┴─────────────┴──────────────────┘
```

## Benefits Visualization

```
Before (Hardcoded):
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Service A    │  │ Service B    │  │ Service C    │
│ '/api/...'   │  │ '/api/...'   │  │ '/api/...'   │
└──────────────┘  └──────────────┘  └──────────────┘
     ❌ Inconsistent    ❌ Hard to maintain    ❌ Error-prone

After (Single Source):
┌──────────────────────────────────────────────────────────┐
│         SINGLE SOURCE OF TRUTH                            │
│         api-endpoints.constants.ts                       │
└────────────────────┬─────────────────────────────────────┘
                     │
     ┌───────────────┼───────────────┐
     │               │               │
     ▼               ▼               ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│Service A │  │Service B │  │Service C │
└──────────┘  └──────────┘  └──────────┘
     ✅ Consistent    ✅ Easy to maintain    ✅ Type-safe
```
