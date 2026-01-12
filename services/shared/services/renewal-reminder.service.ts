/**
 * Renewal Reminder Service
 * Automated notifications for expiring licenses and certificates
 */

import { getPool } from '../database/pool';
import * as cron from 'node-cron';

const pool = getPool();

export interface RenewalReminder {
  reminderId: string;
  entityId: string;
  entityType: 'competence_certificate' | 'export_license' | 'laboratory' | 'taster';
  entityName: string;
  expiryDate: string;
  daysUntilExpiry: number;
  reminderType: 'early_warning' | 'urgent_warning' | 'expired';
  notificationSent: boolean;
  sentAt?: string;
  exporterEmail: string;
  exporterName: string;
}

export interface NotificationTemplate {
  subject: string;
  body: string;
  urgencyLevel: 'info' | 'warning' | 'critical';
}

export class RenewalReminderService {
  private isSchedulerRunning = false;

  constructor() {
    this.startScheduler();
  }

  /**
   * Start the automated renewal reminder scheduler
   */
  startScheduler(): void {
    if (this.isSchedulerRunning) {
      console.log('Renewal reminder scheduler is already running');
      return;
    }

    // Run daily at 9:00 AM
    cron.schedule('0 9 * * *', async () => {
      console.log('🔔 Running daily renewal reminder check...');
      await this.checkAndSendReminders();
    });

    // Run weekly summary on Mondays at 10:00 AM
    cron.schedule('0 10 * * 1', async () => {
      console.log('📊 Running weekly renewal summary...');
      await this.sendWeeklyRenewalSummary();
    });

    this.isSchedulerRunning = true;
    console.log('✅ Renewal reminder scheduler started');
  }

  /**
   * Stop the scheduler
   */
  stopScheduler(): void {
    // Note: node-cron doesn't provide a direct way to stop specific tasks
    // In a production environment, you'd want to track task references
    this.isSchedulerRunning = false;
    console.log('⏹️ Renewal reminder scheduler stopped');
  }

  /**
   * Check for expiring items and send reminders
   */
  async checkAndSendReminders(): Promise<void> {
    try {
      const reminders = await this.getExpiringItems();

      for (const reminder of reminders) {
        await this.sendRenewalReminder(reminder);
      }

      console.log(`📧 Processed ${reminders.length} renewal reminders`);
    } catch (error) {
      console.error('❌ Error checking renewal reminders:', error);
    }
  }

  /**
   * Get all expiring items that need reminders
   */
  async getExpiringItems(): Promise<RenewalReminder[]> {
    const reminders: RenewalReminder[] = [];

    // Check competence certificates
    const competenceCerts = await this.getExpiringCompetenceCertificates();
    reminders.push(...competenceCerts);

    // Check export licenses
    const exportLicenses = await this.getExpiringExportLicenses();
    reminders.push(...exportLicenses);

    // Check laboratory certifications
    const laboratories = await this.getExpiringLaboratories();
    reminders.push(...laboratories);

    // Check taster certifications
    const tasters = await this.getExpiringTasters();
    reminders.push(...tasters);

    return reminders;
  }

  /**
   * Get expiring competence certificates
   */
  private async getExpiringCompetenceCertificates(): Promise<RenewalReminder[]> {
    const query = `
      SELECT 
        cc.certificate_id,
        cc.certificate_number,
        cc.expiry_date,
        ep.exporter_id,
        ep.business_name,
        ep.email,
        EXTRACT(DAY FROM cc.expiry_date - CURRENT_DATE) as days_until_expiry
      FROM competence_certificates cc
      JOIN exporter_profiles ep ON cc.exporter_id = ep.exporter_id
      WHERE cc.status = 'ACTIVE'
      AND cc.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days'
      ORDER BY cc.expiry_date ASC
    `;

    const result = await pool.query(query);

    return result.rows.map((row: any) => ({
      reminderId: `comp_cert_${row.certificate_id}`,
      entityId: row.certificate_id,
      entityType: 'competence_certificate' as const,
      entityName: `Competence Certificate ${row.certificate_number}`,
      expiryDate: row.expiry_date,
      daysUntilExpiry: parseInt(row.days_until_expiry),
      reminderType: this.getReminderType(parseInt(row.days_until_expiry)),
      notificationSent: false,
      exporterEmail: row.email,
      exporterName: row.business_name
    }));
  }

  /**
   * Get expiring export licenses
   */
  private async getExpiringExportLicenses(): Promise<RenewalReminder[]> {
    const query = `
      SELECT 
        el.license_id,
        el.license_number,
        el.expiry_date,
        ep.exporter_id,
        ep.business_name,
        ep.email,
        EXTRACT(DAY FROM el.expiry_date - CURRENT_DATE) as days_until_expiry
      FROM export_licenses el
      JOIN exporter_profiles ep ON el.exporter_id = ep.exporter_id
      WHERE el.status = 'ACTIVE'
      AND el.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days'
      ORDER BY el.expiry_date ASC
    `;

    const result = await pool.query(query);

    return result.rows.map((row: any) => ({
      reminderId: `export_license_${row.license_id}`,
      entityId: row.license_id,
      entityType: 'export_license' as const,
      entityName: `Export License ${row.license_number}`,
      expiryDate: row.expiry_date,
      daysUntilExpiry: parseInt(row.days_until_expiry),
      reminderType: this.getReminderType(parseInt(row.days_until_expiry)),
      notificationSent: false,
      exporterEmail: row.email,
      exporterName: row.business_name
    }));
  }

  /**
   * Get expiring laboratory certifications
   */
  private async getExpiringLaboratories(): Promise<RenewalReminder[]> {
    const query = `
      SELECT 
        cl.laboratory_id,
        cl.laboratory_name,
        cl.expiry_date,
        ep.exporter_id,
        ep.business_name,
        ep.email,
        EXTRACT(DAY FROM cl.expiry_date - CURRENT_DATE) as days_until_expiry
      FROM coffee_laboratories cl
      JOIN exporter_profiles ep ON cl.exporter_id = ep.exporter_id
      WHERE cl.status = 'ACTIVE'
      AND cl.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days'
      ORDER BY cl.expiry_date ASC
    `;

    const result = await pool.query(query);

    return result.rows.map((row: any) => ({
      reminderId: `laboratory_${row.laboratory_id}`,
      entityId: row.laboratory_id,
      entityType: 'laboratory' as const,
      entityName: `Laboratory: ${row.laboratory_name}`,
      expiryDate: row.expiry_date,
      daysUntilExpiry: parseInt(row.days_until_expiry),
      reminderType: this.getReminderType(parseInt(row.days_until_expiry)),
      notificationSent: false,
      exporterEmail: row.email,
      exporterName: row.business_name
    }));
  }

  /**
   * Get expiring taster certifications
   */
  private async getExpiringTasters(): Promise<RenewalReminder[]> {
    const query = `
      SELECT 
        ct.taster_id,
        ct.full_name,
        ct.certificate_expiry_date as expiry_date,
        ep.exporter_id,
        ep.business_name,
        ep.email,
        EXTRACT(DAY FROM ct.certificate_expiry_date - CURRENT_DATE) as days_until_expiry
      FROM coffee_tasters ct
      JOIN exporter_profiles ep ON ct.exporter_id = ep.exporter_id
      WHERE ct.status = 'ACTIVE'
      AND ct.certificate_expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days'
      ORDER BY ct.certificate_expiry_date ASC
    `;

    const result = await pool.query(query);

    return result.rows.map((row: any) => ({
      reminderId: `taster_${row.taster_id}`,
      entityId: row.taster_id,
      entityType: 'taster' as const,
      entityName: `Taster: ${row.full_name}`,
      expiryDate: row.expiry_date,
      daysUntilExpiry: parseInt(row.days_until_expiry),
      reminderType: this.getReminderType(parseInt(row.days_until_expiry)),
      notificationSent: false,
      exporterEmail: row.email,
      exporterName: row.business_name
    }));
  }

  /**
   * Determine reminder type based on days until expiry
   */
  private getReminderType(daysUntilExpiry: number): RenewalReminder['reminderType'] {
    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 14) return 'urgent_warning';
    return 'early_warning';
  }

  /**
   * Send renewal reminder notification
   */
  async sendRenewalReminder(reminder: RenewalReminder): Promise<void> {
    try {
      const template = this.getNotificationTemplate(reminder);

      // In a real implementation, you would integrate with an email service
      // For now, we'll log the notification
      console.log(`📧 Sending ${reminder.reminderType} reminder to ${reminder.exporterEmail}`);
      console.log(`Subject: ${template.subject}`);
      console.log(`Body: ${template.body}`);

      // Mark as sent (in a real implementation, you'd store this in a notifications table)
      await this.markReminderSent(reminder.reminderId);

    } catch (error) {
      console.error(`❌ Failed to send reminder for ${reminder.entityName}:`, error);
    }
  }

  /**
   * Get notification template based on reminder type
   */
  private getNotificationTemplate(reminder: RenewalReminder): NotificationTemplate {
    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString();

    switch (reminder.reminderType) {
      case 'early_warning':
        return {
          subject: `Renewal Reminder: ${reminder.entityName} expires in ${reminder.daysUntilExpiry} days`,
          body: `
Dear ${reminder.exporterName},

This is a friendly reminder that your ${reminder.entityName} will expire on ${formatDate(reminder.expiryDate)} (in ${reminder.daysUntilExpiry} days).

To ensure uninterrupted export operations, please begin the renewal process soon.

Required actions:
- Contact ECTA to initiate renewal process
- Prepare required documentation
- Schedule any necessary inspections

For assistance, please contact ECTA at info@ecta.gov.et

Best regards,
Ethiopian Coffee & Tea Authority
          `,
          urgencyLevel: 'info'
        };

      case 'urgent_warning':
        return {
          subject: `URGENT: ${reminder.entityName} expires in ${reminder.daysUntilExpiry} days`,
          body: `
Dear ${reminder.exporterName},

⚠️ URGENT RENEWAL REQUIRED ⚠️

Your ${reminder.entityName} will expire on ${formatDate(reminder.expiryDate)} (in ${reminder.daysUntilExpiry} days).

IMMEDIATE ACTION REQUIRED:
- Contact ECTA immediately to renew
- Submit renewal application today
- Provide all required documentation

Failure to renew will result in suspension of export privileges.

Contact ECTA urgently: info@ecta.gov.et | +251-11-XXX-XXXX

Ethiopian Coffee & Tea Authority
          `,
          urgencyLevel: 'warning'
        };

      case 'expired':
        return {
          subject: `EXPIRED: ${reminder.entityName} - Export privileges suspended`,
          body: `
Dear ${reminder.exporterName},

🚨 CRITICAL NOTICE 🚨

Your ${reminder.entityName} expired on ${formatDate(reminder.expiryDate)}.

Your export privileges have been SUSPENDED until renewal is completed.

IMMEDIATE ACTIONS REQUIRED:
1. Contact ECTA immediately for emergency renewal
2. Submit complete renewal application
3. Pay any applicable penalties
4. Complete required inspections

No export requests can be processed until renewal is complete.

Emergency contact: info@ecta.gov.et | +251-11-XXX-XXXX

Ethiopian Coffee & Tea Authority
          `,
          urgencyLevel: 'critical'
        };

      default:
        throw new Error(`Unknown reminder type: ${reminder.reminderType}`);
    }
  }

  /**
   * Mark reminder as sent
   */
  private async markReminderSent(reminderId: string): Promise<void> {
    // In a real implementation, you'd update a notifications table
    console.log(`✅ Marked reminder ${reminderId} as sent`);
  }

  /**
   * Send weekly renewal summary to ECTA
   */
  async sendWeeklyRenewalSummary(): Promise<void> {
    try {
      const reminders = await this.getExpiringItems();

      const summary = {
        totalExpiring: reminders.length,
        expired: reminders.filter(r => r.reminderType === 'expired').length,
        urgent: reminders.filter(r => r.reminderType === 'urgent_warning').length,
        early: reminders.filter(r => r.reminderType === 'early_warning').length,
        byType: {
          competenceCertificates: reminders.filter(r => r.entityType === 'competence_certificate').length,
          exportLicenses: reminders.filter(r => r.entityType === 'export_license').length,
          laboratories: reminders.filter(r => r.entityType === 'laboratory').length,
          tasters: reminders.filter(r => r.entityType === 'taster').length
        }
      };

      console.log('📊 Weekly Renewal Summary:', summary);

      // In a real implementation, send this to ECTA administrators

    } catch (error) {
      console.error('❌ Error generating weekly renewal summary:', error);
    }
  }

  /**
   * Manual trigger for testing
   */
  async triggerManualCheck(): Promise<RenewalReminder[]> {
    console.log('🔧 Manual renewal check triggered');
    const reminders = await this.getExpiringItems();

    for (const reminder of reminders) {
      await this.sendRenewalReminder(reminder);
    }

    return reminders;
  }
}

// Singleton instance
let renewalReminderService: RenewalReminderService | null = null;

export const getRenewalReminderService = (): RenewalReminderService => {
  if (!renewalReminderService) {
    renewalReminderService = new RenewalReminderService();
  }
  return renewalReminderService;
};
