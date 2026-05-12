import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Alert,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Divider,
  Paper,
  Stack,
} from '@mui/material';
import {
  Search,
  LocationOn,
  AttachMoney,
  Business,
  LocalShipping,
  Schedule,
  Star,
  TrendingUp,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import apiClient from '../services/api';

interface BuyerOpportunity {
  opportunity_id: string;
  buyer_id: string;
  title: string;
  description: string;
  coffee_type: string;
  origin_preferences: string[];
  quality_grade_min: string;
  quantity_min: number;
  quantity_max: number;
  frequency: string;
  contract_duration_months: number;
  preferred_payment_terms: string[];
  preferred_incoterms: string[];
  target_price_min: number;
  target_price_max: number;
  currency: string;
  certifications_required: string[];
  destination_country: string;
  destination_port: string;
  valid_until: string;
  buyer_company_name: string;
  buyer_country: string;
  verification_status: string;
  risk_level: string;
  reputation_score: number;
}

interface Exporter {
  exporter_id: string;
  business_name: string;
  user_id: string;
}

const Marketplace: React.FC = () => {
  const navigate = useNavigate();
  const [opportunities, setOpportunities] = useState<BuyerOpportunity[]>([]);
  const [exporters, setExporters] = useState<Exporter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingInterest, setProcessingInterest] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    coffeeType: '',
    country: '',
    minQuantity: '',
    maxPrice: '',
  });

  // Get user role
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const userRole = user?.role;
  const isExporter = userRole === 'exporter';
  const needsExporterId = userRole === 'bank' || userRole === 'ecta';

  // Helper function to normalize coffee type to match backend validation
  const normalizeCoffeeType = (coffeeType: string): string => {
    const typeMap: Record<string, string> = {
      'ARABICA': 'Arabica',
      'ROBUSTA': 'Robusta',
      'LIBERICA': 'Liberica',
      'EXCELSA': 'Excelsa',
      'SPECIALTY': 'Arabica', // Default specialty to Arabica
      'ORGANIC': 'Arabica', // Default organic to Arabica
    };
    return typeMap[coffeeType.toUpperCase()] || 'Arabica';
  };

  // Helper function to normalize payment terms to match backend validation
  const normalizePaymentTerms = (paymentTerm: string | undefined): string => {
    if (!paymentTerm) return 'Letter of Credit';
    
    const termMap: Record<string, string> = {
      'LC_AT_SIGHT': 'Letter of Credit',
      'LC': 'Letter of Credit',
      'LETTER_OF_CREDIT': 'Letter of Credit',
      'ADVANCE_PAYMENT': 'Advance Payment',
      'ADVANCE': 'Advance Payment',
      'COD': 'Cash on Delivery',
      'CASH_ON_DELIVERY': 'Cash on Delivery',
      'NET_30': 'Net 30',
      'NET_60': 'Net 60',
      'NET_90': 'Net 90',
    };
    return termMap[paymentTerm.toUpperCase()] || 'Letter of Credit';
  };

  // Helper function to normalize delivery location to match backend validation
  const normalizeDeliveryLocation = (location: string | undefined): string => {
    if (!location) return 'Djibouti Port';
    
    // Valid locations from backend
    const validLocations = [
      'Addis Ababa', 'Djibouti Port', 'Port Said', 'Suez', 'Rotterdam',
      'Hamburg', 'Singapore', 'Hong Kong', 'Shanghai', 'Los Angeles',
      'New York', 'Santos', 'Antwerp', 'Dubai', 'Bangkok'
    ];
    
    // Try exact match (case-insensitive)
    const exactMatch = validLocations.find(
      loc => loc.toLowerCase() === location.toLowerCase()
    );
    if (exactMatch) return exactMatch;
    
    // Try partial match
    const partialMatch = validLocations.find(
      loc => loc.toLowerCase().includes(location.toLowerCase()) ||
             location.toLowerCase().includes(loc.toLowerCase())
    );
    if (partialMatch) return partialMatch;
    
    // Default to Djibouti Port (main Ethiopian export port)
    return 'Djibouti Port';
  };

  useEffect(() => {
    loadOpportunities();
    if (needsExporterId) {
      loadExporters();
    }
  }, []);

  const loadOpportunities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filters.coffeeType) params.append('coffeeType', filters.coffeeType);
      if (filters.country) params.append('country', filters.country);
      if (filters.minQuantity) params.append('minQuantity', filters.minQuantity);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      
      const response = await apiClient.get(`/api/marketplace/opportunities?${params.toString()}`);
      
      if (response.data.success) {
        setOpportunities(response.data.opportunities || []);
      } else {
        setError('Failed to load opportunities');
      }
    } catch (err: any) {
      console.error('Error loading opportunities:', err);
      setError(err.response?.data?.error || 'Failed to load opportunities');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSearch = () => {
    loadOpportunities();
  };

  const loadExporters = async () => {
    try {
      const response = await apiClient.get('/api/ecta/preregistration/exporters');
      if (response.data.success) {
        setExporters(response.data.exporters || []);
      }
    } catch (err: any) {
      console.warn('Could not load exporters list:', err);
    }
  };

  const handleExpressInterest = async (opportunity: BuyerOpportunity) => {
    try {
      setProcessingInterest(opportunity.opportunity_id);
      
      console.log('Creating contract draft for opportunity:', opportunity.opportunity_id);
      
      // Step 1: Try to fetch complete buyer information (optional)
      let buyerData = null;
      try {
        const buyerResponse = await apiClient.get(`/api/buyers/${opportunity.buyer_id}`);
        buyerData = buyerResponse.data;
        console.log('Buyer data fetched successfully:', buyerData?.company_name);
      } catch (buyerErr: any) {
        console.warn('Could not fetch buyer details (will use opportunity data):', buyerErr.response?.status);
        // Continue without buyer data - we'll use what's available in the opportunity
      }
      
      // Step 2: Prepare contract draft data with all available information
      // Get user info to check role
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const canCreateDraft = user?.role === 'exporter' || user?.role === 'bank' || user?.role === 'ecta';
      
      // Only exporters, banks, or ecta can create contract drafts from marketplace
      if (!canCreateDraft) {
        setError('Only exporters, banks, or ECTA users can express interest and create contract drafts.');
        setProcessingInterest(null);
        return;
      }
      
      // Base contract data - using snake_case as expected by backend API
      const contractData: any = {
        buyer_name: buyerData?.company_name || opportunity.buyer_company_name || 'International Buyer',
        buyer_email: buyerData?.contact_email || 'buyer@example.com', // Required field - needs valid email
        coffee_type: normalizeCoffeeType(opportunity.coffee_type), // Normalize to match backend validation
        quantity_bags: parseInt(String(opportunity.quantity_min || 500), 10), // Ensure integer
        unit_price: parseFloat(String(opportunity.target_price_min || 3.50)), // Ensure number, not string
        currency: opportunity.currency || 'USD',
        payment_terms: normalizePaymentTerms(opportunity.preferred_payment_terms?.[0]), // Normalize to match backend validation
        delivery_location: normalizeDeliveryLocation(opportunity.destination_port), // Normalize to match backend validation
        delivery_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days from now
        incoterms: 'FOB', // Default incoterms
        port_of_loading: 'Addis Ababa', // Default Ethiopian port
        port_of_discharge: normalizeDeliveryLocation(opportunity.destination_port) || 'Rotterdam', // Use destination or default
      };
      
      console.log('Creating contract draft with data:', contractData);
      
      // Step 3: Create contract draft
      const draftResponse = await apiClient.post('/api/contracts/drafts', contractData);
      
      if (draftResponse.data.status === 'success' && draftResponse.data.data) {
        const draftId = draftResponse.data.data.draft_id;
        console.log('Contract draft created successfully:', draftId);
        
        setSuccess('Contract draft created successfully! Redirecting...');
        
        // Step 4: Navigate to the new draft after a short delay
        setTimeout(() => {
          navigate(`/sales-contracts/details/${draftId}`, {
            state: {
              fromMarketplace: true,
              opportunityId: opportunity.opportunity_id,
              buyerData: buyerData,
              opportunityData: opportunity
            }
          });
        }, 1500);
      } else {
        throw new Error(draftResponse.data.message || 'Failed to create contract draft');
      }
      
    } catch (err: any) {
      console.error('Error creating contract draft:', err);
      setProcessingInterest(null);
      
      // Show detailed error message to user
      let errorMessage = 'Failed to create contract draft. Please try again.';
      
      if (err.response?.data) {
        const errorData = err.response.data;
        
        // Handle validation errors
        if (errorData.code === 'VALIDATION_ERROR' && errorData.errors) {
          const validationErrors = errorData.errors
            .map((e: any) => `${e.field}: ${e.message}`)
            .join('; ');
          errorMessage = `Validation failed: ${validationErrors}`;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      
      // If it's a buyer ID validation error, suggest using the sales contracts page
      if (errorMessage.includes('buyer') || errorMessage.includes('registry')) {
        setTimeout(() => {
          setError('Redirecting to sales contracts page where you can select a verified buyer...');
          setTimeout(() => {
            navigate('/sales-contracts');
          }, 2000);
        }, 3000);
      }
    }
  };

  const formatPrice = (min: number, max: number, currency: string) => {
    if (min && max) {
      return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
    } else if (min) {
      return `${currency} ${min.toLocaleString()}+`;
    }
    return 'Negotiable';
  };

  const formatQuantity = (min: number, max: number) => {
    if (min && max) {
      return `${min.toLocaleString()} - ${max.toLocaleString()} MT`;
    } else if (min) {
      return `${min.toLocaleString()}+ MT`;
    }
    return 'Flexible';
  };

  return (
    <Box sx={{ p: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
          Buyer Marketplace
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Connect with international coffee buyers and importers. Browse opportunities and start your export journey.
        </Typography>

        {/* Filters */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Filter Opportunities
          </Typography>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Coffee Type</InputLabel>
                <Select
                  value={filters.coffeeType}
                  label="Coffee Type"
                  onChange={(e) => handleFilterChange('coffeeType', e.target.value)}
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="ARABICA">Arabica</MenuItem>
                  <MenuItem value="ROBUSTA">Robusta</MenuItem>
                  <MenuItem value="SPECIALTY">Specialty</MenuItem>
                  <MenuItem value="ORGANIC">Organic</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Destination Country"
                value={filters.country}
                onChange={(e) => handleFilterChange('country', e.target.value)}
                placeholder="e.g., USA, Germany"
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Min Quantity (MT)"
                type="number"
                value={filters.minQuantity}
                onChange={(e) => handleFilterChange('minQuantity', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Max Price (USD)"
                type="number"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<Search />}
                onClick={handleSearch}
                sx={{ height: 56 }}
              >
                Search
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Loading State */}
        {loading && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        )}

        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Success State */}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Opportunities Grid */}
        {!loading && !error && (
          <Grid container spacing={3}>
            {opportunities.length === 0 ? (
              <Grid item xs={12}>
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="h6" color="text.secondary">
                    No opportunities found
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Try adjusting your filters or check back later for new opportunities.
                  </Typography>
                </Paper>
              </Grid>
            ) : (
              opportunities.map((opportunity) => (
                <Grid item xs={12} md={6} lg={4} key={opportunity.opportunity_id}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" gutterBottom>
                          {opportunity.title}
                        </Typography>
                        
                        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                          <Chip 
                            label={opportunity.coffee_type} 
                            size="small" 
                            color="primary" 
                          />
                          <Chip 
                            label={opportunity.frequency} 
                            size="small" 
                            variant="outlined" 
                          />
                        </Stack>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {opportunity.description}
                        </Typography>

                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ mb: 2 }}>
                          <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
                            <TrendingUp sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              <strong>Quantity:</strong> {formatQuantity(opportunity.quantity_min, opportunity.quantity_max)}
                            </Typography>
                          </Box>
                          
                          <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
                            <AttachMoney sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              <strong>Price:</strong> {formatPrice(opportunity.target_price_min, opportunity.target_price_max, opportunity.currency)}
                            </Typography>
                          </Box>
                          
                          <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
                            <LocationOn sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              <strong>Destination:</strong> {opportunity.destination_country}
                            </Typography>
                          </Box>
                          
                          <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
                            <Schedule sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              <strong>Duration:</strong> {opportunity.contract_duration_months} months
                            </Typography>
                          </Box>
                        </Box>

                        {opportunity.certifications_required && opportunity.certifications_required.length > 0 && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <strong>Required Certifications:</strong>
                            </Typography>
                            <Stack direction="row" spacing={1} flexWrap="wrap">
                              {opportunity.certifications_required.map((cert, index) => (
                                <Chip 
                                  key={index}
                                  label={cert} 
                                  size="small" 
                                  variant="outlined"
                                  color="secondary"
                                />
                              ))}
                            </Stack>
                          </Box>
                        )}

                        <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
                          <Business sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            <strong>Buyer:</strong> {opportunity.buyer_company_name || 'International Buyer'}
                          </Typography>
                        </Box>

                        {opportunity.verification_status && (
                          <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Status:</strong> 
                              <Chip 
                                label={opportunity.verification_status} 
                                size="small" 
                                color={opportunity.verification_status === 'VERIFIED' ? 'success' : 'default'}
                                sx={{ ml: 1 }}
                              />
                            </Typography>
                          </Box>
                        )}

                        {opportunity.reputation_score && (
                          <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
                            <Star sx={{ mr: 1, fontSize: 16, color: 'gold' }} />
                            <Typography variant="body2">
                              <strong>Rating:</strong> {opportunity.reputation_score}/5.0
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                      
                      <Box sx={{ p: 2, pt: 0 }}>
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={processingInterest === opportunity.opportunity_id ? <CircularProgress size={20} /> : <Star />}
                          onClick={() => handleExpressInterest(opportunity)}
                          disabled={processingInterest === opportunity.opportunity_id}
                        >
                          {processingInterest === opportunity.opportunity_id ? 'Creating Draft...' : 'Create Contract Draft'}
                        </Button>
                      </Box>
                    </Card>
                  </motion.div>
                </Grid>
              ))
            )}
          </Grid>
        )}
      </motion.div>
    </Box>
  );
};

export default Marketplace;