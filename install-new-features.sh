#!/bin/bash

# Installation script for new features
# Coffee Export Consortium Blockchain

set -e

echo "========================================="
echo "Installing New Features"
echo "Coffee Export Consortium Blockchain"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

print_success "Node.js $(node --version) found"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_success "npm $(npm --version) found"

echo ""
print_info "Installing dependencies for API services..."
echo ""

# Array of API services
services=("commercial-bank" "national-bank" "ncat" "shipping-line")

# Install dependencies for each service
for service in "${services[@]}"; do
    echo "----------------------------------------"
    print_info "Installing dependencies for $service..."
    
    cd "api/$service"
    
    # Install production dependencies
    print_info "Installing production dependencies..."
    npm install socket.io nodemailer ipfs-http-client --save
    
    # Install development dependencies
    print_info "Installing development dependencies..."
    npm install --save-dev \
        jest \
        @types/jest \
        ts-jest \
        supertest \
        @types/supertest \
        @types/nodemailer
    
    print_success "$service dependencies installed"
    
    cd ../..
done

echo ""
echo "========================================="
print_success "All dependencies installed successfully!"
echo "========================================="
echo ""

print_info "Next steps:"
echo "1. Configure environment variables in .env files"
echo "2. Set up SMTP credentials for email service"
echo "3. (Optional) Install and start IPFS node"
echo "4. Run tests: cd api/commercial-bank && npm test"
echo "5. Start services: npm run dev"
echo ""

print_info "For detailed instructions, see:"
echo "- NEW_FEATURES_README.md"
echo "- IMPLEMENTATION_SUMMARY.md"
echo "- DEPLOYMENT_GUIDE.md"
echo ""

print_success "Installation complete! 🎉"
