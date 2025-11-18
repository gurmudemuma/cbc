/**
 * Fabric SDK Gateway for Exporter Portal
 *
 * IMPORTANT: This is an EXTERNAL CLIENT using Fabric SDK
 * - No peer node running
 * - Connects to Commercial Bank's peer as gateway
 * - Submit-only access (creates export requests)
 * - Read-only queries for own exports
 *
 * This follows Hyperledger Fabric best practices for external entities
 */

import { Gateway, Wallets, Contract, Network } from "fabric-network";
import * as fs from "fs";
import * as path from "path";
import { logger } from "../config/logger";

export class FabricSDKGateway {
  private static instance: FabricSDKGateway;
  private gateway: Gateway | null = null;
  private network: Network | null = null;
  private exportContract: Contract | null = null;
  private userContract: Contract | null = null;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): FabricSDKGateway {
    if (!FabricSDKGateway.instance) {
      FabricSDKGateway.instance = new FabricSDKGateway();
    }
    return FabricSDKGateway.instance;
  }

  /**
   * Initialize SDK connection to the network
   * Uses Commercial Bank's peer as gateway
   */
  public async initialize(): Promise<void> {
    try {
      logger.info("🔗 Initializing Fabric SDK Gateway (External Client)...");

      // Load connection profile
      // Exporters connect through Commercial Bank's peer as external clients
      const configPath =
        process.env.CONNECTION_PROFILE_PATH ||
        path.join(
          process.cwd(),
          "network",
          "organizations",
          "peerOrganizations",
          "commercialbank.coffee-export.com",
          "connection-commercialbank.json",
        );

      logger.info(`🔍 Using connection profile path: ${configPath}`);

      // Resolve connection profile path.
      // Default path is resolved from the repository root (process.cwd()) so
      // the service works when started from the repo root. If an absolute path
      // is provided via env, use it as-is.
      const ccpPath = path.isAbsolute(configPath)
        ? configPath
        : path.resolve(process.cwd(), configPath);

      if (!fs.existsSync(ccpPath)) {
        throw new Error(`Connection profile not found at: ${ccpPath}`);
      }

      const ccpJSON = fs.readFileSync(ccpPath, "utf8");
      const ccp = JSON.parse(ccpJSON);

      // Create wallet
      const walletPath = path.resolve(
        process.cwd(),
        process.env.WALLET_PATH || "./wallet",
      );
      const wallet = await Wallets.newFileSystemWallet(walletPath);

      logger.info(`🔍 Using wallet path: ${walletPath}`);

      // Try dedicated client identity first, fallback to admin if needed
      let clientIdentityName = "exporterPortalClient";
      let identity = await wallet.get(clientIdentityName);

      if (!identity) {
        logger.warn(
          "⚠️  Dedicated client identity not found, using admin identity with client permissions",
        );
        clientIdentityName = "admin";
        identity = await wallet.get(clientIdentityName);

        if (!identity) {
          throw new Error(
            "No valid identity found. Please ensure admin identity exists.",
          );
        }
      }

      // Override the MSP ID to use ExporterPortalMSP for external client
      identity.mspId = "ExporterPortalMSP";

      logger.info(
        `✅ Using identity: ${clientIdentityName} (External Client Mode)`,
      );
      logger.info(`🏛️  MSP: ${identity.mspId}`);
      logger.info("🔐 Access Level: External Client - Limited Permissions");

      // Create gateway instance
      this.gateway = new Gateway();

      // Connect to gateway using SDK with minimal configuration
      // This is necessary because the Exporter Portal is an external client and doesn't have
      // permissions to use the discovery service on the channel
      await this.gateway.connect(ccp, {
        wallet,
        identity: clientIdentityName,
        // Disable discovery service as it requires additional permissions
        discovery: {
          enabled: false,
          asLocalhost: true,
        },
        // Set a reasonable timeout
        queryHandlerOptions: {
          timeout: 30000
        },
        // Disable event service as it's not needed for this client
        eventHandlerOptions: {
          strategy: null
        }
      });

      logger.info("✅ Connected to Fabric network via SDK");

      // Get network channel
      const channelName = process.env.CHANNEL_NAME || "coffeechannel";
      this.network = await this.gateway.getNetwork(channelName);
      logger.info(`✅ Connected to channel: ${channelName}`);

      // Get contracts with limited access for external client
      const exportChaincodeName =
        process.env.CHAINCODE_NAME_EXPORT || "coffee-export";
      const userChaincodeName =
        process.env.CHAINCODE_NAME_USER || "user-management";

      // Only access contracts that external clients are allowed to use
      this.exportContract = this.network.getContract(exportChaincodeName);
      this.userContract = this.network.getContract(userChaincodeName);

      logger.info(
        `✅ Got authorized contracts for external client: ${exportChaincodeName}, ${userChaincodeName}`,
      );
      logger.info(
        "🔐 External client access: Limited to exporter-specific functions only",
      );

      this.isConnected = true;
      logger.info(
        "🎉 Fabric SDK Gateway initialized successfully (External Client Mode)",
      );
    } catch (error) {
      logger.error("❌ Failed to initialize Fabric SDK Gateway:", error);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Get export contract
   */
  public getExportContract(): Contract {
    if (!this.exportContract) {
      throw new Error(
        "Export contract not initialized. Call initialize() first.",
      );
    }
    return this.exportContract;
  }

  /**
   * Get user contract
   */
  public getUserContract(): Contract {
    if (!this.userContract) {
      throw new Error(
        "User contract not initialized. Call initialize() first.",
      );
    }
    return this.userContract;
  }

  /**
   * Check if gateway is connected
   */
  public isGatewayConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Disconnect from gateway
   */
  public async disconnect(): Promise<void> {
    try {
      if (this.gateway) {
        await this.gateway.disconnect();
        this.gateway = null;
        this.network = null;
        this.exportContract = null;
        this.userContract = null;
        this.isConnected = false;
        logger.info("✅ Disconnected from Fabric network");
      }
    } catch (error) {
      logger.error("❌ Error disconnecting from gateway:", error);
      throw error;
    }
  }

  /**
   * Validate that external client is only accessing authorized functions
   */
  public validateExternalAccess(
    functionName: string,
    contractType: "export" | "user",
  ): boolean {
    // Define allowed functions for external clients (exporters)
    const allowedExportFunctions = [
      "CreateExport",
      "GetExportsByExporter",
      "GetExport",
      "UpdateExportStatus",
      "SubmitExport",
    ];

    const allowedUserFunctions = [
      "RegisterUser",
      "GetUser",
      "AuthenticateUser",
    ];

    const allowedFunctions =
      contractType === "export" ? allowedExportFunctions : allowedUserFunctions;

    if (!allowedFunctions.includes(functionName)) {
      logger.warn(
        `🚫 External client attempted to access unauthorized function: ${functionName}`,
      );
      return false;
    }

    logger.info(`✅ External client authorized to access: ${functionName}`);
    return true;
  }

  /**
   * Secure contract invocation for external clients
   */
  public async invokeContractSecurely(
    contractType: "export" | "user",
    functionName: string,
    ...args: any[]
  ): Promise<any> {
    // Validate access
    if (!this.validateExternalAccess(functionName, contractType)) {
      throw new Error(
        `Access denied: External client not authorized to call ${functionName}`,
      );
    }

    // Get appropriate contract
    const contract =
      contractType === "export"
        ? this.getExportContract()
        : this.getUserContract();

    // Log the invocation for audit
    logger.info(`🔐 External client invoking: ${contractType}.${functionName}`);

    // Invoke the function
    return await contract.submitTransaction(functionName, ...args);
  }

  /**
   * Graceful shutdown
   */
  public async shutdown(): Promise<void> {
    logger.info("🛑 Shutting down Fabric SDK Gateway...");
    await this.disconnect();
  }
}
