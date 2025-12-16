#!/bin/bash

# Environment variables for peer commands

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
NETWORK_DIR=$(dirname $SCRIPT_DIR)

export CORE_PEER_TLS_ENABLED=true
export ORDERER_CA=${NETWORK_DIR}/organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/msp/tlscacerts/tlsca.coffee-export.com-cert.pem
export ORDERER_ADMIN_TLS_SIGN_CERT=${NETWORK_DIR}/organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/tls/server.crt
export ORDERER_ADMIN_TLS_PRIVATE_KEY=${NETWORK_DIR}/organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/tls/server.key

# setGlobals <ORG>
setGlobals() {
  local USING_ORG=""
  if [ -z "$OVERRIDE_ORG" ]; then
    USING_ORG=$1
  else
    USING_ORG="${OVERRIDE_ORG}"
  fi
  
  if [ $USING_ORG -eq 1 ]; then
    export CORE_PEER_LOCALMSPID="CommercialBankMSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=${NETWORK_DIR}/organizations/peerOrganizations/commercialbank.coffee-export.com/peers/peer0.commercialbank.coffee-export.com/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=${NETWORK_DIR}/organizations/peerOrganizations/commercialbank.coffee-export.com/users/Admin@commercialbank.coffee-export.com/msp
    export CORE_PEER_ADDRESS=localhost:7051
    export CORE_PEER_TLS_SERVERHOSTOVERRIDE=peer0.commercialbank.coffee-export.com
  elif [ $USING_ORG -eq 2 ]; then
    export CORE_PEER_LOCALMSPID="NationalBankMSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=${NETWORK_DIR}/organizations/peerOrganizations/nationalbank.coffee-export.com/peers/peer0.nationalbank.coffee-export.com/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=${NETWORK_DIR}/organizations/peerOrganizations/nationalbank.coffee-export.com/users/Admin@nationalbank.coffee-export.com/msp
    export CORE_PEER_ADDRESS=localhost:8051
    export CORE_PEER_TLS_SERVERHOSTOVERRIDE=peer0.nationalbank.coffee-export.com
  elif [ $USING_ORG -eq 3 ]; then
    export CORE_PEER_LOCALMSPID="ECTAMSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=${NETWORK_DIR}/organizations/peerOrganizations/ecta.coffee-export.com/peers/peer0.ecta.coffee-export.com/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=${NETWORK_DIR}/organizations/peerOrganizations/ecta.coffee-export.com/users/Admin@ecta.coffee-export.com/msp
    export CORE_PEER_ADDRESS=localhost:9051
    export CORE_PEER_TLS_SERVERHOSTOVERRIDE=peer0.ecta.coffee-export.com
  elif [ $USING_ORG -eq 4 ]; then
    export CORE_PEER_LOCALMSPID="ShippingLineMSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=${NETWORK_DIR}/organizations/peerOrganizations/shippingline.coffee-export.com/peers/peer0.shippingline.coffee-export.com/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=${NETWORK_DIR}/organizations/peerOrganizations/shippingline.coffee-export.com/users/Admin@shippingline.coffee-export.com/msp
    export CORE_PEER_ADDRESS=localhost:10051
    export CORE_PEER_TLS_SERVERHOSTOVERRIDE=peer0.shippingline.coffee-export.com
  elif [ $USING_ORG -eq 5 ]; then
    export CORE_PEER_LOCALMSPID="CustomAuthoritiesMSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=${NETWORK_DIR}/organizations/peerOrganizations/custom-authorities.coffee-export.com/peers/peer0.custom-authorities.coffee-export.com/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=${NETWORK_DIR}/organizations/peerOrganizations/custom-authorities.coffee-export.com/users/Admin@custom-authorities.coffee-export.com/msp
    export CORE_PEER_ADDRESS=localhost:11051
    export CORE_PEER_TLS_SERVERHOSTOVERRIDE=peer0.custom-authorities.coffee-export.com
  else
    echo "================== ERROR !!! ORG Unknown =================="
  fi

  if [ "$VERBOSE" == "true" ]; then
    env | grep CORE
  fi
}

# Set environment variables for use in the CLI container
# Inside Docker, use internal DNS names and remove TLS hostname override
setGlobalsCLI() {
  setGlobals $1

  local USING_ORG=""
  if [ -z "$OVERRIDE_ORG" ]; then
    USING_ORG=$1
  else
    USING_ORG="${OVERRIDE_ORG}"
  fi
  
  if [ $USING_ORG -eq 1 ]; then
    export CORE_PEER_ADDRESS=peer0.commercialbank.coffee-export.com:7051
  elif [ $USING_ORG -eq 2 ]; then
    export CORE_PEER_ADDRESS=peer0.nationalbank.coffee-export.com:8051
  elif [ $USING_ORG -eq 3 ]; then
    export CORE_PEER_ADDRESS=peer0.ecta.coffee-export.com:9051
  elif [ $USING_ORG -eq 4 ]; then
    export CORE_PEER_ADDRESS=peer0.shippingline.coffee-export.com:10051
  elif [ $USING_ORG -eq 5 ]; then
    export CORE_PEER_ADDRESS=peer0.custom-authorities.coffee-export.com:11051
  else
    echo "================== ERROR !!! ORG Unknown =================="
  fi
  
  # Inside Docker network, hostnames match certificates, so remove override
  unset CORE_PEER_TLS_SERVERHOSTOVERRIDE
}

# parsePeerConnectionParameters $@
# Helper function that sets the peer connection parameters for a chaincode operation
# For multi-peer operations (commit), use actual hostnames to avoid TLS hostname override issues
parsePeerConnectionParameters() {
  PEER_CONN_PARMS=()
  PEERS=""
  while [ "$#" -gt 0 ]; do
    local ORG=$1
    setGlobals $ORG
    PEER="peer0.org$ORG"
    
    ## Set peer addresses - use actual hostnames with correct ports for commit operations
    local PEER_HOST
    local PEER_PORT
    if [ $ORG -eq 1 ]; then
      PEER_HOST="peer0.commercialbank.coffee-export.com"
      PEER_PORT="7051"
    elif [ $ORG -eq 2 ]; then
      PEER_HOST="peer0.nationalbank.coffee-export.com"
      PEER_PORT="8051"
    elif [ $ORG -eq 3 ]; then
      PEER_HOST="peer0.ecta.coffee-export.com"
      PEER_PORT="9051"
    elif [ $ORG -eq 4 ]; then
      PEER_HOST="peer0.shippingline.coffee-export.com"
      PEER_PORT="10051"
    elif [ $ORG -eq 5 ]; then
      PEER_HOST="peer0.custom-authorities.coffee-export.com"
      PEER_PORT="11051"
    fi
    
    ## Set peer addresses
    if [ -z "$PEERS" ]
    then
	PEERS="$PEER"
    else
	PEERS="$PEERS $PEER"
    fi
    PEER_CONN_PARMS=("${PEER_CONN_PARMS[@]}" --peerAddresses ${PEER_HOST}:${PEER_PORT})
    ## Set path to TLS certificate
    TLSINFO=(--tlsRootCertFiles "${CORE_PEER_TLS_ROOTCERT_FILE}")
    PEER_CONN_PARMS=("${PEER_CONN_PARMS[@]}" "${TLSINFO[@]}")
    # shift by one to get to the next organization
    shift
  done
}

verifyResult() {
  if [ $1 -ne 0 ]; then
    echo "!!!!!!!!!!!!!!! "$2" !!!!!!!!!!!!!!!!"
    echo
    exit 1
  fi
}
