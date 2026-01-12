# Using Multiple Exporters - Complete Guide

## Overview

Yes! You can use **all 5 approved exporters** to create exports. The system supports creating exports for any approved exporter by specifying their `exporter_id`.

## Available Exporters

Your database currently has 5 ACTIVE exporters:

| Exporter ID | Business Name | User ID | Status |
|-------------|---------------|---------|--------|
| `51ae1dca-9b11-4d6b-b8cc-1004b98a47ec` | Debug Coffee Exporters | 40 | ACTIVE |
| `d6c5b1d6-6dc3-4f78-ac73-f3e820d11f20` | ana | 1 | ACTIVE |
| `7aeaa77e-5188-4175-8be9-e3086fe37386` | Golden Beans Export PLC | 41 | ACTIVE |
| `cde259bb-2bff-4546-91f4-64c7a7b549ab` | anaaf | 34 | ACTIVE |
| `2add265c-393c-4a2e-bacb-4a707a1d095e` | Premium Coffee Exports Ltd | 44 | ACTIVE |

## Method 1: Specify Exporter ID (Recommended)

When creating an export, you can explicitly specify which exporter to use:

### API Request

```javascript
POST http://localhost:3001/api/exports
Headers: {
  Authorization: Bearer <token>
}
Body: {
  "exporterId": "51ae1dca-9b11-4d6b-b8cc-1004b98a47ec",  // Specify exporter
  "coffeeType": "Sidamo Grade 2",
  "quantity": 5000,
  "destinationCountry": "USA",
  "buyerName": "American Coffee Importers",
  "estimatedValue": 42500
}
```

### JavaScript Example

```javascript
const axios = require('axios');

// Choose any of the 5 exporter IDs
const exporterId = '7aeaa77e-5188-4175-8be9-e3086fe37386'; // Golden Beans Export PLC

const response = await axios.post(
  'http://localhost:3001/api/exports',
  {
    exporterId: exporterId,
    coffeeType: 'Yirgacheffe Grade 1',
    quantity: 8000,
    destinationCountry: 'Italy',
    buyerName: 'Milano Coffee Roasters',
    estimatedValue: 72000
  },
  {
    headers: { Authorization: `Bearer ${authToken}` }
  }
);

console.log('Export created:', response.data.data.export_id);
```

## Method 2: Auto-Detect from User

If you don't specify `exporterId`, the system will automatically use the exporter profile associated with the logged-in user:

```javascript
const response = await axios.post(
  'http://localhost:3001/api/exports',
  {
    // No exporterId - uses logged-in user's profile
    coffeeType: 'Harar Grade 1',
    quantity: 3000,
    destinationCountry: 'Japan',
    buyerName: 'Tokyo Coffee Trading',
    estimatedValue: 27000
  },
  {
    headers: { Authorization: `Bearer ${authToken}` }
  }
);
```

## Test Results

Successfully created exports for all 5 exporters:

```
✅ Export 1: Debug Coffee Exporters
   Export ID: cc05e497-17dc-4a6d-9120-874a3f419b7f
   Coffee: Sidamo Grade 2 → USA

✅ Export 2: ana
   Export ID: 7fcde04e-cb2c-486d-b18a-27a129ff5e21
   Coffee: Harar Grade 1 → Japan

✅ Export 3: Golden Beans Export PLC
   Export ID: 2a54fd26-02e1-49da-8b99-c22a664c2b34
   Coffee: Yirgacheffe Grade 1 → Italy

✅ Export 4: anaaf
   Export ID: 9f811aaa-3594-4dab-bfe0-c127c4116a6e
   Coffee: Limu Grade 2 → France

✅ Export 5: Premium Coffee Exports Ltd
   Export ID: d9cbc00e-6f7b-45c3-b130-03b6f4891e64
   Coffee: Jimma Grade 1 → Germany

Success Rate: 100% (5/5)
```

## Database Verification

Query to see all exports with their exporters:

```sql
SELECT 
  e.export_id,
  ep.business_name as exporter,
  e.coffee_type,
  e.quantity,
  e.destination_country,
  e.status
FROM exports e
JOIN exporter_profiles ep ON e.exporter_id = ep.exporter_id
ORDER BY e.created_at DESC;
```

## Use Cases

### 1. Commercial Bank Creating Exports for Multiple Exporters

The Commercial Bank (consortium member) can create exports on behalf of any approved exporter:

```javascript
// Login as Commercial Bank user
const bankToken = await loginAsCommercialBank();

// Create export for Exporter 1
await createExport(bankToken, 'exporter-id-1', exportData1);

// Create export for Exporter 2
await createExport(bankToken, 'exporter-id-2', exportData2);

// And so on...
```

### 2. Individual Exporter Creating Their Own Exports

Each exporter can create exports for themselves:

```javascript
// Login as specific exporter
const exporterToken = await loginAsExporter('exporter1');

// Create export (will auto-use their profile)
await createExport(exporterToken, null, exportData);
```

### 3. Bulk Export Creation

Create multiple exports for different exporters in one operation:

```javascript
const exporters = [
  { id: 'exporter-1', data: {...} },
  { id: 'exporter-2', data: {...} },
  { id: 'exporter-3', data: {...} }
];

for (const exp of exporters) {
  await createExport(authToken, exp.id, exp.data);
}
```

## Permissions

### Who Can Create Exports for Any Exporter?

1. **Commercial Bank Users** - Full consortium members
2. **Admin Users** - System administrators
3. **Bank Officers** - With appropriate permissions

### Who Can Only Create for Themselves?

1. **Exporter Users** - Can only create exports for their own profile
2. **Exporter Portal Users** - Limited to their own organization

## API Endpoint Details

### Create Export

```
POST /api/exports
```

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Body:**
```json
{
  "exporterId": "uuid",           // Optional - specify exporter
  "coffeeType": "string",         // Required
  "quantity": number,             // Required
  "destinationCountry": "string", // Optional
  "buyerName": "string",          // Optional
  "estimatedValue": number        // Optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "export_id": "uuid",
    "exporter_id": "uuid",
    "coffee_type": "string",
    "quantity": "decimal",
    "status": "PENDING",
    "created_at": "timestamp"
  },
  "message": "Export created successfully"
}
```

## Running the Test Script

To test creating exports for all 5 exporters:

```bash
node test-all-exporters.js
```

Expected output:
```
Total Exporters: 5
Exports Created: 5 ✅
Failed: 0 ❌
Success Rate: 100%
```

## Query Exporters

### Get All Active Exporters

```sql
SELECT exporter_id, business_name, status 
FROM exporter_profiles 
WHERE status = 'ACTIVE';
```

### Get Exports by Exporter

```sql
SELECT * FROM exports 
WHERE exporter_id = '51ae1dca-9b11-4d6b-b8cc-1004b98a47ec'
ORDER BY created_at DESC;
```

### Get Export Count per Exporter

```sql
SELECT 
  ep.business_name,
  COUNT(e.export_id) as export_count
FROM exporter_profiles ep
LEFT JOIN exports e ON ep.exporter_id = e.exporter_id
WHERE ep.status = 'ACTIVE'
GROUP BY ep.business_name
ORDER BY export_count DESC;
```

## Best Practices

### 1. Always Validate Exporter Status

Before creating an export, verify the exporter is ACTIVE:

```javascript
const exporter = await getExporterProfile(exporterId);
if (exporter.status !== 'ACTIVE') {
  throw new Error('Exporter is not active');
}
```

### 2. Use Transactions

When creating multiple exports, use database transactions:

```javascript
const client = await pool.connect();
try {
  await client.query('BEGIN');
  
  for (const exp of exports) {
    await createExport(client, exp);
  }
  
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

### 3. Log Export Creation

Always log which exporter created which export:

```javascript
logger.info('Export created', {
  exportId: export.export_id,
  exporterId: export.exporter_id,
  exporterName: exporter.business_name,
  createdBy: user.id
});
```

## Troubleshooting

### Error: "Exporter profile not found"

**Cause:** The specified `exporterId` doesn't exist or is not ACTIVE.

**Solution:**
```sql
-- Check if exporter exists
SELECT * FROM exporter_profiles WHERE exporter_id = 'your-id';

-- Check exporter status
SELECT status FROM exporter_profiles WHERE exporter_id = 'your-id';
```

### Error: "Missing required fields"

**Cause:** Required fields (`coffeeType`, `quantity`) are missing.

**Solution:** Ensure all required fields are provided:
```javascript
{
  coffeeType: "Yirgacheffe Grade 1",  // Required
  quantity: 10000                      // Required
}
```

### Error: "Permission denied"

**Cause:** User doesn't have permission to create exports for the specified exporter.

**Solution:** Use a Commercial Bank user or admin account.

## Summary

✅ **Yes, you can use all 5 approved exporters!**

- Specify `exporterId` in the request body
- System automatically links export to the correct exporter
- All 5 exporters tested and working (100% success rate)
- Exports are properly stored with correct `exporter_id` foreign key
- Database relationships maintained correctly

The system is fully functional for multi-exporter operations!
