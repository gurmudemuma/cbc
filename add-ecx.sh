#!/bin/bash

# Add ECX to consortium
echo "Adding ECX to consortium..."

# 1. Add ECX volume
sed -i '/peer0.ecta.coffee-export.com:/a\  peer0.ecx.coffee-export.com:' docker-compose.yml

# 2. Add CouchDB6 volume
sed -i '/couchdb5:/a\  couchdb6:' docker-compose.yml

# 3. Add CouchDB6 service
cat >> docker-compose.yml << 'EOF'

  couchdb6:
    container_name: couchdb6
    image: couchdb:3.3.3
    labels:
      service: hyperledger-fabric
    environment:
      - COUCHDB_USER=admin
      - COUCHDB_PASSWORD_FILE=/run/secrets/couchdb_password
    ports:
      - "11984:5984"
    networks:
      - coffee-export
    secrets:
      - couchdb_password
    volumes:
      - couchdb6:/opt/couchdb/data
    restart: unless-stopped

  peer0.ecx.coffee-export.com:
    container_name: peer0.ecx.coffee-export.com
    image: hyperledger/fabric-peer:2.5.14
    labels:
      service: hyperledger-fabric
    environment:
      - FABRIC_LOGGING_SPEC=INFO
      - CORE_PEER_TLS_ENABLED=true
      - CORE_PEER_ID=peer0.ecx.coffee-export.com
      - CORE_PEER_ADDRESS=peer0.ecx.coffee-export.com:12051
      - CORE_PEER_LISTENADDRESS=0.0.0.0:12051
      - CORE_PEER_LOCALMSPID=ECXMSP
      - CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/fabric/msp
      - CORE_LEDGER_STATE_STATEDATABASE=CouchDB
      - CORE_LEDGER_STATE_COUCHDBCONFIG_COUCHDBADDRESS=couchdb6:5984
      - CORE_LEDGER_STATE_COUCHDBCONFIG_USERNAME=admin
      - CORE_LEDGER_STATE_COUCHDBCONFIG_PASSWORD_FILE=/run/secrets/couchdb_password
    ports:
      - 12051:12051
    networks:
      - coffee-export
    depends_on:
      - couchdb6
    secrets:
      - couchdb_password
    volumes:
      - ./organizations/peerOrganizations/ecx.coffee-export.com/peers/peer0.ecx.coffee-export.com:/etc/hyperledger/fabric
      - peer0.ecx.coffee-export.com:/var/hyperledger/production

  ecx-api:
    container_name: ecx-api
    build:
      context: ./api
      dockerfile: Dockerfile.base
    ports:
      - "3006:3006"
    environment:
      - NODE_ENV=production
      - PORT=3006
      - ORGANIZATION=ecx
    networks:
      - coffee-export
    depends_on:
      - postgres
      - peer0.ecx.coffee-export.com
EOF

echo "✅ ECX added to consortium"
