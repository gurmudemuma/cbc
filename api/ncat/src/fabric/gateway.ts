import {
  Gateway,
  Wallets,
  Network,
  Contract,
  X509Identity,
  Wallet,
} from "fabric-network";
import * as path from "path";
import * as fs from "fs";

export class FabricGateway {
  private static instance: FabricGateway;
  private gateway: Gateway | null = null;
  private network: Network | null = null;
  private contract: Contract | null = null;

  private constructor() {}

  public static getInstance(): FabricGateway {
    if (!FabricGateway.instance) {
      FabricGateway.instance = new FabricGateway();
    }
    return FabricGateway.instance;
  }

  public async connect(): Promise<void> {
    try {
      // Load connection profile
      const ccpPath = path.resolve(
        __dirname,
        "..",
        "..",
        "..",
        "..",
        "network",
        "organizations",
        "peerOrganizations",
        "ncat.coffee-export.com",
        "connection-ncat.json",
      );

      if (!fs.existsSync(ccpPath)) {
        throw new Error(`Connection profile not found at ${ccpPath}`);
      }

      const ccpJSON = fs.readFileSync(ccpPath, "utf8");
      const ccp = JSON.parse(ccpJSON);

      // Create a new file system based wallet for managing identities
      const walletPath = path.join(process.cwd(), "wallet");
      const wallet = await Wallets.newFileSystemWallet(walletPath);

      // Check if admin identity exists
      const identity = await wallet.get("admin");
      if (!identity) {
        console.log(
          "Admin identity not found in wallet. Please enroll admin first.",
        );
        await this.enrollAdmin(wallet);
      }

      // Create a new gateway for connecting to peer node
      this.gateway = new Gateway();
      await this.gateway.connect(ccp, {
        wallet,
        identity: "admin",
        discovery: {
          enabled: true,
          asLocalhost: process.env['NODE_ENV'] !== "production",
        },
      });

      // Get the network (channel)
      this.network = await this.gateway.getNetwork("coffeechannel");

      // Get the contract from the network
      this.contract = this.network.getContract("coffee-export");

      console.log("Successfully connected to Fabric network");
    } catch (error) {
      console.error(`Failed to connect to Fabric network: ${error}`);
      throw error;
    }
  }

  private async enrollAdmin(wallet: Wallet): Promise<void> {
    try {
      // Load credentials from the file system
      const credPath = path.join(
        __dirname,
        "..",
        "..",
        "..",
        "..",
        "network",
        "organizations",
        "peerOrganizations",
        "ncat.coffee-export.com",
        "users",
        "Admin@ncat.coffee-export.com",
        "msp",
      );

      // Read the certificate file (it may have different names)
      const signcertsPath = path.join(credPath, "signcerts");
      const certFiles = fs.readdirSync(signcertsPath);
      const certFile =
        certFiles.find((f) => f.endsWith(".pem")) || certFiles[0];

      const certificate = fs
        .readFileSync(path.join(signcertsPath, certFile))
        .toString();

      const privateKey = fs
        .readFileSync(
          path.join(
            credPath,
            "keystore",
            fs.readdirSync(path.join(credPath, "keystore"))[0],
          ),
        )
        .toString();

      const identity: X509Identity = {
        credentials: {
          certificate,
          privateKey,
        },
        mspId: "NCATMSP",
        type: "X.509",
      };

      await wallet.put("admin", identity);
      console.log("Successfully enrolled admin user and imported into wallet");
    } catch (error) {
      console.error(`Failed to enroll admin: ${error}`);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.gateway) {
      this.gateway.disconnect();
      this.gateway = null;
      this.network = null;
      this.contract = null;
      console.log("Disconnected from Fabric network");
    }
  }

  public getContract(contractName?: string): Contract {
    if (!this.network) {
      throw new Error("Network not initialized. Call connect() first.");
    }

    // Default to coffee-export contract for backward compatibility
    const name = contractName || "coffee-export";
    return this.network.getContract(name);
  }

  public getNetwork(): Network {
    if (!this.network) {
      throw new Error("Network not initialized. Call connect() first.");
    }
    return this.network;
  }

  public getUserContract(): Contract {
    return this.getContract("user-management");
  }

  public getExportContract(): Contract {
    return this.getContract("coffee-export");
  }
}
