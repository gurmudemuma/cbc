# Auto-Qualification Business Rules

## Proposed Rules for Full Auto-Approval

### Stage 1: Profile/Registration ✅ (Already Implemented)
**Requirements:**
- Capital >= 50M ETB (private exporter) or appropriate minimum
- Valid TIN format (TIN + 10 digits)
- No duplicate TIN
- Valid email format
- Company name >= 3 characters

**Auto-Approval**: YES if all pass

---

### Stage 2: Laboratory Certificate
**Requirements:**
- Capital >= 75M ETB (indicates ability to afford proper lab)
- Company registered for >= 6 months (experience indicator)
- No previous rejections

**Auto-Approval**: YES if all pass
**Rationale**: Higher capital suggests proper facilities

---

### Stage 3: Taster Certificate
**Requirements:**
- Capital >= 60M ETB
- Company registered for >= 3 months
- Laboratory approved (prerequisite)

**Auto-Approval**: YES if all pass
**Rationale**: Taster training is standard, capital indicates commitment

---

### Stage 4: Competence Certificate
**Requirements:**
- Capital >= 50M ETB
- Laboratory approved
- Taster approved
- Company registered for >= 1 month

**Auto-Approval**: YES if all pass
**Rationale**: Competence follows other qualifications

---

### Stage 5: Export License
**Requirements:**
- All 3 certificates approved
- Capital >= 50M ETB
- No outstanding issues
- Valid for 1 year

**Auto-Approval**: YES if all pass
**Auto-Generate**: License number (LIC-YYYY-XXXXX)

---

## Alternative: Simplified Rules

### Option A: Capital-Based (Recommended)
```
Capital >= 100M ETB → Auto-approve ALL stages immediately
Capital >= 75M ETB → Auto-approve Profile + Lab + Taster
Capital >= 50M ETB → Auto-approve Profile only (current)
Capital < 50M ETB → Reject
```

### Option B: Time-Based
```
Registration → Immediate approval
After 1 day → Auto-approve Lab + Taster
After 3 days → Auto-approve Competence
After 7 days → Auto-issue License
```

### Option C: Hybrid (Capital + Time)
```
Capital >= 100M ETB → Immediate full qualification
Capital >= 75M ETB → 1 day wait, then full qualification
Capital >= 50M ETB → 7 day wait, then full qualification
```

---

## Recommended Implementation

**Use Capital-Based with Single Threshold:**

```javascript
if (capitalETB >= 75000000) {
  // Auto-approve ALL stages
  preRegistrationStatus: {
    profile: { 
      status: 'approved',
      approvedBy: 'SMART_CONTRACT',
      approvedAt: timestamp
    },
    laboratory: { 
      status: 'approved',
      approvedBy: 'SMART_CONTRACT',
      approvedAt: timestamp,
      autoApprovalReason: 'Capital >= 75M ETB indicates proper facilities'
    },
    taster: { 
      status: 'approved',
      approvedBy: 'SMART_CONTRACT',
      approvedAt: timestamp,
      autoApprovalReason: 'Capital >= 75M ETB indicates qualified personnel'
    },
    competenceCertificate: { 
      status: 'approved',
      approvedBy: 'SMART_CONTRACT',
      approvedAt: timestamp,
      autoApprovalReason: 'Capital >= 75M ETB indicates business competence'
    },
    exportLicense: { 
      status: 'issued',
      licenseNumber: `LIC-${year}-${sequenceNumber}`,
      issuedBy: 'SMART_CONTRACT',
      issuedAt: timestamp,
      expiryDate: oneYearLater,
      autoApprovalReason: 'All qualifications met via capital threshold'
    }
  },
  status: 'active',  // Fully qualified
  licenseNumber: `LIC-${year}-${sequenceNumber}`
}
```

---

## Benefits

### For Exporters:
- ✅ Instant qualification for well-capitalized companies
- ✅ No waiting for manual ECTA approval
- ✅ Can start exporting immediately
- ✅ Reduced bureaucracy

### For ECTA:
- ✅ Focus on high-risk applications
- ✅ Reduced manual workload
- ✅ Faster processing
- ✅ Capital threshold ensures quality

### For System:
- ✅ Automated workflow
- ✅ Consistent decisions
- ✅ Audit trail maintained
- ✅ Can still manually review if needed

---

## Risk Mitigation

### Safeguards:
1. **Capital Verification**: Require proof of capital
2. **Audit Trail**: All auto-approvals logged
3. **Manual Override**: ECTA can still review/revoke
4. **Periodic Review**: Auto-approved licenses reviewed quarterly
5. **Blacklist Check**: Check against delinquent list

### Monitoring:
- Track auto-approval rate
- Monitor export quality from auto-approved exporters
- Flag suspicious patterns
- Regular compliance audits

---

## Implementation Priority

**Phase 1** (Immediate):
- Capital >= 75M ETB → Full auto-qualification
- Generate license number automatically
- Set status to 'active'

**Phase 2** (Future):
- Add time-based progression for lower capital
- Implement capital verification
- Add blacklist checking
- Periodic review system

---

**Recommendation**: Implement Phase 1 with 75M ETB threshold
**Rationale**: Simple, effective, reduces ECTA workload significantly
