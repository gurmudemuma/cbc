# Blockchain Bridge Service

Synchronizes data between Hyperledger Fabric and CBC PostgreSQL consortium blockchain.

## Features

- **Event Listener**: Listens to Fabric chaincode events and forwards to CBC
- **Data Sync**: Synchronizes CBC data to Fabric ledger
- **Reconciliation**: Periodic consistency checks and mismatch resolution
- **Kafka Integration**: Event streaming for decoupled communication
- **Health Monitoring**: Service health checks and metrics
- **Retry Mechanism**: Automatic retry for failed syncs with exponential backoff

## Architecture

```
Fabric Events → Event Listener → Kafka → CBC Services
CBC Changes → Data Sync → Kafka → Fabric Ledger
Reconciliation Service → Periodic Checks → Mismatch Resolution
```

## Installation

```bash
npm install
```

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

## Development

```bash
npm run dev
```

## Production

```bash
npm run build
npm start
```

## Docker

```bash
docker build -t blockchain-bridge .
docker run -p 3008:3008 --env-file .env blockchain-bridge
```

## API Endpoints

### Health Check
```
GET /health
```

### Metrics
```
GET /metrics
```

### Sync Status
```
GET /sync/status
```

### Manual Reconciliation
```
POST /reconcile/trigger
```

### Retry Failed Sync
```
POST /sync/retry
Body: { "syncId": "sync-id" }
```

## Event Topics

### Fabric Events (Published)
- `fabric.events` - All chaincode events
- `fabric.transactions` - Transaction records
- `fabric.events.dlq` - Failed event processing

### CBC Events (Consumed)
- `cbc.exporter.updates` - Exporter profile changes
- `cbc.license.updates` - License status changes
- `cbc.certificate.issued` - Certificate issuances
- `cbc.inspection.completed` - Quality inspections
- `cbc.approval.granted` - Agency approvals

## Reconciliation

Runs daily at 2 AM (configurable via `RECONCILIATION_SCHEDULE`).

Checks:
- Exporter statuses
- License validity
- Certificate statuses
- Shipment statuses

Resolution strategies:
- **Fabric Wins**: State changes (approved, rejected, etc.)
- **CBC Wins**: Detailed data (addresses, contacts, etc.)
- **Manual Review**: Critical conflicts (payment, customs)

## Monitoring

### Metrics
- Successful syncs (last hour)
- Failed syncs (last hour)
- Unresolved reconciliation issues
- Sync lag time
- Event processing time

### Logs
- `logs/error.log` - Error logs
- `logs/combined.log` - All logs

## Database Tables

### sync_log
Tracks all synchronization attempts.

```sql
CREATE TABLE sync_log (
  id SERIAL PRIMARY KEY,
  sync_type VARCHAR(50),
  entity_id VARCHAR(100),
  status VARCHAR(20),
  error_message TEXT,
  data JSONB,
  retry_count INT DEFAULT 0,
  synced_at TIMESTAMP
);
```

### reconciliation_log
Tracks reconciliation runs.

```sql
CREATE TABLE reconciliation_log (
  id SERIAL PRIMARY KEY,
  mismatches_found INT,
  duration_ms INT,
  run_at TIMESTAMP
);
```

### reconciliation_issues
Tracks unresolved mismatches.

```sql
CREATE TABLE reconciliation_issues (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50),
  entity_id VARCHAR(100),
  fabric_value JSONB,
  cbc_value JSONB,
  severity VARCHAR(20),
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP,
  resolved_at TIMESTAMP
);
```

## Troubleshooting

### Fabric Connection Issues
- Check `CHAINCODE_URL` is correct
- Verify Fabric network is running
- Check admin wallet exists

### CBC Connection Issues
- Check PostgreSQL connection settings
- Verify CBC services are running
- Check database credentials

### Kafka Issues
- Verify Kafka brokers are reachable
- Check topic creation
- Review consumer group status

### Sync Lag
- Check `/sync/status` endpoint
- Review failed syncs in database
- Trigger manual retry if needed

## License

Proprietary - Ethiopian Coffee & Tea Authority (ECTA)
