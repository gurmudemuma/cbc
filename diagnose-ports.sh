#!/bin/bash

echo "🔍 Diagnosing Port Connectivity Issues"
echo "====================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}1. Checking Docker container status...${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(orderer|peer0)"

echo ""
echo -e "${BLUE}2. Testing internal container connectivity...${NC}"

# Test if services are running inside containers
echo "Testing orderer internal connectivity..."
if docker exec orderer.coffee-export.com netstat -ln 2>/dev/null | grep -q ":7050"; then
    echo -e "${GREEN}✅ Orderer is listening on port 7050 inside container${NC}"
else
    echo -e "${RED}❌ Orderer is not listening on port 7050 inside container${NC}"
fi

echo "Testing peer connectivity..."
PEERS=("peer0.commercialbank.coffee-export.com:7051" "peer0.nationalbank.coffee-export.com:8051" "peer0.ecta.coffee-export.com:9051" "peer0.shippingline.coffee-export.com:10051")

for peer_info in "${PEERS[@]}"; do
    IFS=':' read -r peer_name peer_port <<< "$peer_info"
    if docker exec "$peer_name" netstat -ln 2>/dev/null | grep -q ":$peer_port"; then
        echo -e "${GREEN}✅ $peer_name is listening on port $peer_port inside container${NC}"
    else
        echo -e "${RED}❌ $peer_name is not listening on port $peer_port inside container${NC}"
    fi
done

echo ""
echo -e "${BLUE}3. Testing host port accessibility...${NC}"

# Test if ports are accessible from host
PORTS=(7050 7051 8051 9051 10051)
for port in "${PORTS[@]}"; do
    if timeout 3 bash -c "</dev/tcp/localhost/$port" 2>/dev/null; then
        echo -e "${GREEN}✅ Port $port is accessible from host${NC}"
    else
        echo -e "${RED}❌ Port $port is not accessible from host${NC}"
    fi
done

echo ""
echo -e "${BLUE}4. Checking Windows firewall (if applicable)...${NC}"
if command -v netsh &> /dev/null; then
    echo "Windows detected - checking firewall rules..."
    # This might not work in Git Bash, but worth trying
    netsh advfirewall firewall show rule name="Docker" 2>/dev/null || echo "Could not check firewall rules"
else
    echo "Not on Windows or netsh not available"
fi

echo ""
echo -e "${BLUE}5. Testing with curl (if available)...${NC}"
if command -v curl &> /dev/null; then
    echo "Testing orderer with curl..."
    if curl -k --connect-timeout 3 https://localhost:7050 2>/dev/null; then
        echo -e "${GREEN}✅ Orderer responds to HTTPS${NC}"
    else
        echo -e "${YELLOW}⚠️ Orderer doesn't respond to HTTPS (this might be normal)${NC}"
    fi
else
    echo "curl not available for testing"
fi

echo ""
echo -e "${BLUE}6. Docker network inspection...${NC}"
echo "Checking coffee-export-network..."
docker network inspect coffee-export-network --format '{{json .IPAM.Config}}' 2>/dev/null || echo "Network inspection failed"

echo ""
echo -e "${BLUE}7. Suggested fixes:${NC}"
echo "If ports are not accessible from host:"
echo "1. Restart Docker Desktop"
echo "2. Run: docker-compose down && docker-compose up -d"
echo "3. Check Windows Defender Firewall settings"
echo "4. Try: netsh interface portproxy reset"
echo ""

echo -e "${YELLOW}Diagnosis complete. If services are running inside containers but not accessible from host, this is a Docker Desktop networking issue.${NC}"
