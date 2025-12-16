import { Gateway, Wallets, Network, Contract, X509Identity, Wallet } from 'fabric-network';
import * as path from 'path';
import * as fs from 'fs';
import { config } from '../config';
import { logger } from '../../../shared/logger';
import { envValidator } from '../../../shared/env.validator';

export class FabricGateway {
  private static instance: FabricGateway;
  private gateway: Gateway | null = null;
  private network: Network | null = null;
  private coffeeContract: Contract | null = null;

  private constructor() { }

  public static getInstance(): FabricGateway {
    if (!FabricGateway.instance) {
      FabricGateway.instance = new FabricGateway();
    }
    return FabricGateway.instance;
  }

  public async connect(): Promise<void> {
    try {
      const config = envValidator.getConfig();

      // Resolve connection profile path
      const ccpPath = path.isAbsolute(config.CONNECTION_PROFILE_PATH)
        ? config.CONNECTION_PROFILE_PATH
        : path.join(process.cwd(), config.CONNECTION_PROFILE_PATH);
      if (!fs.existsSync(ccpPath)) {
        throw new Error(`Connection profile not found at ${ccpPath}`);
      }
      const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
      const ccp = JSON.parse(ccpJSON);

      // Wallet path
      const walletPath = path.isAbsolute(config.WALLET_PATH)
        ? config.WALLET_PATH
        : path.join(process.cwd(), config.WALLET_PATH);
      const wallet = await Wallets.newFileSystemWallet(walletPath);

      // Ensure admin identity exists
      const identity = await wallet.get('admin');
      if (!identity) {
        logger.info('Admin identity not found in wallet. Enrolling admin...', { service: 'NationalBank' });
        await this.enrollAdmin(wallet);
      }

      this.gateway = new Gateway();
      await this.gateway.connect(ccp, {
        wallet,
        identity: 'admin',
        discovery: {
          enabled: true,
          asLocalhost: true, // Set to true for native execution
        },
      });

      this.network = await this.gateway.getNetwork(config.CHANNEL_NAME);
      this.coffeeContract = this.network.getContract(config.CHAINCODE_NAME_EXPORT);
      logger.info('Successfully connected to Fabric network', {
        channel: config.CHANNEL_NAME,
        chaincode: config.CHAINCODE_NAME_EXPORT
      });
    } catch (error) {
      logger.error(`Failed to connect to Fabric network: ${error}`);
      throw error;
    }
  }

  private async enrollAdmin(wallet: Wallet): Promise<void> {
    try {
      const config = envValidator.getConfig();

      // Prefer explicit admin cert/key paths if provided
      const certPath = config.ADMIN_CERT_PATH;
      const keyPath = config.ADMIN_KEY_PATH;
      let certificate: string | null = null;
      let privateKey: string | null = null;

      if (
        certPath &&
        keyPath &&
        fs.existsSync(path.resolve(process.cwd(), certPath)) &&
        fs.existsSync(path.resolve(process.cwd(), keyPath))
      ) {
        certificate = fs.readFileSync(path.resolve(process.cwd(), certPath)).toString();
        privateKey = fs.readFileSync(path.resolve(process.cwd(), keyPath)).toString();
      } else {
        // Fallback derive from ORGANIZATION_ID
        const org = config.ORGANIZATION_ID.toLowerCase();
        const networkPath =
          process.env['FABRIC_NETWORK_PATH'] || path.join(process.cwd(), '..', '..', 'network');
        const credPath = path.join(
          networkPath,
          'organizations',
          'peerOrganizations',
          `${org}.coffee-export.com`,
          'users',
          `Admin@${org}.coffee-export.com`,
          'msp'
        );
        const signcertsPath = path.join(credPath, 'signcerts');
        const certFiles = fs.readdirSync(signcertsPath);
        const certFile = certFiles.find((f) => f.endsWith('.pem')) || certFiles[0];
        if (!certFile) throw new Error('Certificate file not found in signcerts');
        certificate = fs.readFileSync(path.join(signcertsPath, certFile)).toString();
        const keystorePath = path.join(credPath, 'keystore');
        const keyFiles = fs.readdirSync(keystorePath);
        const keyFile = keyFiles[0];
        if (!keyFile) throw new Error('Keystore file not found');
        privateKey = fs.readFileSync(path.join(keystorePath, keyFile)).toString();
      }

      const identity: X509Identity = {
        credentials: { certificate: certificate!, privateKey: privateKey! },
        mspId: config.MSP_ID,
        type: 'X.509',
      };
      await wallet.put('admin', identity);
      logger.info(
        `Successfully enrolled admin user and imported into wallet (MSP: ${config.MSP_ID})`
      );
    } catch (error) {
      logger.error(`Failed to enroll admin: ${error}`);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.gateway) {
      this.gateway.disconnect();
      this.gateway = null;
      this.network = null;
      this.coffeeContract = null;
      logger.info('Disconnected from Fabric network');
    }
  }

  public getContract(contractName: string): Contract {
    if (!this.network) {
      throw new Error('Network not initialized. Call connect() first.');
    }
    return this.network.getContract(contractName);
  }

  public getNetwork(): Network {
    if (!this.network) {
      throw new Error('Network not initialized. Call connect() first.');
    }
    return this.network;
  }

  public async getUserContract(): Promise<Contract> {
    if (!this.network) {
      throw new Error('Network not initialized. Call connect() first.');
    }
    const config = envValidator.getConfig();
    return this.network.getContract(config.CHAINCODE_NAME_USER);
  }

  public getExportContract(): Contract {
    if (!this.coffeeContract) {
      throw new Error('Export contract not initialized. Call connect() first.');
    }
    return this.coffeeContract;
  }

  public isConnected(): boolean {
    return this.gateway !== null && this.network !== null && this.coffeeContract !== null;
  }
}
