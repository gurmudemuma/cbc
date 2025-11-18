#!/bin/bash

# =============================================================================
# Start Pre-Registration Services
# Coffee Blockchain Consortium
# =============================================================================

set -e

echo "🚀 Starting CBC Pre-Registration Services..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the correct directory
if [[ ! -d "api" ]]; then
    echo -e "${RED}❌ Please run this script from the CBC root directory${NC}"
    exit 1
fi

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to start a service
start_service() {
    local service=$1
    local port=$2
    local service_path="./api/$service"
    
    echo -e "\n${BLUE}🔧 Starting $service (port $port)...${NC}"
    
    # Check if service directory exists
    if [[ ! -d "$service_path" ]]; then
        echo -e "${RED}❌ Service directory not found: $service_path${NC}"
        return 1
    fi
    
    # Check if .env file exists
    if [[ ! -f "$service_path/.env" ]]; then
        echo -e "${YELLOW}⚠️  .env file not found for $service, copying from .env.example${NC}"
        if [[ -f "$service_path/.env.example" ]]; then
            cp "$service_path/.env.example" "$service_path/.env"
        else
            echo -e "${RED}❌ No .env.example found for $service${NC}"
            return 1
        fi
    fi
    
    # Check if port is already in use
    if check_port $port; then
        echo -e "${YELLOW}⚠️  Port $port is already in use, skipping $service${NC}"
        return 0
    fi
    
    # Start the service in background
    cd "$service_path"
    
    # Install dependencies if node_modules doesn't exist
    if [[ ! -d "node_modules" ]]; then
        echo -e "${BLUE}📦 Installing dependencies for $service...${NC}"
        npm install
    fi
    
    # Start the service
    echo -e "${GREEN}▶️  Starting $service...${NC}"
    npm run dev > "../logs/$service.log" 2>&1 &
    local pid=$!
    
    # Store PID for later cleanup
    echo $pid > "../logs/$service.pid"
    
    # Wait a moment and check if service started successfully
    sleep 3
    if kill -0 $pid 2>/dev/null; then
        echo -e "${GREEN}✅ $service started successfully (PID: $pid)${NC}"
    else
        echo -e "${RED}❌ Failed to start $service${NC}"
        cat "../logs/$service.log"
        return 1
    fi
    
    cd - > /dev/null
}

# Create logs directory
mkdir -p api/logs

echo -e "${BLUE}📋 Starting essential services for pre-registration system...${NC}"

# Start services in order of importance
echo -e "\n${YELLOW}🎯 Starting core services...${NC}"

# 1. ECTA API (most important for pre-registration)
start_service "ecta" 3003

# 2. Exporter Portal API (where exporters interact)
start_service "exporter-portal" 3007

# 3. Commercial Bank API (for export creation validation)
start_service "commercial-bank" 3001

echo -e "\n${GREEN}🎉 Core pre-registration services started!${NC}"

echo -e "\n${BLUE}📊 Service Status:${NC}"
echo "- ECTA API: http://localhost:3003/health"
echo "- Exporter Portal API: http://localhost:3007/health"  
echo "- Commercial Bank API: http://localhost:3001/health"

echo -e "\n${YELLOW}📝 Next Steps:${NC}"
echo "1. Check service health endpoints above"
echo "2. Ensure PostgreSQL is running and accessible"
echo "3. Run database migrations if not done already"
echo "4. Start the frontend: cd frontend && npm run dev"

echo -e "\n${BLUE}🔍 Logs:${NC}"
echo "- ECTA: tail -f api/logs/ecta.log"
echo "- Exporter Portal: tail -f api/logs/exporter-portal.log"
echo "- Commercial Bank: tail -f api/logs/commercial-bank.log"

echo -e "\n${YELLOW}🛑 To stop services:${NC}"
echo "./scripts/stop-preregistration-services.sh"

echo -e "\n${GREEN}✨ Pre-registration system is ready!${NC}"
