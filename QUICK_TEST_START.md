# ⚡ Quick Test Start Guide

**Get testing in 5 minutes!**

---

## 🎯 Quick Steps

### 1. Verify Setup (30 seconds)

```bash
# Check .env files exist
ls api/exporter-bank/.env api/national-bank/.env api/ncat/.env api/shipping-line/.env

# Should show 4 files. If not, they were created in the previous step.
```

### 2. Install Dependencies (2 minutes)

```bash
# Install for all services
cd api/exporter-bank && npm install && cd ../..
cd api/national-bank && npm install && cd ../..
cd api/ncat && npm install && cd ../..
cd api/shipping-line && npm install && cd ../..
```

### 3. Start Service (30 seconds)

```bash
# Start exporter-bank service
cd api/exporter-bank
npm run dev
```

**Wait for:** `🚀 Exporter Bank API server running on port 3001`

### 4. Run Tests (2 minutes)

Open a **new terminal** and run:

```bash
cd /home/gu-da/CBC
./run-all-tests.sh
```

---

## ✅ Expected Output

```
========================================
Coffee Export Blockchain
Security Test Suite
========================================

Checking if services are running...
✓ Exporter Bank API is running

Running Authentication Tests...
Test 1: Reject password < 12 characters
✓ PASSED

Test 2: Reject password without uppercase
✓ PASSED

... (more tests)

========================================
Test Summary
========================================
Total Tests: 13
Passed: 13
Failed: 0
========================================

✓ All tests passed!

Running Input Sanitization Tests...
... (more tests)

========================================
OVERALL SUMMARY
========================================
1. Authentication Tests: ✓ PASSED
2. Input Sanitization Tests: ✓ PASSED
========================================

✓ ALL TEST SUITES PASSED!
```

---

## 🐛 Quick Troubleshooting

### Service Won't Start?

```bash
# Check if JWT_SECRET is set
cat api/exporter-bank/.env | grep JWT_SECRET

# If empty, it should have been set. Check the file was created correctly.
```

### Tests Fail?

```bash
# Make sure service is running
curl http://localhost:3001/health

# Should return: {"status":"ok",...}
```

### Port Already in Use?

```bash
# Kill existing process
lsof -ti:3001 | xargs kill -9

# Restart service
cd api/exporter-bank && npm run dev
```

---

## 📊 What Gets Tested?

### ✅ Authentication Security
- Password strength requirements
- JWT token validation
- Login/logout flows
- Protected endpoint access

### ✅ Input Sanitization
- XSS attack prevention
- SQL injection prevention
- Number validation
- String length limits

---

## 🎉 Success!

If all tests pass, you've successfully:
- ✅ Secured JWT authentication
- ✅ Strengthened password requirements
- ✅ Protected against XSS attacks
- ✅ Protected against SQL injection
- ✅ Validated all user inputs

---

## 🚀 Next Steps

1. **Review the test report:**
   ```bash
   ls -lt test-results/
   cat test-results/test-report-*.txt
   ```

2. **Test other services:**
   - Start national-bank on port 3002
   - Start ncat on port 3003
   - Start shipping-line on port 3004

3. **Continue with remaining fixes:**
   - Document encryption
   - Rate limiting
   - CORS configuration

---

## 📞 Need Help?

Check the full guide: `TESTING_GUIDE.md`

---

**Time to Complete:** ~5 minutes  
**Difficulty:** Easy  
**Prerequisites:** Node.js, npm installed
