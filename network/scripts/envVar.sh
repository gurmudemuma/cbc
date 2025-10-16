#!/bin/bash

# Environment variables for peer commands

export CORE_PEER_TLS_ENABLED=true
export ORDERER_CA=${PWD}/organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/msp/tlscacerts/tlsca.coffee-export.com-cert.pem
export ORDERER_ADMIN_TLS_SIGN_CERT=${PWD}/organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/tls/server.crt
export ORDERER_ADMIN_TLS_PRIVATE_KEY=${PWD}/organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/tls/server.key

# setGlobals <ORG>
setGlobals() {
  local USING_ORG=""
  if [ -z "$OVERRIDE_ORG" ]; then
    USING_ORG=$1
  else
    USING_ORG="${OVERRIDE_ORG}"
  fi
  
  if [ $USING_ORG -eq 1 ]; then
    export CORE_PEER_LOCALMSPID="ExporterBankMSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=$PWD/organizations/peerOrganizations/exporterbank.coffee-export.com/peers/peer0.exporterbank.coffee-export.com/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=$PWD/organizations/peerOrganizations/exporterbank.coffee-export.com/users/Admin@exporterbank.coffee-export.com/msp
    export CORE_PEER_ADDRESS=localhost:7051
    export CORE_PEER_TLS_SERVERHOSTOVERRIDE=peer0.exporterbank.coffee-export.com
  elif [ $USING_ORG -eq 2 ]; then
    export CORE_PEER_LOCALMSPID="NationalBankMSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=$PWD/organizations/peerOrganizations/nationalbank.coffee-export.com/peers/peer0.nationalbank.coffee-export.com/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=$PWD/organizations/peerOrganizations/nationalbank.coffee-export.com/users/Admin@nationalbank.coffee-export.com/msp
    export CORE_PEER_ADDRESS=localhost:8051
    export CORE_PEER_TLS_SERVERHOSTOVERRIDE=peer0.nationalbank.coffee-export.com
  elif [ $USING_ORG -eq 3 ]; then
    export CORE_PEER_LOCALMSPID="NCATMSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=$PWD/organizations/peerOrganizations/ncat.coffee-export.com/peers/peer0.ncat.coffee-export.com/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=$PWD/organizations/peerOrganizations/ncat.coffee-export.com/users/Admin@ncat.coffee-export.com/msp
    export CORE_PEER_ADDRESS=localhost:9051
    export CORE_PEER_TLS_SERVERHOSTOVERRIDE=peer0.ncat.coffee-export.com
  elif [ $USING_ORG -eq 4 ]; then
    export CORE_PEER_LOCALMSPID="ShippingLineMSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=$PWD/organizations/peerOrganizations/shippingline.coffee-export.com/peers/peer0.shippingline.coffee-export.com/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=$PWD/organizations/peerOrganizations/shippingline.coffee-export.com/users/Admin@shippingline.coffee-export.com/msp
    export CORE_PEER_ADDRESS=localhost:10051
    export CORE_PEER_TLS_SERVERHOSTOVERRIDE=peer0.shippingline.coffee-export.com
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
    export CORE_PEER_ADDRESS=peer0.exporterbank.coffee-export.com:7051
  elif [ $USING_ORG -eq 2 ]; then
    export CORE_PEER_ADDRESS=peer0.nationalbank.coffee-export.com:8051
  elif [ $USING_ORG -eq 3 ]; then
    export CORE_PEER_ADDRESS=peer0.ncat.coffee-export.com:9051
  elif [ $USING_ORG -eq 4 ]; then
    export CORE_PEER_ADDRESS=peer0.shippingline.coffee-export.com:10051
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
      PEER_HOST="peer0.exporterbank.coffee-export.com"
      PEER_PORT="7051"
    elif [ $ORG -eq 2 ]; then
      PEER_HOST="peer0.nationalbank.coffee-export.com"
      PEER_PORT="8051"
    elif [ $ORG -eq 3 ]; then
      PEER_HOST="peer0.ncat.coffee-export.com"
      PEER_PORT="9051"
    elif [ $ORG -eq 4 ]; then
      PEER_HOST="peer0.shippingline.coffee-export.com"
      PEER_PORT="10051"
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
