/**
 * IPFS Service
 * Handles document storage and retrieval from IPFS
 */

import axios, { AxiosInstance } from 'axios';
import { createLogger } from './logger';

const logger = createLogger('IPFSService');

export interface IPFSUploadResult {
  hash: string;
  size: number;
  url: string;
}

export interface IPFSFileInfo {
  hash: string;
  size: number;
  name: string;
}

export class IPFSService {
  private client: AxiosInstance;
  private host: string;
  private port: number;
  private protocol: string;
  private gatewayUrl: string;

  constructor(
    host: string = process.env.IPFS_HOST || 'localhost',
    port: number = parseInt(process.env.IPFS_PORT || '5001', 10),
    protocol: string = process.env.IPFS_PROTOCOL || 'http',
    gatewayUrl: string = process.env.IPFS_GATEWAY || 'https://ipfs.io'
  ) {
    this.host = host;
    this.port = port;
    this.protocol = protocol;
    this.gatewayUrl = gatewayUrl;

    // Create axios client for IPFS API
    this.client = axios.create({
      baseURL: `${protocol}://${host}:${port}/api/v0`,
      timeout: 30000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    logger.info('IPFS Service initialized', {
      host,
      port,
      protocol,
      gatewayUrl,
    });
  }

  /**
   * Upload a file buffer to IPFS
   */
  async uploadBuffer(fileBuffer: Buffer, fileName: string): Promise<IPFSUploadResult> {
    try {
      const formData = new FormData();
      const blob = new Blob([fileBuffer], { type: 'application/octet-stream' });
      formData.append('file', blob, fileName);

      const response = await this.client.post('/add', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const hash = response.data.Hash;
      const size = response.data.Size;
      const url = this.getFileUrl(hash);

      logger.info('File uploaded to IPFS', {
        fileName,
        hash,
        size,
      });

      return {
        hash,
        size: parseInt(size),
        url,
      };
    } catch (error) {
      logger.error('Failed to upload file to IPFS', {
        error,
        fileName,
      });
      throw new Error(`IPFS upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload a file from path to IPFS
   */
  async uploadFile(filePath: string): Promise<IPFSUploadResult> {
    try {
      const fs = await import('fs').then(m => m.promises);
      const fileBuffer = await fs.readFile(filePath);
      const fileName = filePath.split('/').pop() || 'file';

      return await this.uploadBuffer(fileBuffer, fileName);
    } catch (error) {
      logger.error('Failed to upload file from path', {
        error,
        filePath,
      });
      throw error;
    }
  }

  /**
   * Get file from IPFS
   */
  async getFile(hash: string): Promise<Buffer> {
    try {
      const response = await this.client.get(`/cat?arg=${hash}`, {
        responseType: 'arraybuffer',
      });

      logger.info('File retrieved from IPFS', { hash });
      return Buffer.from(response.data);
    } catch (error) {
      logger.error('Failed to retrieve file from IPFS', {
        error,
        hash,
      });
      throw new Error(`IPFS retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Pin a file to ensure persistence
   */
  async pinFile(hash: string): Promise<void> {
    try {
      await this.client.post(`/pin/add?arg=${hash}`);
      logger.info('File pinned to IPFS', { hash });
    } catch (error) {
      logger.error('Failed to pin file to IPFS', {
        error,
        hash,
      });
      throw new Error(`IPFS pin failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Unpin a file
   */
  async unpinFile(hash: string): Promise<void> {
    try {
      await this.client.post(`/pin/rm?arg=${hash}`);
      logger.info('File unpinned from IPFS', { hash });
    } catch (error) {
      logger.error('Failed to unpin file from IPFS', {
        error,
        hash,
      });
      throw new Error(`IPFS unpin failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get file information
   */
  async getFileInfo(hash: string): Promise<IPFSFileInfo> {
    try {
      const response = await this.client.post(`/files/stat?arg=/ipfs/${hash}`);

      return {
        hash,
        size: response.data.Size,
        name: response.data.Name || hash,
      };
    } catch (error) {
      logger.error('Failed to get file info from IPFS', {
        error,
        hash,
      });
      throw new Error(`IPFS stat failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get file URL (gateway URL)
   */
  getFileUrl(hash: string): string {
    return `${this.gatewayUrl}/ipfs/${hash}`;
  }

  /**
   * Get local IPFS URL
   */
  getLocalUrl(hash: string): string {
    return `${this.protocol}://${this.host}:${this.port}/ipfs/${hash}`;
  }

  /**
   * Check IPFS node health
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.client.post('/id');
      logger.info('IPFS node is healthy', {
        peerId: response.data.ID,
      });
      return true;
    } catch (error) {
      logger.error('IPFS node health check failed', { error });
      return false;
    }
  }

  /**
   * Get IPFS node info
   */
  async getNodeInfo(): Promise<any> {
    try {
      const response = await this.client.post('/id');
      return response.data;
    } catch (error) {
      logger.error('Failed to get IPFS node info', { error });
      throw error;
    }
  }

  /**
   * List pinned files
   */
  async listPinnedFiles(): Promise<string[]> {
    try {
      const response = await this.client.post('/pin/ls');
      return Object.keys(response.data.Keys || {});
    } catch (error) {
      logger.error('Failed to list pinned files', { error });
      throw error;
    }
  }

  /**
   * Get repository statistics
   */
  async getRepoStats(): Promise<any> {
    try {
      const response = await this.client.post('/repo/stat');
      return response.data;
    } catch (error) {
      logger.error('Failed to get repo stats', { error });
      throw error;
    }
  }

  /**
   * Garbage collection
   */
  async garbageCollect(): Promise<any> {
    try {
      const response = await this.client.post('/repo/gc');
      logger.info('IPFS garbage collection completed', {
        freed: response.data.length,
      });
      return response.data;
    } catch (error) {
      logger.error('Failed to run garbage collection', { error });
      throw error;
    }
  }
}

// Singleton instance
let ipfsService: IPFSService | null = null;

/**
 * Get or create IPFS service instance
 */
export const getIPFSService = (): IPFSService => {
  if (!ipfsService) {
    ipfsService = new IPFSService();
  }
  return ipfsService;
};

/**
 * Create a new IPFS service instance with custom configuration
 */
export const createIPFSService = (
  host?: string,
  port?: number,
  protocol?: string,
  gatewayUrl?: string
): IPFSService => {
  return new IPFSService(host, port, protocol, gatewayUrl);
};
