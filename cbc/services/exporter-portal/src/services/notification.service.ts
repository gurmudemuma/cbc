/**
 * Notification Service
 * Handles email and in-app notifications for contract activities
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';
import { createLogger } from '../../../shared/logger';
import {
  ContractNotification,
  NotificationType,
  ContractDraft,
} from '../types/contract.types';

const logger = createLogger('NotificationService');

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

export class NotificationService {
  private emailTransporter: nodemailer.Transporter | null = null;

  constructor(private pool: Pool, emailConfig?: EmailConfig) {
    if (emailConfig) {
      this.emailTransporter = nodemailer.createTransport(emailConfig);
    }
  }

  /**
   * Send email notification
   */
  async sendEmailNotification(
    recipientEmail: string,
    subject: string,
    htmlContent: string,
    textContent?: string
  ): Promise<boolean> {
    if (!this.emailTransporter) {
      logger.warn('Email transporter not configured, skipping email notification');
      return false;
    }

    try {
      await this.emailTransporter.sendMail({
        to: recipientEmail,
        subject,
        html: htmlContent,
        text: textContent || htmlContent,
      });

      logger.info(`Email sent to ${recipientEmail}: ${subject}`);
      return true;
    } catch (error) {
      logger.error(`Error sending email to ${recipientEmail}: ${error}`);
      return false;
    }
  }

  /**
   * Create in-app notification
   */
  async createNotification(
    draftId: string,
    recipientId: string,
    recipientEmail: string,
    notificationType: NotificationType,
    subject: string,
    message: string,
    actionLink?: string
  ): Promise<ContractNotification> {
    try {
      const notificationId = uuidv4();
      const now = new Date();

      const query = `
        INSERT INTO contract_notifications (
          notification_id, draft_id, recipient_id, recipient_email,
          notification_type, subject, message, action_link, is_read, sent_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const values = [
        notificationId,
        draftId,
        recipientId,
        recipientEmail,
        notificationType,
        subject,
        message,
        actionLink || null,
        false,
        now,
      ];

      const result = await this.pool.query(query, values);
      logger.info(`Notification created: ${notificationId} for ${recipientEmail}`);

      return this.mapRowToNotification(result.rows[0]);
    } catch (error) {
      logger.error(`Error creating notification: ${error}`);
      throw error;
    }
  }

  /**
   * Get notifications for a user
   */
  async getNotifications(
    userId: string,
    unreadOnly: boolean = false
  ): Promise<ContractNotification[]> {
    try {
      let query = `
        SELECT * FROM contract_notifications
        WHERE recipient_id = $1
      `;
      const values: any[] = [userId];

      if (unreadOnly) {
        query += ` AND is_read = false`;
      }

      query += ` ORDER BY sent_at DESC`;

      const result = await this.pool.query(query, values);
      return result.rows.map((row) => this.mapRowToNotification(row));
    } catch (error) {
      logger.error(`Error retrieving notifications for user ${userId}: ${error}`);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<ContractNotification> {
    try {
      const now = new Date();
      const query = `
        UPDATE contract_notifications
        SET is_read = true, read_at = $1
        WHERE notification_id = $2
        RETURNING *
      `;

      const result = await this.pool.query(query, [now, notificationId]);
      if (result.rows.length === 0) {
        throw new Error(`Notification ${notificationId} not found`);
      }

      logger.info(`Notification marked as read: ${notificationId}`);
      return this.mapRowToNotification(result.rows[0]);
    } catch (error) {
      logger.error(`Error marking notification as read: ${error}`);
      throw error;
    }
  }

  /**
   * Send contract sent notification
   */
  async notifyContractSent(
    contract: ContractDraft,
    buyerPortalLink: string
  ): Promise<void> {
    const subject = `New Sales Contract from ${contract.buyer_name}`;
    const htmlContent = this.generateContractSentEmail(contract, buyerPortalLink);

    // Send email
    await this.sendEmailNotification(contract.buyer_email, subject, htmlContent);

    // Create in-app notification
    await this.createNotification(
      contract.draft_id,
      '', // buyer_id not yet assigned
      contract.buyer_email,
      NotificationType.CONTRACT_SENT,
      subject,
      `You have received a new sales contract for ${contract.coffee_type}`,
      buyerPortalLink
    );
  }

  /**
   * Send contract accepted notification
   */
  async notifyContractAccepted(
    contract: ContractDraft,
    exporterEmail: string,
    exporterId: string
  ): Promise<void> {
    const subject = `Contract Accepted by ${contract.buyer_name}`;
    const htmlContent = this.generateContractAcceptedEmail(contract);

    // Send email
    await this.sendEmailNotification(exporterEmail, subject, htmlContent);

    // Create in-app notification
    await this.createNotification(
      contract.draft_id,
      exporterId,
      exporterEmail,
      NotificationType.CONTRACT_ACCEPTED,
      subject,
      `${contract.buyer_name} has accepted your contract for ${contract.coffee_type}`
    );
  }

  /**
   * Send contract rejected notification
   */
  async notifyContractRejected(
    contract: ContractDraft,
    exporterEmail: string,
    exporterId: string,
    rejectionReason: string
  ): Promise<void> {
    const subject = `Contract Rejected by ${contract.buyer_name}`;
    const htmlContent = this.generateContractRejectedEmail(contract, rejectionReason);

    // Send email
    await this.sendEmailNotification(exporterEmail, subject, htmlContent);

    // Create in-app notification
    await this.createNotification(
      contract.draft_id,
      exporterId,
      exporterEmail,
      NotificationType.CONTRACT_REJECTED,
      subject,
      `${contract.buyer_name} has rejected your contract. Reason: ${rejectionReason}`
    );
  }

  /**
   * Send counter-offer notification
   */
  async notifyCounterOffer(
    contract: ContractDraft,
    exporterEmail: string,
    exporterId: string,
    modifications: Record<string, any>
  ): Promise<void> {
    const subject = `Counter-Offer from ${contract.buyer_name}`;
    const htmlContent = this.generateCounterOfferEmail(contract, modifications);

    // Send email
    await this.sendEmailNotification(exporterEmail, subject, htmlContent);

    // Create in-app notification
    await this.createNotification(
      contract.draft_id,
      exporterId,
      exporterEmail,
      NotificationType.CONTRACT_COUNTERED,
      subject,
      `${contract.buyer_name} has submitted a counter-offer for your contract`
    );
  }

  /**
   * Send counter-offer accepted notification
   */
  async notifyCounterOfferAccepted(
    contract: ContractDraft,
    buyerEmail: string
  ): Promise<void> {
    const subject = `Your Counter-Offer Has Been Accepted`;
    const htmlContent = this.generateCounterOfferAcceptedEmail(contract);

    // Send email
    await this.sendEmailNotification(buyerEmail, subject, htmlContent);

    // Create in-app notification
    await this.createNotification(
      contract.draft_id,
      '', // buyer_id
      buyerEmail,
      NotificationType.COUNTER_ACCEPTED,
      subject,
      `Your counter-offer for ${contract.coffee_type} has been accepted`
    );
  }

  /**
   * Send contract finalized notification
   */
  async notifyContractFinalized(
    contract: ContractDraft,
    buyerEmail: string,
    blockchainHash: string
  ): Promise<void> {
    const subject = `Contract Finalized and Registered`;
    const htmlContent = this.generateContractFinalizedEmail(contract, blockchainHash);

    // Send email
    await this.sendEmailNotification(buyerEmail, subject, htmlContent);

    // Create in-app notification
    await this.createNotification(
      contract.draft_id,
      '', // buyer_id
      buyerEmail,
      NotificationType.CONTRACT_FINALIZED,
      subject,
      `Your contract for ${contract.coffee_type} has been finalized and registered on the blockchain`
    );
  }

  /**
   * Send ECTA registration notification
   */
  async notifyEctaRegistration(
    contract: ContractDraft,
    exporterEmail: string,
    exporterId: string,
    ectaReferenceNumber: string
  ): Promise<void> {
    const subject = `ECTA Registration Complete - Reference: ${ectaReferenceNumber}`;
    const htmlContent = this.generateEctaRegistrationEmail(contract, ectaReferenceNumber);

    // Send email
    await this.sendEmailNotification(exporterEmail, subject, htmlContent);

    // Create in-app notification
    await this.createNotification(
      contract.draft_id,
      exporterId,
      exporterEmail,
      NotificationType.ECTA_REGISTERED,
      subject,
      `Your contract has been registered with ECTA. Reference: ${ectaReferenceNumber}`
    );
  }

  /**
   * Send certificate ready notification
   */
  async notifyCertificateReady(
    contract: ContractDraft,
    exporterEmail: string,
    exporterId: string,
    downloadLink: string
  ): Promise<void> {
    const subject = `Contract Certificate Ready for Download`;
    const htmlContent = this.generateCertificateReadyEmail(contract, downloadLink);

    // Send email
    await this.sendEmailNotification(exporterEmail, subject, htmlContent);

    // Create in-app notification
    await this.createNotification(
      contract.draft_id,
      exporterId,
      exporterEmail,
      NotificationType.CERTIFICATE_READY,
      subject,
      `Your contract certificate is ready for download`,
      downloadLink
    );
  }

  /**
   * Email template generators
   */

  private generateContractSentEmail(contract: ContractDraft, buyerPortalLink: string): string {
    return `
      <h2>New Sales Contract</h2>
      <p>Dear ${contract.buyer_name},</p>
      <p>You have received a new sales contract for ${contract.coffee_type}.</p>
      <h3>Contract Details:</h3>
      <ul>
        <li><strong>Coffee Type:</strong> ${contract.coffee_type}</li>
        <li><strong>Quantity:</strong> ${contract.quantity_bags} bags</li>
        <li><strong>Unit Price:</strong> ${contract.currency} ${contract.unit_price}</li>
        <li><strong>Payment Terms:</strong> ${contract.payment_terms}</li>
        <li><strong>Delivery Location:</strong> ${contract.delivery_location}</li>
        <li><strong>Delivery Date:</strong> ${new Date(contract.delivery_date).toLocaleDateString()}</li>
      </ul>
      <p><a href="${buyerPortalLink}">View Contract in Buyer Portal</a></p>
      <p>Best regards,<br/>Coffee Export Consortium</p>
    `;
  }

  private generateContractAcceptedEmail(contract: ContractDraft): string {
    return `
      <h2>Contract Accepted</h2>
      <p>Great news! Your contract for ${contract.coffee_type} has been accepted by ${contract.buyer_name}.</p>
      <p>You can now proceed to finalize the contract to the blockchain.</p>
      <p>Best regards,<br/>Coffee Export Consortium</p>
    `;
  }

  private generateContractRejectedEmail(contract: ContractDraft, reason: string): string {
    return `
      <h2>Contract Rejected</h2>
      <p>Unfortunately, your contract for ${contract.coffee_type} has been rejected by ${contract.buyer_name}.</p>
      <h3>Rejection Reason:</h3>
      <p>${reason}</p>
      <p>You can create a new contract or contact the buyer for more information.</p>
      <p>Best regards,<br/>Coffee Export Consortium</p>
    `;
  }

  private generateCounterOfferEmail(contract: ContractDraft, modifications: Record<string, any>): string {
    const modificationsList = Object.entries(modifications)
      .map(([key, value]) => `<li><strong>${key}:</strong> ${JSON.stringify(value)}</li>`)
      .join('');

    return `
      <h2>Counter-Offer Received</h2>
      <p>${contract.buyer_name} has submitted a counter-offer for your contract.</p>
      <h3>Proposed Modifications:</h3>
      <ul>${modificationsList}</ul>
      <p>Please review and respond to the counter-offer.</p>
      <p>Best regards,<br/>Coffee Export Consortium</p>
    `;
  }

  private generateCounterOfferAcceptedEmail(contract: ContractDraft): string {
    return `
      <h2>Counter-Offer Accepted</h2>
      <p>Your counter-offer for ${contract.coffee_type} has been accepted.</p>
      <p>The contract is now ready for finalization.</p>
      <p>Best regards,<br/>Coffee Export Consortium</p>
    `;
  }

  private generateContractFinalizedEmail(contract: ContractDraft, blockchainHash: string): string {
    return `
      <h2>Contract Finalized</h2>
      <p>Your contract for ${contract.coffee_type} has been finalized and registered on the blockchain.</p>
      <h3>Blockchain Details:</h3>
      <p><strong>Transaction Hash:</strong> ${blockchainHash}</p>
      <p>Your contract is now legally binding and registered with ECTA.</p>
      <p>Best regards,<br/>Coffee Export Consortium</p>
    `;
  }

  private generateEctaRegistrationEmail(contract: ContractDraft, ectaReferenceNumber: string): string {
    return `
      <h2>ECTA Registration Complete</h2>
      <p>Your contract has been successfully registered with the Ethiopian Coffee and Tea Authority (ECTA).</p>
      <h3>Registration Details:</h3>
      <p><strong>ECTA Reference Number:</strong> ${ectaReferenceNumber}</p>
      <p><strong>Coffee Type:</strong> ${contract.coffee_type}</p>
      <p><strong>Quantity:</strong> ${contract.quantity_bags} bags</p>
      <p>You can now download your contract certificate.</p>
      <p>Best regards,<br/>Coffee Export Consortium</p>
    `;
  }

  private generateCertificateReadyEmail(contract: ContractDraft, downloadLink: string): string {
    return `
      <h2>Contract Certificate Ready</h2>
      <p>Your contract certificate for ${contract.coffee_type} is ready for download.</p>
      <p><a href="${downloadLink}">Download Certificate</a></p>
      <p>Best regards,<br/>Coffee Export Consortium</p>
    `;
  }

  /**
   * Notify exporter of blockchain submission failure
   */
  async notifyBlockchainSubmissionFailed(
    contract: ContractDraft,
    errorMessage: string
  ): Promise<void> {
    const subject = `Blockchain Submission Failed - Manual Action Required`;
    const htmlContent = this.generateBlockchainFailureEmail(contract, errorMessage);

    // Send email to exporter
    const exporterEmail = (contract as any).exporter_email || 'support@consortium.local';
    await this.sendEmailNotification(exporterEmail, subject, htmlContent);

    // Create in-app notification
    await this.createNotification(
      contract.draft_id,
      contract.exporter_id,
      exporterEmail,
      'BLOCKCHAIN_FAILED' as any,
      subject,
      `Failed to submit contract to blockchain. Please try again or contact support.`,
      `/contracts/${contract.draft_id}/retry`
    );
  }

  /**
   * Notify exporter of ECTA registration failure
   */
  async notifyEctaRegistrationFailed(
    contract: ContractDraft,
    errorMessage: string,
    manualRegistrationLink: string
  ): Promise<void> {
    const subject = `ECTA Registration Failed - Manual Registration Required`;
    const htmlContent = this.generateEctaFailureEmail(contract, errorMessage, manualRegistrationLink);

    // Send email to exporter
    const exporterEmail = (contract as any).exporter_email || 'support@consortium.local';
    await this.sendEmailNotification(exporterEmail, subject, htmlContent);

    // Create in-app notification
    await this.createNotification(
      contract.draft_id,
      contract.exporter_id,
      exporterEmail,
      'ECTA_FAILED' as any,
      subject,
      `Failed to register contract with ECTA. Please use manual registration.`,
      manualRegistrationLink
    );
  }

  /**
   * Generate blockchain failure email
   */
  private generateBlockchainFailureEmail(contract: ContractDraft, errorMessage: string): string {
    return `
      <h2>Blockchain Submission Failed</h2>
      <p>Dear Exporter,</p>
      <p>We encountered an error while submitting your contract to the blockchain.</p>
      <h3>Contract Details:</h3>
      <ul>
        <li><strong>Contract ID:</strong> ${contract.draft_id}</li>
        <li><strong>Coffee Type:</strong> ${contract.coffee_type}</li>
        <li><strong>Buyer:</strong> ${contract.buyer_name}</li>
        <li><strong>Error:</strong> ${errorMessage}</li>
      </ul>
      <p>The system will automatically retry the submission. If the issue persists, please contact support.</p>
      <p>Best regards,<br/>Coffee Export Consortium</p>
    `;
  }

  /**
   * Generate ECTA failure email
   */
  private generateEctaFailureEmail(
    contract: ContractDraft,
    errorMessage: string,
    manualRegistrationLink: string
  ): string {
    return `
      <h2>ECTA Registration Failed</h2>
      <p>Dear Exporter,</p>
      <p>We encountered an error while registering your contract with ECTA.</p>
      <h3>Contract Details:</h3>
      <ul>
        <li><strong>Contract ID:</strong> ${contract.draft_id}</li>
        <li><strong>Coffee Type:</strong> ${contract.coffee_type}</li>
        <li><strong>Buyer:</strong> ${contract.buyer_name}</li>
        <li><strong>Error:</strong> ${errorMessage}</li>
      </ul>
      <p>The system will automatically retry the registration. If the issue persists, you can use manual registration:</p>
      <p><a href="${manualRegistrationLink}">Manual Registration Link</a></p>
      <p>Best regards,<br/>Coffee Export Consortium</p>
    `;
  }

  /**
   * Private helper methods
   */

  private mapRowToNotification(row: any): ContractNotification {
    return {
      notification_id: row.notification_id,
      draft_id: row.draft_id,
      recipient_id: row.recipient_id,
      recipient_email: row.recipient_email,
      notification_type: row.notification_type,
      subject: row.subject,
      message: row.message,
      action_link: row.action_link,
      is_read: row.is_read,
      sent_at: row.sent_at,
      read_at: row.read_at,
    };
  }
}
