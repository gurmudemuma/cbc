/**
 * Component Tests - SalesContractDraftForm
 * Tests for form rendering, validation, field changes, and submission
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SalesContractDraftForm from '../../components/forms/SalesContractDraftForm';

describe('SalesContractDraftForm Component', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
    mockOnCancel.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Form Rendering', () => {
    it('should render form with title for create mode', () => {
      render(
        <SalesContractDraftForm
          onSubmit={mockOnSubmit}
          isEditMode={false}
        />
      );

      expect(screen.getByText('Create Sales Contract Draft')).toBeInTheDocument();
      expect(screen.getByText('Create a new contract for negotiation')).toBeInTheDocument();
    });

    it('should render form with title for edit mode', () => {
      render(
        <SalesContractDraftForm
          onSubmit={mockOnSubmit}
          isEditMode={true}
          initialData={{
            buyer_name: 'Test Buyer',
            buyer_email: 'buyer@example.com',
          }}
        />
      );

      expect(screen.getByText('Edit Sales Contract Draft')).toBeInTheDocument();
      expect(screen.getByText('Update contract details')).toBeInTheDocument();
    });

    it('should render all required form fields', () => {
      render(
        <SalesContractDraftForm
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByLabelText(/Buyer Name/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Buyer Email/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Coffee Type/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Quantity/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Unit Price/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Delivery Date/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Port of Discharge/)).toBeInTheDocument();
    });

    it('should render optional fields', () => {
      render(
        <SalesContractDraftForm
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByLabelText(/Origin Region/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Currency/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Payment Terms/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Incoterms/)).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      render(
        <SalesContractDraftForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/Save as Draft/i)).toBeInTheDocument();
      expect(screen.getByText(/Send to Buyer/i)).toBeInTheDocument();
      expect(screen.getByText(/Cancel/i)).toBeInTheDocument();
    });

    it('should display info alert with instructions', () => {
      render(
        <SalesContractDraftForm
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText(/Create a contract draft for negotiation/)).toBeInTheDocument();
    });
  });

  describe('Form Field Validation', () => {
    it('should show error for missing buyer name', async () => {
      render(
        <SalesContractDraftForm
          onSubmit={mockOnSubmit}
        />
      );

      const submitButton = screen.getByText(/Save as Draft/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Buyer name required')).toBeInTheDocument();
      });
    });

    it('should show error for missing buyer email', async () => {
      render(
        <SalesContractDraftForm
          onSubmit={mockOnSubmit}
        />
      );

      const buyerNameInput = screen.getByLabelText(/Buyer Name/);
      await userEvent.type(buyerNameInput, 'Test Buyer');

      const submitButton = screen.getByText(/Save as Draft/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Buyer email required')).toBeInTheDocument();
      });
    });

    it('should show error for invalid email format', async () => {
      render(
        <SalesContractDraftForm
          onSubmit={mockOnSubmit}
        />
      );

      const emailInput = screen.getByLabelText(/Buyer Email/);
      await userEvent.type(emailInput, 'invalid-email');

      const submitButton = screen.getByText(/Save as Draft/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Valid email required')).toBeInTheDocument();
      });
    });

    it('should show error for missing coffee type', async () => {
      render(
        <SalesContractDraftForm
          onSubmit={mockOnSubmit}
        />
      );

      const buyerNameInput = screen.getByLabelText(/Buyer Name/);
      const emailInput = screen.getByLabelText(/Buyer Email/);
      await userEvent.type(buyerNameInput, 'Test Buyer');
      await userEvent.type(emailInput, 'buyer@example.com');

      const submitButton = screen.getByText(/Save as Draft/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Coffee type required')).toBeInTheDocument();
      });
    });

    it('should show error for invalid quantity (zero)', async () => {
      render(
        <SalesContractDraftForm
          onSubmit={mockOnSubmit}
        />
      );

      const quantityInput = screen.getByLabelText(/Quantity/);
      await userEvent.type(quantityInput, '0');

      const submitButton = screen.getByText(/Save as Draft/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Valid quantity required (minimum 1 bag)')).toBeInTheDocument();
      });
    });

    it('should show error for invalid quantity (negative)', async () => {
      render(
        <SalesContractDraftForm
          onSubmit={mockOnSubmit}
        />
      );

      const quantityInput = screen.getByLabelText(/Quantity/);
      await userEvent.type(quantityInput, '-50');

      const submitButton = screen.getByText(/Save as Draft/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Valid quantity required (minimum 1 bag)')).toBeInTheDocument();
      });
    });

    it('should show error for invalid unit price (zero)', async () => {
      render(
        <SalesContractDraftForm
          onSubmit={mockOnSubmit}
        />
      );

      const priceInput = screen.getByLabelText(/Unit Price/);
      await userEvent.type(priceInput, '0');

      const submitButton = screen.getByText(/Save as Draft/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Valid unit price required')).toBeInTheDocument();
      });
    });

    it('should show error for invalid unit price (negative)', async () => {
      render(
        <SalesContractDraftForm
          onSubmit={mockOnSubmit}
        />
      );

      const priceInput = screen.getByLabelText(/Unit Price/);
      await userEvent.type(priceInput, '-100');

      const submitButton = screen.getByText(/Save as Draft/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Valid unit price required')).toBeInTheDocument();
      });
    });

    it('should show error for missing delivery date', async () => {
      render(
        <SalesContractDraftForm
          onSubmit={mockOnSubmit}
        />
      );

      const submitButton = screen.getByText(/Save as Draft/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Delivery date required')).toBeInTheDocument();
      });
    });

    it('should show error for past delivery date', async () => {
      render(
        <SalesContractDraftForm
          onSubmit={mockOnSubmit}
        />
      );

      const dateInput = screen.getByLabelText(/Delivery Date/);
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const formattedDate = pastDate.toISOString().split('T')[0];
      
      await userEvent.type(dateInput, formattedDate);

      const submitButton = screen.getByText(/Save as Draft/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Delivery date must be in the future')).toBeInTheDocument();
      });
    });

    it('should show error for missing port of discharge', async () => {
      render(
        <SalesContractDraftForm
          onSubmit={mockOnSubmit}
        />
      );

      const submitButton = screen.getByText(/Save as Draft/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Port of discharge required')).toBeInTheDocument();
      });
    });
  });

  describe('Form Field Changes', () => {
    it('should update buyer name field', async () => {
      render(
        <SalesContractDraftForm
          onSubmit={mockOnSubmit}
        />
      );

      const buyerNameInput = screen.getByLabelText(/Buyer Name/) as HTMLInputElement;
      await userEvent.type(buyerNameInput, 'ABC Coffee Imports');

      expect(buyerNameInput.value).toBe('ABC Coffee Imports');
    });

    it('should update buyer email field', async () => {
      render(
        <SalesContractDraftForm
          onSubmit={mockOnSubmit}
        />
      );

      const emailInput = screen.getByLabelText(/Buyer Email/) as HTMLInputElement;
      await userEvent.type(emailInput, 'buyer@example.com');

      expect(emailInput.value).toBe('buyer@example.com');
    });

    it('should update quantity field', async () => {
      render(
        <SalesContractDraftForm
          onSubmit={mockOnSubmit}
        />
      );

      const quantityInput = screen.getByLabelText(/Quantity/) as HTMLInputElement;
      await userEvent.type(quantityInput, '100');

      expect(quantityInput.value).toBe('100');
    });

    it('should update unit price field', async () => {
      render(
        <SalesContractDraftForm
          onSubmit={mockOnSubmit}
        />
      );

      const priceInput = screen.getByLabelText(/Unit Price/) as HTMLInputElement;
      await userEvent.type(priceInput, '150.50');

      expect(priceInput.value).toBe('150.50');
    });

    it('should calculate total value based on quantity and price', async () => {
      render(
        <SalesContractDraftForm
          onSubmit={mockOnSubmit}
        />
      );

      const quantityInput = screen.getByLabelText(/Quantity/);
      const priceInput = screen.getByLabelText(/Unit Price/);

      await userEvent.type(quantityInput, '100');
      await userEvent.type(priceInput, '150.50');

      // Total value should be displayed (100 * 150.50 = 15050)
      await waitFor(() => {
        expect(screen.getByText(/15050/)).toBeInTheDocument();
      });
    });

    it('should update currency field', async () => {
      render(
        <SalesContractDraftForm
          onSubmit={mockOnSubmit}
        />
      );

      const currencySelect = screen.getByLabelText(/Currency/);
      fireEvent.mouseDown(currencySelect);
      
      const eurOption = screen.getByText('EUR');
      fireEvent.click(eurOption);

      expect(currencySelect).toHaveValue('EUR');
    });

    it('should update payment terms field', async () => {
      render(
        <SalesContractDraftForm
          onSubmit={mockOnSubmit}
        />
      );

      const paymentTermsSelect = screen.getByLabelText(/Payment Terms/);
      fireEvent.mouseDown(paymentTermsSelect);
      
      const lcOption = screen.getByText('LC at Sight');
      fireEvent.click(lcOption);

      expect(paymentTermsSelect).toHaveValue('LC_AT_SIGHT');
    });

    it('should update incoterms field', async () => {
      render(
        <SalesContractDraftForm
          onSubmit={mockOnSubmit}
        />
      );

      const incotermsSelect = screen.getByLabelText(/Incoterms/);
      fireEvent.mouseDown(incotermsSelect);
      
      const cifOption = screen.getByText('CIF');
      fireEvent.click(cifOption);

      expect(incotermsSelect).toHaveValue('CIF');
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      render(
        <SalesContractDraftForm
          onSubmit={mockOnSubmit}
        />
      );

      const buyerNameInput = screen.getByLabelText(/Buyer Name/);
      const emailInput = screen.getByLabelText(/Buyer Email/);
      const coffeeTypeSelect = screen.getByLabelText(/Coffee Type/);
      const quantityInput = screen.getByLabelText(/Quantity/);
      const priceInput = screen.getByLabelText(/Unit Price/);
      const dateInput = screen.getByLabelText(/Delivery Date/);
      const portInput = screen.getByLabelText(/Port of Discharge/);

      await userEvent.type(buyerNameInput, 'ABC Coffee Imports');
      await userEvent.type(emailInput, 'buyer@example.com');
      fireEvent.mouseDown(coffeeTypeSelect);
      fireEvent.click(screen.getByText('Arabica Grade 1'));
      await userEvent.type(quantityInput, '100');
      await userEvent.type(priceInput, '150.50');
      
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const formattedDate = futureDate.toISOString().split('T')[0];
      await userEvent.type(dateInput, formattedDate);
      
      await userEvent.type(portInput, 'Port of Djibouti');

      const submitButton = screen.getByText(/Save as Draft/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            buyerName: 'ABC Coffee Imports',
            buyerEmail: 'buyer@example.com',
            coffeeType: 'Arabica Grade 1',
            quantity: 100,
            unitPrice: 150.50,
          })
        );
      });
    });

    it('should not submit form with invalid data', async () => {
      render(
        <SalesContractDraftForm
          onSubmit={mockOnSubmit}
        />
      );

      const submitButton = screen.getByText(/Save as Draft/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });

    it('should submit with sendToBuyer flag when Send to Buyer button is clicked', async () => {
      render(
        <SalesContractDraftForm
          onSubmit={mockOnSubmit}
        />
      );

      const buyerNameInput = screen.getByLabelText(/Buyer Name/);
      const emailInput = screen.getByLabelText(/Buyer Email/);
      const coffeeTypeSelect = screen.getByLabelText(/Coffee Type/);
      const quantityInput = screen.getByLabelText(/Quantity/);
      const priceInput = screen.getByLabelText(/Unit Price/);
      const dateInput = screen.getByLabelText(/Delivery Date/);
      const portInput = screen.getByLabelText(/Port of Discharge/);

      await userEvent.type(buyerNameInput, 'ABC Coffee Imports');
      await userEvent.type(emailInput, 'buyer@example.com');
      fireEvent.mouseDown(coffeeTypeSelect);
      fireEvent.click(screen.getByText('Arabica Grade 1'));
      await userEvent.type(quantityInput, '100');
      await userEvent.type(priceInput, '150.50');
      
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const formattedDate = futureDate.toISOString().split('T')[0];
      await userEvent.type(dateInput, formattedDate);
      
      await userEvent.type(portInput, 'Port of Djibouti');

      const sendButton = screen.getByText(/Send to Buyer/i);
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            sendToBuyer: true,
          })
        );
      });
    });

    it('should call onCancel when Cancel button is clicked', () => {
      render(
        <SalesContractDraftForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByText(/Cancel/i);
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Edit Mode', () => {
    it('should populate form with initial data in edit mode', () => {
      const initialData = {
        buyer_name: 'ABC Coffee Imports',
        buyer_email: 'buyer@example.com',
        coffee_type: 'Arabica Grade 1',
        quantity: 100,
        unit_price: 150.50,
        delivery_date: '2025-06-15',
        port_of_discharge: 'Port of Djibouti',
      };

      render(
        <SalesContractDraftForm
          onSubmit={mockOnSubmit}
          isEditMode={true}
          initialData={initialData}
        />
      );

      const buyerNameInput = screen.getByLabelText(/Buyer Name/) as HTMLInputElement;
      const emailInput = screen.getByLabelText(/Buyer Email/) as HTMLInputElement;
      const quantityInput = screen.getByLabelText(/Quantity/) as HTMLInputElement;
      const priceInput = screen.getByLabelText(/Unit Price/) as HTMLInputElement;

      expect(buyerNameInput.value).toBe('ABC Coffee Imports');
      expect(emailInput.value).toBe('buyer@example.com');
      expect(quantityInput.value).toBe('100');
      expect(priceInput.value).toBe('150.50');
    });

    it('should allow updating fields in edit mode', async () => {
      const initialData = {
        buyer_name: 'ABC Coffee Imports',
        buyer_email: 'buyer@example.com',
        coffee_type: 'Arabica Grade 1',
        quantity: 100,
        unit_price: 150.50,
        delivery_date: '2025-06-15',
        port_of_discharge: 'Port of Djibouti',
      };

      render(
        <SalesContractDraftForm
          onSubmit={mockOnSubmit}
          isEditMode={true}
          initialData={initialData}
        />
      );

      const quantityInput = screen.getByLabelText(/Quantity/) as HTMLInputElement;
      
      // Clear and update quantity
      await userEvent.clear(quantityInput);
      await userEvent.type(quantityInput, '150');

      expect(quantityInput.value).toBe('150');
    });
  });

  describe('Loading State', () => {
    it('should disable submit buttons when loading', () => {
      render(
        <SalesContractDraftForm
          onSubmit={mockOnSubmit}
          loading={true}
        />
      );

      const saveButton = screen.getByText(/Save as Draft/i) as HTMLButtonElement;
      const sendButton = screen.getByText(/Send to Buyer/i) as HTMLButtonElement;

      expect(saveButton.disabled).toBe(true);
      expect(sendButton.disabled).toBe(true);
    });

    it('should display loading spinner when loading', () => {
      render(
        <SalesContractDraftForm
          onSubmit={mockOnSubmit}
          loading={true}
        />
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Certification Selection', () => {
    it('should toggle certification selection', async () => {
      render(
        <SalesContractDraftForm
          onSubmit={mockOnSubmit}
        />
      );

      const organicCheckbox = screen.getByLabelText(/ORGANIC/);
      fireEvent.click(organicCheckbox);

      expect(organicCheckbox).toBeChecked();

      fireEvent.click(organicCheckbox);
      expect(organicCheckbox).not.toBeChecked();
    });

    it('should allow multiple certifications', async () => {
      render(
        <SalesContractDraftForm
          onSubmit={mockOnSubmit}
        />
      );

      const organicCheckbox = screen.getByLabelText(/ORGANIC/);
      const fairTradeCheckbox = screen.getByLabelText(/FAIR_TRADE/);

      fireEvent.click(organicCheckbox);
      fireEvent.click(fairTradeCheckbox);

      expect(organicCheckbox).toBeChecked();
      expect(fairTradeCheckbox).toBeChecked();
    });
  });
});
