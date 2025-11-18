# 🧪 Testing Guide - Security Fixes

This guide explains how to test all the security improvements that have been implemented.

---

## ✅ Prerequisites

### 1. Environment Setup Complete
- ✅ JWT secrets generated and added to .env files
- ✅ Dependencies installed (`isomorphic-dompurify`)
- ✅ All services configured

### 2. Verify .env Files

Check that all services have their .env files:
```bash
ls -la api/commercialbank/.env
ls -la api/national-bank/.env
ls -la api/ncat/.env
ls -la api/shipping-line/.env
```

Each should contain a unique JWT_SECRET.

---

## 🚀 Running the Tests

### Option 1: Run All Tests (Recommended)

```bash
# Start the commercialbank service first
cd api/commercialbank
npm run dev &

# Wait a few seconds for service to start
sleep 5

# Run all tests
cd ../..
./run-all-tests.sh
```

This will:
- Check if services are running
- Run authentication tests
- Run input sanitization tests
- Generate a comprehensive report
- Save results to `test-results/` directory

---

### Option 2: Run Individual Test Suites

#### Authentication Tests Only
```bash
./test-authentication.sh
```

Tests:
- Password length requirements (12+ characters)
- Password complexity (uppercase, lowercase, number, special char)
- Common password blocking
- Sequential character prevention
- Repeated character prevention
- Login/logout flows
- Token generation and validation
- Protected endpoint access

#### Input Sanitization Tests Only
```bash
./test-input-sanitization.sh
```

Tests:
- XSS prevention (script tags, event handlers)
- SQL injection prevention
- Number validation (negative, excessive, non-numeric)
- String length limits
- Control character removal
- Valid input acceptance

---

## 📊 Understanding Test Results

### Success Output
```
========================================
Test Summary
========================================
Total Tests: 13
Passed: 13
Failed: 0
========================================

✓ All tests passed!
```

### Failure Output
```
Test 5: Reject sequential characters
✗ FAILED
Response: {"success":true,...}

========================================
Test Summary
========================================
Total Tests: 13
Passed: 12
Failed: 1
========================================

✗ Some tests failed
```

---

## 🔍 Manual Testing

### Test 1: JWT Secret Validation

**Test that service fails without JWT_SECRET:**
```bash
# Temporarily remove JWT_SECRET
cd api/commercialbank
mv .env .env.backup
npm run dev
# Expected: Error about missing JWT_SECRET

# Restore
mv .env.backup .env
```

**Test with weak secret in production:**
```bash
# Edit .env temporarily
NODE_ENV=production
JWT_SECRET=short
npm run dev
# Expected: Error about secret length

# Restore proper secret
```

---

### Test 2: Password Validation

**Test weak passwords (should fail):**
```bash
# Too short
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test1",
    "password": "Short1!",
    "email": "test1@example.com"
  }'
# Expected: Error about password length

# No uppercase
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test2",
    "password": "lowercase123!",
    "email": "test2@example.com"
  }'
# Expected: Error about uppercase letter

# Common password
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test3",
    "password": "Password123!",
    "email": "test3@example.com"
  }'
# Expected: Error about common password
```

**Test strong password (should succeed):**
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "MyStr0ng!P@ssw0rd",
    "email": "test@example.com"
  }'
# Expected: Success with token
```

---

### Test 3: Input Sanitization

**Test XSS prevention:**
```bash
# First, register and get token
TOKEN="<your-token-here>"

# Try XSS attack
curl -X POST http://localhost:3001/api/exports \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "exporterName": "<script>alert(1)</script>",
    "coffeeType": "Arabica",
    "quantity": 1000,
    "destinationCountry": "USA",
    "estimatedValue": 50000
  }'
# Expected: Success but script tags removed

# Verify sanitization
EXPORT_ID="<export-id-from-response>"
curl -X GET http://localhost:3001/api/exports/$EXPORT_ID \
  -H "Authorization: Bearer $TOKEN"
# Expected: No script tags in response
```

**Test SQL injection prevention:**
```bash
curl -X POST http://localhost:3001/api/exports \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "exporterName": "Test'\'' OR '\''1'\''='\''1",
    "coffeeType": "Arabica",
    "quantity": 1000,
    "destinationCountry": "USA",
    "estimatedValue": 50000
  }'
# Expected: Success but SQL characters escaped
```

**Test number validation:**
```bash
# Negative number
curl -X POST http://localhost:3001/api/exports \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "exporterName": "Test Company",
    "coffeeType": "Arabica",
    "quantity": -1000,
    "destinationCountry": "USA",
    "estimatedValue": 50000
  }'
# Expected: Error about invalid number

# Excessive number
curl -X POST http://localhost:3001/api/exports \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "exporterName": "Test Company",
    "coffeeType": "Arabica",
    "quantity": 999999999999,
    "destinationCountry": "USA",
    "estimatedValue": 50000
  }'
# Expected: Error about number exceeding maximum
```

---

## 🐛 Troubleshooting

### Service Won't Start

**Error: "JWT_SECRET environment variable is required"**
```bash
# Solution: Check .env file exists and has JWT_SECRET
cat api/commercialbank/.env | grep JWT_SECRET

# If missing, add it:
echo "JWT_SECRET=$(openssl rand -base64 64)" >> api/commercialbank/.env
```

**Error: "JWT_SECRET must be at least 64 characters in production"**
```bash
# Solution: Generate a longer secret
openssl rand -base64 64
# Copy to .env file
```

---

### Tests Failing

**"Connection refused" errors**
```bash
# Solution: Make sure service is running
cd api/commercialbank
npm run dev

# Check if running
curl http://localhost:3001/health
```

**"No token provided" errors**
```bash
# Solution: Check if registration/login is working
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "MyStr0ng!P@ssw0rd",
    "email": "test@example.com"
  }'
```

**"Module not found: isomorphic-dompurify"**
```bash
# Solution: Install the dependency
cd api/commercialbank
npm install isomorphic-dompurify

# Repeat for other services
cd ../national-bank && npm install isomorphic-dompurify
cd ../ncat && npm install isomorphic-dompurify
cd ../shipping-line && npm install isomorphic-dompurify
```

---

## 📈 Test Coverage

### Current Coverage

| Component | Tests | Status |
|-----------|-------|--------|
| JWT Secret Validation | 1 | ✅ |
| Password Requirements | 6 | ✅ |
| Authentication Flow | 6 | ✅ |
| XSS Prevention | 3 | ✅ |
| SQL Injection Prevention | 3 | ✅ |
| Number Validation | 4 | ✅ |
| String Validation | 2 | ✅ |
| **Total** | **25** | **✅** |

---

## ���� Success Criteria

All tests should pass with:
- ✅ No hardcoded secrets in use
- ✅ Weak passwords rejected
- ✅ Strong passwords accepted
- ✅ XSS attacks prevented
- ✅ SQL injection prevented
- ✅ Invalid numbers rejected
- ✅ Malicious input sanitized
- ✅ Valid input accepted

---

## 📝 Test Reports

Test reports are automatically saved to:
```
test-results/test-report-YYYYMMDD_HHMMSS.txt
```

View the latest report:
```bash
ls -lt test-results/ | head -n 2
cat test-results/test-report-*.txt | tail -n 50
```

---

## 🚀 Next Steps After Testing

Once all tests pass:

1. **Review Test Reports**
   ```bash
   cat test-results/test-report-*.txt
   ```

2. **Test Other Services**
   - Start national-bank service and test
   - Start ncat service and test
   - Start shipping-line service and test

3. **Continue with Remaining Fixes**
   - Document encryption
   - Rate limiting
   - CORS configuration
   - Error handling

4. **Integration Testing**
   - Test complete export workflow
   - Test inter-service communication
   - Test with frontend

---

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review error messages carefully
3. Check service logs: `npm run dev` output
4. Verify .env configuration
5. Ensure all dependencies are installed

---

**Last Updated:** $(date)  
**Test Suite Version:** 1.0  
**Security Fixes:** 3/25 completed (12%)
