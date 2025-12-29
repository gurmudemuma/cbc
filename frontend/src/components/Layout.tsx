import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getOrganization } from '../config/api.config';
import NotificationCenter from './NotificationCenter';
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
<<<<<<< HEAD
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
=======
const StyledAppBar = styled(AppBar)(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
  background: theme.palette.background.paper,
  borderBottom: `1px solid ${theme.palette.divider}`,
  boxShadow: theme.shadows[1],
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
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
<<<<<<< HEAD
    background: theme.palette.mode === 'dark'
      ? theme.palette.background.default
      : '#ffffff',
    borderRight: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
    boxShadow: 'none',
    position: 'fixed',
    top: 64, // Below the AppBar
=======
    background: theme.palette.background.default,
    borderRight: `1px solid ${theme.palette.divider}`,
    boxShadow: 'none',
    position: 'fixed',
    top: 64,
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
    left: 0,
    height: 'calc(100vh - 64px)',
    '&:hover': {
      '& .MuiListItemIcon': {
        opacity: 1,
      },
<<<<<<< HEAD
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
=======
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
    },
  },
}));

const StyledListItemButton = styled(ListItemButton, {
  shouldForwardProp: (prop) => prop !== 'active' && prop !== 'collapsed',
})<{ active?: boolean; collapsed?: boolean }>(({ theme, active, collapsed }) => ({
<<<<<<< HEAD
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
=======
  borderRadius: theme.shape.borderRadius,
  margin: theme.spacing(0.5, 1.5),
  padding: theme.spacing(1.25, 2),
  transition: theme.transitions.create(
    ['background-color', 'transform', 'padding', 'box-shadow'],
    {
      duration: theme.transitions.duration.shorter,
      easing: theme.transitions.easing.easeInOut,
    }
  ),
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    transform: 'translateX(4px)',
    boxShadow: theme.shadows[2],
  },
  ...(active && {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
      transform: 'translateX(4px)',
    },
    '& .MuiListItemIcon-root': {
      color: theme.palette.primary.contrastText,
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
    },
    '&::before': {
      content: '""',
      position: 'absolute',
<<<<<<< HEAD
      left: 0,
      top: '50%',
      transform: 'translateY(-50%)',
      width: 4,
      height: '40%',
      backgroundColor: theme.palette.primary.main,
      borderTopRightRadius: 4,
      borderBottomRightRadius: 4,
=======
      left: -4,
      top: '50%',
      transform: 'translateY(-50%)',
      width: 8,
      height: '60%',
      backgroundColor: theme.palette.primary.contrastText,
      borderRadius: theme.shape.borderRadius,
      boxShadow: theme.shadows[2],
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
    },
  }),
  ...(collapsed && {
    justifyContent: 'center',
    padding: theme.spacing(1.5),
<<<<<<< HEAD
    minWidth: 48,
=======
    minWidth: 40,
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
    '& .MuiListItemText-root': {
      display: 'none',
    },
    '& .MuiListItemIcon-root': {
      minWidth: 'auto',
      margin: 0,
<<<<<<< HEAD
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
=======
      opacity: 0.9,
    },
    '&:hover': {
      transform: 'scale(1.1)',
    },
  }),
  ...(!active && {
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
      transform: 'translateX(2px)',
    },
    '& .MuiListItemIcon-root': {
      color: theme.palette.text.secondary,
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
    },
  })
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(2),
<<<<<<< HEAD
  // Removed border for cleaner look, or make it very subtle
  // borderBottom: `1px solid ${theme.palette.divider}`,
  background: 'transparent',
=======
  borderBottom: `1px solid ${theme.palette.divider}`,
  background: theme.palette.background.paper,
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
  ...theme.mixins.toolbar,
}));

const Main = styled('main', {
  shouldForwardProp: (prop) => prop !== 'open' && prop !== 'collapsed',
})<{ open?: boolean; collapsed?: boolean }>(({ theme, open, collapsed }) => ({
  flexGrow: 1,
  paddingTop: '64px',
<<<<<<< HEAD
=======
  paddingLeft: 0,
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
  transition: theme.transitions.create(['margin', 'padding'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
<<<<<<< HEAD
  marginLeft: 0,
  backgroundColor: theme.palette.background.default,
  minHeight: '100vh',
}));

const ContentWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(4),
  maxWidth: 1600,
  margin: '0 auto',
=======
  marginLeft: collapsed ? collapsedWidth : drawerWidth,
  backgroundColor: theme.palette.background.default,
  minHeight: '100vh',
  [theme.breakpoints.down('md')]: {
    marginLeft: 0,
    paddingTop: '56px',
    paddingLeft: 0,
  },
}));

const ContentWrapper = styled('div')(({ theme }) => ({
  paddingTop: theme.spacing(3),
  paddingRight: theme.spacing(3),
  paddingBottom: theme.spacing(3),
  paddingLeft: 0,
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(2),
  },
}));

const Layout = ({ user, org, onLogout, exports = [] }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
<<<<<<< HEAD

  // Priority 2 State
  const { settings, updateSettings } = useAccessibilitySettings();
  const [showAccessibility, setShowAccessibility] = useState(false);

=======
  
  // Priority 2 State
  const { settings, updateSettings } = useAccessibilitySettings();
  const [showAccessibility, setShowAccessibility] = useState(false);
  
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});

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
    const orgLower = (org || user?.organizationId || '').toLowerCase();
    const userRole = user?.role?.toLowerCase();
<<<<<<< HEAD

    // Define organization checks
    const isCommercialBank = orgLower === 'commercial-bank' || orgLower === 'commercialbank';

=======
    
    // Define organization checks
    const isCommercialBank = orgLower === 'commercial-bank' || orgLower === 'commercialbank';
    
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
    // Define permission checks
    const canCreateExports = userRole === 'exporter' || userRole === 'admin' || isCommercialBank;

    // 🌐 SDK-BASED EXTERNAL ENTITY
    // Exporter Portal - External exporters (SDK-based, non-consortium)
    if (orgLower === 'exporter-portal' || orgLower === 'exporterportal') {
      return [
<<<<<<< HEAD
        {
          name: 'Exporter Profile',
          path: '/profile',
=======
        { 
          name: 'Exporter Profile', 
          path: '/profile', 
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
          icon: User,
          children: [
            { name: 'My Profile', path: '/profile', icon: User },
            { name: 'Business Information', path: '/profile/business', icon: Building },
            { name: 'Verification Status', path: '/profile/verification', icon: CheckCircle },
          ]
        },
<<<<<<< HEAD
        {
          name: 'Pre-Registration',
          path: '/pre-registration',
          icon: UserCheck,
          children: [
            { name: 'Qualification Progress', path: '/pre-registration', icon: FileCheck },
            { name: 'Profile Registration', path: '/pre-registration?step=0', icon: Building },
            { name: 'Laboratory Certification', path: '/pre-registration?step=1', icon: Award },
=======
        { 
          name: 'Pre-Registration', 
          path: '/pre-registration', 
          icon: UserCheck,
          children: [
            { name: 'Profile Registration', path: '/pre-registration?step=0', icon: Building },
            { name: 'Laboratory Registration', path: '/pre-registration?step=1', icon: FileCheck },
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
            { name: 'Taster Registration', path: '/pre-registration?step=2', icon: User },
            { name: 'Competence Certificate', path: '/pre-registration?step=3', icon: Award },
            { name: 'Export License', path: '/pre-registration?step=4', icon: FileText },
          ]
        },
<<<<<<< HEAD
        {
          name: 'Contract Management',
          path: '/contracts',
          icon: FileText,
          children: [
            { name: 'My Contracts', path: '/contracts', icon: FileText },
            { name: 'Create Contract', path: '/contracts/new', icon: Plus },
            { name: 'Pending ECTA Approval', path: '/contracts', icon: FileCheck, filter: 'CONTRACT_ECTA_REVIEW' },
            { name: 'Approved Contracts', path: '/contracts', icon: CheckCircle, filter: 'CONTRACT_APPROVED' },
            { name: 'Rejected Contracts', path: '/contracts', icon: X, filter: 'CONTRACT_REJECTED' },
          ]
        },
        {
          name: 'My Applications',
          path: '/applications',
=======
        { 
          name: 'My Applications', 
          path: '/applications', 
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
          icon: FileText,
          children: [
            { name: 'Pending Applications', path: '/applications', icon: FileText, filter: 'PENDING', badge: badgeCounts.PENDING },
            { name: 'Under Review', path: '/applications', icon: FileCheck, filter: 'FX_PENDING', badge: badgeCounts.FX_PENDING },
            { name: 'Approved', path: '/applications', icon: CheckCircle, filter: 'FX_APPROVED', badge: badgeCounts.FX_APPROVED },
            { name: 'Rejected', path: '/applications', icon: X, filter: 'FX_REJECTED', badge: badgeCounts.FX_REJECTED },
          ]
        },
<<<<<<< HEAD
        {
          name: 'Export Dashboard',
          path: '/exports',
=======
        { 
          name: 'Export Dashboard', 
          path: '/exports', 
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
          icon: Package,
          children: [
            { name: 'Create Export Request', path: '/exports/new', icon: Plus, disabled: !canCreateExports },
            { name: 'My Export Requests', path: '/exports', icon: Package, filter: 'MY_EXPORTS' },
            { name: 'Export Status', path: '/exports/status', icon: FileCheck },
          ]
        },
        { name: 'Help & Support', path: '/support', icon: HelpCircle },
      ];
    }

    // 🏛️ CONSORTIUM NETWORK MEMBERS
    // Commercial Bank - Banking operations & consortium orchestration (consortium member)
    if (isCommercialBank) {
      // Banker role - Banking operations and document verification
      if (userRole === 'bank' || userRole === 'banker' || userRole === 'admin') {
        return [
<<<<<<< HEAD
          {
            name: 'Banking Operations',
            path: '/banking',
=======
          { 
            name: 'Banking Operations', 
            path: '/banking', 
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
            icon: DollarSign,
            children: [
              { name: 'Document Verification', path: '/banking/documents', icon: FileCheck, filter: 'BANKING_PENDING', badge: badgeCounts.BANKING_PENDING },
              { name: 'Export Financing', path: '/banking/financing', icon: DollarSign },
              { name: 'Compliance Review', path: '/banking/compliance', icon: ShieldCheck },
              { name: 'Banking Reports', path: '/banking/reports', icon: FileText },
            ]
          },
<<<<<<< HEAD
          {
            name: 'Export Management',
            path: '/exports',
=======
          { 
            name: 'Export Management', 
            path: '/exports', 
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
            icon: Package,
            children: [
              { name: 'All Export Requests', path: '/exports', icon: Package, filter: 'ALL' },
              { name: 'Pending Bank Approval', path: '/exports', icon: FileCheck, filter: 'BANKING_PENDING', badge: badgeCounts.BANKING_PENDING },
              { name: 'Bank Approved', path: '/exports', icon: CheckCircle, filter: 'BANKING_APPROVED', badge: badgeCounts.BANKING_APPROVED },
              { name: 'Rejected', path: '/exports', icon: X, filter: 'BANKING_REJECTED', badge: badgeCounts.BANKING_REJECTED },
            ]
          },
<<<<<<< HEAD
          {
            name: 'Blockchain Operations',
            path: '/blockchain',
=======
          { 
            name: 'Blockchain Operations', 
            path: '/blockchain', 
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
            icon: Package,
            children: [
              { name: 'Transaction History', path: '/blockchain/transactions', icon: FileText },
              { name: 'Network Status', path: '/blockchain/status', icon: CheckCircle },
              { name: 'Peer Management', path: '/blockchain/peers', icon: Users },
            ]
          },
<<<<<<< HEAD
          {
            name: 'External Gateway',
            path: '/gateway',
=======
          { 
            name: 'External Gateway', 
            path: '/gateway', 
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
            icon: Users,
            children: [
              { name: 'Exporter Portal Requests', path: '/gateway/exporter-requests', icon: FileText, badge: badgeCounts.PENDING },
              { name: 'API Gateway Logs', path: '/gateway/logs', icon: FileText },
            ]
          },
        ];
      }
<<<<<<< HEAD

      // Exporter role accessing through Commercial Bank
      if (userRole === 'exporter') {
        return [
          {
            name: 'My Export Requests',
            path: '/exports',
=======
      
      // Exporter role accessing through Commercial Bank
      if (userRole === 'exporter') {
        return [
          { 
            name: 'My Export Requests', 
            path: '/exports', 
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
            icon: Package,
            children: [
              { name: 'Draft Requests', path: '/exports', icon: Package, filter: 'PENDING', badge: badgeCounts.PENDING },
              { name: 'Submitted', path: '/exports', icon: Package, filter: 'PENDING', badge: badgeCounts.PENDING },
              { name: 'In Progress', path: '/exports', icon: Package, filter: 'FX_APPROVED', badge: badgeCounts.FX_APPROVED },
              { name: 'Completed', path: '/exports', icon: CheckCircle, filter: 'COMPLETED', badge: badgeCounts.COMPLETED },
            ]
          },
          { name: 'Create Export Request', path: '/exports/new', icon: Plus, disabled: !canCreateExports },
          { name: 'My Documents', path: '/documents', icon: FileText },
        ];
      }
<<<<<<< HEAD

=======
      
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
      // Default fallback for Commercial Bank
      return [
        { name: 'Export Overview', path: '/exports', icon: Package },
        { name: 'Banking Dashboard', path: '/banking', icon: DollarSign },
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
<<<<<<< HEAD
          {
            name: 'FX Management',
            path: '/fx',
=======
          { 
            name: 'FX Management', 
            path: '/fx', 
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
            icon: DollarSign,
            children: [
              { name: 'Pending FX Approvals', path: '/fx/approvals', icon: DollarSign, filter: 'FX_PENDING', badge: badgeCounts.FX_PENDING },
              { name: 'Approved FX', path: '/fx/approved', icon: CheckCircle, filter: 'FX_APPROVED', badge: badgeCounts.FX_APPROVED },
              { name: 'Rejected FX', path: '/fx/rejected', icon: X, filter: 'FX_REJECTED', badge: badgeCounts.FX_REJECTED },
              { name: 'FX Rate Management', path: '/fx/rates', icon: DollarSign },
            ]
          },
<<<<<<< HEAD
          {
            name: 'Monetary Policy',
            path: '/monetary',
=======
          { 
            name: 'Monetary Policy', 
            path: '/monetary', 
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
            icon: Building,
            children: [
              { name: 'Policy Dashboard', path: '/monetary/dashboard', icon: Building },
              { name: 'Exchange Controls', path: '/monetary/controls', icon: ShieldCheck },
              { name: 'Compliance Monitoring', path: '/monetary/compliance', icon: FileCheck },
            ]
          },
<<<<<<< HEAD
          {
            name: 'Export Oversight',
            path: '/exports',
=======
          { 
            name: 'Export Oversight', 
            path: '/exports', 
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
            icon: Package,
            children: [
              { name: 'Export Transactions', path: '/exports/transactions', icon: Package },
              { name: 'Currency Flows', path: '/exports/currency', icon: DollarSign },
              { name: 'Regulatory Reports', path: '/exports/reports', icon: FileText },
            ]
          },
<<<<<<< HEAD
          {
            name: 'System Administration',
            path: '/admin',
=======
          { 
            name: 'System Administration', 
            path: '/admin', 
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
            icon: Settings,
            children: [
              { name: 'User Management', path: '/admin/users', icon: Users },
              { name: 'System Settings', path: '/admin/settings', icon: Settings },
              { name: 'Audit Logs', path: '/admin/audit', icon: FileText },
            ]
          },
        ];
      }
<<<<<<< HEAD

=======
      
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
      // Default fallback for National Bank
      return [
        { name: 'FX Dashboard', path: '/fx', icon: DollarSign },
        { name: 'Export Monitoring', path: '/exports', icon: Package },
        { name: 'Monetary Reports', path: '/reports', icon: FileText },
      ];
    }

    // ECX - Ethiopian Commodity Exchange (consortium member)
    if (orgLower === 'ecx') {
      return [
<<<<<<< HEAD
        {
          name: 'Lot Management',
          path: '/lots',
=======
        { 
          name: 'Lot Management', 
          path: '/lots', 
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
          icon: Package,
          children: [
            { name: 'Pending Verification', path: '/lots/pending', icon: Package, filter: 'PENDING' },
            { name: 'Verified Lots', path: '/lots/verified', icon: CheckCircle, filter: 'QUALITY_APPROVED' },
            { name: 'Rejected Lots', path: '/lots/rejected', icon: X, filter: 'QUALITY_REJECTED' },
            { name: 'Lot Grading', path: '/lots/grading', icon: Award },
          ]
        },
<<<<<<< HEAD
        {
          name: 'Trading Operations',
          path: '/trading',
=======
        { 
          name: 'Trading Operations', 
          path: '/trading', 
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
          icon: DollarSign,
          children: [
            { name: 'Active Trading', path: '/trading/active', icon: DollarSign },
            { name: 'Price Discovery', path: '/trading/prices', icon: DollarSign },
            { name: 'Market Reports', path: '/trading/reports', icon: FileText },
            { name: 'Trading History', path: '/trading/history', icon: FileText },
          ]
        },
<<<<<<< HEAD
        {
          name: 'Warehouse Management',
          path: '/warehouse',
=======
        { 
          name: 'Warehouse Management', 
          path: '/warehouse', 
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
          icon: Building,
          children: [
            { name: 'Warehouse Receipts', path: '/warehouse/receipts', icon: FileText },
            { name: 'Storage Monitoring', path: '/warehouse/storage', icon: Building },
            { name: 'Quality Control', path: '/warehouse/quality', icon: Award },
            { name: 'Inventory Reports', path: '/warehouse/inventory', icon: FileText },
          ]
        },
<<<<<<< HEAD
        {
          name: 'Export Verification',
          path: '/exports',
=======
        { 
          name: 'Export Verification', 
          path: '/exports', 
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
          icon: Package,
          children: [
            { name: 'Pending ECX Verification', path: '/exports/pending', icon: Package, filter: 'PENDING', badge: badgeCounts.PENDING },
            { name: 'ECX Verified', path: '/exports/verified', icon: CheckCircle, filter: 'FX_APPROVED' },
            { name: 'ECX Rejected', path: '/exports/rejected', icon: X, filter: 'FX_REJECTED' },
          ]
        },
      ];
    }

    // ECTA - Ethiopian Coffee & Tea Authority (consortium member)
    if (orgLower === 'ecta') {
      return [
<<<<<<< HEAD
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
          name: 'License Management',
          path: '/licenses',
          icon: Award,
          children: [
            { name: 'Active Licenses', path: '/licenses/active', icon: CheckCircle },
            { name: 'Expiring Soon', path: '/licenses/expiring', icon: FileCheck },
            { name: 'Expired Licenses', path: '/licenses/expired', icon: X },
            { name: 'License Renewals', path: '/licenses/renewals', icon: FileCheck },
          ]
        },
        {
          name: 'Quality Certification',
          path: '/quality',
          icon: Award,
          children: [
            { name: 'Pending Quality Review', path: '/quality/pending', icon: FileCheck, filter: 'ECTA_QUALITY_PENDING', badge: badgeCounts.QUALITY_PENDING },
            { name: 'Quality Inspections', path: '/quality/inspections', icon: Award },
            { name: 'Certified Exports', path: '/quality/certified', icon: CheckCircle, filter: 'ECTA_QUALITY_APPROVED', badge: badgeCounts.QUALITY_CERTIFIED },
            { name: 'Quality Reports', path: '/quality/reports', icon: FileText },
          ]
        },
        {
          name: 'Contract Verification',
          path: '/contracts',
          icon: FileText,
          children: [
            { name: 'Pending Contracts', path: '/contracts/pending', icon: FileCheck, filter: 'CONTRACT_ECTA_REVIEW' },
            { name: 'Under Review', path: '/contracts/review', icon: FileCheck },
            { name: 'Approved Contracts', path: '/contracts/approved', icon: CheckCircle, filter: 'CONTRACT_APPROVED' },
            { name: 'Rejected Contracts', path: '/contracts/rejected', icon: X, filter: 'CONTRACT_REJECTED' },
            { name: 'Certificate of Origin', path: '/contracts/origin', icon: Award },
          ]
        },
        {
          name: 'Regulatory Oversight',
          path: '/regulatory',
=======
        { 
          name: 'Pre-Registration Oversight', 
          path: '/preregistration', 
          icon: UserCheck,
          children: [
            { name: 'Pending Applications', path: '/preregistration/pending', icon: FileText, filter: 'PENDING' },
            { name: 'Under Review', path: '/preregistration/review', icon: FileCheck, filter: 'FX_PENDING' },
            { name: 'Approved Applications', path: '/preregistration/approved', icon: CheckCircle, filter: 'FX_APPROVED' },
            { name: 'Rejected Applications', path: '/preregistration/rejected', icon: X, filter: 'FX_REJECTED' },
          ]
        },
        { 
          name: 'License Management', 
          path: '/licenses', 
          icon: Award,
          children: [
            { name: 'License Applications', path: '/licenses/applications', icon: FileText, filter: 'PENDING' },
            { name: 'Active Licenses', path: '/licenses/active', icon: Award, filter: 'FX_APPROVED' },
            { name: 'Expired Licenses', path: '/licenses/expired', icon: X, filter: 'COMPLETED' },
            { name: 'License Renewals', path: '/licenses/renewals', icon: FileCheck },
          ]
        },
        { 
          name: 'Quality Certification', 
          path: '/quality', 
          icon: Award,
          children: [
            { name: 'Pending Quality Review', path: '/quality/pending', icon: FileCheck, filter: 'QUALITY_PENDING', badge: badgeCounts.QUALITY_PENDING },
            { name: 'Quality Inspections', path: '/quality/inspections', icon: Award },
            { name: 'Certified Exports', path: '/quality/certified', icon: CheckCircle, filter: 'QUALITY_CERTIFIED', badge: badgeCounts.QUALITY_CERTIFIED },
            { name: 'Quality Reports', path: '/quality/reports', icon: FileText },
          ]
        },
        { 
          name: 'Contract Approval', 
          path: '/contracts', 
          icon: FileText,
          children: [
            { name: 'Pending Contracts', path: '/contracts/pending', icon: FileText, filter: 'PENDING' },
            { name: 'Approved Contracts', path: '/contracts/approved', icon: CheckCircle, filter: 'FX_APPROVED' },
            { name: 'Contract Templates', path: '/contracts/templates', icon: FileText },
            { name: 'Contract History', path: '/contracts/history', icon: FileText },
          ]
        },
        { 
          name: 'Regulatory Oversight', 
          path: '/regulatory', 
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
          icon: ShieldCheck,
          children: [
            { name: 'Compliance Monitoring', path: '/regulatory/compliance', icon: ShieldCheck },
            { name: 'Audit Reports', path: '/regulatory/audits', icon: FileText },
            { name: 'Regulatory Updates', path: '/regulatory/updates', icon: FileCheck },
          ]
        },
      ];
    }

    // Custom Authorities - Border control & customs (consortium member)
    if (orgLower === 'custom-authorities') {
      return [
<<<<<<< HEAD
        {
          name: 'Customs Clearance',
          path: '/customs',
=======
        { 
          name: 'Customs Clearance', 
          path: '/customs', 
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
          icon: ShieldCheck,
          children: [
            { name: 'Pending Clearance', path: '/customs/pending', icon: ShieldCheck, filter: 'EXPORT_CUSTOMS_PENDING', badge: badgeCounts.EXPORT_CUSTOMS_PENDING },
            { name: 'Under Inspection', path: '/customs/inspection', icon: FileCheck, filter: 'EXPORT_CUSTOMS_PENDING' },
            { name: 'Cleared Exports', path: '/customs/cleared', icon: CheckCircle, filter: 'EXPORT_CUSTOMS_CLEARED', badge: badgeCounts.EXPORT_CUSTOMS_CLEARED },
            { name: 'Rejected/Held', path: '/customs/rejected', icon: X, filter: 'EXPORT_CUSTOMS_REJECTED', badge: badgeCounts.EXPORT_CUSTOMS_REJECTED },
          ]
        },
<<<<<<< HEAD
        {
          name: 'Documentation',
          path: '/documents',
=======
        { 
          name: 'Documentation', 
          path: '/documents', 
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
          icon: FileText,
          children: [
            { name: 'Export Documentation', path: '/documents/export', icon: FileText },
            { name: 'Compliance Certificates', path: '/documents/compliance', icon: Award },
            { name: 'Customs Declarations', path: '/documents/declarations', icon: FileCheck },
            { name: 'Document Templates', path: '/documents/templates', icon: FileText },
          ]
        },
<<<<<<< HEAD
        {
          name: 'Border Control',
          path: '/border',
=======
        { 
          name: 'Border Control', 
          path: '/border', 
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
          icon: ShieldCheck,
          children: [
            { name: 'Border Checkpoints', path: '/border/checkpoints', icon: ShieldCheck },
            { name: 'Security Screening', path: '/border/security', icon: ShieldCheck },
            { name: 'Compliance Monitoring', path: '/border/compliance', icon: FileCheck },
            { name: 'Border Reports', path: '/border/reports', icon: FileText },
          ]
        },
<<<<<<< HEAD
        {
          name: 'Administration',
          path: '/admin',
=======
        { 
          name: 'Administration', 
          path: '/admin', 
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
          icon: Settings,
          children: [
            { name: 'User Management', path: '/admin/users', icon: Users },
            { name: 'System Settings', path: '/admin/settings', icon: Settings },
            { name: 'Audit Logs', path: '/admin/audit', icon: FileText },
          ]
        },
      ];
    }

    // Shipping Line - Logistics & transportation (consortium member)
    if (orgLower === 'shipping' || orgLower === 'shipping-line' || orgLower === 'shippingline') {
      return [
<<<<<<< HEAD
        {
          name: 'Shipment Management',
          path: '/shipments',
=======
        { 
          name: 'Shipment Management', 
          path: '/shipments', 
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
          icon: Ship,
          children: [
            { name: 'Pending Shipments', path: '/shipments/pending', icon: Ship, filter: 'SHIPMENT_PENDING', badge: badgeCounts.SHIPMENT_PENDING },
            { name: 'Scheduled Shipments', path: '/shipments/scheduled', icon: Ship, filter: 'SHIPMENT_SCHEDULED', badge: badgeCounts.SHIPMENT_SCHEDULED },
            { name: 'In Transit', path: '/shipments/transit', icon: Ship, filter: 'SHIPPED' },
            { name: 'Delivered', path: '/shipments/delivered', icon: CheckCircle, filter: 'COMPLETED' },
          ]
        },
<<<<<<< HEAD
        {
          name: 'Vessel Operations',
          path: '/vessels',
=======
        { 
          name: 'Vessel Operations', 
          path: '/vessels', 
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
          icon: Ship,
          children: [
            { name: 'Fleet Management', path: '/vessels/fleet', icon: Ship },
            { name: 'Vessel Scheduling', path: '/vessels/schedule', icon: Ship },
            { name: 'Maintenance', path: '/vessels/maintenance', icon: Settings },
            { name: 'Vessel Reports', path: '/vessels/reports', icon: FileText },
          ]
        },
<<<<<<< HEAD
        {
          name: 'Logistics Coordination',
          path: '/logistics',
=======
        { 
          name: 'Logistics Coordination', 
          path: '/logistics', 
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
          icon: Package,
          children: [
            { name: 'Route Planning', path: '/logistics/routes', icon: Package },
            { name: 'Cargo Tracking', path: '/logistics/tracking', icon: Package },
            { name: 'Port Operations', path: '/logistics/ports', icon: Building },
            { name: 'Delivery Confirmation', path: '/logistics/delivery', icon: CheckCircle },
          ]
        },
<<<<<<< HEAD
        {
          name: 'Administration',
          path: '/admin',
=======
        { 
          name: 'Administration', 
          path: '/admin', 
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
          icon: Settings,
          children: [
            { name: 'User Management', path: '/admin/users', icon: Users },
            { name: 'System Settings', path: '/admin/settings', icon: Settings },
            { name: 'Operational Reports', path: '/admin/reports', icon: FileText },
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
    const orgLower = (org || '').toLowerCase();
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
<<<<<<< HEAD

=======
          
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
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
<<<<<<< HEAD
                  <ListItemText
=======
                  <ListItemText 
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
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
<<<<<<< HEAD
                        <ListItemText
=======
                        <ListItemText 
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
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
<<<<<<< HEAD

=======
          
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
            <Coffee size={32} />
            {!isMobile && (
              <Typography variant="h6" component="div" sx={{ fontWeight: 700, color: 'primary.main' }}>
                Coffee Blockchain
              </Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <NotificationCenter />
            <AccessibilityButton
              settings={settings}
              onOpenSettings={() => setShowAccessibility(true)}
            />
            {!isMobile && (
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
<<<<<<< HEAD
                sx={{
=======
                sx={{ 
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
                  height: 48,
                  '& .MuiChip-label': {
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    py: 0.5,
                  }
                }}
              />
            )}
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
