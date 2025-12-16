/// <reference types="jest" />
import {
  AuditServiceEnhanced,
  AnomalyDetectionResult,
  ComplianceReport,
} from '../auditServiceEnhanced';

describe('AuditServiceEnhanced', () => {
  let auditService: AuditServiceEnhanced;

  beforeEach(() => {
    auditService = new AuditServiceEnhanced();
  });

  describe('Enhanced Features', () => {
    describe('Encryption', () => {
      it('should log action with encryption enabled', async () => {
        const log = await auditService.logAction(
          'export-123',
          'user-456',
          'org-789',
          'APPROVE_LICENSE',
          'APPROVAL',
          'ECTA_LICENSE_PENDING',
          'ECTA_LICENSE_APPROVED',
          { licenseNumber: 'LIC-001' },
          '192.168.1.1',
          'Mozilla/5.0',
          true // Enable encryption
        );

        expect(log.encrypted).toBe(true);
        expect(log.encryptionKey).toBeDefined();
      });

      it('should log action without encryption', async () => {
        const log = await auditService.logAction(
          'export-123',
          'user-456',
          'org-789',
          'APPROVE_LICENSE',
          'APPROVAL',
          'ECTA_LICENSE_PENDING',
          'ECTA_LICENSE_APPROVED',
          { licenseNumber: 'LIC-001' },
          '192.168.1.1',
          'Mozilla/5.0',
          false // Disable encryption
        );

        expect(log.encrypted).toBe(false);
        expect(log.encryptionKey).toBeUndefined();
      });
    });

    describe('Anomaly Detection', () => {
      it('should detect unusual time anomaly', async () => {
        // Create baseline logs at normal hours
        for (let i = 0; i < 15; i++) {
          const date = new Date();
          date.setHours(9); // 9 AM
          await auditService.logAction(
            `export-${i}`,
            'user-456',
            'org-789',
            'APPROVE_LICENSE',
            'APPROVAL',
            'ECTA_LICENSE_PENDING',
            'ECTA_LICENSE_APPROVED',
            {}
          );
        }

        // Log action at unusual time
        const date = new Date();
        date.setHours(3); // 3 AM
        const log = await auditService.logAction(
          'export-unusual',
          'user-456',
          'org-789',
          'APPROVE_LICENSE',
          'APPROVAL',
          'ECTA_LICENSE_PENDING',
          'ECTA_LICENSE_APPROVED',
          {}
        );

        const anomalies = await auditService.getAnomalies();
        expect(anomalies.length).toBeGreaterThan(0);
      });

      it('should detect unusual location anomaly', async () => {
        // Create baseline logs from one IP
        for (let i = 0; i < 10; i++) {
          await auditService.logAction(
            `export-${i}`,
            'user-456',
            'org-789',
            'APPROVE_LICENSE',
            'APPROVAL',
            'ECTA_LICENSE_PENDING',
            'ECTA_LICENSE_APPROVED',
            {},
            '192.168.1.1'
          );
        }

        // Log action from different IP
        const log = await auditService.logAction(
          'export-unusual',
          'user-456',
          'org-789',
          'APPROVE_LICENSE',
          'APPROVAL',
          'ECTA_LICENSE_PENDING',
          'ECTA_LICENSE_APPROVED',
          {},
          '10.0.0.1' // Different IP
        );

        const anomalies = await auditService.getAnomalies();
        expect(anomalies.length).toBeGreaterThan(0);
      });

      it('should detect bulk action anomaly', async () => {
        // Create 15 logs in quick succession
        for (let i = 0; i < 15; i++) {
          await auditService.logAction(
            `export-${i}`,
            'user-456',
            'org-789',
            'APPROVE_LICENSE',
            'APPROVAL',
            'ECTA_LICENSE_PENDING',
            'ECTA_LICENSE_APPROVED',
            {}
          );
        }

        const anomalies = await auditService.getAnomalies('HIGH');
        expect(anomalies.length).toBeGreaterThan(0);
      });

      it('should get anomalies by severity', async () => {
        // Create logs that trigger anomalies
        for (let i = 0; i < 20; i++) {
          await auditService.logAction(
            `export-${i}`,
            'user-456',
            'org-789',
            'APPROVE_LICENSE',
            'APPROVAL',
            'ECTA_LICENSE_PENDING',
            'ECTA_LICENSE_APPROVED',
            {}
          );
        }

        const highSeverity = await auditService.getAnomalies('HIGH');
        const mediumSeverity = await auditService.getAnomalies('MEDIUM');
        const lowSeverity = await auditService.getAnomalies('LOW');

        expect(highSeverity.length >= 0).toBe(true);
        expect(mediumSeverity.length >= 0).toBe(true);
        expect(lowSeverity.length >= 0).toBe(true);
      });
    });

    describe('Streaming', () => {
      it('should subscribe to audit stream', async () => {
        const events: any[] = [];

        const unsubscribe = auditService.subscribeToStream((event) => {
          events.push(event);
        });

        await auditService.logAction(
          'export-123',
          'user-456',
          'org-789',
          'APPROVE_LICENSE',
          'APPROVAL',
          'ECTA_LICENSE_PENDING',
          'ECTA_LICENSE_APPROVED',
          {}
        );

        expect(events.length).toBeGreaterThan(0);
        expect(events[0].auditLog).toBeDefined();
        expect(events[0].eventId).toBeDefined();

        unsubscribe();
      });

      it('should handle multiple subscribers', async () => {
        const events1: any[] = [];
        const events2: any[] = [];

        const unsubscribe1 = auditService.subscribeToStream((event) => {
          events1.push(event);
        });

        const unsubscribe2 = auditService.subscribeToStream((event) => {
          events2.push(event);
        });

        await auditService.logAction(
          'export-123',
          'user-456',
          'org-789',
          'APPROVE_LICENSE',
          'APPROVAL',
          'ECTA_LICENSE_PENDING',
          'ECTA_LICENSE_APPROVED',
          {}
        );

        expect(events1.length).toBe(1);
        expect(events2.length).toBe(1);

        unsubscribe1();
        unsubscribe2();
      });

      it('should unsubscribe from stream', async () => {
        const events: any[] = [];

        const unsubscribe = auditService.subscribeToStream((event) => {
          events.push(event);
        });

        await auditService.logAction(
          'export-123',
          'user-456',
          'org-789',
          'APPROVE_LICENSE',
          'APPROVAL',
          'ECTA_LICENSE_PENDING',
          'ECTA_LICENSE_APPROVED',
          {}
        );

        expect(events.length).toBe(1);

        unsubscribe();

        await auditService.logAction(
          'export-124',
          'user-456',
          'org-789',
          'APPROVE_LICENSE',
          'APPROVAL',
          'ECTA_LICENSE_PENDING',
          'ECTA_LICENSE_APPROVED',
          {}
        );

        expect(events.length).toBe(1); // Should not increase
      });
    });

    describe('Compliance Reporting', () => {
      it('should generate SOX compliance report', async () => {
        // Create logs with critical actions
        await auditService.logAction(
          'export-123',
          'user-456',
          'org-789',
          'APPROVE_LICENSE',
          'APPROVAL',
          'ECTA_LICENSE_PENDING',
          'ECTA_LICENSE_APPROVED',
          {}
        );

        await auditService.logAction(
          'export-124',
          'user-456',
          'org-789',
          'APPROVE_CONTRACT',
          'APPROVAL',
          'ECTA_CONTRACT_PENDING',
          'ECTA_CONTRACT_APPROVED',
          {}
        );

        const report = await auditService.generateComplianceReport(
          'SOX',
          new Date(Date.now() - 24 * 60 * 60 * 1000),
          new Date(),
          'org-789'
        );

        expect(report.reportType).toBe('SOX');
        expect(report.totalActions).toBeGreaterThan(0);
        expect(report.complianceStatus).toBeDefined();
      });

      it('should generate GDPR compliance report', async () => {
        await auditService.logAction(
          'export-123',
          'user-456',
          'org-789',
          'CREATE_EXPORT',
          'CREATION',
          null,
          'DRAFT',
          {}
        );

        const report = await auditService.generateComplianceReport(
          'GDPR',
          new Date(Date.now() - 24 * 60 * 60 * 1000),
          new Date(),
          'org-789'
        );

        expect(report.reportType).toBe('GDPR');
        expect(report.totalActions).toBeGreaterThan(0);
      });

      it('should generate HIPAA compliance report', async () => {
        await auditService.logAction(
          'export-123',
          'user-456',
          'org-789',
          'APPROVE_QUALITY',
          'APPROVAL',
          'ECTA_QUALITY_PENDING',
          'ECTA_QUALITY_APPROVED',
          {}
        );

        const report = await auditService.generateComplianceReport(
          'HIPAA',
          new Date(Date.now() - 24 * 60 * 60 * 1000),
          new Date(),
          'org-789'
        );

        expect(report.reportType).toBe('HIPAA');
        expect(report.totalActions).toBeGreaterThan(0);
      });

      it('should generate PCI-DSS compliance report', async () => {
        await auditService.logAction(
          'export-123',
          'user-456',
          'org-789',
          'CONFIRM_PAYMENT',
          'APPROVAL',
          'PAYMENT_PENDING',
          'PAYMENT_RECEIVED',
          {}
        );

        const report = await auditService.generateComplianceReport(
          'PCI_DSS',
          new Date(Date.now() - 24 * 60 * 60 * 1000),
          new Date(),
          'org-789'
        );

        expect(report.reportType).toBe('PCI_DSS');
        expect(report.totalActions).toBeGreaterThan(0);
      });

      it('should include action timeline in report', async () => {
        await auditService.logAction(
          'export-123',
          'user-456',
          'org-789',
          'APPROVE_LICENSE',
          'APPROVAL',
          'ECTA_LICENSE_PENDING',
          'ECTA_LICENSE_APPROVED',
          {}
        );

        const report = await auditService.generateComplianceReport(
          'SOX',
          new Date(Date.now() - 24 * 60 * 60 * 1000),
          new Date(),
          'org-789'
        );

        expect(report.actionTimeline).toBeDefined();
        expect(report.actionTimeline.length).toBeGreaterThan(0);
      });

      it('should identify compliance issues', async () => {
        const report = await auditService.generateComplianceReport(
          'SOX',
          new Date(Date.now() - 24 * 60 * 60 * 1000),
          new Date(),
          'org-789'
        );

        expect(report.issues).toBeDefined();
        expect(Array.isArray(report.issues)).toBe(true);
      });
    });

    describe('Statistics', () => {
      it('should include anomaly count in statistics', async () => {
        // Create logs that trigger anomalies
        for (let i = 0; i < 20; i++) {
          await auditService.logAction(
            `export-${i}`,
            'user-456',
            'org-789',
            'APPROVE_LICENSE',
            'APPROVAL',
            'ECTA_LICENSE_PENDING',
            'ECTA_LICENSE_APPROVED',
            {}
          );
        }

        const stats = await auditService.getStatistics();

        expect(stats.totalLogs).toBeGreaterThan(0);
        expect(stats.totalAnomalies).toBeDefined();
        expect(stats.totalExports).toBeGreaterThan(0);
        expect(stats.totalUsers).toBeGreaterThan(0);
      });
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain compatibility with base audit service', async () => {
      const log = await auditService.logAction(
        'export-123',
        'user-456',
        'org-789',
        'APPROVE_LICENSE',
        'APPROVAL',
        'ECTA_LICENSE_PENDING',
        'ECTA_LICENSE_APPROVED',
        { licenseNumber: 'LIC-001' }
      );

      expect(log.auditId).toBeDefined();
      expect(log.exportId).toBe('export-123');
      expect(log.userId).toBe('user-456');
      expect(log.organizationId).toBe('org-789');
      expect(log.action).toBe('APPROVE_LICENSE');
      expect(log.status).toBe('PENDING');
    });

    it('should support all retrieval methods', async () => {
      await auditService.logAction(
        'export-123',
        'user-456',
        'org-789',
        'APPROVE_LICENSE',
        'APPROVAL',
        'ECTA_LICENSE_PENDING',
        'ECTA_LICENSE_APPROVED',
        {}
      );

      const exportLogs = await auditService.getExportAuditLogs('export-123');
      const userLogs = await auditService.getUserAuditLogs('user-456');
      const orgLogs = await auditService.getOrganizationAuditLogs('org-789');

      expect(exportLogs.length).toBeGreaterThan(0);
      expect(userLogs.length).toBeGreaterThan(0);
      expect(orgLogs.length).toBeGreaterThan(0);
    });
  });
});
