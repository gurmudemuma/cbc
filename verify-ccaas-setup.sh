#!/bin/bash

# CCAAS Setup Verification Script
# Verifies that all CCAAS components are properly configured

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}CCAAS Setup Verification${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check 1: CCAAS Builder Scripts
echo -e "${YELLOW}[1/10] Checking CCAAS Builder Scripts...${NC}"
if [ -x "builders/ccaas/bin/detect" ] && [ -x "builders/ccaas/bin/build" ] && [ -x "builders/ccaas/bin/release" ]; then
    echo -e "${GREEN}✓ All builder scripts present and executable${NC}"
else
    echo -e "${RED}✗ Missing or non-executable builder scripts${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check 2: Chaincode Metadata
echo -e "\n${YELLOW}[2/10] Checking Chaincode Metadata...${NC}"
if [ -f "chaincode/coffee-export/ccaas-package/metadata.json" ]; then
    if grep -q '"type".*"ccaas"' chaincode/coffee-export/ccaas-package/metadata.json; then
        echo -e "${GREEN}✓ Metadata.json configured as CCAAS${NC}"
    else
        echo -e "${RED}✗ Metadata.json not configured as CCAAS${NC}"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}✗ Metadata.json not found${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check 3: Core Configuration
echo -e "\n${YELLOW}[3/10] Checking Core Configuration...${NC}"
if grep -q "ccaas_builder" config/core.yaml; then
    if grep -q "propagateEnvironment:" config/core.yaml; then
        echo -e "${GREEN}✓ Core.yaml configured with CCAAS builder${NC}"
    else
        echo -e "${RED}✗ Core.yaml missing propagateEnvironment${NC}"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}✗ Core.yaml missing CCAAS builder configuration${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check 4: Network Docker Compose
echo -e "\n${YELLOW}[4/10] Checking Network Docker Compose...${NC}"
CCAAS_COUNT=$(grep -c "CHAINCODE_AS_A_SERVICE_BUILDER_CONFIG" network/docker/docker-compose.yaml || echo 0)
if [ "$CCAAS_COUNT" -eq 5 ]; then
    echo -e "${GREEN}✓ All 5 peers configured with CCAAS builder config${NC}"
else
    echo -e "${YELLOW}⚠ Found $CCAAS_COUNT CCAAS configurations (expected 5)${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# Check 5: Docker Compose CCAAS File
echo -e "\n${YELLOW}[5/10] Checking Docker Compose CCAAS File...${NC}"
if [ -f "docker-compose-ccaas.yml" ]; then
    if grep -q "coffee-export-ccaas" docker-compose-ccaas.yml; then
        echo -e "${GREEN}✓ docker-compose-ccaas.yml exists and configured${NC}"
    else
        echo -e "${RED}✗ docker-compose-ccaas.yml not properly configured${NC}"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}✗ docker-compose-ccaas.yml not found${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check 6: Chaincode Dockerfile
echo -e "\n${YELLOW}[6/10] Checking Chaincode Dockerfile...${NC}"
if [ -f "chaincode/coffee-export/Dockerfile" ]; then
    if grep -q "EXPOSE 7052" chaincode/coffee-export/Dockerfile; then
        echo -e "${GREEN}✓ Dockerfile exists and exposes port 7052${NC}"
    else
        echo -e "${YELLOW}⚠ Dockerfile exists but may not expose correct port${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${RED}✗ Dockerfile not found${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check 7: Deployment Guide
echo -e "\n${YELLOW}[7/10] Checking Documentation...${NC}"
if [ -f "CCAAS_DEPLOYMENT_GUIDE.md" ]; then
    echo -e "${GREEN}✓ CCAAS_DEPLOYMENT_GUIDE.md exists${NC}"
else
    echo -e "${YELLOW}⚠ CCAAS_DEPLOYMENT_GUIDE.md not found${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# Check 8: Deployment Script
echo -e "\n${YELLOW}[8/10] Checking Deployment Script...${NC}"
if [ -x "deploy-ccaas.sh" ]; then
    echo -e "${GREEN}✓ deploy-ccaas.sh exists and is executable${NC}"
else
    echo -e "${YELLOW}⚠ deploy-ccaas.sh not found or not executable${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# Check 9: Implementation Summary
echo -e "\n${YELLOW}[9/10] Checking Implementation Summary...${NC}"
if [ -f "CCAAS_IMPLEMENTATION_COMPLETE.md" ]; then
    echo -e "${GREEN}✓ CCAAS_IMPLEMENTATION_COMPLETE.md exists${NC}"
else
    echo -e "${YELLOW}⚠ CCAAS_IMPLEMENTATION_COMPLETE.md not found${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# Check 10: Chaincode Source
echo -e "\n${YELLOW}[10/10] Checking Chaincode Source...${NC}"
if [ -f "chaincode/coffee-export/main.go" ]; then
    echo -e "${GREEN}✓ Chaincode source files present${NC}"
else
    echo -e "${RED}✗ Chaincode source files not found${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Summary
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Verification Summary${NC}"
echo -e "${BLUE}========================================${NC}"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo -e "${GREEN}CCAAS setup is complete and ready for deployment.${NC}"
    echo ""
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "1. Run: ./deploy-ccaas.sh"
    echo "2. Follow the CLI commands provided"
    echo "3. Verify deployment with: docker logs -f coffee-export-ccaas"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}✓ Setup complete with $WARNINGS warning(s)${NC}"
    echo -e "${YELLOW}Review warnings above before deployment${NC}"
    exit 0
else
    echo -e "${RED}✗ Setup incomplete with $ERRORS error(s)${NC}"
    echo -e "${RED}Please fix errors before deployment${NC}"
    exit 1
fi
