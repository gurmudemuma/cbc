# Coffee Export Consortium - Hyperledger Fabric Blockchain Platform

Enterprise-grade blockchain solution for managing coffee export operations across multiple stakeholders including exporters, banks, customs authorities, and shipping lines.

## Architecture

**Blockchain Network:** Hyperledger Fabric 2.5  
**Organizations:** 6 (Commercial Bank, National Bank, ECTA, ECX, Shipping Line, Custom Authorities)  
**Channels:** coffee-export-channel  
**Chaincodes:** coffee-export, user-management  
**Database:** PostgreSQL + CouchDB  
**Storage:** IPFS  
**Frontend:** React 18

## Prerequisites

- Docker 20.0+
- Docker Compose 2.0+
- Node.js 18+
- Go 1.21+
- 16GB RAM minimum

## Quick Start

```bash
# 1. Clone and setup
git clone <repository-url>
cd cbc

# 2. Generate secrets
./scripts/generate-strong-secrets.sh

# 3. Start the network
./scripts/start.sh

# 4. Access the frontend
open http://localhost:3000
```

## Project Structure

```
cbc/
├── apis/                    # Microservices for each organization
│   ├── commercial-bank/
│   ├── national-bank/
│   ├── ecta/
│   ├── ecx/
│   ├── shipping-line/
│   ├── custom-authorities/
│   └── shared/             # Shared utilities
├── chaincode/              # Smart contracts
│   ├── coffee-export/
│   └── user-management/
├── frontend/               # React application
├── network/                # Fabric network configuration
├── scripts/                # Deployment scripts
└── docker-compose.yml      # Container orchestration
```

## API Endpoints

### Commercial Bank API (Port 3001)
- `POST /api/auth/login` - Authentication
- `POST /api/exports` - Create export request
- `GET /api/exports/:id` - Get export details

### National Bank API (Port 3002)
- `POST /api/auth/login`
- `GET /api/fx-rates` - Foreign exchange rates
- `POST /api/approvals` - Approve transactions

### ECTA API (Port 3003)
- `POST /api/preregistration` - Exporter registration
- `POST /api/compliance/verify` - Compliance verification

### ECX API (Port 3004)
- `GET /api/coffee/prices` - Coffee market prices
- `POST /api/quality/certify` - Quality certification

### Shipping Line API (Port 3005)
- `POST /api/bookings` - Create shipping booking
- `GET /api/tracking/:id` - Track shipment

### Custom Authorities API (Port 3006)
- `POST /api/clearance` - Customs clearance
- `GET /api/documents/:id` - Document verification

## Development

```bash
# Install dependencies
npm install
cd frontend && npm install
cd ../apis && npm install

# Run tests
npm test

# Start individual API
cd apis/commercial-bank
npm run dev

# Build chaincode
cd chaincode/coffee-export
go build
```

## Testing

```bash
# Run all tests
./scripts/tests/run-all-tests.sh

# Test specific API
cd apis/commercial-bank
npm test

# Test chaincode
cd chaincode/coffee-export
go test -v
```

## Deployment

### Development
```bash
./scripts/start.sh
```

### Production
```bash
docker-compose -f docker-compose.production.yml up -d
```

### Kubernetes
```bash
kubectl apply -f k8s/
```

## Monitoring

- **Prometheus:** http://localhost:9090
- **Grafana:** http://localhost:3001
- **Logs:** `docker-compose logs -f`

## Security

- JWT authentication
- Rate limiting
- Input sanitization
- TLS encryption
- Secret management via Docker secrets

## Troubleshooting

### Network won't start
```bash
./cleanup-system.sh
./scripts/start.sh
```

### API connection issues
```bash
./diagnose-api-issues.sh
```

### Chaincode deployment fails
```bash
./network/retry-chaincode-deployment.sh
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/name`)
3. Commit changes (`git commit -am 'Add feature'`)
4. Push to branch (`git push origin feature/name`)
5. Create Pull Request

## License

MIT License - see LICENSE file

## Support

For issues and questions, please open a GitHub issue.
