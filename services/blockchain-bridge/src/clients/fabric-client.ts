/**
 * Fabric Client
 * Wrapper for Hyperledger Fabric operations
 */

import axios from 'axios';
import { logger } from '../utils/logger';

const CHAINCODE_URL = process.env.CHAINCODE_URL || 'http://localhost:3001';

export class FabricClient {
  static async healthCheck(): Promise<void> {
    const response = await axios.get(`${CHAINCODE_URL}/health`);
    if (response.status !== 200) {
      throw new Error('Fabric health check failed');
    }
  }

  static async getExporter(exporterId: string): Promise<any> {
    const response = await axios.post(`${CHAINCODE_URL}/query`, {
      fcn: 'GetExporter',
      args: [exporterId]
    });
    return JSON.parse(response.data.result);
  }

  static async updateExporter(exporterId: string, updates: any): Promise<void> {
    await axios.post(`${CHAINCODE_URL}/invoke`, {
      fcn: 'UpdateExporter',
      args: [exporterId, JSON.stringify(updates)]
    });
  }

  static async getLicense(licenseId: string): Promise<any> {
    const response = await axios.post(`${CHAINCODE_URL}/query`, {
      fcn: 'GetLicense',
      args: [licenseId]
    });
    return JSON.parse(response.data.result);
  }

  static async updateLicense(licenseId: string, updates: any): Promise<void> {
    await axios.post(`${CHAINCODE_URL}/invoke`, {
      fcn: 'UpdateLicense',
      args: [licenseId, JSON.stringify(updates)]
    });
  }

  static async revokeLicense(licenseId: string, reason: string): Promise<void> {
    await axios.post(`${CHAINCODE_URL}/invoke`, {
      fcn: 'RevokeLicense',
      args: [licenseId, reason]
    });
  }

  static async getCertificate(certificateId: string): Promise<any> {
    const response = await axios.post(`${CHAINCODE_URL}/query`, {
      fcn: 'GetCertificate',
      args: [certificateId]
    });
    return JSON.parse(response.data.result);
  }

  static async issueCertificate(certificateId: string, type: string, data: any): Promise<void> {
    await axios.post(`${CHAINCODE_URL}/invoke`, {
      fcn: `Issue${type}Certificate`,
      args: [certificateId, JSON.stringify(data)]
    });
  }

  static async updateCertificateInspection(certificateId: string, inspectionData: any): Promise<void> {
    await axios.post(`${CHAINCODE_URL}/invoke`, {
      fcn: 'UpdateCertificateInspection',
      args: [certificateId, JSON.stringify(inspectionData)]
    });
  }

  static async getShipment(shipmentId: string): Promise<any> {
    const response = await axios.post(`${CHAINCODE_URL}/query`, {
      fcn: 'GetShipment',
      args: [shipmentId]
    });
    return JSON.parse(response.data.result);
  }

  static async recordApproval(submissionId: string, agency: string, data: any): Promise<void> {
    await axios.post(`${CHAINCODE_URL}/invoke`, {
      fcn: 'RecordAgencyApproval',
      args: [submissionId, agency, JSON.stringify(data)]
    });
  }

  // ==================== User Management ====================

  static async registerUser(userData: {
    username: string;
    passwordHash: string;
    email: string;
    phone: string;
    companyName: string;
    tin: string;
    capitalETB: number;
    address: string;
    contactPerson: string;
    role: string;
  }): Promise<void> {
    try {
      await axios.post(`${CHAINCODE_URL}/invoke`, {
        fcn: 'RegisterUser',
        args: [JSON.stringify(userData)]
      });
      logger.info(`Registered user ${userData.username} on blockchain`);
    } catch (error: any) {
      if (error.response?.data?.error?.includes('already exists')) {
        logger.warn(`User ${userData.username} already exists on blockchain`);
      } else {
        throw error;
      }
    }
  }

  static async getUser(username: string): Promise<any> {
    try {
      const response = await axios.post(`${CHAINCODE_URL}/query`, {
        fcn: 'GetUser',
        args: [username]
      });
      return JSON.parse(response.data.result);
    } catch (error: any) {
      if (error.response?.status === 404 || error.response?.status === 500) {
        return null;
      }
      throw error;
    }
  }

  static async updateUserStatus(username: string, statusData: {
    status: string;
    approvedBy: string;
    comments: string;
  }): Promise<void> {
    await axios.post(`${CHAINCODE_URL}/invoke`, {
      fcn: 'UpdateUserStatus',
      args: [username, JSON.stringify(statusData)]
    });
    logger.info(`Updated user status for ${username}: ${statusData.status}`);
  }

  static async getAllUsers(): Promise<any[]> {
    const response = await axios.post(`${CHAINCODE_URL}/query`, {
      fcn: 'GetAllUsers',
      args: []
    });
    return JSON.parse(response.data.result);
  }
}
