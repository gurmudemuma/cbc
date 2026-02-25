/**
 * Fabric Event Listener Service
 * Listens to Hyperledger Fabric chaincode events and forwards to CBC
 */

import { Gateway, Wallets, Network, Contract } from 'fabric-network';
import { logger } from '../utils/logger';
import { KafkaProducer } from './kafka-producer';
import { CBCClient } from '../clients/cbc-client';
import fs from 'fs';
import path from 'path';

export class FabricEventListener {
  private static gateway: Gateway | null = null;
  private static network: Network | null = null;
  private static contract: Contract | null = null;
  private static listener: any = null;

  /**
   * Start listening to Fabric events
   */
  static async start(): Promise<void> {
    try {
      // Load connection profile from environment or default path
      const ccpPath = process.env.CONNECTION_PROFILE_PATH || 
                      path.resolve(__dirname, '../../../coffee-export-gateway/src/config/connection-profile.json');
      
      // Check if file exists
      if (!fs.existsSync(ccpPath)) {
        logger.warn(`Connection profile not found at ${ccpPath}. Fabric event listener will not start.`);
        logger.info('Blockchain Bridge will continue without Fabric event listening.');
        return;
      }
      
      const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

      // Create wallet
      const walletPath = path.join(process.cwd(), 'wallets');
      const wallet = await Wallets.newFileSystemWallet(walletPath);

      // Check for admin identity
      const identity = await wallet.get('admin');
      if (!identity) {
        throw new Error('Admin identity not found in wallet');
      }

      // Connect to gateway
      this.gateway = new Gateway();
      await this.gateway.connect(ccp, {
        wallet,
        identity: 'admin',
        discovery: { enabled: true, asLocalhost: true }
      });

      // Get network and contract
      this.network = await this.gateway.getNetwork(process.env.CHANNEL_NAME || 'coffeechannel');
      this.contract = this.network.getContract(process.env.CHAINCODE_NAME || 'ecta');

      // Register event listeners
      await this.registerEventListeners();

      logger.info('Fabric Event Listener started successfully');
    } catch (error) {
      logger.error('Failed to start Fabric Event Listener:', error);
      throw error;
    }
  }

  /**
   * Register all event listeners
   */
  private static async registerEventListeners(): Promise<void> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    // Listen to all chaincode events
    this.listener = await this.contract.addContractListener(
      async (event) => {
        try {
          const eventName = event.eventName;
          const payload = event.payload?.toString() || '';
          
          logger.info(`Received Fabric event: ${eventName}`);
          logger.debug(`Event payload: ${payload}`);

          // Parse event data
          const eventData = JSON.parse(payload);

          // Publish to Kafka
          await KafkaProducer.publish('fabric.events', {
            eventName,
            eventData,
            timestamp: new Date().toISOString()
          });

          // Route to appropriate handler
          await this.handleEvent(eventName, eventData);
        } catch (error) {
          logger.error('Error processing Fabric event:', error);
        }
      },
      {
        type: 'full'
      }
    );

    logger.info('Event listeners registered');
  }

  /**
   * Handle specific event types
   */
  private static async handleEvent(eventName: string, eventData: any): Promise<void> {
    try {
      switch (eventName) {
        case 'UserRegistered':
          await this.handleUserRegistered(eventData);
          break;
        
        case 'ExporterProfileUpdated':
          await this.handleExporterProfileUpdated(eventData);
          break;
        
        case 'LicenseIssued':
          await this.handleLicenseIssued(eventData);
          break;
        
        case 'LicenseRevoked':
          await this.handleLicenseRevoked(eventData);
          break;
        
        case 'CertificateRequested':
          await this.handleCertificateRequested(eventData);
          break;
        
        case 'CertificateIssued':
          await this.handleCertificateIssued(eventData);
          break;
        
        case 'ShipmentCreated':
          await this.handleShipmentCreated(eventData);
          break;
        
        case 'ContractApproved':
          await this.handleContractApproved(eventData);
          break;
        
        case 'PaymentVerified':
          await this.handlePaymentVerified(eventData);
          break;
        
        case 'CustomsCleared':
          await this.handleCustomsCleared(eventData);
          break;
        
        case 'ESWSubmitted':
          await this.handleESWSubmitted(eventData);
          break;
        
        case 'ESWApproved':
          await this.handleESWApproved(eventData);
          break;
        
        default:
          logger.warn(`Unhandled event type: ${eventName}`);
      }
    } catch (error) {
      logger.error(`Error handling event ${eventName}:`, error);
      
      // Publish to dead letter queue
      await KafkaProducer.publish('fabric.events.dlq', {
        eventName,
        eventData,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Event Handlers
   */

  private static async handleUserRegistered(data: any): Promise<void> {
    logger.info(`Syncing user registration to CBC: ${data.username}`);
    
    if (data.role === 'exporter') {
      await CBCClient.createExporterProfile({
        exporterId: data.username,
        userId: data.username,
        businessName: data.companyName || '',
        tin: data.tin || '',
        status: 'PENDING_APPROVAL',
        createdAt: data.timestamp
      });
    }
  }

  private static async handleExporterProfileUpdated(data: any): Promise<void> {
    logger.info(`Syncing exporter profile update to CBC: ${data.exporterId}`);
    
    await CBCClient.updateExporterProfile(data.exporterId, {
      status: data.status,
      updatedAt: data.timestamp
    });
  }

  private static async handleLicenseIssued(data: any): Promise<void> {
    logger.info(`Syncing license issuance to CBC: ${data.licenseId}`);
    
    await CBCClient.createLicense({
      licenseId: data.licenseId,
      exporterId: data.exporterId,
      licenseNumber: data.licenseNumber,
      issueDate: data.issueDate,
      expiryDate: data.expiryDate,
      status: 'ACTIVE',
      issuedBy: data.issuedBy
    });
  }

  private static async handleLicenseRevoked(data: any): Promise<void> {
    logger.info(`Syncing license revocation to CBC: ${data.licenseId}`);
    
    await CBCClient.updateLicenseStatus(data.licenseId, {
      status: 'REVOKED',
      revokedAt: data.timestamp,
      revocationReason: data.reason
    });
  }

  private static async handleCertificateRequested(data: any): Promise<void> {
    logger.info(`Syncing certificate request to CBC: ${data.certificateId}`);
    
    await CBCClient.createCertificateRequest({
      certificateId: data.certificateId,
      shipmentId: data.shipmentId,
      exporterId: data.exporterId,
      certificateType: data.certificateType,
      status: 'PENDING',
      requestedAt: data.timestamp
    });
  }

  private static async handleCertificateIssued(data: any): Promise<void> {
    logger.info(`Syncing certificate issuance to CBC: ${data.certificateId}`);
    
    await CBCClient.updateCertificateStatus(data.certificateId, {
      status: 'ISSUED',
      certificateNumber: data.certificateNumber,
      issuedAt: data.timestamp,
      issuedBy: data.issuedBy
    });
  }

  private static async handleShipmentCreated(data: any): Promise<void> {
    logger.info(`Syncing shipment creation to CBC: ${data.shipmentId}`);
    
    await CBCClient.createShipment({
      shipmentId: data.shipmentId,
      exporterId: data.exporterId,
      status: 'CREATED',
      createdAt: data.timestamp
    });
  }

  private static async handleContractApproved(data: any): Promise<void> {
    logger.info(`Syncing contract approval to CBC: ${data.shipmentId}`);
    
    await CBCClient.updateShipmentStatus(data.shipmentId, {
      contractStatus: 'APPROVED',
      approvedBy: data.approvedBy,
      approvedAt: data.timestamp
    });
  }

  private static async handlePaymentVerified(data: any): Promise<void> {
    logger.info(`Syncing payment verification to CBC: ${data.shipmentId}`);
    
    await CBCClient.updateShipmentStatus(data.shipmentId, {
      paymentStatus: 'VERIFIED',
      verifiedBy: data.verifiedBy,
      verifiedAt: data.timestamp
    });
  }

  private static async handleCustomsCleared(data: any): Promise<void> {
    logger.info(`Syncing customs clearance to CBC: ${data.declarationId}`);
    
    await CBCClient.updateCustomsDeclaration(data.declarationId, {
      status: 'CLEARED',
      clearedBy: data.clearedBy,
      clearedAt: data.timestamp
    });
  }

  private static async handleESWSubmitted(data: any): Promise<void> {
    logger.info(`Syncing ESW submission to CBC: ${data.submissionId}`);
    
    await CBCClient.createESWSubmission({
      submissionId: data.submissionId,
      exportId: data.exportId,
      exporterId: data.exporterId,
      status: 'SUBMITTED',
      submittedAt: data.timestamp
    });
  }

  private static async handleESWApproved(data: any): Promise<void> {
    logger.info(`Syncing ESW approval to CBC: ${data.submissionId}`);
    
    await CBCClient.updateESWStatus(data.submissionId, {
      status: 'APPROVED',
      approvedBy: data.approvedBy,
      approvedAt: data.timestamp
    });
  }

  /**
   * Stop listening to events
   */
  static async stop(): Promise<void> {
    try {
      if (this.listener) {
        this.listener.unregister();
        this.listener = null;
      }

      if (this.gateway) {
        this.gateway.disconnect();
        this.gateway = null;
      }

      logger.info('Fabric Event Listener stopped');
    } catch (error) {
      logger.error('Error stopping Fabric Event Listener:', error);
      throw error;
    }
  }
}
