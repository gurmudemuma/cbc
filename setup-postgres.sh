#!/bin/bash

# PostgreSQL Setup Script for Coffee Export System
# This script automates the setup of PostgreSQL databases and migrations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}PostgreSQL Setup for Coffee Export${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Check if Docker is running
echo -e "${YELLOW}Checking Docker...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker is running${NC}\n"

# Start PostgreSQL services
echo -e "${YELLOW}Starting PostgreSQL services...${NC}"
docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d postgres-national-bank postgres-exporter-portal pgadmin
echo -e "${GREEN}✅ PostgreSQL services started${NC}\n"

# Wait for PostgreSQL to be ready
echo -e "${YELLOW}Waiting for PostgreSQL to be ready...${NC}"
sleep 5

# Check National Bank PostgreSQL
echo -e "${YELLOW}Checking National Bank PostgreSQL connection...${NC}"
for i in {1..30}; do
    if docker exec postgres-national-bank pg_isready -U nationalbank -d national_bank_db > /dev/null 2>&1; then
        echo -e "${GREEN}✅ National Bank PostgreSQL is ready${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ National Bank PostgreSQL failed to start${NC}"
        exit 1
    fi
    echo -n "."
    sleep 1
done

# Check Exporter Portal PostgreSQL
echo -e "${YELLOW}Checking Exporter Portal PostgreSQL connection...${NC}"
for i in {1..30}; do
    if docker exec postgres-exporter-portal pg_isready -U exporter_portal -d exporter_portal_db > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Exporter Portal PostgreSQL is ready${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Exporter Portal PostgreSQL failed to start${NC}"
        exit 1
    fi
    echo -n "."
    sleep 1
done

echo ""

# Setup National Bank API
echo -e "${YELLOW}Setting up National Bank API...${NC}"
cd api/national-bank

if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ .env file created${NC}"
fi

echo -e "${YELLOW}Installing dependencies...${NC}"
npm install > /dev/null 2>&1
echo -e "${GREEN}✅ Dependencies installed${NC}"

echo -e "${YELLOW}Generating Prisma Client...${NC}"
npm run prisma:generate > /dev/null 2>&1
echo -e "${GREEN}✅ Prisma Client generated${NC}"

echo -e "${YELLOW}Running database migrations...${NC}"
npm run prisma:migrate:deploy > /dev/null 2>&1
echo -e "${GREEN}✅ Database migrations completed${NC}"

cd ../..

echo ""

# Setup Exporter Portal API
echo -e "${YELLOW}Setting up Exporter Portal API...${NC}"
cd api/exporter-portal

if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ .env file created${NC}"
fi

echo -e "${YELLOW}Installing dependencies...${NC}"
npm install > /dev/null 2>&1
echo -e "${GREEN}✅ Dependencies installed${NC}"

echo -e "${YELLOW}Generating Prisma Client...${NC}"
npm run prisma:generate > /dev/null 2>&1
echo -e "${GREEN}✅ Prisma Client generated${NC}"

echo -e "${YELLOW}Running database migrations...${NC}"
npm run prisma:migrate:deploy > /dev/null 2>&1
echo -e "${GREEN}✅ Database migrations completed${NC}"

cd ../..

echo ""

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ PostgreSQL Setup Complete!${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${YELLOW}Database Connection Details:${NC}"
echo -e "  National Bank:"
echo -e "    Host: localhost:5432"
echo -e "    User: nationalbank"
echo -e "    Password: nationalbank_dev_password"
echo -e "    Database: national_bank_db"
echo ""
echo -e "  Exporter Portal:"
echo -e "    Host: localhost:5433"
echo -e "    User: exporter_portal"
echo -e "    Password: exporter_portal_dev_password"
echo -e "    Database: exporter_portal_db"
echo ""

echo -e "${YELLOW}Next Steps:${NC}"
echo -e "  1. Start National Bank API:"
echo -e "     ${BLUE}cd api/national-bank && npm run dev${NC}"
echo -e ""
echo -e "  2. Start Exporter Portal API (in another terminal):"
echo -e "     ${BLUE}cd api/exporter-portal && npm run dev${NC}"
echo -e ""
echo -e "  3. (Optional) Open pgAdmin:"
echo -e "     ${BLUE}http://localhost:5050${NC}"
echo -e "     Email: admin@coffee-export.local"
echo -e "     Password: admin"
echo ""

echo -e "${YELLOW}Useful Commands:${NC}"
echo -e "  View database with Prisma Studio (National Bank):"
echo -e "    ${BLUE}cd api/national-bank && npm run prisma:studio${NC}"
echo -e ""
echo -e "  View database with Prisma Studio (Exporter Portal):"
echo -e "    ${BLUE}cd api/exporter-portal && npm run prisma:studio${NC}"
echo -e ""
echo -e "  Stop PostgreSQL services:"
echo -e "    ${BLUE}docker-compose -f docker-compose.yml -f docker-compose.override.yml down${NC}"
echo ""
