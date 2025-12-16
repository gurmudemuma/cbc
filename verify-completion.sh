#!/bin/bash

echo "========================================="
echo "Coffee Export Consortium - Completion Verification"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
        return 0
    else
        echo -e "${RED}✗${NC} $1"
        return 1
    fi
}

echo "1. Documentation Files"
echo "----------------------"
check_file "README.md"
check_file "CONTRIBUTING.md"
check_file "CHANGELOG.md"
check_file "SECURITY.md"
check_file "docs/SETUP.md"
check_file "docs/ARCHITECTURE.md"
check_file "docs/DEPLOYMENT.md"
check_file "docs/PERFORMANCE.md"
check_file "docs/api-spec.yaml"
echo ""

echo "2. Test Files"
echo "-------------"
check_file "chaincode/coffee-export/contract_test.go"
check_file "apis/commercial-bank/src/__tests__/auth.test.ts"
check_file "apis/national-bank/src/__tests__/fx-rates.test.ts"
check_file "apis/shared/__tests__/integration.test.ts"
check_file "frontend/src/__tests__/App.test.tsx"
echo ""

echo "3. Test Count"
echo "-------------"
TEST_COUNT=$(find . -path "*/node_modules" -prune -o \( -name "*.test.ts" -o -name "*.test.tsx" -o -name "*_test.go" \) -type f -print | grep -v node_modules | wc -l)
echo "Total test files: $TEST_COUNT"
echo ""

echo "4. Documentation Stats"
echo "----------------------"
DOC_COUNT=$(find docs -type f 2>/dev/null | wc -l)
echo "Documentation files: $DOC_COUNT"
echo ""

echo "5. Project Structure"
echo "--------------------"
echo "APIs: $(ls -d apis/*/ 2>/dev/null | wc -l) services"
echo "Chaincodes: $(ls -d chaincode/*/ 2>/dev/null | wc -l) contracts"
echo "Scripts: $(ls scripts/*.sh 2>/dev/null | wc -l) scripts"
echo ""

echo "========================================="
echo "Verification Complete!"
echo "========================================="
