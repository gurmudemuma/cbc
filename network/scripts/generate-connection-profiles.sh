#!/bin/bash

# Generate connection profiles for all organizations

set -e

echo "Generating connection profiles..."

# Function to generate connection profile
generate_profile() {
    local ORG=$1
    local ORG_LOWER=$2
    local PORT=$3
    
    # Read and format the TLS CA certificate
    local PEER_PEM=$(cat ../organizations/peerOrganizations/${ORG_LOWER}.coffee-export.com/peers/peer0.${ORG_LOWER}.coffee-export.com/tls/ca.crt | sed 's/$/\\n/' | tr -d '\n')
    
    cat > "../organizations/peerOrganizations/${ORG_LOWER}.coffee-export.com/connection-${ORG_LOWER}.json" << PROFILE
{
  "name": "${ORG}-network",
  "version": "1.0.0",
  "client": {
    "organization": "${ORG}",
    "connection": {
      "timeout": {
        "peer": {
          "endorser": "300"
        }
      }
    }
  },
  "organizations": {
    "${ORG}": {
      "mspid": "${ORG}MSP",
      "peers": [
        "peer0.${ORG_LOWER}.coffee-export.com"
      ],
      "certificateAuthorities": [
        "ca.${ORG_LOWER}.coffee-export.com"
      ]
    }
  },
  "peers": {
    "peer0.${ORG_LOWER}.coffee-export.com": {
      "url": "grpcs://localhost:${PORT}",
      "tlsCACerts": {
        "pem": "${PEER_PEM}"
      },
      "grpcOptions": {
        "ssl-target-name-override": "peer0.${ORG_LOWER}.coffee-export.com",
        "hostnameOverride": "peer0.${ORG_LOWER}.coffee-export.com"
      }
    }
  }
}
PROFILE
    
    echo "Generated connection profile for ${ORG}"
}

# Generate profiles for all organizations
generate_profile "CommercialBank" "commercialbank" "7051"
generate_profile "NationalBank" "nationalbank" "8051"
generate_profile "ECTA" "ecta" "9051"
generate_profile "ShippingLine" "shippingline" "10051"
generate_profile "CustomAuthorities" "custom-authorities" "11051"

echo "Connection profiles generated successfully!"
