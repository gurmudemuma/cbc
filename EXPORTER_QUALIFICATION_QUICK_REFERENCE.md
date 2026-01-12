# Exporter Qualification - Quick Reference Card

## 🎯 6 Required Checkpoints

| # | Checkpoint | Status Required | Exemption |
|---|------------|----------------|-----------|
| 1 | **Exporter Profile** | `ACTIVE` | None |
| 2 | **Minimum Capital** | Verified | Farmers |
| 3 | **Laboratory** | `ACTIVE` | Farmers |
| 4 | **Taster** | `ACTIVE` | Farmers |
| 5 | **Competence Certificate** | `ACTIVE` | None |
| 6 | **Export License** | `ACTIVE` | None |

**All 6 must be complete before creating exports!**

---

## 🔑 Key Code Patterns

### Pattern 1: Get exporter_id from user_id

```typescript
const userId = req.user.id; // From JWT
const profile = await pool.query(
  'SELECT exporter_id FROM exporter_profiles WHERE user_id = $1',
  [userId]
);
const exporterId = profile.rows[0].exporter_id;
```

---

### Pattern 2: Validate Qualification

```typescript
const qualificationCheck = await ectaPreRegistrationService.canCreateExportRequest(exporterId);

if (!qualificationCheck.allowed) {
  return res.status(403).json({
    success: false,
    message: 'Not qualified to create exports',
    reason: qualificationCheck.reason,
    requiredActions: qualificationCheck.requiredActions
  });
}
```

---

### Pattern 3: Create Export with exporter_id

```typescript
await pool.query(
  `INSERT INTO exports (export_id, exporter_id, ...) 
   VALUES ($1, $2, ...)`,
  [exportId, exporterId, ...] // Use exporterId, NOT userId
);
```

---

### Pattern 4: Verify Ownership

```typescript
const result = await pool.query(
  'SELECT * FROM exports WHERE export_id = $1 AND exporter_id = $2',
  [exportId, exporterId]
);

if (result.rows.length === 0) {
  throw new Error('Unauthorized');
}
```

---

## 📋 Minimum Capital Requirements

| Business Type | Minimum Capital (ETB) |
|---------------|----------------------|
| Private | 15,000,000 |
| Trade Association | 20,000,000 |
| Joint Stock | 20,000,000 |
| LLC | 20,000,000 |
| Farmer | 0 (Exempt) |

---

## 🔄 Status Values

### Exporter Profile
- `PENDING_APPROVAL` - Awaiting ECTA review
- `ACTIVE` - Approved by ECTA ✅
- `REJECTED` - Rejected by ECTA
- `SUSPENDED` - Temporarily suspended

### Laboratory
- `PENDING` - Awaiting ECTA certification
- `ACTIVE` - Certified by ECTA ✅
- `EXPIRED` - Certification expired
- `REJECTED` - Certification rejected

### Taster
- `PENDING` - Awaiting ECTA verification
- `ACTIVE` - Verified by ECTA ✅
- `EXPIRED` - Certificate expired
- `REJECTED` - Verification rejected

### Competence Certificate
- `PENDING` - Application submitted
- `ACTIVE` - Issued by ECTA ✅
- `EXPIRED` - Certificate expired
- `REJECTED` - Application rejected

### Export License
- `PENDING` - Application submitted
- `ACTIVE` - Issued by ECTA ✅
- `EXPIRED` - License expired
- `SUSPENDED` - Temporarily suspended
- `REJECTED` - Application rejected

---

## 🚀 Quick Start Commands

### Check Qualification Status
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/exporter/preregistration/qualification-status
```

### Register Exporter Profile
```bash
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"businessName":"ABC Coffee","businessType":"PRIVATE","tin":"1234567890","minimumCapital":15000000}' \
  http://localhost:3001/api/exporter/preregistration/profile
```

### Create Export (if qualified)
```bash
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"exportId":"EXP-001","coffeeType":"ARABICA","quantity":1000}' \
  http://localhost:3001/api/exporter/exports
```

---

## 🔍 Debugging Queries

### Find User's Exporter ID
```sql
SELECT exporter_id FROM exporter_profiles WHERE user_id = 'USER_ID';
```

### Check All Qualifications
```sql
SELECT 
  ep.business_name,
  ep.status as profile,
  cl.status as lab,
  ct.status as taster,
  cc.status as competence,
  el.status as license
FROM exporter_profiles ep
LEFT JOIN coffee_laboratories cl ON ep.exporter_id = cl.exporter_id
LEFT JOIN coffee_tasters ct ON ep.exporter_id = ct.exporter_id
LEFT JOIN competence_certificates cc ON ep.exporter_id = cc.exporter_id
LEFT JOIN export_licenses el ON ep.exporter_id = el.exporter_id
WHERE ep.exporter_id = 'EXPORTER_ID';
```

### Find Exports by Exporter
```sql
SELECT * FROM exports WHERE exporter_id = 'EXPORTER_ID' ORDER BY created_at DESC;
```

---

## ⚠️ Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Exporter profile not found" | No profile registered | Complete Step 1 |
| "Not qualified to create exports" | Missing qualifications | Check qualification status |
| "Laboratory must be certified first" | No lab certification | Complete Step 3 or register as farmer |
| "Competence certificate required" | No competence cert | Complete Step 5 |
| "Export license expired" | License validity passed | Renew license |
| "Unauthorized" | Wrong exporter_id | Verify ownership |

---

## 📞 API Endpoints

### Exporter Portal
- `POST /api/exporter/preregistration/profile` - Register
- `GET /api/exporter/preregistration/qualification-status` - Check status
- `POST /api/exporter/exports` - Create export

### ECTA Portal
- `GET /api/ecta/preregistration/exporters/pending` - Pending profiles
- `POST /api/ecta/preregistration/exporters/:id/approve` - Approve profile
- `POST /api/ecta/preregistration/laboratories/:id/certify` - Certify lab
- `POST /api/ecta/preregistration/tasters/:id/verify` - Verify taster
- `POST /api/ecta/preregistration/competence/:id/issue` - Issue competence
- `POST /api/ecta/preregistration/licenses/:id/issue` - Issue license

---

## 🎓 Remember

1. **Always use exporter_id, not user_id** for export operations
2. **Always validate qualification** before allowing export creation
3. **Always verify ownership** before allowing access
4. **Handle farmer exemptions** correctly (no lab/taster required)
5. **Check expiry dates** for certificates and licenses
6. **Return helpful errors** with requiredActions
7. **Log all actions** for audit trail

---

**Quick Reference Version:** 1.0.0  
**Last Updated:** January 1, 2026

