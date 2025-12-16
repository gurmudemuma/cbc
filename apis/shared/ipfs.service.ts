import fs from 'fs';
import path from 'path';
import { create, IPFSHTTPClient } from 'ipfs-http-client';
import { config } from './config';
import { logger } from './logger';

interface UploadResult {
  hash: string;
  path: string;
  size: number;
  url: string;
}

interface DocumentMetadata {
  exportId: string;
  documentType: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: string;
  ipfsHash: string;
}

export class IPFSService {
  private client: any = null;
  private isConnected: boolean = false;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    // Connect to IPFS node (required)
    const ipfsHost = process.env['IPFS_HOST'];
    const ipfsPort = process.env['IPFS_PORT'];
    const ipfsProtocol = process.env['IPFS_PROTOCOL'];

    if (!ipfsHost || !ipfsPort || !ipfsProtocol) {
      throw new Error(
        'IPFS configuration is required: IPFS_HOST, IPFS_PORT, and IPFS_PROTOCOL must be set'
      );
    }

    try {
      const ipfs = await import('ipfs-http-client');
      this.client = ipfs.create({
        host: ipfsHost,
        port: parseInt(ipfsPort),
        protocol: ipfsProtocol,
      });

      // Test connection
      const version = await this.client.version();
      logger.info('Connected to IPFS node', { version: version.version });
      this.isConnected = true;
    } catch (error: any) {
      console.error('❌ Failed to connect to IPFS:', error);
      throw new Error(`IPFS connection is required but failed: ${error.message} `);
    }
  }

  // Upload file to IPFS
  public async uploadFile(filePath: string, _metadata?: any): Promise<UploadResult> {
    if (!this.isConnected || !this.client) {
      throw new Error('IPFS is not connected. Cannot upload file.');
    }

    try {
      const fileContent = fs.readFileSync(filePath);
      const fileName = path.basename(filePath);

      // Add file to IPFS
      const result = await this.client.add({
        path: fileName,
        content: fileContent,
      });

      const ipfsUrl = `${process.env.IPFS_GATEWAY || 'https://ipfs.io'} /ipfs/${result.cid.toString()} `;

      logger.info('File uploaded to IPFS', { cid: result.cid.toString() });

      return {
        hash: result.cid.toString(),
        path: result.path,
        size: result.size,
        url: ipfsUrl,
      };
    } catch (error) {
      console.error('Error uploading to IPFS:', error);
      throw new Error(`Failed to upload file to IPFS: ${error} `);
    }
  }

  // Upload buffer to IPFS
  public async uploadBuffer(buffer: Buffer, fileName: string): Promise<UploadResult> {
    if (!this.isConnected || !this.client) {
      throw new Error('IPFS is not connected. Cannot upload buffer.');
    }

    try {
      const result = await this.client.add({
        path: fileName,
        content: buffer,
      });

      const ipfsUrl = `${process.env.IPFS_GATEWAY || 'https://ipfs.io'} /ipfs/${result.cid.toString()} `;

      logger.info('Buffer uploaded to IPFS', { cid: result.cid.toString() });

      return {
        hash: result.cid.toString(),
        path: result.path,
        size: result.size,
        url: ipfsUrl,
      };
    } catch (error) {
      console.error('Error uploading buffer to IPFS:', error);
      throw new Error(`Failed to upload buffer to IPFS: ${error} `);
    }
  }

  // Upload JSON data to IPFS
  public async uploadJSON(data: any, fileName: string = 'data.json'): Promise<UploadResult> {
    const jsonString = JSON.stringify(data, null, 2);
    const buffer = Buffer.from(jsonString);
    return this.uploadBuffer(buffer, fileName);
  }

  // Retrieve file from IPFS
  public async getFile(hash: string): Promise<Buffer> {
    if (!this.isConnected || !this.client) {
      throw new Error('IPFS is not connected. Cannot retrieve file.');
    }

    try {
      const chunks: Uint8Array[] = [];

      for await (const chunk of this.client.cat(hash)) {
        chunks.push(chunk);
      }

      return Buffer.concat(chunks);
    } catch (error) {
      console.error('Error retrieving from IPFS:', error);
      throw new Error(`Failed to retrieve file from IPFS: ${error} `);
    }
  }

  // Get file URL
  public getFileUrl(hash: string): string {
    const gateway = process.env.IPFS_GATEWAY || 'https://ipfs.io';
    return `${gateway} /ipfs/${hash} `;
  }

  // Pin file to ensure it stays on IPFS
  public async pinFile(hash: string): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      throw new Error('IPFS is not connected. Cannot pin file.');
    }

    try {
      await this.client.pin.add(hash);
      logger.info('File pinned', { hash });
      return true;
    } catch (error) {
      console.error('Error pinning file:', error);
      return false;
    }
  }

  // Unpin file
  public async unpinFile(hash: string): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      throw new Error('IPFS is not connected. Cannot unpin file.');
    }

    try {
      await this.client.pin.rm(hash);
      logger.info('File unpinned', { hash });
      return true;
    } catch (error) {
      console.error('Error unpinning file:', error);
      return false;
    }
  }

  // Upload export document
  public async uploadExportDocument(
    exportId: string,
    documentType: string,
    filePath: string,
    uploadedBy: string
  ): Promise<DocumentMetadata> {
    const stats = fs.statSync(filePath);
    const fileName = path.basename(filePath);
    const mimeType = this.getMimeType(fileName);

    const uploadResult = await this.uploadFile(filePath);

    // Pin the file
    await this.pinFile(uploadResult.hash);

    const metadata: DocumentMetadata = {
      exportId,
      documentType,
      fileName,
      fileSize: stats.size,
      mimeType,
      uploadedBy,
      uploadedAt: new Date().toISOString(),
      ipfsHash: uploadResult.hash,
    };

    // Store metadata on IPFS as well
    await this.uploadJSON(metadata, `${exportId}_${documentType} _metadata.json`);

    return metadata;
  }

  // Get MIME type from file extension
  private getMimeType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.txt': 'text/plain',
      '.json': 'application/json',
      '.xml': 'application/xml',
      '.csv': 'text/csv',
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }

  // Check if IPFS is connected
  public isIPFSConnected(): boolean {
    return this.isConnected;
  }

  // Get node info
  public async getNodeInfo(): Promise<any> {
    if (!this.isConnected || !this.client) {
      return { connected: false, mode: 'fallback' };
    }

    try {
      const version = await this.client.version();
      const id = await this.client.id();

      return {
        connected: true,
        version: version.version,
        peerId: id.id,
        addresses: id.addresses,
      };
    } catch (error: any) {
      return { connected: false, error: error.message };
    }
  }
}

// Singleton instance
let ipfsService: IPFSService | null = null;

export const getIPFSService = (): IPFSService => {
  if (!ipfsService) {
    ipfsService = new IPFSService();
  }
  return ipfsService;
};
