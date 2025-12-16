# 🔧 Exporter Portal vs commercialbank - Resolution

**Date:** October 25, 2025  
**Status:** ⚠️ **CONFLICT RESOLVED**

---

## 🎯 The Problem

There are **TWO separate APIs** with overlapping responsibilities and port conflicts:

1. **Exporter Portal API** (Port 3002) - External exporter interface
2. **commercialbank API** (Port 3001) - Consortium banking node

This causes confusion and conflicts in the system architecture.

---

## 📊 Current Situation Analysis

### **Exporter Portal API**
- **Port:** 3002 (conflicts with National Bank)
- **Purpose:** External exporter interface
- **Database:** PostgreSQL (separate from blockchain)
- **Organization:** ExporterPortal
- **Users:** External coffee exporters
- **Features:** Create export requests, upload documents, track status

### **commercialbank API**
- **Port:** 3001
- **Purpose:** Consortium banking node
- **Database:** Blockchain (Hyperledger Fabric)
- **Organization:** commercialbank (consortium member)
- **Users:** Bank officers, FX managers
- **Features:** FX approval, banking validation, payment confirmation

---

## ⚠️ Key Conflicts

### 1. **Port Conflict**
- Exporter Portal wants port 3002
- National Bank is using port 3002
- Both can't run simultaneously

### 2. **Naming Confusion**
- "Exporter" in both names causes confusion
- Frontend doesn't know which to call
- Documentation is unclear

### 3. **Overlapping Functionality**
- Both can create exports
- Both handle documents
- Unclear separation of concerns

---

## ✅ RECOMMENDED SOLUTION

### **Option 1: Merge into Single API (Recommended)**

Merge Exporter Portal into commercialbank API with role-based access:

```
commercialbank API (Port 3001)
├── /api/auth (All users)
├── /api/exports (All users - role-based access)
│   ├── POST /   (Exporters: create, Banks: approve)
│   ├── GET /    (All: view based on role)
│   └── POST /:id/approve-fx (Banks only)
├── /api/documents (All users)
└── /api/banking (Banks only)
```

**Benefits:**
- ✅ Single source of truth
- ✅ No port conflicts
- ✅ Unified authentication
- ✅ Consistent data model
- ✅ Easier to maintain

**Implementation:**
1. Add role-based middleware
2. Separate exporter vs banker routes
3. Use single blockchain connection
4. Deprecate exporter-portal

---

### **Option 2: Keep Separate with Clear Boundaries**

Keep both APIs but with clear separation:

```
┌─────────────────────────────────────────────┐
│         EXPORTER PORTAL API                 │
│         Port: 3006 (NEW PORT)               │
│         Purpose: External Interface         │
├─────────────────────────────────────────────┤
│ Users: Coffee Exporters                     │
│ Features:                                   │
│  - Register/Login                           │
│  - Create export requests                   │
│  - Upload documents                         │
│  - Track status (read-only)                 │
│  - View notifications                       │
│                                             │
│ Database: PostgreSQL (metadata)             │
│ Blockchain: Submit transactions only        │
└─────────────────────────────────────────────┘
                    │
                    ▼ (submits to blockchain)
┌─────────────────────────────────────────────┐
│      commercialbank API (Consortium)         │
│         Port: 3001                          │
│         Purpose: Banking Operations         │
├─────────────────────────────────────────────┤
│ Users: Bank Officers, FX Managers           │
│ Features:                                   │
│  - View all exports                         │
│  - Approve/Reject FX                        │
│  - Approve/Reject Banking                   │
│  - Confirm payments                         │
│  - Complete exports                         │
│                                             │
│ Database: Blockchain (Hyperledger Fabric)   │
│ Blockchain: Full read/write access          │
└─────────────────────────────────────────────┘
```

**Benefits:**
- ✅ Clear separation of concerns
- ✅ External vs internal interface
- ✅ Different security models
- ✅ Scalable independently

**Drawbacks:**
- ❌ More complex architecture
- ❌ Duplicate code
- ❌ Two databases to maintain
- ❌ Synchronization issues

---

## 🎯 DECISION: Option 1 (Merge)

**Rationale:**
1. Simpler architecture
2. Single source of truth
3. No synchronization issues
4. Easier to maintain
5. Better for consortium model

---

## 📋 Implementation Plan

### **Phase 1: Update commercialbank API**

Add role-based access control:

```typescript
// Roles
enum UserRole {
  EXPORTER = 'exporter',
  BANK_OFFICER = 'bank_officer',
  FX_MANAGER = 'fx_manager',
  ADMIN = 'admin'
}

// Middleware
const requireRole = (roles: UserRole[]) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }
    next();
  };
};

// Routes
router.post('/exports', 
  requireRole([UserRole.EXPORTER]), 
  exportController.createExport
);

router.post('/exports/:id/approve-fx', 
  requireRole([UserRole.FX_MANAGER, UserRole.ADMIN]), 
  exportController.approveFX
);
```

### **Phase 2: Migrate Exporter Portal Features**

Move these to commercialbank:
- ✅ Exporter registration
- ✅ Export creation (exporter role)
- ✅ Document upload
- ✅ Status tracking

### **Phase 3: Update Frontend**

Update proxy configuration:

```javascript
// vite.config.js
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001', // Single API
        changeOrigin: true
      }
    }
  }
})
```

### **Phase 4: Deprecate Exporter Portal**

- Mark as deprecated
- Redirect to commercialbank
- Remove from startup script
- Archive code

---

## 🔧 Quick Fix (Immediate)

**For now, to resolve the immediate issue:**

### 1. **Change Exporter Portal Port**

Update `/home/gu-da/cbc/api/exporter-portal/.env.example`:

```env
# OLD
PORT=3002

# NEW
PORT=3006  # Avoid conflict with National Bank
```

### 2. **Update Frontend Proxy**

Already done! The vite config now has:

```javascript
'/api-portal': {
  target: 'http://localhost:3001',  // Points to commercialbank
  changeOrigin: true,
  rewrite: (path) => path.replace(/^\/api-portal/, '/api')
}
```

### 3. **Use commercialbank for Everything**

The frontend should use commercialbank API (port 3001) for all operations.

---

## 📊 Port Allocation (Final)

```
3001 - commercialbank API (Primary - handles everything)
3002 - National Bank API
3003 - ECTA API (Quality Assurance)
3004 - Shipping Line API
3005 - Custom Authorities API
3006 - Exporter Portal API (Deprecated - to be removed)
```

---

## ✅ Recommended Actions

### **Immediate (Today)**

1. ✅ **Use commercialbank API** (port 3001) for all operations
2. ✅ **Frontend proxy fixed** - points to port 3001
3. ✅ **All approval actions working** in commercialbank

### **Short-term (This Week)**

1. Add role-based access control to commercialbank
2. Add exporter registration endpoint
3. Test all workflows with roles

### **Medium-term (Next Sprint)**

1. Migrate any unique Exporter Portal features
2. Update documentation
3. Deprecate Exporter Portal
4. Remove from codebase

---

## 🎯 Summary

### **The Dispute:**
- Two APIs with similar names and overlapping functionality
- Port conflicts (both wanted 3002)
- Unclear separation of concerns
- Frontend confusion

### **The Resolution:**
- ✅ **Use commercialbank API (port 3001) as the primary API**
- ✅ **Add role-based access** for exporters vs bankers
- ✅ **Deprecate Exporter Portal** (port 3006 if needed temporarily)
- ✅ **Single source of truth** on blockchain
- ✅ **Frontend points to port 3001**

### **Current Status:**
- ✅ commercialbank API running on port 3001
- ✅ All approval actions working
- ✅ Frontend proxy configured correctly
- ✅ No more ECONNREFUSED errors

---

## 📚 Architecture Decision

**We are using a CONSORTIUM MODEL:**

```
External Users (Exporters)
         │
         ▼
┌────────────────────┐
│  commercialbank API │  ← Single entry point
│    (Port 3001)     │
└────────┬───────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Hyperledger Fabric Network     │
│  (Shared by all consortium)     │
└─────────────────────────────────┘
         │
    ┌────┴────┬────────┬──────────┐
    ▼         ▼        ▼          ▼
National   ECTA    Shipping   Customs
  Bank              Line    Authorities
(3002)    (3003)   (3004)     (3005)
```

**All organizations access the SAME blockchain through their respective APIs.**

---

**Status:** ✅ **RESOLVED**  
**Recommendation:** Use commercialbank API (port 3001) for everything  
**Action Required:** Add role-based access control
