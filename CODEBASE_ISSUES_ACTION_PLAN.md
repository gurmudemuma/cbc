# Codebase Issues - Detailed Action Plan & Fixes

**Document:** Step-by-step guide to fix all identified issues  
**Last Updated:** December 19, 2024

---

## PART 1: CRITICAL FIXES (Must Do First)

### Issue 1.1: API TypeScript Compilation Errors

#### Problem
Build fails with 27 TypeScript errors in `api/custom-authorities`

#### Root Causes
1. Unused imports and variables
2. Null safety issues with database pool
3. Missing return statements
4. Type mismatches

#### Specific Errors to Fix

**File: `api/custom-authorities/src/controllers/auth.controller.ts`**
```
Line 18: 'RequestWithUser' is declared but never used
Line 50: 'pool' is possibly 'null'
Line 120: 'pool' is possibly 'null'
```

**Fix:**
```typescript
// BEFORE
import { RequestWithUser } from '../types';
const pool = getPool();
const result = await pool.query(...);

// AFTER
// Remove unused import if not needed
const pool = getPool();
if (!pool) {
  throw new Error('Database pool not initialized');
}
const result = await pool.query(...);
```

**File: `api/custom-authorities/src/controllers/customs-postgres.controller.ts`**
```
Line 19: 'req' is declared but its value is never read
Line 38: 'req' is declared but its value is never read
Line 57: Not all code paths return a value
Line 78: Not all code paths return a value
Line 140: Not all code paths return a value
Line 201: Not all code paths return a value
```

**Fix:**
```typescript
// BEFORE
async getExports(req: Request, res: Response) {
  try {
    // ... code
  } catch (error) {
    // Missing return
  }
}

// AFTER
async getExports(_req: Request, res: Response): Promise<void> {
  try {
    // ... code
    return;
  } catch (error) {
    res.status(500).json({ error: error.message });
    return;
  }
}
```

**File: `api/custom-authorities/src/controllers/customs.controller.ts`**
```
Line 22: 'req' is declared but its value is never read
Line 27: 'pool' is possibly 'null'
Line 46: 'pool' is possibly 'null'
Line 67: 'pool' is possibly 'null'
Line 135: 'pool' is possibly 'null'
Line 207: 'pool' is possibly 'null'
```

**Fix:**
```typescript
// BEFORE
public issueClearance = async (
  req: RequestWithUser,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  const client = await pool.connect();
  // ...
}

// AFTER
public issueClearance = async (
  _req: RequestWithUser,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  const client = await pool.connect();
  if (!client) {
    return res.status(500).json({ error: 'Database connection failed' });
  }
  // ...
}
```

**File: `api/custom-authorities/src/controllers/export.controller.ts`**
```
Line 22: 'req' is declared but its value is never read
Line 27-209: Multiple 'pool' is possibly 'null' errors
```

**Fix:** Apply same pattern as above

**File: `api/shared/controllers/enhanced-export.controller.ts`**
```
Line 31: 'exportService' is declared but its value is never read
```

**Fix:**
```typescript
// BEFORE
const exportService = new ExportService();

// AFTER
// Either use it or remove it
const _exportService = new ExportService(); // if intentionally unused
// OR
const exportService = new ExportService();
// Use it in the code
```

**File: `api/shared/controllers/enhanced-export.controller.v2.ts`**
```
Line 96: 'exportService' is declared but its value is never read
Line 387: 'exp.created_at' is possibly 'undefined'
Line 391: 'exp.created_at' is possibly 'undefined'
```

**Fix:**
```typescript
// BEFORE
const created_at = exp.created_at;

// AFTER
const created_at = exp.created_at || new Date().toISOString();
```

**File: `api/shared/env.validator.postgres.ts`**
```
Line 6: 'fs' is declared but its value is never read
Line 7: 'path' is declared but its value is never read
```

**Fix:**
```typescript
// BEFORE
import fs from 'fs';
import path from 'path';

// AFTER
// Remove if not used, or use them
```

---

### Issue 1.2: Frontend TypeScript Compilation Errors

#### Problem
Build fails with 100+ TypeScript errors in frontend

#### Root Causes
1. Components missing `org` prop definition
2. Form state objects not properly typed
3. Invalid MUI component props
4. Missing type definitions

#### Specific Errors to Fix

**File: `frontend/src/App.tsx`**
```
Lines 294-437: Type '{ user: any; org: string; }' is not assignable to type 'IntrinsicAttributes & { user: any; }'
Property 'org' does not exist on type 'IntrinsicAttributes & { user: any; }'
```

**Fix:**
```typescript
// BEFORE
interface ComponentProps {
  user: any;
}

export const ExporterPortal: React.FC<ComponentProps> = ({ user }) => {
  // ...
}

// In App.tsx
<ExporterPortal user={user} org={org} />  // ERROR: org not in props

// AFTER
interface ComponentProps {
  user: any;
  org: string;
}

export const ExporterPortal: React.FC<ComponentProps> = ({ user, org }) => {
  // ...
}

// In App.tsx
<ExporterPortal user={user} org={org} />  // OK
```

**Apply to all components:**
- `ExporterPortal`
- `ECTAPortal`
- `CustomsPortal`
- `BankPortal`
- `NBEPortal`
- `ECXPortal`
- `ShippingPortal`
- `AdminPortal`

**File: `frontend/src/components/Card.tsx`**
```
Line 49: This comparison appears to be unintentional because the types '"elevation" | "outlined"' and '"elevated"' have no overlap
Line 57: This comparison appears to be unintentional because the types '"elevation" | "outlined"' and '"highlight"' have no overlap
Line 133: Type '"elevation" | "outlined" | "elevated" | "highlight"' is not assignable to type '"elevation" | "outlined"'
```

**Fix:**
```typescript
// BEFORE
type CardVariant = 'elevation' | 'outlined' | 'elevated' | 'highlight';

if (variant === 'elevated') {  // ERROR: not in type
  // ...
}

// AFTER
type CardVariant = 'elevation' | 'outlined';

if (variant === 'elevation') {
  // ...
}
```

**File: `frontend/src/components/DocumentChecklist.tsx`**
```
Line 182: Property 'required' does not exist on type 'unknown'
Line 198: Type 'string' is not assignable to type 'OverridableStringUnion<"info" | "default" | "success" | "warning" | "error" | "primary" | "secondary", ChipPropsColorOverrides>'
Line 204: Property 'cid' does not exist on type 'unknown'
Line 206: Property 'cid' does not exist on type 'unknown'
```

**Fix:**
```typescript
// BEFORE
interface Document {
  // Missing properties
}

// AFTER
interface Document {
  required?: boolean;
  cid: string;
  color: 'success' | 'warning' | 'error' | 'info' | 'default' | 'primary' | 'secondary';
}
```

**File: `frontend/src/components/forms/CustomsClearanceForm.tsx`**
```
Line 22: Property 'declarationNumber' does not exist on type '{}'
Line 53: Property 'declarationNumber' does not exist on type '{}'
```

**Fix:**
```typescript
// BEFORE
const [formData, setFormData] = useState({});

// AFTER
interface CustomsClearanceFormData {
  declarationNumber: string;
  // Add other required fields
}

const [formData, setFormData] = useState<CustomsClearanceFormData>({
  declarationNumber: '',
});
```

**File: `frontend/src/components/forms/ECTAContractForm.tsx`**
```
Line 24: Property 'contractNumber' does not exist on type '{}'
Line 25: Property 'originCertNumber' does not exist on type '{}'
Line 26: Property 'buyerName' does not exist on type '{}'
Line 27: Property 'buyerVerified' does not exist on type '{}'
```

**Fix:**
```typescript
// BEFORE
const [formData, setFormData] = useState({});

// AFTER
interface ECTAContractFormData {
  contractNumber: string;
  originCertNumber: string;
  buyerName: string;
  buyerVerified: boolean;
}

const [formData, setFormData] = useState<ECTAContractFormData>({
  contractNumber: '',
  originCertNumber: '',
  buyerName: '',
  buyerVerified: false,
});
```

**File: `frontend/src/components/forms/ECTAQualityForm.tsx`**
```
Line 68: Property 'qualityGrade' does not exist on type '{}'
Line 71: Property 'qualityCertNumber' does not exist on type '{}'
Line 74: Property 'moistureContent' does not exist on type '{}'
Line 77: Property 'moistureContent' does not exist on type '{}'
Line 80: Property 'defectCount' does not exist on type '{}'
Line 83: Property 'cupScore' does not exist on type '{}'
```

**Fix:**
```typescript
// BEFORE
const [formData, setFormData] = useState({});

// AFTER
interface ECTAQualityFormData {
  qualityGrade: string;
  qualityCertNumber: string;
  moistureContent: number;
  defectCount: number;
  cupScore: number;
}

const [formData, setFormData] = useState<ECTAQualityFormData>({
  qualityGrade: '',
  qualityCertNumber: '',
  moistureContent: 0,
  defectCount: 0,
  cupScore: 0,
});
```

**File: `frontend/src/components/forms/ECXApprovalForm.tsx`**
```
Line 48: Property 'lotNumber' does not exist on type '{}'
Line 51: Property 'warehouseReceiptNumber' does not exist on type '{}'
Line 54: Property 'warehouseLocation' does not exist on type '{}'
Line 67: Property 'ecxLotNumber' does not exist on type '{ lotNumber: any; warehouseReceiptNumber: any; warehouseLocation: any; notes: string; }'
Line 70: Property 'verificationNotes' does not exist on type '{ lotNumber: any; warehouseReceiptNumber: any; warehouseLocation: any; notes: string; }'
```

**Fix:**
```typescript
// BEFORE
const [formData, setFormData] = useState({
  lotNumber: '',
  warehouseReceiptNumber: '',
  warehouseLocation: '',
  notes: '',
});

// AFTER
interface ECXApprovalFormData {
  lotNumber: string;
  warehouseReceiptNumber: string;
  warehouseLocation: string;
  notes: string;
  verificationNotes?: string;
}

const [formData, setFormData] = useState<ECXApprovalFormData>({
  lotNumber: '',
  warehouseReceiptNumber: '',
  warehouseLocation: '',
  notes: '',
  verificationNotes: '',
});
```

**File: `frontend/src/components/forms/NBEFXApprovalForm.tsx`**
```
Line 21: Property 'approvedFXAmount' does not exist on type '{}'
Line 22: Property 'fxRate' does not exist on type '{}'
```

**Fix:**
```typescript
// BEFORE
const [formData, setFormData] = useState({});

// AFTER
interface NBEFXApprovalFormData {
  approvedFXAmount: number;
  fxRate: number;
}

const [formData, setFormData] = useState<NBEFXApprovalFormData>({
  approvedFXAmount: 0,
  fxRate: 0,
});
```

**File: `frontend/src/components/forms/ShipmentScheduleForm.tsx`**
```
Line 24: Property 'transportIdentifier' does not exist on type '{}'
Line 25: Property 'departureDate' does not exist on type '{}'
Line 26: Property 'estimatedArrivalDate' does not exist on type '{}'
Line 27: Property 'portOfLoading' does not exist on type '{}'
```

**Fix:**
```typescript
// BEFORE
const [formData, setFormData] = useState({});

// AFTER
interface ShipmentScheduleFormData {
  transportIdentifier: string;
  departureDate: string;
  estimatedArrivalDate: string;
  portOfLoading: string;
}

const [formData, setFormData] = useState<ShipmentScheduleFormData>({
  transportIdentifier: '',
  departureDate: '',
  estimatedArrivalDate: '',
  portOfLoading: '',
});
```

**File: `frontend/src/components/RejectionDialog.tsx`**
```
Line 129: Property 'OTHER' does not exist on type '{ ECX: string[]; ECTA_LICENSE: string[]; ECTA_QUALITY: string[]; ECTA_CONTRACT: string[]; BANK: string[]; NBE: string[]; CUSTOMS: string[]; SHIPPING: string[]; }'
```

**Fix:**
```typescript
// BEFORE
const REJECTION_REASONS = {
  ECX: [...],
  ECTA_LICENSE: [...],
  // ... missing OTHER
};

// AFTER
const REJECTION_REASONS = {
  ECX: [...],
  ECTA_LICENSE: [...],
  ECTA_QUALITY: [...],
  ECTA_CONTRACT: [...],
  BANK: [...],
  NBE: [...],
  CUSTOMS: [...],
  SHIPPING: [...],
  OTHER: ['Other reason'],
};
```

**File: `frontend/src/components/QualificationStatusCard.tsx`**
```
Line 84: This comparison appears to be unintentional because the types 'boolean' and 'string' have no overlap
```

**Fix:**
```typescript
// BEFORE
if (status.valid === 'true') {  // ERROR: comparing boolean to string
  // ...
}

// AFTER
if (status.valid === true) {
  // ...
}
```

**File: `frontend/src/pages/ExportManagement.tsx`**
```
Line 611: Property 'stage' is missing in type
Line 623: Property 'stage' is missing in type
Line 1069: Type '"primary"' is not assignable to type 'OverridableStringUnion<AlertColor, AlertPropsColorOverrides>'
Line 1582: Property 'stage' is missing in type
Line 1688: Property 'stage' is missing in type
Line 1694: Property 'stage' is missing in type
```

**Fix:**
```typescript
// BEFORE
interface DetailModalState {
  open: boolean;
  exportId: any;
  exportData: any;
}

setDetailModal({ open: true, exportId, exportData });  // ERROR: missing stage

// AFTER
interface DetailModalState {
  open: boolean;
  exportId: any;
  exportData: any;
  stage: string;
}

setDetailModal({ open: true, exportId, exportData, stage: 'PENDING' });

// For Alert color
<Alert severity="primary">  // ERROR: invalid color

// AFTER
<Alert severity="info">  // Use valid color
```

**File: `frontend/src/pages/Dashboard.tsx`**
```
Line 139: The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type
Line 139: The right-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type
```

**Fix:**
```typescript
// BEFORE
const total = data.count + 5;  // data.count might be string

// AFTER
const total = (Number(data.count) || 0) + 5;
```

**File: `frontend/src/pages/ShipmentTracking.tsx`**
```
Line 144: The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type
Line 144: The right-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type
```

**Fix:** Apply same pattern as Dashboard.tsx

**File: `frontend/src/pages/ExporterPreRegistration.tsx`**
```
Line 263: Expected 0 arguments, but got 1
```

**Fix:**
```typescript
// BEFORE
someFunction(arg);  // Function doesn't accept arguments

// AFTER
someFunction();  // Remove argument or update function signature
```

**File: `frontend/src/pages/Login.example.tsx`**
```
Line 3: Cannot find module '../components/Button' or its corresponding type declarations
```

**Fix:**
```typescript
// BEFORE
import Button from '../components/Button';

// AFTER
import Button from '../components/ActionButton';  // Use correct component name
// OR
import { Button } from '@mui/material';  // Use MUI Button
```

**File: `frontend/src/config/theme.config.enhanced.ts`**
```
Line 677: Property 'variants' is missing in type
```

**Fix:**
```typescript
// BEFORE
const components = {
  MuiButton: {
    styleOverrides: {
      root: {
        // Missing variants
      }
    }
  }
};

// AFTER
const components = {
  MuiButton: {
    styleOverrides: {
      root: {
        // ... styles
      }
    },
    variants: [
      // Add variants if needed
    ]
  }
};
```

**File: `frontend/src/contexts/NotificationContext.tsx`**
```
Line 20: Property 'autoHideDuration' does not exist on type '{}'
```

**Fix:**
```typescript
// BEFORE
interface Notification {
  // Missing autoHideDuration
}

// AFTER
interface Notification {
  autoHideDuration?: number;
  // ... other properties
}
```

**File: `frontend/src/hooks/useFormValidation.ts`**
```
Line 44: Cannot find namespace 'NodeJS'
Line 53: Property 'validate' does not exist on type 'Reference<any> | ISchema<any, AnyObject, any, any>'
```

**Fix:**
```typescript
// BEFORE
import type { NodeJS } from 'nodejs';  // Wrong import

// AFTER
// NodeJS is global, no import needed
// OR use proper type from @types/node

// For validate method
const schema = yup.object().shape({
  // ...
});

// Use schema.validate() instead of schema.validate
```

---

## PART 2: HIGH PRIORITY CLEANUP

### Issue 2.1: Remove Backup Files

```bash
# Command to remove all backup files
find /home/gu-da/cbc/api -name ".env.backup.*" -type f -delete

# Verify they're gone
find /home/gu-da/cbc/api -name ".env.backup.*" -type f

# Should return nothing
```

### Issue 2.2: Remove Compiled Files from Source

```bash
# Remove .js and .d.ts files from api/shared root
find /home/gu-da/cbc/api/shared -maxdepth 1 -type f \( -name "*.js" -o -name "*.d.ts" \) -delete

# Verify
ls -la /home/gu-da/cbc/api/shared/*.js 2>&1 | grep -c "No such file"
```

### Issue 2.3: Update .gitignore

Add to `/home/gu-da/cbc/.gitignore`:

```
# Backup files
*.backup
*.backup.*
.env.backup*

# Compiled files in source (should only be in dist/)
api/shared/*.js
api/shared/*.d.ts
api/shared/*.d.ts.map

# Error logs
*.txt
!README.txt
!CONTRIBUTING.txt
!QUICK_START.txt
```

---

## PART 3: MEDIUM PRIORITY IMPROVEMENTS

### Issue 3.1: Create GitHub Issues for TODOs

Create issues for each TODO:

1. **Commercial Bank - RBAC**
   - Title: Implement proper role-based access control
   - File: `api/commercial-bank/src/routes/exporter.routes.ts`

2. **ECTA - Exporter Status**
   - Title: Update exporter status to ACTIVE/REJECTED
   - File: `api/ecta/src/controllers/preregistration.controller.ts`

3. **ECTA - Database Queries**
   - Title: Implement database queries for pending items
   - File: `api/ecta/src/controllers/preregistration.controller.ts`

4. **ECX - Production Integration**
   - Title: Integrate with ECX database and warehouse system
   - File: `api/ecx/src/services/ecx.service.ts`

5. **Frontend - Shipping Service**
   - Title: Implement shipping service
   - File: `frontend/src/services/index.js`

6. **Frontend - Customs Service**
   - Title: Implement customs service
   - File: `frontend/src/services/index.js`

### Issue 3.2: Standardize File Extensions

Choose TypeScript for all new code:

```bash
# Remove .js files that have .ts equivalents
rm /home/gu-da/cbc/api/shared/auth/jwt.config.js
rm /home/gu-da/cbc/api/shared/middleware/auth.middleware.js
rm /home/gu-da/cbc/api/shared/env.validator.js

# Update imports to use .ts files
```

---

## PART 4: VERIFICATION STEPS

### Step 1: Verify TypeScript Compilation

```bash
cd /home/gu-da/cbc

# Check API builds
npm run build --workspaces 2>&1 | tee build-results.log

# Check frontend type checking
cd frontend
npm run type-check 2>&1 | tee type-check-results.log
```

### Step 2: Verify No Backup Files

```bash
find /home/gu-da/cbc -name ".env.backup.*" -type f
# Should return nothing
```

### Step 3: Verify No Compiled Files in Source

```bash
find /home/gu-da/cbc/api/shared -maxdepth 1 -type f \( -name "*.js" -o -name "*.d.ts" \)
# Should return nothing
```

### Step 4: Verify .gitignore

```bash
# Check if files are properly ignored
git status --ignored | grep -E "\.backup|\.js|\.d\.ts"
# Should return nothing
```

---

## PART 5: TIMELINE ESTIMATE

| Phase | Tasks | Time | Priority |
|-------|-------|------|----------|
| 1 | Fix API TypeScript errors | 2-3 hrs | 🔴 Critical |
| 1 | Fix Frontend TypeScript errors | 3-4 hrs | 🔴 Critical |
| 2 | Remove backup files | 5 min | ⚠️ High |
| 2 | Remove compiled files | 10 min | ⚠️ High |
| 2 | Update .gitignore | 10 min | ⚠️ High |
| 3 | Create GitHub issues | 1 hr | 📋 Medium |
| 3 | Add type definitions | 2-3 hrs | 📋 Medium |
| 3 | Standardize file extensions | 1 hr | 📋 Medium |
| 4 | Remove commented code | 30 min | 🟡 Low |
| 4 | Standardize naming | 1-2 hrs | 🟡 Low |

**Total Estimated Time:** 15-20 hours

---

## PART 6: PREVENTION MEASURES

### 1. Pre-commit Hooks

Add to `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Check TypeScript
npm run type-check

# Check for backup files
if find . -name ".env.backup.*" -type f | grep -q .; then
  echo "Error: Backup files found. Please remove them."
  exit 1
fi

# Check for compiled files in source
if find api/shared -maxdepth 1 -type f \( -name "*.js" -o -name "*.d.ts" \) | grep -q .; then
  echo "Error: Compiled files found in source. Please remove them."
  exit 1
fi
```

### 2. CI/CD Pipeline

Add to GitHub Actions:

```yaml
- name: Type Check
  run: npm run type-check

- name: Check for backup files
  run: |
    if find . -name ".env.backup.*" -type f | grep -q .; then
      echo "Error: Backup files found"
      exit 1
    fi

- name: Check for compiled files in source
  run: |
    if find api/shared -maxdepth 1 -type f \( -name "*.js" -o -name "*.d.ts" \) | grep -q .; then
      echo "Error: Compiled files in source"
      exit 1
    fi
```

### 3. ESLint Configuration

Add to `.eslintrc.js`:

```javascript
{
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-types': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
  }
}
```

---

## PART 7: TEAM GUIDELINES

### Code Review Checklist

- [ ] No TypeScript errors
- [ ] No unused imports or variables
- [ ] All functions have explicit return types
- [ ] All state objects are properly typed
- [ ] No commented-out code
- [ ] No backup files committed
- [ ] No compiled files in source

### Commit Message Guidelines

```
fix: resolve TypeScript errors in [component]
- Add null checks for database pool
- Remove unused imports
- Add missing return statements

cleanup: remove backup files
- Deleted .env.backup.* files
- Updated .gitignore

feat: add proper type definitions for [feature]
- Created interfaces for form data
- Updated component props
```

---

**End of Action Plan**

For questions or clarifications, refer to the main CODEBASE_ISSUES_REPORT.md
