# exporter_id Authentication & Authorization Flow

## 🔐 Complete Authentication Chain

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER AUTHENTICATION                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  User Login      │
                    │  (JWT Token)     │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   user_id        │
                    │   (from JWT)     │
                    └──────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              EXPORTER PROFILE LOOKUP                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        SELECT * FROM exporter_profiles 
        WHERE user_id = $1
                              │
                              ▼
                    ┌──────────────────┐
                    │  exporter_id     │
                    │  (UUID)          │
                    └──────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              QUALIFICATION VALIDATION                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
    ┌──────────────────┐        ┌──────────────────┐
    │ Profile Status   │        │ Minimum Capital  │
    │ = ACTIVE?        │        │ Verified?        │
    └──────────────────┘        └──────────────────┘
                │                           │
                └─────────────┬─────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
    ┌──────────────────┐        ┌──────────────────┐
    │ Laboratory       │        │ Taster           │
    │ Certified?       │        │ Verified?        │
    └──────────────────┘        └──────────────────┘
                │                           │
                └─────────────┬─────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
    ┌──────────────────┐        ┌──────────────────┐
    │ Competence Cert  │        │ Export License   │
    │ Valid?           │        │ Valid?           │
    └──────────────────┘        └──────────────────┘
                │                           │
                └─────────────┬─────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  ALL CHECKS      │
                    │  PASSED?         │
                    └──────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                   YES                 NO
                    │                   │
                    ▼                   ▼
        ┌──────────────────┐  ┌──────────────────┐
        │ ✅ AUTHORIZED    │  │ ❌ REJECTED      │
        │ Create Export    │  │ Return Error     │
        └──────────────────┘  └──────────────────┘
                    │                   │
                    ▼                   ▼
        ┌──────────────────┐  ┌──────────────────┐
        │ INSERT INTO      │  │ HTTP 403         │
        │ exports          │  │ + Required       │
        │ (exporter_id)    │  │ Actions          │
        └──────────────────┘  └──────────────────┘
```

---

## 🔑 Key Relationships

### 1. User → Exporter Profile (1:1)

```sql
users (id) ←→ exporter_profiles (user_id, exporter_id)
```

**Purpose:** Links authentication identity to business entity

**Query:**
```typescript
const profile = await pool.query(
  'SELECT * FROM exporter_profiles WHERE user_id = $1',
  [userId]
);
const exporterId = profile.rows[0].exporter_id;
```

---

### 2. Exporter → Laboratory (1:1)

```sql
exporter_profiles (exporter_id) ←→ coffee_laboratories (exporter_id)
```

**Purpose:** Links exporter to their certified laboratory

**Query:**
```typescript
const lab = await pool.query(
  'SELECT * FROM coffee_laboratories WHERE exporter_id = $1 AND status = $2',
  [exporterId, 'ACTIVE']
);
```

---

### 3. Exporter → Taster (1:Many)

```sql
exporter_profiles (exporter_id) ←→ coffee_tasters (exporter_id)
```

**Purpose:** Links exporter to their qualified tasters

**Query:**
```typescript
const tasters = await pool.query(
  'SELECT * FROM coffee_tasters WHERE exporter_id = $1 AND status = $2',
  [exporterId, 'ACTIVE']
);
```

---

### 4. Exporter → Competence Certificate (1:1)

```sql
exporter_profiles (exporter_id) ←→ competence_certificates (exporter_id)
```

**Purpose:** Links exporter to their competence certification

**Query:**
```typescript
const cert = await pool.query(
  'SELECT * FROM competence_certificates WHERE exporter_id = $1 AND status = $2',
  [exporterId, 'ACTIVE']
);
```

---

### 5. Exporter → Export License (1:1)

```sql
exporter_profiles (exporter_id) ←→ export_licenses (exporter_id)
```

**Purpose:** Links exporter to their export license

**Query:**
```typescript
const license = await pool.query(
  'SELECT * FROM export_licenses WHERE exporter_id = $1 AND status = $2',
  [exporterId, 'ACTIVE']
);
```

---

### 6. Exporter → Exports (1:Many)

```sql
exporter_profiles (exporter_id) ←→ exports (exporter_id)
```

**Purpose:** Links exporter to all their export requests

**Query:**
```typescript
const exports = await pool.query(
  'SELECT * FROM exports WHERE exporter_id = $1 ORDER BY created_at DESC',
  [exporterId]
);
```

---

## 🛡️ Authorization Checks

### Check 1: Profile Ownership

```typescript
// Verify user owns the exporter profile
const profile = await pool.query(
  'SELECT * FROM exporter_profiles WHERE exporter_id = $1 AND user_id = $2',
  [exporterId, userId]
);

if (profile.rows.length === 0) {
  throw new Error('Unauthorized: Profile does not belong to this user');
}
```

---

### Check 2: Export Ownership

```typescript
// Verify export belongs to exporter
const export = await pool.query(
  'SELECT * FROM exports WHERE export_id = $1 AND exporter_id = $2',
  [exportId, exporterId]
);

if (export.rows.length === 0) {
  throw new Error('Unauthorized: Export does not belong to this exporter');
}
```

---

### Check 3: Qualification Status

```typescript
// Verify exporter is qualified to create exports
const validation = await ectaPreRegistrationService.validateExporter(exporterId);

if (!validation.isValid) {
  throw new Error('Not qualified to create exports');
}
```

---

### Check 4: Document Ownership

```typescript
// Verify document belongs to exporter
const document = await pool.query(
  'SELECT * FROM export_documents WHERE document_id = $1 AND exporter_id = $2',
  [documentId, exporterId]
);

if (document.rows.length === 0) {
  throw new Error('Unauthorized: Document does not belong to this exporter');
}
```

---

## 🔄 Complete Request Flow

### Example: Create Export Request

```typescript
// 1. Extract JWT token from request header
const token = req.headers.authorization?.split(' ')[1];

// 2. Verify JWT and extract user_id
const decoded = jwt.verify(token, JWT_SECRET);
const userId = decoded.id;

// 3. Get exporter_id from user_id
const profileResult = await pool.query(
  'SELECT exporter_id FROM exporter_profiles WHERE user_id = $1',
  [userId]
);

if (profileResult.rows.length === 0) {
  return res.status(404).json({
    success: false,
    message: 'Exporter profile not found. Please register first.'
  });
}

const exporterId = profileResult.rows[0].exporter_id;

// 4. Validate exporter qualification
const qualificationCheck = await ectaPreRegistrationService.canCreateExportRequest(exporterId);

if (!qualificationCheck.allowed) {
  return res.status(403).json({
    success: false,
    message: 'Cannot create export request. Pre-qualification requirements not met.',
    reason: qualificationCheck.reason,
    requiredActions: qualificationCheck.requiredActions
  });
}

// 5. Create export with exporter_id
const exportResult = await pool.query(
  `INSERT INTO exports (
    export_id, 
    exporter_id,  -- KEY: Use exporter_id, NOT user_id
    exporter_name,
    coffee_type,
    quantity,
    status,
    created_at
  ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
  RETURNING *`,
  [
    exportId,
    exporterId,  // From step 3
    exporterName,
    coffeeType,
    quantity,
    'DRAFT'
  ]
);

// 6. Return success
return res.status(201).json({
  success: true,
  message: 'Export request created successfully',
  data: exportResult.rows[0]
});
```

---

## 🎯 Why exporter_id is Critical

### 1. Separation of Concerns

- **user_id** = Authentication identity (login credentials)
- **exporter_id** = Business entity (company/organization)

**Benefit:** One user can potentially manage multiple exporter profiles (future feature)

---

### 2. Data Integrity

All export-related data is linked to `exporter_id`:
- Exports
- Documents
- Certificates
- Licenses
- Laboratories
- Tasters

**Benefit:** Consistent data relationships across all tables

---

### 3. Authorization Control

```typescript
// Easy to check if user can access resource
const canAccess = await pool.query(
  `SELECT 1 FROM exports e
   JOIN exporter_profiles ep ON e.exporter_id = ep.exporter_id
   WHERE e.export_id = $1 AND ep.user_id = $2`,
  [exportId, userId]
);
```

**Benefit:** Single query to verify ownership

---

### 4. Audit Trail

```typescript
// All actions tracked by exporter_id
INSERT INTO audit_log (
  action,
  resource_type,
  resource_id,
  exporter_id,  -- Who did it
  user_id,      -- Which user account
  timestamp
) VALUES (...);
```

**Benefit:** Complete accountability and traceability

---

### 5. Business Logic

```typescript
// Qualification checks use exporter_id
const validation = await ectaPreRegistrationService.validateExporter(exporterId);

// Not user_id, because qualifications belong to the business entity
```

**Benefit:** Correct business entity validation

---

## 🚨 Common Mistakes to Avoid

### ❌ Mistake 1: Using user_id instead of exporter_id

```typescript
// WRONG
INSERT INTO exports (export_id, exporter_id, ...)
VALUES ($1, $2, ...)  -- Using user_id here
```

```typescript
// CORRECT
const profile = await getExporterProfile(userId);
INSERT INTO exports (export_id, exporter_id, ...)
VALUES ($1, $2, ...)  -- Using profile.exporter_id
```

---

### ❌ Mistake 2: Skipping qualification validation

```typescript
// WRONG
async createExport(data) {
  // Directly create export without checking
  return await pool.query('INSERT INTO exports ...');
}
```

```typescript
// CORRECT
async createExport(data) {
  const canExport = await ectaPreRegistrationService.canCreateExportRequest(exporterId);
  if (!canExport.allowed) {
    throw new Error('Not qualified');
  }
  return await pool.query('INSERT INTO exports ...');
}
```

---

### ❌ Mistake 3: Not verifying ownership

```typescript
// WRONG
async getExport(exportId) {
  // Return any export without checking ownership
  return await pool.query('SELECT * FROM exports WHERE export_id = $1', [exportId]);
}
```

```typescript
// CORRECT
async getExport(exportId, exporterId) {
  // Only return if belongs to exporter
  return await pool.query(
    'SELECT * FROM exports WHERE export_id = $1 AND exporter_id = $2',
    [exportId, exporterId]
  );
}
```

---

## 📊 Monitoring & Debugging

### Check User's Exporter Profile

```sql
SELECT 
  u.id as user_id,
  u.username,
  ep.exporter_id,
  ep.business_name,
  ep.status as profile_status
FROM users u
LEFT JOIN exporter_profiles ep ON u.id = ep.user_id
WHERE u.id = 'USER_ID_HERE';
```

---

### Check Exporter's Qualification Status

```sql
SELECT 
  ep.exporter_id,
  ep.business_name,
  ep.status as profile_status,
  cl.status as lab_status,
  ct.status as taster_status,
  cc.status as competence_status,
  el.status as license_status,
  CASE 
    WHEN ep.status = 'ACTIVE' 
     AND (cl.status = 'ACTIVE' OR ep.business_type = 'FARMER')
     AND (ct.status = 'ACTIVE' OR ep.business_type = 'FARMER')
     AND cc.status = 'ACTIVE'
     AND el.status = 'ACTIVE'
    THEN 'QUALIFIED'
    ELSE 'NOT QUALIFIED'
  END as qualification_status
FROM exporter_profiles ep
LEFT JOIN coffee_laboratories cl ON ep.exporter_id = cl.exporter_id
LEFT JOIN coffee_tasters ct ON ep.exporter_id = ct.exporter_id
LEFT JOIN competence_certificates cc ON ep.exporter_id = cc.exporter_id
LEFT JOIN export_licenses el ON ep.exporter_id = el.exporter_id
WHERE ep.exporter_id = 'EXPORTER_ID_HERE';
```

---

### Check Export Ownership

```sql
SELECT 
  e.export_id,
  e.exporter_id,
  ep.business_name,
  ep.user_id,
  u.username
FROM exports e
JOIN exporter_profiles ep ON e.exporter_id = ep.exporter_id
JOIN users u ON ep.user_id = u.id
WHERE e.export_id = 'EXPORT_ID_HERE';
```

---

## ✅ Checklist for Developers

When implementing any export-related feature:

- [ ] Extract `user_id` from JWT token
- [ ] Get `exporter_id` from `exporter_profiles` using `user_id`
- [ ] Validate exporter qualification using `ectaPreRegistrationService.validateExporter()`
- [ ] Use `exporter_id` (not `user_id`) in all database operations
- [ ] Verify ownership before allowing access to resources
- [ ] Return helpful error messages with `requiredActions`
- [ ] Log all actions with both `user_id` and `exporter_id`
- [ ] Handle farmer exemptions correctly
- [ ] Check certificate/license expiry dates
- [ ] Create audit trail entries

---

**Document Version:** 1.0.0  
**Last Updated:** January 1, 2026  
**Status:** ✅ Complete Reference Guide

