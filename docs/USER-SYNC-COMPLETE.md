# User Synchronization Implementation - Complete Guide

## Overview

This document describes the complete user synchronization system between PostgreSQL (CBC services) and Hyperledger Fabric (blockchain).

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Registration Flow                    │
└─────────────────────────────────────────────────────────────┘

1. User Registration (Gateway)
   ↓
2. Create in PostgreSQL (Blockchain Bridge)
   ↓
3. Create on Blockchain (Chaincode)
   ↓
4. Publish Event to Kafka
   ↓
5. Update Status (if approved)

┌─────────────────────────────────────────────────────────────┐
│                    User Status Update Flow                   │
└─────────────────────────────────────────────────────────────┘

1. Status Update Request (CBC Service)
   ↓
2. Update PostgreSQL
   ↓
3. Publish to Kafka (user.status.updated)
   ↓
4. Blockchain Bridge Consumes Event
   ↓
5. Update Blockchain Status
```

## Components

### 1. User Sync Service (`services/blockchain-bridge/src/services/user-sync-service.ts`)

**Purpose**: Manages user synchronization between PostgreSQL and Blockchain

**Key Methods**:
- `initializeTestUsers()` - Creates test users in both systems
- `createUserInBothSystems()` - Creates a user in PostgreSQL and Blockchain
- `syncUserToBlockchain()` - Syncs a single user from PostgreSQL to Blockchain
- `syncAllUsers()` - Syncs all users from PostgreSQL to Blockchain
- `handleUserStatusUpdate()` - Handles user status updates from Kafka

**Test Users Created**:
```javascript
- admin / admin123 (admin) - ECTA Administrator
- exporter1 / password123 (exporter) - Ethiopian Coffee Exports Ltd
- exporter2 / password123 (exporter) - Addis Coffee Trading
- bank1 / password123 (bank) - Commercial Bank of Ethiopia
- ecta1 / password123 (ecta) - ECTA Quality Control
- customs1 / password123 (customs) - Ethiopian Customs Authority
- nbe1 / password123 (nbe) - National Bank of Ethiopia
- ecx1 / password123 (ecx) - Ethiopian Commodity Exchange
- shipping1 / password123 (shipping) - Ethiopian Shipping Lines
```

### 2. Fabric Client Updates (`services/blockchain-bridge/src/clients/fabric-client.ts`)

**New Methods Added**:
- `registerUser(userData)` - Register user on blockchain
- `getUser(username)` - Get user from blockchain
- `updateUserStatus(username, statusData)` - Update user status on blockchain
- `getAllUsers()` - Get all users from blockchain

### 3. Data Sync Service Updates (`services/blockchain-bridge/src/services/data-sync-service.ts`)

**New Kafka Subscription**:
- `user.status.updated` - Listens for user status updates

**New Handler**:
- `handleUserStatusUpdate(message)` - Syncs user status updates to blockchain

### 4. Blockchain Bridge Index (`services/blockchain-bridge/src/index.ts`)

**Initialization Flow**:
1. Connect to Kafka
2. Initialize Fabric Event Listener
3. Initialize Data Sync Service
4. Initialize Reconciliation Service
5. **Initialize Test Users** (NEW)

**New Endpoints**:
- `POST /users/sync` - Sync users to blockchain
  - Body: `{ "username": "exporter1" }` (optional, syncs all if omitted)
- `POST /users/initialize` - Initialize test users

### 5. Frontend Nginx Configuration (`cbc/frontend/nginx.conf`)

**Fixed API Proxy**:
```nginx
location /api/ {
    proxy_pass http://gateway:3000/;
    # ... proxy headers
}
```

**Before**: Proxied to `localhost:3001` (unreachable from container)
**After**: Proxies to `gateway:3000` (correct service)

## Database Schema

### Users Table (PostgreSQL)

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    company_name VARCHAR(255) NOT NULL,
    tin VARCHAR(100) UNIQUE NOT NULL,
    capital_etb DECIMAL(15, 2) NOT NULL,
    address TEXT,
    contact_person VARCHAR(255),
    role VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending_approval',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Blockchain User Structure

```javascript
{
    username: string,
    passwordHash: string,
    email: string,
    phone: string,
    companyName: string,
    tin: string,
    capitalETB: number,
    address: string,
    contactPerson: string,
    role: string,
    status: string,
    createdAt: string,
    updatedAt: string
}
```

## Kafka Topics

### Published Events

1. **user.created**
   ```json
   {
       "userId": 1,
       "username": "exporter1",
       "role": "exporter",
       "status": "approved",
       "timestamp": "2026-02-19T12:00:00.000Z"
   }
   ```

2. **user.status.updated**
   ```json
   {
       "username": "exporter1",
       "status": "approved",
       "approvedBy": "admin",
       "comments": "Approved after verification",
       "timestamp": "2026-02-19T12:00:00.000Z"
   }
   ```

## API Endpoints

### Blockchain Bridge Service (Port 3008)

#### Initialize Test Users
```bash
POST http://localhost:3008/users/initialize
```

Response:
```json
{
    "success": true,
    "message": "Test users initialized"
}
```

#### Sync Single User
```bash
POST http://localhost:3008/users/sync
Content-Type: application/json

{
    "username": "exporter1"
}
```

Response:
```json
{
    "success": true,
    "message": "User exporter1 synced"
}
```

#### Sync All Users
```bash
POST http://localhost:3008/users/sync
```

Response:
```json
{
    "success": true,
    "message": "All users synced"
}
```

### Gateway Service (Port 3000)

#### User Registration
```bash
POST http://localhost:3000/auth/register
Content-Type: application/json

{
    "username": "newexporter",
    "password": "password123",
    "email": "newexporter@example.com",
    "phone": "+251911234567",
    "companyName": "New Coffee Exports",
    "tin": "TIN123456789",
    "capitalETB": 50000000,
    "address": "Addis Ababa, Ethiopia",
    "contactPerson": "John Doe"
}
```

#### User Login
```bash
POST http://localhost:3000/auth/login
Content-Type: application/json

{
    "username": "exporter1",
    "password": "password123"
}
```

## Deployment Steps

### 1. Rebuild Services

Run the rebuild script:
```bash
rebuild-with-user-sync.bat
```

Or manually:
```bash
# Stop services
docker-compose -f docker-compose-hybrid.yml down

# Rebuild blockchain-bridge
docker-compose -f docker-compose-hybrid.yml build blockchain-bridge

# Rebuild gateway
docker-compose -f docker-compose-hybrid.yml build gateway

# Rebuild frontend
docker-compose -f docker-compose-hybrid.yml build frontend

# Start all services
docker-compose -f docker-compose-hybrid.yml up -d
```

### 2. Verify Services

Check service status:
```bash
docker-compose -f docker-compose-hybrid.yml ps
```

Expected output:
```
NAME               STATUS
coffee-bridge      Up (healthy)
coffee-chaincode   Up (healthy)
coffee-frontend    Up (healthy)
coffee-gateway     Up (healthy)
coffee-kafka       Up (healthy)
coffee-postgres    Up (healthy)
coffee-redis       Up (healthy)
coffee-zookeeper   Up
```

### 3. Check Logs

View blockchain-bridge logs:
```bash
docker-compose -f docker-compose-hybrid.yml logs blockchain-bridge --tail=100
```

Look for:
```
info: Initializing test users...
info: ✓ Created user: admin (admin)
info: ✓ Created user: exporter1 (exporter)
...
info: ✓ Test users initialized successfully
```

### 4. Test User Login

Access frontend:
```
http://localhost:5173
```

Login with test credentials:
- Username: `exporter1`
- Password: `password123`

## Troubleshooting

### Issue: Users not created in PostgreSQL

**Check**:
```bash
docker exec -it coffee-postgres psql -U postgres -d coffee_export_db -c "SELECT username, role, status FROM users;"
```

**Solution**: Manually initialize users:
```bash
curl -X POST http://localhost:3008/users/initialize
```

### Issue: Users not synced to blockchain

**Check blockchain-bridge logs**:
```bash
docker-compose -f docker-compose-hybrid.yml logs blockchain-bridge | grep "user"
```

**Solution**: Manually sync users:
```bash
curl -X POST http://localhost:3008/users/sync
```

### Issue: Frontend can't reach API

**Check nginx logs**:
```bash
docker-compose -f docker-compose-hybrid.yml logs frontend
```

**Verify nginx config**:
```bash
docker exec coffee-frontend cat /etc/nginx/nginx.conf | grep "proxy_pass"
```

Should show: `proxy_pass http://gateway:3000/;`

### Issue: Kafka connection errors

**Check Kafka status**:
```bash
docker-compose -f docker-compose-hybrid.yml logs kafka --tail=50
```

**Restart blockchain-bridge**:
```bash
docker-compose -f docker-compose-hybrid.yml restart blockchain-bridge
```

## Testing

### 1. Test User Creation

```bash
# Create a new user via API
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123",
    "email": "test@example.com",
    "phone": "+251911234567",
    "companyName": "Test Company",
    "tin": "TIN999999999",
    "capitalETB": 50000000,
    "address": "Addis Ababa",
    "contactPerson": "Test User"
  }'
```

### 2. Verify in PostgreSQL

```bash
docker exec -it coffee-postgres psql -U postgres -d coffee_export_db \
  -c "SELECT username, role, status FROM users WHERE username='testuser';"
```

### 3. Verify on Blockchain

```bash
curl -X POST http://localhost:3001/query \
  -H "Content-Type: application/json" \
  -d '{
    "fcn": "GetUser",
    "args": ["testuser"]
  }'
```

### 4. Test User Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

## Monitoring

### Check Sync Status

```bash
curl http://localhost:3008/sync/status
```

### Check Health

```bash
curl http://localhost:3008/health
```

### View Metrics

```bash
curl http://localhost:3008/metrics
```

## Security Considerations

1. **Password Hashing**: All passwords are hashed using bcrypt with 10 rounds
2. **JWT Tokens**: Authentication uses JWT tokens with expiration
3. **Role-Based Access**: Users have roles (admin, exporter, bank, etc.)
4. **Status Verification**: Users must be approved before full access
5. **TIN Uniqueness**: Tax Identification Numbers are unique across the system

## Future Enhancements

1. **Email Verification**: Send verification emails on registration
2. **Password Reset**: Implement password reset functionality
3. **Two-Factor Authentication**: Add 2FA for enhanced security
4. **Audit Logging**: Log all user actions for compliance
5. **User Profile Updates**: Allow users to update their profiles
6. **Role Management**: Admin interface for managing user roles
7. **Bulk User Import**: Import users from CSV/Excel files

## Summary

The user synchronization system ensures that:
- ✅ Users are created in both PostgreSQL and Blockchain
- ✅ User data is consistent across systems
- ✅ Status updates are synchronized via Kafka
- ✅ Test users are automatically initialized
- ✅ Frontend can properly access the API
- ✅ All services communicate correctly

The system is now ready for testing and development!
