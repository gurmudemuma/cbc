# Coffee Export System - Architecture Diagram

## Service Routing Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser / Client                         │
│                     http://localhost:5173                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP Requests
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend Container (Nginx)                    │
│                         Port: 80 (→5173)                         │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Nginx Routing Rules                         │   │
│  │                                                           │   │
│  │  /api/payments/*   → exporter_portal (3010)             │   │
│  │  /api/contracts/*  → exporter_portal (3010)             │   │
│  │  /api/buyer/*      → exporter_portal (3010)             │   │
│  │  /api/*            → gateway (3000)                      │   │
│  │  /*                → SPA (index.html)                    │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────┬──────────────────────────┬───────────────────────┘
               │                          │
               │                          │
    ┌──────────▼──────────┐    ┌─────────▼──────────┐
    │  Exporter Portal    │    │   Gateway Service   │
    │    Service          │    │                     │
    │  Port: 3010         │    │   Port: 3000        │
    │                     │    │                     │
    │  ┌───────────────┐  │    │  ┌──────────────┐  │
    │  │   Routes:     │  │    │  │   Routes:    │  │
    │  │               │  │    │  │              │  │
    │  │ • /api/auth   │  │    │  │ • /api/auth  │  │
    │  │ • /api/       │  │    │  │ • /api/      │  │
    │  │   exporter    │  │    │  │   exporter   │  │
    │  │ • /api/       │  │    │  │ • /api/      │  │
    │  │   exports     │  │    │  │   exports    │  │
    │  │ • /api/       │  │    │  │ • /api/      │  │
    │  │   contracts   │  │    │  │   network    │  │
    │  │ • /api/buyer  │  │    │  │ • /api/      │  │
    │  │ • /api/       │  │    │  │   certificates│ │
    │  │   payments    │  │    │  │ • /api/ecta  │  │
    │  └───────────────┘  │    │  │ • /api/      │  │
    │                     │    │  │   customs    │  │
    │  PostgreSQL Only    │    │  │ • /api/      │  │
    │  REST API           │    │  │   shipping   │  │
    │                     │    │  │ • /api/      │  │
    └──────────┬──────────┘    │  │   payments/  │  │
               │               │  │   bank       │  │
               │               │  │ • /api/      │  │
               │               │  │   payments/  │  │
               │               │  │   nbe        │  │
               │               │  └──────────────┘  │
               │               │                     │
               │               │  Fabric SDK         │
               │               └──────────┬──────────┘
               │                          │
               │                          │
               ▼                          ▼
    ┌──────────────────┐      ┌──────────────────┐
    │   PostgreSQL     │      │  Hyperledger     │
    │   Database       │      │  Fabric Network  │
    │   Port: 5432     │      │                  │
    └──────────────────┘      └──────────────────┘
```

## Request Flow Examples

### Example 1: Payment Statistics Request
```
Browser
  │
  │ GET /api/payments/statistics
  ▼
Nginx (Frontend Container)
  │
  │ Matches: /api/payments/*
  │ Routes to: exporter_portal
  ▼
Exporter Portal Service (3010)
  │
  │ Handles: GET /api/payments/statistics
  │ Queries: PostgreSQL
  ▼
PostgreSQL Database
  │
  │ Returns: Payment statistics data
  ▼
Response → Nginx → Browser
```

### Example 2: Export List Request
```
Browser
  │
  │ GET /api/exports
  ▼
Nginx (Frontend Container)
  │
  │ Matches: /api/*
  │ Routes to: gateway
  ▼
Gateway Service (3000)
  │
  │ Handles: GET /api/exports
  │ Queries: Fabric Network + PostgreSQL
  ▼
Hyperledger Fabric Network
  │
  │ Returns: Export data from blockchain
  ▼
Response → Nginx → Browser
```

### Example 3: Contract Management Request
```
Browser
  │
  │ POST /api/contracts/draft
  ▼
Nginx (Frontend Container)
  │
  │ Matches: /api/contracts/*
  │ Routes to: exporter_portal
  ▼
Exporter Portal Service (3010)
  │
  │ Handles: POST /api/contracts/draft
  │ Stores: PostgreSQL
  ▼
PostgreSQL Database
  │
  │ Returns: Created contract draft
  ▼
Response → Nginx → Browser
```

## Service Responsibilities

### Exporter Portal Service (3010)
**Purpose**: Exporter-facing REST API with PostgreSQL backend

**Handles**:
- ✅ Payment initiation and management
- ✅ Sales contract drafts and management
- ✅ Buyer portal operations
- ✅ Exporter authentication
- ✅ Export submission (REST API)

**Technology**:
- Node.js + Express
- TypeScript
- PostgreSQL
- No blockchain interaction

### Gateway Service (3000)
**Purpose**: Blockchain gateway with Fabric SDK integration

**Handles**:
- ✅ Blockchain interactions via Fabric SDK
- ✅ Network member operations
- ✅ Certificate management
- ✅ ECTA operations
- ✅ Customs and shipping
- ✅ Bank payment operations
- ✅ NBE FX approval operations
- ✅ Export queries (blockchain + PostgreSQL)

**Technology**:
- Node.js + Express
- JavaScript
- Hyperledger Fabric SDK
- PostgreSQL (for caching/indexing)

## Port Mapping

| Service | Internal Port | External Port | Container Name |
|---------|--------------|---------------|----------------|
| Frontend (Nginx) | 80 | 5173 | coffee-frontend |
| Gateway | 3000 | 3000 | coffee-export-gateway |
| Exporter Portal | 3010 | 3010 | coffee-exporter-portal |
| PostgreSQL | 5432 | 5432 | coffee-postgres |
| Redis | 6379 | 6379 | coffee-redis |
| Kafka | 9092/9093 | 9092/9093 | coffee-kafka |

## Network Configuration

### Docker Networks
- `coffee-export-network` (default): All services
- `fabric-network` (external): Gateway + Fabric peers

### DNS Resolution
- Services communicate using container names
- Nginx uses Docker's embedded DNS (127.0.0.11)
- Example: `coffee-exporter-portal:3010`

## Key Design Decisions

### Why Two Backend Services?

1. **Separation of Concerns**
   - Gateway: Blockchain-heavy operations
   - Exporter Portal: Simple REST API for exporters

2. **Performance**
   - Exporter Portal: Fast PostgreSQL queries
   - Gateway: Slower blockchain queries when needed

3. **Scalability**
   - Can scale services independently
   - Exporter Portal can handle more traffic without blockchain overhead

### Why Nginx Routing?

1. **Single Entry Point**
   - Frontend only needs to know one URL
   - Simplifies CORS configuration

2. **Service Discovery**
   - Nginx handles service routing
   - Frontend doesn't need to know about multiple backends

3. **Load Balancing**
   - Can add multiple instances of each service
   - Nginx distributes traffic

## Common Issues and Solutions

### Issue: 502 Bad Gateway
**Cause**: Nginx routing to wrong service or service is down
**Solution**: 
1. Check service is running: `docker-compose ps`
2. Verify routing in nginx.conf
3. Test direct to service: `curl http://localhost:3010/health`

### Issue: 404 Not Found
**Cause**: Endpoint doesn't exist in the service
**Solution**:
1. Check which service should handle the endpoint
2. Verify route exists in service code
3. Check nginx is routing to correct service

### Issue: Connection Refused
**Cause**: Service not running or wrong port
**Solution**:
1. Check service status: `docker-compose ps`
2. Check service logs: `docker-compose logs <service>`
3. Verify port mapping in docker-compose.yml

## Future Improvements

1. **API Gateway Pattern**
   - Implement dedicated API gateway service
   - Centralized routing configuration
   - Better service discovery

2. **Path Prefixes**
   - Use `/api/v1/exporter/*` for exporter-portal
   - Use `/api/v1/gateway/*` for gateway
   - Clearer service boundaries

3. **Service Mesh**
   - Implement Istio or Linkerd
   - Better observability
   - Advanced traffic management
