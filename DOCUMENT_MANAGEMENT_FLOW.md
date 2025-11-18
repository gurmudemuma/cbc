# 📄 Document Management Flow - Complete Analysis

## 🎯 Overview

Your Coffee Export Management system uses **IPFS (InterPlanetary File System)** for decentralized document storage, with document CIDs (Content Identifiers) stored on the blockchain.

---

## 🔄 Complete Document Flow

### **Architecture Pattern: Hybrid Storage**

```
┌─────────────┐
│   Client    │
│  (Upload)   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│         API Layer (Express)             │
│  ┌──────────────────────────────────┐  │
│  │  Multer Middleware (File Upload) │  │
│  │  - Validates file type           │  │
│  │  - Checks file size              │  │
│  │  - Sanitizes filename            │  │
│  └──────────┬───────────────────────┘  │
└─────────────┼───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│      IPFS Service (ipfs.service.ts)     │
│  ┌──────────────────────────────────┐  │
│  │  1. Upload file to IPFS          │  │
│  │  2. Get CID (Content ID)         │  │
│  │  3. Pin file (persistence)       │  │
│  │  4. Create metadata              │  │
│  └──────────┬───────────────────────┘  │
└─────────────┼───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│   Blockchain (Hyperledger Fabric)       │
│  ┌──────────────────────────────────┐  │
│  │  Store Document CID + Metadata   │  │
│  │  - CID (IPFS hash)               │  │
│  │  - Version number                │  │
│  │  - Timestamp                     │  │
│  │  - Active status                 │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## 📊 Document Storage Structure

### **1. IPFS Layer (Decentralized Storage)**

**Location:** `/home/gu-da/cbc/api/shared/ipfs.service.ts`

**Capabilities:**
```typescript
class IPFSService {
  // Upload methods
  uploadFile(filePath: string): Promise<UploadResult>
  uploadBuffer(buffer: Buffer, fileName: string): Promise<UploadResult>
  uploadJSON(data: any, fileName: string): Promise<UploadResult>
  
  // Retrieval methods
  getFile(hash: string): Promise<Buffer>
  getFileUrl(hash: string): string
  
  // Persistence methods
  pinFile(hash: string): Promise<boolean>
  unpinFile(hash: string): Promise<boolean>
  
  // Export-specific
  uploadExportDocument(
    exportId: string,
    documentType: string,
    filePath: string,
    uploadedBy: string
  ): Promise<DocumentMetadata>
}
```

**Upload Result:**
```typescript
interface UploadResult {
  hash: string;      // IPFS CID (e.g., "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG")
  path: string;      // File path in IPFS
  size: number;      // File size in bytes
  url: string;       // Gateway URL for access
}
```

**Document Metadata:**
```typescript
interface DocumentMetadata {
  exportId: string;
  documentType: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: string;
  ipfsHash: string;  // The CID
}
```

---

### **2. Blockchain Layer (Immutable Record)**

**Location:** `/home/gu-da/cbc/chaincode/coffee-export/contract.go`

**Document Structure:**
```go
type Document struct {
    CID       string `json:"cid"`        // IPFS Content ID
    Version   int    `json:"version"`    // Document version number
    Timestamp string `json:"timestamp"`  // When added to blockchain
    IsActive  bool   `json:"isActive"`   // Whether document is current
}
```

**Document Arrays in ExportRequest:**
```go
type ExportRequest struct {
    // ... other fields ...
    
    // Quality documents
    QualityDocuments []Document `json:"qualityDocuments,omitempty"`
    
    // Origin certificate documents
    OriginCertificateDocuments []Document `json:"originCertDocuments,omitempty"`
    
    // FX approval documents
    FXDocuments []Document `json:"fxDocuments,omitempty"`
    
    // Export customs documents
    ExportCustomsDocuments []Document `json:"exportCustomsDocuments,omitempty"`
    
    // Shipment documents
    ShipmentDocuments []Document `json:"shipmentDocuments,omitempty"`
    
    // Import customs documents
    ImportCustomsDocuments []Document `json:"importCustomsDocuments,omitempty"`
}
```

---

## 🔄 Document Lifecycle

### **Phase 1: Upload & Storage**

#### **Step 1: Client Upload**
```typescript
// Frontend sends file via multipart/form-data
const formData = new FormData();
formData.append('document', file);
formData.append('documentType', 'quality_certificate');
formData.append('exportId', 'EXP-123');

await fetch('/api/documents/upload', {
  method: 'POST',
  body: formData,
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

#### **Step 2: API Receives & Validates**
```typescript
// Multer middleware processes upload
app.post('/documents/upload', 
  authMiddleware,
  upload.single('document'),  // Multer middleware
  async (req, res) => {
    // File is now in req.file
    const { exportId, documentType } = req.body;
    const file = req.file;
    
    // Validate file
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Process...
  }
);
```

#### **Step 3: Upload to IPFS**
```typescript
// api/shared/ipfs.service.ts
const ipfsService = getIPFSService();

// Upload file
const result = await ipfsService.uploadFile(file.path);
// Returns: { hash: "QmXxx...", path: "...", size: 12345, url: "https://..." }

// Pin file for persistence
await ipfsService.pinFile(result.hash);

// Upload metadata
const metadata = {
  exportId,
  documentType,
  fileName: file.originalname,
  fileSize: file.size,
  mimeType: file.mimetype,
  uploadedBy: req.user.username,
  uploadedAt: new Date().toISOString(),
  ipfsHash: result.hash
};

await ipfsService.uploadJSON(metadata, `${exportId}_${documentType}_metadata.json`);
```

#### **Step 4: Store CID on Blockchain**
```typescript
// Submit transaction to chaincode
const contract = gateway.getExportContract();

await contract.submitTransaction(
  'IssueQualityCertificate',
  exportId,
  qualityCertID,
  qualityGrade,
  certifiedBy,
  result.hash  // IPFS CID
);
```

#### **Step 5: Chaincode Stores Document**
```go
// chaincode/coffee-export/contract.go
func (c *CoffeeExportContractV2) IssueQualityCertificate(
    ctx contractapi.TransactionContextInterface,
    exportID string,
    qualityCertID string,
    qualityGrade string,
    certifiedBy string,
) error {
    // ... validation ...
    
    now := time.Now().UTC().Format(time.RFC3339)
    exportRequest.Status = StatusQualityCertified
    
    // Add document to array
    exportRequest.QualityDocuments = append(
        exportRequest.QualityDocuments,
        Document{
            CID:       qualityCertID,  // IPFS hash
            Version:   len(exportRequest.QualityDocuments) + 1,
            Timestamp: now,
            IsActive:  true,
        },
    )
    
    // Save to ledger
    return c.updateExportRequest(ctx, exportRequest)
}
```

---

### **Phase 2: Retrieval & Access**

#### **Step 1: Get Document CIDs from Blockchain**
```typescript
// Query blockchain for export
const contract = gateway.getExportContract();
const result = await contract.evaluateTransaction('GetExportRequest', exportId);
const exportData = JSON.parse(result.toString());

// Extract document CIDs
const qualityDocs = exportData.qualityDocuments;
// [{ cid: "QmXxx...", version: 1, timestamp: "...", isActive: true }]
```

#### **Step 2: Retrieve from IPFS**
```typescript
// Get file from IPFS using CID
const ipfsService = getIPFSService();

for (const doc of qualityDocs) {
  if (doc.isActive) {
    // Method 1: Get file buffer
    const fileBuffer = await ipfsService.getFile(doc.cid);
    
    // Method 2: Get gateway URL
    const url = ipfsService.getFileUrl(doc.cid);
    // Returns: "https://ipfs.io/ipfs/QmXxx..."
  }
}
```

#### **Step 3: Serve to Client**
```typescript
// API endpoint to download document
app.get('/documents/:cid', authMiddleware, async (req, res) => {
  const { cid } = req.params;
  
  try {
    // Get file from IPFS
    const fileBuffer = await ipfsService.getFile(cid);
    
    // Set headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${cid}.pdf"`);
    
    // Send file
    res.send(fileBuffer);
  } catch (error) {
    res.status(404).json({ error: 'Document not found' });
  }
});
```

---

## 📋 Document Types & Workflow

### **1. Quality Certification Documents**

**When:** After quality inspection  
**Who:** ECTA Inspector  
**Stored in:** `exportRequest.QualityDocuments[]`

```typescript
// Upload quality certificate
POST /api/quality/:exportId/certify
{
  "qualityGrade": "Grade A",
  "certifiedBy": "John Inspector",
  "documentCIDs": ["QmQuality123..."]  // Already uploaded to IPFS
}
```

**Chaincode:**
```go
exportRequest.QualityDocuments = append(
    exportRequest.QualityDocuments,
    Document{
        CID:       qualityCertID,
        Version:   1,
        Timestamp: now,
        IsActive:  true,
    },
)
```

---

### **2. Origin Certificate Documents**

**When:** With quality certification  
**Who:** ECTA  
**Stored in:** `exportRequest.OriginCertificateDocuments[]`

```go
exportRequest.OriginCertificateDocuments = append(
    exportRequest.OriginCertificateDocuments,
    Document{
        CID:       certificateCID,
        Version:   1,
        Timestamp: now,
        IsActive:  true,
    },
)
```

---

### **3. FX Approval Documents**

**When:** Foreign exchange approval  
**Who:** National Bank  
**Stored in:** `exportRequest.FXDocuments[]`

```go
exportRequest.FXDocuments = append(
    exportRequest.FXDocuments,
    Document{
        CID:       fxApprovalID,
        Version:   1,
        Timestamp: now,
        IsActive:  true,
    },
)
```

---

### **4. Export Customs Documents**

**When:** Customs clearance for export  
**Who:** Custom Authorities  
**Stored in:** `exportRequest.ExportCustomsDocuments[]`

```go
exportRequest.ExportCustomsDocuments = append(
    exportRequest.ExportCustomsDocuments,
    Document{
        CID:       clearanceCID,
        Version:   1,
        Timestamp: now,
        IsActive:  true,
    },
)
```

---

### **5. Shipment Documents**

**When:** Shipment scheduled  
**Who:** Shipping Line  
**Stored in:** `exportRequest.ShipmentDocuments[]`

```go
exportRequest.ShipmentDocuments = append(
    exportRequest.ShipmentDocuments,
    Document{
        CID:       shipmentID,
        Version:   1,
        Timestamp: now,
        IsActive:  true,
    },
)
```

---

### **6. Import Customs Documents**

**When:** Import customs clearance  
**Who:** Destination Custom Authorities  
**Stored in:** `exportRequest.ImportCustomsDocuments[]`

```go
exportRequest.ImportCustomsDocuments = append(
    exportRequest.ImportCustomsDocuments,
    Document{
        CID:       clearanceCID,
        Version:   1,
        Timestamp: now,
        IsActive:  true,
    },
)
```

---

## 🔒 Security & Validation

### **File Upload Security**

**Implemented in:** `api/shared/security.best-practices.ts`

```typescript
// File type validation
const allowedMimeTypes = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

// File size limits
const maxFileSize = 10 * 1024 * 1024; // 10MB

// Filename sanitization
const sanitizeFilename = (filename: string) => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .substring(0, 255);
};
```

### **Validation Schema**

**Location:** `api/shared/validation.schemas.ts`

```typescript
// Document CID validation
const documentCIDSchema = z.string()
  .regex(/^Qm[a-zA-Z0-9]{44}$/, 'Invalid IPFS CID format');

// Document array validation
const documentCIDsSchema = z.array(documentCIDSchema).optional();
```

---

## 🎯 Document Versioning

### **How Versioning Works:**

```go
type Document struct {
    CID       string // New CID for each version
    Version   int    // Incremental version number
    Timestamp string // When this version was added
    IsActive  bool   // Only latest version is active
}
```

### **Adding New Version:**

```go
// Deactivate old versions
for i := range exportRequest.QualityDocuments {
    exportRequest.QualityDocuments[i].IsActive = false
}

// Add new version
exportRequest.QualityDocuments = append(
    exportRequest.QualityDocuments,
    Document{
        CID:       newCID,
        Version:   len(exportRequest.QualityDocuments) + 1,
        Timestamp: now,
        IsActive:  true,  // Only this one is active
    },
)
```

---

## 📈 Document Retrieval Patterns

### **Pattern 1: Get Active Documents Only**

```typescript
const activeDocuments = exportData.qualityDocuments.filter(doc => doc.isActive);
```

### **Pattern 2: Get All Versions (History)**

```typescript
const allVersions = exportData.qualityDocuments.sort((a, b) => a.version - b.version);
```

### **Pattern 3: Get Latest Version**

```typescript
const latestDoc = exportData.qualityDocuments
  .filter(doc => doc.isActive)[0];
```

---

## 🔄 Complete Example Flow

### **Scenario: Quality Certificate Upload**

```typescript
// 1. Frontend uploads file
const formData = new FormData();
formData.append('document', certificateFile);
formData.append('exportId', 'EXP-123');

const response = await fetch('/api/documents/upload', {
  method: 'POST',
  body: formData
});

const { ipfsHash } = await response.json();
// ipfsHash: "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG"

// 2. Submit quality approval with IPFS CID
await fetch('/api/quality/EXP-123/certify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    qualityGrade: 'Grade A',
    certifiedBy: 'John Inspector',
    documentCIDs: [ipfsHash]  // Reference to IPFS document
  })
});

// 3. Later: Retrieve document
const exportData = await fetch('/api/exports/EXP-123').then(r => r.json());
const qualityDoc = exportData.qualityDocuments.find(d => d.isActive);

// 4. Download from IPFS
const documentUrl = `https://ipfs.io/ipfs/${qualityDoc.cid}`;
// Or via API
const fileBlob = await fetch(`/api/documents/${qualityDoc.cid}`).then(r => r.blob());
```

---

## 🎓 Key Benefits

### **1. Decentralization**
- ✅ Documents stored on IPFS (distributed)
- ✅ No single point of failure
- ✅ Content-addressable (CID is hash of content)

### **2. Immutability**
- ✅ CIDs stored on blockchain
- ✅ Cannot modify without changing CID
- ✅ Complete audit trail

### **3. Efficiency**
- ✅ Only CIDs on blockchain (small data)
- ✅ Large files on IPFS (off-chain)
- ✅ Reduced blockchain storage costs

### **4. Verification**
- ✅ CID verifies content integrity
- ✅ Blockchain verifies CID authenticity
- ✅ Tamper-proof document trail

### **5. Versioning**
- ✅ All versions preserved
- ✅ Easy to track changes
- ✅ Audit-friendly

---

## 🛠️ Configuration

### **IPFS Configuration**

**Location:** `.env` files

```env
# IPFS Node Connection
IPFS_HOST=localhost
IPFS_PORT=5001
IPFS_PROTOCOL=http

# IPFS Gateway for public access
IPFS_GATEWAY=https://ipfs.io
```

### **Starting IPFS**

```bash
# Initialize IPFS (first time only)
ipfs init

# Start IPFS daemon
ipfs daemon

# Verify IPFS is running
ipfs id
```

---

## 📊 Document Flow Summary

```
Upload Flow:
Client → API (Multer) → IPFS Service → IPFS Node → Get CID → Blockchain

Retrieval Flow:
Client → API → Blockchain (get CID) → IPFS Service → IPFS Node → File

Storage:
- Documents: IPFS (decentralized, content-addressed)
- CIDs: Blockchain (immutable, verified)
- Metadata: Both (IPFS for details, blockchain for proof)
```

---

## ✅ Best Practices Implemented

1. ✅ **Hybrid Storage** - Large files off-chain, CIDs on-chain
2. ✅ **Content Addressing** - Files identified by content hash
3. ✅ **Pinning** - Files persisted on IPFS
4. ✅ **Versioning** - All document versions tracked
5. ✅ **Metadata** - Rich metadata stored alongside
6. ✅ **Security** - File validation, sanitization
7. ✅ **Immutability** - Blockchain + IPFS = tamper-proof
8. ✅ **Audit Trail** - Complete document history

---

**Generated:** October 30, 2025  
**Status:** ✅ COMPLETE  
**Document Management:** Fully Analyzed
