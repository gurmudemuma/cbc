import { useState } from 'react';
import {
  Card, CardHeader, CardContent, CardActions, Button, TextField, Grid,
  Alert, CircularProgress, Box, Typography, Divider, Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import { CheckCircle, FileText } from 'lucide-react';

interface SalesContractDraftFormProps {
  buyerId: string;
  buyerName: string;
  onSubmit: (data: any) => void;
  loading?: boolean;
}

const SalesContractDraftForm = ({
  buyerId,
  buyerName,
  onSubmit,
  loading = false,
}: SalesContractDraftFormProps): JSX.Element => {
  const [formData, setFormData] = useState({
    coffeeType: '',
    originRegion: '',
    quantity: '',
    unitPrice: '',
    currency: 'USD',
    paymentTerms: 'Net 30',
    paymentMethod: 'LC',
    incoterms: 'FOB',
    deliveryDate: '',
    portOfLoading: 'Port of Djibouti',
    portOfDischarge: '',
    governingLaw: 'CISG',
    arbitrationLocation: 'Geneva',
    arbitrationRules: 'ICC',
    qualityGrade: 'Grade 1',
    specialConditions: '',
    certificationsRequired: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const coffeeTypes = [
    'Arabica Grade 1',
    'Arabica Grade 2',
    'Robusta Grade 1',
    'Robusta Grade 2',
    'Specialty Coffee',
    'Organic Arabica',
    'Yirgacheffe',
  ];

  const qualityGrades = ['Grade 1', 'Grade 2', 'Grade 3', 'Premium'];
  const certifications = ['ORGANIC', 'FAIR_TRADE', 'RAINFOREST', 'UTZ'];

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.coffeeType?.trim()) newErrors.coffeeType = 'Coffee type required';
    if (!formData.quantity || parseFloat(formData.quantity) <= 0)
      newErrors.quantity = 'Valid quantity required';
    if (!formData.unitPrice || parseFloat(formData.unitPrice) <= 0)
      newErrors.unitPrice = 'Valid unit price required';
    if (!formData.deliveryDate) newErrors.deliveryDate = 'Delivery date required';
    if (!formData.portOfDischarge?.trim())
      newErrors.portOfDischarge = 'Port of discharge required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({
      buyerId,
      ...formData,
      quantity: parseInt(formData.quantity),
      unitPrice: parseFloat(formData.unitPrice),
    });
  };

  const totalValue = formData.quantity && formData.unitPrice
    ? (parseInt(formData.quantity) * parseFloat(formData.unitPrice)).toFixed(2)
    : '0.00';

  const handleCertificationToggle = (cert: string) => {
    setFormData((prev) => ({
      ...prev,
      certificationsRequired: prev.certificationsRequired.includes(cert)
        ? prev.certificationsRequired.filter((c) => c !== cert)
        : [...prev.certificationsRequired, cert],
    }));
  };

  return (
    <Card>
      <CardHeader
        avatar={<FileText size={32} color="#1976d2" />}
        title="Create Sales Contract Draft"
        subheader={`Buyer: ${buyerName}`}
      />
      <Divider />
      <CardContent>
        <Alert severity="info" sx={{ mb: 3 }}>
          Create a contract draft for negotiation. Both parties can counter-offer before
          finalization.
        </Alert>

        <Grid container spacing={2}>
          {/* Coffee Details */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Coffee Details
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.coffeeType}>
              <InputLabel>Coffee Type *</InputLabel>
              <Select
                value={formData.coffeeType}
                onChange={(e) => setFormData({ ...formData, coffeeType: e.target.value })}
                label="Coffee Type *"
              >
                {coffeeTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {errors.coffeeType && (
              <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                {errors.coffeeType}
              </Typography>
            )}
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Origin Region"
              value={formData.originRegion}
              onChange={(e) => setFormData({ ...formData, originRegion: e.target.value })}
              placeholder="e.g., Yirgacheffe Region"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="number"
              label="Quantity (bags) *"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              placeholder="e.g., 150"
              required
              error={!!errors.quantity}
              helperText={errors.quantity}
              inputProps={{ min: 1 }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="number"
              label="Unit Price (USD) *"
              value={formData.unitPrice}
              onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
              placeholder="e.g., 4.00"
              required
              error={!!errors.unitPrice}
              helperText={errors.unitPrice}
              inputProps={{ min: 0.01, step: 0.01 }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Total Value
              </Typography>
              <Typography variant="h6" color="primary">
                ${totalValue} {formData.currency}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Quality Grade</InputLabel>
              <Select
                value={formData.qualityGrade}
                onChange={(e) => setFormData({ ...formData, qualityGrade: e.target.value })}
                label="Quality Grade"
              >
                {qualityGrades.map((grade) => (
                  <MenuItem key={grade} value={grade}>
                    {grade}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Payment & Delivery */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, mt: 2 }}>
              Payment & Delivery Terms
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Payment Terms"
              value={formData.paymentTerms}
              onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
              placeholder="e.g., Net 30"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Payment Method</InputLabel>
              <Select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                label="Payment Method"
              >
                <MenuItem value="LC">Letter of Credit (LC)</MenuItem>
                <MenuItem value="TT">Telegraphic Transfer (TT)</MenuItem>
                <MenuItem value="DP">Documents Against Payment (DP)</MenuItem>
                <MenuItem value="DA">Documents Against Acceptance (DA)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Incoterms</InputLabel>
              <Select
                value={formData.incoterms}
                onChange={(e) => setFormData({ ...formData, incoterms: e.target.value })}
                label="Incoterms"
              >
                <MenuItem value="FOB">FOB - Free On Board</MenuItem>
                <MenuItem value="CIF">CIF - Cost, Insurance & Freight</MenuItem>
                <MenuItem value="CFR">CFR - Cost and Freight</MenuItem>
                <MenuItem value="EXW">EXW - Ex Works</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="date"
              label="Delivery Date *"
              value={formData.deliveryDate}
              onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
              required
              error={!!errors.deliveryDate}
              helperText={errors.deliveryDate}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Port of Loading"
              value={formData.portOfLoading}
              onChange={(e) => setFormData({ ...formData, portOfLoading: e.target.value })}
              placeholder="e.g., Port of Djibouti"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Port of Discharge *"
              value={formData.portOfDischarge}
              onChange={(e) => setFormData({ ...formData, portOfDischarge: e.target.value })}
              placeholder="e.g., Port of Hamburg"
              required
              error={!!errors.portOfDischarge}
              helperText={errors.portOfDischarge}
            />
          </Grid>

          {/* Legal Framework */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, mt: 2 }}>
              Legal Framework
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Governing Law</InputLabel>
              <Select
                value={formData.governingLaw}
                onChange={(e) => setFormData({ ...formData, governingLaw: e.target.value })}
                label="Governing Law"
              >
                <MenuItem value="CISG">UN Convention on Contracts for International Sale of Goods</MenuItem>
                <MenuItem value="ETHIOPIAN_LAW">Ethiopian Commercial Code</MenuItem>
                <MenuItem value="COMMON_LAW">Common Law</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Arbitration Rules</InputLabel>
              <Select
                value={formData.arbitrationRules}
                onChange={(e) => setFormData({ ...formData, arbitrationRules: e.target.value })}
                label="Arbitration Rules"
              >
                <MenuItem value="ICC">ICC Rules for Arbitration</MenuItem>
                <MenuItem value="UNCITRAL">UNCITRAL Arbitration Rules</MenuItem>
                <MenuItem value="LCIA">LCIA Rules</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Arbitration Location"
              value={formData.arbitrationLocation}
              onChange={(e) => setFormData({ ...formData, arbitrationLocation: e.target.value })}
              placeholder="e.g., Geneva"
            />
          </Grid>

          {/* Certifications */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, mt: 2 }}>
              Required Certifications
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {certifications.map((cert) => (
                <Button
                  key={cert}
                  variant={
                    formData.certificationsRequired.includes(cert) ? 'contained' : 'outlined'
                  }
                  size="small"
                  onClick={() => handleCertificationToggle(cert)}
                >
                  {cert}
                </Button>
              ))}
            </Box>
          </Grid>

          {/* Special Conditions */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Special Conditions"
              value={formData.specialConditions}
              onChange={(e) => setFormData({ ...formData, specialConditions: e.target.value })}
              placeholder="e.g., Organic certified, Fair Trade compliant, etc."
            />
          </Grid>
        </Grid>
      </CardContent>
      <Divider />
      <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <CheckCircle size={18} />}
          onClick={handleSubmit}
          disabled={loading}
          size="large"
        >
          {loading ? 'Creating Draft...' : 'Create Draft'}
        </Button>
      </CardActions>
    </Card>
  );
};

export default SalesContractDraftForm;
