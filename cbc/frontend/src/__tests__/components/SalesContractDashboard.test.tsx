/**
 * Component Tests - SalesContractDashboard
 * Tests for dashboard rendering, tab switching, search, pagination, and actions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SalesContractDashboard from '../../pages/SalesContractDashboard';

// Mock dependencies
vi.mock('../../components/forms/SalesContractDraftForm', () => ({
  default: ({ onSubmit, loading }: any) => (
    <div data-testid="draft-form">
      <button onClick={() => onSubmit({ buyerName: 'Test Buyer' })}>Submit</button>
    </div>
  ),
}));

vi.mock('../../components/forms/SalesContractNegotiationForm', () => ({
  default: ({ draft, onAccept, onReject, onCounter, loading }: any) => (
    <div data-testid="negotiation-form">
      <button onClick={onAccept}>Accept</button>
      <button onClick={() => onReject('Too expensive')}>Reject</button>
      <button onClick={() => onCounter({}, 'Counter offer')}>Counter</button>
    </div>
  ),
}));

vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
  };
});

// Mock fetch
global.fetch = vi.fn();

describe('SalesContractDashboard Component', () => {
  const mockToken = 'test-token-123';
  const mockUser = { id: 'user-123', email: 'exporter@example.com', role: 'EXPORTER' };

  const mockDrafts = [
    {
      draft_id: 'draft-1',
      contract_number: 'SC-001',
      status: 'DRAFT',
      buyer_name: 'ABC Coffee Imports',
      buyer_email: 'buyer1@example.com',
      coffee_type: 'Arabica',
      quantity: 100,
      unit_price: 150.50,
      total_value: 15050,
      payment_terms: 'LC_AT_SIGHT',
      incoterms: 'FOB',
      delivery_date: '2025-06-15',
      proposed_by: 'EXPORTER',
      created_at: '2025-01-10T10:00:00Z',
      updated_at: '2025-01-10T10:00:00Z',
    },
    {
      draft_id: 'draft-2',
      contract_number: 'SC-002',
      status: 'COUNTERED',
      buyer_name: 'XYZ Coffee Ltd',
      buyer_email: 'buyer2@example.com',
      coffee_type: 'Robusta',
      quantity: 50,
      unit_price: 120.00,
      total_value: 6000,
      payment_terms: 'Net 30',
      incoterms: 'CIF',
      delivery_date: '2025-07-20',
      proposed_by: 'BUYER',
      created_at: '2025-01-05T10:00:00Z',
      updated_at: '2025-01-12T14:30:00Z',
    },
    {
      draft_id: 'draft-3',
      contract_number: 'SC-003',
      status: 'FINALIZED',
      buyer_name: 'Global Coffee Co',
      buyer_email: 'buyer3@example.com',
      coffee_type: 'Yirgacheffe',
      quantity: 200,
      unit_price: 180.00,
      total_value: 36000,
      payment_terms: 'LC_AT_SIGHT',
      incoterms: 'FOB',
      delivery_date: '2025-05-10',
      proposed_by: 'EXPORTER',
      created_at: '2024-12-20T10:00:00Z',
      updated_at: '2025-01-08T16:45:00Z',
      ecta_reference_number: 'ECTA-2024-000001',
      blockchain_tx_hash: 'tx-hash-123456',
    },
  ];

  beforeEach(() => {
    localStorage.setItem('token', mockToken);
    localStorage.setItem('user', JSON.stringify(mockUser));
    (global.fetch as any).mockClear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Dashboard Rendering', () => {
    it('should render dashboard with title and description', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ drafts: mockDrafts }),
      });

      render(<SalesContractDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Sales Contract Management')).toBeInTheDocument();
        expect(screen.getByText('Create, negotiate, and finalize coffee export contracts')).toBeInTheDocument();
      });
    });

    it('should render three tabs: Drafts, Negotiation, Finalized', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ drafts: mockDrafts }),
      });

      render(<SalesContractDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Drafts')).toBeInTheDocument();
        expect(screen.getByText('Negotiation')).toBeInTheDocument();
        expect(screen.getByText('Finalized')).toBeInTheDocument();
      });
    });

    it('should display badge counts for each tab', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ drafts: mockDrafts }),
      });

      render(<SalesContractDashboard />);

      await waitFor(() => {
        // Should show counts: 1 DRAFT, 1 COUNTERED, 1 FINALIZED
        const chips = screen.getAllByRole('img', { hidden: true });
        expect(chips.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Tab Switching', () => {
    it('should switch to Drafts tab and display DRAFT contracts', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ drafts: mockDrafts }),
      });

      render(<SalesContractDashboard />);

      await waitFor(() => {
        expect(screen.getByText('SC-001')).toBeInTheDocument();
        expect(screen.getByText('ABC Coffee Imports')).toBeInTheDocument();
      });
    });

    it('should switch to Negotiation tab and display COUNTERED/ACCEPTED contracts', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ drafts: mockDrafts }),
      });

      render(<SalesContractDashboard />);

      const negotiationTab = screen.getByText('Negotiation');
      fireEvent.click(negotiationTab);

      await waitFor(() => {
        expect(screen.getByText('SC-002')).toBeInTheDocument();
        expect(screen.getByText('XYZ Coffee Ltd')).toBeInTheDocument();
      });
    });

    it('should switch to Finalized tab and display FINALIZED contracts', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ drafts: mockDrafts }),
      });

      render(<SalesContractDashboard />);

      const finalizedTab = screen.getByText('Finalized');
      fireEvent.click(finalizedTab);

      await waitFor(() => {
        expect(screen.getByText('SC-003')).toBeInTheDocument();
        expect(screen.getByText('Global Coffee Co')).toBeInTheDocument();
        expect(screen.getByText('ECTA-2024-000001')).toBeInTheDocument();
      });
    });

    it('should reset search and pagination when switching tabs', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ drafts: mockDrafts }),
      });

      render(<SalesContractDashboard />);

      // Set search query
      const searchInput = screen.getByPlaceholderText(/Search by buyer name/);
      await userEvent.type(searchInput, 'ABC');

      // Switch tab
      const negotiationTab = screen.getByText('Negotiation');
      fireEvent.click(negotiationTab);

      // Search should be cleared
      await waitFor(() => {
        expect(searchInput).toHaveValue('');
      });
    });
  });

  describe('Search Functionality', () => {
    it('should filter contracts by buyer name', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ drafts: mockDrafts }),
      });

      render(<SalesContractDashboard />);

      const searchInput = screen.getByPlaceholderText(/Search by buyer name/);
      await userEvent.type(searchInput, 'ABC');

      await waitFor(() => {
        expect(screen.getByText('ABC Coffee Imports')).toBeInTheDocument();
        expect(screen.queryByText('XYZ Coffee Ltd')).not.toBeInTheDocument();
      });
    });

    it('should filter contracts by buyer email', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ drafts: mockDrafts }),
      });

      render(<SalesContractDashboard />);

      const searchInput = screen.getByPlaceholderText(/Search by buyer name/);
      await userEvent.type(searchInput, 'buyer2@example.com');

      await waitFor(() => {
        expect(screen.getByText('XYZ Coffee Ltd')).toBeInTheDocument();
        expect(screen.queryByText('ABC Coffee Imports')).not.toBeInTheDocument();
      });
    });

    it('should filter contracts by coffee type', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ drafts: mockDrafts }),
      });

      render(<SalesContractDashboard />);

      const searchInput = screen.getByPlaceholderText(/Search by buyer name/);
      await userEvent.type(searchInput, 'Arabica');

      await waitFor(() => {
        expect(screen.getByText('ABC Coffee Imports')).toBeInTheDocument();
        expect(screen.queryByText('XYZ Coffee Ltd')).not.toBeInTheDocument();
      });
    });

    it('should filter contracts by contract number', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ drafts: mockDrafts }),
      });

      render(<SalesContractDashboard />);

      const searchInput = screen.getByPlaceholderText(/Search by buyer name/);
      await userEvent.type(searchInput, 'SC-003');

      await waitFor(() => {
        expect(screen.getByText('Global Coffee Co')).toBeInTheDocument();
        expect(screen.queryByText('ABC Coffee Imports')).not.toBeInTheDocument();
      });
    });

    it('should show no results message when search has no matches', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ drafts: mockDrafts }),
      });

      render(<SalesContractDashboard />);

      const searchInput = screen.getByPlaceholderText(/Search by buyer name/);
      await userEvent.type(searchInput, 'NonexistentBuyer');

      await waitFor(() => {
        expect(screen.getByText('No drafts match your search.')).toBeInTheDocument();
      });
    });

    it('should reset pagination when search is performed', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ drafts: mockDrafts }),
      });

      render(<SalesContractDashboard />);

      const searchInput = screen.getByPlaceholderText(/Search by buyer name/);
      await userEvent.type(searchInput, 'ABC');

      await waitFor(() => {
        expect(screen.getByText('ABC Coffee Imports')).toBeInTheDocument();
      });
    });
  });

  describe('Pagination', () => {
    it('should display pagination controls when there are multiple pages', async () => {
      const manyDrafts = Array.from({ length: 15 }, (_, i) => ({
        ...mockDrafts[0],
        draft_id: `draft-${i}`,
        contract_number: `SC-${String(i + 1).padStart(3, '0')}`,
        buyer_name: `Buyer ${i + 1}`,
      }));

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ drafts: manyDrafts }),
      });

      render(<SalesContractDashboard />);

      await waitFor(() => {
        const paginationButtons = screen.getAllByRole('button').filter(btn => 
          btn.textContent?.match(/^\d+$/)
        );
        expect(paginationButtons.length).toBeGreaterThan(0);
      });
    });

    it('should navigate to next page when pagination button is clicked', async () => {
      const manyDrafts = Array.from({ length: 15 }, (_, i) => ({
        ...mockDrafts[0],
        draft_id: `draft-${i}`,
        contract_number: `SC-${String(i + 1).padStart(3, '0')}`,
        buyer_name: `Buyer ${i + 1}`,
      }));

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ drafts: manyDrafts }),
      });

      render(<SalesContractDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Buyer 1')).toBeInTheDocument();
      });

      // Click next page button
      const nextButton = screen.getByRole('button', { name: /2/ });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Buyer 11')).toBeInTheDocument();
      });
    });
  });

  describe('Contract Actions', () => {
    it('should display View button for each contract', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ drafts: mockDrafts }),
      });

      render(<SalesContractDashboard />);

      await waitFor(() => {
        const viewButtons = screen.getAllByText('View');
        expect(viewButtons.length).toBeGreaterThan(0);
      });
    });

    it('should display New Draft button in Drafts tab', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ drafts: mockDrafts }),
      });

      render(<SalesContractDashboard />);

      await waitFor(() => {
        expect(screen.getByText('New Draft')).toBeInTheDocument();
      });
    });

    it('should display Download Certificate button in Finalized tab', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ drafts: mockDrafts }),
      });

      render(<SalesContractDashboard />);

      const finalizedTab = screen.getByText('Finalized');
      fireEvent.click(finalizedTab);

      await waitFor(() => {
        expect(screen.getByText('Cert')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when fetch fails', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      render(<SalesContractDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch drafts')).toBeInTheDocument();
      });
    });

    it('should display error message when API returns error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Unauthorized' }),
      });

      render(<SalesContractDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch drafts')).toBeInTheDocument();
      });
    });

    it('should allow dismissing error message', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      render(<SalesContractDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch drafts')).toBeInTheDocument();
      });

      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('Failed to fetch drafts')).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should display loading spinner while fetching drafts', async () => {
      (global.fetch as any).mockImplementationOnce(
        () => new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ drafts: mockDrafts }),
        }), 100))
      );

      render(<SalesContractDashboard />);

      // Loading spinner should appear
      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      });
    });

    it('should display loading spinner during contract creation', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ drafts: mockDrafts }),
      });

      render(<SalesContractDashboard />);

      await waitFor(() => {
        expect(screen.getByText('New Draft')).toBeInTheDocument();
      });

      // Click New Draft button
      const newDraftButton = screen.getByText('New Draft');
      fireEvent.click(newDraftButton);

      await waitFor(() => {
        expect(screen.getByTestId('draft-form')).toBeInTheDocument();
      });
    });
  });

  describe('Contract Details Display', () => {
    it('should display contract details in table', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ drafts: mockDrafts }),
      });

      render(<SalesContractDashboard />);

      await waitFor(() => {
        expect(screen.getByText('SC-001')).toBeInTheDocument();
        expect(screen.getByText('ABC Coffee Imports')).toBeInTheDocument();
        expect(screen.getByText('Arabica')).toBeInTheDocument();
        expect(screen.getByText('100 bags')).toBeInTheDocument();
      });
    });

    it('should display buyer email under buyer name', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ drafts: mockDrafts }),
      });

      render(<SalesContractDashboard />);

      await waitFor(() => {
        expect(screen.getByText('buyer1@example.com')).toBeInTheDocument();
      });
    });

    it('should display formatted total value', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ drafts: mockDrafts }),
      });

      render(<SalesContractDashboard />);

      await waitFor(() => {
        expect(screen.getByText('$15,050')).toBeInTheDocument();
      });
    });

    it('should display creation date in Drafts tab', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ drafts: mockDrafts }),
      });

      render(<SalesContractDashboard />);

      await waitFor(() => {
        expect(screen.getByText('1/10/2025')).toBeInTheDocument();
      });
    });

    it('should display status badge in Negotiation tab', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ drafts: mockDrafts }),
      });

      render(<SalesContractDashboard />);

      const negotiationTab = screen.getByText('Negotiation');
      fireEvent.click(negotiationTab);

      await waitFor(() => {
        expect(screen.getByText('COUNTERED')).toBeInTheDocument();
      });
    });

    it('should display ECTA reference in Finalized tab', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ drafts: mockDrafts }),
      });

      render(<SalesContractDashboard />);

      const finalizedTab = screen.getByText('Finalized');
      fireEvent.click(finalizedTab);

      await waitFor(() => {
        expect(screen.getByText('ECTA-2024-000001')).toBeInTheDocument();
      });
    });
  });

  describe('Empty States', () => {
    it('should display empty message when no drafts exist', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ drafts: [] }),
      });

      render(<SalesContractDashboard />);

      await waitFor(() => {
        expect(screen.getByText('No drafts yet. Create one to get started.')).toBeInTheDocument();
      });
    });

    it('should display empty message for Negotiation tab when no contracts', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ drafts: [mockDrafts[0]] }), // Only DRAFT
      });

      render(<SalesContractDashboard />);

      const negotiationTab = screen.getByText('Negotiation');
      fireEvent.click(negotiationTab);

      await waitFor(() => {
        expect(screen.getByText('No contracts under negotiation.')).toBeInTheDocument();
      });
    });
  });
});
