# Coffee Export Blockchain - Deployment Flowchart

## Visual Deployment Process

```
┌─────────────────────────────────────────────────────────────────┐
│                    START DEPLOYMENT                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 1: PRE-DEPLOYMENT CHECKS                                 │
│  ✓ Docker installed?                                            │
│  ✓ Docker Compose available?                                    │
│  ✓ Sufficient disk space?                                       │
│  ✓ Sufficient RAM (8GB+)?                                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 2: CLEANUP                                               │
│  • Stop existing containers                                     │
│  • Remove old chaincode containers                              │
│  • Clean unused resources                                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 3: NETWORK SETUP                                         │
│  • Create fabric-network                                        │
│  • Configure network isolation                                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 4: FABRIC NETWORK                                        │
│  • Start 3 Orderers (Raft consensus)                           │
│  • Start 6 Peers (5 organizations)                             │
│  • Start 6 CouchDB instances                                    │
│  • Start CLI tool                                               │
│  • Wait 30 seconds for initialization                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 5: BLOCKCHAIN INITIALIZATION                             │
│                                                                  │
│  Channel exists? ──NO──► Create Channel                         │
│       │                   • Generate artifacts                  │
│       │                   • Create coffeechannel                │
│       │                   • Join all 6 peers                    │
│       │                   • Package chaincode                   │
│       │                   • Install on all peers                │
│       │                   • Approve for all orgs                │
│       │                   • Commit chaincode                    │
│       │                                                          │
│       YES                                                        │
│       │                                                          │
│       └──────────────► Deploy/Update Chaincode                  │
│                        • Package new version                    │
│                        • Install on all peers                   │
│                        • Approve for all orgs                   │
│                        • Commit new version                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 6: BUILD APPLICATION IMAGES                              │
│  • Build Gateway (Fabric SDK)                                   │
│  • Build Blockchain Bridge                                      │
│  • Build ECTA Service                                           │
│  • Build Commercial Bank Service                                │
│  • Build National Bank Service                                  │
│  • Build Customs Service                                        │
│  • Build ECX Service                                            │
│  • Build Shipping Service                                       │
│  • Build Buyer Verification Service                             │
│  • Build Frontend (React)                                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 7: START INFRASTRUCTURE                                  │
│  • Start PostgreSQL                                             │
│  • Start Redis                                                  │
│  • Start Zookeeper                                              │
│  • Start Kafka                                                  │
│  • Wait 30 seconds for initialization                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 8: START APPLICATION SERVICES                            │
│  • Start Gateway                                                │
│  • Start Blockchain Bridge                                      │
│  • Wait 20 seconds                                              │
│  • Start ECTA Service                                           │
│  • Start Commercial Bank Service                                │
│  • Start National Bank Service                                  │
│  • Start Customs Service                                        │
│  • Start ECX Service                                            │
│  • Start Shipping Service                                       │
│  • Start Buyer Verification Service                             │
│  • Start Frontend                                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 9: DATA INITIALIZATION                                   │
│  • Enroll admin identity                                        │
│  • Seed test users (admin, exporters, bank users)              │
│  • Sync users to blockchain                                     │
│  • Run database migrations                                      │
│  • Verify database contents                                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 10: VERIFICATION                                         │
│  ✓ All containers running?                                      │
│  ✓ Gateway health check (port 3000)                            │
│  ✓ Bridge health check (port 3008)                             │
│  ✓ Frontend accessible (port 5173)                             │
│  ✓ Blockchain operational                                       │
│  ✓ Database connected                                           │
│  ✓ Login functional                                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  DEPLOYMENT COMPLETE ✓                          │
│                                                                  │
│  System Ready:                                                  │
│  • Frontend: http://localhost:5173                             │
│  • API: http://localhost:3000                                  │
│  • ~25 containers running                                       │
│  • Login: admin / admin123                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                            │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │         React Frontend (Port 5173)                     │    │
│  │         • TypeScript                                   │    │
│  │         • Vite                                         │    │
│  │         • Material-UI                                  │    │
│  └────────────────────┬───────────────────────────────────┘    │
└─────────────────────────┼──────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API GATEWAY LAYER                            │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │         Gateway Service (Port 3000)                    │    │
│  │         • Fabric SDK                                   │    │
│  │         • Authentication                               │    │
│  │         • Request routing                              │    │
│  └────────────────────┬───────────────────────────────────┘    │
└─────────────────────────┼──────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   ECTA       │  │  Commercial  │  │   National   │
│   Service    │  │    Bank      │  │    Bank      │
│  (Port 3003) │  │  (Port 3002) │  │  (Port 3004) │
└──────────────┘  └──────────────┘  └──────────────┘

┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Customs    │  │     ECX      │  │   Shipping   │
│   Service    │  │   Service    │  │   Service    │
│  (Port 3005) │  │  (Port 3006) │  │  (Port 3007) │
└──────────────┘  └──────────────┘  └──────────────┘

          │               │               │
          └───────────────┼───────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                  │
│                                                                  │
│  ┌──────────────────┐         ┌──────────────────┐            │
│  │   PostgreSQL     │◄───────►│  Blockchain      │            │
│  │   (Port 5432)    │         │  Bridge          │            │
│  │                  │         │  (Port 3008)     │            │
│  │  • Users         │         │                  │            │
│  │  • Profiles      │         │  • Sync Service  │            │
│  │  • Transactions  │         │  • Reconciliation│            │
│  │  • Documents     │         │                  │            │
│  └──────────────────┘         └──────────────────┘            │
│           │                            │                        │
│           │                            │                        │
│           ▼                            ▼                        │
│  ┌──────────────────┐         ┌──────────────────┐            │
│  │      Redis       │         │  Hyperledger     │            │
│  │   (Port 6379)    │         │     Fabric       │            │
│  │                  │         │                  │            │
│  │  • Cache         │         │  • 3 Orderers    │            │
│  │  • Sessions      │         │  • 6 Peers       │            │
│  └──────────────────┘         │  • 6 CouchDB     │            │
│                                │  • Chaincode     │            │
│  ┌──────────────────┐         └──────────────────┘            │
│  │      Kafka       │                                          │
│  │   (Port 9093)    │                                          │
│  │                  │                                          │
│  │  • Events        │                                          │
│  │  • Messaging     │                                          │
│  └──────────────────┘                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      WRITE OPERATION                             │
└─────────────────────────────────────────────────────────────────┘

User Request
     │
     ▼
Frontend (5173)
     │
     ▼
Gateway (3000)
     │
     ├──────────────────┬──────────────────┐
     │                  │                  │
     ▼                  ▼                  ▼
PostgreSQL         Blockchain         Kafka Event
(Primary)          (Audit Log)        (Notification)
     │                  │                  │
     └──────────────────┴──────────────────┘
                        │
                        ▼
                   Response


┌─────────────────────────────────────────────────────────────────┐
│                      READ OPERATION                              │
└─────────────────────────────────────────────────────────────────┘

User Request
     │
     ▼
Frontend (5173)
     │
     ▼
Gateway (3000)
     │
     ├──────────────┐
     │              │
     ▼              ▼
Redis Cache    PostgreSQL
(if cached)    (Primary)
     │              │
     └──────┬───────┘
            │
            ▼
       Response
    (10-50x faster!)
```

---

## Network Topology

```
┌─────────────────────────────────────────────────────────────────┐
│                    DOCKER NETWORKS                               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  fabric-network                                                  │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                      │
│  │ Orderer1 │  │ Orderer2 │  │ Orderer3 │                      │
│  │  :7050   │  │  :8050   │  │  :9050   │                      │
│  └──────────┘  └──────────┘  └──────────┘                      │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                      │
│  │ Peer0    │  │ Peer1    │  │ Peer0    │                      │
│  │ ECTA     │  │ ECTA     │  │ Bank     │                      │
│  │  :7051   │  │  :8051   │  │  :9051   │                      │
│  └──────────┘  └──────────┘  └──────────┘                      │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                      │
│  │ Peer0    │  │ Peer0    │  │ Peer0    │                      │
│  │ NBE      │  │ Customs  │  │ Shipping │                      │
│  │  :10051  │  │  :11051  │  │  :12051  │                      │
│  └──────────┘  └──────────┘  └──────────┘                      │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                      │
│  │ CouchDB  │  │ CouchDB  │  │ CouchDB  │                      │
│  │ x6       │  │ x6       │  │ x6       │                      │
│  └──────────┘  └──────────┘  └──────────┘                      │
│                                                                  │
│  ┌──────────┐                                                   │
│  │   CLI    │                                                   │
│  └──────────┘                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  coffee-export-network                                           │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                      │
│  │ Gateway  │  │  Bridge  │  │Frontend  │                      │
│  │  :3000   │  │  :3008   │  │  :5173   │                      │
│  └──────────┘  └──────────┘  └──────────┘                      │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                      │
│  │   ECTA   │  │   Bank   │  │   NBE    │                      │
│  │  :3003   │  │  :3002   │  │  :3004   │                      │
│  └──────────┘  └──────────┘  └──────────┘                      │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                      │
│  │ Customs  │  │   ECX    │  │ Shipping │                      │
│  │  :3005   │  │  :3006   │  │  :3007   │                      │
│  └──────────┘  └──────────┘  └──────────┘                      │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                      │
│  │PostgreSQL│  │  Redis   │  │  Kafka   │                      │
│  │  :5432   │  │  :6379   │  │  :9093   │                      │
│  └──────────┘  └──────────┘  └──────────┘                      │
└─────────────────────────────────────────────────────────────────┘

Note: Gateway and Bridge connect to BOTH networks
```

---

## Deployment Timeline

```
Time    Phase                           Activity
────────────────────────────────────────────────────────────────
0:00    Pre-checks                      Verify Docker, resources
0:30    Cleanup                         Stop old containers
1:00    Network Setup                   Create networks
1:30    Fabric Network                  Start orderers, peers
2:00    Wait                            Network initialization
2:30    Blockchain Init                 Create channel, deploy chaincode
4:00    Build Images                    Build all Docker images
7:00    Start Infrastructure            PostgreSQL, Redis, Kafka
7:30    Wait                            Infrastructure ready
8:00    Start Applications              Gateway, Bridge, Services
9:00    Start Frontend                  React application
9:30    Data Initialization             Enroll admin, seed users
10:30   Verification                    Health checks, tests
11:00   Complete                        System ready!
────────────────────────────────────────────────────────────────
Total: ~11-15 minutes (depending on hardware and network)
```

---

## Success Indicators

```
✓ Docker running
✓ 25+ containers up
✓ fabric-network created
✓ coffeechannel created
✓ Chaincode deployed
✓ PostgreSQL connected
✓ Gateway healthy (port 3000)
✓ Bridge healthy (port 3008)
✓ Frontend accessible (port 5173)
✓ Login works (admin/admin123)
✓ Blockchain queries work
✓ Database queries work
✓ Performance <50ms
```

---

## Rollback Plan

```
If deployment fails:

1. Stop all containers
   docker-compose -f docker-compose-hybrid.yml down
   docker-compose -f docker-compose-fabric.yml down

2. Remove volumes (optional)
   docker volume prune -f

3. Check logs
   docker logs <failed-container>

4. Fix issue

5. Retry deployment
   DEPLOY-ALL.bat
```

---

**Visual Guide Complete**

This flowchart provides a visual representation of the entire deployment process, component architecture, data flow, network topology, and timeline.

