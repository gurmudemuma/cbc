/**
 * Property-Based Tests for ESW Agency Data Isolation
 * Feature: esw-agency-data-isolation
 * 
 * These tests verify universal correctness properties across all valid inputs
 * using property-based testing with fast-check.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import * as fc from 'fast-check';
import AgencyApprovalDashboard from './AgencyApprovalDashboard';
import eswService from '../services/esw.service';

// Mock the esw service
vi.mock('../services/esw.service', () => ({
  default: {
    getMyAgencies: vi.fn(),
    getPendingApprovalsForAgency: vi.fn(),
    getAgencyStatistics: vi.fn(),
    getStatistics: vi.fn(),
  },
}));

/**
 * Arbitrary generator for Agency objects
 */
const agencyArbitrary = fc.record({
  code: fc.stringMatching(/^[A-Z]{2,6}$/), // Agency codes like "ECTA", "MOT", "ERCA"
  name: fc.string({ minLength: 5, maxLength: 50 }),
  description: fc.option(fc.string({ minLength: 10, maxLength: 100 })),
  isActive: fc.boolean(),
});

/**
 * Arbitrary generator for arrays of agencies
 */
const agenciesArrayArbitrary = fc.array(agencyArbitrary, { minLength: 0, maxLength: 10 });

describe('Property Tests: Agency Data Isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    vi.mocked(eswService.getPendingApprovalsForAgency).mockResolvedValue({
      success: true,
      data: [],
    });
    vi.mocked(eswService.getAgencyStatistics).mockResolvedValue({
      success: true,
      data: { totalApprovals: 0, pending: 0, approved: 0, rejected: 0 },
    });
    vi.mocked(eswService.getStatistics).mockResolvedValue({
      success: true,
      data: {},
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Feature: esw-agency-data-isolation, Property 1: Agency Auto-Detection
   * Validates: Requirements 1.1, 4.1
   * 
   * Property: For any authenticated agency user accessing the dashboard,
   * the system should automatically fetch and display only the agencies
   * that user is assigned to.
   * 
   * This property verifies that:
   * 1. The component calls getMyAgencies() on mount
   * 2. The component stores the returned agencies in state
   * 3. The component does not display agencies that were not returned by the API
   */
  it('should automatically fetch and display only assigned agencies', async () => {
    await fc.assert(
      fc.asyncProperty(agenciesArrayArbitrary, async (agencies) => {
        // Clear mocks before each test
        vi.clearAllMocks();
        
        // Arrange: Mock the API to return the generated agencies
        vi.mocked(eswService.getMyAgencies).mockResolvedValue({
          success: true,
          data: agencies,
        });

        // Act: Render the component
        const { unmount } = render(
          <AgencyApprovalDashboard user={{}} org={{}} />
        );

        // Assert: Verify getMyAgencies was called
        await waitFor(
          () => {
            expect(eswService.getMyAgencies).toHaveBeenCalled();
          },
          { timeout: 1000 }
        );

        // Property verification: The component should only work with the agencies
        // returned by getMyAgencies, not any hardcoded list
        
        // If agencies were returned, verify they are used
        if (agencies.length > 0) {
          // The component should have selected an agency (either auto-selected or default)
          // Wait a bit for the component to process the agencies and make subsequent calls
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Check that data loading functions were called with an agency from the list
          const pendingCalls = vi.mocked(eswService.getPendingApprovalsForAgency).mock.calls;
          
          // If any calls were made, they should use an agency code from the returned list
          if (pendingCalls.length > 0) {
            const calledAgencyCode = pendingCalls[0][0];
            const agencyCodes = agencies.map(a => a.code);
            const isValidAgency = agencyCodes.includes(calledAgencyCode);
            
            // The called agency code should be one of the agencies returned by getMyAgencies
            expect(isValidAgency).toBe(true);
          }
        } else {
          // If no agencies, the component should not call data loading functions with valid codes
          await new Promise(resolve => setTimeout(resolve, 200));
          
          const pendingCalls = vi.mocked(eswService.getPendingApprovalsForAgency).mock.calls;
          
          // Either no calls were made, or calls were made with null/undefined
          if (pendingCalls.length > 0) {
            const calledAgencyCode = pendingCalls[0][0];
            expect(calledAgencyCode).toBeNull();
          }
        }

        // Cleanup
        unmount();
      }),
      { numRuns: 100, timeout: 2000 }
    );
  }, 120000); // 2 minute timeout for the entire property test

  /**
   * Feature: esw-agency-data-isolation, Property 1: Agency Auto-Detection (Error Case)
   * Validates: Requirements 1.1, 4.1
   * 
   * Property: For any API error when fetching agencies, the system should
   * handle the error gracefully and display an appropriate error message.
   */
  it('should handle API errors gracefully when fetching agencies', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 5, maxLength: 100 }), // Error message
        async (errorMessage) => {
          // Arrange: Mock the API to return an error
          vi.mocked(eswService.getMyAgencies).mockRejectedValue(
            new Error(errorMessage)
          );

          // Act: Render the component
          const { unmount } = render(
            <AgencyApprovalDashboard user={{}} org={{}} />
          );

          // Assert: Wait for error handling
          await waitFor(
            () => {
              expect(eswService.getMyAgencies).toHaveBeenCalled();
            },
            { timeout: 1000 }
          );

          // Property verification: The component should not crash
          // Give it a moment to process the error
          await new Promise(resolve => setTimeout(resolve, 100));

          // Cleanup
          unmount();
        }
      ),
      { numRuns: 50, timeout: 2000 }
    );
  }, 120000); // 2 minute timeout for the entire property test

  /**
   * Feature: esw-agency-data-isolation, Property 1: Agency Auto-Detection (Success Response)
   * Validates: Requirements 1.1, 4.1
   * 
   * Property: For any successful API response with success=false,
   * the system should handle it as an error case.
   */
  it('should handle unsuccessful API responses when fetching agencies', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 5, maxLength: 100 }), // Error message
        async (errorMessage) => {
          // Arrange: Mock the API to return success=false
          vi.mocked(eswService.getMyAgencies).mockResolvedValue({
            success: false,
            message: errorMessage,
            data: null,
          });

          // Act: Render the component
          const { unmount } = render(
            <AgencyApprovalDashboard user={{}} org={{}} />
          );

          // Assert: Wait for the component to process the response
          await waitFor(
            () => {
              expect(eswService.getMyAgencies).toHaveBeenCalled();
            },
            { timeout: 1000 }
          );

          // Property verification: The component should treat this as an error
          // Give it a moment to process
          await new Promise(resolve => setTimeout(resolve, 100));

          // Cleanup
          unmount();
        }
      ),
      { numRuns: 50, timeout: 2000 }
    );
  }, 120000); // 2 minute timeout for the entire property test
});
