# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project overview
- Consortium blockchain for coffee exports built on Hyperledger Fabric. Components:
  - Blockchain network and ops: `network/` (Docker Compose + scripts)
  - Smart contracts (chaincode): Go in `chaincode/coffee-export` and `chaincode/user-management`
  - API layer: TypeScript/Express services per organization in `api/` (exporter-bank, national-bank, ncat, shipping-line, custom-authorities) with shared utilities in `api/shared/`
  - Frontend: React + Vite in `frontend/`
  - IPFS daemon (required) for document storage

Common commands
- Docker Compose deployment
  - Start blockchain network + IPFS:
    ```bash path=null start=null
    docker-compose up -d
    docker-compose ps
    docker-compose logs -f ipfs
    ```
  - Stop all containers:
    ```bash path=null start=null
    docker-compose down
    docker-compose down -v  # also remove volumes
    ```
  - View service logs:
    ```bash path=null start=null
    docker-compose logs -f <service-name>
    ```

- Install dependencies
  - Root helper (installs each API workspace):
    ```bash path=null start=null
    npm run install:all
    ```
  - API workspaces (installs shared deps and links workspaces):
    ```bash path=null start=null
    cd api
    npm install
    ```
  - Frontend:
    ```bash path=null start=null
    cd frontend
    npm install
    ```

- Hyperledger Fabric network lifecycle (Docker)
  - Using root npm scripts:
    ```bash path=null start=null
    npm run network:up
    npm run channel:create
    npm run chaincode:deploy
    npm run network:down
    ```
  - Direct script (for flags like channel/cc names):
    ```bash path=null start=null
    cd network
    ./network.sh up
    ./network.sh createChannel -c coffeechannel
    ./network.sh deployCC -ccn coffee-export -ccp ../chaincode/coffee-export -ccl golang -ccv 1.0 -ccs 1
    ./network.sh down
    ```

- Orchestrated startup (validates env, builds, sets up network, starts services)
  ```bash path=null start=null
  ./start-system.sh            # default
  ./start-system.sh --clean    # full reset before startup
  ./start-system.sh --skip-deps
  ```

- APIs (per service)
  - Dev (hot reload):
    ```bash path=null start=null
    cd api/exporter-bank        # or national-bank | ncat | shipping-line | custom-authorities
    cp .env.example .env
    npm run dev
    ```
  - Build and start (compiled):
    ```bash path=null start=null
    npm run build
    npm start
    ```
  - All services via workspaces:
    ```bash path=null start=null
    cd api
    npm run dev:all     # start all
    npm run build:all   # build all
    ```

- Linting
  - APIs (all workspaces):
    ```bash path=null start=null
    cd api
    npm run lint:all
    ```
  - API (single service):
    ```bash path=null start=null
    cd api/exporter-bank
    npm run lint
    ```
  - Frontend:
    ```bash path=null start=null
    cd frontend
    npm run lint
    ```

- Tests (Jest + ts-jest for APIs)
  - All API workspaces with tests:
    ```bash path=null start=null
    cd api
    npm run test:all
    ```
  - Single workspace:
    ```bash path=null start=null
    cd api
    npm run test --workspace exporter-bank
    # or: npm run test -w exporter-bank
    ```
  - From a service dir (single file / name):
    ```bash path=null start=null
    cd api/exporter-bank
    npm test -- src/__tests__/auth.test.ts
    npm test -- -t "createExport"       # by test name pattern
    ```

- Frontend (Vite)
  ```bash path=null start=null
  cd frontend
  npm run dev          # http://localhost:5173
  npm run build
  npm run preview
  ```

- Chaincode (local build checks)
  ```bash path=null start=null
  cd chaincode/coffee-export
  go mod tidy && go build ./...
  cd ../user-management
  go mod tidy && go build ./...
  ```

Essential paths and environment
- Connection profiles (JSON) are generated in `network/organizations/peerOrganizations/<org>.coffee-export.com/`
- Each API expects:
  - Wallet at `<service>/wallet` (auto-created); admin identity is imported on first connect
  - `.env` based on `.env.example` (ports 3001–3005; channel `coffeechannel`; chaincodes `coffee-export`, `user-management`)
  - Key envs validated by `api/shared/env.validator.ts`: `MSP_ID`, `CHANNEL_NAME`, `CHAINCODE_NAME_EXPORT`, `CHAINCODE_NAME_USER`, `CONNECTION_PROFILE_PATH`, `WALLET_PATH`, `IPFS_HOST`, `IPFS_PORT`, `IPFS_PROTOCOL`, JWT settings, CORS, rate limits
- IPFS daemon is required (shared `ipfs.service.ts`); runs on port 5001 for document storage

High-level architecture
- Docker Compose deployment
  - Root `docker-compose.yml` defines IPFS + core Fabric network (orderer, 1 peer, CouchDB, CLI)
  - `network/docker/docker-compose.yaml` extends with all 5 peers + CouchDB instances
  - Shared `coffee-export-network` for inter-container communication
  - IPFS runs as container (ipfs/kubo:v0.32.1) on port 5001
- Network (network/)
  - `network.sh` manages lifecycle: generate org crypto, bring up orderer + peers (CouchDB backing), create channel, deploy chaincode (coffee-export, user-management). Compose file defines 5 peers (ExporterBank, NationalBank, NCAT, ShippingLine, CustomAuthorities), an orderer, CouchDBs, and a Fabric tools CLI.
- Smart contracts (chaincode/)
  - `coffee-export`: export lifecycle state machine (Pending → FX → Quality → Shipment → Completed/Rejected/Cancelled). Implements transactions like `CreateExportRequest`, `ApproveFX`, `IssueQualityCertificate`, etc.
  - `user-management`: on-ledger user registry with username/email composite keys and bcrypt-hashed passwords.
- API layer (api/)
  - Per-organization Express service exposing role-specific endpoints. Uses a singleton Fabric gateway (`src/fabric/gateway.ts`) that:
    - Loads connection profile from env, enrolls/imports admin into filesystem wallet, connects to channel, and exposes contracts.
  - Shared cross-cutting concerns (`api/shared/`): env validation, security hardening (helmet/CORS/rate limiting), websocket notifications, required IPFS integration, input sanitization, password/email validation.
  - Auth via JWT with middleware; routes segmented by domain (e.g., `exports`, `fx`, `quality`, `shipments`). Tests exist primarily in `api/exporter-bank/src/__tests__/`.
- Frontend (frontend/)
  - Single Vite app targeting all roles; endpoints configured via `.env` (`VITE_*` vars). Consumes APIs on `http://localhost:3001-3004` by default.
- IPFS (required)
  - Document storage daemon running on port 5001. All document operations require active IPFS connection.

Notes
- Prefer the orchestrated `./start-system.sh` for end-to-end local bring-up; it validates prerequisites, prepares env files, sets permissions, starts Fabric, and launches services.
- When Fabric changes (e.g., chaincode updates), redeploy via `network.sh deployCC` with incremented `-ccs` (sequence) and updated `-ccv` (version) as needed.
