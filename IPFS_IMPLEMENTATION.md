# IPFS Implementation Guide

## Overview

IPFS (InterPlanetary File System) has been implemented to handle decentralized document storage for the Coffee Export Blockchain system. This enables secure, immutable storage of certificates, licenses, and other critical documents.

## What Was Implemented

### 1. IPFS Service (`/api/shared/ipfs.service.ts`)

A complete IPFS service layer that provides:

**Core Features:**
- ✅ File upload to IPFS
- ✅ File retrieval from IPFS
- ✅ File pinning (persistence)
- ✅ File unpinning
- ✅ File information retrieval
- ✅ IPFS node health checks
- ✅ Repository statistics
- ✅ Garbage collection

**API Methods:**

```typescript
// Upload operations
uploadBuffer(fileBuffer: Buffer, fileName: string): Promise<IPFSUploadResult>
uploadFile(filePath: string): Promise<IPFSUploadResult>

// Retrieval operations
getFile(hash: string): Promise<Buffer>
getFileInfo(hash: string): Promise<IPFSFileInfo>

// Persistence operations
pinFile(hash: string): Promise<void>
unpinFile(hash: string): Promise<void>

// Utility operations
getFileUrl(hash: string): string
getLocalUrl(hash: string): string
checkHealth(): Promise<boolean>
getNodeInfo(): Promise<any>
listPinnedFiles(): Promise<string[]>
getRepoStats(): Promise<any>
garbageCollect(): Promise<any>
```

### 2. IPFS Document Service (`/api/shared/services/ipfs-document.service.ts`)

Enhanced service for managing pre-registration documents with IPFS integration:

**Document Types Supported:**
- Capital proof documents
- Business registration documents
- Laboratory certificates
- Taster qualification documents
- Competence certificates
- Export licenses
- Inspection reports

**Features:**
- Document upload with IPFS storage
- Metadata tracking in PostgreSQL
- Document validation (format & size)
- Soft delete capability
- Entity-based document retrieval

### 3. Docker Compose Integration

IPFS node added to `docker-compose.postgres.yml`:

```yaml
ipfs:
  container_name: ipfs
  image: ipfs/kubo:latest
  ports:
    - "4001:4001"           # P2P communication
    - "4001:4001/udp"       # P2P UDP
    - "127.0.0.1:5001:5001" # API endpoint
    - "127.0.0.1:8080:8080" # Gateway
  volumes:
    - ipfs-data:/data/ipfs
  environment:
    - IPFS_PROFILE=server
```

## How It Works

### Document Upload Flow

```
1. User uploads document via API
   ↓
2. Document validated (format, size)
   ↓
3. File uploaded to IPFS
   ↓
4. IPFS returns content hash
   ↓
5. File pinned for persistence
   ↓
6. Metadata stored in PostgreSQL
   ↓
7. IPFS hash returned to user
```

### Document Retrieval Flow

```
1. User requests document by ID
   ↓
2. Metadata retrieved from PostgreSQL
   ↓
3. IPFS hash extracted
   ↓
4. File retrieved from IPFS
   ↓
5. File returned to user
```

## Configuration

### Environment Variables

Add to `.env` files:

```bash
# IPFS Configuration
IPFS_HOST=localhost          # or 'ipfs' in Docker
IPFS_PORT=5001
IPFS_PROTOCOL=http
IPFS_GATEWAY=https://ipfs.io # Public gateway fallback
```

### Docker Compose Setup

All API services now include IPFS configuration:

```yaml
environment:
  - IPFS_HOST=ipfs
  - IPFS_PORT=5001
  - IPFS_PROTOCOL=http
depends_on:
  ipfs:
    condition: service_healthy
```

## Usage Examples

### Upload a Document

```typescript
import { getIPFSDocumentService } from '../services/ipfs-document.service';

const service = getIPFSDocumentService();

const result = await service.uploadBusinessRegistrationDocument(
  exporterId,
  fileBuffer,
  'business-registration.pdf',
  userId
);

console.log('Document uploaded:', result.ipfsHash);
```

### Retrieve a Document

```typescript
const documents = await service.getEntityDocuments(
  exporterId,
  'exporter_profile'
);

for (const doc of documents) {
  const fileBuffer = await service.getDocument(doc.ipfsHash);
  // Process file...
}
```

### Check IPFS Health

```typescript
import { getIPFSService } from '../ipfs.service';

const ipfs = getIPFSService();
const isHealthy = await ipfs.checkHealth();
console.log('IPFS Status:', isHealthy ? 'Online' : 'Offline');
```

## Database Schema

Documents are tracked in PostgreSQL with the following metadata:

```sql
CREATE TABLE preregistration_documents (
  document_id UUID PRIMARY KEY,
  entity_id UUID NOT NULL,
  entity_type VARCHAR(50),
  document_type VARCHAR(50),
  file_name VARCHAR(255),
  file_size BIGINT,
  mime_type VARCHAR(100),
  ipfs_hash VARCHAR(255) NOT NULL,
  ipfs_url TEXT,
  uploaded_by UUID,
  uploaded_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  deactivated_by UUID,
  deactivated_at TIMESTAMP,
  deactivation_reason TEXT
);
```

## File Size Limits

- **Maximum file size:** 10 MB (configurable)
- **Allowed formats:** PDF, DOC, DOCX, JPG, JPEG, PNG

## Security Considerations

### 1. Access Control
- Documents are linked to specific entities
- Only authorized users can upload/retrieve
- Audit trail maintained for all operations

### 2. Data Integrity
- IPFS content hashing ensures immutability
- File pinning prevents accidental deletion
- Metadata stored separately in PostgreSQL

### 3. Privacy
- IPFS is public by default
- Sensitive documents should be encrypted before upload
- Consider using private IPFS networks for production

### 4. Compliance
- Document retention policies enforced
- Audit logs track all document operations
- Soft delete maintains compliance records

## Monitoring & Maintenance

### Check Node Status

```bash
# Inside container
docker exec ipfs ipfs id

# Check storage
docker exec ipfs ipfs repo stat

# List pinned files
docker exec ipfs ipfs pin ls
```

### Garbage Collection

```typescript
const ipfs = getIPFSService();
await ipfs.garbageCollect();
```

### Backup IPFS Data

```bash
# Backup IPFS data volume
docker run --rm -v ipfs-data:/data -v $(pwd):/backup \
  alpine tar czf /backup/ipfs-backup.tar.gz -C /data .
```

## Troubleshooting

### IPFS Connection Issues

**Problem:** "Failed to connect to IPFS"

**Solution:**
1. Check IPFS container is running: `docker ps | grep ipfs`
2. Verify IPFS_HOST and IPFS_PORT in environment
3. Check network connectivity: `docker exec ipfs ipfs id`

### Upload Failures

**Problem:** "IPFS upload failed"

**Solution:**
1. Check file size (max 10MB)
2. Verify file format is allowed
3. Check IPFS node storage: `docker exec ipfs ipfs repo stat`
4. Run garbage collection if storage full

### Slow Performance

**Problem:** Document uploads/downloads are slow

**Solution:**
1. Check IPFS node peers: `docker exec ipfs ipfs swarm peers`
2. Increase connection limits in IPFS config
3. Consider using local gateway instead of public

## Production Deployment

### Recommendations

1. **Use dedicated IPFS node** - Don't share with other services
2. **Enable clustering** - For high availability
3. **Configure backup** - Regular backups of IPFS data
4. **Monitor storage** - Set up alerts for disk usage
5. **Use private network** - For sensitive documents
6. **Implement encryption** - Before uploading to IPFS

### Example Production Config

```yaml
ipfs:
  image: ipfs/kubo:latest
  volumes:
    - /mnt/ipfs-data:/data/ipfs
    - /mnt/ipfs-config:/root/.ipfs
  environment:
    - IPFS_PROFILE=server
    - IPFS_SWARM_KEY=/root/.ipfs/swarm.key
  restart: always
  healthcheck:
    test: ["CMD", "ipfs", "id"]
    interval: 10s
    timeout: 5s
    retries: 5
```

## API Endpoints Using IPFS

### Upload Document
```
POST /api/documents/upload
Content-Type: multipart/form-data

Parameters:
- file: File to upload
- entityId: Entity ID
- entityType: Type of entity
- documentType: Type of document
```

### Retrieve Document
```
GET /api/documents/:documentId
```

### List Entity Documents
```
GET /api/documents/entity/:entityId
```

### Deactivate Document
```
DELETE /api/documents/:documentId
```

## Performance Metrics

- **Upload speed:** ~1-5 MB/s (depends on network)
- **Retrieval speed:** ~2-10 MB/s
- **Storage overhead:** ~5-10% (IPFS metadata)
- **Pinning time:** ~1-2 seconds per file

## Future Enhancements

- [ ] Implement IPFS clustering for redundancy
- [ ] Add encryption layer for sensitive documents
- [ ] Implement document versioning
- [ ] Add full-text search on documents
- [ ] Integrate with blockchain for document proofs
- [ ] Implement automatic archival to cold storage

## References

- [IPFS Documentation](https://docs.ipfs.io/)
- [IPFS HTTP API](https://docs.ipfs.io/reference/http/api/)
- [Kubo (Go-IPFS)](https://github.com/ipfs/kubo)
- [IPFS Best Practices](https://docs.ipfs.io/how-to/best-practices/)
