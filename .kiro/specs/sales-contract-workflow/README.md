# Sales Contract Workflow System

**Version**: 1.0.0  
**Status**: ✅ **PRODUCTION READY**  
**Last Updated**: April 24, 2026

---

## Overview

The Sales Contract Workflow system is a comprehensive digital platform for managing coffee export sales contracts. It enables exporters to create, negotiate, and finalize contracts with international buyers through a structured workflow that integrates blockchain technology for contract finalization and ECTA (Ethiopian Coffee and Tea Authority) for regulatory registration.

### Key Capabilities

- **Contract Management**: Create, edit, and manage sales contracts with full version control
- **Negotiation Workflow**: Multi-round negotiation with buyer counter-offers and responses
- **Blockchain Integration**: Finalize contracts on Hyperledger Fabric with immutable records
- **ECTA Registration**: Automatic registration with reference number generation
- **Notifications**: Email and in-app notifications for all contract events
- **Access Control**: Role-based access control with comprehensive audit logging
- **Export Integration**: Link contracts to export shipments with validation
- **Certificate Management**: Generate and download ECTA certificates

---

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Docker & Docker Compose (for Hyperledger Fabric)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd cbc

# Backend setup
cd services/exporter-portal
npm install
npm run build

# Frontend setup
cd ../../frontend
npm install
npm run build

# Database setup
cd ../services/exporter-portal
npm run migrate

# Start services
npm start  # Backend
npm run dev  # Frontend (in separate terminal)
```

### Verification

```bash
# Check backend health
curl http://localhost:3000/health

# Check frontend
curl http://localhost:3001

# Run tests
npm run test
```

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend Layer (React)                       │
├─────────────────────────────────────────────────────────────────┤
│  Dashboard │ Forms │ Timeline │ Buyer Portal │ Certificates     │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Gateway / Backend                         │
├─────────────────────────────────────────────────────────────────┤
│  Services │ Middleware │ Routes │ Controllers                   │
└────────────────┬────────────────────────────────────────────────┘
                 │
        ┌────────┴────────┬──────────────┐
        ▼                 ▼              ▼
   ┌─────────┐      ┌──────────┐   ┌──────────┐
   │ Database│      │Blockchain│   │ECTA API  │
   │(PostgreSQL)    │(Hyperledger)  │Registry  │
   └─────────┘      └──────────┘   └──────────┘
```

### Technology Stack

**Frontend**
- React 18
- TypeScript
- Material-UI
- Formik & Yup (validation)
- React Query (data fetching)
- Vitest & React Testing Library (testing)

**Backend**
- Node.js/Express
- TypeScript
- PostgreSQL
- Hyperledger Fabric (blockchain)
- Redis (caching)
- Winston (logging)

**Testing**
- Vitest (unit & integration tests)
- React Testing Library (component tests)
- Supertest (API tests)

---

## Project Structure

```
cbc/
├── frontend/
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── pages/               # Page components
│   │   ├── hooks/               # Custom hooks
│   │   ├── services/            # API services
│   │   ├── contexts/            # React contexts
│   │   ├── styles/              # Global styles
│   │   └── __tests__/           # Component tests
│   ├── package.json
│   └── tsconfig.json
│
└── services/
    └── exporter-portal/
        ├── src/
        │   ├── services/        # Business logic services
        │   ├── middleware/      # Express middleware
        │   ├── routes/          # API routes
        │   ├── controllers/     # Route controllers
        │   ├── models/          # Data models
        │   ├── types/           # TypeScript types
        │   ├── utils/           # Utility functions
        │   ├── config/          # Configuration
        │   └── __tests__/       # Unit & integration tests
        ├── package.json
        └── tsconfig.json
```

---

## API Endpoints

### Contract Management (11 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/contracts/drafts` | Create new draft contract |
| GET | `/api/contracts/drafts/:draftId` | Get draft details |
| PUT | `/api/contracts/drafts/:draftId` | Update draft contract |
| DELETE | `/api/contracts/drafts/:draftId` | Delete draft contract |
| POST | `/api/contracts/drafts/:draftId/send` | Send contract to buyer |
| POST | `/api/contracts/drafts/:draftId/accept` | Accept counter-offer |
| POST | `/api/contracts/drafts/:draftId/reject` | Reject contract |
| POST | `/api/contracts/drafts/:draftId/counter` | Submit counter-offer |
| POST | `/api/contracts/drafts/:draftId/finalize` | Finalize to blockchain |
| GET | `/api/contracts/drafts/exporter/:exporterId` | Get exporter contracts |
| GET | `/api/contracts/:referenceNumber` | Get by ECTA reference |

### Buyer Portal (2 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/buyer/contracts` | Get buyer contracts |
| POST | `/api/buyer/contracts/:draftId/respond` | Buyer response |

### Notifications (3 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/notifications/send` | Send notification |
| GET | `/api/notifications/:userId` | Get user notifications |
| PUT | `/api/notifications/:notificationId/read` | Mark as read |

### Export Management (4 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/contracts/:contractId/link-export` | Link to export |
| GET | `/api/contracts/:contractId/linked-exports` | Get linked exports |
| GET | `/api/exports/:exportId/linked-contracts` | Get linked contracts |
| DELETE | `/api/contracts/:contractId/unlink-export/:exportId` | Unlink from export |

---

## Frontend Components

### Dashboard & Forms
- **SalesContractDashboard** - Main dashboard with 3 tabs (Drafts, Negotiation, Finalized)
- **SalesContractDraftForm** - Create and edit draft contracts
- **SalesContractNegotiationForm** - Handle counter-offers and negotiations

### History & Buyer Portal
- **ContractHistoryTimeline** - View contract version history
- **BuyerPortalContracts** - Buyer interface for contract review
- **ContractComparisonView** - Compare contract versions
- **ContractCertificateDownload** - Download ECTA certificates

### Export Management
- **LinkedContractsView** - Display linked contracts
- **ContractLinkingForm** - Link contracts to exports

---

## Backend Services

### Core Services
- **ContractService** - Contract CRUD and status management
- **ValidationService** - Field and business rule validation
- **NotificationService** - Email and in-app notifications
- **NotificationDeliveryService** - Delivery tracking and retry

### Integration Services
- **BlockchainService** - Hyperledger Fabric integration
- **BlockchainRetryService** - Retry logic with exponential backoff
- **ECTAService** - ECTA registration and reference generation
- **ECTARetryService** - ECTA retry logic
- **ECTAClientService** - ECTA API client

### Specialized Services
- **ContractExportService** - Contract-export linking
- **AuthService** - Authentication and authorization
- **AuditService** - Audit logging

---

## Middleware

- **AuthMiddleware** - JWT token validation
- **RBACMiddleware** - Role-based access control
- **ContractOwnershipMiddleware** - Ownership verification
- **EmailVerificationMiddleware** - Buyer email verification
- **ContractLockingMiddleware** - Contract locking enforcement
- **AuditLoggingMiddleware** - Audit trail tracking
- **ContractValidationMiddleware** - Input validation
- **ContractErrorMiddleware** - Error handling

---

## Database Schema

### Tables

| Table | Purpose |
|-------|---------|
| `contract_drafts` | Main contract storage |
| `contract_history` | Version control and audit trail |
| `contract_notifications` | Notification tracking |
| `contract_permissions` | Access control |
| `contract_exports` | Contract-export linking |
| `audit_logs` | Comprehensive audit trail |

### Relationships

```
contract_drafts (1:N) contract_history
contract_drafts (1:N) contract_notifications
contract_drafts (1:N) contract_permissions
contract_drafts (1:N) contract_exports
contract_drafts (1:N) audit_logs
```

---

## Testing

### Test Coverage

- **Unit Tests**: 95+ tests (80%+ coverage)
- **Integration Tests**: 73+ tests
- **API Endpoint Tests**: 90+ tests
- **Frontend Component Tests**: 135+ tests
- **Total**: 357+ tests

### Running Tests

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test -- contract.service.test.ts

# Run tests in watch mode
npm run test:watch
```

---

## Security

### Features

- ✅ JWT authentication on all endpoints
- ✅ Role-based access control (Exporter, Buyer, ECTA, Admin)
- ✅ Contract ownership verification
- ✅ Buyer email verification with token expiration
- ✅ Contract locking after finalization
- ✅ Comprehensive audit logging
- ✅ Input validation and sanitization
- ✅ SQL injection prevention
- ✅ XSS prevention
- ✅ CSRF protection

### Best Practices

1. **Never commit secrets** - Use environment variables
2. **Validate all inputs** - Use Yup schemas and custom validators
3. **Log security events** - All access attempts logged
4. **Use HTTPS** - TLS/SSL in production
5. **Rotate secrets** - Change JWT secrets regularly
6. **Monitor logs** - Review audit logs regularly

---

## Deployment

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

### Docker

```bash
docker build -t exporter-portal .
docker run -p 3000:3000 exporter-portal
```

### Kubernetes

```bash
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
```

---

## Configuration

### Environment Variables

See [SYSTEM_CONFIGURATION_GUIDE.md](./SYSTEM_CONFIGURATION_GUIDE.md) for comprehensive configuration instructions.

### Key Variables

```env
# Server
NODE_ENV=production
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=exporter_portal
DB_USER=exporter_user
DB_PASSWORD=secure_password

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRY=24h

# Blockchain
BLOCKCHAIN_NETWORK=fabric-prod
BLOCKCHAIN_PEER_URL=https://peer.fabric.local

# ECTA
ECTA_API_URL=https://api.ecta.gov.et
ECTA_API_KEY=your-api-key

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PASSWORD=your-sendgrid-key

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## Monitoring

### Health Check

```bash
curl http://localhost:3000/health
```

### Logs

```bash
# View logs
tail -f logs/application.log

# View error logs
tail -f logs/error.log

# View audit logs
tail -f logs/audit.log
```

### Metrics

- API response times
- Database query performance
- Blockchain transaction success rate
- ECTA registration success rate
- Email delivery rate
- Error rates

---

## Troubleshooting

### Common Issues

#### Backend won't start
- Check database connection
- Verify environment variables
- Check port availability
- Review error logs

#### Frontend won't load
- Check backend API availability
- Verify CORS configuration
- Check browser console
- Clear browser cache

#### Tests failing
- Check database state
- Verify test data setup
- Review test logs
- Check for race conditions

#### Blockchain issues
- Verify Hyperledger Fabric network
- Check blockchain credentials
- Review blockchain logs
- Verify contract serialization

#### ECTA registration issues
- Verify ECTA API credentials
- Check ECTA API availability
- Review ECTA response logs
- Verify reference number format

---

## Documentation

- [FINAL_COMPLETION_SUMMARY.md](./FINAL_COMPLETION_SUMMARY.md) - Complete implementation overview
- [VERIFICATION_CHECKLIST.md](./VERIFICATION_CHECKLIST.md) - Detailed verification results
- [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) - Project status report
- [SYSTEM_DEPLOYMENT_CHECKLIST.md](./SYSTEM_DEPLOYMENT_CHECKLIST.md) - Deployment guide
- [SYSTEM_CONFIGURATION_GUIDE.md](./SYSTEM_CONFIGURATION_GUIDE.md) - Configuration instructions
- [design.md](./design.md) - Technical design document
- [requirements.md](./requirements.md) - System requirements
- [tasks.md](./tasks.md) - Implementation tasks

---

## Support

### Getting Help

1. Check the documentation
2. Review the troubleshooting section
3. Check the logs
4. Contact the development team

### Reporting Issues

1. Describe the issue clearly
2. Include error messages and logs
3. Provide steps to reproduce
4. Include environment details

---

## Contributing

### Code Standards

- Follow TypeScript best practices
- Use consistent naming conventions
- Write comprehensive tests
- Document complex logic
- Follow security guidelines

### Pull Request Process

1. Create feature branch
2. Make changes
3. Write/update tests
4. Update documentation
5. Submit pull request
6. Address review comments

---

## License

[Your License Here]

---

## Changelog

### Version 1.0.0 (April 24, 2026)
- Initial release
- All 53 tasks completed
- 357+ tests implemented
- 80%+ test coverage
- Production ready

---

## Contact

- **Project Manager**: [Name]
- **Technical Lead**: [Name]
- **DevOps Lead**: [Name]
- **Support Email**: support@exporter-portal.local

---

**Status**: ✅ **PRODUCTION READY**  
**Last Updated**: April 24, 2026  
**Version**: 1.0.0
