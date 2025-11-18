# Frontend Inconsistencies Report
**Generated:** November 5, 2024  
**Component:** Frontend Application

---

## 🔴 Critical Inconsistencies Found

### 1. **Port Number Mismatches** ❌

**Severity:** HIGH  
**Impact:** API calls will fail, services unreachable

#### Issue:
Frontend `api.config.js` has **incorrect port numbers** that don't match backend services:

| Service | Backend Port | Frontend Config | Status |
|---------|--------------|-----------------|--------|
| commercialbank | 3001 | 3001 ✅ | Correct |
| National Bank | 3002 | 3002 ✅ | Correct |
| **ECTA** | **3003** | **3004** ❌ | **WRONG** |
| **Shipping Line** | **3004** | **3007** ❌ | **WRONG** |
| Custom Authorities | 3005 | 3005 ✅ | Correct |
| ECX | 3006 | 3006 ✅ | Correct |

**Location:** `/frontend/src/config/api.config.js`
```javascript
// Line 23 - WRONG PORT
ecta: getEnvVar('VITE_API_ECTA', 'http://localhost:3004'),  // Should be 3003

// Line 26 - WRONG PORT  
shippingLine: getEnvVar('VITE_API_SHIPPING_LINE', 'http://localhost:3007'),  // Should be 3004
```

---

### 2. **ECTA References Not Updated** ❌

**Severity:** HIGH  
**Impact:** UI shows wrong organization name, CSS classes broken, routing issues

#### Files Still Using "ECTA":

**`App.jsx` (Line 26, 79-80):**
```javascript
if (orgLower === 'ncat') return 'ncat';  // Should be 'ecta'
// ECTA - Quality certification
if (orgLower === 'ncat') {  // Should be 'ecta'
```

**`index.css` (Lines 119-195):**
```css
/* ECTA */
--ncat-primary: #c0392b;
--ncat-secondary: #e67e22;
--ncat-background: #fff5f5;
--ncat-text: #2c3e50;

.organization-ncat {  /* Should be .organization-ecta */
  --color-primary: var(--ncat-primary);
  /* ... */
}
```

**`config/theme.config.js` (Line 109):**
```javascript
ncat: {  // Should be 'ecta'
  mode: 'light',
  primary: {
    main: '#8B4513',
```

**`config/theme.config.enhanced.js` (Line 434):**
```javascript
ncat: {  // Should be 'ecta'
  mode: 'light',
  primary: {
    main: '#8B4513',
```

**`components/Layout.jsx` (Lines 201-202, 330):**
```javascript
// ECTA
if (orgLower === 'ncat') {  // Should be 'ecta'
  return [
    /* ... */
  ];
}
if (orgLower === 'ncat') return 'ECTA Portal';  // Should be 'ECTA Portal'
```

**`components/Layout.styled.jsx` (Lines 202, 284):**
```javascript
// ECTA
if (orgLower === 'ncat') {  // Should be 'ecta'
if (orgLower === 'ncat') return 'ECTA Portal';  // Should be 'ECTA Portal'
```

**`pages/Dashboard.jsx` (Lines 168, 1086):**
```javascript
org: 'ECTA',  // Should be 'ECTA'
{user.organizationId === 'ncat' && (  // Should be 'ecta'
```

**`pages/ExportManagement.jsx` (Lines 140, 148, 158, 676, 733, 748, 1004, 1683):**
```javascript
const isNCat = orgId === 'ncat';  // Should be 'ecta'
const canCertifyQuality = isNCat;  // ECTA certifies coffee quality
: isNCat
  ? 'inspector'
// ECTA - Quality Certification
if (isNCat && (status === 'FX_APPROVED' || status === 'QUALITY_PENDING')) {
if (isNCat) return 'Quality Certification';
{isNCat && 'Certify coffee quality and issue certificates'}
{/* ECTA - Quality Certification */}
{isNCat && (
} else if (isNCat) {
```

**`pages/QualityCertification.jsx` (Line 136):**
```javascript
<Box className={`organization-${user.organizationId || 'ncat'}`} sx={{ p: 3 }}>
// Should be 'ecta'
```

---

### 3. **Organization ID Inconsistency** ⚠️

**Severity:** MEDIUM  
**Impact:** Confusion between different naming conventions

#### Issue:
Multiple ways to reference the same organization:

**ECTA/ECTA:**
- Config uses: `'ecta'`
- Code checks for: `'ncat'`
- Display shows: `'ECTA Portal'`

**National Bank:**
- Config uses: `'national-bank'`
- Code checks for: `'banker'`, `'nb-regulatory'`, `'banker-001'`

**Shipping Line:**
- Config uses: `'shipping-line'`
- Code checks for: `'shipping-line'`, `'shippingline'`, `'shipping'`

**Custom Authorities:**
- Config uses: `'custom-authorities'`
- Code checks for: `'custom-authorities'`, `'customauthorities'`

---

### 4. **API Configuration Comments Outdated** ⚠️

**Severity:** LOW  
**Impact:** Developer confusion

**`api.config.js` Line 8:**
```javascript
* - ecta: Ethiopian Coffee & Tea Authority API (Port 3004) - RENAMED from ECTA
```
Should say Port **3003**, not 3004

**Line 11:**
```javascript
* - shipping-line: Shipping Line API (Port 3007)
```
Should say Port **3004**, not 3007

---

## 📊 Impact Analysis

### Broken Functionality:
1. ❌ ECTA API calls will fail (wrong port 3004 instead of 3003)
2. ❌ Shipping Line API calls will fail (wrong port 3007 instead of 3004)
3. ❌ Users logging in as 'ecta' won't see correct UI (code looks for 'ncat')
4. ❌ CSS theming broken for ECTA users
5. ❌ Navigation menu won't show for ECTA users

### User Experience Issues:
- ECTA users will see broken/default UI
- API calls timeout or return 404 errors
- Organization branding doesn't work

---

## 🔧 Required Fixes

### Fix 1: Update Port Numbers ✅

**File:** `/frontend/src/config/api.config.js`

```javascript
// Line 23 - Fix ECTA port
ecta: getEnvVar('VITE_API_ECTA', 'http://localhost:3003'),  // Changed from 3004

// Line 26 - Fix Shipping Line port
shippingLine: getEnvVar('VITE_API_SHIPPING_LINE', 'http://localhost:3004'),  // Changed from 3007
```

Also update ORGANIZATIONS array:
```javascript
// Line 48 - Fix ECTA port
port: 3003,  // Changed from 3004

// Line 92 - Fix Shipping Line port
port: 3004,  // Changed from 3007
```

### Fix 2: Replace All ECTA References ✅

**Global Find & Replace:**
- `'ncat'` → `'ecta'`
- `'ECTA'` → `'ECTA'`
- `isNCat` → `isEcta`
- `--ncat-` → `--ecta-`
- `.organization-ncat` → `.organization-ecta`
- `ECTA Portal` → `ECTA Portal`

**Files to Update:**
1. `src/App.jsx`
2. `src/index.css`
3. `src/config/theme.config.js`
4. `src/config/theme.config.enhanced.js`
5. `src/components/Layout.jsx`
6. `src/components/Layout.styled.jsx`
7. `src/pages/Dashboard.jsx`
8. `src/pages/ExportManagement.jsx`
9. `src/pages/QualityCertification.jsx`

### Fix 3: Update Comments ✅

**File:** `/frontend/src/config/api.config.js`

```javascript
// Line 8
* - ecta: Ethiopian Coffee & Tea Authority API (Port 3003) - RENAMED from ECTA

// Line 11
* - shipping-line: Shipping Line API (Port 3004)
```

---

## 📝 Verification Steps

After fixes, verify:

```bash
# 1. Check no ECTA references remain
cd /home/gu-da/cbc/frontend
grep -r "ncat" src/ --ignore-case
# Should return: No matches

# 2. Verify port numbers
grep -n "3004" src/config/api.config.js
# Should show: Line 26 (shippingLine)

grep -n "3003" src/config/api.config.js
# Should show: Line 23 (ecta)

# 3. Test organization IDs
grep -r "organizationId === 'ecta'" src/
# Should find multiple matches

# 4. Check CSS classes
grep -r "organization-ecta" src/
# Should find matches in CSS and JSX files
```

---

## 🎯 Summary

**Total Issues:** 4 categories
- **Critical:** 2 (Port mismatches, ECTA references)
- **Medium:** 1 (Organization ID inconsistency)
- **Low:** 1 (Outdated comments)

**Files Affected:** 9 files
**Lines to Change:** ~30-40 lines

**Estimated Fix Time:** 30-45 minutes

---

## ✨ After Fixes

Frontend will have:
- ✅ Correct API port numbers matching backend
- ✅ Consistent ECTA naming (no ECTA)
- ✅ Working CSS theming for all organizations
- ✅ Proper routing and navigation
- ✅ Accurate documentation

---

**Report End**
