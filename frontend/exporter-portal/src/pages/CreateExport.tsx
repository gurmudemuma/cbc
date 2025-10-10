import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Grid,
} from '@mui/material';
import { useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const ExportSchema = Yup.object().shape({
  exporterName: Yup.string()
    .min(3, 'Exporter name must be at least 3 characters')
    .required('Exporter name is required'),
  coffeeType: Yup.string()
    .required('Coffee type is required'),
  quantity: Yup.number()
    .positive('Quantity must be positive')
    .required('Quantity is required'),
  destinationCountry: Yup.string()
    .required('Destination country is required'),
  estimatedValue: Yup.number()
    .positive('Estimated value must be positive')
    .required('Estimated value is required'),
});

const CreateExport: React.FC = () => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { token, logout } = useAuth();

  return (
    <>
      <Navbar />
      <Container maxWidth="md">
        <Box sx={{ mt: 4 }}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Create Export Request
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Fill in the details for your coffee export request
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>Export created successfully!</Alert>}

            <Formik
              initialValues={{
                exporterName: '',
                coffeeType: '',
                quantity: '',
                destinationCountry: '',
                estimatedValue: '',
              }}
              validationSchema={ExportSchema}
              onSubmit={async (values, { setSubmitting, resetForm }) => {
                try {
                  setError('');
                  await axios.post(
                    `${API_URL}/api/exports`,
                    {
                      exporterName: values.exporterName,
                      coffeeType: values.coffeeType,
                      quantity: Number(values.quantity),
                      destinationCountry: values.destinationCountry,
                      estimatedValue: Number(values.estimatedValue),
                    },
                    {
                      headers: { Authorization: `Bearer ${token}` },
                    }
                  );
                  setSuccess(true);
                  resetForm();
                  setTimeout(() => navigate('/dashboard'), 2000);
                } catch (err: any) {
                  if (err.response?.status === 401) {
                    logout();
                  } else {
                    setError(err.response?.data?.message || 'Failed to create export');
                  }
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {({ errors, touched, isSubmitting }) => (
                <Form>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Field
                        as={TextField}
                        fullWidth
                        name="exporterName"
                        label="Exporter Name"
                        error={touched.exporterName && Boolean(errors.exporterName)}
                        helperText={touched.exporterName && errors.exporterName}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Field
                        as={TextField}
                        fullWidth
                        name="coffeeType"
                        label="Coffee Type"
                        placeholder="e.g., Arabica, Robusta"
                        error={touched.coffeeType && Boolean(errors.coffeeType)}
                        helperText={touched.coffeeType && errors.coffeeType}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Field
                        as={TextField}
                        fullWidth
                        name="quantity"
                        label="Quantity (kg)"
                        type="number"
                        error={touched.quantity && Boolean(errors.quantity)}
                        helperText={touched.quantity && errors.quantity}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Field
                        as={TextField}
                        fullWidth
                        name="destinationCountry"
                        label="Destination Country"
                        error={touched.destinationCountry && Boolean(errors.destinationCountry)}
                        helperText={touched.destinationCountry && errors.destinationCountry}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Field
                        as={TextField}
                        fullWidth
                        name="estimatedValue"
                        label="Estimated Value (USD)"
                        type="number"
                        error={touched.estimatedValue && Boolean(errors.estimatedValue)}
                        helperText={touched.estimatedValue && errors.estimatedValue}
                      />
                    </Grid>
                  </Grid>
                  <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={isSubmitting}
                      fullWidth
                    >
                      Create Export
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => navigate('/dashboard')}
                      fullWidth
                    >
                      Cancel
                    </Button>
                  </Box>
                </Form>
              )}
            </Formik>
          </Paper>
        </Box>
      </Container>
    </>
  );
};

export default CreateExport;