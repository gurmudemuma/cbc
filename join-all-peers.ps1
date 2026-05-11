# Join all peers to coffeechannel

# NBE
Write-Host "Joining NBE peer..."
docker exec -e CORE_PEER_LOCALMSPID=NBEMSP -e CORE_PEER_ADDRESS=peer0.nbe.example.com:10051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/nbe.example.com/peers/peer0.nbe.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/nbe.example.com/users/Admin@nbe.example.com/msp cli peer channel join -b coffeechannel.block

# Customs
Write-Host "Joining Customs peer..."
docker exec -e CORE_PEER_LOCALMSPID=CustomsMSP -e CORE_PEER_ADDRESS=peer0.customs.example.com:11051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/customs.example.com/peers/peer0.customs.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/customs.example.com/users/Admin@customs.example.com/msp cli peer channel join -b coffeechannel.block

# Shipping
Write-Host "Joining Shipping peer..."
docker exec -e CORE_PEER_LOCALMSPID=ShippingMSP -e CORE_PEER_ADDRESS=peer0.shipping.example.com:12051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/shipping.example.com/peers/peer0.shipping.example.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/shipping.example.com/users/Admin@shipping.example.com/msp cli peer channel join -b coffeechannel.block

Write-Host "All peers joined successfully!"
