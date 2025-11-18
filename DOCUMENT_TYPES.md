# Coffee Export Blockchain - Document Types Reference

## Overview
This document provides a comprehensive reference of all document types that can be uploaded to IPFS by each organization in the coffee export workflow.

---

## 1. Exporter Portal Documents

### **Storage Location**
- Not stored in chaincode `Document` array
- Uploaded to IPFS and referenced in initial export request
- May be attached to create export transaction as metadata

### **Required Documents**
| Document Type | Description | Format | When to Upload |
|--------------|-------------|--------|----------------|
| Export Contract | Sales agreement with foreign buyer | PDF | At export creation |
| Purchase Order | Buyer's official order document | PDF | At export creation |
| Business License | Valid exporter business license | PDF | At export creation |
| Bank Statement | Proof of financial standing | PDF | Optional |

### **Document Naming Convention**
```
EXPORT-CONTRACT-{exportId}-{timestamp}.pdf
EXPORT-PO-{exportId}-{timestamp}.pdf
EXPORT-LICENSE-{exporterBankId}-{timestamp}.pdf
```

---

## 2. National Bank Documents

### **Storage Location**
- Chaincode field: `fxDocuments[]`
- CID parameter: `fxApprovalID` in `ApproveFX()`

### **Required Documents**
| Document Type | Description | Format | When to Upload |
|--------------|-------------|--------|----------------|
| **FX Approval Letter** | Official foreign exchange authorization | PDF | Required for approval |
| **Bank Guarantee** | Payment guarantee for the transaction | PDF | Required for approval |
| **Foreign Contract** | Export sales contract (verified copy) | PDF | Required for approval |
| **Proforma Invoice** | Commercial invoice with pricing details | PDF | Required for approval |
| **Tax Clearance Certificate** | Proof of tax compliance | PDF | Required for approval |

### **Optional Documents**
- Bank statements
- Credit facility letters
- Previous export history

### **Document Naming Convention**
```
NBE-FX-APPROVAL-{exportId}-{timestamp}.pdf
NBE-GUARANTEE-{exportId}-{timestamp}.pdf
NBE-CONTRACT-{exportId}-{timestamp}.pdf
NBE-INVOICE-{exportId}-{timestamp}.pdf
NBE-TAX-{exportId}-{timestamp}.pdf
```

### **Document Structure (On-Chain)**
```json
{
  "cid": "QmXxx...abc",
  "version": 1,
  "timestamp": "2024-01-15T10:30:00Z",
  "isActive": true
}
```

---

## 3. ECTA Documents (Quality Certification)

### **Storage Location**
- Chaincode field: `qualityDocuments[]`
- CID parameter: `qualityCertID` in `IssueQualityCertificate()`

### **Required Documents**
| Document Type | Description | Format | When to Upload |
|--------------|-------------|--------|----------------|
| **Quality Inspection Report** | Comprehensive lab test results | PDF | Required for certification |
| **Quality Certificate** | Official certificate with assigned grade | PDF | Required for certification |
| **Cupping Score Report** | Sensory evaluation (taste, aroma, body) | PDF | Required for Grade 1/2 |
| **Moisture Content Test** | Moisture level analysis (target: 11-12%) | PDF | Required for certification |
| **Defect Analysis Report** | Count and classification of defects | PDF | Required for certification |

### **Optional Documents**
- Sample photos (raw beans, roasted samples)
- Chemical composition tests
- Contamination screening results (pesticides, mycotoxins)
- Bean size distribution analysis
- Color analysis reports

### **Quality Grades**
- **Grade 1** (Specialty): 0-3 defects per 300g
- **Grade 2** (Premium): 4-12 defects per 300g
- **Grade 3** (Exchange): 13-25 defects per 300g
- **Grade 4** (Standard): 26-45 defects per 300g
- **Grade 5** (Off-grade): 46-90 defects per 300g

### **Document Naming Convention**
```
ECTA-QUALITY-CERT-{exportId}-{grade}-{timestamp}.pdf
ECTA-INSPECTION-{exportId}-{timestamp}.pdf
ECTA-CUPPING-{exportId}-{score}-{timestamp}.pdf
ECTA-MOISTURE-{exportId}-{percentage}-{timestamp}.pdf
ECTA-DEFECT-{exportId}-{timestamp}.pdf
ECTA-SAMPLE-{exportId}-{sampleNumber}-{timestamp}.jpg
```

### **Document Structure (On-Chain)**
```json
{
  "cid": "QmYyy...def",
  "version": 1,
  "timestamp": "2024-01-16T14:20:00Z",
  "isActive": true
}
```

---

## 4. Shipping Line Documents

### **Storage Location**
- Chaincode field: `shipmentDocuments[]`
- CID parameter: `shipmentID` in `ScheduleShipment()`

### **Required Documents**
| Document Type | Description | Format | When to Upload |
|--------------|-------------|--------|----------------|
| **Bill of Lading (BL)** | Primary shipping doc proving ownership | PDF | Required at scheduling |
| **Packing List** | Detailed list of all packages/containers | PDF | Required at scheduling |
| **Container Seal Certificate** | Proof of sealed container integrity | PDF | Required at scheduling |
| **Weight Certificate** | Official verified weight at loading | PDF | Required at scheduling |

### **Optional Documents**
- Loading photos (visual evidence of cargo)
- Temperature logs (for refrigerated containers)
- Vessel/flight schedule documents
- Marine insurance certificate
- Stowage plan
- Container inspection report
- Fumigation certificate (if applicable)

### **Transport Modes**
- **SEA**: Ocean freight (most common for coffee)
- **AIR**: Air freight (for specialty/urgent shipments)
- **RAIL**: Rail transport (for regional destinations)

### **Document Naming Convention**
```
SHIP-BOL-{exportId}-{vesselName}-{voyageNumber}-{timestamp}.pdf
SHIP-PACKING-{exportId}-{containerNumber}-{timestamp}.pdf
SHIP-SEAL-{exportId}-{sealNumber}-{timestamp}.pdf
SHIP-WEIGHT-{exportId}-{containerNumber}-{timestamp}.pdf
SHIP-LOADING-{exportId}-{containerNumber}-{timestamp}.jpg
SHIP-TEMP-LOG-{exportId}-{containerNumber}-{timestamp}.pdf
SHIP-INSURANCE-{exportId}-{policyNumber}-{timestamp}.pdf
```

### **Document Structure (On-Chain)**
```json
{
  "cid": "QmZzz...ghi",
  "version": 1,
  "timestamp": "2024-01-18T09:15:00Z",
  "isActive": true
}
```

---

## 5. Custom Authorities Documents

### **Storage Location**
- Chaincode field: `customsDocuments[]`
- CID parameter: `clearanceID` in `IssueCustomsClearance()`

### **Required Documents**
| Document Type | Description | Format | When to Upload |
|--------------|-------------|--------|----------------|
| **Customs Declaration Form** | Official customs entry/exit declaration | PDF | Required for clearance |
| **Customs Clearance Certificate** | Official approval document | PDF | Required for clearance |
| **Physical Inspection Report** | Results of customs physical inspection | PDF | Required for clearance |
| **Duty Payment Receipt** | Proof of all customs duties paid | PDF | Required for clearance |
| **Certificate of Origin** | Official Ethiopian origin certificate | PDF | Required for clearance |

### **Optional Documents**
- Phytosanitary certificate (plant health certificate)
- Import/export license (destination country)
- Cargo release order
- X-ray or scanner inspection reports
- Valuation determination document
- Tariff classification document

### **Document Naming Convention**
```
CUSTOMS-CLEARANCE-{exportId}-{portName}-{timestamp}.pdf
CUSTOMS-DECLARATION-{exportId}-{declarationNumber}-{timestamp}.pdf
CUSTOMS-INSPECTION-{exportId}-{inspectorId}-{timestamp}.pdf
CUSTOMS-DUTY-RECEIPT-{exportId}-{receiptNumber}-{timestamp}.pdf
CUSTOMS-ORIGIN-{exportId}-{certificateNumber}-{timestamp}.pdf
CUSTOMS-PHYTO-{exportId}-{certificateNumber}-{timestamp}.pdf
CUSTOMS-RELEASE-{exportId}-{timestamp}.pdf
```

### **Document Structure (On-Chain)**
```json
{
  "cid": "QmAAA...jkl",
  "version": 1,
  "timestamp": "2024-01-20T16:45:00Z",
  "isActive": true
}
```

---

## IPFS Document Upload Technical Specification

### **Upload Process**
1. User selects file(s) via frontend upload component
2. File(s) sent to organization's API endpoint (e.g., `/api/exports/{id}/documents`)
3. API validates file type, size, and user permissions
4. File uploaded to IPFS daemon (running on port 5001)
5. IPFS returns CID (Content Identifier)
6. CID submitted to chaincode transaction with document metadata
7. Transaction recorded on blockchain with versioning

### **File Constraints**
```javascript
{
  "maxFileSize": "10MB",
  "allowedFormats": [".pdf", ".jpg", ".jpeg", ".png"],
  "maxFilesPerUpload": 5,
  "maxVersionsPerDocument": 10
}
```

### **IPFS CID Format**
```
CID v1: QmXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx
Length: 46 characters
Base58 encoded multihash
```

### **Document Versioning**
Each subsequent upload of the same document type creates a new version:
```json
[
  {
    "cid": "QmFirst...",
    "version": 1,
    "timestamp": "2024-01-15T10:00:00Z",
    "isActive": false  // Superseded by v2
  },
  {
    "cid": "QmSecond...",
    "version": 2,
    "timestamp": "2024-01-16T11:30:00Z",
    "isActive": true   // Current version
  }
]
```

### **Document Retrieval**
```bash
# Get document from IPFS
curl http://localhost:5001/api/v0/cat?arg=QmXxXxXx... -o document.pdf

# Get document via public gateway (if configured)
https://ipfs.io/ipfs/QmXxXxXx...
```

---

## Document Validation Rules

### **By Organization**

#### National Bank
- Must upload at least 1 FX document to approve
- FX approval letter is mandatory
- All documents must be dated within last 90 days

#### ECTA
- Quality certificate must include grade assignment
- Inspection report must be signed by certified inspector
- Sample must match the export lot number

#### Shipping Line
- Bill of Lading is mandatory
- Container seal number must match physical seal
- Weight certificate must be from certified weighbridge

#### Custom Authorities
- Clearance certificate requires inspector signature
- All duties must be paid before issuing clearance
- Origin certificate must be issued by authorized body

---

## Document Audit Trail

Every document action is recorded on-chain:

```json
{
  "exportId": "EXP-2024-001",
  "action": "DOCUMENT_UPLOADED",
  "documentType": "QUALITY_CERTIFICATE",
  "cid": "QmXxXxXx...",
  "version": 2,
  "uploadedBy": "ncat-inspector-001",
  "organization": "ECTAMSP",
  "timestamp": "2024-01-16T14:20:00Z",
  "txId": "abc123def456..."
}
```

---

## Security & Compliance

### **Access Control**
- Only the owning organization can upload documents to their specific fields
- All organizations can **read** all documents for transparency
- Document deletion is not allowed (immutability)
- Documents can be marked inactive (soft delete)

### **Data Privacy**
- Sensitive financial data should be encrypted before IPFS upload
- Personal information must comply with data protection regulations
- Consider private IPFS network for highly sensitive documents

### **Compliance Requirements**
- All documents must meet Ethiopian Coffee & Tea Authority standards
- International shipping documents must comply with INCOTERMS
- Customs documents must meet WCO (World Customs Organization) standards

---

## Implementation Examples

### **Frontend Upload Component**
```javascript
// Document upload for ECTA
const uploadQualityDocument = async (exportId, file) => {
  const formData = new FormData();
  formData.append('document', file);
  formData.append('documentType', 'QUALITY_CERTIFICATE');
  
  const response = await fetch(`/api/quality/${exportId}/documents`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  const { cid, txId } = await response.json();
  return { cid, txId };
};
```

### **Backend API Endpoint**
```typescript
// api/ncat/src/routes/quality.routes.ts
router.post('/quality/:exportId/documents', 
  authenticate,
  upload.single('document'),
  async (req, res) => {
    const { exportId } = req.params;
    const file = req.file;
    
    // Upload to IPFS
    const cid = await ipfsService.uploadFile(file);
    
    // Submit to chaincode (handled during certificate issuance)
    // Store CID temporarily in database
    await db.storeDocument({
      exportId,
      cid,
      documentType: req.body.documentType,
      uploadedBy: req.user.username
    });
    
    res.json({ success: true, cid });
  }
);
```

---

## Future Enhancements

1. **OCR Integration**: Automatic data extraction from uploaded PDFs
2. **Digital Signatures**: Cryptographic signing of certificates
3. **Blockchain Timestamping**: Notarization of documents
4. **Multi-language Support**: Documents in Amharic, English, Arabic
5. **Mobile Document Capture**: Upload via mobile camera
6. **Document Templates**: Standardized forms for each organization
7. **Automated Validation**: AI-powered document verification
8. **Smart Expiry Alerts**: Notifications for expiring certificates

---

## Support & Documentation

For questions about document requirements:
- **National Bank FX**: Contact Trade Finance Department
- **ECTA Quality**: Contact Laboratory Services Division
- **Shipping**: Contact your designated shipping line
- **Customs**: Contact Ethiopian Customs Commission

Technical support for IPFS/blockchain issues:
- System Administrator: admin@coffee-blockchain.et
- Developer Documentation: `/docs/api`
- IPFS Status: `http://localhost:5001/webui`
