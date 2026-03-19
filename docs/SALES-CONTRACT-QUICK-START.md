# Sales Contract - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Backend running on `http://localhost:3000`
- Frontend running on `http://localhost:5173` (or configured port)
- Database and blockchain network running

### Step 1: Access the Dashboard
```
http://localhost:5173/sales-contracts
```

### Step 2: Create a Contract Draft

1. Click **"Create New"** tab
2. Fill in the form:
   - **Coffee Type**: Select from dropdown (e.g., "Yirgacheffe")
   - **Origin Region**: "Yirgacheffe Region"
   - **Quantity**: 150 (bags)
   - **Unit Price**: 4.00 (USD)
   - **Delivery Date**: Pick a future date
   - **Port of Discharge**: "Port of Hamburg"
   - **Quality Grade**: "Grade 1"
   - **Certifications**: Select "ORGANIC" and "FAIR_TRADE"
3. Click **"Create Draft"**
4. See success message

### Step 3: View Your Drafts

1. Click **"My Drafts"** tab
2. See table with all your contracts
3. Status shows as "DRAFT"

### Step 4: Accept a Contract

1. Click **"View"** on any draft
2. Click **"Details"** tab
3. Review contract terms
4. Click **"Accept"** button
5. Status changes to "ACCEPTED"

### Step 5: Finalize to Blockchain

1. After accepting, click **"Finalize to Blockchain"** button
2. Wait for confirmation
3. Status changes to "FINALIZED"
4. Blockchain Contract ID appears

### Step 6: Download Certificate

1. After finalization, click **"Download Certificate (PDF)"**
2. PDF downloads to your computer
3. Open and verify contract details

## 📊 Contract Statuses

| Status | Meaning | Actions Available |
|--------|---------|-------------------|
| DRAFT | Initial state | Accept, Reject, Counter |
| COUNTERED | Counter offer made | Accept, Reject, Counter |
| ACCEPTED | Ready for blockchain | Finalize |
| FINALIZED | On blockchain | Download Certificate |
| REJECTED | Negotiation ended | None |

## 🔄 Negotiation Workflow

### Accept Flow
```
DRAFT → ACCEPTED → FINALIZED → Certificate
```

### Counter Offer Flow
```
DRAFT → COUNTERED → ACCEPTED → FINALIZED → Certificate
```

### Rejection Flow
```
DRAFT → REJECTED (End)
```

## 💡 Tips

1. **Quantity & Price**: Must be positive numbers
2. **Delivery Date**: Must be in the future
3. **Port of Discharge**: Required field
4. **Certifications**: Select at least one if required
5. **Counter Offers**: Explain changes in notes field

## 🧪 Automated Testing

Run the complete end-to-end test:

```powershell
.\scripts\test-sales-contract-flow.ps1
```

Expected output:
```
[OK] All tests passed!
[OK] Certificate generated successfully
```

## 🐛 Troubleshooting

### "Access denied" error
- Ensure you're logged in as exporter
- Check token in browser localStorage
- Verify user role is "exporter"

### "Draft not found" error
- Refresh the page
- Check draft ID in URL
- Verify draft exists in database

### Certificate download fails
- Ensure contract is FINALIZED
- Check browser download settings
- Verify PDF generation service running

### Form validation errors
- All required fields marked with *
- Quantity must be > 0
- Unit price must be > 0
- Delivery date must be future date

## 📱 Browser Support

- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari
- ✅ Edge

## 🔐 Security Notes

- Token stored in localStorage
- All API calls require authentication
- Blockchain transactions immutable
- Certificates digitally signed

## 📞 Support

For issues:
1. Check browser console (F12)
2. Check backend logs
3. Verify all services running
4. Run automated test script

## Next Steps

After testing:
1. ✅ Verify all features work
2. ✅ Test with multiple users
3. ✅ Check blockchain records
4. ✅ Verify PDF certificates
5. ✅ Deploy to production

---

**Ready to go!** 🎉 Start creating contracts now.
