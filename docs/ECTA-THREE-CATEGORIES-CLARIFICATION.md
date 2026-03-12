# ECTA Three Exporter Categories - Clarification Needed

## Current Understanding

Based on your feedback: "ECTA has three category for exporters" and "<=15M, >=15M and >=20M"

I believe you're referring to THREE CAPITAL TIERS, not business types:

### Proposed Three Categories:

| Category | Capital Range (ETB) | Auto-Qualification Level |
|----------|-------------------|-------------------------|
| **Category 1** | < 15,000,000 | REJECTED (below minimum) |
| **Category 2** | 15,000,000 - 19,999,999 | PARTIAL (profile approved, manual review for certificates) |
| **Category 3** | ≥ 20,000,000 | FULL (all stages auto-approved + license issued) |

## Current Code Issues

### 1. In `chaincode/ecta/index.js` RegisterUser():
```javascript
// CURRENT (WRONG):
const capitalRequirements = {
    'PRIVATE_EXPORTER': 15000000,
    'UNION': 15000000,
    'FARMER_COOPERATIVE': 15000000,
    'INDIVIDUAL': 15000000
};

const FULL_QUALIFICATION_THRESHOLD = 20000000; // Line 130
```

### 2. In `auth.routes.js`:
```javascript
// CURRENT (WRONG):
const capitalRequirements = {
  'PRIVATE_EXPORTER': 50000000,  // TOO HIGH!
  'UNION': 15000000,
  'FARMER_COOPERATIVE': 5000000,
  'INDIVIDUAL': 10000000
};
```

## Proposed Fix

### Option A: Three Capital Tiers (Regardless of Business Type)
All business types follow the same three-tier system:

```javascript
// Minimum capital to register
const MINIMUM_CAPITAL = 15000000; // 15M ETB

// Full auto-qualification threshold
const FULL_QUALIFICATION_THRESHOLD = 20000000; // 20M ETB

// Logic:
if (capitalETB < 15000000) {
    status = 'rejected'; // Category 1
} else if (capitalETB >= 15000000 && capitalETB < 20000000) {
    status = 'approved'; // Category 2 - can login, needs manual approval
} else if (capitalETB >= 20000000) {
    status = 'active'; // Category 3 - fully qualified + license
}
```

### Option B: Three Business Type Categories
Different requirements per business type:

```javascript
const capitalRequirements = {
    'SMALL': 15000000,      // Small exporters (unions, coops)
    'MEDIUM': 20000000,     // Medium exporters (private companies)
    'LARGE': 50000000       // Large exporters (corporations)
};
```

## Questions for You

1. **Are the three categories based on CAPITAL AMOUNT or BUSINESS TYPE?**
   - If capital amount → Use Option A
   - If business type → Use Option B

2. **What are the exact three categories called in ECTA regulations?**
   - Category 1: _______________
   - Category 2: _______________
   - Category 3: _______________

3. **What are the exact capital requirements?**
   - Minimum to register: _____ ETB
   - Medium tier: _____ ETB
   - Full qualification: _____ ETB

4. **Do different business types have different requirements?**
   - Private Company: _____ ETB
   - Union/Cooperative: _____ ETB
   - Individual: _____ ETB
   - Farmer Cooperative: _____ ETB

## My Recommendation

Based on your statement "<=15M, >=15M and >=20M", I recommend:

**THREE CAPITAL TIERS (Option A):**
- **Tier 1 (Rejected)**: Capital < 15M ETB → Cannot register
- **Tier 2 (Approved)**: Capital 15M-19.99M ETB → Can login, needs ECTA manual approval for certificates
- **Tier 3 (Fully Qualified)**: Capital ≥ 20M ETB → Auto-approved for everything + license issued

This applies to ALL business types equally.

## Next Steps

Please confirm:
1. Are these three CAPITAL TIERS or three BUSINESS TYPE CATEGORIES?
2. What are the exact thresholds?
3. Should I implement Option A or Option B?

Once confirmed, I will:
1. Update `chaincode/ecta/index.js` with correct thresholds
2. Update `auth.routes.js` with correct validation
3. Deploy updated chaincode (v1.2)
4. Test all three categories
5. Document the final implementation

---

**Waiting for your confirmation before proceeding with the fix.**
