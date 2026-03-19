# Fabric CLI Usage Guide

## Overview
The Fabric CLI is an interactive container used for manual blockchain operations. It's not started by default with the main system to avoid blocking the startup process.

## Starting the CLI

### Option 1: Using the CLI startup script
```powershell
.\scripts\start-cli.bat
```

### Option 2: Manual Docker command
```powershell
docker-compose -f docker-compose-fabric.yml up cli
```

## Common CLI Operations

### 1. Create Channel
```bash
peer channel create -o orderer1.orderer.example.com:7050 \
  -c coffeechannel \
  -f ./channel-artifacts/coffeechannel.tx \
  --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem
```

### 2. Join Peer to Channel
```bash
peer channel join -b coffeechannel.block
```

### 3. Install Chaincode
```bash
peer lifecycle chaincode install ecta.tar.gz
```

### 4. Approve Chaincode
```bash
peer lifecycle chaincode approveformyorg \
  --channelID coffeechannel \
  --name ecta \
  --version 1.0 \
  --package-id <PACKAGE_ID> \
  --sequence 1 \
  --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem
```

### 5. Commit Chaincode
```bash
peer lifecycle chaincode commit \
  -C coffeechannel \
  -n ecta \
  -v 1.0 \
  --sequence 1 \
  -o orderer1.orderer.example.com:7050 \
  --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem
```

## Environment Variables in CLI

The CLI container has these pre-configured:
- `CORE_PEER_TLS_ENABLED=true`
- `CORE_PEER_LOCALMSPID=ECTAMSP`
- `CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt`
- `CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/ecta.example.com/users/Admin@ecta.example.com/msp`
- `CORE_PEER_ADDRESS=peer0.ecta.example.com:7051`

## Exiting the CLI

Press `Ctrl+C` to exit the CLI container.

## Notes

- The CLI is optional for normal system operation
- It's used for blockchain administration and debugging
- The main system runs without it to avoid startup delays
- Start it only when you need to perform blockchain operations
