/**
 * Bank LC Creation Form
 * For CBE/Bank officers to create LC records when receiving MT700 from issuing bank
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Grid,
  MenuItem,
  Divider,
  Stack,
} from '@mui/material';
import { Save, Cancel } from '@mui/icons-material';
import axios from 'axios';

interface BankLCCreationFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  contractId?: string;
}

const BankLCCreationForm: React.FC<BankLCCreationFormProps> = ({
  open,
  onClose,
  onSuccess,
  contractId: initialContractId,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    contractId: initialContractId || '',
    exporterId: '',
    lcNumber: '',
    lcType: 'IRREVOCABLE',
    issuingBankName: '',
    issuingBankSwiftCode: '',
    issuingBankCountry: '',
    beneficiaryName: '',
    beneficiaryAddress: '',
    applicantName: '',
    applicantAddress: '',
    applicantCountry: '',
    lcAmount: '',
    lcCurrency: 'USD',
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    latestShipmentDate: '',
    paymentTerms: 'AT_SIGHT',
    incoterms: 'FOB',
    portOfLoading: 'Addis Ababa',
    portOfDischarge: '',
    goodsDescription: 'Ethiopian Arabica Coffee Beans',
    mt700Message: '',
  });

  useEffect(() => {
    if (initialContractId) {
      setFormData(prev => ({ ...prev, contractId: initialContractId }));
    }
  }, [initialContractId]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      // Validation
      if (!formData.contractId || !formData.exporterId || !formData.lcNumber) {
        setError('Contract, Exporter, and LC Number are required');
        setLoading(false);
        return;
      }

      if (!formData.issuingBankName || !formData.issuingBankSwiftCode) {
        setError('Issuing bank details are required');
        setLoading(false);
        return;
      }

      if (!formData.lcAmount || parseFloat(formData.lcAmount) <= 0) {
        setError('Valid LC amount is required');
        setLoading(false);
        return;
      }

      if (!formData.expiryDate) {
        setError('Expiry date is required');
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('token');
      await axios.post(
        '/api/lc/create',
        {
          ...formData,
          lcAmount: parseFloat(formData.lcAmount),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      onSuccess();
      handleClose();
    } catch (err: any) {
      console.error('Error creating LC:', err);
      setError(
        err.response?.data?.error?.details ||
        err.response?.data?.message ||
        'Failed to create LC. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      contractId: '',
      exporterId: '',
      lcNumber: '',
      lcType: 'IRREVOCABLE',
      issuingBankName: '',
      issuingBankSwiftCode: '',
      issuingBankCountry: '',
      beneficiaryName: '',
      beneficiaryAddress: '',
      applicantName: '',
      applicantAddress: '',
      applicantCountry: '',
      lcAmount: '',
      lcCurrency: 'USD',
      issueDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      latestShipmentDate: '',
      paymentTerms: 'AT_SIGHT',
      incoterms: 'FOB',
      portOfLoading: 'Addis Ababa',
      portOfDischarge: '',
      goodsDescription: 'Ethiopian Arabica Coffee Beans',
      mt700Message: '',
    });
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6">Create Letter of Credit</Typography>
        <Typography variant="body2" color="text.secondary">
          Record LC received from issuing bank (SWIFT MT700)
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            As the advising bank (CBE), you are recording an LC issued by the buyer's bank.
            Enter the ECTA reference number from the SWIFT MT700 message received from the issuing bank.
            The exporter will be notified and can accept or reject the LC terms.
          </Alert>

          {/* Contract Details */}
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
            Contract Reference
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="ECTA Reference Number (Contract ID)"
                value={formData.contractId}
                onChange={(e) => handleChange('contractId', e.target.value)}
                placeholder="ECTA-2026-000001"
                helperText="ECTA reference number from MT700 (format: ECTA-YYYY-XXXXXX)"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Exporter ID"
                value={formData.exporterId}
                onChange={(e) => handleChange('exporterId', e.target.value)}
                placeholder="Enter exporter UUID"
                helperText="Beneficiary exporter UUID"
              />
            </Grid>
          </Grid>

          {/* LC Identification */}
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
            LC Identification
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="LC Number"
                value={formData.lcNumber}
                onChange={(e) => handleChange('lcNumber', e.target.value)}
                placeholder="LC-2026-001"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="LC Type"
                value={formData.lcType}
                onChange={(e) => handleChange('lcType', e.target.value)}
              >
                <MenuItem value="IRREVOCABLE">Irrevocable</MenuItem>
                <MenuItem value="CONFIRMED">Confirmed</MenuItem>
                <MenuItem value="TRANSFERABLE">Transferable</MenuItem>
                <MenuItem value="STANDBY">Standby</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          {/* Issuing Bank Details */}
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
            Issuing Bank (Buyer's Bank)
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Bank Name"
                value={formData.issuingBankName}
                onChange={(e) => handleChange('issuingBankName', e.target.value)}
                placeholder="Bank of America"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                required
                label="SWIFT Code"
                value={formData.issuingBankSwiftCode}
                onChange={(e) => handleChange('issuingBankSwiftCode', e.target.value)}
                placeholder="BOFAUS3N"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                required
                label="Country"
                value={formData.issuingBankCountry}
                onChange={(e) => handleChange('issuingBankCountry', e.target.value)}
                placeholder="USA"
              />
            </Grid>
          </Grid>

          {/* Parties */}
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
            Parties
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Beneficiary (Exporter)"
                value={formData.beneficiaryName}
                onChange={(e) => handleChange('beneficiaryName', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Beneficiary Address"
                value={formData.beneficiaryAddress}
                onChange={(e) => handleChange('beneficiaryAddress', e.target.value)}
                placeholder="Addis Ababa, Ethiopia"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Applicant (Buyer)"
                value={formData.applicantName}
                onChange={(e) => handleChange('applicantName', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Applicant Address"
                value={formData.applicantAddress}
                onChange={(e) => handleChange('applicantAddress', e.target.value)}
                placeholder="New York, USA"
              />
            </Grid>
          </Grid>

          {/* Amount and Dates */}
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
            Amount and Validity
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                required
                type="number"
                label="LC Amount"
                value={formData.lcAmount}
                onChange={(e) => handleChange('lcAmount', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                select
                label="Currency"
                value={formData.lcCurrency}
                onChange={(e) => handleChange('lcCurrency', e.target.value)}
              >
                <MenuItem value="USD">USD</MenuItem>
                <MenuItem value="EUR">EUR</MenuItem>
                <MenuItem value="GBP">GBP</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                required
                type="date"
                label="Issue Date"
                value={formData.issueDate}
                onChange={(e) => handleChange('issueDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                required
                type="date"
                label="Expiry Date"
                value={formData.expiryDate}
                onChange={(e) => handleChange('expiryDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          {/* Terms */}
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
            Payment Terms
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Payment Terms"
                value={formData.paymentTerms}
                onChange={(e) => handleChange('paymentTerms', e.target.value)}
              >
                <MenuItem value="AT_SIGHT">At Sight</MenuItem>
                <MenuItem value="DEFERRED_PAYMENT">Deferred Payment</MenuItem>
                <MenuItem value="ACCEPTANCE">Acceptance</MenuItem>
                <MenuItem value="NEGOTIATION">Negotiation</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Incoterms"
                value={formData.incoterms}
                onChange={(e) => handleChange('incoterms', e.target.value)}
              >
                <MenuItem value="FOB">FOB - Free on Board</MenuItem>
                <MenuItem value="CIF">CIF - Cost, Insurance & Freight</MenuItem>
                <MenuItem value="CFR">CFR - Cost and Freight</MenuItem>
                <MenuItem value="EXW">EXW - Ex Works</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          {/* Goods Description */}
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
            Goods Description
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description of Goods"
            value={formData.goodsDescription}
            onChange={(e) => handleChange('goodsDescription', e.target.value)}
          />

          {/* MT700 Message */}
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
            SWIFT MT700 Message (Optional)
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <TextField
            fullWidth
            multiline
            rows={4}
            label="MT700 Message"
            value={formData.mt700Message}
            onChange={(e) => handleChange('mt700Message', e.target.value)}
            placeholder="Paste the complete SWIFT MT700 message here..."
          />

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <Save />}
        >
          {loading ? 'Creating LC...' : 'Create LC'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BankLCCreationForm;
