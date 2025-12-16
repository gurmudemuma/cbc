import { Gateway, Wallets, Network, Contract } from 'fabric-network';
import * as path from 'path';
import * as fs from 'fs';

export class FabricGateway {
    private gateway: Gateway;
    private network: Network;
    private contract: Contract;
    private mspId: string;
    private channelName: string = 'coffee-channel';
    private chaincodeName: string = 'coffee-export';

    constructor(mspId: string) {
        this.mspId = mspId;
        this.gateway = new Gateway();
    }

    public async connect(): Promise<void> {
        try {
            // Load connection profile
            const ccpPath = path.resolve(__dirname, '..', '..', '..', '..', 'fabric-network', 'organizations', 'peerOrganizations', `${this.mspId.toLowerCase()}.coffee-export.com`, 'connection-profile.json');
            const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

            // Create wallet and get identity
            const walletPath = path.join(process.cwd(), 'wallet');
            const wallet = await Wallets.newFileSystemWallet(walletPath);

            const identity = await wallet.get('admin');
            if (!identity) {
                throw new Error(`Identity 'admin' not found in wallet for ${this.mspId}`);
            }

            // Connect to gateway
            await this.gateway.connect(ccp, {
                wallet,
                identity: 'admin',
                discovery: { enabled: true, asLocalhost: true }
            });

            // Get network and contract
            this.network = await this.gateway.getNetwork(this.channelName);
            this.contract = this.network.getContract(this.chaincodeName);

            console.log(`✅ Connected to Fabric network - ${this.mspId}`);
        } catch (error) {
            console.error(`Failed to connect to Fabric network:`, error);
            throw error;
        }
    }

    public async disconnect(): Promise<void> {
        if (this.gateway) {
            this.gateway.disconnect();
            console.log(`🔌 Disconnected from Fabric network - ${this.mspId}`);
        }
    }

    // Export Management Functions
    public async createExport(exportData: any): Promise<any> {
        try {
            const result = await this.contract.submitTransaction('CreateExportRequest', JSON.stringify(exportData));
            return JSON.parse(result.toString());
        } catch (error) {
            console.error('Error creating export:', error);
            throw error;
        }
    }

    public async getExport(exportId: string): Promise<any> {
        try {
            const result = await this.contract.evaluateTransaction('GetExportRequest', exportId);
            return JSON.parse(result.toString());
        } catch (error) {
            console.error('Error getting export:', error);
            throw error;
        }
    }

    public async getAllExports(): Promise<any[]> {
        try {
            const result = await this.contract.evaluateTransaction('GetAllExports');
            return JSON.parse(result.toString());
        } catch (error) {
            console.error('Error getting all exports:', error);
            throw error;
        }
    }

    public async updateExportStatus(exportId: string, status: string, notes?: string): Promise<any> {
        try {
            const result = await this.contract.submitTransaction('UpdateExportStatus', exportId, status, notes || '');
            return JSON.parse(result.toString());
        } catch (error) {
            console.error('Error updating export status:', error);
            throw error;
        }
    }

    // FX Management Functions
    public async submitFXApplication(exportId: string, fxData: any): Promise<any> {
        try {
            const result = await this.contract.submitTransaction('SubmitFXApplication', exportId, JSON.stringify(fxData));
            return JSON.parse(result.toString());
        } catch (error) {
            console.error('Error submitting FX application:', error);
            throw error;
        }
    }

    // Document Management
    public async uploadDocument(exportId: string, documentData: any): Promise<any> {
        try {
            const result = await this.contract.submitTransaction('UploadDocument', exportId, JSON.stringify(documentData));
            return JSON.parse(result.toString());
        } catch (error) {
            console.error('Error uploading document:', error);
            throw error;
        }
    }

    // Query Functions
    public async queryExportsByStatus(status: string): Promise<any[]> {
        try {
            const result = await this.contract.evaluateTransaction('GetExportsByStatus', status);
            return JSON.parse(result.toString());
        } catch (error) {
            console.error('Error querying exports by status:', error);
            throw error;
        }
    }

    public async getExportHistory(exportId: string): Promise<any[]> {
        try {
            const result = await this.contract.evaluateTransaction('GetExportHistory', exportId);
            return JSON.parse(result.toString());
        } catch (error) {
            console.error('Error getting export history:', error);
            throw error;
        }
    }
}
