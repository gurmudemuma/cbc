# Sales Contract Certificate Endpoint - Quick Reference

## Endpoint

```
GET /api/contracts/drafts/{draftId}/certificate
```

## Authentication

Required: Bearer token (JWT)

```
Authorization: Bearer {token}
```

## Prerequisites

1. Contract draft must exist
2. Draft status must be `FINALIZED`
3. User must be authenticated
4. Blockchain contract ID must be recorded

## Request

```bash
# cURL
curl -X GET "http://localhost:3000/api/contracts/drafts/draft-uuid-5678/certificate" \
  -H "Authorization: Bearer {token}" \
  -o sales-contract.pdf

# PowerShell
$response = Invoke-WebRequest -Uri "http://localhost:3000/api/contracts/drafts/draft-uuid-5678/certificate" `
  -Method GET `
  -Headers @{"Authorization"="Bearer $token"} `
  -OutFile "sales-contract.pdf"

# JavaScript/Node.js
const response = await fetch('http://localhost:3000/api/contracts/drafts/draft-uuid-5678/certificate', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const pdf = await response.arrayBuffer();
```

## Response

### Success (200)

**Headers:**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="sales-contract-draft-uuid-5678.pdf"
```

**Body:** Binary PDF data

### Error Responses

**Draft not found (404)**
```json
{
  "error": "Draft not found"
}
```

**Draft not finalized (400)**
```json
{
  "error": "Certificate can only be generated for finalized contracts"
}
```

**Unauthorized (401)**
```json
{
  "error": "Unauthorized"
}
```

**Server error (500)**
```json
{
  "error": "Certificate generation error: {details}"
}
```

## Certificate Contents

The generated PDF includes:

### Header Section
- Title: "SALES CONTRACT CERTIFICATE"
- Subtitle: "Official Record of Coffee Export Sales Agreement"
- Certificate Number: `CERT-{contractId}`
- Issue Date: Current date
- Status: "FINALIZED & BINDING"

### Two-Column Layout

**Left Column:**
- Exporter Information
  - ID
  - Name
  - TIN
  - Country (Ethiopia)

**Right Column:**
- Buyer Information
  - ID
  - Company Name
  - Country
  - Tax ID

### Contract Terms Section
- Coffee Type
- Origin Region
- Quantity (in 60kg bags)
- Unit Price
- Total Value
- Quality Grade

### Payment & Delivery Terms
- Payment Terms
- Payment Method
- Incoterms
- Delivery Date
- Port of Loading
- Port of Discharge

### Legal Framework
- Governing Law
- Arbitration Location
- Arbitration Rules
- Contract Language

### Special Conditions
- Special Conditions (if any)
- Required Certifications (if any)

### Blockchain Verification
- Contract ID
- Blockchain: Hyperledger Fabric
- Network: Coffee Export Channel
- Immutable Record: Yes

### QR Code
- Encodes contract details for verification
- Scannable for quick verification
- Positioned in bottom right

### Footer
- Legal disclaimer
- Generation timestamp

## Data Mapping

The certificate pulls data from multiple sources:

```
From contract_drafts table:
- draft_id → Certificate Number
- finalized_contract_id → Blockchain Contract ID
- coffee_type → Coffee Type
- origin_region → Origin Region
- quantity → Quantity
- unit_price → Unit Price
- currency → Currency
- total_value → Total Value
- quality_grade → Quality Grade
- payment_terms → Payment Terms
- payment_method → Payment Method
- incoterms → Incoterms
- delivery_date → Delivery Date
- port_of_loading → Port of Loading
- port_of_discharge → Port of Discharge
- governing_law → Governing Law
- arbitration_location → Arbitration Location
- arbitration_rules → Arbitration Rules
- contract_language → Contract Language
- special_conditions → Special Conditions
- certifications_required → Required Certifications
- updated_at → Issue Date

From exporter_profiles table (via JOIN):
- company_name → Exporter Name
- tin → Exporter TIN

From buyer_registry table (via JOIN):
- company_name → Buyer Company Name
- country → Buyer Country
- tax_id → Buyer Tax ID
```

## Workflow Integration

### Complete Flow

```
1. Create Draft
   POST /api/contracts/drafts
   → Status: DRAFT

2. Negotiate (optional)
   POST /api/contracts/drafts/{id}/counter
   → Status: COUNTERED

3. Accept
   POST /api/contracts/drafts/{id}/accept
   → Status: ACCEPTED

4. Finalize
   POST /api/contracts/drafts/{id}/finalize
   → Status: FINALIZED
   → Blockchain Contract ID recorded

5. Generate Certificate
   GET /api/contracts/drafts/{id}/certificate
   → PDF downloaded
```

## Usage Examples

### Example 1: Download Certificate After Finalization

```powershell
# Login
$login = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"username":"Ella","password":"password123"}' `
  -UseBasicParsing

$token = ($login.Content | ConvertFrom-Json).token

# Create and finalize contract (steps 1-4 above)
# ...

# Download certificate
Invoke-WebRequest -Uri "http://localhost:3000/api/contracts/drafts/draft-uuid-5678/certificate" `
  -Method GET `
  -Headers @{"Authorization"="Bearer $token"} `
  -OutFile "contract-certificate.pdf"

Write-Host "Certificate saved to contract-certificate.pdf"
```

### Example 2: Verify Certificate Generation

```javascript
async function downloadCertificate(draftId, token) {
  try {
    const response = await fetch(
      `http://localhost:3000/api/contracts/drafts/${draftId}/certificate`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-contract-${draftId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    
    console.log('Certificate downloaded successfully');
  } catch (error) {
    console.error('Certificate download failed:', error);
  }
}
```

## Performance Considerations

- Certificate generation takes ~2-3 seconds
- PDF size: ~150-200 KB
- QR code generation is included in response time
- No caching (fresh certificate generated each time)

## Security Notes

- Requires authentication
- Only accessible to authenticated users
- No authorization check (any authenticated user can download)
- Consider adding role-based access control if needed
- PDF contains sensitive contract information

## Troubleshooting

### "Certificate can only be generated for finalized contracts"
- Ensure you called the finalize endpoint first
- Check draft status is `FINALIZED`
- Verify blockchain contract ID was recorded

### "Draft not found"
- Verify draft ID is correct
- Check draft exists in database
- Ensure you're using the correct draft ID

### PDF Download Fails
- Check network connectivity
- Verify token is valid
- Check server logs for errors
- Ensure pdfkit and qrcode packages are installed

### QR Code Not Appearing
- Check browser console for errors
- Verify qrcode package is installed
- Check server logs for QR generation errors

## Related Endpoints

- `POST /api/contracts/drafts` - Create draft
- `POST /api/contracts/drafts/{id}/accept` - Accept draft
- `POST /api/contracts/drafts/{id}/finalize` - Finalize to blockchain
- `GET /api/contracts/drafts/{id}` - Get draft details
- `GET /api/contracts/drafts/{id}/history` - View negotiation history
