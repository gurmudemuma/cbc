# ✅ Consortium Blockchain for Coffee Export

A comprehensive end-to-end consortium blockchain application built with **Hyperledger Fabric**, **Golang**, and **TypeScript** for managing coffee exports across multiple organizations.

## 📋 Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Participants](#participants)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Network Setup](#network-setup)
- [API Services](#api-services)
- [Smart Contract](#smart-contract)
- [Frontend](#frontend)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)
- [Documentation](#documentation)

## 🎯 Overview

This project implements a consortium blockchain network for managing the complete coffee export lifecycle, from initial export request to final shipment confirmation. The system ensures transparency, traceability, and trust among all participating organizations.

## 🚀 Quick Start

### Option 1: Automated Startup (Recommended)

```bash
# 1. Clone and navigate to project
git clone <repository-url>
cd cbc

# 2. Start everything with one command
./start-system.sh

# 3. Access the application
# Frontend: http://localhost:5173
# APIs: http://localhost:3001-3004
# IPFS: http://localhost:5001
```

### Option 2: Docker Compose (Infrastructure Only)

```bash
# 1. Start blockchain network + IPFS in containers
docker-compose up -d

# 2. Start APIs on host (for development)
cd api/exporter-bank && npm run dev  # Terminal 1
cd api/national-bank && npm run dev   # Terminal 2
cd api/ncat && npm run dev            # Terminal 3
cd api/shipping-line && npm run dev   # Terminal 4

# 3. Start frontend
cd frontend && npm run dev
```

### Option 3: Full Containerization (Production)

```bash
# Build and start ALL services in containers (18 containers total)
./start-docker-full.sh --build

# Access services:
# - Frontend: http://localhost
# - APIs: http://localhost:3001-3005
# - IPFS: http://localhost:5001
```

**For detailed instructions, see:**
- **[FULL_CONTAINERIZATION_GUIDE.md](FULL_CONTAINERIZATION_GUIDE.md)** - Complete containerization (recommended for production)
- **[DOCKER_COMPOSE_GUIDE.md](DOCKER_COMPOSE_GUIDE.md)** - Docker Compose deployment guide
- **[STARTUP_QUICK_REFERENCE.md](STARTUP_QUICK_REFERENCE.md)** - Quick reference card
- **[STARTUP_ORDER.md](STARTUP_ORDER.md)** - Complete startup documentation
- **[QUICK_START.md](QUICK_START.md)** - Step-by-step guide

> ⚠️ **Important:** This project uses **Docker Compose** for containerized deployment. Choose between hybrid (Option 2) or full containerization (Option 3).

## 🏗️ Architecture

```
┌───���─────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Exporter Bank  │     │ National Bank   │     │      NCAT       │
│   (Port 3001)   │     │   (Port 3002)   │     │   (Port 3003)   │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  Hyperledger Fabric     │
                    │  Consortium Network     │
                    │  (Coffee Export Chain)  │
                    └────────────┬────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌────────▼────────┐     ┌────────▼────────┐     ┌──────▼──────┐
│ Shipping Line   │     │  Smart Contract │     │   Orderer   │
│  (Port 3004)    │     │   (Chaincode)   │     │   Service   │
└─────────────────┘     └─────────────────┘     └─────────────┘
```

## 💻 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Smart Contracts** | Golang (Hyperledger Fabric chaincode) |
| **Blockchain** | Hyperledger Fabric v2.5+ |
| **API Layer** | TypeScript + Express.js |
| **Frontend** | TypeScript + React |
| **Identity/Auth** | Fabric MSPs + JWT |
| **Storage** | Ledger (on-chain) + optional off-chain |

## 👥 Participants

1. **Exporter Bank** – Initiates export requests and completes exports
2. **National Bank** – Grants export licenses and approves foreign currency (FX)
3. **National Coffee and Tea Authority (NCAT)** – Issues quality certificates
4. **Shipping Line** – Schedules and confirms export shipments
5. **Exporter Portal** – Frontend for exporters to track/manage exports

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Docker** (v20.10+) and **Docker Compose** (v2.0+)
- **Node.js** (v16+) and **npm** (v8+)
- **Go** (v1.19+)
- **IPFS** (v0.18+) - Required for document storage
  ```bash
  # Install IPFS - see https://docs.ipfs.tech/install/
  wget https://dist.ipfs.tech/kubo/v0.32.1/kubo_v0.32.1_linux-amd64.tar.gz
  tar -xvzf kubo_v0.32.1_linux-amd64.tar.gz
  cd kubo
  sudo bash install.sh
  ipfs init
  ```
- **Hyperledger Fabric binaries** (v2.5+)
  ```bash
  curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.5.0 1.5.5
  ```

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd CBC
```

### 2. Install Dependencies

#### Install API Dependencies

```bash
# Exporter Bank API
cd api/exporter-bank
npm install
cd ../..

# National Bank API
cd api/national-bank
npm install
cd ../..

# NCAT API
cd api/ncat
npm install
cd ../..

# Shipping Line API
cd api/shipping-line
npm install
cd ../..
```

#### Install Chaincode Dependencies

```bash
cd chaincode/coffee-export
go mod tidy
cd ../..
```

## 🌐 Network Setup

### 1. Start the Hyperledger Fabric Network

```bash
cd network
chmod +x network.sh
./network.sh up
```

### 2. Create the Channel

```bash
./network.sh createChannel -c coffeechannel
```

### 3. Deploy the Chaincode

```bash
./network.sh deployCC -ccn coffee-export -ccs 1 -ccv 1.0
```

### 4. Verify Network Status

```bash
docker ps
```

You should see containers for:
- `orderer.coffee-export.com`
- `peer0.exporterbank.coffee-export.com`
- `peer0.nationalbank.coffee-export.com`
- `peer0.ncat.coffee-export.com`
- `peer0.shippingline.coffee-export.com`

## 🔌 API Services

### Start All API Services

#### 1. Exporter Bank API (Port 3001)

```bash
cd api/exporter-bank
cp .env.example .env
npm run dev
```

#### 2. National Bank API (Port 3002)

```bash
cd api/national-bank
cp .env.example .env
npm run dev
```

#### 3. NCAT API (Port 3003)

```bash
cd api/ncat
cp .env.example .env
npm run dev
```

#### 4. Shipping Line API (Port 3004)

```bash
cd api/shipping-line
cp .env.example .env
npm run dev
```

## 📜 Smart Contract

### Chaincode Functions

The coffee export chaincode provides the following functions:

#### Export Management
- `CreateExportRequest` - Create a new export request (Exporter Bank)
- `GetExportRequest` - Retrieve export details
- `GetAllExports` - Get all exports
- `GetExportsByStatus` - Filter exports by status
- `GetExportHistory` - View complete export history

#### FX Approval (National Bank)
- `ApproveFX` - Approve foreign exchange
- `RejectFX` - Reject foreign exchange

#### Quality Certification (NCAT)
- `IssueQualityCertificate` - Issue quality certificate
- `RejectQuality` - Reject quality

#### Shipping (Shipping Line)
- `ScheduleShipment` - Schedule shipment
- `ConfirmShipment` - Confirm goods shipped

#### Export Completion
- `CompleteExport` - Mark export as completed (Exporter Bank)
- `CancelExport` - Cancel export request (Exporter Bank)

### Export Status Flow

```
PENDING → FX_APPROVED → QUALITY_CERTIFIED → SHIPMENT_SCHEDULED → SHIPPED → COMPLETED
   ↓           ↓              ↓
FX_REJECTED  QUALITY_REJECTED  CANCELLED
```

## 🎨 Frontend

The Exporter Portal provides a user-friendly interface for exporters to:
- Create new export requests
- Track export status in real-time
- View export history
- Manage export documents

To start the frontend:

```bash
cd frontend/exporter-portal
npm install
npm run dev
```

Access at http://localhost:5173 (default Vite port).

## 📖 Usage

### Example Workflow

#### 1. Register and Login (Exporter Bank)

```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "exporter1",
    "password": "password123",
    "email": "exporter1@bank.com"
  }'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "exporter1",
    "password": "password123"
  }'
```

#### 2. Create Export Request

```bash
curl -X POST http://localhost:3001/api/exports \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "exporterName": "ABC Coffee Exporters",
    "coffeeType": "Arabica",
    "quantity": 5000,
    "destinationCountry": "USA",
    "estimatedValue": 50000
  }'
```

#### 3. Approve FX (National Bank)

```bash
curl -X POST http://localhost:3002/api/fx/approve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <NATIONAL_BANK_TOKEN>" \
  -d '{
    "exportId": "EXP-xxxxx"
  }'
```

#### 4. Issue Quality Certificate (NCAT)

```bash
curl -X POST http://localhost:3003/api/quality/certify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <NCAT_TOKEN>" \
  -d '{
    "exportId": "EXP-xxxxx",
    "qualityGrade": "Grade A"
  }'
```

#### 5. Schedule Shipment (Shipping Line)

```bash
curl -X POST http://localhost:3004/api/shipments/schedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <SHIPPING_TOKEN>" \
  -d '{
    "exportId": "EXP-xxxxx",
    "vesselName": "MV Coffee Carrier",
    "departureDate": "2024-02-01",
    "arrivalDate": "2024-02-15"
  }'
```

#### 6. Confirm Shipment

```bash
curl -X POST http://localhost:3004/api/shipments/confirm \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <SHIPPING_TOKEN>" \
  -d '{
    "exportId": "EXP-xxxxx"
  }'
```

#### 7. Complete Export

```bash
curl -X PUT http://localhost:3001/api/exports/EXP-xxxxx/complete \
  -H "Authorization: Bearer <EXPORTER_TOKEN>"
```

## 📚 API Documentation

### Exporter Bank API (Port 3001)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/refresh` | Refresh auth token |
| POST | `/api/exports` | Create export request |
| GET | `/api/exports` | Get all exports |
| GET | `/api/exports/:id` | Get export by ID |
| GET | `/api/exports/status/:status` | Get exports by status |
| GET | `/api/exports/:id/history` | Get export history |
| PUT | `/api/exports/:id/complete` | Complete export |
| PUT | `/api/exports/:id/cancel` | Cancel export |

### National Bank API (Port 3002)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/fx/pending` | Get pending exports |
| GET | `/api/fx/exports` | Get all exports |
| GET | `/api/fx/exports/:id` | Get export by ID |
| POST | `/api/fx/approve` | Approve FX |
| POST | `/api/fx/reject` | Reject FX |

### NCAT API (Port 3003)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/quality/pending` | Get pending exports |
| GET | `/api/quality/exports` | Get all exports |
| GET | `/api/quality/exports/:id` | Get export by ID |
| POST | `/api/quality/certify` | Issue quality certificate |
| POST | `/api/quality/reject` | Reject quality |

### Shipping Line API (Port 3004)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/shipments/ready` | Get ready exports |
| GET | `/api/shipments/exports` | Get all exports |
| GET | `/api/shipments/exports/:id` | Get export by ID |
| POST | `/api/shipments/schedule` | Schedule shipment |
| POST | `/api/shipments/confirm` | Confirm shipment |

## 🔧 Troubleshooting

### Network Issues

```bash
# Stop and clean the network
cd network
./network.sh down

# Restart the network
./network.sh up
./network.sh createChannel
./network.sh deployCC
```

### Docker Issues

```bash
# Remove all containers
docker rm -f $(docker ps -aq)

# Remove all volumes
docker volume prune -f

# Remove all networks
docker network prune -f
```

### API Connection Issues

1. Ensure the Fabric network is running
2. Check if all peers are up: `docker ps`
3. Verify connection profiles exist in `network/organizations/peerOrganizations/`
4. Check API logs for connection errors

### Chaincode Issues

```bash
# View chaincode logs
docker logs -f peer0.exporterbank.coffee-export.com

# Redeploy chaincode with new version
./network.sh deployCC -ccn coffee-export -ccs 2 -ccv 1.1
```

## 📚 Documentation

### Getting Started
- **[QUICK_START.md](QUICK_START.md)** - Quick start guide for new users
- **[STARTUP_ORDER.md](STARTUP_ORDER.md)** - Detailed component startup order and dependencies
- **[STARTUP_QUICK_REFERENCE.md](STARTUP_QUICK_REFERENCE.md)** - Quick reference card for startup

### Architecture & Design
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture and design decisions
- **[SYSTEM_DIAGRAM.md](SYSTEM_DIAGRAM.md)** - Visual system diagrams

### Development
- **[DEVELOPER_NOTES.md](DEVELOPER_NOTES.md)** - Developer guidelines and notes
- **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - Testing procedures and guidelines
- **[FRONTEND_GUIDE.md](FRONTEND_GUIDE.md)** - Frontend development guide

### Deployment & Operations
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Production deployment guide
- **[PROJECT_STATUS.md](PROJECT_STATUS.md)** - Current project status
- **[CHANGELOG.md](CHANGELOG.md)** - Version history and changes

### Security
- **[SECURITY.md](SECURITY.md)** - Security guidelines and best practices
- **[INTER_SERVICE_COMMUNICATION.md](INTER_SERVICE_COMMUNICATION.md)** - Service communication security

### Reference
- **[DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)** - Complete documentation index
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Quick reference for common tasks

## 📝 License

MIT License

## 👨‍💻 Contributors

- Coffee Blockchain Consortium Team

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For support, email support@coffeeexport.com or open an issue in the repository.

---

**Built with ❤️ using Hyperledger Fabric**
