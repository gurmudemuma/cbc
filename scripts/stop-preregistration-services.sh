#!/bin/bash

# =============================================================================
# Stop Pre-Registration Services
# Coffee Blockchain Consortium
# =============================================================================

echo "🛑 Stopping CBC Pre-Registration Services..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to stop a service
stop_service() {
    local service=$1
    local pid_file="./api/logs/$service.pid"
    
    if [[ -f "$pid_file" ]]; then
        local pid=$(cat "$pid_file")
        if kill -0 $pid 2>/dev/null; then
            echo -e "${BLUE}🛑 Stopping $service (PID: $pid)...${NC}"
            kill $pid
            sleep 2
            if kill -0 $pid 2>/dev/null; then
                echo -e "${YELLOW}⚠️  Force killing $service...${NC}"
                kill -9 $pid
            fi
            echo -e "${GREEN}✅ $service stopped${NC}"
        else
            echo -e "${YELLOW}⚠️  $service was not running${NC}"
        fi
        rm -f "$pid_file"
    else
        echo -e "${YELLOW}⚠️  No PID file found for $service${NC}"
    fi
}

# Stop services
stop_service "ecta"
stop_service "exporter-portal"
stop_service "commercial-bank"

# Also kill any remaining node processes on these ports
echo -e "\n${BLUE}🔍 Checking for remaining processes...${NC}"

for port in 3001 3003 3007; do
    local pid=$(lsof -ti:$port 2>/dev/null)
    if [[ -n "$pid" ]]; then
        echo -e "${YELLOW}⚠️  Killing process on port $port (PID: $pid)${NC}"
        kill -9 $pid 2>/dev/null || true
    fi
done

echo -e "\n${GREEN}✅ All pre-registration services stopped${NC}"
