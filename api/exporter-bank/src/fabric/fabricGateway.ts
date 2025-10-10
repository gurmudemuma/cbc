import { Gateway, GatewayOptions, Wallets, Contract } from "fabric-network";
import * as path from "path";
import * as fs from "fs";

export class FabricGateway {
  private static instance: FabricGateway;
  private gateway: Gateway | null = null;

  private constructor() {}

  public static getInstance(): FabricGateway {
    if (!FabricGateway.instance) {
      FabricGateway.instance = new FabricGateway();
    }
    return FabricGateway.instance;
  }

  public async connect(): Promise<void> {
    try {
      const walletPath = path.join(__dirname, "..", "..", "wallet");
      const wallet = await Wallets.newFileSystemWallet(walletPath);
      console.log(`Wallet path: ${walletPath}`);

      const ccpPath = path.resolve(
        __dirname,
        "..",
        "..",
        "..",
        "..",
        "network",
        "organizations",
        "peerOrganizations",
        "exporterbank.coffee-export.com",
        "connection-exporterbank.json",
      );
      const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));
      console.log("Loaded connection profile");

      const gatewayOptions: GatewayOptions = {
        wallet,
        identity: "appUser",
        discovery: { enabled: true, asLocalhost: true },
      };

      this.gateway = new Gateway();
      await this.gateway.connect(ccp, gatewayOptions);
      console.log("Connected to Fabric gateway");
    } catch (error) {
      console.error("Failed to connect to Fabric gateway:", error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.gateway) {
      await this.gateway.disconnect();
      this.gateway = null;
      console.log("Disconnected from Fabric gateway");
    }
  }

  private async getContract(
    channelName: string,
    contractName: string,
  ): Promise<Contract> {
    if (!this.gateway) {
      throw new Error("Gateway not connected");
    }
    const network = await this.gateway.getNetwork(channelName);
    return network.getContract(contractName);
  }

  public getUserContract(): Promise<Contract> {
    return this.getContract("userchannel", "user-management");
  }

  public getExportContract(): Promise<Contract> {
    return this.getContract("coffeechannel", "coffee-export");
  }
}
