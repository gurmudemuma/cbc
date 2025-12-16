#!/bin/bash

# Docker-based anchor peer setup script
# This script runs configtxlator inside the CLI container to avoid local binary issues

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
export PATH=${SCRIPT_DIR}/../../bin:$PATH
export FABRIC_CFG_PATH=${SCRIPT_DIR}/../../config
source ${SCRIPT_DIR}/envVar.sh

CHANNEL_NAME=${1:-"coffeechannel"}

infoln() {
  echo "INFO: $1"
}

errorln() {
  echo "ERROR: $1"
}

successln() {
  echo "SUCCESS: $1"
}

# updateAnchorPeer <org> <channel_id>
updateAnchorPeer() {
  ORG=$1
  CHANNEL=$2
  setGlobals $ORG

  local orgmsp=""
  local host=""
  local port=""

  if [ $ORG -eq 1 ]; then
    orgmsp="CommercialBankMSP"
    host="peer0.commercialbank.coffee-export.com"
    port=7051
  elif [ $ORG -eq 2 ]; then
    orgmsp="NationalBankMSP"
    host="peer0.nationalbank.coffee-export.com"
    port=8051
  elif [ $ORG -eq 3 ]; then
    orgmsp="ECTAMSP"
    host="peer0.ecta.coffee-export.com"
    port=9051
  elif [ $ORG -eq 4 ]; then
    orgmsp="ShippingLineMSP"
    host="peer0.shippingline.coffee-export.com"
    port=10051
  elif [ $ORG -eq 5 ]; then
    orgmsp="CustomAuthoritiesMSP"
    host="peer0.custom-authorities.coffee-export.com"
    port=11051
  else
    errorln "Unknown organization: $ORG"
    exit 1
  fi

  infoln "Fetching channel config for channel $CHANNEL using Docker CLI"
  
  # Run all configtxlator operations inside the Docker CLI container
  docker exec cli bash -c "
    set -e
    export FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/config
    source /opt/gopath/src/github.com/hyperledger/fabric/peer/scripts/envVar.sh
    
    # Set globals for the organization
    case $ORG in
      1) export CORE_PEER_LOCALMSPID=CommercialBankMSP
         export CORE_PEER_ADDRESS=peer0.commercialbank.coffee-export.com:7051
         export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/commercialbank.coffee-export.com/peers/peer0.commercialbank.coffee-export.com/tls/ca.crt
         ;;
      2) export CORE_PEER_LOCALMSPID=NationalBankMSP
         export CORE_PEER_ADDRESS=peer0.nationalbank.coffee-export.com:8051
         export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/nationalbank.coffee-export.com/peers/peer0.nationalbank.coffee-export.com/tls/ca.crt
         ;;
      3) export CORE_PEER_LOCALMSPID=ECTAMSP
         export CORE_PEER_ADDRESS=peer0.ecta.coffee-export.com:9051
         export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/ecta.coffee-export.com/peers/peer0.ecta.coffee-export.com/tls/ca.crt
         ;;
      5) export CORE_PEER_LOCALMSPID=CustomAuthoritiesMSP
         export CORE_PEER_ADDRESS=peer0.custom-authorities.coffee-export.com:11051
         export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/custom-authorities.coffee-export.com/peers/peer0.custom-authorities.coffee-export.com/tls/ca.crt
         ;;
    esac
    
    export CORE_PEER_TLS_ENABLED=true
    export ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/msp/tlscacerts/tlsca.coffee-export.com-cert.pem
    
    # Fetch config block
    peer channel fetch config config_block.pb \
      -o orderer.coffee-export.com:7050 \
      --ordererTLSHostnameOverride orderer.coffee-export.com \
      -c $CHANNEL \
      --tls --cafile \$ORDERER_CA
    
    # Decode to JSON
    configtxlator proto_decode --input config_block.pb --type common.Block --output config_block.json
    jq .data.data[0].payload.data.config config_block.json > ${orgmsp}config.json
    
    # Check if anchor peer already exists
    if jq -e '.channel_group.groups.Application.groups.${orgmsp}.values.AnchorPeers' ${orgmsp}config.json >/dev/null 2>&1; then
      echo 'Anchor peer already configured, skipping update'
      exit 0
    fi
    
    # Create modified config with anchor peer
    jq '.channel_group.groups.Application.groups.${orgmsp}.values += {\"AnchorPeers\":{\"mod_policy\": \"Admins\",\"value\":{\"anchor_peers\": [{\"host\": \"${host}\",\"port\": ${port}}]},\"version\": 0}}' ${orgmsp}config.json > ${orgmsp}modified_config.json
    
    # Encode configs
    configtxlator proto_encode --input ${orgmsp}config.json --type common.Config --output original_config.pb
    configtxlator proto_encode --input ${orgmsp}modified_config.json --type common.Config --output modified_config.pb
    
    # Compute update
    configtxlator compute_update --channel_id $CHANNEL --original original_config.pb --updated modified_config.pb --output config_update.pb
    
    # Decode update
    configtxlator proto_decode --input config_update.pb --type common.ConfigUpdate --output config_update.json
    
    # Create envelope
    jq --arg channel \"$CHANNEL\" '{payload: {header: {channel_header: {channel_id: \$channel, type: 2}}, data: {config_update: .}}}' config_update.json > config_update_in_envelope.json
    
    # Encode envelope
    configtxlator proto_encode --input config_update_in_envelope.json --type common.Envelope --output ${orgmsp}anchors.tx
  " || {
    errorln "Docker CLI operation failed"
    return 1
  }

  # Copy the transaction file from Docker to host
  docker cp cli:/opt/gopath/src/github.com/hyperledger/fabric/peer/${orgmsp}anchors.tx ${SCRIPT_DIR}/${orgmsp}anchors.tx 2>/dev/null || true

  # Sign the transaction
  setGlobals $ORG
  if [ -f "${SCRIPT_DIR}/${orgmsp}anchors.tx" ]; then
    peer channel signconfigtx -f ${SCRIPT_DIR}/${orgmsp}anchors.tx
  fi

  # Submit the update
  setGlobals $ORG
  infoln "Updating anchor peer for org${ORG}..."
  
  if [ -f "${SCRIPT_DIR}/${orgmsp}anchors.tx" ]; then
    set -x
    peer channel update -o orderer.coffee-export.com:7050 --ordererTLSHostnameOverride orderer.coffee-export.com -c $CHANNEL -f ${SCRIPT_DIR}/${orgmsp}anchors.tx --tls --cafile "$ORDERER_CA" >&log.txt
    res=$?
    { set +x; } 2>/dev/null
    cat log.txt
    
    if [ $res -eq 0 ]; then
      successln "Anchor peer set for org '$orgmsp' on channel '$CHANNEL'"
      return 0
    else
      errorln "Anchor peer update failed"
      return 1
    fi
  else
    errorln "Transaction file not found"
    return 1
  fi
}

ORG=$1
CHANNEL_NAME=$2

if [ -z "$ORG" ] || [ -z "$CHANNEL_NAME" ]; then
  errorln "Usage: setAnchorPeer-docker.sh <org_number> <channel_name>"
  exit 1
fi

updateAnchorPeer $ORG $CHANNEL_NAME

exit 0
