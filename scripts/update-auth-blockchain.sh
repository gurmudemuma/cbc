#!/bin/bash

# Script to update all API services to use blockchain-based authentication

echo "🔄 Updating all API services to use blockchain-based authentication..."

# Array of services
SERVICES=("exporter-bank" "national-bank" "ncat" "shipping-line")

# Copy the updated auth controller to all services
echo "📝 Copying updated auth controller..."
for service in "${SERVICES[@]}"; do
    echo "  - Updating $service..."
    cp api/exporter-bank/src/controllers/auth.controller.ts api/$service/src/controllers/auth.controller.ts
done

# Update gateway files for all services
echo "📝 Updating gateway files..."

# National Bank
cat > api/national-bank/src/fabric/gateway.ts << 'EOF'
import { Gateway, Wallets, Network, Contract, X509Identity } from 'fabric-network';
import * as path from 'path';
import * as fs from 'fs';

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
      const ccpPath = path.resolve(
        __dirname, '..', '..', '..', '..',
        'network', 'organizations', 'peerOrganizations',
        'nationalbank.coffee-export.com',
        'connection-nationalbank.json'
      );

      if (!fs.existsSync(ccpPath)) {
        throw new Error(`Connection profile not found at ${ccpPath}`);
      }

      const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
      const ccp = JSON.parse(ccpJSON);

      const walletPath = path.join(process.cwd(), 'wallet');
      const wallet = await Wallets.newFileSystemWallet(walletPath);

      const identity = await wallet.get('admin');
      if (!identity) {
        console.log('Admin identity not found in wallet. Please enroll admin first.');
        await this.enrollAdmin(wallet);
      }

      this.gateway = new Gateway();
      await this.gateway.connect(ccp, {
        wallet,
        identity: 'admin',
        discovery: { enabled: true, asLocalhost: true },
      });

      this.network = await this.gateway.getNetwork('coffeechannel');
      this.contract = this.network.getContract('coffee-export');

      console.log('Successfully connected to Fabric network');
    } catch (error) {
      console.error(`Failed to connect to Fabric network: ${error}`);
      throw error;
    }
  }

  private async enrollAdmin(wallet: any): Promise<void> {
    try {
      const credPath = path.join(
        __dirname, '..', '..', '..', '..',
        'network', 'organizations', 'peerOrganizations',
        'nationalbank.coffee-export.com', 'users',
        'Admin@nationalbank.coffee-export.com', 'msp'
      );

      const certificate = fs.readFileSync(
        path.join(credPath, 'signcerts', 'cert.pem')
      ).toString();
      
      const privateKey = fs.readFileSync(
        path.join(credPath, 'keystore', fs.readdirSync(path.join(credPath, 'keystore'))[0])
      ).toString();

      const identity: X509Identity = {
        credentials: { certificate, privateKey },
        mspId: 'NationalBankMSP',
        type: 'X.509',
      };

      await wallet.put('admin', identity);
      console.log('Successfully enrolled admin user and imported into wallet');
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
      console.log('Disconnected from Fabric network');
    }
  }

  public getContract(contractName?: string): Contract {
    if (!this.network) {
      throw new Error('Network not initialized. Call connect() first.');
    }
    const name = contractName || 'coffee-export';
    return this.network.getContract(name);
  }

  public getNetwork(): Network {
    if (!this.network) {
      throw new Error('Network not initialized. Call connect() first.');
    }
    return this.network;
  }

  public getUserContract(): Contract {
    return this.getContract('user-management');
  }

  public getExportContract(): Contract {
    return this.getContract('coffee-export');
  }
}
EOF

# NCAT
cat > api/ncat/src/fabric/gateway.ts << 'EOF'
import { Gateway, Wallets, Network, Contract, X509Identity } from 'fabric-network';
import * as path from 'path';
import * as fs from 'fs';

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
      const ccpPath = path.resolve(
        __dirname, '..', '..', '..', '..',
        'network', 'organizations', 'peerOrganizations',
        'ncat.coffee-export.com',
        'connection-ncat.json'
      );

      if (!fs.existsSync(ccpPath)) {
        throw new Error(`Connection profile not found at ${ccpPath}`);
      }

      const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
      const ccp = JSON.parse(ccpJSON);

      const walletPath = path.join(process.cwd(), 'wallet');
      const wallet = await Wallets.newFileSystemWallet(walletPath);

      const identity = await wallet.get('admin');
      if (!identity) {
        console.log('Admin identity not found in wallet. Please enroll admin first.');
        await this.enrollAdmin(wallet);
      }

      this.gateway = new Gateway();
      await this.gateway.connect(ccp, {
        wallet,
        identity: 'admin',
        discovery: { enabled: true, asLocalhost: true },
      });

      this.network = await this.gateway.getNetwork('coffeechannel');
      this.contract = this.network.getContract('coffee-export');

      console.log('Successfully connected to Fabric network');
    } catch (error) {
      console.error(`Failed to connect to Fabric network: ${error}`);
      throw error;
    }
  }

  private async enrollAdmin(wallet: any): Promise<void> {
    try {
      const credPath = path.join(
        __dirname, '..', '..', '..', '..',
        'network', 'organizations', 'peerOrganizations',
        'ncat.coffee-export.com', 'users',
        'Admin@ncat.coffee-export.com', 'msp'
      );

      const certificate = fs.readFileSync(
        path.join(credPath, 'signcerts', 'cert.pem')
      ).toString();
      
      const privateKey = fs.readFileSync(
        path.join(credPath, 'keystore', fs.readdirSync(path.join(credPath, 'keystore'))[0])
      ).toString();

      const identity: X509Identity = {
        credentials: { certificate, privateKey },
        mspId: 'NCATMSP',
        type: 'X.509',
      };

      await wallet.put('admin', identity);
      console.log('Successfully enrolled admin user and imported into wallet');
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
      console.log('Disconnected from Fabric network');
    }
  }

  public getContract(contractName?: string): Contract {
    if (!this.network) {
      throw new Error('Network not initialized. Call connect() first.');
    }
    const name = contractName || 'coffee-export';
    return this.network.getContract(name);
  }

  public getNetwork(): Network {
    if (!this.network) {
      throw new Error('Network not initialized. Call connect() first.');
    }
    return this.network;
  }

  public getUserContract(): Contract {
    return this.getContract('user-management');
  }

  public getExportContract(): Contract {
    return this.getContract('coffee-export');
  }
}
EOF

# Shipping Line
cat > api/shipping-line/src/fabric/gateway.ts << 'EOF'
import { Gateway, Wallets, Network, Contract, X509Identity } from 'fabric-network';
import * as path from 'path';
import * as fs from 'fs';

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
      const ccpPath = path.resolve(
        __dirname, '..', '..', '..', '..',
        'network', 'organizations', 'peerOrganizations',
        'shippingline.coffee-export.com',
        'connection-shippingline.json'
      );

      if (!fs.existsSync(ccpPath)) {
        throw new Error(`Connection profile not found at ${ccpPath}`);
      }

      const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
      const ccp = JSON.parse(ccpJSON);

      const walletPath = path.join(process.cwd(), 'wallet');
      const wallet = await Wallets.newFileSystemWallet(walletPath);

      const identity = await wallet.get('admin');
      if (!identity) {
        console.log('Admin identity not found in wallet. Please enroll admin first.');
        await this.enrollAdmin(wallet);
      }

      this.gateway = new Gateway();
      await this.gateway.connect(ccp, {
        wallet,
        identity: 'admin',
        discovery: { enabled: true, asLocalhost: true },
      });

      this.network = await this.gateway.getNetwork('coffeechannel');
      this.contract = this.network.getContract('coffee-export');

      console.log('Successfully connected to Fabric network');
    } catch (error) {
      console.error(`Failed to connect to Fabric network: ${error}`);
      throw error;
    }
  }

  private async enrollAdmin(wallet: any): Promise<void> {
    try {
      const credPath = path.join(
        __dirname, '..', '..', '..', '..',
        'network', 'organizations', 'peerOrganizations',
        'shippingline.coffee-export.com', 'users',
        'Admin@shippingline.coffee-export.com', 'msp'
      );

      const certificate = fs.readFileSync(
        path.join(credPath, 'signcerts', 'cert.pem')
      ).toString();
      
      const privateKey = fs.readFileSync(
        path.join(credPath, 'keystore', fs.readdirSync(path.join(credPath, 'keystore'))[0])
      ).toString();

      const identity: X509Identity = {
        credentials: { certificate, privateKey },
        mspId: 'ShippingLineMSP',
        type: 'X.509',
      };

      await wallet.put('admin', identity);
      console.log('Successfully enrolled admin user and imported into wallet');
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
      console.log('Disconnected from Fabric network');
    }
  }

  public getContract(contractName?: string): Contract {
    if (!this.network) {
      throw new Error('Network not initialized. Call connect() first.');
    }
    const name = contractName || 'coffee-export';
    return this.network.getContract(name);
  }

  public getNetwork(): Network {
    if (!this.network) {
      throw new Error('Network not initialized. Call connect() first.');
    }
    return this.network;
  }

  public getUserContract(): Contract {
    return this.getContract('user-management');
  }

  public getExportContract(): Contract {
    return this.getContract('coffee-export');
  }
}
EOF

echo "✅ All gateway files updated!"

echo ""
echo "📦 Installing uuid package in all services..."
for service in "${SERVICES[@]}"; do
    echo "  - Installing in $service..."
    cd api/$service && npm install uuid && cd ../..
done

echo ""
echo "✅ Update complete!"
echo ""
echo "📋 Next steps:"
echo "1. Deploy the user-management chaincode:"
echo "   cd network"
echo "   ./network.sh deployCC -ccn user-management -ccp ../chaincode/user-management -ccl go"
echo ""
echo "2. Restart all API services"
echo ""
echo "3. Test authentication:"
echo "   - Register a user in one service"
echo "   - Login with the same credentials in another service"
echo ""
