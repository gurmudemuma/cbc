import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getOrganization } from '../config/api.config';
import NotificationCenter from './NotificationCenter';
import ContractNotifications from './ContractNotifications';
import { AccessibilityButton } from './AccessibilityEnhancements';
import { useAccessibilitySettings } from './AccessibilityEnhancements';
import { AccessibilitySettingsDialog } from './AccessibilityEnhancements';
import {
  Coffee,
  Package,
  Award,
  DollarSign,
  Ship,
  LogOut,
  Menu as MenuIcon,
  X,
  XCircle,
  ShieldCheck,
  Users,
  FileCheck,
  Plane,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sun,
  Moon,
  Bell,
  Search,
  User,
  Settings,
  HelpCircle,
  Plus,
  FileText,
  Building,
  CheckCircle,
  UserCheck,
  LayoutDashboard,
  Send,
  BarChart3,
  RefreshCw,
  FileSignature,
  Clock,
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { styled, useTheme } from '@mui/material/styles';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  Avatar,
  Divider,
  Badge,
  Tooltip,
  useMediaQuery,
  Chip,
  InputBase,
  alpha,
  MenuItem,
  Menu as MuiMenu,
  Stack,
} from '@mui/material';

const drawerWidth = 260;
const collapsedWidth = 80;

// Styled components
// Styled components
const StyledAppBar = styled(AppBar)(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
  background: theme.palette.mode === 'dark'
    ? alpha(theme.palette.background.paper, 0.8)
    : alpha('#ffffff', 0.8),
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  boxShadow: 'none',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  transition: theme.transitions.create(['width', 'margin', 'background'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  color: theme.palette.text.primary,
}));

const StyledDrawer = styled(Drawer, {
  shouldForwardProp: (prop) => prop !== 'collapsed',
})<{ collapsed?: boolean }>(({ theme, collapsed }) => ({
  width: collapsed ? collapsedWidth : drawerWidth,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  '& .MuiDrawer-paper': {
    width: collapsed ? collapsedWidth : drawerWidth,
    transition: theme.transitions.create(['width'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: 'hidden',
    background: theme.palette.mode === 'dark'
      ? theme.palette.background.default
      : '#ffffff',
    borderRight: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
    boxShadow: 'none',
    position: 'fixed',
    top: 64, // Below the AppBar
    left: 0,
    height: 'calc(100vh - 64px)',
    '&:hover': {
      '& .MuiListItemIcon': {
        opacity: 1,
      },
      '&::-webkit-scrollbar-thumb': {
        visibility: 'visible',
      }
    },
    '&::-webkit-scrollbar': {
      width: '6px',
    },
    '&::-webkit-scrollbar-track': {
      background: 'transparent',
    },
    '&::-webkit-scrollbar-thumb': {
      background: theme.palette.divider,
      borderRadius: '3px',
      visibility: 'hidden',
    },
  },
}));

const StyledListItemButton = styled(ListItemButton, {
  shouldForwardProp: (prop) => prop !== 'active' && prop !== 'collapsed',
})<{ active?: boolean; collapsed?: boolean }>(({ theme, active, collapsed }) => ({
  borderRadius: 12,
  margin: theme.spacing(0.5, 1.5),
  padding: theme.spacing(1.25, 2),
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    transform: 'translateX(4px)',
  },
  ...(active && {
    backgroundColor: alpha(theme.palette.primary.main, 0.12),
    color: theme.palette.primary.main,
    fontWeight: 600,
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.16),
      transform: 'translateX(4px)',
    },
    '& .MuiListItemIcon-root': {
      color: theme.palette.primary.main,
    },
    '&::before': {
      content: '""',
      position: 'absolute',
      left: 0,
      top: '50%',
      transform: 'translateY(-50%)',
      width: 4,
      height: '40%',
      backgroundColor: theme.palette.primary.main,
      borderTopRightRadius: 4,
      borderBottomRightRadius: 4,
    },
  }),
  ...(collapsed && {
    justifyContent: 'center',
    padding: theme.spacing(1.5),
    minWidth: 48,
    '& .MuiListItemText-root': {
      display: 'none',
    },
    '& .MuiListItemIcon-root': {
      minWidth: 'auto',
      margin: 0,
    },
    '&:hover': {
      transform: 'none',
      backgroundColor: alpha(theme.palette.primary.main, 0.08),
    },
  }),
  ...(!active && {
    '& .MuiListItemIcon-root': {
      color: theme.palette.text.secondary,
      transition: 'color 0.2s',
    },
  })
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(2),
  // Removed border for cleaner look, or make it very subtle
  // borderBottom: `1px solid ${theme.palette.divider}`,
  background: 'transparent',
  ...theme.mixins.toolbar,
}));

const Main = styled('main', {
  shouldForwardProp: (prop) => prop !== 'open' && prop !== 'collapsed',
})<{ open?: boolean; collapsed?: boolean }>(({ theme, open, collapsed }) => ({
  flexGrow: 1,
  paddingTop: '64px',
  transition: theme.transitions.create(['margin', 'padding'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: 0,
  backgroundColor: theme.palette.background.default,
  minHeight: '100vh',
}));

const ContentWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(4),
  maxWidth: 1600,
  margin: '0 auto',
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(2),
  },
}));

const Layout = ({ user, org, onLogout, exports = [] }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Handle null/undefined org values
  const normalizedOrg = org?.toLowerCase()?.trim() || user?.organization?.toLowerCase()?.trim() || user?.role?.toLowerCase()?.trim() || 'default';

  // Priority 2 State
  const { settings, updateSettings } = useAccessibilitySettings();
  const [showAccessibility, setShowAccessibility] = useState(false);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null);

  // Calculate badge counts dynamically based on actual exports
  const calculateBadgeCounts = () => {
    return {
      PENDING: exports.filter(e => e.status === 'PENDING').length,
      FX_PENDING: exports.filter(e => e.status === 'FX_PENDING').length,
      FX_APPROVED: exports.filter(e => e.status === 'FX_APPROVED').length,
      FX_REJECTED: exports.filter(e => e.status === 'FX_REJECTED').length,
      COMPLETED: exports.filter(e => e.status === 'COMPLETED').length,
      BANKING_PENDING: exports.filter(e => e.status === 'BANKING_PENDING').length,
      BANKING_APPROVED: exports.filter(e => e.status === 'BANKING_APPROVED').length,
      BANKING_REJECTED: exports.filter(e => e.status === 'BANKING_REJECTED').length,
      QUALITY_PENDING: exports.filter(e => e.status === 'QUALITY_PENDING').length,
      QUALITY_CERTIFIED: exports.filter(e => e.status === 'QUALITY_CERTIFIED').length,
      QUALITY_REJECTED: exports.filter(e => e.status === 'QUALITY_REJECTED').length,
      EXPORT_CUSTOMS_PENDING: exports.filter(e => e.status === 'EXPORT_CUSTOMS_PENDING').length,
      EXPORT_CUSTOMS_CLEARED: exports.filter(e => e.status === 'EXPORT_CUSTOMS_CLEARED').length,
      EXPORT_CUSTOMS_REJECTED: exports.filter(e => e.status === 'EXPORT_CUSTOMS_REJECTED').length,
      SHIPMENT_PENDING: exports.filter(e => e.status === 'SHIPMENT_PENDING').length,
      SHIPMENT_SCHEDULED: exports.filter(e => e.status === 'SHIPMENT_SCHEDULED').length,
      SHIPPED: exports.filter(e => e.status === 'SHIPPED').length,
      SHIPMENT_REJECTED: exports.filter(e => e.status === 'SHIPMENT_REJECTED').length,
    };
  };

  const badgeCounts = useMemo(() => calculateBadgeCounts(), [exports]);

  // Get role-specific navigation with filters and counts
  const getRoleNavigation = () => {
    const orgLower = normalizedOrg;
    const userRole = user?.role?.toLowerCase();

    // Define organization checks
    const isCommercialBank = orgLower === 'commercial-bank' || orgLower === 'commercialbank';
    const isExporter = orgLower === 'exporter-portal' || orgLower === 'exporterportal' || orgLower === 'exporter' || userRole === 'exporter';

    // Define permission checks
    const canCreateExports = userRole === 'exporter' || userRole === 'admin' || isCommercialBank;

    // � SDK-BASED EXTERNAL ENTITY
    // Exporter Portal - External exporters (SDK-based, non-consortium)
    if (isExporter) {
      return [
        {
          name: 'Network Submission',
          path: '/network/submission',
          icon: Send,
          children: [
            { name: 'Submit to Network', path: '/network/submission', icon: Send },
            { name: 'My Submissions', path: '/network/submissions', icon: FileText },
            { name: 'Submission Status', path: '/network/status', icon: FileCheck },
            { name: 'Network Statistics', path: '/network/statistics', icon: BarChart3 },
          ]
        },
        {
          name: 'My Applications',
          path: '/my-applications',
          icon: FileText,
          children: [
            { name: 'Application Dashboard', path: '/my-applications', icon: LayoutDashboard },
            { name: 'Application Tracking', path: '/applications', icon: FileText },
          ]
        },
        {
          name: 'Sales Contracts',
          path: '/sales-contracts',
          icon: FileSignature,
          children: [
            { name: 'My Contracts', path: '/sales-contracts', icon: FileText },
            { name: 'Draft Contracts', path: '/sales-contracts/drafts', icon: FileText },
            { name: 'Negotiations', path: '/sales-contracts/negotiations', icon: RefreshCw },
            { name: 'Finalized', path: '/sales-contracts/finalized', icon: CheckCircle },
            { name: 'Network Submission', path: '/exporter/network-submission', icon: Send },
          ]
        },
        {
          name: 'Documents',
          path: '/documents',
          icon: FileText,
          children: [
            { name: 'All Documents', path: '/documents', icon: FileText },
            { name: 'Request Documents', path: '/documents?tab=3', icon: Send },
            { name: 'Document Status', path: '/documents?tab=0', icon: FileCheck },
          ]
        },
        { name: 'Profile', path: '/profile', icon: User },
        { name: 'Help & Support', path: '/support', icon: HelpCircle },
      ];
    }

    // 🏛️ CONSORTIUM NETWORK MEMBERS
    // Commercial Bank - Banking operations & consortium orchestration (consortium member)
    if (isCommercialBank) {
      // Banker role - Banking operations and document verification
      if (userRole === 'bank' || userRole === 'banker' || userRole === 'admin') {
        return [
          {
            name: 'Network Management',
            path: '/network/agency-dashboard',
            icon: Building,
            children: [
              { name: 'Network Approval', path: '/network/agency-dashboard', icon: FileCheck, badge: badgeCounts.BANKING_PENDING },
              { name: 'Document Issuance', path: '/network/agency-dashboard', icon: FileText },
              { name: 'Network Statistics', path: '/network/statistics', icon: BarChart3 },
            ]
          },
          {
            name: 'Payment Management',
            path: '/payments',
            icon: DollarSign,
            children: [
              { name: 'All Payments', path: '/payments', icon: DollarSign },
              { name: 'New Payment', path: '/payments/new', icon: Plus },
              { name: 'Initiated Payments', path: '/payments/initiated', icon: Clock },
              { name: 'Completed Payments', path: '/payments/completed', icon: CheckCircle },
            ]
          },
        ];
      }

      // Default fallback for Commercial Bank
      return [
        { name: 'Banking Dashboard', path: '/banking', icon: DollarSign },
        { name: 'Payment Management', path: '/payments', icon: DollarSign },
      ];
    }

    // National Bank - Monetary policy & FX control (consortium member)
    if (
      orgLower === 'nb-regulatory' ||
      orgLower === 'banker' ||
      orgLower === 'banker-001' ||
      orgLower === 'national-bank' ||
      orgLower === 'nationalbank'
    ) {
      // Governor role - Can approve FX and manage monetary policy
      if (userRole === 'governor' || userRole === 'admin') {
        return [
          {
            name: 'Network Management',
            path: '/network/agency-dashboard',
            icon: Building,
            children: [
              { name: 'Network Approval', path: '/network/agency-dashboard', icon: FileCheck },
              { name: 'Document Issuance', path: '/network/agency-dashboard', icon: FileText },
              { name: 'Network Statistics', path: '/network/statistics', icon: BarChart3 },
            ]
          },
          {
            name: 'Payment Management',
            path: '/payments',
            icon: DollarSign,
            children: [
              { name: 'All Payments', path: '/payments', icon: DollarSign },
              { name: 'Payment Review', path: '/bank-payment-review', icon: FileCheck },
              { name: 'FX Approval', path: '/nbe-fx-approval', icon: CheckCircle },
            ]
          },
          {
            name: 'Foreign Exchange Control',
            path: '/fx',
            icon: DollarSign,
            children: [
              { name: 'FX Dashboard', path: '/fx', icon: DollarSign },
              { name: 'Pending FX Approval', path: '/fx/pending', icon: Clock },
              { name: 'FX Approved', path: '/fx/approved', icon: CheckCircle },
              { name: 'FX Rejected', path: '/fx/rejected', icon: XCircle },
              { name: 'FX Rates Management', path: '/fx/rates', icon: RefreshCw },
            ]
          },
          {
            name: 'Export Monitoring',
            path: '/exports',
            icon: Package,
            children: [
              { name: 'All Exports', path: '/exports', icon: Package },
              { name: 'Export Transactions', path: '/exports/transactions', icon: FileText },
              { name: 'Currency Flows', path: '/exports/currency', icon: DollarSign },
              { name: 'Repatriation Tracking', path: '/exports/repatriation', icon: RefreshCw },
            ]
          },
        ];
      }

      // Default fallback for National Bank
      return [
        { name: 'Network Management', path: '/network/agency-dashboard', icon: Building },
        { name: 'Payment Management', path: '/payments', icon: DollarSign },
        { name: 'FX Dashboard', path: '/fx', icon: DollarSign },
        { name: 'Export Monitoring', path: '/exports', icon: Package },
      ];
    }

    // ECX - Ethiopian Commodity Exchange (consortium member)
    if (orgLower === 'ecx') {
      return [
        {
          name: 'Network Management',
          path: '/network/agency-dashboard',
          icon: Building,
          children: [
            { name: 'Network Approval', path: '/network/agency-dashboard', icon: FileCheck },
            { name: 'Document Issuance', path: '/network/agency-dashboard', icon: FileText },
            { name: 'Lot Verification', path: '/lot-verification', icon: Package },
            { name: 'Network Statistics', path: '/network/statistics', icon: BarChart3 },
          ]
        },
      ];
    }

    // ECTA - Ethiopian Coffee & Tea Authority (consortium member)
    if (orgLower === 'ecta') {
      return [
        {
          name: 'Network Management',
          path: '/network/agency-dashboard',
          icon: Building,
          children: [
            { name: 'Network Approval', path: '/network/agency-dashboard', icon: FileCheck },
            { name: 'Document Issuance', path: '/network/agency-dashboard', icon: FileText },
            { name: 'Network Statistics', path: '/network/statistics', icon: BarChart3 },
          ]
        },
        {
          name: 'Sales Contract Management',
          path: '/ecta/sales-contracts',
          icon: FileSignature,
          children: [
            { name: 'Contract Registration', path: '/ecta/sales-contracts/registration', icon: FileSignature },
            { name: 'Registered Contracts', path: '/ecta/sales-contracts/registered', icon: CheckCircle },
          ]
        },
        {
          name: 'Pre-Registration Management',
          path: '/preregistration',
          icon: UserCheck,
          children: [
            { name: 'Dashboard', path: '/preregistration', icon: FileCheck },
            { name: 'Pending Profiles', path: '/preregistration/profiles', icon: User, filter: 'PROFILE_PENDING' },
            { name: 'Pending Laboratories', path: '/preregistration/laboratories', icon: Award, filter: 'LAB_PENDING' },
            { name: 'Pending Tasters', path: '/preregistration/tasters', icon: Users, filter: 'TASTER_PENDING' },
            { name: 'Competence Applications', path: '/preregistration/competence', icon: Award, filter: 'COMPETENCE_PENDING' },
            { name: 'License Applications', path: '/preregistration/licenses', icon: FileText, filter: 'LICENSE_PENDING' },
            { name: 'Approved Exporters', path: '/preregistration/approved', icon: CheckCircle },
          ]
        },
        {
          name: 'Certificate Renewals',
          path: '/certificate-renewals',
          icon: RefreshCw,
          children: [
            { name: 'Pending Renewals', path: '/certificate-renewals', icon: RefreshCw },
            { name: 'Renewal History', path: '/certificate-renewals?tab=history', icon: FileText },
            { name: 'Expiring Certificates', path: '/certificate-renewals?tab=expiring', icon: Award },
          ]
        },
      ];
    }

    // Custom Authorities - Border control & customs (consortium member)
    if (orgLower === 'custom-authorities') {
      return [
        {
          name: 'Network Management',
          path: '/network/agency-dashboard',
          icon: Building,
          children: [
            { name: 'Network Approval', path: '/network/agency-dashboard', icon: FileCheck },
            { name: 'Document Issuance', path: '/network/agency-dashboard', icon: FileText },
            { name: 'Network Statistics', path: '/network/statistics', icon: BarChart3 },
          ]
        },
        {
          name: 'Customs Clearance',
          path: '/customs',
          icon: ShieldCheck,
          children: [
            { name: 'Pending Clearance', path: '/customs/pending', icon: Clock },
            { name: 'Under Inspection', path: '/customs/inspection', icon: FileCheck },
            { name: 'Cleared Exports', path: '/customs/cleared', icon: CheckCircle },
            { name: 'Rejected/Held', path: '/customs/rejected', icon: XCircle },
          ]
        },
      ];
    }

    // Shipping Line - Logistics & transportation (consortium member)
    if (orgLower === 'shipping' || orgLower === 'shipping-line' || orgLower === 'shippingline') {
      return [
        {
          name: 'Network Management',
          path: '/network/agency-dashboard',
          icon: Building,
          children: [
            { name: 'Network Approval', path: '/network/agency-dashboard', icon: FileCheck },
            { name: 'Document Issuance', path: '/network/agency-dashboard', icon: FileText },
            { name: 'Network Statistics', path: '/network/statistics', icon: BarChart3 },
          ]
        },
        {
          name: 'Shipment Management',
          path: '/shipments',
          icon: Ship,
          children: [
            { name: 'Pending Shipments', path: '/shipments/pending', icon: Clock },
            { name: 'Scheduled Shipments', path: '/shipments/scheduled', icon: Ship },
            { name: 'In Transit', path: '/shipments/transit', icon: Ship },
            { name: 'Delivered', path: '/shipments/delivered', icon: CheckCircle },
          ]
        },
      ];
    }

    // Default fallback navigation
    return [
      { name: 'Dashboard', path: '/dashboard', icon: Coffee },
      { name: 'Exports', path: '/exports', icon: Package },
    ];
  };

  const navigation = useMemo(() => getRoleNavigation(), [org, user]);

  // Auto-expand parent items if a child is active
  useEffect(() => {
    const newExpandedItems = {};
    navigation.forEach(item => {
      if (item.children) {
        const hasActiveChild = item.children.some(child => isActive(child));
        if (hasActiveChild) {
          newExpandedItems[item.name] = true;
        }
      }
    });
    if (Object.keys(newExpandedItems).length > 0) {
      setExpandedItems(prev => ({ ...prev, ...newExpandedItems }));
    }
  }, [location, navigation]);

  const isActive = (item) => {
    // Active if on the same path
    if (location.pathname === item.path) {
      // If item has a filter, check if it matches the URL params or sessionStorage
      if (item.filter) {
        const params = new URLSearchParams(location.search);
        const urlFilter = params.get('filter');
        const sessionFilter = sessionStorage.getItem('exportFilter');
        const activeFilter = urlFilter || sessionFilter;
        return activeFilter === item.filter;
      }
      // For items without filter, only active if no filter is set
      const params = new URLSearchParams(location.search);
      const urlFilter = params.get('filter');
      const sessionFilter = sessionStorage.getItem('exportFilter');
      return !urlFilter && !sessionFilter;
    }
    return false;
  };

  const handleNavClick = (item) => {
    if (item.filter) {
      sessionStorage.setItem('exportFilter', item.filter);
    } else {
      sessionStorage.removeItem('exportFilter');
    }
    navigate(item.path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const toggleExpanded = (itemName) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemName]: !prev[itemName]
    }));
  };

  const handleDrawerToggle = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setCollapsed(!collapsed);
    }
  };

  const getOrgName = () => {
    const orgLower = normalizedOrg;
    if (orgLower.includes('exporter')) return 'Exporter Portal';
    if (orgLower.includes('banker') || orgLower.includes('national')) return 'National Bank';
    if (orgLower === 'ecta') return 'ECTA Portal';
    if (orgLower.includes('custom')) return 'Customs Portal';
    if (orgLower.includes('shipping')) return 'Shipping Portal';
    return 'Portal';
  };

  const drawer = (
    <>
      <DrawerHeader>
        {!collapsed && (
          <Typography variant="h6" noWrap sx={{ fontWeight: 600 }}>
            {getOrgName()}
          </Typography>
        )}
        {!isMobile && (
          <IconButton onClick={() => setCollapsed(!collapsed)} size="small">
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
          </IconButton>
        )}
      </DrawerHeader>
      <List sx={{ px: collapsed ? 0.5 : 1 }}>
        {navigation.map((item, idx) => {
          const Icon = item.icon;
          const active = isActive(item);
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedItems[item.name];

          const parentItem = (
            <StyledListItemButton
              key={`${item.path}-${item.name}-${idx}`}
              active={active && !hasChildren}
              onClick={() => {
                if (hasChildren && !collapsed) {
                  toggleExpanded(item.name);
                } else {
                  handleNavClick(item);
                }
              }}
              selected={active && !hasChildren}
            >
              <ListItemIcon sx={{ minWidth: collapsed ? 'auto' : 48 }}>
                {item.badge > 0 ? (
                  <Badge badgeContent={item.badge} color="error">
                    <Icon size={20} />
                  </Badge>
                ) : (
                  <Icon size={20} />
                )}
              </ListItemIcon>
              {!collapsed && (
                <>
                  <ListItemText
                    primary={item.name}
                    primaryTypographyProps={{
                      fontSize: '0.95rem',
                      fontWeight: active && !hasChildren ? 600 : 500,
                    }}
                  />
                  {hasChildren && (
                    isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />
                  )}
                </>
              )}
            </StyledListItemButton>
          );

          const wrappedParent = collapsed ? (
            <Tooltip title={item.name} placement="right" key={`${item.path}-${item.name}-${idx}`}>
              {parentItem}
            </Tooltip>
          ) : (
            parentItem
          );

          // Render children if expanded
          if (hasChildren && isExpanded && !collapsed) {
            return (
              <Box key={`${item.path}-${item.name}-${idx}`}>
                {wrappedParent}
                <List sx={{ pl: 2 }}>
                  {item.children.map((child, childIdx) => {
                    const ChildIcon = child.icon;
                    const childActive = isActive(child);
                    return (
                      <StyledListItemButton
                        key={`${child.path}-${child.name}-${childIdx}`}
                        active={childActive}
                        onClick={() => handleNavClick(child)}
                        selected={childActive}
                        sx={{ py: 0.75 }}
                      >
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          {child.badge > 0 ? (
                            <Badge badgeContent={child.badge} color="error">
                              <ChildIcon size={18} />
                            </Badge>
                          ) : (
                            <ChildIcon size={18} />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={child.name}
                          primaryTypographyProps={{
                            fontSize: '0.875rem',
                            fontWeight: childActive ? 600 : 500,
                          }}
                        />
                      </StyledListItemButton>
                    );
                  })}
                </List>
              </Box>
            );
          }

          return wrappedParent;
        })}
      </List>
    </>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* App Bar */}
      <StyledAppBar position="fixed">
        <Toolbar>
          <IconButton
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, color: 'text.primary' }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
            <Coffee size={32} />
            {!isMobile && (
              <Typography variant="h6" component="div" sx={{ fontWeight: 700, color: 'primary.main' }}>
                Coffee Blockchain
              </Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Show ContractNotifications for network members */}
            {(() => {
              const orgUpper = normalizedOrg.toUpperCase();
              const shouldShow = ['BANK', 'NBE', 'ECX', 'ERCA', 'SHIPPING', 'MOA', 'MOH', 'ECTA'].includes(orgUpper);
              return shouldShow ? <ContractNotifications /> : null;
            })()}
            <NotificationCenter />
            <AccessibilityButton
              settings={settings}
              onOpenSettings={() => setShowAccessibility(true)}
            />
            {!isMobile && (
              <Tooltip title="My Profile">
                <Chip
                  avatar={
                    <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                      {user?.username?.charAt(0).toUpperCase()}
                    </Avatar>
                  }
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {user?.username}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {getOrganization(user?.organizationId || org)?.label || user?.organizationId || user?.role}
                      </Typography>
                    </Box>
                  }
                  onClick={(e) => setProfileAnchor(e.currentTarget)}
                  sx={{
                    height: 48,
                    cursor: 'pointer',
                    '& .MuiChip-label': {
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      py: 0.5,
                    },
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    }
                  }}
                />
              </Tooltip>
            )}
            <MuiMenu
              anchorEl={profileAnchor}
              open={Boolean(profileAnchor)}
              onClose={() => setProfileAnchor(null)}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              PaperProps={{
                sx: {
                  mt: 1,
                  minWidth: 200,
                }
              }}
            >
              <MenuItem onClick={() => { navigate('/profile'); setProfileAnchor(null); }}>
                <ListItemIcon>
                  <User size={20} />
                </ListItemIcon>
                <ListItemText primary="My Profile" />
              </MenuItem>
              <MenuItem onClick={() => { navigate('/profile/business'); setProfileAnchor(null); }}>
                <ListItemIcon>
                  <Building size={20} />
                </ListItemIcon>
                <ListItemText primary="Business Information" />
              </MenuItem>
              <MenuItem onClick={() => { navigate('/profile/verification'); setProfileAnchor(null); }}>
                <ListItemIcon>
                  <CheckCircle size={20} />
                </ListItemIcon>
                <ListItemText primary="Verification Status" />
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => { navigate('/settings'); setProfileAnchor(null); }}>
                <ListItemIcon>
                  <Settings size={20} />
                </ListItemIcon>
                <ListItemText primary="Settings" />
              </MenuItem>
            </MuiMenu>
            <Tooltip title="Logout">
              <IconButton
                onClick={onLogout}
                sx={{
                  color: theme.palette.primary.main,
                  '&:hover': {
                    backgroundColor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                  },
                }}
              >
                <LogOut size={20} />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </StyledAppBar>

      {/* Drawer */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better mobile performance
          }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
      ) : (
        <StyledDrawer
          variant="permanent"
          collapsed={collapsed}
          open
        >
          {drawer}
        </StyledDrawer>
      )}

      {/* Main Content */}
      <Main open={!mobileOpen} collapsed={collapsed}>
        <ContentWrapper>
          <Outlet />
        </ContentWrapper>
      </Main>
    </Box>
  );
};

export default Layout;

