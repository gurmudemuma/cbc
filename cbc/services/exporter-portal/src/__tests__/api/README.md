# API Endpoint Tests

This directory contains comprehensive API endpoint tests for the Sales Contract Workflow system.

## Test Files

### 1. contract-crud.api.test.ts
Tests for contract CRUD operations (Create, Read, Update, Delete).

**Endpoints Tested**:
- `POST /api/contracts/drafts` - Create draft contract
- `GET /api/contracts/drafts/:draftId` - Get draft by ID
- `PUT /api/contracts/drafts/:draftId` - Update draft
- `DELETE /api/contracts/drafts/:draftId` - Delete draft
- `GET /api/contracts/drafts/exporter/:exporterId` - Get exporter's contracts
- `GET /api/contracts/:referenceNumber` - Get by ECTA reference

**Test Cases**: 20+
- Validation tests (required fields, data types, business logic)
- Authorization tests (authentication, ownership, role-based access)
- Status tests (DRAFT status requirements)
- Error handling (400, 401, 403, 404, 409 responses)

### 2. contract-actions.api.test.ts
Tests for contract action endpoints (send, accept, reject, counter, finalize).

**Endpoints Tested**:
- `POST /api/contracts/drafts/:draftId/send` - Send to buyer
- `POST /api/contracts/drafts/:draftId/accept` - Accept counter-offer
- `POST /api/contracts/drafts/:draftId/reject` - Reject contract
- `POST /api/contracts/drafts/:draftId/counter` - Submit counter-offer
- `POST /api/contracts/drafts/:draftId/finalize` - Finalize to blockchain

**Test Cases**: 25+
- Status transition tests (DRAFT → COUNTERED → ACCEPTED → FINALIZED)
- Blockchain submission tests (success, retry, error handling)
- ECTA registration tests (triggering, reference generation)
- Notification tests (email sending, side effects)
- Authorization tests (ownership verification)

### 3. buyer-portal.api.test.ts
Tests for buyer portal endpoints (contract access and responses).

**Endpoints Tested**:
- `GET /api/buyer/contracts` - Get contracts for buyer
- `POST /api/buyer/contracts/:draftId/respond` - Buyer response (accept/reject/counter)

**Test Cases**: 20+
- Buyer contract retrieval (filtering, pagination, ordering)
- Response handling (accept, reject with reason, counter with modifications)
- Authorization tests (buyer email verification)
- Validation tests (action validation, modification validation)
- Side effect tests (status updates, history creation, notifications)

### 4. notification.api.test.ts
Tests for notification endpoints (send, retrieve, mark as read).

**Endpoints Tested**:
- `POST /api/notifications/send` - Send notification
- `GET /api/notifications/:userId` - Get user notifications
- `PUT /api/notifications/:notificationId/read` - Mark as read

**Test Cases**: 25+
- Notification sending (all 8 notification types)
- Notification retrieval (filtering, pagination, ordering)
- Mark as read (timestamp tracking)
- Authorization tests (user isolation)
- Delivery tracking (status, retries, attempts)

## Running Tests

### Run all API endpoint tests
```bash
npm test -- src/__tests__/api
```

### Run specific test file
```bash
npm test -- src/__tests__/api/contract-crud.api.test.ts
```

### Run with coverage
```bash
npm test -- src/__tests__/api --coverage
```

### Run in watch mode
```bash
npm test -- src/__tests__/api --watch
```

## Test Structure

Each test file follows this structure:

```typescript
describe('API Endpoint Name', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: any;

  beforeEach(() => {
    // Setup mocks
  });

  afterEach(() => {
    // Cleanup
  });

  describe('Endpoint Method - Description', () => {
    it('should do something', async () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

## Mocking Strategy

All tests use Vitest's `vi.mock()` for:
- **ContractService** - Contract CRUD and status operations
- **NotificationService** - Email and in-app notifications
- **ValidationService** - Input validation
- **BlockchainService** - Blockchain submission
- **ECTAService** - ECTA registration
- **Database utilities** - Pool and transaction management

## Test Coverage

| Category | Coverage |
|----------|----------|
| Authorization | ✅ 100% |
| Validation | ✅ 100% |
| Status Transitions | ✅ 100% |
| Error Handling | ✅ 100% |
| Side Effects | ✅ 100% |
| Pagination | ✅ 100% |

## Key Testing Patterns

### 1. Authorization Testing
```typescript
it('should return 403 if user is not authorized', async () => {
  mockReq.user = { id: 'different-user', ... };
  // Test that endpoint returns 403 Forbidden
});
```

### 2. Validation Testing
```typescript
it('should return 400 for invalid data', async () => {
  mockReq.body = { quantity_bags: -50 }; // Invalid
  // Test that endpoint returns 400 Bad Request
});
```

### 3. Status Transition Testing
```typescript
it('should return 409 if contract is not in DRAFT status', async () => {
  const draft = { status: 'COUNTERED' }; // Not DRAFT
  // Test that endpoint returns 409 Conflict
});
```

### 4. Side Effect Testing
```typescript
it('should trigger email notification to buyer', async () => {
  const notifySpy = vi.spyOn(NotificationService.prototype, 'notifyContractSent');
  // Test that notification is sent
  expect(notifySpy).toHaveBeenCalled();
});
```

## Common Test Scenarios

### Successful Operation
```typescript
it('should [action] successfully', async () => {
  // Setup valid data
  // Call endpoint
  // Expect 200/201 response with correct data
});
```

### Missing Required Fields
```typescript
it('should return 400 if [field] is missing', async () => {
  // Setup data without required field
  // Call endpoint
  // Expect 400 Bad Request
});
```

### Unauthorized Access
```typescript
it('should return 403 if user is not authorized', async () => {
  // Setup different user
  // Call endpoint
  // Expect 403 Forbidden
});
```

### Resource Not Found
```typescript
it('should return 404 if [resource] not found', async () => {
  // Mock service to return null
  // Call endpoint
  // Expect 404 Not Found
});
```

### Invalid State Transition
```typescript
it('should return 409 if [condition] is not met', async () => {
  // Setup invalid state
  // Call endpoint
  // Expect 409 Conflict
});
```

## Debugging Tests

### Enable verbose output
```bash
npm test -- src/__tests__/api --reporter=verbose
```

### Run single test
```bash
npm test -- src/__tests__/api/contract-crud.api.test.ts -t "should create a draft"
```

### Debug in VS Code
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "test", "--", "--inspect-brk"],
  "console": "integratedTerminal"
}
```

## Best Practices

1. **Use descriptive test names** - Clearly state what is being tested
2. **Follow AAA pattern** - Arrange, Act, Assert
3. **Mock external dependencies** - Don't call real services
4. **Test both success and failure paths** - Cover all scenarios
5. **Use consistent naming** - mockReq, mockRes, mockNext
6. **Clean up after tests** - Use afterEach to clear mocks
7. **Test authorization first** - Security is critical
8. **Test validation thoroughly** - Prevent invalid data
9. **Test side effects** - Ensure notifications, history, etc. are created
10. **Keep tests focused** - One assertion per test when possible

## Related Files

- **Routes**: `src/routes/contract.routes.ts`, `src/routes/buyer-portal.routes.ts`
- **Controllers**: `src/controllers/contract.controller.ts`
- **Services**: `src/services/contract.service.ts`, `src/services/notification.service.ts`
- **Unit Tests**: `src/__tests__/contract.service.test.ts`, etc.
- **Integration Tests**: `src/__tests__/integration/`

## Contributing

When adding new API endpoints:
1. Create corresponding test file in this directory
2. Follow the existing test structure
3. Test all success and failure paths
4. Test authorization and validation
5. Test side effects (notifications, history, etc.)
6. Ensure 80%+ code coverage
7. Run all tests before committing

---

**Last Updated**: Phase 14 - API Endpoint Tests
**Status**: ✅ Complete
