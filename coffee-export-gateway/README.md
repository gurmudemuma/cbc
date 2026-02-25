# Coffee Export Gateway Service

Gateway service for Ethiopian coffee exporters to interact with the Hyperledger Fabric blockchain network.

## Architecture Overview

```
┌──────────────────────────────┐
│   Exporter Web Portal        │  ← React/Angular frontend
│      (frontend)              │
└───────────────┬──────────────┘
                │  HTTPS/REST
                ▼
┌──────────────────────────────────────┐
│   Gateway Service (THIS)             │  ← Node.js + Fabric SDK
│   (hosted by ECTA)                   │
└───────────────────┬──────────────────┘
                    │  Fabric Gateway SDK
                    ▼
┌──────────────────────────────────────┐
│   Hyperledger Fabric Network         │
│   • Orderer (Raft)                   │
│   • Peers (ECTA, Bank, NBE, etc.)    │
│   • Channel: coffeechannel           │
│   • Chaincode: ecta                  │
└──────────────────────────────────────┘
```

**Key Point**: Exporters are NOT peer organizations. They are SDK clients who interact through this gateway.

## Features

- **Exporter Registration**: Admin can register new exporters with Fabric CA
- **Authentication**: JWT-based auth with Fabric identity mapping
- **ESW Submission**: Submit Export Single Window requests
- **Certificate Management**: Request and view quality certificates
- **Profile Management**: View and update exporter profiles
- **Secure**: Rate limiting, CORS, helmet security headers

## Prerequisites

- Node.js 16+
- Running Hyperledger Fabric network
- Access to ECTA organization's peer and CA
- Crypto materials in `../../crypto-config/`

## Installation

```bash
cd coffee-export-gateway
npm install
```

## Configuration

1. Copy environment template:
```bash
cp .env.example .env
```

2. Edit `.env`:
```env
PORT=3000
JWT_SECRET=your-strong-secret-key
CHANNEL_NAME=coffeechannel
CHAINCODE_NAME=ecta
CA_ADMIN_USER=admin
CA_ADMIN_PASSWORD=adminpw
```

3. Update `src/config/connection-profile.json` with correct paths to crypto materials

## Setup

### 1. Enroll Admin User

Run once during initial setup:

```bash
npm run enroll-admin
```

This enrolls the admin user with the Fabric CA and stores credentials in `wallets/admin/`.

### 2. Start the Gateway

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

## API Endpoints

### Authentication

**POST** `/api/auth/login`
```json
{
  "username": "exporter1",
  "password": "password123"
}
```

Returns JWT token for subsequent requests.

### Exporter Management

**POST** `/api/exporter/register` (Admin only)
```json
{
  "username": "exporter1",
  "password": "password123",
  "companyName": "Yirgacheffe Coffee Export",
  "tin": "1234567890",
  "capitalETB": 5000000,
  "licenseNumber": "ECX-2024-001"
}
```

**GET** `/api/exporter/profile` (Authenticated)

**PUT** `/api/exporter/profile` (Authenticated)

### ESW (Export Single Window)

**POST** `/api/esw/submit` (Authenticated)
```json
{
  "productType": "coffee",
  "quantity": 1000,
  "unit": "kg",
  "destinationCountry": "USA",
  "estimatedValue": 50000,
  "hsCode": "0901.21"
}
```

**GET** `/api/esw/my-submissions` (Authenticated)

**GET** `/api/esw/:requestId` (Authenticated)

**GET** `/api/esw/:requestId/status` (Authenticated)

**POST** `/api/esw/:requestId/approve` (Agency users)

### Certificates

**POST** `/api/certificates/quality/request` (Authenticated)

**GET** `/api/certificates/my-certificates` (Authenticated)

**GET** `/api/certificates/:certificateId` (Authenticated)

**GET** `/api/certificates/:certificateId/verify` (Public)

## Usage Example

### 1. Admin registers new exporter

```bash
curl -X POST http://localhost:3000/api/exporter/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "username": "exporter1",
    "password": "pass123",
    "companyName": "Yirgacheffe Coffee",
    "tin": "1234567890"
  }'
```

### 2. Exporter logs in

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "exporter1",
    "password": "pass123"
  }'
```

### 3. Exporter submits ESW request

```bash
curl -X POST http://localhost:3000/api/esw/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <exporter-token>" \
  -d '{
    "productType": "coffee",
    "quantity": 1000,
    "destinationCountry": "USA",
    "estimatedValue": 50000
  }'
```

## Security Considerations

- **JWT Secret**: Use strong, random secret in production
- **HTTPS**: Always use HTTPS in production
- **Rate Limiting**: Configured for 100 requests per 15 minutes
- **Wallet Storage**: File system wallet is for development only. Use HSM or secure key management in production
- **Password Hashing**: bcrypt with salt rounds = 10
- **CORS**: Configure allowed origins in production

## Production Deployment

### Recommended Setup

1. **Database**: Replace in-memory user store with PostgreSQL/MongoDB
2. **Wallet**: Use HSM or cloud KMS for private key storage
3. **Load Balancer**: Deploy multiple instances behind nginx/HAProxy
4. **Monitoring**: Add Prometheus metrics and logging
5. **HTTPS**: Use Let's Encrypt or corporate certificates
6. **Environment**: Use secrets manager (AWS Secrets Manager, HashiCorp Vault)

### Docker Deployment

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3000
CMD ["node", "src/server.js"]
```

```bash
docker build -t coffee-gateway .
docker run -p 3000:3000 --env-file .env coffee-gateway
```

## Troubleshooting

### "Identity not found"
- Run `npm run enroll-admin` first
- Check wallet directory exists and has correct permissions

### "Connection refused"
- Verify Fabric network is running
- Check peer/CA URLs in connection-profile.json
- Verify crypto material paths are correct

### "Endorsement failed"
- Check chaincode is installed and instantiated
- Verify user has correct permissions
- Check chaincode function names match

## License

Proprietary - Ethiopian Coffee & Tea Authority
