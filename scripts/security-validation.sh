#!/bin/bash

# Security Validation Script for Coffee Export Blockchain
# This script validates security configurations and identifies potential issues

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
CRITICAL_ISSUES=0
WARNING_ISSUES=0
PASSED_CHECKS=0

echo -e "${BLUE}🔒 Coffee Export Blockchain Security Validation${NC}"
echo "=================================================="
echo ""

# Function to log results
log_critical() {
    echo -e "${RED}❌ CRITICAL: $1${NC}"
    ((CRITICAL_ISSUES++))
}

log_warning() {
    echo -e "${YELLOW}⚠️  WARNING: $1${NC}"
    ((WARNING_ISSUES++))
}

log_pass() {
    echo -e "${GREEN}✅ PASS: $1${NC}"
    ((PASSED_CHECKS++))
}

log_info() {
    echo -e "${BLUE}ℹ️  INFO: $1${NC}"
}

# Check 1: JWT Secret Security
echo -e "${BLUE}1. Checking JWT Secret Security...${NC}"
WEAK_SECRETS=$(grep -r "your-secret-key-change-in-production" api/ 2>/dev/null || true)
if [ -n "$WEAK_SECRETS" ]; then
    log_critical "Weak default JWT secrets found in production code"
    echo "$WEAK_SECRETS"
else
    log_pass "No weak default JWT secrets found"
fi

# Check for unique secrets across services
BANKER_SECRET=$(grep "JWT_SECRET=" api/commercial-bank/.env.example | cut -d'=' -f2)
NB_REG_SECRET=$(grep "JWT_SECRET=" api/national-bank/.env.example | cut -d'=' -f2)
EXPORTER_SECRET=$(grep "JWT_SECRET=" api/exporter/.env.example | cut -d'=' -f2)
ECTA_SECRET=$(grep "JWT_SECRET=" api/ncat/.env.example | cut -d'=' -f2)
SHIPPING_SECRET=$(grep "JWT_SECRET=" api/shipping-line/.env.example | cut -d'=' -f2)

if [ "$BANKER_SECRET" = "$NB_REG_SECRET" ] || [ "$BANKER_SECRET" = "$EXPORTER_SECRET" ] || [ "$BANKER_SECRET" = "$ECTA_SECRET" ] || [ "$BANKER_SECRET" = "$SHIPPING_SECRET" ]; then
    log_warning "JWT secrets are not unique across services"
else
    log_pass "JWT secrets are unique across services"
fi

# Check 2: TypeScript Strict Mode
echo -e "\n${BLUE}2. Checking TypeScript Configuration...${NC}"
STRICT_DISABLED=$(grep -r '"strict": false' api/*/tsconfig.json 2>/dev/null || true)
if [ -n "$STRICT_DISABLED" ]; then
    log_warning "TypeScript strict mode is disabled in some services"
    echo "$STRICT_DISABLED"
else
    log_pass "TypeScript strict mode is enabled"
fi

# Check 3: Environment Configuration
echo -e "\n${BLUE}3. Checking Environment Configuration...${NC}"
for service in banker nb-regulatory exporter ncat shipping-line custom-authorities; do
    if [ ! -f "api/$service/.env.production.example" ]; then
        log_warning "Missing production environment template for $service"
    else
        log_pass "Production environment template exists for $service"
    fi
done

# Check 4: Hardcoded Localhost
echo -e "\n${BLUE}4. Checking for Hardcoded Localhost...${NC}"
HARDCODED_LOCALHOST=$(grep -r "asLocalhost: true" api/*/src/fabric/gateway.ts 2>/dev/null || true)
if [ -n "$HARDCODED_LOCALHOST" ]; then
    log_warning "Hardcoded localhost discovery found"
    echo "$HARDCODED_LOCALHOST"
else
    log_pass "No hardcoded localhost discovery found"
fi

# Check 5: Password Validation
echo -e "\n${BLUE}5. Checking Password Validation...${NC}"
WEAK_PASSWORD_VALIDATION=$(grep -r "min: 6" api/*/src/middleware/validation.middleware.ts 2>/dev/null || true)
if [ -n "$WEAK_PASSWORD_VALIDATION" ]; then
    log_warning "Weak password validation found (minimum 6 characters)"
else
    log_pass "Strong password validation configured"
fi

# Check 6: Error Handling
echo -e "\n${BLUE}6. Checking Error Handling...${NC}"
EXPOSED_ERRORS=$(grep -r "error.message" api/*/src/controllers/ 2>/dev/null | grep -v "console.error" || true)
if [ -n "$EXPOSED_ERRORS" ]; then
    log_warning "Potential error information exposure found"
    echo "$EXPOSED_ERRORS" | head -5
else
    log_pass "Error handling appears secure"
fi

# Check 7: Rate Limiting
echo -e "\n${BLUE}7. Checking Rate Limiting Configuration...${NC}"
MISSING_RATE_LIMITS=0
for service in commercial-bank national-bank ncat shipping-line; do
    if ! grep -q "rateLimit" "api/$service/src/index.ts" 2>/dev/null; then
        log_warning "Rate limiting not found in $service"
        ((MISSING_RATE_LIMITS++))
    fi
done

if [ $MISSING_RATE_LIMITS -eq 0 ]; then
    log_pass "Rate limiting configured for all services"
fi

# Check 8: HTTPS/TLS Configuration
echo -e "\n${BLUE}8. Checking TLS Configuration...${NC}"
TLS_CONFIG_FOUND=0
for service in commercial-bank national-bank ncat shipping-line; do
    if grep -q "TLS_ENABLED" "api/$service/.env.production.example" 2>/dev/null; then
        ((TLS_CONFIG_FOUND++))
    fi
done

if [ $TLS_CONFIG_FOUND -eq 4 ]; then
    log_pass "TLS configuration templates found for all services"
else
    log_warning "TLS configuration missing in some services"
fi

# Check 9: Input Validation
echo -e "\n${BLUE}9. Checking Input Validation...${NC}"
VALIDATION_MIDDLEWARE_COUNT=$(find api/*/src/middleware/ -name "validation.middleware.ts" 2>/dev/null | wc -l)
if [ $VALIDATION_MIDDLEWARE_COUNT -eq 4 ]; then
    log_pass "Validation middleware found for all services"
else
    log_warning "Validation middleware missing in some services"
fi

# Check 10: Chaincode Input Validation
echo -e "\n${BLUE}10. Checking Chaincode Input Validation...${NC}"
if grep -q "cannot be empty" chaincode/coffee-export/contract.go 2>/dev/null; then
    log_pass "Input validation found in chaincode"
else
    log_warning "Input validation missing in chaincode"
fi

# Summary
echo ""
echo "=================================================="
echo -e "${BLUE}Security Validation Summary${NC}"
echo "=================================================="
echo -e "${GREEN}✅ Passed Checks: $PASSED_CHECKS${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARNING_ISSUES${NC}"
echo -e "${RED}❌ Critical Issues: $CRITICAL_ISSUES${NC}"
echo ""

# Recommendations
if [ $CRITICAL_ISSUES -gt 0 ]; then
    echo -e "${RED}🚨 CRITICAL ISSUES FOUND - DO NOT DEPLOY TO PRODUCTION${NC}"
    echo "Please fix all critical issues before deployment."
elif [ $WARNING_ISSUES -gt 0 ]; then
    echo -e "${YELLOW}⚠️  WARNINGS FOUND - REVIEW BEFORE PRODUCTION${NC}"
    echo "Consider addressing warnings for enhanced security."
else
    echo -e "${GREEN}🎉 ALL SECURITY CHECKS PASSED${NC}"
    echo "System appears to be secure for deployment."
fi

echo ""
echo "Next Steps:"
echo "1. Generate unique, strong JWT secrets for production"
echo "2. Configure TLS/SSL certificates"
echo "3. Set up monitoring and logging"
echo "4. Conduct penetration testing"
echo "5. Regular security audits"

# Exit with appropriate code
if [ $CRITICAL_ISSUES -gt 0 ]; then
    exit 1
elif [ $WARNING_ISSUES -gt 0 ]; then
    exit 2
else
    exit 0
fi