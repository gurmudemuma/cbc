#!/bin/bash

function createcommercialbank() {
  echo "Enrolling the CA admin for commercialbank"
  mkdir -p organizations/peerOrganizations/commercialbank.coffee-export.com/

  export FABRIC_CA_CLIENT_HOME=${PWD}/organizations/peerOrganizations/commercialbank.coffee-export.com/

  fabric-ca-client enroll -u https://admin:adminpw@localhost:7054 --caname ca-commercialbank --tls.certfiles "${PWD}/organizations/fabric-ca/commercialbank/tls-cert.pem"

  echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-commercialbank.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-commercialbank.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-commercialbank.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-commercialbank.pem
    OrganizationalUnitIdentifier: orderer' > "${PWD}/organizations/peerOrganizations/commercialbank.coffee-export.com/msp/config.yaml"

  echo "Registering peer0"
  fabric-ca-client register --caname ca-commercialbank --id.name peer0 --id.secret peer0pw --id.type peer --tls.certfiles "${PWD}/organizations/fabric-ca/commercialbank/tls-cert.pem"

  echo "Registering user"
  fabric-ca-client register --caname ca-commercialbank --id.name user1 --id.secret user1pw --id.type client --tls.certfiles "${PWD}/organizations/fabric-ca/commercialbank/tls-cert.pem"

  echo "Registering the org admin"
  fabric-ca-client register --caname ca-commercialbank --id.name commercialbankadmin --id.secret commercialbankadminpw --id.type admin --tls.certfiles "${PWD}/organizations/fabric-ca/commercialbank/tls-cert.pem"

  echo "Generating the peer0 msp"
  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:7054 --caname ca-commercialbank -M "${PWD}/organizations/peerOrganizations/commercialbank.coffee-export.com/peers/peer0.commercialbank.coffee-export.com/msp" --tls.certfiles "${PWD}/organizations/fabric-ca/commercialbank/tls-cert.pem"

  cp "${PWD}/organizations/peerOrganizations/commercialbank.coffee-export.com/msp/config.yaml" "${PWD}/organizations/peerOrganizations/commercialbank.coffee-export.com/peers/peer0.commercialbank.coffee-export.com/msp/config.yaml"

  echo "Generating the peer0-tls certificates"
  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:7054 --caname ca-commercialbank -M "${PWD}/organizations/peerOrganizations/commercialbank.coffee-export.com/peers/peer0.commercialbank.coffee-export.com/tls" --enrollment.profile tls --csr.hosts peer0.commercialbank.coffee-export.com --csr.hosts localhost --tls.certfiles "${PWD}/organizations/fabric-ca/commercialbank/tls-cert.pem"

  cp "${PWD}/organizations/peerOrganizations/commercialbank.coffee-export.com/peers/peer0.commercialbank.coffee-export.com/tls/tlscacerts/"* "${PWD}/organizations/peerOrganizations/commercialbank.coffee-export.com/peers/peer0.commercialbank.coffee-export.com/tls/ca.crt"
  cp "${PWD}/organizations/peerOrganizations/commercialbank.coffee-export.com/peers/peer0.commercialbank.coffee-export.com/tls/signcerts/"* "${PWD}/organizations/peerOrganizations/commercialbank.coffee-export.com/peers/peer0.commercialbank.coffee-export.com/tls/server.crt"
  cp "${PWD}/organizations/peerOrganizations/commercialbank.coffee-export.com/peers/peer0.commercialbank.coffee-export.com/tls/keystore/"* "${PWD}/organizations/peerOrganizations/commercialbank.coffee-export.com/peers/peer0.commercialbank.coffee-export.com/tls/server.key"

  mkdir -p "${PWD}/organizations/peerOrganizations/commercialbank.coffee-export.com/msp/tlscacerts"
  cp "${PWD}/organizations/peerOrganizations/commercialbank.coffee-export.com/peers/peer0.commercialbank.coffee-export.com/tls/tlscacerts/"* "${PWD}/organizations/peerOrganizations/commercialbank.coffee-export.com/msp/tlscacerts/ca.crt"

  mkdir -p "${PWD}/organizations/peerOrganizations/commercialbank.coffee-export.com/tlsca"
  cp "${PWD}/organizations/peerOrganizations/commercialbank.coffee-export.com/peers/peer0.commercialbank.coffee-export.com/tls/tlscacerts/"* "${PWD}/organizations/peerOrganizations/commercialbank.coffee-export.com/tlsca/tlsca.commercialbank.coffee-export.com-cert.pem"

  mkdir -p "${PWD}/organizations/peerOrganizations/commercialbank.coffee-export.com/ca"
  cp "${PWD}/organizations/peerOrganizations/commercialbank.coffee-export.com/peers/peer0.commercialbank.coffee-export.com/msp/cacerts/"* "${PWD}/organizations/peerOrganizations/commercialbank.coffee-export.com/ca/ca.commercialbank.coffee-export.com-cert.pem"

  echo "Generating the user msp"
  fabric-ca-client enroll -u https://user1:user1pw@localhost:7054 --caname ca-commercialbank -M "${PWD}/organizations/peerOrganizations/commercialbank.coffee-export.com/users/User1@commercialbank.coffee-export.com/msp" --tls.certfiles "${PWD}/organizations/fabric-ca/commercialbank/tls-cert.pem"

  cp "${PWD}/organizations/peerOrganizations/commercialbank.coffee-export.com/msp/config.yaml" "${PWD}/organizations/peerOrganizations/commercialbank.coffee-export.com/users/User1@commercialbank.coffee-export.com/msp/config.yaml"

  echo "Generating the org admin msp"
  fabric-ca-client enroll -u https://commercialbankadmin:commercialbankadminpw@localhost:7054 --caname ca-commercialbank -M "${PWD}/organizations/peerOrganizations/commercialbank.coffee-export.com/users/Admin@commercialbank.coffee-export.com/msp" --tls.certfiles "${PWD}/organizations/fabric-ca/commercialbank/tls-cert.pem"

  cp "${PWD}/organizations/peerOrganizations/commercialbank.coffee-export.com/msp/config.yaml" "${PWD}/organizations/peerOrganizations/commercialbank.coffee-export.com/users/Admin@commercialbank.coffee-export.com/msp/config.yaml"
}

# Note: This is a simplified version using cryptogen for demonstration
# In production, use Fabric CA as shown above

echo "Generating certificates using cryptogen..."

# Create crypto-config.yaml
cat > crypto-config.yaml <<EOF
OrdererOrgs:
  - Name: Orderer
    Domain: coffee-export.com
    EnableNodeOUs: true
    Specs:
      - Hostname: orderer

PeerOrgs:
  - Name: commercialbank
    Domain: commercialbank.coffee-export.com
    EnableNodeOUs: true
    Template:
      Count: 1
    Users:
      Count: 1

  - Name: NationalBank
    Domain: nationalbank.coffee-export.com
    EnableNodeOUs: true
    Template:
      Count: 1
    Users:
      Count: 1

  - Name: ECTA
    Domain: ecta.coffee-export.com
    EnableNodeOUs: true
    Template:
      Count: 1
    Users:
      Count: 1

  - Name: ShippingLine
    Domain: shippingline.coffee-export.com
    EnableNodeOUs: true
    Template:
      Count: 1
    Users:
      Count: 1
EOF

# Generate certificates
cryptogen generate --config=./crypto-config.yaml --output="organizations"

echo "Certificates generated successfully"
