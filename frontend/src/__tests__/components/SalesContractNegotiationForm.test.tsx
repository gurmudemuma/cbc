/**
 * Component Tests - SalesContractNegotiationForm
 * Tests for comparison view, difference highlighting, and action buttons
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SalesContractNegotiationForm from '../../components/forms/SalesContractNegotiationForm';

describe('SalesContractNegotiationForm Component', () => {
  const mockOnAccept = vi.fn();
  const mockOnReject = vi.fn();
  const mockOnCounter = vi.fn();

  const mockDraft = {
    draft_id: 'draft-123',
    contract_number: 'SC-001',
    status: 'COUNTERED',
    buyer_name: 'ABC Coffee Imports',
    buyer_email: 'buyer@example.com',
    coffee_type: 'Arabica Grade 1',
    quantity_bags: 100,
    unit_price: 150.50,
    currency: 'USD',
    payment_terms: 'LC_AT_SIGHT',
    delivery_location: 'Port of Djibouti',
    delivery_date: '2025-06-15',
    incoterms: 'FOB',
    created_at: '2025-01-10T10:00:00Z',
    updated_at: '2025-01-12T14:30:00Z',
  };

  beforeEach(() => {
    mockOnAccept.mockClear();
    mockOnReject.mockClear();
    mockOnCounter.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Form Rendering', () => {
    it('should render negotiation form with title', () => {
      render(
        <SalesContractNegotiationForm
          draft={mockDraft}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
          onCounter={mockOnCounter}
        />
      );

      expect(screen.getByText('Contract Negotiation')).toBeInTheDocument();
    });

    it('should display contract details', () => {
      render(
        <SalesContractNegotiationForm
          draft={mockDraft}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
          onCounter={mockOnCounter}
        />
      );

      expect(screen.getByText('SC-001')).toBeInTheDocument();
      expect(screen.getByText('ABC Coffee Imports')).toBeInTheDocument();
      expect(screen.getByText('Arabica Grade 1')).toBeInTheDocument();
    });

    it('should display side-by-side comparison view', () => {
      render(
        <SalesContractNegotiationForm
          draft={mockDraft}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
          onCounter={mockOnCounter}
        />
      );

      expect(screen.getByText('Original Terms')).toBeInTheDocument();
      expect(screen.getByText('Proposed Terms')).toBeInTheDocument();
    });

    it('should display action buttons', () => {
      render(
        <SalesContractNegotiationForm
          draft={mockDraft}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
          onCounter={mockOnCounter}
        />
      );

      expect(screen.getByText('Accept')).toBeInTheDocument();
      expect(screen.getByText('Reject')).toBeInTheDocument();
      expect(screen.getByText('Counter Offer')).toBeInTheDocument();
    });
  });

  describe('Comparison View', () => {
    it('should display original contract terms', () => {
      render(
        <SalesContractNegotiationForm
          draft={mockDraft}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
          onCounter={mockOnCounter}
        />
      );

      expect(screen.getByText('100 bags')).toBeInTheDocument();
      expect(screen.getByText('$150.50')).toBeInTheDocument();
      expect(screen.getByText('LC at Sight')).toBeInTheDocument();
    });

    it('should highlight differences between versions', () => {
      const draftWithChanges = {
        ...mockDraft,
        quantity_bags: 120, // Changed from 100
        unit_price: 155.00, // Changed from 150.50
      };

      render(
        <SalesContractNegotiationForm
          draft={draftWithChanges}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
          onCounter={mockOnCounter}
        />
      );

      // Should show both original and proposed values
      expect(screen.getByText('100 bags')).toBeInTheDocument();
      expect(screen.getByText('120 bags')).toBeInTheDocument();
    });

    it('should display change indicators for modified fields', () => {
      const draftWithChanges = {
        ...mockDraft,
        quantity_bags: 120,
      };

      render(
        <SalesContractNegotiationForm
          draft={draftWithChanges}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
          onCounter={mockOnCounter}
        />
      );

      // Should indicate which fields have changed
      const changeIndicators = screen.getAllByRole('img', { hidden: true });
      expect(changeIndicators.length).toBeGreaterThan(0);
    });
  });

  describe('Accept Action', () => {
    it('should call onAccept when Accept button is clicked', () => {
      render(
        <SalesContractNegotiationForm
          draft={mockDraft}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
          onCounter={mockOnCounter}
        />
      );

      const acceptButton = screen.getByText('Accept');
      fireEvent.click(acceptButton);

      expect(mockOnAccept).toHaveBeenCalled();
    });

    it('should show confirmation dialog before accepting', async () => {
      render(
        <SalesContractNegotiationForm
          draft={mockDraft}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
          onCounter={mockOnCounter}
        />
      );

      const acceptButton = screen.getByText('Accept');
      fireEvent.click(acceptButton);

      await waitFor(() => {
        expect(screen.getByText(/Are you sure/i)).toBeInTheDocument();
      });
    });

    it('should confirm acceptance in dialog', async () => {
      render(
        <SalesContractNegotiationForm
          draft={mockDraft}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
          onCounter={mockOnCounter}
        />
      );

      const acceptButton = screen.getByText('Accept');
      fireEvent.click(acceptButton);

      await waitFor(() => {
        const confirmButton = screen.getByText(/Confirm/i);
        fireEvent.click(confirmButton);
      });

      expect(mockOnAccept).toHaveBeenCalled();
    });
  });

  describe('Reject Action', () => {
    it('should call onReject when Reject button is clicked', () => {
      render(
        <SalesContractNegotiationForm
          draft={mockDraft}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
          onCounter={mockOnCounter}
        />
      );

      const rejectButton = screen.getByText('Reject');
      fireEvent.click(rejectButton);

      expect(mockOnReject).toHaveBeenCalled();
    });

    it('should show rejection reason dialog', async () => {
      render(
        <SalesContractNegotiationForm
          draft={mockDraft}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
          onCounter={mockOnCounter}
        />
      );

      const rejectButton = screen.getByText('Reject');
      fireEvent.click(rejectButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/Rejection Reason/i)).toBeInTheDocument();
      });
    });

    it('should require rejection reason', async () => {
      render(
        <SalesContractNegotiationForm
          draft={mockDraft}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
          onCounter={mockOnCounter}
        />
      );

      const rejectButton = screen.getByText('Reject');
      fireEvent.click(rejectButton);

      await waitFor(() => {
        const confirmButton = screen.getByText(/Confirm/i);
        fireEvent.click(confirmButton);
      });

      // Should show error if reason is empty
      await waitFor(() => {
        expect(screen.getByText(/Reason is required/i)).toBeInTheDocument();
      });
    });

    it('should submit rejection with reason', async () => {
      render(
        <SalesContractNegotiationForm
          draft={mockDraft}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
          onCounter={mockOnCounter}
        />
      );

      const rejectButton = screen.getByText('Reject');
      fireEvent.click(rejectButton);

      await waitFor(() => {
        const reasonInput = screen.getByLabelText(/Rejection Reason/i);
        userEvent.type(reasonInput, 'Price too high');
      });

      const confirmButton = screen.getByText(/Confirm/i);
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockOnReject).toHaveBeenCalledWith('Price too high');
      });
    });
  });

  describe('Counter Offer Action', () => {
    it('should call onCounter when Counter Offer button is clicked', () => {
      render(
        <SalesContractNegotiationForm
          draft={mockDraft}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
          onCounter={mockOnCounter}
        />
      );

      const counterButton = screen.getByText('Counter Offer');
      fireEvent.click(counterButton);

      expect(mockOnCounter).toHaveBeenCalled();
    });

    it('should show counter offer form', async () => {
      render(
        <SalesContractNegotiationForm
          draft={mockDraft}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
          onCounter={mockOnCounter}
        />
      );

      const counterButton = screen.getByText('Counter Offer');
      fireEvent.click(counterButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/Quantity/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Unit Price/i)).toBeInTheDocument();
      });
    });

    it('should allow modifying quantity in counter offer', async () => {
      render(
        <SalesContractNegotiationForm
          draft={mockDraft}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
          onCounter={mockOnCounter}
        />
      );

      const counterButton = screen.getByText('Counter Offer');
      fireEvent.click(counterButton);

      await waitFor(() => {
        const quantityInput = screen.getByLabelText(/Quantity/i) as HTMLInputElement;
        userEvent.clear(quantityInput);
        userEvent.type(quantityInput, '120');
        expect(quantityInput.value).toBe('120');
      });
    });

    it('should allow modifying unit price in counter offer', async () => {
      render(
        <SalesContractNegotiationForm
          draft={mockDraft}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
          onCounter={mockOnCounter}
        />
      );

      const counterButton = screen.getByText('Counter Offer');
      fireEvent.click(counterButton);

      await waitFor(() => {
        const priceInput = screen.getByLabelText(/Unit Price/i) as HTMLInputElement;
        userEvent.clear(priceInput);
        userEvent.type(priceInput, '155.00');
        expect(priceInput.value).toBe('155.00');
      });
    });

    it('should validate counter offer modifications', async () => {
      render(
        <SalesContractNegotiationForm
          draft={mockDraft}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
          onCounter={mockOnCounter}
        />
      );

      const counterButton = screen.getByText('Counter Offer');
      fireEvent.click(counterButton);

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
      render(
        <SalesContractNegotiationForm
          draft={mockDraft}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
          onCounter={mockOnCounter}
        />
      );

      const counterButton = screen.getByText('Counter Offer');
      fireEvent.click(counterButton);

      await waitFor(() => {
        const quantityInput = screen.getByLabelText(/Quantity/i) as HTMLInputElement;
        userEvent.clear(quantityInput);
        userEvent.type(quantityInput, '120');
      });

      const submitButton = screen.getByText(/Submit Counter/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnCounter).toHaveBeenCalledWith(
          expect.objectContaining({
            quantity_bags: 120,
          }),
          expect.any(String)
        );
      });
    });

    it('should allow adding notes to counter offer', async () => {
      render(
        <SalesContractNegotiationForm
          draft={mockDraft}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
          onCounter={mockOnCounter}
        />
      );

      const counterButton = screen.getByText('Counter Offer');
      fireEvent.click(counterButton);

      await waitFor(() => {
        const notesInput = screen.getByLabelText(/Notes/i);
        userEvent.type(notesInput, 'Please consider our revised pricing');
      });

      const submitButton = screen.getByText(/Submit Counter/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnCounter).toHaveBeenCalledWith(
          expect.any(Object),
          expect.stringContaining('Please consider our revised pricing')
        );
      });
    });
  });

  describe('Status Display', () => {
    it('should display current contract status', () => {
      render(
        <SalesContractNegotiationForm
          draft={mockDraft}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
          onCounter={mockOnCounter}
        />
      );

      expect(screen.getByText('COUNTERED')).toBeInTheDocument();
    });

    it('should display last update timestamp', () => {
      render(
        <SalesContractNegotiationForm
          draft={mockDraft}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
          onCounter={mockOnCounter}
        />
      );

      expect(screen.getByText(/Last updated/i)).toBeInTheDocument();
    });

    it('should display buyer information', () => {
      render(
        <SalesContractNegotiationForm
          draft={mockDraft}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
          onCounter={mockOnCounter}
        />
      );

      expect(screen.getByText('buyer@example.com')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should disable action buttons when loading', () => {
      render(
        <SalesContractNegotiationForm
          draft={mockDraft}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
          onCounter={mockOnCounter}
          loading={true}
        />
      );

      const acceptButton = screen.getByText('Accept') as HTMLButtonElement;
      const rejectButton = screen.getByText('Reject') as HTMLButtonElement;
      const counterButton = screen.getByText('Counter Offer') as HTMLButtonElement;

      expect(acceptButton.disabled).toBe(true);
      expect(rejectButton.disabled).toBe(true);
      expect(counterButton.disabled).toBe(true);
    });

    it('should display loading spinner when loading', () => {
      render(
        <SalesContractNegotiationForm
          draft={mockDraft}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
          onCounter={mockOnCounter}
          loading={true}
        />
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Contract History', () => {
    it('should display contract history timeline', () => {
      render(
        <SalesContractNegotiationForm
          draft={mockDraft}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
          onCounter={mockOnCounter}
        />
      );

      expect(screen.getByText(/History/i)).toBeInTheDocument();
    });

    it('should show version information', () => {
      render(
        <SalesContractNegotiationForm
          draft={mockDraft}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
          onCounter={mockOnCounter}
        />
      );

      expect(screen.getByText(/Version/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper button labels', () => {
      render(
        <SalesContractNegotiationForm
          draft={mockDraft}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
          onCounter={mockOnCounter}
        />
      );

      expect(screen.getByRole('button', { name: /Accept/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Reject/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Counter/i })).toBeInTheDocument();
    });

    it('should have proper form labels', async () => {
      render(
        <SalesContractNegotiationForm
          draft={mockDraft}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
          onCounter={mockOnCounter}
        />
      );

      const counterButton = screen.getByText('Counter Offer');
      fireEvent.click(counterButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/Quantity/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Unit Price/i)).toBeInTheDocument();
      });
    });
  });
});
