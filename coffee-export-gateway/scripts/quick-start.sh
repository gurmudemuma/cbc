#!/bin/bash

# Quick Start Script for Coffee Export Gateway
# This script sets up and starts the gateway for testing

set -e

echo "=========================================="
echo "Coffee Export Gateway - Quick Start"
echo "=========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

echo "✓ Node.js version: $(node --version)"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✓ npm version: $(npm --version)"
echo ""

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✓ Dependencies installed"
    echo ""
else
    echo "✓ Dependencies already installed"
    echo ""
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file..."
    cp .env.example .env
    echo "✓ .env file created"
    echo "⚠️  Please update .env with your configuration"
    echo ""
else
    echo "✓ .env file exists"
    echo ""
fi

# Create wallets directory if it doesn't exist
if [ ! -d "wallets" ]; then
    echo "📁 Creating wallets directory..."
    mkdir -p wallets
    echo "✓ Wallets directory created"
    echo ""
fi

# Check if admin is enrolled
if [ ! -d "wallets/admin" ]; then
    echo "🔐 Enrolling admin user..."
    echo "⚠️  Make sure your Fabric network is running!"
    echo ""
    read -p "Press Enter to continue or Ctrl+C to cancel..."
    npm run enroll-admin
    echo ""
else
    echo "✓ Admin already enrolled"
    echo ""
fi

echo "=========================================="
echo "🚀 Starting Coffee Export Gateway..."
echo "=========================================="
echo ""
echo "Gateway will be available at: http://localhost:3000"
echo "Health check: http://localhost:3000/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
npm start
