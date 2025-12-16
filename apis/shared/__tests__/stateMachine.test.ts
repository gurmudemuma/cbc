import { ExportStateMachine } from '../stateMachine';

describe('ExportStateMachine', () => {
  describe('isValidTransition', () => {
    it('should allow DRAFT -> ECX_PENDING', () => {
      expect(ExportStateMachine.isValidTransition('DRAFT', 'ECX_PENDING')).toBe(true);
    });

    it('should reject DRAFT -> COMPLETED', () => {
      expect(ExportStateMachine.isValidTransition('DRAFT', 'COMPLETED')).toBe(false);
    });

    it('should allow ECX_VERIFIED -> ECTA_LICENSE_PENDING', () => {
      expect(ExportStateMachine.isValidTransition('ECX_VERIFIED', 'ECTA_LICENSE_PENDING')).toBe(
        true
      );
    });

    it('should allow ECTA_LICENSE_PENDING -> ECTA_LICENSE_APPROVED', () => {
      expect(
        ExportStateMachine.isValidTransition('ECTA_LICENSE_PENDING', 'ECTA_LICENSE_APPROVED')
      ).toBe(true);
    });

    it('should allow ECTA_LICENSE_PENDING -> ECTA_LICENSE_REJECTED', () => {
      expect(
        ExportStateMachine.isValidTransition('ECTA_LICENSE_PENDING', 'ECTA_LICENSE_REJECTED')
      ).toBe(true);
    });

    it('should reject ECTA_LICENSE_PENDING -> COMPLETED', () => {
      expect(ExportStateMachine.isValidTransition('ECTA_LICENSE_PENDING', 'COMPLETED')).toBe(false);
    });

    it('should allow COMPLETED -> (nothing)', () => {
      expect(ExportStateMachine.isValidTransition('COMPLETED', 'CANCELLED')).toBe(false);
    });
  });

  describe('getNextStatuses', () => {
    it('should return allowed next statuses for DRAFT', () => {
      const next = ExportStateMachine.getNextStatuses('DRAFT');
      expect(next).toContain('ECX_PENDING');
      expect(next.length).toBe(1);
    });

    it('should return allowed next statuses for ECX_PENDING', () => {
      const next = ExportStateMachine.getNextStatuses('ECX_PENDING');
      expect(next).toContain('ECX_VERIFIED');
      expect(next).toContain('ECX_REJECTED');
      expect(next.length).toBe(2);
    });

    it('should return empty array for COMPLETED', () => {
      const next = ExportStateMachine.getNextStatuses('COMPLETED');
      expect(next).toEqual([]);
    });

    it('should return empty array for CANCELLED', () => {
      const next = ExportStateMachine.getNextStatuses('CANCELLED');
      expect(next).toEqual([]);
    });
  });

  describe('validateTransition', () => {
    it('should not throw for valid transition', () => {
      expect(() => {
        ExportStateMachine.validateTransition('DRAFT', 'ECX_PENDING');
      }).not.toThrow();
    });

    it('should throw for invalid transition', () => {
      expect(() => {
        ExportStateMachine.validateTransition('DRAFT', 'COMPLETED');
      }).toThrow();
    });

    it('should throw with descriptive message', () => {
      expect(() => {
        ExportStateMachine.validateTransition('DRAFT', 'COMPLETED');
      }).toThrow(/Invalid status transition/);
    });
  });

  describe('getTransitionInfo', () => {
    it('should return valid transition info', () => {
      const info = ExportStateMachine.getTransitionInfo('DRAFT', 'ECX_PENDING');
      expect(info.from).toBe('DRAFT');
      expect(info.to).toBe('ECX_PENDING');
      expect(info.isValid).toBe(true);
      expect(info.reason).toBe('Valid transition');
    });

    it('should return invalid transition info', () => {
      const info = ExportStateMachine.getTransitionInfo('DRAFT', 'COMPLETED');
      expect(info.from).toBe('DRAFT');
      expect(info.to).toBe('COMPLETED');
      expect(info.isValid).toBe(false);
      expect(info.reason).toContain('Invalid transition');
    });
  });

  describe('isTerminalState', () => {
    it('should return true for COMPLETED', () => {
      expect(ExportStateMachine.isTerminalState('COMPLETED')).toBe(true);
    });

    it('should return true for CANCELLED', () => {
      expect(ExportStateMachine.isTerminalState('CANCELLED')).toBe(true);
    });

    it('should return false for DRAFT', () => {
      expect(ExportStateMachine.isTerminalState('DRAFT')).toBe(false);
    });

    it('should return false for ECX_PENDING', () => {
      expect(ExportStateMachine.isTerminalState('ECX_PENDING')).toBe(false);
    });
  });

  describe('getWorkflowStage', () => {
    it('should return correct stage for DRAFT', () => {
      expect(ExportStateMachine.getWorkflowStage('DRAFT')).toBe('Creation');
    });

    it('should return correct stage for ECX_PENDING', () => {
      expect(ExportStateMachine.getWorkflowStage('ECX_PENDING')).toBe('ECX Verification');
    });

    it('should return correct stage for ECTA_LICENSE_PENDING', () => {
      expect(ExportStateMachine.getWorkflowStage('ECTA_LICENSE_PENDING')).toBe('ECTA License');
    });

    it('should return correct stage for COMPLETED', () => {
      expect(ExportStateMachine.getWorkflowStage('COMPLETED')).toBe('Completion');
    });
  });

  describe('getProgressPercentage', () => {
    it('should return 5 for DRAFT', () => {
      expect(ExportStateMachine.getProgressPercentage('DRAFT')).toBe(5);
    });

    it('should return 100 for COMPLETED', () => {
      expect(ExportStateMachine.getProgressPercentage('COMPLETED')).toBe(100);
    });

    it('should return 0 for CANCELLED', () => {
      expect(ExportStateMachine.getProgressPercentage('CANCELLED')).toBe(0);
    });

    it('should return increasing values through workflow', () => {
      const draft = ExportStateMachine.getProgressPercentage('DRAFT');
      const ecxPending = ExportStateMachine.getProgressPercentage('ECX_PENDING');
      const ecxVerified = ExportStateMachine.getProgressPercentage('ECX_VERIFIED');
      const completed = ExportStateMachine.getProgressPercentage('COMPLETED');

      expect(draft < ecxPending).toBe(true);
      expect(ecxPending < ecxVerified).toBe(true);
      expect(ecxVerified < completed).toBe(true);
    });
  });

  describe('getAllTransitions', () => {
    it('should return all transitions', () => {
      const transitions = ExportStateMachine.getAllTransitions();
      expect(Object.keys(transitions).length).toBeGreaterThan(0);
    });

    it('should include DRAFT', () => {
      const transitions = ExportStateMachine.getAllTransitions();
      expect(transitions['DRAFT']).toBeDefined();
    });

    it('should include COMPLETED', () => {
      const transitions = ExportStateMachine.getAllTransitions();
      expect(transitions['COMPLETED']).toBeDefined();
    });
  });

  describe('Complete workflow sequence', () => {
    it('should allow complete workflow from DRAFT to COMPLETED', () => {
      const sequence = [
        'DRAFT',
        'ECX_PENDING',
        'ECX_VERIFIED',
        'ECTA_LICENSE_PENDING',
        'ECTA_LICENSE_APPROVED',
        'ECTA_QUALITY_PENDING',
        'ECTA_QUALITY_APPROVED',
        'ECTA_ORIGIN_PENDING',
        'ECTA_ORIGIN_APPROVED',
        'ECTA_CONTRACT_PENDING',
        'ECTA_CONTRACT_APPROVED',
        'BANK_DOCUMENT_PENDING',
        'BANK_DOCUMENT_VERIFIED',
        'FX_APPLICATION_PENDING',
        'FX_APPROVED',
        'CUSTOMS_PENDING',
        'CUSTOMS_CLEARED',
        'SHIPMENT_PENDING',
        'SHIPMENT_SCHEDULED',
        'SHIPPED',
        'ARRIVED',
        'IMPORT_CUSTOMS_PENDING',
        'IMPORT_CUSTOMS_CLEARED',
        'DELIVERED',
        'PAYMENT_PENDING',
        'PAYMENT_RECEIVED',
        'FX_REPATRIATED',
        'COMPLETED',
      ];

      for (let i = 0; i < sequence.length - 1; i++) {
        const current = sequence[i] as any;
        const next = sequence[i + 1] as any;
        expect(ExportStateMachine.isValidTransition(current, next)).toBe(true);
      }
    });
  });
});
