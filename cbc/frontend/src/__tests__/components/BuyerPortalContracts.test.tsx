/**
 * Component Tests - BuyerPortalContracts
 * Tests for buyer contract list, details view, and response actions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BuyerPortalContracts from '../../components/BuyerPortalContracts';

// Mock fetch
global.fetch = vi.fn();

describe('BuyerPortalContracts Component', () => {
  const mockToken = 'test-token-123';
  const mockUser = { id: 'buyer-123', email: 'buyer@example.com', role: 'BUYER' };

  const mockContracts = [
    {
      draft_id: 'draft-1',
      contract_number: 'SC-001',
      status: 'COUNTERED',
      exporter_id: 'exporter-123',
      buyer_name: 'Our Company',
      buyer_email: 'buyer@example.com',
      coffee_type: 'Arabica Grade 1',
      quantity_bags: 100,
      unit_price: 150.50,
      total_value: 15050,
      currency: 'USD',
      payment_terms: 'LC_AT_SIGHT',
      delivery_location: 'Port of Djibouti',
      delivery_date: '2025-06-15',
      incoterms: 'FOB',
      created_at: '2025-01-10T10:00:00Z',
      updated_at: '2025-01-12T14:30:00Z',
    },
    {
      draft_id: 'draft-2',
      contract_number: 'SC-002',
      status: 'COUNTERED',
      exporter_id: 'exporter-456',
      buyer_name: 'Our Company',
      buyer_email: 'buyer@example.com',
      coffee_type: 'Robusta Grade 1',
      quantity_bags: 50,
      unit_price: 120.00,
      total_value: 6000,
      currency: 'USD',
      payment_terms: 'Net 30',
      delivery_location: 'Port of Rotterdam',
      delivery_date: '2025-07-20',
      incoterms: 'CIF',
      created_at: '2025-01-05T10:00:00Z',
      updated_at: '2025-01-11T09:15:00Z',
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

  describe('Component Rendering', () => {
    it('should render buyer portal with title', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contracts: mockContracts }),
      });

      render(<BuyerPortalContracts />);

      await waitFor(() => {
        expect(screen.getByText('Contracts Sent to You')).toBeInTheDocument();
      });
    });

    it('should display list of contracts sent to buyer', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contracts: mockContracts }),
      });

      render(<BuyerPortalContracts />);

      await waitFor(() => {
        expect(screen.getByText('SC-001')).toBeInTheDocument();
        expect(screen.getByText('SC-002')).toBeInTheDocument();
      });
    });

    it('should display contract details in table', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contracts: mockContracts }),
      });

      render(<BuyerPortalContracts />);

      await waitFor(() => {
        expect(screen.getByText('Arabica Grade 1')).toBeInTheDocument();
        expect(screen.getByText('Robusta Grade 1')).toBeInTheDocument();
        expect(screen.getByText('100 bags')).toBeInTheDocument();
        expect(screen.getByText('50 bags')).toBeInTheDocument();
      });
    });

    it('should display action buttons for each contract', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contracts: mockContracts }),
      });

      render(<BuyerPortalContracts />);

      await waitFor(() => {
        const viewButtons = screen.getAllByText('View');
        expect(viewButtons.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe('Contract Details View', () => {
    it('should display contract details when View button is clicked', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contracts: mockContracts }),
      });

      render(<BuyerPortalContracts />);

      await waitFor(() => {
        const viewButtons = screen.getAllByText('View');
        fireEvent.click(viewButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByText('SC-001')).toBeInTheDocument();
        expect(screen.getByText('Arabica Grade 1')).toBeInTheDocument();
      });
    });

    it('should display full contract specifications', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contracts: mockContracts }),
      });

      render(<BuyerPortalContracts />);

      await waitFor(() => {
        const viewButtons = screen.getAllByText('View');
        fireEvent.click(viewButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByText('100 bags')).toBeInTheDocument();
        expect(screen.getByText('$150.50')).toBeInTheDocument();
        expect(screen.getByText('LC at Sight')).toBeInTheDocument();
        expect(screen.getByText('Port of Djibouti')).toBeInTheDocument();
      });
    });

    it('should display contract history', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contracts: mockContracts }),
      });

      render(<BuyerPortalContracts />);

      await waitFor(() => {
        const viewButtons = screen.getAllByText('View');
        fireEvent.click(viewButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByText(/History/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accept Contract', () => {
    it('should display Accept button in contract details', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contracts: mockContracts }),
      });

      render(<BuyerPortalContracts />);

      await waitFor(() => {
        const viewButtons = screen.getAllByText('View');
        fireEvent.click(viewButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByText('Accept')).toBeInTheDocument();
      });
    });

    it('should show confirmation dialog when Accept is clicked', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contracts: mockContracts }),
      });

      render(<BuyerPortalContracts />);

      await waitFor(() => {
        const viewButtons = screen.getAllByText('View');
        fireEvent.click(viewButtons[0]);
      });

      await waitFor(() => {
        const acceptButton = screen.getByText('Accept');
        fireEvent.click(acceptButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/Are you sure/i)).toBeInTheDocument();
      });
    });

    it('should submit acceptance when confirmed', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ contracts: mockContracts }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'success' }),
        });

      render(<BuyerPortalContracts />);

      await waitFor(() => {
        const viewButtons = screen.getAllByText('View');
        fireEvent.click(viewButtons[0]);
      });

      await waitFor(() => {
        const acceptButton = screen.getByText('Accept');
        fireEvent.click(acceptButton);
      });

      await waitFor(() => {
        const confirmButton = screen.getByText(/Confirm/i);
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/accepted successfully/i)).toBeInTheDocument();
      });
    });
  });

  describe('Reject Contract', () => {
    it('should display Reject button in contract details', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contracts: mockContracts }),
      });

      render(<BuyerPortalContracts />);

      await waitFor(() => {
        const viewButtons = screen.getAllByText('View');
        fireEvent.click(viewButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByText('Reject')).toBeInTheDocument();
      });
    });

    it('should show rejection reason form when Reject is clicked', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contracts: mockContracts }),
      });

      render(<BuyerPortalContracts />);

      await waitFor(() => {
        const viewButtons = screen.getAllByText('View');
        fireEvent.click(viewButtons[0]);
      });

      await waitFor(() => {
        const rejectButton = screen.getByText('Reject');
        fireEvent.click(rejectButton);
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/Rejection Reason/i)).toBeInTheDocument();
      });
    });

    it('should require rejection reason', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contracts: mockContracts }),
      });

      render(<BuyerPortalContracts />);

      await waitFor(() => {
        const viewButtons = screen.getAllByText('View');
        fireEvent.click(viewButtons[0]);
      });

      await waitFor(() => {
        const rejectButton = screen.getByText('Reject');
        fireEvent.click(rejectButton);
      });

      await waitFor(() => {
        const confirmButton = screen.getByText(/Confirm/i);
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/Reason is required/i)).toBeInTheDocument();
      });
    });

    it('should submit rejection with reason', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ contracts: mockContracts }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'success' }),
        });

      render(<BuyerPortalContracts />);

      await waitFor(() => {
        const viewButtons = screen.getAllByText('View');
        fireEvent.click(viewButtons[0]);
      });

      await waitFor(() => {
        const rejectButton = screen.getByText('Reject');
        fireEvent.click(rejectButton);
      });

      await waitFor(() => {
        const reasonInput = screen.getByLabelText(/Rejection Reason/i);
        userEvent.type(reasonInput, 'Price too high');
      });

      await waitFor(() => {
        const confirmButton = screen.getByText(/Confirm/i);
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/rejected successfully/i)).toBeInTheDocument();
      });
    });
  });

  describe('Counter Offer', () => {
    it('should display Counter Offer button in contract details', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contracts: mockContracts }),
      });

      render(<BuyerPortalContracts />);

      await waitFor(() => {
        const viewButtons = screen.getAllByText('View');
        fireEvent.click(viewButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByText('Counter Offer')).toBeInTheDocument();
      });
    });

    it('should show counter offer form when Counter Offer is clicked', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contracts: mockContracts }),
      });

      render(<BuyerPortalContracts />);

      await waitFor(() => {
        const viewButtons = screen.getAllByText('View');
        fireEvent.click(viewButtons[0]);
      });

      await waitFor(() => {
        const counterButton = screen.getByText('Counter Offer');
        fireEvent.click(counterButton);
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/Quantity/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Unit Price/i)).toBeInTheDocument();
      });
    });

    it('should allow modifying contract terms in counter offer', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contracts: mockContracts }),
      });

      render(<BuyerPortalContracts />);

      await waitFor(() => {
        const viewButtons = screen.getAllByText('View');
        fireEvent.click(viewButtons[0]);
      });

      await waitFor(() => {
        const counterButton = screen.getByText('Counter Offer');
        fireEvent.click(counterButton);
      });

      await waitFor(() => {
        const quantityInput = screen.getByLabelText(/Quantity/i) as HTMLInputElement;
        userEvent.clear(quantityInput);
        userEvent.type(quantityInput, '120');
        expect(quantityInput.value).toBe('120');
      });
    });

    it('should validate counter offer modifications', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contracts: mockContracts }),
      });

      render(<BuyerPortalContracts />);

      await waitFor(() => {
        const viewButtons = screen.getAllByText('View');
        fireEvent.click(viewButtons[0]);
      });

      await waitFor(() => {
        const counterButton = screen.getByText('Counter Offer');
        fireEvent.click(counterButton);
      });

      await waitFor(() => {
        const quantityInput = screen.getByLabelText(/Quantity/i);
        userEvent.type(quantityInput, '-50'); // Invalid
      });

      const submitButton = screen.getByText(/Submit Counter/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Quantity must be positive/i)).toBeInTheDocument();
      });
    });

    it('should submit counter offer with modifications', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ contracts: mockContracts }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'success' }),
        });

      render(<BuyerPortalContracts />);

      await waitFor(() => {
        const viewButtons = screen.getAllByText('View');
        fireEvent.click(viewButtons[0]);
      });

      await waitFor(() => {
        const counterButton = screen.getByText('Counter Offer');
        fireEvent.click(counterButton);
      });

      await waitFor(() => {
        const quantityInput = screen.getByLabelText(/Quantity/i) as HTMLInputElement;
        userEvent.clear(quantityInput);
        userEvent.type(quantityInput, '120');
      });

      const submitButton = screen.getByText(/Submit Counter/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/counter offer submitted/i)).toBeInTheDocument();
      });
    });
  });

  describe('Search and Filter', () => {
    it('should display search field', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contracts: mockContracts }),
      });

      render(<BuyerPortalContracts />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Search/i)).toBeInTheDocument();
      });
    });

    it('should filter contracts by coffee type', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contracts: mockContracts }),
      });

      render(<BuyerPortalContracts />);

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/Search/i);
        userEvent.type(searchInput, 'Arabica');
      });

      await waitFor(() => {
        expect(screen.getByText('Arabica Grade 1')).toBeInTheDocument();
        expect(screen.queryByText('Robusta Grade 1')).not.toBeInTheDocument();
      });
    });

    it('should filter contracts by contract number', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contracts: mockContracts }),
      });

      render(<BuyerPortalContracts />);

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/Search/i);
        userEvent.type(searchInput, 'SC-001');
      });

      await waitFor(() => {
        expect(screen.getByText('SC-001')).toBeInTheDocument();
        expect(screen.queryByText('SC-002')).not.toBeInTheDocument();
      });
    });

    it('should display status filter', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contracts: mockContracts }),
      });

      render(<BuyerPortalContracts />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Status/i)).toBeInTheDocument();
      });
    });
  });

  describe('Pagination', () => {
    it('should display pagination when there are multiple pages', async () => {
      const manyContracts = Array.from({ length: 15 }, (_, i) => ({
        ...mockContracts[0],
        draft_id: `draft-${i}`,
        contract_number: `SC-${String(i + 1).padStart(3, '0')}`,
      }));

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contracts: manyContracts }),
      });

      render(<BuyerPortalContracts />);

      await waitFor(() => {
        const paginationButtons = screen.getAllByRole('button').filter(btn =>
          btn.textContent?.match(/^\d+$/)
        );
        expect(paginationButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when fetch fails', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      render(<BuyerPortalContracts />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to fetch contracts/i)).toBeInTheDocument();
      });
    });

    it('should display error message when API returns error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Unauthorized' }),
      });

      render(<BuyerPortalContracts />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to fetch contracts/i)).toBeInTheDocument();
      });
    });

    it('should allow dismissing error message', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      render(<BuyerPortalContracts />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to fetch contracts/i)).toBeInTheDocument();
      });

      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText(/Failed to fetch contracts/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should display loading spinner while fetching contracts', async () => {
      (global.fetch as any).mockImplementationOnce(
        () => new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ contracts: mockContracts }),
        }), 100))
      );

      render(<BuyerPortalContracts />);

      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      });
    });
  });

  describe('Empty States', () => {
    it('should display empty message when no contracts exist', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contracts: [] }),
      });

      render(<BuyerPortalContracts />);

      await waitFor(() => {
        expect(screen.getByText(/No contracts sent to you/i)).toBeInTheDocument();
      });
    });
  });
});
