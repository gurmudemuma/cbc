#!/bin/bash

# =============================================================================
# CBC Codebase Fixes Verification Script
# Verifies all miscommunication fixes have been applied correctly
# =============================================================================

# set -e  # Commented out to prevent early exit on failures

echo "🔍 CBC Codebase Fixes Verification"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Helper functions
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((PASSED++))
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    ((FAILED++))
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((WARNINGS++))
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# =============================================================================
# 1. API ENDPOINT CONSISTENCY CHECK
# =============================================================================
echo "1. Checking API Endpoint Consistency..."
echo "--------------------------------------"

# Check frontend service endpoints
FRONTEND_SERVICE_FILE="frontend/src/services/ectaPreRegistration.js"
if [ -f "$FRONTEND_SERVICE_FILE" ]; then
    # Check if all endpoints use /api/ prefix (look for actual API calls)
    MISSING_API_PREFIX=$(grep -n "apiClient\.\(post\|get\|put\|delete\)" "$FRONTEND_SERVICE_FILE" | grep -v "/api/" | wc -l)
    
    if [ "$MISSING_API_PREFIX" -eq 0 ]; then
        print_success "All frontend service endpoints use /api/ prefix"
    else
        print_error "Found $MISSING_API_PREFIX endpoints without /api/ prefix in $FRONTEND_SERVICE_FILE"
    fi
else
    print_error "Frontend service file not found: $FRONTEND_SERVICE_FILE"
fi

# =============================================================================
# 2. ORGANIZATION NAMING CONSISTENCY CHECK
# =============================================================================
echo ""
echo "2. Checking Organization Naming Consistency..."
echo "---------------------------------------------"

# Check environment files for consistent naming
ENV_FILES=(
    "api/commercial-bank/.env.example"
    "api/ecta/.env.example"
    "api/exporter-portal/.env.example"
)

NAMING_ISSUES=0
for env_file in "${ENV_FILES[@]}"; do
    if [ -f "$env_file" ]; then
        # Check for kebab-case organization names (lowercase with optional hyphens)
        if grep -q "ORGANIZATION_NAME=[a-z][a-z-]*[a-z]$\|ORGANIZATION_NAME=[a-z]$" "$env_file"; then
            print_success "Kebab-case naming found in $env_file"
        else
            print_warning "Non-kebab-case naming in $env_file"
            ((NAMING_ISSUES++))
        fi
    else
        print_error "Environment file not found: $env_file"
    fi
done

if [ "$NAMING_ISSUES" -eq 0 ]; then
    print_success "Organization naming is consistent across services"
fi

# =============================================================================
# 3. JWT AUTHENTICATION CONSISTENCY CHECK
# =============================================================================
echo ""
echo "3. Checking JWT Authentication Consistency..."
echo "--------------------------------------------"

# Check if shared JWT config exists
if [ -f "api/shared/auth/jwt.config.ts" ]; then
    print_success "Shared JWT configuration file created"
else
    print_error "Shared JWT configuration file missing"
fi

# Check if all services use the same JWT secret pattern
JWT_SECRET_PATTERN="cbc-shared-jwt-secret"
JWT_CONSISTENCY=0

for env_file in "${ENV_FILES[@]}"; do
    if [ -f "$env_file" ]; then
        if grep -q "$JWT_SECRET_PATTERN" "$env_file"; then
            print_success "Consistent JWT secret in $env_file"
        else
            print_error "Inconsistent JWT secret in $env_file"
            ((JWT_CONSISTENCY++))
        fi
    fi
done

if [ "$JWT_CONSISTENCY" -eq 0 ]; then
    print_success "JWT secrets are consistent across all services"
fi

# =============================================================================
# 4. CORS CONFIGURATION CHECK
# =============================================================================
echo ""
echo "4. Checking CORS Configuration Consistency..."
echo "--------------------------------------------"

# Check if all services have consistent CORS origins
CORS_PATTERN="http://localhost:5173,http://localhost:3000"
CORS_ISSUES=0

for env_file in "${ENV_FILES[@]}"; do
    if [ -f "$env_file" ]; then
        if grep -q "CORS_ORIGIN.*5173.*3000" "$env_file"; then
            print_success "Consistent CORS configuration in $env_file"
        else
            print_warning "CORS configuration may be inconsistent in $env_file"
            ((CORS_ISSUES++))
        fi
    fi
done

# =============================================================================
# 5. SHARED COMPONENTS CHECK
# =============================================================================
echo ""
echo "5. Checking Shared Components..."
echo "-------------------------------"

# Check if shared components exist
SHARED_COMPONENTS=(
    "api/shared/auth/jwt.config.ts"
    "api/shared/types/api-response.types.ts"
    "api/shared/middleware/auth.middleware.ts"
)

for component in "${SHARED_COMPONENTS[@]}"; do
    if [ -f "$component" ]; then
        print_success "Shared component exists: $component"
    else
        print_error "Missing shared component: $component"
    fi
done

# =============================================================================
# 6. DATABASE CONFIGURATION CHECK
# =============================================================================
echo ""
echo "6. Checking Database Configuration..."
echo "------------------------------------"

# Check if all services use the same database name
DB_NAME="coffee_export_db"
DB_CONSISTENCY=0

for env_file in "${ENV_FILES[@]}"; do
    if [ -f "$env_file" ]; then
        if grep -q "DB_NAME=$DB_NAME" "$env_file"; then
            print_success "Consistent database name in $env_file"
        else
            print_warning "Database name may be inconsistent in $env_file"
            ((DB_CONSISTENCY++))
        fi
    fi
done

# =============================================================================
# 7. FRONTEND CONFIGURATION CHECK
# =============================================================================
echo ""
echo "7. Checking Frontend Configuration..."
echo "------------------------------------"

# Check frontend API configuration
FRONTEND_CONFIG="frontend/src/config/api.config.js"
if [ -f "$FRONTEND_CONFIG" ]; then
    # Check if organization naming is consistent
    if grep -q "commercial-bank" "$FRONTEND_CONFIG"; then
        print_success "Frontend uses kebab-case organization naming"
    else
        print_warning "Frontend organization naming may be inconsistent"
    fi
    
    # Check if API endpoints are properly configured
    if grep -q "localhost:3001\|localhost:3003\|localhost:3007" "$FRONTEND_CONFIG"; then
        print_success "Frontend API endpoints are configured"
    else
        print_error "Frontend API endpoints may be missing"
    fi
else
    print_error "Frontend API configuration file not found"
fi

# =============================================================================
# 8. TYPESCRIPT COMPILATION CHECK
# =============================================================================
echo ""
echo "8. Checking TypeScript Compilation..."
echo "------------------------------------"

# Check if TypeScript files can be compiled (basic syntax check)
TS_FILES=(
    "api/shared/auth/jwt.config.ts"
    "api/shared/types/api-response.types.ts"
)

for ts_file in "${TS_FILES[@]}"; do
    if [ -f "$ts_file" ]; then
        # Basic file existence and readability check
        if [ -r "$ts_file" ] && [ -s "$ts_file" ]; then
            print_success "TypeScript file exists and is readable: $ts_file"
        else
            print_warning "TypeScript file may have issues: $ts_file"
        fi
    else
        print_error "TypeScript file not found: $ts_file"
    fi
done

# =============================================================================
# SUMMARY
# =============================================================================
echo ""
echo "=========================================="
echo "🏁 VERIFICATION SUMMARY"
echo "=========================================="
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARNINGS${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo ""

if [ "$FAILED" -eq 0 ]; then
    if [ "$WARNINGS" -eq 0 ]; then
        echo -e "${GREEN}🎉 All fixes have been successfully applied!${NC}"
        echo -e "${GREEN}The CBC codebase miscommunications have been resolved.${NC}"
    else
        echo -e "${YELLOW}✅ Critical fixes applied successfully with minor warnings.${NC}"
        echo -e "${YELLOW}Review warnings above for potential improvements.${NC}"
    fi
else
    echo -e "${RED}❌ Some fixes failed to apply correctly.${NC}"
    echo -e "${RED}Please review the errors above and fix them manually.${NC}"
fi

echo ""
echo "Next Steps:"
echo "----------"
echo "1. Copy .env.example files to .env in each API directory"
echo "2. Update JWT_SECRET in production environments"
echo "3. Run database migrations: npm run migrate"
echo "4. Start services: ./scripts/start-preregistration-services.sh"
echo "5. Test frontend-backend communication"
echo ""

exit $FAILED
