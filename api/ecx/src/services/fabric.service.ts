/**
 * ECX Fabric Service
 * Handles blockchain interactions for ECX organization
 */

import { Gateway, Wallets, Network, Contract } from "fabric-network";
import * as path from "path";
import * as fs from "fs";
import { logger } from "../utils/logger";

export class FabricService {
  private gateway: Gateway | null = null;
  private network: Network | null = null;
  private contract: Contract | null = null;

  /**
   * Connect to Fabric network as ECX organization
   */
  async connect(): Promise<void> {
    try {
      // Load connection profile
      const ccpPath = path.resolve(
        __dirname,
        process.env.CONNECTION_PROFILE_PATH ||
          "../../../network/organizations/peerOrganizations/ecx.coffee-export.com/connection-ecx.json",
      );

      if (!fs.existsSync(ccpPath)) {
        throw new Error(`Connection profile not found at: ${ccpPath}`);
      }

      const ccpJSON = fs.readFileSync(ccpPath, "utf8");
      const ccp = JSON.parse(ccpJSON);

      // Create wallet
      const walletPath = path.resolve(
        __dirname,
        process.env.WALLET_PATH || "../../wallet",
      );
      const wallet = await Wallets.newFileSystemWallet(walletPath);

      // Check if identity exists
      const identity = await wallet.get(process.env.USER_ID || "ecxAdmin");
      if (!identity) {
        throw new Error(
          "ECX admin identity not found in wallet. Please enroll first.",
        );
      }

      // Connect to gateway
      this.gateway = new Gateway();
      await this.gateway.connect(ccp, {
        wallet,
        identity: process.env.USER_ID || "ecxAdmin",
        discovery: { enabled: true, asLocalhost: true },
      });

      // Get network and contract
      this.network = await this.gateway.getNetwork(
        process.env.CHANNEL_NAME || "coffeechannel",
      );
      this.contract = this.network.getContract(
        process.env.CHAINCODE_NAME || "coffee-export",
      );

      logger.info("ECX Fabric service connected successfully");
    } catch (error) {
      logger.error("Failed to connect to Fabric network:", error);
      throw error;
    }
  }

  /**
   * Disconnect from Fabric network
   */
  async disconnect(): Promise<void> {
    if (this.gateway) {
      this.gateway.disconnect();
      this.gateway = null;
      this.network = null;
      this.contract = null;
      logger.info("ECX Fabric service disconnected");
    }
  }

  /**
   * Get contract instance
   */
  getContract(): Contract {
    if (!this.contract) {
      throw new Error("Fabric service not connected. Call connect() first.");
    }
    return this.contract;
  }

  /**
   * Create export request on blockchain (ECX creates the initial record)
   */
  async createExportRequest(
    exportId: string,
    commercialBankId: string,
    exporterName: string,
    exportLicenseNumber: string,
    coffeeType: string,
    quantity: number,
    destinationCountry: string,
    estimatedValue: number,
    ecxLotNumber: string,
    warehouseLocation: string,
  ): Promise<string> {
    try {
      const contract = this.getContract();

      logger.info(`Creating export request on blockchain: ${exportId}`);

      const result = await contract.submitTransaction(
        "CreateExportRequest",
        exportId,
        commercialBankId,
        exporterName,
        exportLicenseNumber,
        coffeeType,
        quantity.toString(),
        destinationCountry,
        estimatedValue.toString(),
        ecxLotNumber,
        warehouseLocation,
      );

      const txId = result.toString();
      logger.info(`Export request created successfully. TxID: ${txId}`);

      return txId;
    } catch (error) {
      logger.error("Failed to create export request:", error);
      throw error;
    }
  }

  /**
   * Verify ECX lot number on blockchain
   */
  async verifyECXLot(
    exportId: string,
    lotNumber: string,
    warehouseReceiptNumber: string,
  ): Promise<string> {
    try {
      const contract = this.getContract();

      logger.info(`Verifying ECX lot on blockchain: ${lotNumber}`);

      const result = await contract.submitTransaction(
        "VerifyECXLot",
        exportId,
        lotNumber,
        warehouseReceiptNumber,
      );

      const txId = result.toString();
      logger.info(`ECX lot verified successfully. TxID: ${txId}`);

      return txId;
    } catch (error) {
      logger.error("Failed to verify ECX lot:", error);
      throw error;
    }
  }

  /**
   * Get export request from blockchain
   */
  async getExportRequest(exportId: string): Promise<any> {
    try {
      const contract = this.getContract();

      logger.info(`Fetching export request from blockchain: ${exportId}`);

      const result = await contract.evaluateTransaction(
        "GetExportRequest",
        exportId,
      );
      const exportData = JSON.parse(result.toString());

      logger.info(`Export request fetched successfully: ${exportId}`);

      return exportData;
    } catch (error) {
      logger.error("Failed to get export request:", error);
      throw error;
    }
  }

  /**
   * Get all exports by status
   */
  async getExportsByStatus(status: string): Promise<any[]> {
    try {
      const contract = this.getContract();

      logger.info(`Fetching exports by status: ${status}`);

      const result = await contract.evaluateTransaction(
        "GetExportsByStatus",
        status,
      );
      const exports = JSON.parse(result.toString());

      logger.info(`Found ${exports.length} exports with status: ${status}`);

      return exports;
    } catch (error) {
      logger.error("Failed to get exports by status:", error);
      throw error;
    }
  }

  /**
   * Reject ECX verification
   */
  async rejectECXVerification(
    exportId: string,
    reason: string,
  ): Promise<string> {
    try {
      const contract = this.getContract();

      logger.info(`Rejecting ECX verification: ${exportId}`);

      const result = await contract.submitTransaction(
        "RejectECXVerification",
        exportId,
        reason,
      );

      const txId = result.toString();
      logger.info(`ECX verification rejected. TxID: ${txId}`);

      return txId;
    } catch (error) {
      logger.error("Failed to reject ECX verification:", error);
      throw error;
    }
  }

  /**
   * Check if service is connected
   */
  isConnected(): boolean {
    return this.gateway !== null && this.contract !== null;
  }
}

// Singleton instance
export const fabricService = new FabricService();
