# System Test Scripts

## Overview
Comprehensive test scripts to verify the complete Coffee Export Consortium workflow, including LC Number generation, mapping, and payment auto-fill functionality.

---

## Available Test Scripts

### 1. **LC Number & Payment Auto-Fill Workflow Test**

Tests the complete end-to-end workflow:
- Sales contract creation and negotiation
- ECTA registration with LC Number generation
- Export creation with contract linkage
- LC Number mapping to exports
- Payment initiation with auto-fill

**Files:**
- `test-lc-number-payment-workflow.ps1` (PowerShell - Windows)
- `test-lc-number-payment-workflow.sh` (Bash - Linux/Mac)

---

## Prerequisites

### System Requirements
- Docker containers running (`docker-compose-hybrid.yml`)
- PostgreSQL database initialized
- Gateway API accessible at `http://localhost:3000`
- Frontend accessible at `http://localhost:5173`

### Test Users
The scripts use these pre-configured test users:

| Username | Password | Role | Purpose |
|----------|----------|------|---------|
| exporter1 | password123 | Exporter | Create contracts and payments |
| ecta1 | password123 | ECTA | Register contracts and generate LC numbers |

### Dependencies

**PowerShell (Windows):**
- PowerShell 5.1 or higher
- `Invoke-RestMethod` cmdlet
- Docker CLI

**Bash (Linux/Mac):**
- Bash 4.0 or higher
- `curl` command
- `jq` JSON processor
- Docker CLI

---

## Running the Tests

### PowerShell (Windows)

```powershell
# Navigate to scripts directory
cd scripts

# Run the test
.\test-lc-number-payment-workflow.ps1
```

### Bash (Linux/Mac)

```bash
# Navigate to scripts directory
cd scripts

# Make script executable
chmod +x test-lc-number-payment-workflow.sh

# Run the test
./test-lc-number-payment-workflow.sh
```

---

## Test Phases

### Phase 1: Authentication
- Login as exporter
- Verify JWT token generation
- Validate user role

### Phase 2: Exporter Profile
- Fetch exporter profile
- Verify business information
- Confirm TIN number

### Phase 3: Sales Contract Creation
- Create contract draft
- Set payment terms (LC, Net 30)
- Define coffee specifications
- Set delivery terms (FOB, Incoterms)

### Phase 4: Contract Acceptance
- Simulate buyer acceptance
- Update contract status to ACCEPTED
- Prepare for ECTA registration

### Phase 5: ECTA Registration
- Login as ECTA user
- Register sales contract
- **Generate LC Number** (e.g., SC-2024-00001)
- Update contract status to FINALIZED

### Phase 6: Database Verification
- Query `contract_drafts` table
- Verify `lc_number` column populated
- Confirm contract status

### Phase 7: Export Creation
- Create export record
- Link to sales contract
- Set status to APPROVED
- Associate buyer information

### Phase 8: Export API with LC Number
- Fetch exports via API
- **Verify LC Number mapped to export**
- Confirm payment method included
- Validate issuing bank information

### Phase 9: Export Details
- Fetch detailed export information
- Verify `contract_details` embedded
- Confirm all payment fields present

### Phase 10: Payment Initiation
- Initiate payment with auto-filled data
- **LC Number auto-populated**
- Payment method pre-selected
- Banks and terms auto-filled
- Verify payment created

### Phase 11: Payment Verification
- Query `payments` table
- Verify payment record created
- Confirm LC Number stored
- Validate payment status

### Phase 12: End-to-End Verification
- Join contract, export, and payment tables
- Verify LC Number propagation
- Confirm complete data flow
- Validate referential integrity

---

## Expected Output

### Success Output

```
========================================
LC Number & Payment Auto-Fill Test
========================================

=== Phase 1: Authentication ===
Testing: Login as Exporter
  User: exporter1
  Role: exporter
✓ PASSED: Login as Exporter

=== Phase 2: Exporter Profile ===
Testing: Get Exporter Profile
  Business: Ethiopian Coffee Exports Ltd
  TIN: TIN0000000002
✓ PASSED: Get Exporter Profile

=== Phase 3: Sales Contract Creation ===
Testing: Create Sales Contract Draft
  Draft ID: 550e8400-e29b-41d4-a716-446655440002
  Status: DRAFT
  Total Value: 55000 USD
✓ PASSED: Create Sales Contract Draft

=== Phase 4: Contract Acceptance ===
Testing: Accept Sales Contract
  Status: ACCEPTED
✓ PASSED: Accept Sales Contract

=== Phase 5: ECTA Registration ===
Testing: Login as ECTA
  User: ecta1
✓ PASSED: Login as ECTA

Testing: Register Contract and Generate LC Number
  LC Number Generated: SC-2024-00001
  Status: FINALIZED
✓ PASSED: Register Contract and Generate LC Number

=== Phase 6: Database Verification ===
Testing: Verify LC Number in Database
  Database Record: [draft_id] | SC-2024-00001 | FINALIZED
✓ PASSED: LC Number found in database

=== Phase 7: Export Creation ===
Testing: Create Export with Sales Contract
  Export ID: 650e8400-e29b-41d4-a716-446655440003
  Status: APPROVED
✓ PASSED: Create Export

=== Phase 8: Export API with LC Number ===
Testing: Fetch Exports with LC Number Mapped
  Export LC Number: SC-2024-00001
✓ PASSED: LC Number correctly mapped to export

=== Phase 9: Payment Initiation ===
Testing: Initiate Payment with LC Number Auto-Fill
  Payment Initiated
    Payment ID: 750e8400-e29b-41d4-a716-446655440004
    Status: INITIATED
✓ PASSED: Initiate Payment

========================================
Test Summary
========================================

Key Achievements:
  ✓ LC Number: SC-2024-00001
  ✓ Contract Status: FINALIZED
  ✓ Export Status: APPROVED
  ✓ Payment Status: INITIATED
  ✓ LC Number Auto-Fill: Working

🎉 ALL TESTS PASSED!
The LC Number workflow is fully operational.
```

---

## Test Data Created

Each test run creates the following records:

### Database Tables

**contract_drafts:**
- 1 new contract with LC Number
- Status: FINALIZED
- Payment Method: LC
- Payment Terms: Net 30

**exports:**
- 1 new export linked to contract
- Status: APPROVED
- Includes contract_id reference

**payments:**
- 1 new payment with auto-filled data
- LC Number from contract
- Status: INITIATED
- All payment details populated

---

## Troubleshooting

### Common Issues

#### 1. **Connection Refused**
```
Error: connect ECONNREFUSED 127.0.0.1:3000
```
**Solution:** Ensure Docker containers are running:
```bash
docker-compose -f docker-compose-hybrid.yml ps
```

#### 2. **Authentication Failed**
```
Error: Invalid credentials
```
**Solution:** Verify test users exist in database:
```bash
docker exec coffee-postgres psql -U postgres -d coffee_export_db -c "SELECT username, role FROM users WHERE username IN ('exporter1', 'ecta1');"
```

#### 3. **LC Number Not Generated**
```
Error: LC Number is null
```
**Solution:** Check blockchain service is running:
```bash
docker logs coffee-bridge
docker logs coffee-ecta
```

#### 4. **Export Not Found**
```
Error: Export not found in API response
```
**Solution:** Verify export was created:
```bash
docker exec coffee-postgres psql -U postgres -d coffee_export_db -c "SELECT export_id, status, contract_id FROM exports ORDER BY created_at DESC LIMIT 5;"
```

#### 5. **Payment Initiation Failed**
```
Error: Failed to initiate payment
```
**Solution:** Check gateway logs:
```bash
docker logs coffee-gateway
```

---

## Cleanup

To clean up test data after running tests:

```bash
# Remove test contracts
docker exec coffee-postgres psql -U postgres -d coffee_export_db -c "DELETE FROM contract_drafts WHERE coffee_type = 'Arabica Yirgacheffe' AND quantity = 10000;"

# Remove test exports
docker exec coffee-postgres psql -U postgres -d coffee_export_db -c "DELETE FROM exports WHERE coffee_type = 'Arabica Yirgacheffe' AND quantity = 10000;"

# Remove test payments
docker exec coffee-postgres psql -U postgres -d coffee_export_db -c "DELETE FROM payments WHERE amount = 55000 AND currency = 'USD';"
```

---

## Continuous Integration

### GitHub Actions Example

```yaml
name: System Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Start Docker Compose
        run: docker-compose -f docker-compose-hybrid.yml up -d
      
      - name: Wait for services
        run: sleep 30
      
      - name: Run LC Number Workflow Test
        run: ./scripts/test-lc-number-payment-workflow.sh
      
      - name: Stop Docker Compose
        run: docker-compose -f docker-compose-hybrid.yml down
```

---

## Test Coverage

### Functional Coverage
- ✅ User authentication
- ✅ Sales contract creation
- ✅ Contract negotiation
- ✅ ECTA registration
- ✅ LC Number generation
- ✅ Export creation
- ✅ Export-contract linkage
- ✅ LC Number mapping
- ✅ Payment initiation
- ✅ Auto-fill functionality

### API Coverage
- ✅ POST /api/auth/login
- ✅ GET /api/exporter/profile
- ✅ POST /api/contracts/drafts
- ✅ POST /api/contracts/drafts/:id/respond
- ✅ POST /api/ecta/contracts/:id/register
- ✅ GET /api/exports
- ✅ GET /api/exports/:id
- ✅ POST /api/payments/initiate

### Database Coverage
- ✅ contract_drafts table
- ✅ exports table
- ✅ payments table
- ✅ Foreign key relationships
- ✅ Data integrity

---

## Performance Benchmarks

Expected execution times:

| Phase | Expected Time |
|-------|--------------|
| Authentication | < 1s |
| Contract Creation | < 2s |
| ECTA Registration | < 3s |
| Export Creation | < 1s |
| Payment Initiation | < 2s |
| **Total** | **< 15s** |

---

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review Docker logs: `docker logs coffee-gateway`
3. Verify database state: `docker exec coffee-postgres psql -U postgres -d coffee_export_db`
4. Check system status: `docker-compose -f docker-compose-hybrid.yml ps`

---

**Last Updated:** April 23, 2026  
**Version:** 1.0.0  
**Status:** Production Ready
