# Docker Configuration Guide

## Overview
The system is configured to run in Docker containers. All services communicate using Docker container names instead of localhost.

## Key Configuration Changes

### Gateway Service (.env)
```bash
# Fabric Network - Use Docker container names
FABRIC_NETWORK_AS_LOCALHOST=false
FABRIC_TEST_MODE=fabric

# Database - Use container name
DB_HOST=postgres

# Kafka - Use container name
KAFKA_BROKERS=kafka:9092

# Redis - Use container name
REDIS_HOST=redis
```

## Container Network Architecture

### Network: coffee-export-network
- postgres (coffee-postgres) - Port 5432
- redis (coffee-redis) - Port 6379
- kafka (coffee-kafka) - Ports 9092 (internal), 9093 (host)
- gateway (coffee-gateway) - Port 3000
- blockchain-bridge (coffee-bridge) - Port 3008
- ecta-service (coffee-ecta) - Port 3003
- frontend (coffee-frontend) - Port 5173

### Network: fabric-network
- Hyperledger Fabric peers and orderers
- Gateway and blockchain-bridge connect to both networks

## Service Communication

### Internal (Container-to-Container)
Services use container names:
- Gateway → postgres:5432
- Gateway → kafka:9092
- Gateway → redis:6379
- Bridge → postgres:5432

### External (Host-to-Container)
Host machine uses localhost:
- Host → localhost:3000 (gateway)
- Host → localhost:5432 (postgres)
- Host → localhost:9093 (kafka)

## Testing with Docker

### Check Container Status
```bash
docker ps --filter "name=coffee-"
```

### View Gateway Logs
```bash
docker logs coffee-gateway -f
```

### Test Database Connection
```bash
docker exec coffee-gateway node -e "const pg = require('pg'); const client = new pg.Client({host:'postgres',port:5432,database:'coffee_export_db',user:'postgres',password:'postgres'}); client.connect().then(() => console.log('Connected!')).catch(e => console.error(e));"
```

### Test Kafka Connection
```bash
docker exec coffee-gateway node -e "console.log('Kafka broker:', process.env.KAFKA_BROKERS)"
```

## Troubleshooting

### Issue: Cannot connect to database
**Solution**: Ensure DB_HOST=postgres (not localhost)

### Issue: Kafka connection failed
**Solution**: Ensure KAFKA_BROKERS=kafka:9092 (not localhost:9092)

### Issue: Fabric network unreachable
**Solution**: Ensure FABRIC_NETWORK_AS_LOCALHOST=false

### Issue: Services can't communicate
**Solution**: Check all services are on the same Docker network:
```bash
docker network inspect coffee-export-network
```

## Configuration Files

### Primary Configuration
- `coffee-export-gateway/.env` - Gateway environment variables
- `docker-compose-hybrid.yml` - All service definitions

### Fabric Configuration
- `coffee-export-gateway/src/config/connection-profile.json` - Peer/orderer endpoints
- Uses container names (peer0.ecta.example.com, orderer1.orderer.example.com)

## Quick Start

1. Ensure Docker is running
2. Start Fabric network: `START-FABRIC-NETWORK.bat`
3. Start hybrid services: `docker-compose -f docker-compose-hybrid.yml up -d`
4. Check logs: `docker logs coffee-gateway -f`

## Status: ✅ CONFIGURED FOR DOCKER

All services are now configured to use Docker container names for internal communication.
