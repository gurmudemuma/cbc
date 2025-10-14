import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Container, 
  Paper, 
  TextField, 
  Button, 
  Typography, 
  Box,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Stack
} from '@mui/material';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Coffee, LogIn } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const LoginSchema = Yup.object().shape({
  organization: Yup.string().required('Organization is required'),
  username: Yup.string().required('Username is required'),
  password: Yup.string().required('Password is required'),
});

const Login: React.FC = () => {
  const [error, setError] = useState('');
  const { login } = useAuth();

  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh', 
      bgcolor: '#0a0a0a',
      alignItems: 'center', 
      justifyContent: 'center', 
      p: 3,
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 50%, rgba(139, 0, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255, 215, 0, 0.05) 0%, transparent 50%)',
        pointerEvents: 'none'
      }
    }}>
      <Container maxWidth={false} sx={{ position: 'relative', zIndex: 1, width: '85vw', maxWidth: '650px' }}>
        <Paper 
          elevation={24} 
          sx={{ 
            p: 6,
            minHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            bgcolor: '#1a1a1a',
            border: '1px solid rgba(139, 0, 255, 0.2)',
            borderRadius: 3
          }}
        >
          <Stack alignItems="center" spacing={2} sx={{ mb: 5 }}>
            <Box
              sx={{
                p: 1.8,
                borderRadius: '50%',
                background: 'rgba(139, 0, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1
              }}
            >
              <Coffee size={52} color="#FFD700" strokeWidth={2} />
            </Box>
            <Typography 
              variant="h4" 
              component="h1" 
              align="center"
              sx={{
                fontWeight: 600,
                color: '#FFD700',
                letterSpacing: '-0.3px',
                fontSize: '1.75rem'
              }}
            >
              Coffee Export Portal
            </Typography>
            <Typography 
              variant="body2" 
              align="center" 
              sx={{ 
                color: '#666',
                fontWeight: 400,
                fontSize: '0.9rem'
              }}
            >
              Login to manage your exports
            </Typography>
          </Stack>

          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 1.5, bgcolor: 'rgba(211, 47, 47, 0.08)', border: '1px solid rgba(211, 47, 47, 0.2)' }}>{error}</Alert>}

          <Formik
            initialValues={{ organization: '', username: '', password: '' }}
            validationSchema={LoginSchema}
            onSubmit={async (values, { setSubmitting }) => {
              try {
                setError('');
                // Use organization-specific proxy path
                const url = `/api/${values.organization}/auth/login`;
                const response = await axios.post(url, {
                  username: values.username,
                  password: values.password
                });
                login(response.data.data.token);
              } catch (err: any) {
                setError(err.response?.data?.message || 'Invalid credentials');
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ errors, touched, isSubmitting }) => (
              <Form>
                <Field name="organization">
                  {({ field, form }: { field: import('formik').FieldInputProps<string>, form: import('formik').FormikProps<{organization: string, username: string, password: string}> }) => (
                    <FormControl 
                      fullWidth 
                      margin="normal" 
                      error={form.touched.organization && Boolean(form.errors.organization)}
                      sx={{
                        mb: 0.5,
                        '& .MuiOutlinedInput-root': {
                          bgcolor: 'transparent',
                          '& fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.1)'
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(139, 0, 255, 0.3)'
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#8B00FF',
                            borderWidth: '1px'
                          }
                        },
                        '& .MuiInputLabel-root': {
                          color: '#888',
                          fontSize: '0.95rem'
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: '#8B00FF'
                        }
                      }}
                    >
                      <InputLabel>Organization</InputLabel>
                      <Select {...field} label="Organization" sx={{ color: '#FFD700', '& .MuiSelect-icon': { color: '#666' } }}>
                        <MenuItem value="exporter">Exporter Bank</MenuItem>
                        <MenuItem value="nationalbank">National Bank</MenuItem>
                        <MenuItem value="ncat">NCAT</MenuItem>
                        <MenuItem value="shipping">Shipping Line</MenuItem>
                      </Select>
                      {form.touched.organization && form.errors.organization && (
                        <FormHelperText error>{form.errors.organization}</FormHelperText>
                      )}
                    </FormControl>
                  )}
                </Field>
                <Field
                  as={TextField}
                  fullWidth
                  name="username"
                  label="Username"
                  margin="normal"
                  error={touched.username && Boolean(errors.username)}
                  helperText={touched.username && errors.username}
                  sx={{
                    mb: 0.5,
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'transparent',
                      color: '#FFD700',
                      '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.1)'
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(139, 0, 255, 0.3)'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#8B00FF',
                        borderWidth: '1px'
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: '#888',
                      fontSize: '0.95rem'
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#8B00FF'
                    }
                  }}
                />
                <Field
                  as={TextField}
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  margin="normal"
                  error={touched.password && Boolean(errors.password)}
                  helperText={touched.password && errors.password}
                  sx={{
                    mb: 0.5,
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'transparent',
                      color: '#FFD700',
                      '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.1)'
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(139, 0, 255, 0.3)'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#8B00FF',
                        borderWidth: '1px'
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: '#888',
                      fontSize: '0.95rem'
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#8B00FF'
                    }
                  }}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={isSubmitting}
                  startIcon={<LogIn size={20} color="#000" strokeWidth={2.5} />}
                  sx={{ 
                    mt: 3, 
                    mb: 2,
                    py: 1.6, 
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    background: '#FFD700',
                    color: '#000',
                    border: 'none',
                    borderRadius: 1.5,
                    textTransform: 'none',
                    letterSpacing: '0.3px',
                    boxShadow: 'none',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      background: '#FFA500',
                      boxShadow: 'none',
                      transform: 'translateY(-1px)'
                    },
                    '&:disabled': {
                      background: 'rgba(255, 215, 0, 0.3)',
                      color: '#666'
                    }
                  }}
                >
                  {isSubmitting ? 'Signing In...' : 'Sign In'}
                </Button>
                <Box sx={{ textAlign: 'center' }}>
                  <Link to="/register" style={{ textDecoration: 'none' }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#8B00FF',
                        fontWeight: 500,
                        '&:hover': {
                          color: '#A64DFF'
                        }
                      }}
                    >
                      Don't have an account? Register
                    </Typography>
                  </Link>
                </Box>
              </Form>
            )}
          </Formik>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;