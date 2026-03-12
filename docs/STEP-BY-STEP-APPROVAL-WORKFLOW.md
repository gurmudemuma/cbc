# Step-by-Step Approval Workflow

## Overview
This document explains the complete step-by-step approval process for exporters in the Coffee Export System. Each stage must be explicitly approved or rejected by ECTA through the smart contract.

## Status Definitions

### User/Exporter Status
- `pending_approval` - Initial registration, cannot login
- `approved` - Profile approved by ECTA, can login and submit other stages
- `active` - All stages approved, fully qualified exporter
- `rejected` - Registration rejected by ECTA

### Stage Status
- `not_started` - Stage not yet available
- `unlocked` - Stage is available for exporter to submit
- `submitted` - Exporter has submitted documents, pending ECTA review
- `approved` - ECTA has approved this stage
- `rejected` - ECTA has rejected this stage (can be resubmitted)

## Complete Workflow

### Step 1: User Registration
**Action:** User registers through the system
**Function:** `RegisterUser` (auto-validation) or `SubmitPreRegistration` (manual)
**Result:** 
- User status: `pending_approval`
- Profile stage status: `submitted`
- User CANNOT login yet

### Step 2: ECTA Reviews Profile
**Action:** ECTA reviews the profile stage
**Function:** `ApprovePreRegistration(exporterId, 'profile', 'approve')`
**Result:**
- User status changes: `pending_approval` → `approved`
- Profile stage status: `approved`
- Laboratory stage status: `not_started` → `unlocked`
- User CAN NOW LOGIN

### Step 3: User Logs In (First Time)
**Action:** User logs in with approved status
**What User Sees:**
- Profile: ✅ Approved
- Laboratory: 🔓 Unlocked (ready to submit)
- Taster: 🔒 Locked
- Competence Certificate: 🔒 Locked
- Export License: 🔒 Locked

### Step 4: User Submits Laboratory Documents
**Action:** User submits laboratory qualification
**Function:** `SubmitPreRegistrationStage(exporterId, 'laboratory', documentData)`
**Result:**
- Laboratory stage status: `unlocked` → `submitted`
- User status remains: `approved`

### Step 5: ECTA Reviews Laboratory
**Action:** ECTA approves or rejects laboratory stage
**Function:** `ApprovePreRegistration(exporterId, 'laboratory', 'approve')`
**Result:**
- Laboratory stage status: `submitted` → `approved`
- Taster stage status: `not_started` → `unlocked`
- User status remains: `approved`

### Step 6: User Submits Taster Documents
**Action:** User submits taster qualification
**Function:** `SubmitPreRegistrationStage(exporterId, 'taster', documentData)`
**Result:**
- Taster stage status: `unlocked` → `submitted`

### Step 7: ECTA Reviews Taster
**Action:** ECTA approves taster stage
**Function:** `ApprovePreRegistration(exporterId, 'taster', 'approve')`
**Result:**
- Taster stage status: `submitted` → `approved`
- Competence Certificate stage: `not_started` → `unlocked`

### Step 8: User Submits Competence Certificate
**Action:** User submits competence certificate
**Function:** `SubmitPreRegistrationStage(exporterId, 'competenceCertificate', documentData)`
**Result:**
- Competence Certificate status: `unlocked` → `submitted`

### Step 9: ECTA Reviews Competence Certificate
**Action:** ECTA approves competence certificate
**Function:** `ApprovePreRegistration(exporterId, 'competenceCertificate', 'approve')`
**Result:**
- Competence Certificate status: `submitted` → `approved`
- Export License stage: `not_started` → `unlocked`

### Step 10: User Submits Export License Application
**Action:** User submits export license application
**Function:** `SubmitPreRegistrationStage(exporterId, 'exportLicense', documentData)`
**Result:**
- Export License status: `unlocked` → `submitted`

### Step 11: ECTA Issues Export License (Final Approval)
**Action:** ECTA approves export license
**Function:** `ApprovePreRegistration(exporterId, 'exportLicense', 'approve')`
**Result:**
- Export License status: `submitted` → `approved`
- **User status changes: `approved` → `active`**
- License number generated
- User is now FULLY QUALIFIED

## Rejection Handling

### If ECTA Rejects Any Stage
**Function:** `ApprovePreRegistration(exporterId, stage, 'reject', { reason: 'explanation' })`
**Result:**
- Stage status: `submitted` → `rejected`
- User can resubmit the same stage
- User status remains `approved` (can still login)
- Next stages remain locked until current stage is approved

### Example: Laboratory Rejected
```javascript
// ECTA rejects
ApprovePreRegistration('exporter1', 'laboratory', 'reject', {
  reason: 'Laboratory certificate expired',
  rejectedBy: 'ECTA_Officer_123'
})

// User fixes and resubmits
SubmitPreRegistrationStage('exporter1', 'laboratory', {
  certificateNumber: 'NEW-LAB-456',
  validUntil: '2026-12-31'
})

// ECTA approves
ApprovePreRegistration('exporter1', 'laboratory', 'approve')
```

## Smart Contract Functions

### For Exporters
1. `SubmitPreRegistrationStage(exporterId, stage, dataJSON)` - Submit documents for a stage

### For ECTA
1. `ApprovePreRegistration(exporterId, stage, 'approve', commentsJSON)` - Approve a stage
2. `ApprovePreRegistration(exporterId, stage, 'reject', { reason: 'text' })` - Reject a stage

## Login Rules

### Cannot Login
- Status: `pending_approval`
- Status: `rejected`

### Can Login
- Status: `approved` (profile approved, completing other stages)
- Status: `active` (fully qualified)

## Stage Order (Sequential)
1. Profile
2. Laboratory
3. Taster
4. Competence Certificate
5. Export License

Each stage must be approved before the next stage is unlocked.

## Key Points

✅ **Profile approval = Login enabled**
- When ECTA approves the profile stage, user status changes to `approved`
- User can now login and see their progress
- User can submit next stages as they become unlocked

✅ **All stages approved = Fully active**
- When ECTA approves the final stage (export license), user status changes to `active`
- License number is generated
- User can now perform all export operations

✅ **Sequential unlocking**
- Each approval unlocks the next stage
- User cannot skip stages
- User must wait for ECTA approval before proceeding

✅ **Rejection handling**
- Rejected stages can be resubmitted
- User remains logged in with `approved` status
- Next stages remain locked until current stage is approved

## Testing the Workflow

See `test-approval-workflow.ps1` for a complete test script that demonstrates:
1. User registration
2. ECTA profile approval (enables login)
3. User login
4. Stage-by-stage submission and approval
5. Final activation
