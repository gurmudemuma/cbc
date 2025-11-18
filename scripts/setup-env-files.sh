#!/bin/bash

# =============================================================================
# Environment Files Setup Script
# Coffee Blockchain Consortium - Pre-Registration System
# =============================================================================

set -e

echo "🔧 Setting up environment files for CBC Pre-Registration System..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# API services array
API_SERVICES=(
    "commercial-bank"
    "national-bank"
    "ecta"
    "ecx"
    "shipping-line"
    "custom-authorities"
    "exporter-portal"
)

# Function to copy .env.example to .env if it doesn't exist
copy_env_file() {
    local service=$1
    local env_example_path="./api/$service/.env.example"
    local env_path="./api/$service/.env"
    
    if [[ -f "$env_example_path" ]]; then
        if [[ ! -f "$env_path" ]]; then
            cp "$env_example_path" "$env_path"
            echo -e "${GREEN}✅ Created .env file for $service${NC}"
        else
            echo -e "${YELLOW}⚠️  .env file already exists for $service - skipping${NC}"
        fi
    else
        echo -e "${RED}❌ .env.example not found for $service${NC}"
    fi
}

# Function to validate required environment variables
validate_env_vars() {
    local service=$1
    local env_path="./api/$service/.env"
    
    if [[ -f "$env_path" ]]; then
        echo -e "${BLUE}🔍 Validating $service environment variables...${NC}"
        
        # Check for critical variables
        local missing_vars=()
        
        if ! grep -q "^DB_HOST=" "$env_path"; then
            missing_vars+=("DB_HOST")
        fi
        
        if ! grep -q "^DB_PASSWORD=" "$env_path" || grep -q "^DB_PASSWORD=your_secure_password" "$env_path"; then
            missing_vars+=("DB_PASSWORD (needs real value)")
        fi
        
        if ! grep -q "^JWT_SECRET=" "$env_path" || grep -q "change-this" "$env_path"; then
            missing_vars+=("JWT_SECRET (needs real value)")
        fi
        
        if ! grep -q "^EMAIL_PASSWORD=" "$env_path" || grep -q "your-app-password" "$env_path"; then
            missing_vars+=("EMAIL_PASSWORD (needs real value)")
        fi
        
        if [[ ${#missing_vars[@]} -gt 0 ]]; then
            echo -e "${YELLOW}⚠️  Missing or default values in $service:${NC}"
            for var in "${missing_vars[@]}"; do
                echo -e "   - $var"
            done
        else
            echo -e "${GREEN}✅ $service environment variables look good${NC}"
        fi
    fi
}

# Main execution
echo -e "${BLUE}📋 Processing API services...${NC}"

for service in "${API_SERVICES[@]}"; do
    echo -e "\n${BLUE}Processing $service...${NC}"
    copy_env_file "$service"
    validate_env_vars "$service"
done

echo -e "\n${GREEN}🎉 Environment setup complete!${NC}"

echo -e "\n${YELLOW}📝 Next Steps:${NC}"
echo "1. Update database credentials in each .env file"
echo "2. Set up email SMTP credentials for renewal reminders"
echo "3. Generate secure JWT secrets for production"
echo "4. Configure IPFS gateway URLs if needed"
echo "5. Run database migrations:"
echo -e "   ${BLUE}psql -d coffee_export_db -f api/shared/database/migrations/001_create_ecta_preregistration_tables.sql${NC}"
echo -e "   ${BLUE}psql -d coffee_export_db -f api/shared/database/migrations/002_create_documents_table.sql${NC}"
echo -e "   ${BLUE}psql -d coffee_export_db -f api/shared/database/migrations/003_create_audit_log_table.sql${NC}"

echo -e "\n${YELLOW}🔐 Security Reminders:${NC}"
echo "- Never commit .env files to version control"
echo "- Use strong, unique passwords and secrets"
echo "- Rotate secrets regularly in production"
echo "- Consider using a secrets management system for production"

echo -e "\n${GREEN}✨ Pre-Registration System is ready for deployment!${NC}"
