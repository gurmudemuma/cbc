========================================
COFFEE EXPORT BLOCKCHAIN SYSTEM
========================================

Ethiopian Coffee Export Management System
Powered by Hyperledger Fabric Smart Contracts

========================================
PROJECT STRUCTURE
========================================

/
├── docs/                          # All documentation files
│   ├── README.txt                 # Documentation index
│   ├── QUICK-START.txt            # Quick start guide
│   ├── ECTA-OFFICIAL-WORKFLOW.txt # Official ECTA workflow
│   └── ... (see docs/README.txt for full list)
│
├── tests/                         # All test scripts
│   ├── README.txt                 # Test documentation
│   ├── test-enhanced-fields.js    # Enhanced fields test
│   ├── test-smart-contract.js     # Smart contract tests
│   └── ... (see tests/README.txt for full list)
│
├── chaincode/                     # Smart contract code
│   └── ecta/
│       ├── index.js               # Main chaincode (1000+ lines)
│       ├── server.js              # Chaincode HTTP server
│       └── package.json
│
├── coffee-export-gateway/         # Backend API
│   ├── src/
│   │   ├── server.js              # Main server
│   │   ├── routes/                # API routes
│   │   └── services/              # Business logic
│   ├── frontend/                  # React frontend
│   │   ├── src/
│   │   │   ├── components/        # UI components
│   │   │   ├── pages/             # Page components
│   │   │   └── services/          # API services
│   │   └── package.json
│   └── package.json
│
├── config/                        # Fabric network config
├── crypto-config/                 # Cryptographic materials
├── scripts/                       # Deployment scripts
├── docker-compose-fabric.yml      # Fabric network definition
└── start-hybrid-system.bat        # System startup script

========================================
QUICK START
========================================

1. Start Chaincode Server:
   cd chaincode/ecta
   npm run server
   (Runs on port 3001)

2. Start Backend:
   cd coffee-export-gateway
   npm start
   (Runs on port 3000)

3. Start Frontend:
   cd coffee-export-gateway/frontend
   npm run dev
   (Runs on port 5173)

4. Access System:
   http://localhost:5173

5. Login:
   Username: exporter1
   Password: password123

========================================
SYSTEM ARCHITECTURE
========================================

Layer 1: Frontend (React + TypeScript)
  - Port: 5173
  - Modern UI with Material-UI
  - Real-time updates

Layer 2: Backend API (Node.js + Express)
  - Port: 3000
  - RESTful API
  - Authentication & Authorization

Layer 3: Smart Contract Server
  - Port: 3001
  - Hyperledger Fabric Chaincode
  - Business logic enforcement

Layer 4: Blockchain Ledger
  - Immutable transaction history
  - Full audit trail
  - State management

========================================
KEY FEATURES
========================================

✅ Complete ECTA Workflow (9 stages)
✅ Pre-registration & Licensing
✅ Contract Registration
✅ Quality Certification
✅ ESW (Electronic Single Window)
✅ Banking & NBE Approval
✅ Customs Clearance
✅ Shipment Tracking
✅ Post-Export Compliance

✅ Smart Contract Powered
✅ Immutable Audit Trail
✅ Multi-Agency Approval
✅ Document Management
✅ Real-time Status Tracking

========================================
COMPLIANCE
========================================

100% ECTA Compliant
- All 9 official workflow stages
- All regulatory bodies represented
- ESW integration model
- Enhanced fields for complete tracking

Regulatory Bodies:
- ECTA (Ethiopian Coffee and Tea Authority)
- ECX (Ethiopian Commodity Exchange)
- NBE (National Bank of Ethiopia)
- ERCA (Customs Authority)
- Ministry of Trade
- Shipping Companies

========================================
DOCUMENTATION
========================================

See docs/ directory for:
- Quick start guides
- Deployment instructions
- Workflow documentation
- Compliance verification
- Technical specifications

========================================
TESTING
========================================

See tests/ directory for:
- Smart contract tests
- Backend API tests
- Frontend connection tests
- Integration tests

Run tests:
  node tests/test-enhanced-fields.js
  node tests/test-smart-contract-simple.js

========================================
DEVELOPMENT
========================================

Technologies:
- Frontend: React 18, TypeScript, Material-UI, Vite
- Backend: Node.js, Express, JWT
- Smart Contract: Hyperledger Fabric, Node.js
- Database: In-memory (development), CouchDB (production)

Requirements:
- Node.js 18+
- npm 9+
- Docker (for Fabric network)

========================================
DEPLOYMENT
========================================

Current Mode: Development (Chaincode Server)
- Smart contract runs as HTTP server
- In-memory ledger
- Fast development cycle

Production Mode: Hyperledger Fabric Network
- Distributed ledger
- Multi-peer consensus
- Full persistence
- Same smart contract code

See docs/COMPLETE-DEPLOYMENT-GUIDE.txt for details

========================================
SUPPORT
========================================

For issues or questions:
1. Check docs/ directory
2. Review tests/ for examples
3. Check system status in docs/FINAL-STATUS.txt

========================================
LICENSE
========================================

See LICENSE file for details

========================================
