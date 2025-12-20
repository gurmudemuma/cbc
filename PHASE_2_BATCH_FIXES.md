# Phase 2 - Batch Frontend TypeScript Fixes

This document provides the pattern and specific fixes needed for all remaining frontend components.

## Pattern to Apply to All Page Components

```typescript
import { CommonPageProps } from '../types';

interface PageProps extends CommonPageProps {
  // Add any additional props specific to this component
}

const ComponentName = ({ user, org }: PageProps): JSX.Element => {
  // Component implementation
};

export default ComponentName;
```

## Components to Fix (20 total)

### 1. ExportManagement.tsx
```typescript
interface ExportManagementProps extends CommonPageProps {}

const ExportManagement = ({ user, org }: ExportManagementProps): JSX.Element => {
```

### 2. QualityCertification.tsx
```typescript
interface QualityCertificationProps extends CommonPageProps {}

const QualityCertification = ({ user, org }: QualityCertificationProps): JSX.Element => {
```

### 3. FXRates.tsx
```typescript
interface FXRatesProps extends CommonPageProps {}

const FXRates = ({ user, org }: FXRatesProps): JSX.Element => {
```

### 4. UserManagement.tsx
```typescript
interface UserManagementProps extends CommonPageProps {}

const UserManagement = ({ user, org }: UserManagementProps): JSX.Element => {
```

### 5. ShipmentTracking.tsx
```typescript
interface ShipmentTrackingProps extends CommonPageProps {}

const ShipmentTracking = ({ user, org }: ShipmentTrackingProps): JSX.Element => {
```

### 6. ExportDetails.tsx
```typescript
interface ExportDetailsProps extends CommonPageProps {}

const ExportDetails = ({ user, org }: ExportDetailsProps): JSX.Element => {
```

### 7. CustomsClearance.tsx
```typescript
interface CustomsClearanceProps extends CommonPageProps {}

const CustomsClearance = ({ user, org }: CustomsClearanceProps): JSX.Element => {
```

### 8. ExporterPreRegistration.tsx
```typescript
interface ExporterPreRegistrationProps extends CommonPageProps {}

const ExporterPreRegistration = ({ user, org }: ExporterPreRegistrationProps): JSX.Element => {
```

### 9. ECTAPreRegistrationManagement.tsx
```typescript
interface ECTAPreRegistrationManagementProps extends CommonPageProps {}

const ECTAPreRegistrationManagement = ({ user, org }: ECTAPreRegistrationManagementProps): JSX.Element => {
```

### 10. BankDocumentVerification.tsx
```typescript
interface BankDocumentVerificationProps extends CommonPageProps {}

const BankDocumentVerification = ({ user, org }: BankDocumentVerificationProps): JSX.Element => {
```

### 11. ECTAContractApproval.tsx
```typescript
interface ECTAContractApprovalProps extends CommonPageProps {}

const ECTAContractApproval = ({ user, org }: ECTAContractApprovalProps): JSX.Element => {
```

### 12. ECTALicenseApproval.tsx
```typescript
interface ECTALicenseApprovalProps extends CommonPageProps {}

const ECTALicenseApproval = ({ user, org }: ECTALicenseApprovalProps): JSX.Element => {
```

### 13. ECXVerification.tsx
```typescript
interface ECXVerificationProps extends CommonPageProps {}

const ECXVerification = ({ user, org }: ECXVerificationProps): JSX.Element => {
```

### 14. ExporterProfile.tsx
```typescript
interface ExporterProfileProps extends CommonPageProps {}

const ExporterProfile = ({ user, org }: ExporterProfileProps): JSX.Element => {
```

### 15. ApplicationTracking.tsx
```typescript
interface ApplicationTrackingProps extends CommonPageProps {}

const ApplicationTracking = ({ user, org }: ApplicationTrackingProps): JSX.Element => {
```

### 16. ExportDashboard.tsx
```typescript
interface ExportDashboardProps extends CommonPageProps {}

const ExportDashboard = ({ user, org }: ExportDashboardProps): JSX.Element => {
```

### 17. HelpSupport.tsx
```typescript
interface HelpSupportProps extends CommonPageProps {}

const HelpSupport = ({ user, org }: HelpSupportProps): JSX.Element => {
```

### 18. BankingOperations.tsx
```typescript
interface BankingOperationsProps extends CommonPageProps {}

const BankingOperations = ({ user, org }: BankingOperationsProps): JSX.Element => {
```

### 19. LotManagement.tsx
```typescript
interface LotManagementProps extends CommonPageProps {}

const LotManagement = ({ user, org }: LotManagementProps): JSX.Element => {
```

### 20. MonetaryPolicy.tsx
```typescript
interface MonetaryPolicyProps extends CommonPageProps {}

const MonetaryPolicy = ({ user, org }: MonetaryPolicyProps): JSX.Element => {
```

## Form Components to Fix (7 total)

### Pattern for Form Components
```typescript
import { CommonPageProps, FormDataType } from '../types';

interface FormComponentProps extends CommonPageProps {}

const FormComponent = ({ user, org }: FormComponentProps): JSX.Element => {
  const [formData, setFormData] = useState<FormDataType>({
    // Initialize with proper types
  });
  
  // Component implementation
};

export default FormComponent;
```

### Forms List:
1. CustomsClearanceForm - Use `CustomsClearanceFormData`
2. ECTAContractForm - Use `ECTAContractFormData`
3. ECTAQualityForm - Use `ECTAQualityFormData`
4. ECXApprovalForm - Use `ECXApprovalFormData`
5. NBEFXApprovalForm - Use `NBEFXApprovalFormData`
6. ShipmentScheduleForm - Use `ShipmentScheduleFormData`
7. ECTALicenseForm - Use `ECTALicenseFormData`

## MUI Component Props Fixes

### 1. Card Component
**Issue:** Invalid variant values
**Fix:**
```typescript
// BEFORE
<Card variant="elevated">  // ❌ Invalid
<Card variant="highlight">  // ❌ Invalid

// AFTER
<Card variant="elevation">  // ✅ Valid
<Card>  // ✅ Default
```

### 2. Chip Component
**Issue:** Invalid color values
**Fix:**
```typescript
// BEFORE
<Chip color="custom-color" />  // ❌ Invalid

// AFTER
<Chip color="primary" />  // ✅ Valid
<Chip color="secondary" />  // ✅ Valid
<Chip color="success" />  // ✅ Valid
<Chip color="warning" />  // ✅ Valid
<Chip color="error" />  // ✅ Valid
<Chip color="info" />  // ✅ Valid
<Chip color="default" />  // ✅ Valid
```

### 3. Button Component
**Issue:** Invalid color values
**Fix:**
```typescript
// BEFORE
<Button color="custom-color" />  // ❌ Invalid

// AFTER
<Button color="primary" />  // ✅ Valid
<Button color="secondary" />  // ✅ Valid
<Button color="success" />  // ✅ Valid
<Button color="warning" />  // ✅ Valid
<Button color="error" />  // ✅ Valid
<Button color="info" />  // ✅ Valid
<Button color="inherit" />  // ✅ Valid
```

### 4. Alert Component
**Issue:** Invalid severity values
**Fix:**
```typescript
// BEFORE
<Alert severity="primary" />  // ❌ Invalid

// AFTER
<Alert severity="success" />  // ✅ Valid
<Alert severity="info" />  // ✅ Valid
<Alert severity="warning" />  // ✅ Valid
<Alert severity="error" />  // ✅ Valid
```

### 5. ReactQueryDevtools
**Issue:** Invalid position value
**Fix:**
```typescript
// BEFORE
<ReactQueryDevtools initialIsOpen={false} position="bottom-right" />  // ❌ Invalid

// AFTER
<ReactQueryDevtools initialIsOpen={false} position="bottom-right" />  // ✅ Valid (actually this is correct)
// Valid positions: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
```

## Implementation Steps

1. **Add import to each page component:**
   ```typescript
   import { CommonPageProps } from '../types';
   ```

2. **Create interface for each component:**
   ```typescript
   interface ComponentNameProps extends CommonPageProps {}
   ```

3. **Update component signature:**
   ```typescript
   const ComponentName = ({ user, org }: ComponentNameProps): JSX.Element => {
   ```

4. **Type form states:**
   ```typescript
   const [formData, setFormData] = useState<FormDataType>({...});
   ```

5. **Fix MUI component props:**
   - Replace invalid color/variant values
   - Use valid enum values from MUI

## Verification

After applying all fixes, run:
```bash
cd /home/gu-da/cbc/frontend
npm run type-check
```

Expected result: **0 errors**

## Estimated Time

- Page components: 60 minutes (20 components × 3 min each)
- Form components: 45 minutes (7 components × 6-7 min each)
- MUI props: 30 minutes (search and replace)
- Verification: 15 minutes

**Total: 2-3 hours**

---

Generated: December 19, 2024
