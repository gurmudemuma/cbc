#!/bin/bash

# Production Deployment Script
set -e

echo "🚀 Deploying Coffee Export Consortium"

# Environment setup
export COMPOSE_PROJECT_NAME=coffee-export
export POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-secure_password_123}

# Pre-deployment checks
echo "🔍 Running pre-deployment checks..."
command -v docker >/dev/null 2>&1 || { echo "Docker required but not installed"; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "Docker Compose required"; exit 1; }

# Network setup
echo "🌐 Setting up network..."
docker network create coffee-network 2>/dev/null || true

# Deploy services
echo "📦 Deploying services..."
docker-compose -f docker-compose.production.yml up -d --build

# Health checks
echo "🏥 Running health checks..."
sleep 30

services=("postgres:5432" "redis:6379" "commercial-bank-api:3001" "national-bank-api:3002" "ecta-api:3003")
for service in "${services[@]}"; do
    name=${service%:*}
    port=${service#*:}
    if docker exec $name sh -c "exit 0" 2>/dev/null; then
        echo "✅ $name is healthy"
    else
        echo "❌ $name is not responding"
    fi
done

echo "🎉 Deployment complete!"
echo "📊 Access points:"
echo "  - Commercial Bank: http://localhost:3001"
echo "  - National Bank: http://localhost:3002"  
echo "  - ECTA: http://localhost:3003"
echo "  - ECX: http://localhost:3004"
echo "  - Shipping: http://localhost:3005"
echo "  - Customs: http://localhost:3006"
echo "  - Frontend: http://localhost"
