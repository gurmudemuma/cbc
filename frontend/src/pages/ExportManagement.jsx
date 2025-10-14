import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Plus, Search, Eye, Upload, FileText, Building2, DollarSign } from 'lucide-react';
import apiClient from '../services/api';
import {
  Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton, InputAdornment,
  MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
  Stepper, Step, StepLabel, StepContent, Alert
} from '@mui/material';

const ExportManagement = ({ user }) => {
  const navigate = useNavigate();
  const [exports, setExports] = useState([]);
  const [filteredExports, setFilteredExports] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeStep, setActiveStep] = useState(0);
  const [uploadedDocuments, setUploadedDocuments] = useState({
    commercialInvoice: null,
    packingList: null,
    certificateOfOrigin: null,
    billOfLading: null,
    phytosanitaryCertificate: null,
    qualityReport: null,
    exportLicense: null,
  });
  const [newExportData, setNewExportData] = useState({
    // Exporter Details
    exporterName: '',
    exporterAddress: '',
    exporterContact: '',
    exporterEmail: '',
    // Trade Details
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

  // Coffee types with average market prices (USD per kg)
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

  // Calculate estimated value when quantity or unit price changes
  useEffect(() => {
    if (newExportData.quantity && newExportData.unitPrice) {
      const quantity = parseFloat(newExportData.quantity);
      const unitPrice = parseFloat(newExportData.unitPrice);
      if (!isNaN(quantity) && !isNaN(unitPrice)) {
        const calculatedValue = (quantity * unitPrice).toFixed(2);
        setNewExportData(prev => ({
          ...prev,
          estimatedValue: calculatedValue
        }));
      }
    }
  }, [newExportData.quantity, newExportData.unitPrice]);

  useEffect(() => {
    fetchExports();
  }, []);

  useEffect(() => {
    filterExports();
  }, [exports, searchTerm, statusFilter]);

  const fetchExports = async () => {
    try {
      const response = await apiClient.get('/exports');
      setExports(response.data.data || []);
    } catch (error) {
      console.error('Error fetching exports:', error);
      // Set empty array if there's an error to prevent UI from breaking
      setExports([]);
      
      // Show user-friendly error messages
      if (error.response?.status === 503) {
        console.warn('Blockchain network unavailable:', error.response?.data?.message);
        // Don't alert for 503 - just log it, the UI will show "No exports found"
      } else if (error.response?.status === 500) {
        console.error('Server error:', error.response?.data?.message);
        // Don't alert for 500 during development
      } else if (error.response?.status === 401) {
        alert('Session expired. Please login again.');
        window.location.href = '/login';
      } else if (error.response) {
        alert('Failed to fetch exports: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const filterExports = () => {
    let filtered = [...exports];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(exp => exp.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(exp => 
        exp.exportId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.exporterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.coffeeType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.destinationCountry.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredExports(filtered);
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleDocumentUpload = (docType, event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedDocuments({
        ...uploadedDocuments,
        [docType]: file
      });
    }
  };

  const handleRemoveDocument = (docType) => {
    setUploadedDocuments({
      ...uploadedDocuments,
      [docType]: null
    });
  };

  const documentTypes = [
    { key: 'commercialInvoice', label: 'Commercial Invoice', required: true, description: 'Detailed invoice of the coffee shipment' },
    { key: 'packingList', label: 'Packing List', required: true, description: 'List of packages and their contents' },
    { key: 'certificateOfOrigin', label: 'Certificate of Origin', required: true, description: 'Proof of coffee origin' },
    { key: 'billOfLading', label: 'Bill of Lading', required: false, description: 'Shipping document (can be added later)' },
    { key: 'phytosanitaryCertificate', label: 'Phytosanitary Certificate', required: true, description: 'Plant health certificate' },
    { key: 'qualityReport', label: 'Quality Report', required: false, description: 'Initial quality assessment' },
    { key: 'exportLicense', label: 'Export License', required: true, description: 'Government export authorization' },
  ];

  const handleCoffeeTypeChange = (coffeeType) => {
    const selectedCoffee = coffeeTypes.find(c => c.value === coffeeType);
    setNewExportData({
      ...newExportData,
      coffeeType: coffeeType,
      unitPrice: selectedCoffee ? selectedCoffee.avgPrice.toString() : ''
    });
  };

  const handleCreateExport = async () => {
    try {
      // Create the export first
      const response = await apiClient.post('/exports', {
        exporterName: newExportData.exporterName,
        coffeeType: newExportData.coffeeType,
        quantity: parseFloat(newExportData.quantity),
        destinationCountry: newExportData.destinationCountry,
        estimatedValue: parseFloat(newExportData.estimatedValue)
      });

      const exportId = response.data.data.exportId;

      // Upload documents if any
      const documentsToUpload = Object.entries(uploadedDocuments).filter(([_, file]) => file !== null);
      
      if (documentsToUpload.length > 0) {
        for (const [docType, file] of documentsToUpload) {
          const formData = new FormData();
          formData.append('file', file);
          // Convert camelCase to SCREAMING_SNAKE_CASE
          const formattedDocType = docType
            .replace(/([A-Z])/g, '_$1')
            .toUpperCase()
            .replace(/^_/, ''); // Remove leading underscore
          formData.append('docType', formattedDocType);
          
          await apiClient.post(`/exports/${exportId}/documents`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }
      }

      setIsModalOpen(false);
      setActiveStep(0);
      setUploadedDocuments({
        commercialInvoice: null,
        packingList: null,
        certificateOfOrigin: null,
        billOfLading: null,
        phytosanitaryCertificate: null,
        qualityReport: null,
        exportLicense: null,
      });
      setNewExportData({
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
      fetchExports();
    } catch (error) {
      console.error('Error creating export:', error);
      alert('Failed to create export: ' + (error.response?.data?.message || error.message));
    }
  };

  const isStepValid = (step) => {
    switch (step) {
      case 0: // Exporter Details
        return newExportData.exporterName && newExportData.exporterAddress && 
               newExportData.exporterContact && newExportData.exporterEmail;
      case 1: // Trade Details
        return newExportData.coffeeType && newExportData.quantity && 
               newExportData.unitPrice && newExportData.destinationCountry && 
               newExportData.estimatedValue && newExportData.portOfLoading && 
               newExportData.portOfDischarge;
      case 2: // Documents
        // Check if all required documents are uploaded
        const requiredDocs = documentTypes.filter(doc => doc.required);
        return requiredDocs.every(doc => uploadedDocuments[doc.key] !== null);
      default:
        return false;
    }
  };

  const getStatusColor = (status) => {
    const statusMap = {
      PENDING: 'warning',
      FX_APPROVED: 'info',
      QUALITY_CERTIFIED: 'info',
      SHIPMENT_SCHEDULED: 'primary',
      SHIPPED: 'primary',
      COMPLETED: 'success',
      CANCELLED: 'error',
      FX_REJECTED: 'error',
      QUALITY_REJECTED: 'error',
    };
    return statusMap[status] || 'default';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={9}>
          <Typography variant="h4">Export Management</Typography>
          <Typography variant="subtitle1" sx={{ mb: 3 }}>Manage and track coffee export records</Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{exports.length}</Typography>
                  <Typography variant="body2">Total Exports</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{exports.filter(e => e.status === 'PENDING').length}</Typography>
                  <Typography variant="body2">Pending</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{exports.filter(e => e.status === 'COMPLETED').length}</Typography>
                  <Typography variant="body2">Completed</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    placeholder="Search exports..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search size={20} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Select
                    fullWidth
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="PENDING">Pending</MenuItem>
                    <MenuItem value="FX_APPROVED">FX Approved</MenuItem>
                    <MenuItem value="QUALITY_CERTIFIED">Quality Certified</MenuItem>
                    <MenuItem value="SHIPMENT_SCHEDULED">Shipment Scheduled</MenuItem>
                    <MenuItem value="SHIPPED">Shipped</MenuItem>
                    <MenuItem value="COMPLETED">Completed</MenuItem>
                  </Select>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Export Records</Typography>
              {filteredExports.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Package size={64} color="#666" style={{ marginBottom: 16 }} />
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                    No exports found
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {exports.length === 0 
                      ? "Get started by creating your first export request"
                      : "No exports match your search criteria"}
                  </Typography>
                  {exports.length === 0 && (
                    <Button 
                      variant="contained" 
                      startIcon={<Plus />} 
                      onClick={() => setIsModalOpen(true)}
                    >
                      Create First Export
                    </Button>
                  )}
                </Box>
              ) : (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Export ID</TableCell>
                        <TableCell>Quantity (kg)</TableCell>
                        <TableCell>Destination</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredExports.map(exp => (
                        <TableRow key={exp.exportId}>
                          <TableCell>{exp.exportId}</TableCell>
                          <TableCell>{exp.quantity.toLocaleString()}</TableCell>
                          <TableCell>{exp.destinationCountry}</TableCell>
                          <TableCell>
                            <Chip 
                              label={exp.status.replace(/_/g, ' ')} 
                              color={getStatusColor(exp.status)}
                            />
                          </TableCell>
                          <TableCell>{new Date(exp.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <IconButton onClick={() => navigate(`/exports/${exp.exportId}`)}>
                              <Eye size={16} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Actions</Typography>
              <Stack spacing={2}>
                <Button variant="contained" startIcon={<Plus />} onClick={() => setIsModalOpen(true)}>
                  Create Export
                </Button>
                <Button variant="outlined">Generate Report</Button>
                <Button variant="outlined">Export Data</Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog 
        open={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setActiveStep(0);
          setUploadedDocuments({
            commercialInvoice: null,
            packingList: null,
            certificateOfOrigin: null,
            billOfLading: null,
            phytosanitaryCertificate: null,
            qualityReport: null,
            exportLicense: null,
          });
        }} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Package size={24} />
            <Typography variant="h6">Create New Export</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} orientation="vertical" sx={{ mt: 2 }}>
            {/* Step 1: Exporter Details */}
            <Step>
              <StepLabel
                optional={<Typography variant="caption">Company information</Typography>}
                icon={<Building2 size={20} />}
              >
                Exporter Details
              </StepLabel>
              <StepContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Exporter Name"
                      value={newExportData.exporterName}
                      onChange={(e) => setNewExportData({ ...newExportData, exporterName: e.target.value })}
                      placeholder="e.g., ABC Coffee Exporters Ltd."
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Business Address"
                      value={newExportData.exporterAddress}
                      onChange={(e) => setNewExportData({ ...newExportData, exporterAddress: e.target.value })}
                      placeholder="e.g., 123 Coffee Street, Addis Ababa"
                      required
                      multiline
                      rows={2}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Contact Number"
                      value={newExportData.exporterContact}
                      onChange={(e) => setNewExportData({ ...newExportData, exporterContact: e.target.value })}
                      placeholder="e.g., +251-11-123-4567"
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="email"
                      label="Email Address"
                      value={newExportData.exporterEmail}
                      onChange={(e) => setNewExportData({ ...newExportData, exporterEmail: e.target.value })}
                      placeholder="e.g., export@abccoffee.com"
                      required
                    />
                  </Grid>
                </Grid>
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={!isStepValid(0)}
                  >
                    Continue
                  </Button>
                </Box>
              </StepContent>
            </Step>

            {/* Step 2: Trade Details */}
            <Step>
              <StepLabel
                optional={<Typography variant="caption">Coffee and shipment details</Typography>}
                icon={<DollarSign size={20} />}
              >
                Trade Details
              </StepLabel>
              <StepContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12}>
                    <Select
                      fullWidth
                      value={newExportData.coffeeType}
                      onChange={(e) => handleCoffeeTypeChange(e.target.value)}
                      displayEmpty
                      required
                    >
                      <MenuItem value="" disabled>Select Coffee Type</MenuItem>
                      {coffeeTypes.map((coffee) => (
                        <MenuItem key={coffee.value} value={coffee.value}>
                          {coffee.label} (Avg. ${coffee.avgPrice}/kg)
                        </MenuItem>
                      ))}
                    </Select>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Quantity"
                      value={newExportData.quantity}
                      onChange={(e) => setNewExportData({ ...newExportData, quantity: e.target.value })}
                      placeholder="e.g., 5000"
                      required
                      inputProps={{ min: 1, step: 0.01 }}
                      InputProps={{
                        endAdornment: <Typography variant="body2" sx={{ color: 'text.secondary', ml: 1 }}>kg</Typography>
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Unit Price"
                      value={newExportData.unitPrice}
                      onChange={(e) => setNewExportData({ ...newExportData, unitPrice: e.target.value })}
                      placeholder="e.g., 8.50"
                      required
                      inputProps={{ min: 0.01, step: 0.01 }}
                      InputProps={{
                        startAdornment: <Typography variant="body2" sx={{ color: 'text.secondary', mr: 1 }}>$</Typography>,
                        endAdornment: <Typography variant="body2" sx={{ color: 'text.secondary', ml: 1 }}>/kg</Typography>
                      }}
                      helperText="Price per kilogram in USD"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Alert severity="info" sx={{ mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Estimated Total Value</Typography>
                      <Typography variant="h5" color="primary">
                        ${newExportData.estimatedValue || '0.00'} {newExportData.currency}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Calculated: {newExportData.quantity || 0} kg × ${newExportData.unitPrice || 0}/kg
                      </Typography>
                    </Alert>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Destination Country"
                      value={newExportData.destinationCountry}
                      onChange={(e) => setNewExportData({ ...newExportData, destinationCountry: e.target.value })}
                      placeholder="e.g., United States"
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Select
                      fullWidth
                      value={newExportData.incoterms}
                      onChange={(e) => setNewExportData({ ...newExportData, incoterms: e.target.value })}
                      required
                    >
                      {incotermsOptions.map((term) => (
                        <MenuItem key={term.value} value={term.value}>
                          {term.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Port of Loading"
                      value={newExportData.portOfLoading}
                      onChange={(e) => setNewExportData({ ...newExportData, portOfLoading: e.target.value })}
                      placeholder="e.g., Djibouti Port"
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Port of Discharge"
                      value={newExportData.portOfDischarge}
                      onChange={(e) => setNewExportData({ ...newExportData, portOfDischarge: e.target.value })}
                      placeholder="e.g., Port of Los Angeles"
                      required
                    />
                  </Grid>
                </Grid>
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button onClick={handleBack}>Back</Button>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={!isStepValid(1)}
                  >
                    Continue
                  </Button>
                </Box>
              </StepContent>
            </Step>

            {/* Step 3: Document Upload */}
            <Step>
              <StepLabel
                optional={<Typography variant="caption">Upload supporting documents (optional)</Typography>}
                icon={<FileText size={20} />}
              >
                Document Upload
              </StepLabel>
              <StepContent>
                <Box sx={{ mt: 2 }}>
                  <Alert severity="warning" sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Required Documents</Typography>
                    Please upload all required documents. Optional documents can be added later.
                  </Alert>
                  
                  <Stack spacing={2}>
                    {documentTypes.map((docType) => (
                      <Paper 
                        key={docType.key} 
                        variant="outlined" 
                        sx={{ 
                          p: 2,
                          bgcolor: uploadedDocuments[docType.key] ? 'success.light' : 'background.paper',
                          borderColor: uploadedDocuments[docType.key] ? 'success.main' : docType.required ? 'warning.main' : 'divider'
                        }}
                      >
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} sm={6}>
                            <Stack spacing={0.5}>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Typography variant="subtitle2">
                                  {docType.label}
                                </Typography>
                                {docType.required && (
                                  <Chip label="Required" size="small" color="warning" />
                                )}
                              </Stack>
                              <Typography variant="caption" color="text.secondary">
                                {docType.description}
                              </Typography>
                            </Stack>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            {uploadedDocuments[docType.key] ? (
                              <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <FileText size={16} color="green" />
                                  <Typography variant="body2" color="success.main">
                                    {uploadedDocuments[docType.key].name}
                                  </Typography>
                                  <Chip 
                                    label={`${(uploadedDocuments[docType.key].size / 1024).toFixed(1)} KB`} 
                                    size="small" 
                                    color="success"
                                  />
                                </Stack>
                                <Button 
                                  size="small" 
                                  color="error" 
                                  onClick={() => handleRemoveDocument(docType.key)}
                                >
                                  Remove
                                </Button>
                              </Stack>
                            ) : (
                              <Button
                                variant="outlined"
                                component="label"
                                startIcon={<Upload size={16} />}
                                size="small"
                                fullWidth
                              >
                                Upload
                                <input
                                  type="file"
                                  hidden
                                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                  onChange={(e) => handleDocumentUpload(docType.key, e)}
                                />
                              </Button>
                            )}
                          </Grid>
                        </Grid>
                      </Paper>
                    ))}
                  </Stack>

                  <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                    Accepted formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB per file)
                  </Typography>
                </Box>
                <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
                  <Button onClick={handleBack}>Back</Button>
                  <Button
                    variant="contained"
                    onClick={handleCreateExport}
                    disabled={!isStepValid(2)}
                  >
                    Create Export
                  </Button>
                </Box>
              </StepContent>
            </Step>
          </Stepper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setIsModalOpen(false);
            setActiveStep(0);
            setUploadedDocuments({
              commercialInvoice: null,
              packingList: null,
              certificateOfOrigin: null,
              billOfLading: null,
              phytosanitaryCertificate: null,
              qualityReport: null,
              exportLicense: null,
            });
          }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExportManagement;