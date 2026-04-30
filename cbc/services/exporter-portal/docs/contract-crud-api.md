# Contract CRUD API Documentation

## Overview
This document describes the Contract CRUD endpoints implemented in Task 4 of the Sales Contract Workflow feature.

## Base URL
```
http://localhost:3001/api/contracts
```

## Authentication
All endpoints require JWT authentication via the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

## Endpoints

### 1. Create Draft Contract

**POST** `/drafts`

Creates a new draft sales contract.

**Request Body:**
```json
{
  "buyer_name": "International Coffee Buyers Ltd",
  "buyer_email": "buyer@example.com",
  "coffee_type": "Ethiopian Yirgacheffe",
  "quantity_bags": 100,
  "unit_price": 250.50,
  "currency": "USD",
  "payment_terms": "Letter of Credit",
  "delivery_location": "Rotterdam",
  "delivery_date": "2025-06-30"
}
```

**Success Response (201 Created):**
```json
{
  "status": "success",
  "message": "Draft contract created successfully",
  "data": {
    "draft_id": "550e8400-e29b-41d4-a716-446655440000",
    "exporter_id": "123e4567-e89b-12d3-a456-426614174000",
    "buyer_name": "International Coffee Buyers Ltd",
    "buyer_email": "buyer@example.com",
    "coffee_type": "Ethiopian Yirgacheffe",
    "quantity_bags": 100,
    "unit_price": 250.50,
    "currency": "USD",
    "payment_terms": "Letter of Credit",
    "delivery_location": "Rotterdam",
    "delivery_date": "2025-06-30T00:00:00.000Z",
    "lc_number": null,
    "ecta_reference_number": null,
    "status": "DRAFT",
    "created_at": "2024-01-15T10:30:00.000Z",
    "last_modified_at": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Validation errors
- `401 Unauthorized` - Missing or invalid authentication token

---

### 2. Get Draft Contract by ID

**GET** `/drafts/:draftId`

Retrieves a specific draft contract by its ID.

**URL Parameters:**
- `draftId` (UUID) - The unique identifier of the draft contract

**Success Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "draft_id": "550e8400-e29b-41d4-a716-446655440000",
    "exporter_id": "123e4567-e89b-12d3-a456-426614174000",
    "buyer_name": "International Coffee Buyers Ltd",
    "buyer_email": "buyer@example.com",
    "coffee_type": "Ethiopian Yirgacheffe",
    "quantity_bags": 100,
    "unit_price": 250.50,
    "currency": "USD",
    "payment_terms": "Letter of Credit",
    "delivery_location": "Rotterdam",
    "delivery_date": "2025-06-30T00:00:00.000Z",
    "status": "DRAFT",
    "created_at": "2024-01-15T10:30:00.000Z",
    "last_modified_at": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - User does not have permission to access this contract
- `404 Not Found` - Contract not found

---

### 3. Update Draft Contract

**PUT** `/drafts/:draftId`

Updates an existing draft contract. Only contracts with status `DRAFT` can be updated.

**URL Parameters:**
- `draftId` (UUID) - The unique identifier of the draft contract

**Request Body (all fields optional):**
```json
{
  "buyer_name": "Updated Buyer Name",
  "buyer_email": "updated@example.com",
  "coffee_type": "Kenyan AA",
  "quantity_bags": 150,
  "unit_price": 275.00,
  "currency": "EUR",
  "payment_terms": "Net 30",
  "delivery_location": "Hamburg",
  "delivery_date": "2025-07-15"
}
```

**Success Response (200 OK):**
```json
{
  "status": "success",
  "message": "Draft contract updated successfully",
  "data": {
    "draft_id": "550e8400-e29b-41d4-a716-446655440000",
    "exporter_id": "123e4567-e89b-12d3-a456-426614174000",
    "buyer_name": "Updated Buyer Name",
    "buyer_email": "updated@example.com",
    "coffee_type": "Kenyan AA",
    "quantity_bags": 150,
    "unit_price": 275.00,
    "currency": "EUR",
    "payment_terms": "Net 30",
    "delivery_location": "Hamburg",
    "delivery_date": "2025-07-15T00:00:00.000Z",
    "status": "DRAFT",
    "created_at": "2024-01-15T10:30:00.000Z",
    "last_modified_at": "2024-01-15T11:45:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Validation errors
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - User does not have permission to edit this contract
- `404 Not Found` - Contract not found
- `409 Conflict` - Contract status is not DRAFT

---

### 4. Delete Draft Contract

**DELETE** `/drafts/:draftId`

Deletes a draft contract. Only contracts with status `DRAFT` can be deleted.

**URL Parameters:**
- `draftId` (UUID) - The unique identifier of the draft contract

**Success Response (204 No Content):**
No response body

**Error Responses:**
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - User does not have permission to delete this contract
- `404 Not Found` - Contract not found
- `409 Conflict` - Contract status is not DRAFT

---

### 5. Get Contracts by Exporter

**GET** `/drafts/exporter/:exporterId`

Retrieves all contracts for a specific exporter with optional filtering and pagination.

**URL Parameters:**
- `exporterId` (UUID) - The unique identifier of the exporter

**Query Parameters:**
- `status` (optional) - Filter by contract status (DRAFT, COUNTERED, ACCEPTED, REJECTED, FINALIZED)
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 10) - Number of items per page

**Example Request:**
```
GET /drafts/exporter/123e4567-e89b-12d3-a456-426614174000?status=DRAFT&page=1&limit=10
```

**Success Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "contracts": [
      {
        "draft_id": "550e8400-e29b-41d4-a716-446655440000",
        "exporter_id": "123e4567-e89b-12d3-a456-426614174000",
        "buyer_name": "International Coffee Buyers Ltd",
        "buyer_email": "buyer@example.com",
        "coffee_type": "Ethiopian Yirgacheffe",
        "quantity_bags": 100,
        "unit_price": 250.50,
        "currency": "USD",
        "status": "DRAFT",
        "created_at": "2024-01-15T10:30:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - User does not have permission to view these contracts

---

## Validation Rules

### Required Fields (Create)
- `buyer_name` - Non-empty string
- `buyer_email` - Valid email format
- `coffee_type` - Must be from supported coffee types list
- `quantity_bags` - Integer >= 1
- `unit_price` - Number > 0
- `currency` - Valid ISO 4217 currency code (USD, EUR, GBP, etc.)
- `payment_terms` - One of: "Advance Payment", "Letter of Credit", "Cash on Delivery", "Net 30", "Net 60", "Net 90"
- `delivery_location` - Valid port or city from approved list
- `delivery_date` - Date in the future

### Supported Coffee Types
- Arabica
- Robusta
- Liberica
- Excelsa
- Ethiopian Yirgacheffe
- Ethiopian Sidamo
- Ethiopian Harrar
- Kenyan AA
- Kenyan AB
- Colombian Geisha
- Brazilian Santos
- Tanzanian Peaberry

### Valid Currencies
USD, EUR, GBP, JPY, CHF, CAD, AUD, NZD, CNY, INR, MXN, BRL, ZAR, SGD, HKD, ETB

### Valid Delivery Locations
Addis Ababa, Djibouti Port, Port Said, Suez, Rotterdam, Hamburg, Singapore, Hong Kong, Shanghai, Los Angeles, New York, Santos, Antwerp, Dubai, Bangkok

---

## Authorization Rules

1. **Create Draft**: Any authenticated exporter can create a draft
2. **Get Draft**: Exporter who owns the contract OR buyer whose email matches the contract
3. **Update Draft**: Only the exporter who owns the contract
4. **Delete Draft**: Only the exporter who owns the contract
5. **Get Contracts by Exporter**: Only the exporter themselves

---

## Status Constraints

- **Create**: Always creates with status `DRAFT`
- **Update**: Only allowed when status is `DRAFT`
- **Delete**: Only allowed when status is `DRAFT`

---

## Error Response Format

All error responses follow this format:

```json
{
  "status": "error",
  "code": "ERROR_CODE",
  "message": "Human-readable error message",
  "errors": [
    {
      "field": "field_name",
      "message": "Field-specific error message",
      "value": "invalid_value"
    }
  ]
}
```

### Common Error Codes
- `UNAUTHORIZED` - Authentication required or invalid
- `FORBIDDEN` - User lacks permission for this action
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Request validation failed
- `CONFLICT` - Operation conflicts with current state (e.g., wrong status)

---

## Testing with cURL

### Create Draft
```bash
curl -X POST http://localhost:3001/api/contracts/drafts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "buyer_name": "Test Buyer",
    "buyer_email": "buyer@example.com",
    "coffee_type": "Arabica",
    "quantity_bags": 100,
    "unit_price": 250.50,
    "currency": "USD",
    "payment_terms": "Letter of Credit",
    "delivery_location": "Rotterdam",
    "delivery_date": "2025-06-30"
  }'
```

### Get Draft
```bash
curl -X GET http://localhost:3001/api/contracts/drafts/DRAFT_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update Draft
```bash
curl -X PUT http://localhost:3001/api/contracts/drafts/DRAFT_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity_bags": 150,
    "unit_price": 275.00
  }'
```

### Delete Draft
```bash
curl -X DELETE http://localhost:3001/api/contracts/drafts/DRAFT_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Exporter Contracts
```bash
curl -X GET "http://localhost:3001/api/contracts/drafts/exporter/EXPORTER_ID?status=DRAFT&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```
