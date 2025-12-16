# Remaining Status Constant Fixes Needed

**Date:** November 4, 2025, 4:26 PM  
**Status:** 36 old status constants found across 15 files  
**Action Required:** Update all old status constants

---

## Files Requiring Updates

### High Priority (Core Services)

1. **`api/shared/swagger.config.ts`** - 6 matches
2. **`api/shared/validation.schemas.ts`** - 6 matches
3. **`api/ecta/src/controllers/quality.controller.ts`** - 4 matches
4. **`api/commercialbank/src/controllers/export.controller.ts`** - 4 matches
5. **`api/shared/controllers/enhanced-export.controller.v2.ts`** - 4 matches
6. **`api/shared/exportService.ts`** - 3 matches (some already fixed)

### Medium Priority (Individual Controllers)

7. **`api/custom-authorities/src/controllers/customs.controller.ts`** - 1 match
8. **`api/custom-authorities/src/controllers/export.controller.ts`** - 1 match
9. **`api/ecta/src/controllers/export.controller.ts`** - 1 match
10. **`api/commercialbank/src/controllers/quality.controller.ts`** - 1 match

### Low Priority (Tests & Utilities)

11. **`api/shared/__tests__/exportService.test.ts`** - 1 match
12. **`api/shared/audit.service.ts`** - 1 match
13. **`api/shared/middleware/monitoring.middleware.ts`** - 1 match
14. **`api/shared/notification.service.ts`** - 1 match
15. **`api/shared/types.ts`** - 1 match

---

## Old Status Constants to Replace

### Replace These:
```
EXPORT_CUSTOMS_PENDING    → CUSTOMS_PENDING
EXPORT_CUSTOMS_CLEARED    → CUSTOMS_CLEARED
EXPORT_CUSTOMS_REJECTED   → CUSTOMS_REJECTED
QUALITY_PENDING           → ECTA_QUALITY_PENDING
QUALITY_CERTIFIED         → ECTA_QUALITY_APPROVED
QUALITY_REJECTED          → ECTA_QUALITY_REJECTED
BANKING_PENDING           → BANK_DOCUMENT_PENDING
BANKING_APPROVED          → BANK_DOCUMENT_VERIFIED
BANKING_REJECTED          → BANK_DOCUMENT_REJECTED
FX_PENDING                → FX_APPLICATION_PENDING
```

---

## Immediate Action Required

The shipping-line API is fixed, but these 15 shared and other API files still have old constants that will cause:
- TypeScript compilation errors
- Runtime errors
- Inconsistent behavior across APIs

**Recommendation:** Fix all 15 files before deployment.

---

**Status:** IDENTIFIED  
**Files:** 15  
**Matches:** 36  
**Priority:** HIGH
