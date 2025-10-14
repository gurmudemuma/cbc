# Chaincode Interaction: User Management & Coffee Export

This document explains how the two smart contracts (chaincodes) interact in the Coffee Blockchain Consortium system.

---

## Overview

The system uses **two separate chaincodes** deployed on the same channel (`coffeechannel`):

1. **user-management** - Handles user authentication and authorization
2. **coffee-export** - Manages the coffee export workflow

These chaincodes **do NOT directly call each other** at the chaincode level. Instead, they interact **indirectly through the API layer** and share the same blockchain network for trust and verification.

---

## Architecture Pattern: Separation of Concerns

```
┌─────────────────────────────────────────────────────────────┐
│                     API Layer (Node.js)                     │
│  ┌──────────────────────┐    ┌──────────────────────────┐  │
│  │  Auth Controller     │    │  Export Controller       │  │
│  │  - Register          │    │  - Create Export         │  │
│  │  - Login             │    │  - Approve FX            │  │
│  │  - Verify Token      │    │  - Issue Certificate     │  │
│  └──────────┬───────────┘    └──────────┬───────────────┘  │
│             │                           │                   │
│             ▼                           ▼                   │
│  ┌──────────────────────┐    ┌──────────────────────────┐  │
│  │  getUserContract()   │    │  getExportContract()     │  │
│  └──────────┬───────────┘    └──────────┬───────────────┘  │
└─────────────┼────────────────────────────┼──────────────────┘
              │                            │
              ▼                            ▼
┌───────────────���─────────────────────────────────────────────┐
│              Hyperledger Fabric Network                     │
│  ┌──────────────────────┐    ┌──────────────────────────┐  │
│  │  user-management     │    │  coffee-export           │  │
│  │  Chaincode           │    │  Chaincode               │  │
│  │                      │    │                          │  │
│  │  - RegisterUser      │    │  - CreateExportRequest   │  │
│  │  - GetUser           │    │  - ApproveFX             │  │
│  │  - UpdateLastLogin   │    │  - IssueQualityCert      │  │
│  │  - DeactivateUser    │    │  - ScheduleShipment      │  │
│  └──────────────────────┘    └──────────────────────────┘  │
│                                                             │
│              Same Channel: coffeechannel                    │
│              Same Ledger: Shared State                      │
└─────────────────────────────────────────────────────────────┘
```

---

## How They Work Together

### 1. **No Direct Chaincode-to-Chaincode Calls**

The chaincodes **do not invoke each other directly**. Hyperledger Fabric supports chaincode-to-chaincode invocation, but this system uses a **cleaner separation** where:

- Each chaincode has a **single responsibility**
- The API layer **orchestrates** interactions between them
- This provides better **modularity** and **maintainability**

### 2. **Indirect Interaction Through API Layer**

The interaction happens at the **application level**:

```typescript
// Example: Creating an export request
// Step 1: API verifies user authentication (user-management chaincode)
const user = await userService.authenticateUser({ username, password });

// Step 2: API creates export using authenticated user's info (coffee-export chaincode)
const export = await exportContract.submitTransaction(
  'CreateExportRequest',
  exportID,
  user.organizationId,  // ← User info from user-management
  exporterName,
  coffeeType,
  quantity,
  destinationCountry,
  estimatedValue
);
```

---

## Interaction Patterns

### Pattern 1: Authentication → Authorization → Action

**Flow:**
1. User logs in → **user-management** chaincode validates credentials
2. API generates JWT token with user info (organizationId, role)
3. User makes export request → API validates JWT
4. API calls **coffee-export** chaincode with user's organizationId
5. **coffee-export** chaincode validates MSP ID matches organization

**Example:**

```typescript
// 1. Login (user-management chaincode)
POST /api/auth/login
{
  "username": "exporter1",
  "password": "SecurePass123"
}

Response: {
  "token": "eyJhbGc...",
  "user": {
    "id": "user-123",
    "organizationId": "EXPORTER-BANK-001",
    "role": "exporter"
  }
}

// 2. Create Export (coffee-export chaincode)
POST /api/exports
Headers: { "Authorization": "Bearer eyJhbGc..." }
{
  "exporterName": "ABC Coffee",
  "coffeeType": "Arabica",
  "quantity": 5000
}

// API extracts organizationId from JWT and passes to chaincode
```

### Pattern 2: MSP-Based Access Control

Both chaincodes use **MSP ID validation** to ensure only authorized organizations can perform specific actions:

**user-management chaincode:**
```go
// No MSP restrictions - any organization can register/login users
// This allows cross-organization user management
```

**coffee-export chaincode:**
```go
// Strict MSP validation for each action
func (c *CoffeeExportContract) CreateExportRequest(...) error {
    clientMSPID, _ := ctx.GetClientIdentity().GetMSPID()
    if clientMSPID != "ExporterBankMSP" {
        return fmt.Errorf("only Exporter Bank can create export requests")
    }
    // ...
}

func (c *CoffeeExportContract) ApproveFX(...) error {
    clientMSPID, _ := ctx.GetClientIdentity().GetMSPID()
    if clientMSPID != "NationalBankMSP" {
        return fmt.Errorf("only National Bank can approve FX")
    }
    // ...
}
```

### Pattern 3: Shared Ledger State

Both chaincodes write to the **same ledger** on the **same channel**, providing:

- **Immutability**: All user registrations and export transactions are permanent
- **Transparency**: All organizations can query both chaincodes
- **Auditability**: Complete history of users and exports
- **Trust**: No single organization controls the data

---

## Data Flow Examples

### Example 1: Complete Export Workflow

```
1. User Registration (user-management)
   ↓
   API: POST /api/auth/register
   ↓
   Chaincode: RegisterUser()
   ↓
   Ledger: User stored with ID, username, organizationId, role

2. User Login (user-management)
   ↓
   API: POST /api/auth/login
   ↓
   Chaincode: GetUserByUsername() + password verification
   ↓
   API: Generate JWT with user info

3. Create Export (coffee-export)
   ���
   API: POST /api/exports (with JWT)
   ↓
   API: Validate JWT, extract organizationId
   ↓
   Chaincode: CreateExportRequest() with MSP validation
   ↓
   Ledger: Export stored with status PENDING

4. Approve FX (coffee-export)
   ↓
   National Bank user logs in (user-management)
   ↓
   API: POST /api/fx/approve (with JWT)
   ↓
   Chaincode: ApproveFX() with MSP validation (NationalBankMSP)
   ↓
   Ledger: Export updated to FX_APPROVED

5. Issue Quality Certificate (coffee-export)
   ↓
   NCAT user logs in (user-management)
   ↓
   API: POST /api/quality/certify (with JWT)
   ↓
   Chaincode: IssueQualityCertificate() with MSP validation (NCATMSP)
   ↓
   Ledger: Export updated to QUALITY_CERTIFIED

6. Schedule Shipment (coffee-export)
   ↓
   Shipping Line user logs in (user-management)
   ↓
   API: POST /api/shipments/schedule (with JWT)
   ↓
   Chaincode: ScheduleShipment() with MSP validation (ShippingLineMSP)
   ↓
   Ledger: Export updated to SHIPMENT_SCHEDULED
```

---

## Why This Design?

### Advantages of Separate Chaincodes

1. **Modularity**
   - Each chaincode has a single, clear purpose
   - Easy to update one without affecting the other
   - Can be versioned independently

2. **Security**
   - User credentials isolated in user-management
   - Export business logic isolated in coffee-export
   - Easier to audit and secure each component

3. **Scalability**
   - Can deploy different endorsement policies per chaincode
   - Can optimize performance for each use case
   - Can add new chaincodes without modifying existing ones

4. **Maintainability**
   - Smaller, focused codebases
   - Easier to test and debug
   - Clear separation of concerns

### Why Not Chaincode-to-Chaincode Calls?

While Fabric supports it, we avoid it because:

1. **Complexity**: Adds complexity to chaincode logic
2. **Coupling**: Creates tight coupling between chaincodes
3. **Performance**: Additional overhead for cross-chaincode calls
4. **Flexibility**: API layer provides more flexibility for orchestration

---

## API Layer Orchestration

The API layer acts as the **orchestrator** between chaincodes:

```typescript
// api/shared/userService.ts
export class BlockchainUserService {
  constructor(private userContract: Contract) {}

  async registerUser(userData: RegisterUserInput): Promise<User> {
    // Calls user-management chaincode
    await this.userContract.submitTransaction(
      'RegisterUser',
      userId,
      username,
      passwordHash,
      email,
      organizationId,
      role
    );
  }

  async authenticateUser(credentials: LoginInput): Promise<User> {
    // Calls user-management chaincode
    const userJSON = await this.userContract.evaluateTransaction(
      'GetUserByUsername',
      username
    );
  }
}

// api/exporter-bank/src/controllers/export.controller.ts
export class ExportController {
  async createExport(req: Request, res: Response) {
    // 1. Get user info from JWT (from user-management)
    const user = req.user; // Extracted from JWT by middleware
    
    // 2. Call coffee-export chaincode with user's organizationId
    await exportContract.submitTransaction(
      'CreateExportRequest',
      exportID,
      user.organizationId, // ← From user-management
      exporterName,
      coffeeType,
      quantity,
      destinationCountry,
      estimatedValue
    );
  }
}
```

---

## Security Model

### Two-Layer Security

**Layer 1: User Authentication (user-management)**
- Username/password validation
- Password hashing with bcrypt
- User status (active/inactive)
- JWT token generation

**Layer 2: Organization Authorization (coffee-export)**
- MSP ID validation
- Role-based access control
- Action-specific permissions
- Status-based workflow enforcement

### Example Security Flow

```
User Request
    ↓
[API Middleware: Verify JWT]
    ↓
Extract: userId, organizationId, role
    ↓
[API: Get user from user-management chaincode]
    ↓
Verify: User is active
    ↓
[API: Call coffee-export chaincode]
    ↓
[Chaincode: Verify MSP ID matches organization]
    ↓
[Chaincode: Verify user has permission for action]
    ↓
Execute Transaction
```

---

## Querying Across Chaincodes

APIs can query both chaincodes to provide rich data:

```typescript
// Get export with creator details
async getExportWithCreator(exportId: string) {
  // 1. Get export from coffee-export chaincode
  const exportData = await exportContract.evaluateTransaction(
    'GetExportRequest',
    exportId
  );
  const export = JSON.parse(exportData.toString());

  // 2. Get creator details from user-management chaincode
  const userData = await userContract.evaluateTransaction(
    'GetUser',
    export.exporterBankID
  );
  const user = JSON.parse(userData.toString());

  // 3. Combine data
  return {
    ...export,
    creator: {
      username: user.username,
      email: user.email,
      role: user.role
    }
  };
}
```

---

## State Management

### Separate State Spaces

Each chaincode maintains its own state:

**user-management state:**
```
Key: user-123
Value: {
  "id": "user-123",
  "username": "exporter1",
  "organizationId": "EXPORTER-BANK-001",
  "role": "exporter",
  ...
}

Key: username~exporter1 (composite key)
Value: "user-123"
```

**coffee-export state:**
```
Key: EXP-001
Value: {
  "exportId": "EXP-001",
  "exporterBankID": "EXPORTER-BANK-001",
  "status": "PENDING",
  ...
}
```

### Shared Ledger Benefits

Even though states are separate, they're on the **same ledger**:

- **Atomic transactions**: All changes are recorded together
- **Consistent history**: Complete audit trail across both chaincodes
- **Shared trust**: All organizations validate all transactions
- **Unified governance**: Same endorsement policies and consensus

---

## Event-Driven Integration (Future Enhancement)

While not currently implemented, the system could use **chaincode events** for tighter integration:

```go
// In coffee-export chaincode
func (c *CoffeeExportContract) CreateExportRequest(...) error {
    // ... create export ...
    
    // Emit event
    ctx.GetStub().SetEvent("ExportCreated", exportJSON)
    return nil
}

// API listens for events and could trigger user notifications
// via user-management chaincode
```

---

## Summary

### Key Points

1. **Two Independent Chaincodes**
   - user-management: Authentication & user data
   - coffee-export: Export workflow & business logic

2. **No Direct Chaincode Calls**
   - Interaction happens through API layer
   - Cleaner separation of concerns
   - Better maintainability

3. **API Orchestration**
   - APIs call both chaincodes as needed
   - Combine data from multiple sources
   - Enforce business rules

4. **Dual Security Model**
   - User authentication (user-management)
   - Organization authorization (coffee-export MSP validation)

5. **Shared Ledger**
   - Same channel (coffeechannel)
   - Same blockchain network
   - Unified trust and auditability

### Interaction Summary

```
┌──────────────────┐
│  User Action     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  API Layer       │ ← Orchestrates both chaincodes
│  - Validates JWT │
│  - Calls both    │
│    chaincodes    │
└────┬────────┬────┘
     │        │
     ▼        ▼
┌─────────┐ ┌──────────┐
│  user-  │ │ coffee-  │
│  mgmt   │ │ export   │
└─────────┘ └──────────┘
     │        │
     └────┬───┘
          ▼
    ┌──────────┐
    │  Ledger  │ ← Shared state
    └──────────┘
```

---

## Related Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) - Overall system architecture
- [SECURITY.md](SECURITY.md) - Security implementation details
- [API Documentation](README.md#api-documentation) - API endpoints

---

**Last Updated:** 2024
**Maintained By:** Coffee Blockchain Consortium Team
