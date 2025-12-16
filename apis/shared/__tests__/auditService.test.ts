/// <reference types="jest" />
import { AuditService } from '../auditService';

describe('AuditService', () => {
  let auditService: AuditService;

  beforeEach(() => {
    auditService = new AuditService();
  });

  describe('logAction', () => {
    it('should create audit log entry', async () => {
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
      expect(log.actionType).toBe('APPROVAL');
      expect(log.previousStatus).toBe('ECTA_LICENSE_PENDING');
      expect(log.newStatus).toBe('ECTA_LICENSE_APPROVED');
      expect(log.status).toBe('PENDING');
    });

    it('should set default values for optional fields', async () => {
      const log = await auditService.logAction(
        'export-123',
        'user-456',
        'org-789',
        'CREATE_EXPORT',
        'CREATION',
        null,
        'DRAFT',
        {}
      );

      expect(log.ipAddress).toBe('UNKNOWN');
      expect(log.userAgent).toBe('UNKNOWN');
    });

    it('should set provided IP address and user agent', async () => {
      const log = await auditService.logAction(
        'export-123',
        'user-456',
        'org-789',
        'APPROVE_LICENSE',
        'APPROVAL',
        'ECTA_LICENSE_PENDING',
        'ECTA_LICENSE_APPROVED',
        {},
        '192.168.1.1',
        'Mozilla/5.0'
      );

      expect(log.ipAddress).toBe('192.168.1.1');
      expect(log.userAgent).toBe('Mozilla/5.0');
    });
  });

  describe('updateBlockchainReference', () => {
    it('should update audit log with blockchain reference', async () => {
      const log = await auditService.logAction(
        'export-123',
        'user-456',
        'org-789',
        'APPROVE_LICENSE',
        'APPROVAL',
        'ECTA_LICENSE_PENDING',
        'ECTA_LICENSE_APPROVED',
        {}
      );

      await auditService.updateBlockchainReference(log.auditId, 'tx-001', 12345);

      const updated = await auditService.getAuditLog(log.auditId);
      expect(updated?.blockchainTransactionId).toBe('tx-001');
      expect(updated?.blockchainBlockNumber).toBe(12345);
      expect(updated?.status).toBe('RECORDED');
    });
  });

  describe('getExportAuditLogs', () => {
    it('should retrieve all logs for an export', async () => {
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

      const logs = await auditService.getExportAuditLogs('export-123');
      expect(logs.length).toBe(2);
      expect(logs[0].action).toBe('APPROVE_LICENSE'); // Most recent first
      expect(logs[1].action).toBe('CREATE_EXPORT');
    });

    it('should return empty array for non-existent export', async () => {
      const logs = await auditService.getExportAuditLogs('non-existent');
      expect(logs).toEqual([]);
    });
  });

  describe('getUserAuditLogs', () => {
    it('should retrieve all logs for a user', async () => {
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

      const logs = await auditService.getUserAuditLogs('user-456');
      expect(logs.length).toBe(2);
    });

    it('should respect limit parameter', async () => {
      for (let i = 0; i < 5; i++) {
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

      const logs = await auditService.getUserAuditLogs('user-456', 3);
      expect(logs.length).toBe(3);
    });
  });

  describe('getOrganizationAuditLogs', () => {
    it('should retrieve logs for an organization', async () => {
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
        'user-457',
        'org-789',
        'APPROVE_CONTRACT',
        'APPROVAL',
        'ECTA_CONTRACT_PENDING',
        'ECTA_CONTRACT_APPROVED',
        {}
      );

      const logs = await auditService.getOrganizationAuditLogs('org-789');
      expect(logs.length).toBe(2);
    });

    it('should filter by date range', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

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

      const logs = await auditService.getOrganizationAuditLogs('org-789', yesterday, tomorrow);
      expect(logs.length).toBe(1);

      const logsAfter = await auditService.getOrganizationAuditLogs('org-789', tomorrow);
      expect(logsAfter.length).toBe(0);
    });
  });

  describe('getAuditLogsByAction', () => {
    it('should retrieve logs by action', async () => {
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
        'APPROVE_LICENSE',
        'APPROVAL',
        'ECTA_LICENSE_PENDING',
        'ECTA_LICENSE_APPROVED',
        {}
      );

      await auditService.logAction(
        'export-125',
        'user-456',
        'org-789',
        'APPROVE_CONTRACT',
        'APPROVAL',
        'ECTA_CONTRACT_PENDING',
        'ECTA_CONTRACT_APPROVED',
        {}
      );

      const logs = await auditService.getAuditLogsByAction('APPROVE_LICENSE');
      expect(logs.length).toBe(2);
    });
  });

  describe('generateAuditReport', () => {
    it('should generate audit report', async () => {
      const startDate = new Date();
      const endDate = new Date();

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
        'user-457',
        'org-789',
        'APPROVE_CONTRACT',
        'APPROVAL',
        'ECTA_CONTRACT_PENDING',
        'ECTA_CONTRACT_APPROVED',
        {}
      );

      const report = await auditService.generateAuditReport(startDate, endDate);

      expect(report.totalActions).toBe(2);
      expect(report.actionBreakdown.length).toBe(2);
      expect(report.actionBreakdown[0].count).toBeGreaterThanOrEqual(1);
    });

    it('should filter by organization', async () => {
      const startDate = new Date();
      const endDate = new Date();

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
        'user-457',
        'org-790',
        'APPROVE_CONTRACT',
        'APPROVAL',
        'ECTA_CONTRACT_PENDING',
        'ECTA_CONTRACT_APPROVED',
        {}
      );

      const report = await auditService.generateAuditReport(startDate, endDate, 'org-789');
      expect(report.totalActions).toBe(1);
    });
  });

  describe('verifyAuditLogIntegrity', () => {
    it('should verify pending audit log', async () => {
      const log = await auditService.logAction(
        'export-123',
        'user-456',
        'org-789',
        'APPROVE_LICENSE',
        'APPROVAL',
        'ECTA_LICENSE_PENDING',
        'ECTA_LICENSE_APPROVED',
        {}
      );

      const isValid = await auditService.verifyAuditLogIntegrity(log.auditId);
      expect(isValid).toBe(true);
    });

    it('should verify recorded audit log', async () => {
      const log = await auditService.logAction(
        'export-123',
        'user-456',
        'org-789',
        'APPROVE_LICENSE',
        'APPROVAL',
        'ECTA_LICENSE_PENDING',
        'ECTA_LICENSE_APPROVED',
        {}
      );

      await auditService.updateBlockchainReference(log.auditId, 'tx-001', 12345);

      const isValid = await auditService.verifyAuditLogIntegrity(log.auditId);
      expect(isValid).toBe(true);
    });

    it('should return false for non-existent audit log', async () => {
      const isValid = await auditService.verifyAuditLogIntegrity('non-existent');
      expect(isValid).toBe(false);
    });
  });

  describe('getStatistics', () => {
    it('should return statistics', async () => {
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
        'user-457',
        'org-789',
        'APPROVE_CONTRACT',
        'APPROVAL',
        'ECTA_CONTRACT_PENDING',
        'ECTA_CONTRACT_APPROVED',
        {}
      );

      const stats = await auditService.getStatistics();

      expect(stats.totalLogs).toBe(2);
      expect(stats.totalExports).toBe(2);
      expect(stats.totalUsers).toBe(2);
      expect(stats.dateRange.earliest).toBeDefined();
      expect(stats.dateRange.latest).toBeDefined();
    });
  });
});
