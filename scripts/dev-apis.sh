#!/bin/bash

# Coffee Blockchain Consortium - Start All API Services in Development Mode
# This script starts all APIs with hot-reload enabled using tmux

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_DIR="$PROJECT_ROOT/api"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Coffee Blockchain Consortium${NC}"
echo -e "${BLUE}Development Mode - API Services${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if tmux is installed
if ! command -v tmux &> /dev/null; then
    echo -e "${RED}❌ tmux is not installed${NC}"
    echo -e "${YELLOW}Install tmux:${NC}"
    echo -e "  Ubuntu/Debian: sudo apt-get install tmux"
    echo -e "  macOS: brew install tmux"
    exit 1
fi

# Check if network is running
echo -e "${YELLOW}Checking if blockchain network is running...${NC}"
if ! docker ps | grep -q "peer0.commercialbank"; then
    echo -e "${RED}❌ Blockchain network is not running!${NC}"
    echo -e "${YELLOW}Please start the network first:${NC}"
    echo -e "  cd $PROJECT_ROOT/network"
    echo -e "  ./network.sh up"
    exit 1
fi
echo -e "${GREEN}✅ Blockchain network is running${NC}"
echo ""

# Check if session already exists
if tmux has-session -t cbc-apis 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Session 'cbc-apis' already exists${NC}"
    echo -e "${YELLOW}Attaching to existing session...${NC}"
    echo ""
    echo -e "${BLUE}Use Ctrl+B then D to detach${NC}"
    echo -e "${BLUE}Use Ctrl+B then arrow keys to switch panes${NC}"
    sleep 2
    tmux attach-session -t cbc-apis
    exit 0
fi

# Install dependencies if needed
echo -e "${YELLOW}Checking dependencies...${NC}"
for service in commercial-bank national-bank ecta shipping-line custom-authorities ecx; do
    if [ ! -d "$API_DIR/$service/node_modules" ]; then
        echo -e "${YELLOW}Installing dependencies for $service...${NC}"
        cd "$API_DIR/$service"
        npm install
    fi
done
echo -e "${GREEN}✅ Dependencies ready${NC}"
echo ""

# Create new tmux session
echo -e "${YELLOW}Creating tmux session 'cbc-apis'...${NC}"

# Create session with first window
tmux new-session -d -s cbc-apis -n "APIs"

# Split into 6 panes for 6 APIs
tmux split-window -h -t cbc-apis:0
tmux split-window -v -t cbc-apis:0.0
tmux split-window -v -t cbc-apis:0.2
tmux split-window -v -t cbc-apis:0.0
tmux split-window -v -t cbc-apis:0.2

# Start each API in its pane
tmux send-keys -t cbc-apis:0.0 "cd $API_DIR/commercial-bank && echo 'Starting Commercial Bank API (Port 3001)...' && npm run dev" C-m
tmux send-keys -t cbc-apis:0.1 "cd $API_DIR/national-bank && echo 'Starting National Bank API (Port 3002)...' && npm run dev" C-m
tmux send-keys -t cbc-apis:0.2 "cd $API_DIR/ecta && echo 'Starting ECTA API (Port 3003)...' && npm run dev" C-m
tmux send-keys -t cbc-apis:0.3 "cd $API_DIR/shipping-line && echo 'Starting Shipping Line API (Port 3004)...' && npm run dev" C-m
tmux send-keys -t cbc-apis:0.4 "cd $API_DIR/custom-authorities && echo 'Starting Customs API (Port 3005)...' && npm run dev" C-m
tmux send-keys -t cbc-apis:0.5 "cd $API_DIR/ecx && echo 'Starting ECX API (Port 3006)...' && npm run dev" C-m

# Set pane titles
tmux select-pane -t cbc-apis:0.0 -T "Commercial Bank (3001)"
tmux select-pane -t cbc-apis:0.1 -T "National Bank (3002)"
tmux select-pane -t cbc-apis:0.2 -T "ECTA (3003)"
tmux select-pane -t cbc-apis:0.3 -T "Shipping (3004)"
tmux select-pane -t cbc-apis:0.4 -T "Customs (3005)"
tmux select-pane -t cbc-apis:0.5 -T "ECX (3006)"

echo ""
echo -e "${GREEN}✅ All API services starting in tmux session 'cbc-apis'${NC}"
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Tmux Session Controls${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}Services:${NC}"
echo -e "  • Commercial Bank API:    http://localhost:3001"
echo -e "  • National Bank (NBE) API: http://localhost:3002"
echo -e "  • ECTA API:                http://localhost:3003 (License, Quality, Contract)"
echo -e "  • Shipping Line API:       http://localhost:3004"
echo -e "  • Customs API:             http://localhost:3005"
echo -e "  • ECX API:                 http://localhost:3006 (Lot Verification)"
echo ""
echo -e "${YELLOW}Tmux Commands:${NC}"
echo -e "  • Switch panes:       Ctrl+B then arrow keys"
echo -e "  • Detach session:     Ctrl+B then D"
echo -e "  • Scroll in pane:     Ctrl+B then [ (q to exit scroll mode)"
echo -e "  • Kill session:       Ctrl+B then : then type 'kill-session'"
echo ""
echo -e "${YELLOW}Reattach to session:${NC}"
echo -e "  tmux attach-session -t cbc-apis"
echo ""
echo -e "${YELLOW}Stop all services:${NC}"
echo -e "  tmux kill-session -t cbc-apis"
echo ""
echo -e "${BLUE}Attaching to session in 3 seconds...${NC}"
sleep 3

# Attach to the session
tmux attach-session -t cbc-apis
