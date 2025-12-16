import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { useState, useEffect, useMemo, useCallback, createContext, useContext } from 'react';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { SnackbarProvider } from 'notistack';
import { motion, AnimatePresence } from 'framer-motion';

// Contexts
import { NotificationProvider } from './contexts/NotificationContext';

// Types
import { User } from './types/shared-types';


interface ThemeContextType {
  mode: 'light' | 'dark';
  org: string | null;
  toggleColorMode: () => void;
  setOrganization: (org: string | null) => void;
}

interface AppThemeProviderProps {
  children: React.ReactNode;
}

// Create a theme context
export const ThemeContext = createContext<ThemeContextType | null>(null);

export const useAppTheme = (): ThemeContextType => {
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
import Toast from './components/Toast';

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

// Role-Specific Dashboards
import ECTADashboard from './pages/ECTADashboard';
import NBEDashboard from './pages/NBEDashboard';
import CustomsDashboard from './pages/CustomsDashboard';
import ShippingLineDashboard from './pages/ShippingLineDashboard';
import ECXDashboard from './pages/ECXDashboard';
import CommercialBankDashboard from './pages/CommercialBankDashboard';
import ExporterDashboard from './pages/ExporterDashboard';

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

const getOrgClass = (org: string | null): string => {
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

import { createLogger } from './utils/logger';
import createAccessibleTheme from './config/theme.enhanced';
import SkipLink from './components/SkipLink';

const logger = createLogger('App');

// Theme provider component to wrap the app
const AppThemeProvider: React.FC<AppThemeProviderProps> = ({ children }) => {
  const [org, setOrg] = useState<string | null>(null);
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    // Initialize from localStorage or default to 'light'
    const stored = localStorage.getItem('themeMode');
    return (stored === 'dark' ? 'dark' : 'light');
  });

  // Create theme with enhanced accessibility
  const theme = useMemo(() => {
    logger.debug('Creating theme', { org, mode });
    return createAccessibleTheme(mode);
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
  const setOrganization = useCallback((newOrg: string | null) => {
    setOrg(newOrg);
  }, []);

  // Theme context value
  const themeContextValue: ThemeContextType = useMemo(() => ({
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
function AppContent() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('App must be used within AppThemeProvider');
  }
  const { mode, org, setOrganization } = context;
  const [user, setUser] = useState<User | null>(null);
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

  const getRoleBasedRoute = useCallback((orgId: string | null): string => {
    const orgLower = orgId?.toLowerCase();

    if (orgLower === 'ecta' || orgLower === 'ncat') {
      return '/ecta-dashboard';
    }
    if (orgLower === 'national-bank' || orgLower === 'nationalbank' || orgLower === 'nb-regulatory' || orgLower === 'banker') {
      return '/nbe-dashboard';
    }
    if (orgLower === 'custom-authorities' || orgLower === 'customs') {
      return '/customs-dashboard';
    }
    if (orgLower === 'shipping-line' || orgLower === 'shipping') {
      return '/shipping-dashboard';
    }
    if (orgLower === 'commercial-bank' || orgLower === 'commercialbank') {
      return '/bank-dashboard';
    }
    if (orgLower === 'ecx') {
      return '/ecx-dashboard';
    }
    if (orgLower === 'exporter-portal' || orgLower === 'exporterportal' || orgLower === 'exporter') {
      return '/exporter-dashboard';
    }
    return '/bank-dashboard';
  }, []);

  const handleLogin = useCallback((userData: User, token: string, selectedOrg: string) => {
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
          <Navigate to={getRoleBasedRoute(org)} replace />
        ) : (
          <Login onLogin={handleLogin} />
        ),
      },
      {
        path: '/',
        element: user ? (
          <Layout user={user} org={org} onLogout={handleLogout} exports={[]} />
        ) : (
          <Navigate to="/login" replace />
        ),
        children: [
          { index: true, element: <Navigate to={getRoleBasedRoute(org) || '/dashboard'} replace /> },
          { path: 'dashboard', element: <Dashboard user={user!} /> },
          
          // Role-Specific Dashboards
          { path: 'ecta-dashboard', element: <ECTADashboard user={user!} /> },
          { path: 'nbe-dashboard', element: <NBEDashboard user={user!} /> },
          { path: 'customs-dashboard', element: <CustomsDashboard user={user!} /> },
          { path: 'shipping-dashboard', element: <ShippingLineDashboard user={user!} /> },
          { path: 'ecx-dashboard', element: <ECXDashboard user={user!} /> },
          { path: 'bank-dashboard', element: <CommercialBankDashboard user={user!} /> },
          { path: 'exporter-dashboard', element: <ExporterDashboard user={user!} /> },
          
          { path: 'exports', element: <ExportManagement user={user!} /> },
          { path: 'exports/:id', element: <ExportDetails user={user!} /> },
          { path: 'quality', element: <QualityCertification user={user!} /> },
          {
            path: 'origin-certificates',
            element: <QualityCertification user={user!} />,
          },
          { path: 'fx-approval', element: <ExportManagement user={user!} /> },
          { path: 'fx-rates', element: <FXRates user={user!} /> },
          {
            path: 'payment-repatriation',
            element: <ExportManagement user={user!} />,
          },
          { path: 'banking', element: <ExportManagement user={user!} /> },
          { path: 'shipments', element: <ShipmentTracking user={user!} /> },
          { path: 'arrivals', element: <ShipmentTracking user={user!} /> },
          { path: 'users', element: <UserManagement user={user!} /> },
          { path: 'customs', element: <CustomsClearance user={user!} /> },
          { path: 'customs/export', element: <CustomsClearance user={user!} /> },
          { path: 'customs/import', element: <CustomsClearance user={user!} /> },
          { path: 'pre-registration', element: <ExporterPreRegistration /> },
          { path: 'ecta/pre-registration', element: <ECTAPreRegistrationManagement /> },

          // Exporter Portal Routes
          { path: 'profile', element: <ExporterProfile user={user!} org={org} /> },
          { path: 'profile/business', element: <ExporterProfile user={user!} org={org} /> },
          { path: 'profile/verification', element: <ExporterProfile user={user!} org={org} /> },
          { path: 'applications', element: <ApplicationTracking user={user!} org={org} /> },
          { path: 'exports/new', element: <ExportDashboard user={user!} org={org ? { id: org, name: org, type: 'exporter' } : undefined} /> },
          { path: 'exports/status', element: <ExportDashboard user={user!} org={org ? { id: org, name: org, type: 'exporter' } : undefined} /> },
          { path: 'support', element: <HelpSupport user={user!} org={org} /> },

          // Pre-registration sub-routes (now handled by URL parameters)
          // All pre-registration navigation goes to the same form with ?step=N parameter

          // Banking Operations Routes
          { path: 'banking/documents', element: <BankingOperations user={user!} org={org} /> },
          { path: 'banking/financing', element: <BankingOperations user={user!} org={org} /> },
          { path: 'banking/compliance', element: <BankingOperations user={user!} org={org} /> },
          { path: 'banking/reports', element: <BankingOperations user={user!} org={org} /> },

          // FX Management Routes
          { path: 'fx', element: <FXRates user={user!} /> },
          { path: 'fx/approvals', element: <FXRates user={user!} /> },
          { path: 'fx/approved', element: <FXRates user={user!} /> },
          { path: 'fx/rejected', element: <FXRates user={user!} /> },
          { path: 'fx/rates', element: <FXRates user={user!} /> },

          // Monetary Policy Routes
          { path: 'monetary', element: <MonetaryPolicy user={user!} org={org} /> },
          { path: 'monetary/dashboard', element: <MonetaryPolicy user={user!} org={org} /> },
          { path: 'monetary/controls', element: <MonetaryPolicy user={user!} org={org} /> },
          { path: 'monetary/compliance', element: <MonetaryPolicy user={user!} org={org} /> },

          // ECTA Routes
          { path: 'preregistration', element: <ECTAPreRegistrationManagement /> },
          { path: 'preregistration/pending', element: <ECTAPreRegistrationManagement /> },
          { path: 'preregistration/review', element: <ECTAPreRegistrationManagement /> },
          { path: 'preregistration/approved', element: <ECTAPreRegistrationManagement /> },
          { path: 'preregistration/rejected', element: <ECTAPreRegistrationManagement /> },

          { path: 'licenses', element: <Dashboard user={user!} /> },
          { path: 'licenses/applications', element: <Dashboard user={user!} /> },
          { path: 'licenses/active', element: <Dashboard user={user!} /> },
          { path: 'licenses/expired', element: <Dashboard user={user!} /> },
          { path: 'licenses/renewals', element: <Dashboard user={user!} /> },

          { path: 'contracts', element: <Dashboard user={user!} /> },
          { path: 'contracts/pending', element: <Dashboard user={user!} /> },
          { path: 'contracts/approved', element: <Dashboard user={user!} /> },
          { path: 'contracts/templates', element: <Dashboard user={user!} /> },
          { path: 'contracts/history', element: <Dashboard user={user!} /> },

          { path: 'regulatory', element: <Dashboard user={user!} /> },
          { path: 'regulatory/compliance', element: <Dashboard user={user!} /> },
          { path: 'regulatory/audits', element: <Dashboard user={user!} /> },
          { path: 'regulatory/updates', element: <Dashboard user={user!} /> },

          // ECX Routes
          { path: 'lots', element: <LotManagement user={user!} org={org} /> },
          { path: 'lots/pending', element: <LotManagement user={user!} org={org} /> },
          { path: 'lots/verified', element: <LotManagement user={user!} org={org} /> },
          { path: 'lots/rejected', element: <LotManagement user={user!} org={org} /> },
          { path: 'lots/grading', element: <LotManagement user={user!} org={org} /> },

          { path: 'trading', element: <Dashboard user={user!} /> },
          { path: 'trading/active', element: <Dashboard user={user!} /> },
          { path: 'trading/prices', element: <Dashboard user={user!} /> },
          { path: 'trading/reports', element: <Dashboard user={user!} /> },
          { path: 'trading/history', element: <Dashboard user={user!} /> },

          { path: 'warehouse', element: <Dashboard user={user!} /> },
          { path: 'warehouse/receipts', element: <Dashboard user={user!} /> },
          { path: 'warehouse/storage', element: <Dashboard user={user!} /> },
          { path: 'warehouse/quality', element: <Dashboard user={user!} /> },
          { path: 'warehouse/inventory', element: <Dashboard user={user!} /> },

          // Shipping Routes
          { path: 'vessels', element: <ShipmentTracking user={user!} /> },
          { path: 'vessels/fleet', element: <ShipmentTracking user={user!} /> },
          { path: 'vessels/schedule', element: <ShipmentTracking user={user!} /> },
          { path: 'vessels/maintenance', element: <ShipmentTracking user={user!} /> },
          { path: 'vessels/reports', element: <ShipmentTracking user={user!} /> },

          { path: 'logistics', element: <ShipmentTracking user={user!} /> },
          { path: 'logistics/routes', element: <ShipmentTracking user={user!} /> },
          { path: 'logistics/tracking', element: <ShipmentTracking user={user!} /> },
          { path: 'logistics/ports', element: <ShipmentTracking user={user!} /> },
          { path: 'logistics/delivery', element: <ShipmentTracking user={user!} /> },

          // Customs Routes
          { path: 'documents', element: <CustomsClearance user={user!} /> },
          { path: 'documents/export', element: <CustomsClearance user={user!} /> },
          { path: 'documents/compliance', element: <CustomsClearance user={user!} /> },
          { path: 'documents/declarations', element: <CustomsClearance user={user!} /> },
          { path: 'documents/templates', element: <CustomsClearance user={user!} /> },

          { path: 'border', element: <CustomsClearance user={user!} /> },
          { path: 'border/checkpoints', element: <CustomsClearance user={user!} /> },
          { path: 'border/security', element: <CustomsClearance user={user!} /> },
          { path: 'border/compliance', element: <CustomsClearance user={user!} /> },
          { path: 'border/reports', element: <CustomsClearance user={user!} /> },

          // Admin Routes
          { path: 'admin', element: <UserManagement user={user!} /> },
          { path: 'admin/users', element: <UserManagement user={user!} /> },
          { path: 'admin/settings', element: <Dashboard user={user!} /> },
          { path: 'admin/audit', element: <Dashboard user={user!} /> },
          { path: 'admin/reports', element: <Dashboard user={user!} /> },

          // Blockchain Routes
          { path: 'blockchain', element: <Dashboard user={user!} /> },
          { path: 'blockchain/transactions', element: <Dashboard user={user!} /> },
          { path: 'blockchain/status', element: <Dashboard user={user!} /> },
          { path: 'blockchain/peers', element: <Dashboard user={user!} /> },

          // Gateway Routes
          { path: 'gateway', element: <Dashboard user={user!} /> },
          { path: 'gateway/exporter-requests', element: <Dashboard user={user!} /> },
          { path: 'gateway/logs', element: <Dashboard user={user!} /> },
        ],
      },
      {
        path: '*',
        element: <Navigate to="/dashboard" />,
      },
    ],
    {
      future: {
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
            <SkipLink />
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
                    <main id="main-content">
                      <RouterProvider router={router} />
                    </main>
                  </motion.div>
                </AnimatePresence>
              </ErrorBoundary>
            </div>
          </NotificationProvider>
        </SnackbarProvider>
      </LocalizationProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

// Wrap the app with the theme provider
const App = () => {
  return (
    <AppThemeProvider>
      <AppContent />
    </AppThemeProvider>
  );
};

export default App;
