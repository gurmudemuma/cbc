# Final Workflow Design - Hybrid Smart Contract + Manual Approval

## Overview
Combination of smart contract validation and manual ECTA approval for each qualification stage.

## Step 1: Registration & Smart Contract Validation

**Exporter submits:**
- Company name
- TIN
- Capital (ETB)
- Business type
- Contact details

**Smart Contract validates:**
- Capital ≥ 15M ETB (individual) or 20M ETB (company)
- Valid TIN format
- No duplicate TIN
- Valid email format
- Company name ≥ 3 characters

**Result:**
- ✅ **If ALL validations pass** → Profile auto-approved, status: `approved`, user CAN LOGIN
- ❌ **If ANY validation fails** → Profile rejected, status: `rejected`, user CANNOT LOGIN

## Step 2: User Logs In (After Profile Approved)

**User sees:**
- Profile: ✅ Approved (by smart contract)
- Laboratory: 🔓 Unlocked (ready to submit)
- Taster: 🔒 Locked
- Competence: 🔒 Locked
- Export License: 🔒 Locked

## Step 3: User Submits Laboratory Details

**User fills:**
- Laboratory certificate number
- Issuing authority
- Issue date
- Expiry date
- Upload certificate document

**Action:** Submit → Status changes to `submitted` (pending ECTA review)

## Step 4: ECTA Reviews Laboratory

**ECTA can:**
- ✅ Approve → Laboratory status: `approved`, Taster unlocks
- ❌ Reject → Laboratory status: `rejected`, user can resubmit

## Step 5: User Submits Taster Details

(Same process as laboratory)

## Step 6: ECTA Reviews Taster

✅ Approve → Competence Certificate unlocks

## Step 7: User Submits Competence Certificate

(Same process)

## Step 8: ECTA Reviews Competence

✅ Approve → Export License unlocks

## Step 9: User Applies for Export License

Final application

## Step 10: ECTA Issues Export License

✅ Approve → Status changes to `active`, fully qualified exporter

## Status Flow

```
Registration → Smart Contract Validates
    ↓
✅ Valid → status: approved (CAN LOGIN)
❌ Invalid → status: rejected (CANNOT LOGIN)
    ↓
Login → See unlocked stages
    ↓
Submit Laboratory → status: submitted
    ↓
ECTA Approves → Laboratory: approved, Taster: unlocked
    ↓
Submit Taster → status: submitted
    ↓
ECTA Approves → Taster: approved, Competence: unlocked
    ↓
Submit Competence → status: submitted
    ↓
ECTA Approves → Competence: approved, License: unlocked
    ↓
Apply for License → status: submitted
    ↓
ECTA Issues License → status: active (FULLY QUALIFIED)
```

## Key Points

1. **Smart contract does initial validation** - No manual ECTA review for profile
2. **Profile approval = Login enabled** - User can access system
3. **Sequential unlocking** - Each approval unlocks next stage
4. **ECTA reviews qualifications** - Laboratory, Taster, Competence, License
5. **Rejection allows resubmission** - User can fix and resubmit rejected stages
