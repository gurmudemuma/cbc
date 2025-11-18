# User Credentials

All test users have been successfully created and registered in the blockchain.

## Login Credentials

### 1. commercialbank
- **Username:** `exporter1`
- **Password:** `Wi2&yVNYeEjr9IQ&`
- **Email:** exporter1@exporter.com
- **User ID:** USER-908589a3-5ab5-4ab8-ad58-79e040eec04d
- **Organization:** commercialbank-001
- **Role:** exporter
- **API Endpoint:** http://localhost:3001
- **Status:** ✅ Active (Created: 2025-10-16)

### 2. National Bank
- **Username:** `banker1`
- **Password:** `a3y7%777%TRK5aXU`
- **Email:** banker1@nationalbank.com
- **User ID:** USER-6f626c61-3811-4a9e-ade9-dada0c9fee06
- **Organization:** NATIONAL-BANK-001
- **Role:** banker
- **API Endpoint:** http://localhost:3002
- **Status:** ✅ Active (Created: 2025-10-16)

### 3. ECTA (National Coffee Authority)
- **Username:** `inspector1`
- **Password:** `h2aG1&I5%cG7KGHi`
- **Email:** inspector1@ncat.gov
- **User ID:** USER-04975302-7eb1-42a9-8bfe-0312869716a7
- **Organization:** ECTA-001
- **Role:** inspector
- **API Endpoint:** http://localhost:3003
- **Status:** ✅ Active (Created: 2025-10-16)

### 4. Shipping Line
- **Username:** `shipper1`
- **Password:** `AWim?Ws%9w6emzeI`
- **Email:** shipper1@shipping.com
- **User ID:** USER-256d8f9b-437d-4d09-9975-9bd853d63787
- **Organization:** SHIPPING-001
- **Role:** shipper
- **API Endpoint:** http://localhost:3004
- **Status:** ✅ Active (Created: 2025-10-16)

## Frontend Access
- **URL:** http://localhost:5173
- **Status:** ✅ All login endpoints working correctly

## API Status
All APIs are running and fully operational:
- ✅ commercialbank API: http://localhost:3001
- ✅ National Bank API: http://localhost:3002
- ✅ ECTA API: http://localhost:3003
- ✅ Shipping Line API: http://localhost:3004

## Password Requirements
The system enforces strong password requirements:
- Minimum 12 characters
- Must contain uppercase, lowercase, number, and special character (@$!%*?&)
- Cannot be a common password
- Cannot contain sequential characters

## Notes
- All users are stored on the blockchain via the `user-management` chaincode
- Passwords are hashed using bcrypt with 12 rounds
- JWT tokens are issued upon successful registration
- Tokens expire after 24 hours by default

## Testing Login
You can test login using curl:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"exporter1","password":"Wi2&yVNYeEjr9IQ&"}'
```

Or access the frontend at http://localhost:5173 and use any of the credentials above.

## Testing Export Management
After logging in, test the exports endpoint:
```bash
# Login and get token
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"exporter1","password":"Wi2&yVNYeEjr9IQ&"}' | jq -r '.data.token')

# Get all exports
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/exports | jq '.'
```
