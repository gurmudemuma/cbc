#!/bin/bash

# CBC Stop All Services Script
# Stops all running services

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

echo "🛑 Stopping CBC Services..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Stop APIs
echo -e "${BLUE}[1/2]${NC} Stopping API services..."
docker-compose -f docker-compose.apis.yml down 2>/dev/null || true
echo -e "${GREEN}✓${NC} API services stopped"
echo ""

# Stop Infrastructure
echo -e "${BLUE}[2/2]${NC} Stopping infrastructure..."
docker-compose -f docker-compose.postgres.yml down 2>/dev/null || true
echo -e "${GREEN}✓${NC} Infrastructure stopped"
echo ""

# Kill frontend if running
if pgrep -f "npm start" > /dev/null; then
  echo "Stopping frontend..."
  pkill -f "npm start" || true
  echo -e "${GREEN}✓${NC} Frontend stopped"
  echo ""
fi

echo -e "${GREEN}✓ All services stopped!${NC}"
echo ""
echo "💡 To start again:"
echo "   ./scripts/start-all.sh"
echo ""
