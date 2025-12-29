import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    Card,
    CardContent,
    Container,
    Grid,
    TextField,
    Typography,
    MenuItem,
    Stack,
    Alert,
    CircularProgress,
    Paper,
    Divider,
    InputAdornment
} from '@mui/material';
import { ArrowLeft, Save, Send, AlertCircle } from 'lucide-react';
import apiClient from '../services/api';

const ExportEdit = ({ user, org }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Rejection info
    const [rejectionInfo, setRejectionInfo] = useState(null);

    const [formData, setFormData] = useState({
        exporterName: '',
        exporterAddress: '',
        exporterContact: '',
        exporterEmail: '',
        coffeeType: '',
        quantity: '',
        unit: 'kg',
        unitPrice: '',
        currency: 'USD',
        destinationCountry: '',
        estimatedValue: '',
        portOfLoading: '',
        portOfDischarge: '',
        incoterms: 'FOB',
    });

    const coffeeTypes = [
        { value: 'Arabica Grade 1', label: 'Arabica Grade 1', avgPrice: 8.5 },
        { value: 'Arabica Grade 2', label: 'Arabica Grade 2', avgPrice: 7.2 },
        { value: 'Arabica Grade 3', label: 'Arabica Grade 3', avgPrice: 6.0 },
        { value: 'Robusta Grade 1', label: 'Robusta Grade 1', avgPrice: 4.5 },
        { value: 'Robusta Grade 2', label: 'Robusta Grade 2', avgPrice: 3.8 },
        { value: 'Specialty Coffee', label: 'Specialty Coffee', avgPrice: 12.0 },
        { value: 'Organic Arabica', label: 'Organic Arabica', avgPrice: 10.5 },
    ];

    const incotermsOptions = [
        { value: 'FOB', label: 'FOB - Free On Board' },
        { value: 'CIF', label: 'CIF - Cost, Insurance & Freight' },
        { value: 'CFR', label: 'CFR - Cost and Freight' },
        { value: 'EXW', label: 'EXW - Ex Works' },
    ];

    useEffect(() => {
        const fetchExportDetails = async () => {
            try {
                const response = await apiClient.get(`/exports/${id}`);
                const data = response.data.data;

                setFormData({
                    exporterName: data.exporterName || '',
                    exporterAddress: data.exporterAddress || '',
                    exporterContact: data.exporterContact || '',
                    exporterEmail: data.exporterEmail || '',
                    coffeeType: data.coffeeType || '',
                    quantity: data.quantity || '',
                    unit: data.unit || 'kg',
                    unitPrice: data.unitPrice || '',
                    currency: data.currency || 'USD',
                    destinationCountry: data.destinationCountry || '',
                    estimatedValue: data.estimatedValue || '',
                    portOfLoading: data.portOfLoading || '',
                    portOfDischarge: data.portOfDischarge || '',
                    incoterms: data.incoterms || 'FOB',
                });

                // Determine if there's rejection info to display
                if (data.status.includes('REJECTED')) {
                    let reason = '';
                    if (data.status === 'FX_REJECTED') reason = data.fxRejectionReason;
                    else if (data.status === 'ECTA_CONTRACT_REJECTED') reason = data.contractRejectionReason;
                    else if (data.status === 'ECTA_LICENSE_REJECTED') reason = data.licenseRejectionReason;
                    else if (data.status === 'ECTA_QUALITY_REJECTED') reason = data.qualityRejectionReason;
                    else if (data.status === 'CUSTOMS_REJECTED') reason = data.customsRejectionReason;
                    else if (data.status === 'SHIPMENT_REJECTED') reason = data.shipmentRejectionReason;
                    else if (data.status === 'BANK_DOCUMENT_REJECTED') reason = data.bankRejectionReason;
                    else if (data.status === 'ECX_REJECTED') reason = data.ecxRejectionReason;

                    setRejectionInfo({
                        status: data.status,
                        reason: reason || 'No specific reason provided'
                    });
                }
            } catch (error) {
                console.error('Error fetching export details:', error);
                setError('Failed to load export details');
            } finally {
                setLoading(false);
            }
        };

        fetchExportDetails();
    }, [id]);

    // Recalculate estimated value
    useEffect(() => {
        if (formData.quantity && formData.unitPrice) {
            const quantity = parseFloat(formData.quantity);
            const unitPrice = parseFloat(formData.unitPrice);
            if (!isNaN(quantity) && !isNaN(unitPrice)) {
                const calculatedValue = (quantity * unitPrice).toFixed(2);
                setFormData((prev) => ({
                    ...prev,
                    estimatedValue: calculatedValue,
                }));
            }
        }
    }, [formData.quantity, formData.unitPrice]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCoffeeTypeChange = (e) => {
        const coffeeType = e.target.value;
        const selectedCoffee = coffeeTypes.find((c) => c.value === coffeeType);
        setFormData(prev => ({
            ...prev,
            coffeeType: coffeeType,
            unitPrice: selectedCoffee ? selectedCoffee.avgPrice.toString() : prev.unitPrice,
        }));
    };

    const handleSubmit = async (resubmit = false) => {
        setSaving(true);
        try {
            // 1. Update the export
            await apiClient.put(`/exports/${id}`, {
                ...formData,
                quantity: parseFloat(formData.quantity),
                unitPrice: parseFloat(formData.unitPrice),
                estimatedValue: parseFloat(formData.estimatedValue)
            });

            // 2. If resubmitting, trigger resubmit action
            if (resubmit) {
                await apiClient.post(`/exports/${id}/resubmit`, {
                    resubmittedBy: user?.username || 'user',
                    resubmittedAt: new Date().toISOString(),
                });
                alert('Export updated and resubmitted successfully!');
                navigate(`/exports/${id}`);
            } else {
                alert('Export updated successfully!');
            }
        } catch (error) {
            console.error('Error saving export:', error);
            alert('Failed to save export: ' + (error.response?.data?.message || error.message));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                <Button startIcon={<ArrowLeft />} onClick={() => navigate(`/exports/${id}`)}>
                    Back
                </Button>
                <Typography variant="h4">Edit Export</Typography>
            </Stack>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {rejectionInfo && (
                <Alert severity="error" icon={<AlertCircle />} sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                        Rejected: {rejectionInfo.status.replace(/_/g, ' ')}
                    </Typography>
                    <Typography variant="body2">
                        Reason: {rejectionInfo.reason}
                    </Typography>
                </Alert>
            )}

            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" gutterBottom>Trade Details</Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Coffee Type"
                                    name="coffeeType"
                                    value={formData.coffeeType}
                                    onChange={handleCoffeeTypeChange}
                                >
                                    {coffeeTypes.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Destination Country"
                                    name="destinationCountry"
                                    value={formData.destinationCountry}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Quantity"
                                    name="quantity"
                                    type="number"
                                    value={formData.quantity}
                                    onChange={handleChange}
                                    InputProps={{
                                        endAdornment: <InputAdornment position="end">kg</InputAdornment>,
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Unit Price"
                                    name="unitPrice"
                                    type="number"
                                    value={formData.unitPrice}
                                    onChange={handleChange}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                        endAdornment: <InputAdornment position="end">/ kg</InputAdornment>,
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Total Value"
                                    name="estimatedValue"
                                    value={formData.estimatedValue}
                                    InputProps={{
                                        readOnly: true,
                                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Incoterms"
                                    name="incoterms"
                                    value={formData.incoterms}
                                    onChange={handleChange}
                                >
                                    {incotermsOptions.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                        </Grid>
                    </Paper>

                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>Logistics</Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Port of Loading"
                                    name="portOfLoading"
                                    value={formData.portOfLoading}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Port of Discharge"
                                    name="portOfDischarge"
                                    value={formData.portOfDischarge}
                                    onChange={handleChange}
                                />
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Actions</Typography>
                            <Stack spacing={2}>
                                <Button
                                    variant="outlined"
                                    startIcon={<Save />}
                                    onClick={() => handleSubmit(false)}
                                    disabled={saving}
                                >
                                    Save Changes
                                </Button>
                                <Button
                                    variant="contained"
                                    startIcon={<Send />}
                                    onClick={() => handleSubmit(true)}
                                    disabled={saving}
                                    color="primary"
                                >
                                    {saving ? 'Processing...' : 'Update & Resubmit'}
                                </Button>
                            </Stack>
                        </CardContent>
                    </Card>

                    <Card sx={{ mt: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Exporter Info</Typography>
                            <TextField
                                fullWidth
                                label="Name"
                                name="exporterName"
                                value={formData.exporterName}
                                onChange={handleChange}
                                margin="normal"
                                size="small"
                            />
                            <TextField
                                fullWidth
                                label="Contact"
                                name="exporterContact"
                                value={formData.exporterContact}
                                onChange={handleChange}
                                margin="normal"
                                size="small"
                            />
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    );
};

export default ExportEdit;
