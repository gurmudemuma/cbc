# Documentation Guide

**Quick navigation for Coffee Blockchain Consortium documentation - v2.0**

---

## 🚀 Getting Started

Start here if you're new to the project:

1. **[README.md](./README.md)** - Project overview and quick introduction
2. **[QUICK_START.md](./QUICK_START.md)** - Fast setup for local development
3. **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Complete deployment instructions for v2.0

---

## 🏗️ Architecture & Workflow

Understanding the system design:

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture overview
- **[CORRECTED_WORKFLOW.md](./CORRECTED_WORKFLOW.md)** - ⭐ **v2.0 Authoritative Workflow** (National Bank creates records, banking approval stage)
- **[SYSTEM_DIAGRAM.md](./SYSTEM_DIAGRAM.md)** - Visual system diagrams
- **[DASHBOARD_WORKFLOW_CHART.md](./DASHBOARD_WORKFLOW_CHART.md)** - Dashboard visualization features

---

## 🔧 Setup & Configuration

Setting up your development environment:

- **[IPFS_SETUP.md](./IPFS_SETUP.md)** - IPFS configuration (required for document storage)
- **[COUCHDB_MIGRATION_GUIDE.md](./COUCHDB_MIGRATION_GUIDE.md)** - CouchDB setup and configuration
- **[COUCHDB_MIGRATION_COMPLETE.md](./COUCHDB_MIGRATION_COMPLETE.md)** - CouchDB migration status
- **[FULL_CONTAINERIZATION_GUIDE.md](./FULL_CONTAINERIZATION_GUIDE.md)** - Docker containerization guide
- **[WINDOWS-QUICK-START.md](./WINDOWS-QUICK-START.md)** - Windows-specific setup instructions

---

## 💻 Development

Developer resources:

- **[DEVELOPER_NOTES.md](./DEVELOPER_NOTES.md)** - Developer reference and tips
- **[FRONTEND_GUIDE.md](./FRONTEND_GUIDE.md)** - Frontend development guide
- **[FRONTEND_WORKFLOW_UPDATE.md](./FRONTEND_WORKFLOW_UPDATE.md)** - v2.0 frontend changes and navigation
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Testing procedures and best practices
- **[IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md)** - Feature implementation tracking

---

## 🔐 Operations & Security

Production deployment and security:

- **[SECURITY.md](./SECURITY.md)** - Security best practices
- **[STARTUP_ORDER.md](./STARTUP_ORDER.md)** - Service startup sequence
- **[USER_CREDENTIALS.md](./USER_CREDENTIALS.md)** - Test user credentials
- **[INTER_SERVICE_COMMUNICATION.md](./INTER_SERVICE_COMMUNICATION.md)** - API integration patterns

---

## 📊 Reference

Technical reference documentation:

- **[DOCUMENT_TYPES.md](./DOCUMENT_TYPES.md)** - Document specifications and types
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history and changes
- **[DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)** - Complete documentation index
- **[WARP.md](./WARP.md)** - WARP AI assistant configuration

---

## 📋 Workflow Summary (v2.0)

```
┌─────────────────────────────────────────────────────────┐
│  Exporter Portal (Off-chain PostgreSQL)                 │
│  • Exporters create requests                            │
│  • Submits to National Bank API                         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Blockchain Consortium (Hyperledger Fabric)             │
├─────────────────────────────────────────────────────────┤
│  STEP 1: National Bank                                  │
│          • Creates blockchain record                    │
│          • Approves FX & license                        │
│          Status: FX_PENDING → FX_APPROVED               │
├─────────────────────────────────────────────────────────┤
│  STEP 2: commercialbank                                  │
│          • Validates financial documents                │
│          • Commercial invoice, sales contract           │
│          Status: BANKING_PENDING → BANKING_APPROVED     │
├─────────────────────────────────────────────────────────┤
│  STEP 3: ECTA                                           │
│          • Quality certification                        │
│          • Origin certificate                           │
│          Status: QUALITY_PENDING → QUALITY_CERTIFIED    │
├─────────────────────────────────────────────────────────┤
│  STEP 4: Customs                                        │
│          • Export clearance                             │
│          Status: EXPORT_CUSTOMS_PENDING → CLEARED       │
├─────────────────────────────────────────────────────────┤
│  STEP 5: Shipping Line                                  │
│          • Schedule shipment                            │
│          • Confirm departure                            │
│          Status: SHIPMENT_SCHEDULED → SHIPPED           │
├─────────────────────────────────────────────────────────┤
│  STEP 6: Shipping Line                                  │
│          • Notify arrival                               │
│          Status: SHIPPED → ARRIVED                      │
├─────────────────────────────────────────────────────────┤
│  STEP 7: Customs                                        │
│          • Import clearance                             │
│          Status: IMPORT_CUSTOMS_PENDING → COMPLETED     │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Changes in v2.0

### ✅ What's New:
- **National Bank creates blockchain records** (not commercialbank)
- **Banking approval stage** added (commercialbank validates financial docs)
- **Exporter Portal is off-chain** (PostgreSQL, not on blockchain)
- **Dashboard workflow visualization** with actor tracking
- **Sequential validation enforced** by chaincode

### ❌ What Changed:
- ~~Quality certification first~~ → FX approval first
- ~~commercialbank creates records~~ → National Bank creates records
- ~~No banking validation~~ → Banking approval required

---

## 📞 Need Help?

1. Check **[QUICK_START.md](./QUICK_START.md)** for fast setup
2. Review **[CORRECTED_WORKFLOW.md](./CORRECTED_WORKFLOW.md)** for workflow questions
3. See **[TROUBLESHOOTING](#)** section in DEPLOYMENT_GUIDE.md
4. Check **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** for test procedures

---

**Version:** 2.0  
**Last Updated:** 2025-01-21  
**Status:** ✅ Production Ready
