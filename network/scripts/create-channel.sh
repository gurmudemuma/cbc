#!/bin/bash

# Import environment variables and functions
. scripts/envVar.sh

CHANNEL_NAME="$1"
DELAY="$2"
MAX_RETRY="$3"
VERBOSE="$4"

: ${CHANNEL_NAME:="coffeechannel"}
: ${DELAY:="3"}
: ${MAX_RETRY:="5"}
: ${VERBOSE:="false"}

FABRIC_CFG_PATH=$PWD/../configtx
BLOCKFILE="./channel-artifacts/${CHANNEL_NAME}.block"

if [ ! -d "channel-artifacts" ]; then
	mkdir channel-artifacts
fi

createChannelGenesisBlock() {
	which configtxgen
	if [ "$?" -ne 0 ]; then
		echo "configtxgen tool not found."
		exit 1
	fi
	set -x
	configtxgen -profile CoffeeExportGenesis -outputBlock ./channel-artifacts/${CHANNEL_NAME}.block -channelID $CHANNEL_NAME
	res=$?
	{ set +x; } 2>/dev/null
  cat log.txt
	if [ $res -ne 0 ]; then
		echo "Failed to generate channel configuration transaction..."
		exit 1
	fi
}

createChannel() {
	setGlobals 1
	# Poll in case the raft leader is not set yet
	local rc=1
	local COUNTER=1
	while [ $rc -ne 0 -a $COUNTER -lt $MAX_RETRY ] ; do
		sleep $DELAY
		set -x
		osnadmin channel join --channelID $CHANNEL_NAME --config-block ./channel-artifacts/${CHANNEL_NAME}.block -o orderer.coffee-export.com:7053 --ca-file "$ORDERER_CA" --client-cert "$ORDERER_ADMIN_TLS_SIGN_CERT" --client-key "$ORDERER_ADMIN_TLS_PRIVATE_KEY" >&log.txt
		res=$?
		{ set +x; } 2>/dev/null
		let rc=$res
		COUNTER=$(expr $COUNTER + 1)
	done
	cat log.txt
	if [ $rc -ne 0 ]; then
		echo "Failed to create channel '$CHANNEL_NAME'"
		exit 1
	fi
}

# joinChannel ORG
joinChannel() {
  FABRIC_CFG_PATH=$PWD/../config/
  ORG=$1
  setGlobals $ORG
	local rc=1
	local COUNTER=1
	## Sometimes Join takes time, hence retry
	while [ $rc -ne 0 -a $COUNTER -lt $MAX_RETRY ] ; do
    sleep $DELAY
    set -x
    peer channel join -b $BLOCKFILE >&log.txt
    res=$?
    { set +x; } 2>/dev/null
		let rc=$res
		COUNTER=$(expr $COUNTER + 1)
	done
	cat log.txt
	if [ $res -ne 0 ]; then
		echo "Failed to join peer to channel '$CHANNEL_NAME'"
		exit 1
	fi
}

setAnchorPeer() {
  ORG=$1
  docker exec cli ./scripts/setAnchorPeer.sh $ORG $CHANNEL_NAME 
}

FABRIC_CFG_PATH=${PWD}/configtx

## Create channel genesis block
echo "Generating channel genesis block '${CHANNEL_NAME}.block'"
createChannelGenesisBlock

FABRIC_CFG_PATH=$PWD/../config/
BLOCKFILE="./channel-artifacts/${CHANNEL_NAME}.block"

## Create channel
echo "Creating channel ${CHANNEL_NAME}"
createChannel

## Join all the peers to the channel
echo "Joining ExporterBank peer to the channel..."
joinChannel 1
echo "Joining NationalBank peer to the channel..."
joinChannel 2
echo "Joining NCAT peer to the channel..."
joinChannel 3
echo "Joining ShippingLine peer to the channel..."
joinChannel 4

## Set the anchor peers for each org in the channel
echo "Setting anchor peer for ExporterBank..."
setAnchorPeer 1
echo "Setting anchor peer for NationalBank..."
setAnchorPeer 2
echo "Setting anchor peer for NCAT..."
setAnchorPeer 3
echo "Setting anchor peer for ShippingLine..."
setAnchorPeer 4

echo "Channel '$CHANNEL_NAME' created and peers joined successfully"
