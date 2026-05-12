/**
 * Buyer Selection Component
 * Allows FULLY_QUALIFIED exporters to browse and select buyers
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Stack,
  Paper,
  Divider,
} from '@mui/material';
import {
  Search,
  FilterList,
  Business,
  Email,
  Phone,
  LocationOn,
  LocalCafe,
  Payment,
  CheckCircle,
  ArrowForward,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface Buyer {
  id: string;
  name: string;
  email: string;
  country: string;
  city: string;
  phone: string;
  preferredCoffeeTypes: string[];
  paymentTerms: string[];
  minimumOrderBags: number;
  description: string;
  established: number;
  certifications: string[];
}

interface QualificationStatus {
  isQualified: boolean;
  status: string;
  completedSteps: string[];
  incompleteSteps: string[];
  progressPercentage: number;
}

const BuyerSelection: React.FC = () => {
  const navigate = useNavigate();
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [filteredBuyers, setFilteredBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [qualificationStatus, setQualificationStatus] = useState<QualificationStatus | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [coffeeTypeFilter, setCoffeeTypeFilter] = useState('');
  const [paymentTermFilter, setPaymentTermFilter] = useState('');
  const [countries, setCountries] = useState<string[]>([]);
  const [coffeeTypes, setCoffeeTypes] = useState<string[]>([]);
  const [paymentTerms, setPaymentTerms] = useState<string[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchQualificationStatus();
    fetchBuyers();
    fetchFilters();
  }, []);

  useEffect(() => {
    filterBuyers();
  }, [buyers, searchTerm, countryFilter, coffeeTypeFilter, paymentTermFilter]);

  const fetchQualificationStatus = async () => {
    try {
      const response = await fetch('/api/exporter/qualification/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setQualificationStatus(data.data);
      }
    } catch (err) {
      console.error('Error fetching qualification status:', err);
    }
  };

  const fetchBuyers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/buyers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBuyers(data.data.buyers);
        setFilteredBuyers(data.data.buyers);
      } else if (response.status === 403) {
        const errorData = await response.json();
        setError(errorData.error.message);
      } else {
        setError('Failed to load buyers');
      }
    } catch (err) {
      console.error('Error fetching buyers:', err);
      setError('Failed to load buyers');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      const [countriesRes, coffeeTypesRes, paymentTermsRes] = await Promise.all([
        fetch('/api/buyers/filters/countries', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        }),
        fetch('/api/buyers/filters/coffee-types', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        }),
        fetch('/api/buyers/filters/payment-terms', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        }),
      ]);

      if (countriesRes.ok) {
        const data = await countriesRes.json();
        setCountries(data.data);
      }

      if (coffeeTypesRes.ok) {
        const data = await coffeeTypesRes.json();
        setCoffeeTypes(data.data);
      }

      if (paymentTermsRes.ok) {
        const data = await paymentTermsRes.json();
        setPaymentTerms(data.data);
      }
    } catch (err) {
      console.error('Error fetching filters:', err);
    }
  };

  const filterBuyers = () => {
    let filtered = buyers;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(buyer =>
        buyer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        buyer.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
        buyer.city.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Country filter
    if (countryFilter) {
      filtered = filtered.filter(buyer => buyer.country === countryFilter);
    }

    // Coffee type filter
    if (coffeeTypeFilter) {
      filtered = filtered.filter(buyer =>
        buyer.preferredCoffeeTypes.includes(coffeeTypeFilter)
      );
    }

    // Payment term filter
    if (paymentTermFilter) {
      filtered = filtered.filter(buyer =>
        buyer.paymentTerms.includes(paymentTermFilter)
      );
    }

    setFilteredBuyers(filtered);
  };

  const handleSelectBuyer = (buyer: Buyer) => {
    // Navigate to contract creation with pre-filled buyer email
    navigate('/sales-contracts/new', {
      state: {
        buyerId: buyer.id,
        buyerName: buyer.name,
        buyerEmail: buyer.email,
      },
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCountryFilter('');
    setCoffeeTypeFilter('');
    setPaymentTermFilter('');
  };

  // Show qualification warning if not fully qualified
  if (qualificationStatus && !qualificationStatus.isQualified) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Complete Qualification Required
          </Typography>
          <Typography variant="body2" paragraph>
            You must complete all qualification steps before you can browse buyers and create sales contracts.
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>Progress:</strong> {qualificationStatus.completedSteps.length} of 5 steps completed ({qualificationStatus.progressPercentage}%)
          </Typography>
          <Typography variant="body2">
            <strong>Completed:</strong> {qualificationStatus.completedSteps.join(', ') || 'None'}
          </Typography>
          <Typography variant="body2">
            <strong>Incomplete:</strong> {qualificationStatus.incompleteSteps.join(', ')}
          </Typography>
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            onClick={() => navigate('/pre-registration')}
          >
            Complete Qualification Steps
          </Button>
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Find International Buyers
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Browse and connect with verified international coffee buyers. Select a buyer to initiate a sales contract.
        </Typography>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <FilterList />
          <Typography variant="h6">Search & Filter</Typography>
        </Stack>

        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              placeholder="Search by name, country, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Country</InputLabel>
              <Select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                label="Country"
              >
                <MenuItem value="">All Countries</MenuItem>
                {countries.map(country => (
                  <MenuItem key={country} value={country}>{country}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Coffee Type</InputLabel>
              <Select
                value={coffeeTypeFilter}
                onChange={(e) => setCoffeeTypeFilter(e.target.value)}
                label="Coffee Type"
              >
                <MenuItem value="">All Types</MenuItem>
                {coffeeTypes.map(type => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Payment Term</InputLabel>
              <Select
                value={paymentTermFilter}
                onChange={(e) => setPaymentTermFilter(e.target.value)}
                label="Payment Term"
              >
                <MenuItem value="">All Terms</MenuItem>
                {paymentTerms.map(term => (
                  <MenuItem key={term} value={term}>{term}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={clearFilters}
              sx={{ height: '56px' }}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Showing {filteredBuyers.length} of {buyers.length} buyers
        </Typography>
      </Paper>

      {/* Buyer Cards */}
      <Grid container spacing={3}>
        {filteredBuyers.map(buyer => (
          <Grid item xs={12} md={6} lg={4} key={buyer.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <Business color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {buyer.name}
                  </Typography>
                </Stack>

                <Stack spacing={1} sx={{ mb: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <LocationOn fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {buyer.city}, {buyer.country}
                    </Typography>
                  </Stack>

                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Email fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {buyer.email}
                    </Typography>
                  </Stack>

                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Phone fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {buyer.phone}
                    </Typography>
                  </Stack>
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Typography variant="body2" paragraph>
                  {buyer.description}
                </Typography>

                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                  Established: {buyer.established} • Min Order: {buyer.minimumOrderBags} bags
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                    <LocalCafe fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                    Preferred Coffee Types:
                  </Typography>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap">
                    {buyer.preferredCoffeeTypes.map(type => (
                      <Chip key={type} label={type} size="small" />
                    ))}
                  </Stack>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                    <Payment fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                    Payment Terms:
                  </Typography>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap">
                    {buyer.paymentTerms.map(term => (
                      <Chip key={term} label={term} size="small" color="primary" variant="outlined" />
                    ))}
                  </Stack>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                    <CheckCircle fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                    Certifications:
                  </Typography>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap">
                    {buyer.certifications.map(cert => (
                      <Chip key={cert} label={cert} size="small" color="success" variant="outlined" />
                    ))}
                  </Stack>
                </Box>
              </CardContent>

              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  fullWidth
                  variant="contained"
                  endIcon={<ArrowForward />}
                  onClick={() => handleSelectBuyer(buyer)}
                >
                  Select Buyer & Create Contract
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredBuyers.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No buyers found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search or filter criteria
          </Typography>
          <Button variant="outlined" onClick={clearFilters} sx={{ mt: 2 }}>
            Clear All Filters
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default BuyerSelection;
