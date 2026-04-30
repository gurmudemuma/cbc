# Sales Contract Workflow Services

This directory contains the backend service classes for the Sales Contract Workflow feature. These services handle CRUD operations, validation, notifications, and ECTA integration.

## Services Overview

### 1. ContractService

Handles all CRUD operations for sales contracts.

**Key Methods:**
- `createDraft(exporterId, request)` - Create a new draft contract
- `getDraftById(draftId)` - Retrieve a draft contract by ID
- `updateDraft(draftId, request)` - Update a draft contract
- `deleteDraft(draftId)` - Delete a draft contract
- `getContractsByExporter(exporterId, status?, page?, limit?)` - Get all contracts for an exporter
- `updateStatus(draftId, newStatus, actorType, actorId, action, changes?)` - Update contract status
- `getContractHistory(draftId)` - Get contract history
- `getContractByEctaReference(referenceNumber)` - Get contract by ECTA reference
- `updateEctaReference(draftId, referenceNumber)` - Update ECTA reference number
- `updateBlockchainHash(draftId, txHash)` - Update blockchain transaction hash

**Features:**
- Transaction support for multi-step operations
- Automatic history tracking for all changes
- Version control for contract modifications
- Comprehensive error handling and logging

**Example Usage:**
```typescript
const contractService = new ContractService(pool);

// Create a draft contract
const draft = await contractService.createDraft('exporter-123', {
  buyer_name: 'Test Buyer',
  buyer_email: 'buyer@example.com',
  coffee_type: 'Arabica',
  quantity_bags: 100,
  unit_price: 50.0,
  currency: 'USD',
  payment_terms: 'Letter of Credit',
  delivery_location: 'Port Said',
  delivery_date: new Date('2025-12-31'),
});

// Update contract status
const updated = await contractService.updateStatus(
  draft.draft_id,
  ContractStatus.ACCEPTED,
  ActorType.BUYER,
  'buyer-123',
  ContractHistoryAction.ACCEPTED
);
```

### 2. ValidationService

Validates contract terms compliance with international standards.

**Key Methods:**
- `validateCreateRequest(request)` - Validate contract creation request
- `validateUpdateRequest(request)` - Validate contract update request
- `validateFinalizationRequirements(contract)` - Validate finalization requirements
- `getSupportedCoffeeTypes()` - Get list of supported coffee types
- `getValidCurrencies()` - Get list of valid currencies
- `getValidDeliveryLocations()` - Get list of valid delivery locations
- `getApprovedPaymentTerms()` - Get list of approved payment terms

**Validation Rules:**
- Delivery date must be in the future
- Quantity must be at least 1 bag
- Unit price must be greater than zero
- Payment terms must be from approved list
- Currency must be valid ISO 4217 code
- Coffee type must be from supported varieties
- Delivery location must be valid port/city

**Example Usage:**
```typescript
const validationService = new ValidationService();

const result = validationService.validateCreateRequest({
  buyer_name: 'Test Buyer',
  buyer_email: 'buyer@example.com',
  coffee_type: 'Arabica',
  quantity_bags: 100,
  unit_price: 50.0,
  currency: 'USD',
  payment_terms: 'Letter of Credit',
  delivery_location: 'Port Said',
  delivery_date: new Date('2025-12-31'),
});

if (!result.isValid) {
  console.log('Validation errors:', result.errors);
}
```

### 3. NotificationService

Handles email and in-app notifications for contract activities.

**Key Methods:**
- `sendEmailNotification(recipientEmail, subject, htmlContent, textContent?)` - Send email
- `createNotification(draftId, recipientId, recipientEmail, type, subject, message, actionLink?)` - Create in-app notification
- `getNotifications(userId, unreadOnly?)` - Get user notifications
- `markAsRead(notificationId)` - Mark notification as read
- `notifyContractSent(contract, buyerPortalLink)` - Notify buyer of new contract
- `notifyContractAccepted(contract, exporterEmail, exporterId)` - Notify exporter of acceptance
- `notifyContractRejected(contract, exporterEmail, exporterId, rejectionReason)` - Notify of rejection
- `notifyCounterOffer(contract, exporterEmail, exporterId, modifications)` - Notify of counter-offer
- `notifyEctaRegistration(contract, exporterEmail, exporterId, ectaReferenceNumber)` - Notify of ECTA registration
- `notifyCertificateReady(contract, exporterEmail, exporterId, downloadLink)` - Notify certificate is ready

**Features:**
- Email template system for all notification types
- In-app notification tracking
- Delivery status tracking
- Retry logic for failed deliveries

**Example Usage:**
```typescript
const emailConfig = {
  host: 'smtp.example.com',
  port: 587,
  secure: false,
  auth: {
    user: 'noreply@example.com',
    pass: 'password',
  },
  from: 'noreply@example.com',
};

const notificationService = new NotificationService(pool, emailConfig);

// Send contract sent notification
await notificationService.notifyContractSent(
  contract,
  'https://example.com/buyer-portal/draft-123'
);

// Create in-app notification
const notification = await notificationService.createNotification(
  'draft-123',
  'user-123',
  'user@example.com',
  NotificationType.CONTRACT_SENT,
  'New Contract',
  'You have received a new sales contract'
);
```

### 4. ECTAService

Handles integration with Ethiopian Coffee and Tea Authority (ECTA) API.

**Key Methods:**
- `registerContract(contract)` - Register contract with ECTA
- `registerContractWithRetry(contract)` - Register with retry logic
- `getReferenceDetails(referenceNumber)` - Get reference details
- `generateCertificate(contractId)` - Generate certificate
- `generateReferenceNumber()` - Generate ECTA reference number
- `isReferenceNumberUnique(referenceNumber)` - Check uniqueness
- `getRegistrationStatus(contractId)` - Get registration status
- `validateCompliance(contract)` - Validate compliance
- `setRetryConfig(config)` - Set retry configuration

**Features:**
- Automatic reference number generation (ECTA-YYYY-NNNNNN format)
- Retry logic with exponential backoff (5min, 15min, 30min)
- Certificate generation and download
- Compliance validation
- Configurable retry strategy

**Example Usage:**
```typescript
const ectaConfig = {
  baseUrl: 'https://ecta.example.com',
  apiKey: 'your-api-key',
  timeout: 30000,
};

const ectaService = new ECTAService(pool, ectaConfig);

// Register contract with retry
const referenceNumber = await ectaService.registerContractWithRetry(contract);

// Generate reference number locally
const refNum = await ectaService.generateReferenceNumber();

// Generate certificate
const certificatePdf = await ectaService.generateCertificate('draft-123');
```

## Database Schema

The services work with the following database tables:

### contract_drafts
- `draft_id` (UUID, PK)
- `exporter_id` (UUID, FK)
- `buyer_id` (UUID, FK, nullable)
- `buyer_email` (VARCHAR)
- `buyer_name` (VARCHAR)
- `coffee_type` (VARCHAR)
- `quantity_bags` (INTEGER)
- `unit_price` (DECIMAL)
- `currency` (VARCHAR)
- `payment_terms` (VARCHAR)
- `delivery_location` (VARCHAR)
- `delivery_date` (DATE)
- `lc_number` (VARCHAR, nullable)
- `ecta_reference_number` (VARCHAR, nullable)
- `status` (VARCHAR)
- `blockchain_tx_hash` (VARCHAR, nullable)
- `created_at` (TIMESTAMP)
- `last_modified_at` (TIMESTAMP)
- `finalized_at` (TIMESTAMP, nullable)

### contract_history
- `history_id` (UUID, PK)
- `draft_id` (UUID, FK)
- `version_number` (INTEGER)
- `status` (VARCHAR)
- `actor_type` (VARCHAR)
- `actor_id` (UUID)
- `action` (VARCHAR)
- `changes` (JSONB, nullable)
- `rejection_reason` (TEXT, nullable)
- `created_at` (TIMESTAMP)

### contract_notifications
- `notification_id` (UUID, PK)
- `draft_id` (UUID, FK)
- `recipient_id` (UUID)
- `recipient_email` (VARCHAR)
- `notification_type` (VARCHAR)
- `subject` (VARCHAR)
- `message` (TEXT)
- `action_link` (VARCHAR, nullable)
- `is_read` (BOOLEAN)
- `sent_at` (TIMESTAMP)
- `read_at` (TIMESTAMP, nullable)

### contract_permissions
- `permission_id` (UUID, PK)
- `draft_id` (UUID, FK)
- `user_id` (UUID)
- `user_email` (VARCHAR, nullable)
- `permission_type` (VARCHAR)
- `granted_at` (TIMESTAMP)
- `expires_at` (TIMESTAMP, nullable)

## Error Handling

All services implement comprehensive error handling:

- **Validation Errors**: Return structured error objects with field names and messages
- **Database Errors**: Log errors and throw with context
- **Transaction Errors**: Automatic rollback on failure
- **API Errors**: Retry logic with exponential backoff
- **Email Errors**: Graceful degradation with logging

## Logging

All services use the centralized Winston logger:

```typescript
import { createLogger } from '../../shared/logger';
const logger = createLogger('ServiceName');

logger.info('Operation completed');
logger.error('Error occurred', error);
logger.warn('Warning message');
```

## Testing

Each service has comprehensive unit tests:

- `contract.service.test.ts` - 80%+ coverage
- `validation.service.test.ts` - All validation rules tested
- `notification.service.test.ts` - Email and in-app notifications
- `ecta.service.test.ts` - ECTA API integration and retry logic

Run tests:
```bash
npm test -- --testPathPattern="service.test"
```

## Type Definitions

All services use TypeScript interfaces defined in `../types/contract.types.ts`:

- `ContractDraft` - Contract data model
- `ContractHistory` - History entry model
- `ContractNotification` - Notification model
- `ContractPermission` - Permission model
- `CreateContractDraftRequest` - Request DTO
- `UpdateContractDraftRequest` - Update DTO
- `BuyerResponseRequest` - Buyer response DTO
- `ValidationResult` - Validation result model
- `ValidationError` - Validation error model

## Integration

Services are exported from `index.ts`:

```typescript
import {
  ContractService,
  ValidationService,
  NotificationService,
  ECTAService,
} from './services';
```

## Best Practices

1. **Always validate input** using ValidationService before creating/updating contracts
2. **Use transactions** for multi-step operations
3. **Handle errors gracefully** with appropriate logging
4. **Track history** for all contract modifications
5. **Verify permissions** before allowing operations
6. **Use retry logic** for external API calls
7. **Test thoroughly** with unit and integration tests

## Future Enhancements

- Blockchain integration for contract finalization
- Advanced compliance checking
- Multi-language support
- Performance optimization with caching
- Webhook support for external systems
