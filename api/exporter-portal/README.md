# Exporter Portal API

## Overview

**External Entity - SDK-based Client (No Peer Node)**

This API serves coffee exporters who are **external to the blockchain consortium**. It uses the Hyperledger Fabric SDK to connect to the network as a client application, following blockchain best practices for external entities.

### Key Characteristics

- ✅ **SDK-based client** - No peer node running
- ✅ **External entity** - Not a consortium member
- ✅ **Gateway connection** - Uses Commercial Bank's peer as gateway
- ✅ **Submit-only access** - Creates export requests
- ✅ **Read-only queries** - Views own exports only
- ✅ **Secure authentication** - JWT-based auth
- ✅ **Role-based access** - Exporters only

## Architecture

```
┌─────────────────────────────────────────┐
│     Exporter Portal API (Port 3007)     │
│     External Entity - SDK Client        │
├─────────────────────────────────────────┤
│  - No peer node                         │
│  - Uses Fabric SDK                      │
│  - Connects via gateway                 │
│  - Submit transactions only             │
└──────────────┬──────────────────────────┘
               │ Fabric SDK
               ▼
┌─────────────────────────────────────────┐
│   Commercial Bank Peer (Gateway)        │
│   peer0.commercialbank.coffee-export.com  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│     Hyperledger Fabric Network          │
│     (Shared by all consortium)          │
└─────────────────────────────────────────┘
```

## Setup

### 1. Install Dependencies

```bash
cd api/exporter-portal
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Enroll Client Identity

Before starting the API, you need to enroll a client identity:

```bash
npm run enroll
```

This creates an SDK client identity in the wallet.

### 4. Start the API

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new exporter
- `POST /api/auth/login` - Login exporter
- `POST /api/auth/refresh` - Refresh JWT token

### Exports (Authenticated)

- `POST /api/exports` - Create new export request
- `GET /api/exports/my-exports` - Get my exports
- `GET /api/exports/:id` - Get export by ID
- `GET /api/exports/:id/history` - Get export history

### Health Checks

- `GET /health` - Health status
- `GET /ready` - Readiness check
- `GET /live` - Liveness check

## Usage Example

### Register Exporter

```bash
curl -X POST http://localhost:3007/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "exporter1",
    "password": "securepass123",
    "email": "exporter1@example.com",
    "companyName": "ABC Coffee Exports Ltd",
    "exportLicenseNumber": "EXP-LIC-2024-001"
  }'
```

### Create Export Request

```bash
curl -X POST http://localhost:3007/api/exports \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "exportId": "EXP-2024-001",
    "exporterName": "ABC Coffee Exports Ltd",
    "exporterTIN": "TIN123456789",
    "exportLicenseNumber": "EXP-LIC-2024-001",
    "coffeeType": "Arabica Grade 2",
    "quantity": 5000,
    "destinationCountry": "United States",
    "estimatedValue": 75000
  }'
```

## Differences from Commercial Bank API

| Feature | Exporter Portal | Commercial Bank |
|---------|----------------|-----------------|
| **Type** | External Entity | Consortium Member |
| **Connection** | SDK Client | Full Peer Node |
| **Access** | Submit + Read Own | Full Read/Write |
| **Users** | Exporters | Bank Officers |
| **Port** | 3007 | 3001 |
| **Operations** | Create Exports | Banking Operations |

## Security

- JWT-based authentication
- Role verification (exporters only)
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation

## Monitoring

- Winston logging
- Health checks
- Metrics endpoint
- Error tracking

## Port

**3007** - Exporter Portal API (External Entity)

## Environment Variables

See `.env.example` for all configuration options.

## Local development — Fabric discovery & identities

Important notes for local development:

- The Exporter Portal is an SDK-based external client. It does NOT run a peer node or host on-chain identities.
- The service connects to the Fabric network using a wallet identity (SDK client):
  - Preferred identity: `exporterPortalClient` (if present in the filesystem wallet).
  - Fallback identity: `admin` (imported from network MSP files or provided in the wallet).
- For the SDK to discover endorsing peers and route evaluate/submit calls correctly in local/native setups, enable service discovery and set `asLocalhost: true` in the gateway connect options:
```json
discovery: { enabled: true, asLocalhost: true }
```
- Ensure the wallet contains the chosen identity (run `npm run enroll` if needed).
- Restart the service after making identity or connection-profile changes.

Verification steps:

- Health: GET http://localhost:3007/health — confirm the SDK/gateway shows `connected` or `ready`.
- Login test:
```bash
curl -X POST http://localhost:3007/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'
```

## License

MIT
