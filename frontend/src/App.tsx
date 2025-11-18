import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { useState, useEffect, useMemo, useCallback, createContext, useContext } from 'react';
import { ThemeProvider, CssBaseline, useMediaQuery, Box, useTheme as useMuiTheme } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { SnackbarProvider } from 'notistack';
import { motion, AnimatePresence } from 'framer-motion';

// Contexts
import { NotificationProvider } from './contexts/NotificationContext';

// Create a theme context
export const ThemeContext = createContext({});

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
};

// Components
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSkeleton from './components/LoadingSkeleton';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ExportManagement from './pages/ExportManagement';
import QualityCertification from './pages/QualityCertification';
import FXRates from './pages/FXRates';
import UserManagement from './pages/UserManagement';
import ShipmentTracking from './pages/ShipmentTracking';
import ExportDetails from './pages/ExportDetails';
import CustomsClearance from './pages/CustomsClearance';
import ExporterPreRegistration from './pages/ExporterPreRegistration';
import ECTAPreRegistrationManagement from './pages/ECTAPreRegistrationManagement';

// New Exporter Portal Pages
import ExporterProfile from './pages/ExporterProfile';
import ApplicationTracking from './pages/ApplicationTracking';
import ExportDashboard from './pages/ExportDashboard';
import HelpSupport from './pages/HelpSupport';

// New Consortium Member Pages
import BankingOperations from './pages/BankingOperations';
import LotManagement from './pages/LotManagement';
import MonetaryPolicy from './pages/MonetaryPolicy';

// Services & Config
import { setApiBaseUrl } from './services/api';
import { getApiUrl } from './config/api.config';
import { createEnhancedTheme } from './config/theme.config.enhanced';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const getOrgClass = (org) => {
  const orgLower = (org || '').toLowerCase();
  
  // Map organization IDs to CSS class names
  if (orgLower.includes('exporter')) return 'exporter';
  if (orgLower.includes('national') || orgLower.includes('banker')) return 'nb-regulatory';
  if (orgLower === 'ecta') return 'ecta';
  if (orgLower.includes('shipping')) return 'shipping-line';
  if (orgLower.includes('custom')) return 'customs';
  
  // Default fallback
  return 'nb-regulatory';
};

// Theme provider component to wrap the app
const AppThemeProvider = ({ children }) => {
  const [org, setOrg] = useState(null);
  const [mode, setMode] = useState(() => {
    // Initialize from localStorage or default to 'light'
    return localStorage.getItem('themeMode') || 'light';
  });

  // Create theme with organization and mode
  const theme = useMemo(() => {
    console.log('Creating theme for org:', org, 'mode:', mode);
    return createEnhancedTheme(org, mode);
  }, [org, mode]);
  
  // Toggle between light and dark mode
  const toggleColorMode = useCallback(() => {
    setMode((prevMode) => {
      const newMode = prevMode === 'light' ? 'dark' : 'light';
      localStorage.setItem('themeMode', newMode);
      return newMode;
    });
  }, []);

  // Set organization and update theme
  const setOrganization = useCallback((newOrg) => {
    setOrg(newOrg);
  }, []);

  // Theme context value
  const themeContextValue = useMemo(() => ({
    mode,
    org,
    toggleColorMode,
    setOrganization,
  }), [mode, org, toggleColorMode, setOrganization]);

  return (
    <ThemeContext.Provider value={themeContextValue}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

// Main App component
function App() {
  const { mode, org, toggleColorMode, setOrganization } = useAppTheme();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const orgClass = useMemo(() => getOrgClass(org), [org]);

  useEffect(() => {
    // Check for stored auth token
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    const storedOrg = localStorage.getItem('org');

    if (token && userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      const effectiveOrg = storedOrg || parsedUser.role;
      setOrganization(effectiveOrg);
      setApiBaseUrl(getApiUrl(effectiveOrg));
    }
    setLoading(false);
  }, [setOrganization]);

  // Add theme class to body for global styles
  useEffect(() => {
    document.body.className = `${orgClass || ''} ${mode}-mode`;
    return () => {
      document.body.className = '';
    };
  }, [orgClass, mode]);

  const getRoleBasedRoute = useCallback((orgId) => {
    const orgLower = orgId?.toLowerCase();
    
    // Exporter Portal - External exporters (SDK-based)
    if (orgLower === 'exporter-portal' || orgLower === 'exporterportal') {
      return '/exports';  // Exporters create and track exports
    }
    
    // Commercial Bank - Banking operations (consortium member)
    // Note: commercial-bank/commercialbank are the current IDs
    if (orgLower === 'commercial-bank' || orgLower === 'commercialbank') {
      return '/banking';  // Banking operations dashboard
    }
    
    // National Bank - FX approval and compliance
    if (
      orgLower === 'nb-regulatory' ||
      orgLower === 'banker' ||
      orgLower === 'banker-001' ||
      orgLower === 'national-bank' ||
      orgLower === 'nationalbank'
    ) {
      return '/fx-approval';
    }
    
    // ECX - Lot verification
    if (orgLower === 'ecx') {
      return '/lot-verification';
    }
    
    // ECTA - Quality certification, licensing, and contract approval
    if (orgLower === 'ecta') {
      return '/quality';
    }
    
    // Shipping Line - Shipment management
    if (orgLower === 'shipping' || orgLower === 'shipping-line' || orgLower === 'shippingline') {
      return '/shipments';
    }
    
    // Custom Authorities - Customs clearance
    if (orgLower === 'custom-authorities') {
      return '/customs';
    }
    
    return '/dashboard';
  }, []);

  const handleLogin = useCallback((userData, token, selectedOrg) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('org', selectedOrg);
    setUser(userData);
    setOrganization(selectedOrg);
    setApiBaseUrl(getApiUrl(selectedOrg));
  }, [setOrganization]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('org');
    setUser(null);
    setOrganization(null);
  }, [setOrganization]);

  const router = useMemo(() => createBrowserRouter(
    [
      {
        path: '/login',
        element: user ? (
          <Navigate to={getRoleBasedRoute(org)} />
        ) : (
          <Login onLogin={handleLogin} />
        ),
      },
      {
        path: '/',
        element: user ? (
          <Layout user={user} org={org} onLogout={handleLogout} exports={[]} />
        ) : (
          <Navigate to="/login" />
        ),
        children: [
          { index: true, element: <Navigate to={getRoleBasedRoute(org)} /> },
          { path: 'dashboard', element: <Dashboard user={user} org={org} /> },
          { path: 'exports', element: <ExportManagement user={user} org={org} /> },
          { path: 'exports/:id', element: <ExportDetails user={user} org={org} /> },
          { path: 'quality', element: <QualityCertification user={user} org={org} /> },
          {
            path: 'origin-certificates',
            element: <QualityCertification user={user} org={org} />,
          },
          { path: 'fx-approval', element: <ExportManagement user={user} org={org} /> },
          { path: 'fx-rates', element: <FXRates user={user} org={org} /> },
          {
            path: 'payment-repatriation',
            element: <ExportManagement user={user} org={org} />,
          },
          { path: 'banking', element: <ExportManagement user={user} org={org} /> },
          { path: 'shipments', element: <ShipmentTracking user={user} org={org} /> },
          { path: 'arrivals', element: <ShipmentTracking user={user} org={org} /> },
          { path: 'users', element: <UserManagement user={user} org={org} /> },
          { path: 'customs', element: <CustomsClearance user={user} org={org} /> },
          { path: 'customs/export', element: <CustomsClearance user={user} org={org} /> },
          { path: 'customs/import', element: <CustomsClearance user={user} org={org} /> },
          { path: 'pre-registration', element: <ExporterPreRegistration user={user} org={org} /> },
          { path: 'ecta/pre-registration', element: <ECTAPreRegistrationManagement user={user} org={org} /> },
          
          // Exporter Portal Routes
          { path: 'profile', element: <ExporterProfile user={user} org={org} /> },
          { path: 'profile/business', element: <ExporterProfile user={user} org={org} /> },
          { path: 'profile/verification', element: <ExporterProfile user={user} org={org} /> },
          { path: 'applications', element: <ApplicationTracking user={user} org={org} /> },
          { path: 'exports/new', element: <ExportDashboard user={user} org={org} /> },
          { path: 'exports/status', element: <ExportDashboard user={user} org={org} /> },
          { path: 'support', element: <HelpSupport user={user} org={org} /> },
          
          // Pre-registration sub-routes (now handled by URL parameters)
          // All pre-registration navigation goes to the same form with ?step=N parameter
          
          // Banking Operations Routes
          { path: 'banking/documents', element: <BankingOperations user={user} org={org} /> },
          { path: 'banking/financing', element: <BankingOperations user={user} org={org} /> },
          { path: 'banking/compliance', element: <BankingOperations user={user} org={org} /> },
          { path: 'banking/reports', element: <BankingOperations user={user} org={org} /> },
          
          // FX Management Routes
          { path: 'fx', element: <FXRates user={user} org={org} /> },
          { path: 'fx/approvals', element: <FXRates user={user} org={org} /> },
          { path: 'fx/approved', element: <FXRates user={user} org={org} /> },
          { path: 'fx/rejected', element: <FXRates user={user} org={org} /> },
          { path: 'fx/rates', element: <FXRates user={user} org={org} /> },
          
          // Monetary Policy Routes
          { path: 'monetary', element: <MonetaryPolicy user={user} org={org} /> },
          { path: 'monetary/dashboard', element: <MonetaryPolicy user={user} org={org} /> },
          { path: 'monetary/controls', element: <MonetaryPolicy user={user} org={org} /> },
          { path: 'monetary/compliance', element: <MonetaryPolicy user={user} org={org} /> },
          
          // ECTA Routes
          { path: 'preregistration', element: <ECTAPreRegistrationManagement user={user} org={org} /> },
          { path: 'preregistration/pending', element: <ECTAPreRegistrationManagement user={user} org={org} /> },
          { path: 'preregistration/review', element: <ECTAPreRegistrationManagement user={user} org={org} /> },
          { path: 'preregistration/approved', element: <ECTAPreRegistrationManagement user={user} org={org} /> },
          { path: 'preregistration/rejected', element: <ECTAPreRegistrationManagement user={user} org={org} /> },
          
          { path: 'licenses', element: <Dashboard user={user} org={org} /> },
          { path: 'licenses/applications', element: <Dashboard user={user} org={org} /> },
          { path: 'licenses/active', element: <Dashboard user={user} org={org} /> },
          { path: 'licenses/expired', element: <Dashboard user={user} org={org} /> },
          { path: 'licenses/renewals', element: <Dashboard user={user} org={org} /> },
          
          { path: 'contracts', element: <Dashboard user={user} org={org} /> },
          { path: 'contracts/pending', element: <Dashboard user={user} org={org} /> },
          { path: 'contracts/approved', element: <Dashboard user={user} org={org} /> },
          { path: 'contracts/templates', element: <Dashboard user={user} org={org} /> },
          { path: 'contracts/history', element: <Dashboard user={user} org={org} /> },
          
          { path: 'regulatory', element: <Dashboard user={user} org={org} /> },
          { path: 'regulatory/compliance', element: <Dashboard user={user} org={org} /> },
          { path: 'regulatory/audits', element: <Dashboard user={user} org={org} /> },
          { path: 'regulatory/updates', element: <Dashboard user={user} org={org} /> },
          
          // ECX Routes
          { path: 'lots', element: <LotManagement user={user} org={org} /> },
          { path: 'lots/pending', element: <LotManagement user={user} org={org} /> },
          { path: 'lots/verified', element: <LotManagement user={user} org={org} /> },
          { path: 'lots/rejected', element: <LotManagement user={user} org={org} /> },
          { path: 'lots/grading', element: <LotManagement user={user} org={org} /> },
          
          { path: 'trading', element: <Dashboard user={user} org={org} /> },
          { path: 'trading/active', element: <Dashboard user={user} org={org} /> },
          { path: 'trading/prices', element: <Dashboard user={user} org={org} /> },
          { path: 'trading/reports', element: <Dashboard user={user} org={org} /> },
          { path: 'trading/history', element: <Dashboard user={user} org={org} /> },
          
          { path: 'warehouse', element: <Dashboard user={user} org={org} /> },
          { path: 'warehouse/receipts', element: <Dashboard user={user} org={org} /> },
          { path: 'warehouse/storage', element: <Dashboard user={user} org={org} /> },
          { path: 'warehouse/quality', element: <Dashboard user={user} org={org} /> },
          { path: 'warehouse/inventory', element: <Dashboard user={user} org={org} /> },
          
          // Shipping Routes
          { path: 'vessels', element: <ShipmentTracking user={user} org={org} /> },
          { path: 'vessels/fleet', element: <ShipmentTracking user={user} org={org} /> },
          { path: 'vessels/schedule', element: <ShipmentTracking user={user} org={org} /> },
          { path: 'vessels/maintenance', element: <ShipmentTracking user={user} org={org} /> },
          { path: 'vessels/reports', element: <ShipmentTracking user={user} org={org} /> },
          
          { path: 'logistics', element: <ShipmentTracking user={user} org={org} /> },
          { path: 'logistics/routes', element: <ShipmentTracking user={user} org={org} /> },
          { path: 'logistics/tracking', element: <ShipmentTracking user={user} org={org} /> },
          { path: 'logistics/ports', element: <ShipmentTracking user={user} org={org} /> },
          { path: 'logistics/delivery', element: <ShipmentTracking user={user} org={org} /> },
          
          // Customs Routes
          { path: 'documents', element: <CustomsClearance user={user} org={org} /> },
          { path: 'documents/export', element: <CustomsClearance user={user} org={org} /> },
          { path: 'documents/compliance', element: <CustomsClearance user={user} org={org} /> },
          { path: 'documents/declarations', element: <CustomsClearance user={user} org={org} /> },
          { path: 'documents/templates', element: <CustomsClearance user={user} org={org} /> },
          
          { path: 'border', element: <CustomsClearance user={user} org={org} /> },
          { path: 'border/checkpoints', element: <CustomsClearance user={user} org={org} /> },
          { path: 'border/security', element: <CustomsClearance user={user} org={org} /> },
          { path: 'border/compliance', element: <CustomsClearance user={user} org={org} /> },
          { path: 'border/reports', element: <CustomsClearance user={user} org={org} /> },
          
          // Admin Routes
          { path: 'admin', element: <UserManagement user={user} org={org} /> },
          { path: 'admin/users', element: <UserManagement user={user} org={org} /> },
          { path: 'admin/settings', element: <Dashboard user={user} org={org} /> },
          { path: 'admin/audit', element: <Dashboard user={user} org={org} /> },
          { path: 'admin/reports', element: <Dashboard user={user} org={org} /> },
          
          // Blockchain Routes
          { path: 'blockchain', element: <Dashboard user={user} org={org} /> },
          { path: 'blockchain/transactions', element: <Dashboard user={user} org={org} /> },
          { path: 'blockchain/status', element: <Dashboard user={user} org={org} /> },
          { path: 'blockchain/peers', element: <Dashboard user={user} org={org} /> },
          
          // Gateway Routes
          { path: 'gateway', element: <Dashboard user={user} org={org} /> },
          { path: 'gateway/exporter-requests', element: <Dashboard user={user} org={org} /> },
          { path: 'gateway/logs', element: <Dashboard user={user} org={org} /> },
        ],
      },
      {
        path: '*',
        element: <Navigate to="/dashboard" />,
      },
    ],
    {
      future: {
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      },
    }
  ), [user, org, handleLogin, handleLogout, getRoleBasedRoute]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatType: 'loop',
          }}
        >
          <LoadingSkeleton height={100} width={100} borderRadius={4} />
        </motion.div>
      </Box>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <SnackbarProvider
          maxSnack={3}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          autoHideDuration={6000}
          preventDuplicate
        >
          <NotificationProvider>
            <CssBaseline />
            <div className={`app ${orgClass} ${mode}-mode`}>
              <ErrorBoundary>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={orgClass}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <RouterProvider router={router} />
                  </motion.div>
                </AnimatePresence>
              </ErrorBoundary>
            </div>
          </NotificationProvider>
        </SnackbarProvider>
      </LocalizationProvider>
      <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
    </QueryClientProvider>
  );
}

// Wrap the app with the theme provider
const AppWrapper = () => {
  return (
    <AppThemeProvider>
      <App />
    </AppThemeProvider>
  );
};

export default AppWrapper;
