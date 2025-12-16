# System Architecture

## Overview
The Coffee Export Consortium is a permissioned blockchain network built on Hyperledger Fabric 2.5, enabling secure and transparent coffee export operations.

## Network Topology

### Organizations
1. **Commercial Bank** - Handles exporter financing
2. **National Bank** - Foreign exchange and regulatory oversight
3. **ECTA** - Exporter registration and compliance
4. **ECX** - Coffee quality certification and pricing
5. **Shipping Line** - Logistics and shipping
6. **Custom Authorities** - Customs clearance

### Channels
- **coffee-export-channel** - Main channel for all organizations

### Chaincodes
- **coffee-export** - Core export workflow management
- **user-management** - User authentication and authorization

## Technology Stack

### Blockchain Layer
- Hyperledger Fabric 2.5
- CouchDB (state database)
- Orderer (Raft consensus)

### Application Layer
- Node.js 18+ (APIs)
- TypeScript
- Express.js
- React 18 (Frontend)

### Data Layer
- PostgreSQL 15 (off-chain data)
- IPFS (document storage)
- Redis (caching)

### Infrastructure
- Docker & Docker Compose
- Nginx (reverse proxy)
- Prometheus & Grafana (monitoring)

## Data Flow

1. **Export Request Creation**
   - Exporter submits via Commercial Bank API
   - Data validated and stored in PostgreSQL
   - Transaction submitted to blockchain
   - Event emitted to all participants

2. **Approval Workflow**
   - ECTA validates compliance
   - ECX certifies quality
   - National Bank approves FX
   - Custom Authorities clears export

3. **Shipping & Tracking**
   - Shipping Line creates booking
   - Real-time tracking updates
   - Document verification via IPFS

## Security Architecture

### Authentication
- JWT tokens (24h expiry)
- Role-based access control (RBAC)
- Multi-factor authentication support

### Network Security
- TLS 1.3 for all communications
- Mutual TLS between peers
- Certificate-based identity

### Data Security
- Encryption at rest (AES-256)
- Encryption in transit (TLS)
- Private data collections for sensitive info

## Scalability

### Horizontal Scaling
- Multiple peer nodes per organization
- Load balancing across API instances
- Database read replicas

### Performance Optimization
- Redis caching layer
- Connection pooling
- Async event processing

## High Availability

### Redundancy
- Multi-node orderer cluster (Raft)
- Database replication
- API service replicas

### Disaster Recovery
- Automated backups (daily)
- Point-in-time recovery
- Cross-region replication (production)

## Monitoring & Observability

### Metrics
- Prometheus for metrics collection
- Grafana dashboards
- Custom business metrics

### Logging
- Centralized logging
- Log aggregation
- Audit trail

### Alerting
- Threshold-based alerts
- Anomaly detection
- Incident response automation
