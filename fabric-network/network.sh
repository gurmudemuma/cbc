#!/bin/bash

# Clean Fabric Network - Following Official Fabric Documentation
# Based on fabric-samples/test-network but for 6 organizations

set -e

CHANNEL_NAME="coffee-channel"
CHAINCODE_NAME="coffee-export"
CHAINCODE_VERSION="1.0"

# Organizations
ORGS=("commercial-bank" "national-bank" "ecta" "ecx" "shipping-line" "custom-authorities")
PORTS=(7051 8051 9051 10051 11051 12051)

function networkUp() {
    echo "🚀 Starting Hyperledger Fabric Network (6 Organizations)"
    
    # Generate crypto material
    cryptogen generate --config=./config/crypto-config.yaml --output="organizations"
    
    # Generate genesis block
    configtxgen -profile CoffeeOrdererGenesis -channelID system-channel -outputBlock ./system-genesis-block/genesis.block
    
    # Start network
    docker-compose -f docker/docker-compose.yml up -d
    
    echo "✅ Network started successfully"
}

function createChannel() {
    echo "📋 Creating channel: $CHANNEL_NAME"
    
    # Generate channel configuration
    configtxgen -profile CoffeeChannel -outputCreateChannelTx ./channel-artifacts/${CHANNEL_NAME}.tx -channelID $CHANNEL_NAME
    
    # Create channel
    docker exec cli peer channel create -o orderer.coffee-export.com:7050 -c $CHANNEL_NAME -f ./channel-artifacts/${CHANNEL_NAME}.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/msp/tlscacerts/tlsca.coffee-export.com-cert.pem
    
    # Join all peers to channel
    for i in "${!ORGS[@]}"; do
        org=${ORGS[$i]}
        port=${PORTS[$i]}
        echo "Joining $org to channel..."
        
        docker exec cli peer channel join -b ${CHANNEL_NAME}.block
    done
    
    echo "✅ Channel created and all peers joined"
}

function deployChaincode() {
    echo "📦 Deploying chaincode: $CHAINCODE_NAME"
    
    # Package chaincode
    docker exec cli peer lifecycle chaincode package ${CHAINCODE_NAME}.tar.gz --path /opt/gopath/src/github.com/chaincode/${CHAINCODE_NAME} --lang golang --label ${CHAINCODE_NAME}_${CHAINCODE_VERSION}
    
    # Install on all peers
    for org in "${ORGS[@]}"; do
        echo "Installing chaincode on $org..."
        docker exec cli peer lifecycle chaincode install ${CHAINCODE_NAME}.tar.gz
    done
    
    # Approve and commit
    docker exec cli peer lifecycle chaincode approveformyorg --channelID $CHANNEL_NAME --name $CHAINCODE_NAME --version $CHAINCODE_VERSION --package-id $(docker exec cli peer lifecycle chaincode queryinstalled | grep ${CHAINCODE_NAME} | awk '{print $3}' | sed 's/,//') --sequence 1 --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/msp/tlscacerts/tlsca.coffee-export.com-cert.pem
    
    docker exec cli peer lifecycle chaincode commit -o orderer.coffee-export.com:7050 --channelID $CHANNEL_NAME --name $CHAINCODE_NAME --version $CHAINCODE_VERSION --sequence 1 --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/msp/tlscacerts/tlsca.coffee-export.com-cert.pem
    
    echo "✅ Chaincode deployed successfully"
}

# Main execution
case "$1" in
    "up")
        networkUp
        ;;
    "channel")
        createChannel
        ;;
    "chaincode")
        deployChaincode
        ;;
    "down")
        docker-compose -f docker/docker-compose.yml down
        docker volume prune -f
        ;;
    *)
        echo "Usage: $0 {up|channel|chaincode|down}"
        ;;
esac
