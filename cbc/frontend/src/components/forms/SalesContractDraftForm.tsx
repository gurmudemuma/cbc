import { useState, useEffect } from 'react';
import {
  Card, CardHeader, CardContent, CardActions, Button, TextField, Grid,
  Alert, CircularProgress, Box, Typography, Divider, Select, MenuItem, FormControl, InputLabel,
  Stack,
} from '@mui/material';
import { CheckCircle, FileText, X } from 'lucide-react';

interface SalesContractDraftFormProps {
  buyerId?: string;
  buyerName?: string;
  onSubmit: (data: any) => void;
  onCancel?: () => void;
  loading?: boolean;
  initialData?: any;
  isEditMode?: boolean;
}

const SalesContractDraftForm = ({
  buyerId = '',
  buyerName = '',
  onSubmit,
  onCancel,
  loading = false,
  initialData,
  isEditMode = false,
}: SalesContractDraftFormProps): JSX.Element => {
  const [formData, setFormData] = useState({
    buyerName: buyerName || '',
    buyerEmail: '',
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
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

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
    if (!formData.buyerName?.trim()) newErrors.buyerName = 'Buyer name required';
    if (!formData.buyerEmail?.trim()) newErrors.buyerEmail = 'Buyer email required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.buyerEmail))
      newErrors.buyerEmail = 'Valid email required';
    if (!formData.coffeeType?.trim()) newErrors.coffeeType = 'Coffee type required';
    if (!formData.quantity || parseFloat(formData.quantity) <= 0)
      newErrors.quantity = 'Valid quantity required (minimum 1 bag)';
    if (!formData.unitPrice || parseFloat(formData.unitPrice) <= 0)
      newErrors.unitPrice = 'Valid unit price required';
    if (!formData.deliveryDate) newErrors.deliveryDate = 'Delivery date required';
    else {
      const deliveryDate = new Date(formData.deliveryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (deliveryDate <= today) {
        newErrors.deliveryDate = 'Delivery date must be in the future';
      }
    }
    if (!formData.portOfDischarge?.trim())
      newErrors.portOfDischarge = 'Port of discharge required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Initialize form with initial data if provided
  useEffect(() => {
    if (initialData && isEditMode) {
      setFormData({
        buyerName: initialData.buyer_name || '',
        buyerEmail: initialData.buyer_email || '',
        coffeeType: initialData.coffee_type || '',
        originRegion: initialData.origin_region || '',
        quantity: initialData.quantity?.toString() || '',
        unitPrice: initialData.unit_price?.toString() || '',
        currency: initialData.currency || 'USD',
        paymentTerms: initialData.payment_terms || 'Net 30',
        paymentMethod: initialData.payment_method || 'LC',
        incoterms: initialData.incoterms || 'FOB',
        deliveryDate: initialData.delivery_date || '',
        portOfLoading: initialData.port_of_loading || 'Port of Djibouti',
        portOfDischarge: initialData.port_of_discharge || '',
        governingLaw: initialData.governing_law || 'CISG',
        arbitrationLocation: initialData.arbitration_location || 'Geneva',
        arbitrationRules: initialData.arbitration_rules || 'ICC',
        qualityGrade: initialData.quality_grade || 'Grade 1',
        specialConditions: initialData.special_conditions || '',
        certificationsRequired: initialData.certifications_required || [],
      });
    }
  }, [initialData, isEditMode]);

  const handleSubmit = () => {
    setSubmitAttempted(true);
    if (!validate()) return;
    onSubmit({
      buyerId,
      ...formData,
      quantity: parseInt(formData.quantity),
      unitPrice: parseFloat(formData.unitPrice),
    });
  };

  const handleSendToBuyer = () => {
    setSubmitAttempted(true);
    if (!validate()) return;
    onSubmit({
      buyerId,
      ...formData,
      quantity: parseInt(formData.quantity),
      unitPrice: parseFloat(formData.unitPrice),
      sendToBuyer: true,
    });
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleFieldBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
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
        title={isEditMode ? 'Edit Sales Contract Draft' : 'Create Sales Contract Draft'}
        subheader={isEditMode ? 'Update contract details' : 'Create a new contract for negotiation'}
      />
      <Divider />
      <CardContent>
        <Alert severity="info" sx={{ mb: 3 }}>
          {isEditMode
            ? 'Update contract details. You can save as draft or send to buyer for negotiation.'
            : 'Create a contract draft for negotiation. Both parties can counter-offer before finalization.'}
        </Alert>

        <Grid container spacing={2}>
          {/* Buyer Information */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Buyer Information
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Buyer Name *"
              value={formData.buyerName}
              onChange={(e) => handleFieldChange('buyerName', e.target.value)}
              onBlur={() => handleFieldBlur('buyerName')}
              placeholder="e.g., ABC Coffee Imports Ltd"
              required
              error={!!(touched.buyerName && errors.buyerName)}
              helperText={touched.buyerName && errors.buyerName}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="email"
              label="Buyer Email *"
              value={formData.buyerEmail}
              onChange={(e) => handleFieldChange('buyerEmail', e.target.value)}
              onBlur={() => handleFieldBlur('buyerEmail')}
              placeholder="e.g., buyer@company.com"
              required
              error={!!(touched.buyerEmail && errors.buyerEmail)}
              helperText={touched.buyerEmail && errors.buyerEmail}
            />
          </Grid>

          {/* Coffee Details */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, mt: 2 }}>
              Coffee Details
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!(touched.coffeeType && errors.coffeeType)}>
              <InputLabel>Coffee Type *</InputLabel>
              <Select
                value={formData.coffeeType}
                onChange={(e) => handleFieldChange('coffeeType', e.target.value)}
                onBlur={() => handleFieldBlur('coffeeType')}
                label="Coffee Type *"
              >
                {coffeeTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {touched.coffeeType && errors.coffeeType && (
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
              onChange={(e) => handleFieldChange('originRegion', e.target.value)}
              placeholder="e.g., Yirgacheffe Region"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="number"
              label="Quantity (bags) *"
              value={formData.quantity}
              onChange={(e) => handleFieldChange('quantity', e.target.value)}
              onBlur={() => handleFieldBlur('quantity')}
              placeholder="e.g., 150"
              required
              error={!!(touched.quantity && errors.quantity)}
              helperText={touched.quantity && errors.quantity}
              inputProps={{ min: 1 }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="number"
              label="Unit Price (USD) *"
              value={formData.unitPrice}
              onChange={(e) => handleFieldChange('unitPrice', e.target.value)}
              onBlur={() => handleFieldBlur('unitPrice')}
              placeholder="e.g., 4.00"
              required
              error={!!(touched.unitPrice && errors.unitPrice)}
              helperText={touched.unitPrice && errors.unitPrice}
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
                onChange={(e) => handleFieldChange('qualityGrade', e.target.value)}
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
              onChange={(e) => handleFieldChange('paymentTerms', e.target.value)}
              placeholder="e.g., Net 30"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Payment Method</InputLabel>
              <Select
                value={formData.paymentMethod}
                onChange={(e) => handleFieldChange('paymentMethod', e.target.value)}
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
                onChange={(e) => handleFieldChange('incoterms', e.target.value)}
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
              onChange={(e) => handleFieldChange('deliveryDate', e.target.value)}
              onBlur={() => handleFieldBlur('deliveryDate')}
              required
              error={!!(touched.deliveryDate && errors.deliveryDate)}
              helperText={touched.deliveryDate && errors.deliveryDate}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Port of Loading"
              value={formData.portOfLoading}
              onChange={(e) => handleFieldChange('portOfLoading', e.target.value)}
              placeholder="e.g., Port of Djibouti"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Port of Discharge *"
              value={formData.portOfDischarge}
              onChange={(e) => handleFieldChange('portOfDischarge', e.target.value)}
              onBlur={() => handleFieldBlur('portOfDischarge')}
              placeholder="e.g., Port of Hamburg"
              required
              error={!!(touched.portOfDischarge && errors.portOfDischarge)}
              helperText={touched.portOfDischarge && errors.portOfDischarge}
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
                onChange={(e) => handleFieldChange('governingLaw', e.target.value)}
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
                onChange={(e) => handleFieldChange('arbitrationRules', e.target.value)}
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
              onChange={(e) => handleFieldChange('arbitrationLocation', e.target.value)}
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
                  onClick={() => {
                    const newCerts = formData.certificationsRequired.includes(cert)
                      ? formData.certificationsRequired.filter(c => c !== cert)
                      : [...formData.certificationsRequired, cert];
                    handleFieldChange('certificationsRequired', newCerts);
                  }}
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
              onChange={(e) => handleFieldChange('specialConditions', e.target.value)}
              placeholder="e.g., Organic certified, Fair Trade compliant, etc."
            />
          </Grid>
        </Grid>
      </CardContent>
      <Divider />
      <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
        <Stack direction="row" spacing={1}>
          {onCancel && (
            <Button
              variant="outlined"
              startIcon={<X size={18} />}
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          )}
          <Button
            variant="outlined"
            color="primary"
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <CheckCircle size={18} />}
            onClick={handleSubmit}
            disabled={loading}
            size="large"
          >
            {loading ? 'Saving...' : isEditMode ? 'Save Changes' : 'Save as Draft'}
          </Button>
          {!isEditMode && (
            <Button
              variant="contained"
              color="primary"
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <CheckCircle size={18} />}
              onClick={handleSendToBuyer}
              disabled={loading}
              size="large"
            >
              {loading ? 'Sending...' : 'Send to Buyer'}
            </Button>
          )}
        </Stack>
      </CardActions>
    </Card>
  );
};

export default SalesContractDraftForm;
