========================================
TESTS DIRECTORY
========================================

This directory contains all test scripts and files.

========================================
SMART CONTRACT TESTS
========================================

test-smart-contract.js
  - Comprehensive smart contract test
  - Tests all chaincode functions
  - Full workflow testing

test-smart-contract-simple.js
  - Simple smart contract test
  - Quick verification of basic functions

test-chaincode-direct.js
  - Direct chaincode testing
  - Low-level chaincode invocation

test-enhanced-fields.js
  - Tests all enhanced ECTA compliance fields
  - License expiry, banking, customs, shipping
  - 11 comprehensive tests
  - Run: node tests/test-enhanced-fields.js

========================================
BACKEND TESTS
========================================

test-login.js
  - Backend authentication test
  - Tests all 9 test user accounts
  - Run: node tests/test-login.js

test-everything.bat
  - Comprehensive system test
  - Tests all components

========================================
FRONTEND TESTS
========================================

test-backend-connection.js
  - Tests frontend-backend connectivity
  - API endpoint verification
  - Run: node tests/test-backend-connection.js

test-full-connection.js
  - Full stack connection test
  - Frontend -> Backend -> Chaincode
  - Run: node tests/test-full-connection.js

========================================
TEST DATA
========================================

chaincode_query.txt
  - Sample chaincode queries
  - Query examples and results

========================================
HOW TO RUN TESTS
========================================

1. Ensure all services are running:
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3000
   - Chaincode: http://localhost:3001

2. Run individual tests:
   node tests/test-enhanced-fields.js
   node tests/test-smart-contract-simple.js
   node tests/test-login.js

3. Check test results in console output

========================================
TEST USERS
========================================

All tests use these credentials:
- exporter1 / password123
- exporter2 / password123
- exporter3 / password123
- ecta_admin / password123
- ecta_officer / password123
- bank_officer / password123
- nbe_officer / password123
- customs_officer / password123
- shipping_officer / password123

========================================
