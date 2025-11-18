#!/bin/bash

# =============================================================================
# Diagnose Pre-Registration System Issues
# Coffee Blockchain Consortium
# =============================================================================

echo "🔍 Diagnosing CBC Pre-Registration System..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check service status
check_service() {
    local service=$1
    local port=$2
    
    echo -e "\n${BLUE}🔍 Checking $service (port $port)...${NC}"
    
    # Check if port is listening
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Port $port is listening${NC}"
        
        # Try to hit health endpoint
        if curl -s "http://localhost:$port/health" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Health endpoint responding${NC}"
        else
            echo -e "${YELLOW}⚠️  Health endpoint not responding${NC}"
        fi
    else
        echo -e "${RED}❌ Port $port is not listening${NC}"
    fi
}

# Function to check database connectivity
check_database() {
    echo -e "\n${BLUE}🔍 Checking database connectivity...${NC}"
    
    # Check if PostgreSQL is running
    if pgrep -x "postgres" > /dev/null; then
        echo -e "${GREEN}✅ PostgreSQL process is running${NC}"
    else
        echo -e "${RED}❌ PostgreSQL process not found${NC}"
        return 1
    fi
    
    # Try to connect to database
    if command -v psql >/dev/null 2>&1; then
        if psql -h localhost -U postgres -d coffee_export_db -c "SELECT 1;" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Database connection successful${NC}"
            
            # Check if pre-registration tables exist
            local table_count=$(psql -h localhost -U postgres -d coffee_export_db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('exporter_profiles', 'preregistration_documents', 'preregistration_audit_log');" 2>/dev/null | xargs)
            
            if [[ "$table_count" == "3" ]]; then
                echo -e "${GREEN}✅ Pre-registration tables exist${NC}"
            else
                echo -e "${YELLOW}⚠️  Pre-registration tables missing (found $table_count/3)${NC}"
                echo -e "${BLUE}💡 Run database migrations:${NC}"
                echo "   psql -d coffee_export_db -f api/shared/database/migrations/001_create_ecta_preregistration_tables.sql"
                echo "   psql -d coffee_export_db -f api/shared/database/migrations/002_create_documents_table.sql"
                echo "   psql -d coffee_export_db -f api/shared/database/migrations/003_create_audit_log_table.sql"
            fi
        else
            echo -e "${RED}❌ Cannot connect to database${NC}"
            echo -e "${BLUE}💡 Check database credentials in .env files${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  psql command not found, cannot test database connection${NC}"
    fi
}

# Function to check environment files
check_env_files() {
    echo -e "\n${BLUE}🔍 Checking environment files...${NC}"
    
    local services=("ecta" "exporter-portal" "commercial-bank")
    
    for service in "${services[@]}"; do
        local env_file="./api/$service/.env"
        if [[ -f "$env_file" ]]; then
            echo -e "${GREEN}✅ $service .env file exists${NC}"
            
            # Check for critical variables
            if grep -q "^DB_HOST=" "$env_file" && ! grep -q "^DB_PASSWORD=your_secure_password" "$env_file"; then
                echo -e "${GREEN}  ✅ Database configuration looks set${NC}"
            else
                echo -e "${YELLOW}  ⚠️  Database configuration needs updating${NC}"
            fi
        else
            echo -e "${RED}❌ $service .env file missing${NC}"
            echo -e "${BLUE}💡 Copy from .env.example: cp ./api/$service/.env.example ./api/$service/.env${NC}"
        fi
    done
}

# Function to check dependencies
check_dependencies() {
    echo -e "\n${BLUE}🔍 Checking dependencies...${NC}"
    
    local services=("ecta" "exporter-portal" "commercial-bank")
    
    for service in "${services[@]}"; do
        if [[ -d "./api/$service/node_modules" ]]; then
            echo -e "${GREEN}✅ $service dependencies installed${NC}"
        else
            echo -e "${YELLOW}⚠️  $service dependencies missing${NC}"
            echo -e "${BLUE}💡 Install: cd api/$service && npm install${NC}"
        fi
    done
}

# Function to check API endpoints
check_endpoints() {
    echo -e "\n${BLUE}🔍 Checking API endpoints...${NC}"
    
    # Check exporter-portal qualification-status endpoint
    if curl -s "http://localhost:3007/api/exporter/qualification-status" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Qualification status endpoint responding${NC}"
    else
        echo -e "${RED}❌ Qualification status endpoint not responding${NC}"
        echo -e "${BLUE}💡 This is the endpoint causing the 404 error${NC}"
    fi
}

# Main execution
echo -e "${BLUE}📋 Running comprehensive diagnostics...${NC}"

check_env_files
check_dependencies
check_database
check_service "ECTA API" 3003
check_service "Exporter Portal API" 3007
check_service "Commercial Bank API" 3001
check_endpoints

echo -e "\n${BLUE}📊 Summary:${NC}"
echo -e "${YELLOW}Common issues and solutions:${NC}"
echo "1. Services not running → Use: ./scripts/start-preregistration-services.sh"
echo "2. Database not accessible → Check PostgreSQL and credentials"
echo "3. Missing tables → Run database migrations"
echo "4. Missing .env files → Copy from .env.example"
echo "5. Missing dependencies → Run npm install in each service"

echo -e "\n${GREEN}🎯 Quick fix for your current issue:${NC}"
echo "1. Ensure exporter-portal API is running on port 3007"
echo "2. Check database connection"
echo "3. Verify the qualification-status endpoint is accessible"

echo -e "\n${BLUE}✨ Diagnosis complete!${NC}"
