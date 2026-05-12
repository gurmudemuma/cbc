import { useState } from 'react';
import {
  Card, CardHeader, CardContent, CardActions, Button, TextField, Grid, Box, Typography,
  Divider, Alert, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableRow, Paper, Stack, Chip,
} from '@mui/material';
import { Send, AlertCircle, CheckCircle, X } from 'lucide-react';

interface Draft {
  draft_id: string;
  contract_number: string;
  status: string;
  buyer_name: string;
  buyer_email: string;
  coffee_type: string;
  quantity: number;
  unit_price: number;
  total_value: number;
  payment_terms: string;
  incoterms: string;
  delivery_date: string;
  port_of_loading: string;
  port_of_discharge: string;
  currency: string;
  [key: string]: any;
}

interface SalesContractNegotiationFormProps {
  draft: Draft;
  onSend?: () => void;
  onAccept: () => void;
  onReject: (reason: string) => void;
  onCounter: (updates: any, notes: string) => void;
  loading?: boolean;
}

const SalesContractNegotiationForm = ({
  draft,
  onSend,
  onAccept,
  onReject,
  onCounter,
  loading = false,
}: SalesContractNegotiationFormProps) => {
  const [counterData, setCounterData] = useState({
    quantity: draft.quantity,
    unit_price: draft.unit_price,
    delivery_date: draft.delivery_date,
    payment_terms: draft.payment_terms,
    notes: '',
  });

  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showCounterDialog, setShowCounterDialog] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateCounter = () => {
    const newErrors: Record<string, string> = {};
    if (!counterData.quantity || counterData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }
    if (!counterData.unit_price || counterData.unit_price <= 0) {
      newErrors.unit_price = 'Unit price must be greater than 0';
    }
    if (!counterData.delivery_date) {
      newErrors.delivery_date = 'Delivery date is required';
    }
    if (!counterData.notes.trim()) {
      newErrors.notes = 'Please provide notes for your counter-offer';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitCounter = () => {
    if (!validateCounter()) return;
    onCounter(
      {
        quantity: counterData.quantity,
        unit_price: counterData.unit_price,
        delivery_date: counterData.delivery_date,
        payment_terms: counterData.payment_terms,
      },
      counterData.notes
    );
    setShowCounterDialog(false);
  };

  const handleSubmitReject = () => {
    if (!rejectionReason.trim()) {
      setErrors({ reason: 'Please provide a rejection reason' });
      return;
    }
    onReject(rejectionReason);
    setShowRejectDialog(false);
  };

  const totalValue = (counterData.quantity * counterData.unit_price).toFixed(2);
  const originalTotal = (draft.quantity * draft.unit_price).toFixed(2);

  const hasChanges = {
    quantity: counterData.quantity !== draft.quantity,
    unit_price: counterData.unit_price !== draft.unit_price,
    delivery_date: counterData.delivery_date !== draft.delivery_date,
    payment_terms: counterData.payment_terms !== draft.payment_terms,
  };

  const TermRow = ({ label, original, proposed, changed }: any) => (
    <TableRow sx={{ bgcolor: changed ? '#fff3cd' : 'transparent' }}>
      <TableCell sx={{ fontWeight: 600, width: '30%' }}>{label}</TableCell>
      <TableCell sx={{ width: '35%' }}>
        <Typography variant="body2">{original}</Typography>
      </TableCell>
      <TableCell sx={{ width: '35%' }}>
        {changed ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'warning.main' }}>
              {proposed}
            </Typography>
            <Chip label="Changed" size="small" color="warning" />
          </Box>
        ) : (
          <Typography variant="body2">{proposed}</Typography>
        )}
      </TableCell>
    </TableRow>
  );

  return (
    <>
      <Card>
        <CardHeader
          title="Contract Negotiation"
          subheader={`Status: ${draft.status} | Contract #${draft.contract_number}`}
        />
        <Divider />
        <CardContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            Review the contract terms below. You can accept, reject, or submit a counter-offer with modifications.
          </Alert>

          {/* Contract Details Comparison */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Contract Terms Comparison
            </Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableBody>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Field</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Current Terms</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Your Proposal</TableCell>
                  </TableRow>
                  <TermRow
                    label="Coffee Type"
                    original={draft.coffee_type}
                    proposed={draft.coffee_type}
                    changed={false}
                  />
                  <TermRow
                    label="Quantity (bags)"
                    original={draft.quantity}
                    proposed={counterData.quantity}
                    changed={hasChanges.quantity}
                  />
                  <TermRow
                    label="Unit Price (USD)"
                    original={`$${parseFloat(draft.unit_price || 0).toFixed(2)}`}
                    proposed={`$${parseFloat(counterData.unit_price || 0).toFixed(2)}`}
                    changed={hasChanges.unit_price}
                  />
                  <TermRow
                    label="Total Value"
                    original={`$${originalTotal}`}
                    proposed={`$${totalValue}`}
                    changed={hasChanges.quantity || hasChanges.unit_price}
                  />
                  <TermRow
                    label="Delivery Date"
                    original={new Date(draft.delivery_date).toLocaleDateString()}
                    proposed={new Date(counterData.delivery_date).toLocaleDateString()}
                    changed={hasChanges.delivery_date}
                  />
                  <TermRow
                    label="Payment Terms"
                    original={draft.payment_terms}
                    proposed={counterData.payment_terms}
                    changed={hasChanges.payment_terms}
                  />
                  <TermRow
                    label="Port of Loading"
                    original={draft.port_of_loading}
                    proposed={draft.port_of_loading}
                    changed={false}
                  />
                  <TermRow
                    label="Port of Discharge"
                    original={draft.port_of_discharge}
                    proposed={draft.port_of_discharge}
                    changed={false}
                  />
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Full Contract Details */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Full Contract Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Buyer Information
                  </Typography>
                  <Typography variant="body2">
                    <strong>Name:</strong> {draft.buyer_name}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Email:</strong> {draft.buyer_email}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Incoterms & Payment
                  </Typography>
                  <Typography variant="body2">
                    <strong>Incoterms:</strong> {draft.incoterms}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Currency:</strong> {draft.currency}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Counter-Offer Form */}
          {draft.status === 'COUNTERED' && (
            <Box sx={{ p: 2, bgcolor: '#f0f7ff', borderRadius: 1, mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                Propose Counter-Offer
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Quantity (bags)"
                    value={counterData.quantity}
                    onChange={(e) => setCounterData({ ...counterData, quantity: parseInt(e.target.value) || 0 })}
                    inputProps={{ min: 1 }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Unit Price (USD)"
                    value={counterData.unit_price}
                    onChange={(e) => setCounterData({ ...counterData, unit_price: parseFloat(e.target.value) || 0 })}
                    inputProps={{ min: 0.01, step: 0.01 }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Delivery Date"
                    value={counterData.delivery_date}
                    onChange={(e) => setCounterData({ ...counterData, delivery_date: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Payment Terms"
                    value={counterData.payment_terms}
                    onChange={(e) => setCounterData({ ...counterData, payment_terms: e.target.value })}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ p: 1.5, bgcolor: '#e3f2fd', borderRadius: 0.5 }}>
                    <Typography variant="caption" color="primary">
                      <strong>Proposed Total Value:</strong> ${totalValue} {draft.currency}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
        <Divider />
        <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
          <Stack direction="row" spacing={1}>
            {/* Reject button - available for COUNTERED status (buyer's counter-offer) */}
            {draft.status === 'COUNTERED' && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<X size={18} />}
                onClick={() => setShowRejectDialog(true)}
                disabled={loading}
              >
                Reject
              </Button>
            )}
            
            {/* Counter-Offer button - available for COUNTERED status */}
            {draft.status === 'COUNTERED' && (
              <Button
                variant="outlined"
                color="primary"
                startIcon={<Send size={18} />}
                onClick={() => setShowCounterDialog(true)}
                disabled={loading}
              >
                Counter-Offer
              </Button>
            )}
            
            {/* Accept button - available for COUNTERED status */}
            {draft.status === 'COUNTERED' && (
              <Button
                variant="contained"
                color="success"
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <CheckCircle size={18} />}
                onClick={onAccept}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Accept'}
              </Button>
            )}
            
            {/* Send to Buyer button - available for DRAFT status */}
            {draft.status === 'DRAFT' && onSend && (
              <Button
                variant="contained"
                color="primary"
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Send size={18} />}
                onClick={onSend}
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send to Buyer'}
              </Button>
            )}
          </Stack>
        </CardActions>
      </Card>

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onClose={() => setShowRejectDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Contract</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Please provide a reason for rejecting this contract.
          </Alert>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Rejection Reason"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="e.g., Price is too high, delivery date doesn't work, etc."
            error={!!(errors.reason)}
            helperText={errors.reason}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRejectDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleSubmitReject}
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
            Reject
          </Button>
        </DialogActions>
      </Dialog>

      {/* Counter-Offer Dialog */}
      <Dialog open={showCounterDialog} onClose={() => setShowCounterDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Submit Counter-Offer</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Review your proposed changes and add notes explaining your counter-offer.
          </Alert>
          <Box sx={{ mb: 2, p: 1.5, bgcolor: '#f0f7ff', borderRadius: 1 }}>
            <Typography variant="caption" color="primary">
              <strong>Proposed Total Value:</strong> ${totalValue} {draft.currency}
            </Typography>
          </Box>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Notes for Counter-Offer"
            value={counterData.notes}
            onChange={(e) => setCounterData({ ...counterData, notes: e.target.value })}
            placeholder="Explain your proposed changes and why they benefit both parties..."
            error={!!(errors.notes)}
            helperText={errors.notes}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCounterDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmitCounter}
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
            Submit Counter-Offer
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SalesContractNegotiationForm;
