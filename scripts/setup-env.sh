#!/bin/bash

# Setup environment script for Coffee Blockchain Consortium
# This script sets up the development environment

set -e

echo "=========================================="
echo "Coffee Blockchain Consortium - Environment Setup"
echo "=========================================="

# Check if running from project root
if [ ! -f "package.json" ]; then
    echo "Error: Please run this script from the project root directory"
    exit 1
fi

# Check prerequisites
echo ""
echo "Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16.x or higher"
    exit 1
else
    NODE_VERSION=$(node -v)
    echo "✅ Node.js $NODE_VERSION"
fi

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
else
    NPM_VERSION=$(npm -v)
    echo "✅ npm $NPM_VERSION"
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker"
    exit 1
else
    DOCKER_VERSION=$(docker --version)
    echo "�� $DOCKER_VERSION"
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose"
    exit 1
else
    COMPOSE_VERSION=$(docker-compose --version)
    echo "✅ $COMPOSE_VERSION"
fi

# Check Go
if ! command -v go &> /dev/null; then
    echo "❌ Go is not installed. Please install Go 1.19 or higher"
    exit 1
else
    GO_VERSION=$(go version)
    echo "✅ $GO_VERSION"
fi

echo ""
echo "Installing dependencies..."

# Install chaincode dependencies
echo ""
echo "📦 Installing chaincode dependencies..."
cd chaincode/coffee-export
if [ -f "go.mod" ]; then
    go mod download
    go mod tidy
    echo "✅ Chaincode dependencies installed"
else
    echo "⚠️  go.mod not found, skipping chaincode dependencies"
fi
cd ../..

# Install API dependencies
echo ""
echo "📦 Installing API dependencies..."

# commercialbank API
if [ -d "api/commercial-bank" ]; then
    echo "Installing commercialbank API dependencies..."
    cd api/commercial-bank
    npm install
    cd ../..
    echo "✅ commercialbank API dependencies installed"
fi

# National Bank API
if [ -d "api/national-bank" ]; then
    echo "Installing National Bank API dependencies..."
    cd api/national-bank
    npm install
    cd ../..
    echo "✅ National Bank API dependencies installed"
fi

# Exporter API
if [ -d "api/exporter" ]; then
    echo "Installing Exporter API dependencies..."
    cd api/exporter
    npm install
    cd ../..
    echo "✅ Exporter API dependencies installed"
fi

# ECTA API
if [ -d "api/ncat" ]; then
    echo "Installing ECTA API dependencies..."
    cd api/ncat
    npm install
    cd ../..
    echo "✅ ECTA API dependencies installed"
fi

# Shipping Line API
if [ -d "api/shipping-line" ]; then
    echo "Installing Shipping Line API dependencies..."
    cd api/shipping-line
    npm install
    cd ../..
    echo "✅ Shipping Line API dependencies installed"
fi

# Create .env files from examples
echo ""
echo "📝 Creating .env files..."

create_env_file() {
    local dir=$1
    if [ -f "$dir/.env.example" ] && [ ! -f "$dir/.env" ]; then
        cp "$dir/.env.example" "$dir/.env"
        echo "✅ Created $dir/.env"
    fi
}

create_env_file "api/commercial-bank"
create_env_file "api/national-bank"
create_env_file "api/exporter"
create_env_file "api/ncat"
create_env_file "api/shipping-line"
create_env_file "api/custom-authorities"

# Make scripts executable
echo ""
echo "🔧 Making scripts executable..."
chmod +x network/network.sh
chmod +x network/scripts/*.sh
chmod +x scripts/*.sh
echo "✅ Scripts are now executable"

# Create necessary directories
echo ""
echo "📁 Creating necessary directories..."
mkdir -p network/organizations/peerOrganizations
mkdir -p network/organizations/ordererOrganizations
mkdir -p network/channel-artifacts
mkdir -p network/system-genesis-block
echo "✅ Directories created"

echo ""
echo "=========================================="
echo "✅ Environment setup completed successfully!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Review and update .env files in api/* directories"
echo "2. Start the network: cd network && ./network.sh up"
echo "3. Create channel: ./network.sh createChannel"
echo "4. Deploy chaincode: ./network.sh deployCC"
echo "5. Start API servers: cd api/<org-name> && npm run dev"
echo ""
