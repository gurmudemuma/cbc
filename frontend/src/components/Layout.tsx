// @ts-nocheck
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getOrganization } from '../config/api.config';
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
  Plus,
  FileText,
  Building,
  CheckCircle,
  UserCheck,
  User,
  HelpCircle,
  Settings,
  Badge,
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { styled, useTheme } from '@mui/material/styles';
import NotificationCenter from './NotificationCenter';
import NotificationPreferencesDialog from './NotificationPreferences';
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
  Tooltip,
  useMediaQuery,
  Chip,
} from '@mui/material';

// TypeScript Interfaces
interface User {
  id?: string;
  username?: string;
  role?: string;
  organizationId?: string;
  email?: string;
  [key: string]: any;
}

interface ExportItem {
  status: string;
  [key: string]: any;
}

interface NavigationItem {
  name: string;
  path: string;
  icon: any;
  filter?: string;
  badge?: number;
  disabled?: boolean;
  children?: NavigationItem[];
}

interface LayoutProps {
  user: User;
  org?: string | null;
  onLogout: () => void;
  exports?: ExportItem[];
}

interface StyledDrawerProps {
  collapsed?: boolean;
  drawerWidth?: number;
}

interface StyledListItemButtonProps {
  active?: boolean;
  collapsed?: boolean;
}

interface MainProps {
  open?: boolean;
  collapsed?: boolean;
  drawerWidth?: number;
}

const baseDrawerWidth = 240;
const collapsedWidth = 56;
const maxDrawerWidth = 400;

// Styled components
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
}));

const StyledDrawer = styled(Drawer, {
  shouldForwardProp: (prop) => prop !== 'collapsed' && prop !== 'drawerWidth',
})<StyledDrawerProps>(({ theme, collapsed, drawerWidth }) => ({
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
    background: theme.palette.background.default,
    borderRight: `1px solid ${theme.palette.divider}`,
    boxShadow: 'none',
    position: 'fixed',
    top: 64,
    left: 0,
    height: 'calc(100vh - 64px)',
    '&:hover': {
      '& .MuiListItemIcon': {
        opacity: 1,
      },
    },
  },
}));

const StyledListItemButton = styled(ListItemButton, {
  shouldForwardProp: (prop) => prop !== 'active' && prop !== 'collapsed',
})<StyledListItemButtonProps>(({ theme, active, collapsed }) => ({
  borderRadius: theme.shape.borderRadius,
  margin: theme.spacing(0.5, 1),
  padding: theme.spacing(1, 1.5),
  transition: theme.transitions.create(
    ['background-color', 'transform', 'padding', 'box-shadow'],
    {
      duration: theme.transitions.duration.shorter,
      easing: theme.transitions.easing.easeInOut,
    }
  ),
  position: 'relative',
  overflow: 'visible',
  whiteSpace: 'nowrap',
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
    },
    '&::before': {
      content: '""',
      position: 'absolute',
      left: -4,
      top: '50%',
      transform: 'translateY(-50%)',
      width: 8,
      height: '60%',
      backgroundColor: theme.palette.primary.contrastText,
      borderRadius: theme.shape.borderRadius,
      boxShadow: theme.shadows[2],
    },
  }),
  ...(collapsed && {
    justifyContent: 'center',
    padding: theme.spacing(1.5),
    minWidth: 40,
    '& .MuiListItemText-root': {
      display: 'none',
    },
    '& .MuiListItemIcon-root': {
      minWidth: 'auto',
      margin: 0,
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
    },
  })
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  background: theme.palette.background.paper,
  ...theme.mixins.toolbar,
}));

const Main = styled('main', {
  shouldForwardProp: (prop) => prop !== 'open' && prop !== 'collapsed' && prop !== 'drawerWidth',
})<MainProps>(({ theme, collapsed, drawerWidth }) => ({
  flexGrow: 1,
  paddingTop: '64px',
  paddingLeft: 0,
  transition: theme.transitions.create(['margin', 'padding'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: collapsed ? `${collapsedWidth}px` : `${drawerWidth}px`,
  backgroundColor: theme.palette.background.default,
  minHeight: '100vh',
  [theme.breakpoints.down('md')]: {
    marginLeft: 0,
    paddingTop: '56px',
    paddingLeft: 0,
  },
}));

const ContentWrapper = styled('div')(({ theme }) => ({
  paddingTop: theme.spacing(2),
  paddingRight: theme.spacing(2),
  paddingBottom: theme.spacing(2),
  paddingLeft: theme.spacing(1.5),
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(2),
  },
}));

const Layout: React.FC<LayoutProps> = ({ user, org, onLogout, exports = [] }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  // Calculate badge counts dynamically based on actual exports
  const calculateBadgeCounts = (): Record<string, number> => {
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
  const getRoleNavigation = (): NavigationItem[] => {
    const orgLower = (org || user?.organizationId || '').toLowerCase();
    const userRole = user?.role?.toLowerCase();

    // Define organization checks
    const isCommercialBank = orgLower === 'commercial-bank' || orgLower === 'commercialbank';

    // Define permission checks
    const canCreateExports = userRole === 'exporter' || userRole === 'admin' || isCommercialBank;

    // 🌐 SDK-BASED EXTERNAL ENTITY
    // Exporter Portal - External exporters (SDK-based, non-consortium)
    if (orgLower === 'exporter-portal' || orgLower === 'exporterportal') {
      return [
        {
          name: 'Exporter Profile',
          path: '/profile',
          icon: User,
          children: [
            { name: 'My Profile', path: '/profile', icon: User },
            { name: 'Business Information', path: '/profile/business', icon: Building },
            { name: 'Verification Status', path: '/profile/verification', icon: CheckCircle },
          ],
        },
        {
          name: 'Qualification & Licensing',
          path: '/pre-registration',
          icon: UserCheck,
          children: [
            { name: 'Profile Registration', path: '/pre-registration?step=0', icon: Building },
            { name: 'Laboratory Registration', path: '/pre-registration?step=1', icon: FileCheck },
            { name: 'Taster Registration', path: '/pre-registration?step=2', icon: User },
            { name: 'Competence Certificate', path: '/pre-registration?step=3', icon: Award },
            { name: 'Export License', path: '/pre-registration?step=4', icon: FileText },
          ],
        },
        {
          name: 'Applications',
          path: '/applications',
          icon: FileText,
          children: [
            { name: 'Pending Applications', path: '/applications', icon: FileText, filter: 'PENDING', badge: badgeCounts.PENDING },
            { name: 'Under Review', path: '/applications', icon: FileCheck, filter: 'UNDER_REVIEW', badge: badgeCounts.UNDER_REVIEW },
            { name: 'Approved', path: '/applications', icon: CheckCircle, filter: 'APPROVED', badge: badgeCounts.APPROVED },
            { name: 'Rejected', path: '/applications', icon: X, filter: 'REJECTED', badge: badgeCounts.REJECTED },
          ],
        },
        {
          name: 'Exports',
          path: '/exports',
          icon: Package,
          children: [
            { name: 'Create Export Request', path: '/exports/new', icon: Plus, disabled: !canCreateExports },
            { name: 'Draft', path: '/exports', icon: Package, filter: 'DRAFT', badge: badgeCounts.DRAFT },
            { name: 'Submitted', path: '/exports', icon: FileCheck, filter: 'PENDING', badge: badgeCounts.PENDING },
            { name: 'In Progress', path: '/exports', icon: Package, filter: 'IN_PROGRESS', badge: badgeCounts.IN_PROGRESS },
            { name: 'Bank Pending', path: '/exports', icon: FileCheck, filter: 'BANK_PENDING', badge: badgeCounts.BANK_PENDING },
            { name: 'Bank Approved', path: '/exports', icon: CheckCircle, filter: 'BANK_APPROVED', badge: badgeCounts.BANK_APPROVED },
            { name: 'Quality Pending', path: '/exports', icon: FileCheck, filter: 'QUALITY_PENDING', badge: badgeCounts.QUALITY_PENDING },
            { name: 'Quality Certified', path: '/exports', icon: CheckCircle, filter: 'QUALITY_CERTIFIED', badge: badgeCounts.QUALITY_CERTIFIED },
            { name: 'FX Pending', path: '/exports', icon: DollarSign, filter: 'FX_PENDING', badge: badgeCounts.FX_PENDING },
            { name: 'FX Approved', path: '/exports', icon: CheckCircle, filter: 'FX_APPROVED', badge: badgeCounts.FX_APPROVED },
            { name: 'Customs Pending', path: '/exports', icon: ShieldCheck, filter: 'CUSTOMS_PENDING', badge: badgeCounts.CUSTOMS_PENDING },
            { name: 'Customs Cleared', path: '/exports', icon: CheckCircle, filter: 'CUSTOMS_CLEARED', badge: badgeCounts.CUSTOMS_CLEARED },
            { name: 'Shipment Pending', path: '/exports', icon: Package, filter: 'SHIPMENT_PENDING', badge: badgeCounts.SHIPMENT_PENDING },
            { name: 'Shipped', path: '/exports', icon: Package, filter: 'SHIPPED', badge: badgeCounts.SHIPPED },
            { name: 'Completed', path: '/exports', icon: CheckCircle, filter: 'COMPLETED', badge: badgeCounts.COMPLETED },
            { name: 'Rejected', path: '/exports', icon: X, filter: 'REJECTED', badge: badgeCounts.REJECTED },
            { name: 'Export Status Overview', path: '/exports/status', icon: FileCheck },
          ],
        },
        {
          name: 'Payments & Repatriation',
          path: '/payment-repatriation',
          icon: DollarSign,
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
          {
            name: 'Banking Operations',
            path: '/banking',
            icon: DollarSign,
            children: [
              { name: 'Document Verification', path: '/banking/documents', icon: FileCheck, filter: 'PENDING_VERIFICATION', badge: badgeCounts.PENDING_VERIFICATION },
              { name: 'Export Financing', path: '/banking/financing', icon: DollarSign },
              { name: 'Compliance Review', path: '/banking/compliance', icon: ShieldCheck },
              { name: 'Banking Reports', path: '/banking/reports', icon: FileText },
            ]
          },
          {
            name: 'Export Management',
            path: '/exports',
            icon: Package,
            children: [
              { name: 'All Export Requests', path: '/exports', icon: Package, filter: 'ALL' },
              { name: 'Pending Bank Approval', path: '/exports', icon: FileCheck, filter: 'BANK_PENDING', badge: badgeCounts.BANK_PENDING },
              { name: 'Bank Approved', path: '/exports', icon: CheckCircle, filter: 'BANK_APPROVED', badge: badgeCounts.BANK_APPROVED },
              { name: 'Rejected', path: '/exports', icon: X, filter: 'BANK_REJECTED', badge: badgeCounts.BANK_REJECTED },
            ]
          },
          {
            name: 'Blockchain Operations',
            path: '/blockchain',
            icon: Package,
            children: [
              { name: 'Transaction History', path: '/blockchain/transactions', icon: FileText },
              { name: 'Network Status', path: '/blockchain/status', icon: CheckCircle },
              { name: 'Peer Management', path: '/blockchain/peers', icon: Users },
            ]
          },
          {
            name: 'External Gateway',
            path: '/gateway',
            icon: Users,
            children: [
              { name: 'Exporter Portal Requests', path: '/gateway/exporter-requests', icon: FileText, badge: badgeCounts.EXTERNAL_REQUESTS },
              { name: 'API Gateway Logs', path: '/gateway/logs', icon: FileText },
            ]
          },
        ];
      }

      // Exporter role accessing through Commercial Bank
      if (userRole === 'exporter') {
        return [
          {
            name: 'Qualification & Licensing',
            path: '/pre-registration',
            icon: UserCheck,
            children: [
              { name: 'Profile Registration', path: '/pre-registration?step=0', icon: Building },
              { name: 'Laboratory Registration', path: '/pre-registration?step=1', icon: FileCheck },
              { name: 'Taster Registration', path: '/pre-registration?step=2', icon: User },
              { name: 'Competence Certificate', path: '/pre-registration?step=3', icon: Award },
              { name: 'Export License', path: '/pre-registration?step=4', icon: FileText },
              { name: 'Qualification Status', path: '/pre-registration/status', icon: CheckCircle },
            ]
          },
          {
            name: 'My Export Requests',
            path: '/exports',
            icon: Package,
            children: [
              { name: 'Create New Export', path: '/exports/new', icon: Plus, disabled: !canCreateExports },
              { name: 'Draft Requests', path: '/exports', icon: Package, filter: 'DRAFT', badge: badgeCounts.DRAFT },
              { name: 'Submitted', path: '/exports', icon: Package, filter: 'PENDING', badge: badgeCounts.PENDING },
              { name: 'In Progress', path: '/exports', icon: Package, filter: 'IN_PROGRESS', badge: badgeCounts.IN_PROGRESS },
              { name: 'Completed', path: '/exports', icon: CheckCircle, filter: 'COMPLETED', badge: badgeCounts.COMPLETED },
              { name: 'Rejected', path: '/exports', icon: X, filter: 'REJECTED', badge: badgeCounts.REJECTED },
            ]
          },
          {
            name: 'My Documents',
            path: '/documents',
            icon: FileText,
            children: [
              { name: 'Export Documents', path: '/documents/exports', icon: FileText },
              { name: 'Qualification Documents', path: '/documents/qualification', icon: Award },
              { name: 'Compliance Certificates', path: '/documents/compliance', icon: CheckCircle },
            ]
          },
          { name: 'My Profile', path: '/profile', icon: User },
          { name: 'Help & Support', path: '/support', icon: HelpCircle },
        ];
      }

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
          {
            name: 'FX Management',
            path: '/fx',
            icon: DollarSign,
            children: [
              { name: 'Pending FX Approvals', path: '/fx/approvals', icon: DollarSign, filter: 'FX_PENDING', badge: badgeCounts.FX_PENDING },
              { name: 'Approved FX', path: '/fx/approved', icon: CheckCircle, filter: 'FX_APPROVED', badge: badgeCounts.FX_APPROVED },
              { name: 'Rejected FX', path: '/fx/rejected', icon: X, filter: 'FX_REJECTED', badge: badgeCounts.FX_REJECTED },
              { name: 'FX Rate Management', path: '/fx/rates', icon: DollarSign },
            ]
          },
          {
            name: 'Monetary Policy',
            path: '/monetary',
            icon: Building,
            children: [
              { name: 'Policy Dashboard', path: '/monetary/dashboard', icon: Building },
              { name: 'Exchange Controls', path: '/monetary/controls', icon: ShieldCheck },
              { name: 'Compliance Monitoring', path: '/monetary/compliance', icon: FileCheck },
            ]
          },
          {
            name: 'Export Oversight',
            path: '/exports',
            icon: Package,
            children: [
              { name: 'Export Transactions', path: '/exports/transactions', icon: Package },
              { name: 'Currency Flows', path: '/exports/currency', icon: DollarSign },
              { name: 'Regulatory Reports', path: '/exports/reports', icon: FileText },
            ]
          },
          {
            name: 'System Administration',
            path: '/admin',
            icon: Settings,
            children: [
              { name: 'User Management', path: '/admin/users', icon: Users },
              { name: 'System Settings', path: '/admin/settings', icon: Settings },
              { name: 'Audit Logs', path: '/admin/audit', icon: FileText },
            ]
          },
        ];
      }

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
        {
          name: 'Lot Management',
          path: '/lots',
          icon: Package,
          children: [
            { name: 'Pending Verification', path: '/lots/pending', icon: Package, filter: 'LOT_PENDING', badge: badgeCounts.LOT_PENDING },
            { name: 'Verified Lots', path: '/lots/verified', icon: CheckCircle, filter: 'LOT_VERIFIED', badge: badgeCounts.LOT_VERIFIED },
            { name: 'Rejected Lots', path: '/lots/rejected', icon: X, filter: 'LOT_REJECTED', badge: badgeCounts.LOT_REJECTED },
            { name: 'Lot Grading', path: '/lots/grading', icon: Award },
          ]
        },
        {
          name: 'Trading Operations',
          path: '/trading',
          icon: DollarSign,
          children: [
            { name: 'Active Trading', path: '/trading/active', icon: DollarSign },
            { name: 'Price Discovery', path: '/trading/prices', icon: DollarSign },
            { name: 'Market Reports', path: '/trading/reports', icon: FileText },
            { name: 'Trading History', path: '/trading/history', icon: FileText },
          ]
        },
        {
          name: 'Warehouse Management',
          path: '/warehouse',
          icon: Building,
          children: [
            { name: 'Warehouse Receipts', path: '/warehouse/receipts', icon: FileText },
            { name: 'Storage Monitoring', path: '/warehouse/storage', icon: Building },
            { name: 'Quality Control', path: '/warehouse/quality', icon: Award },
            { name: 'Inventory Reports', path: '/warehouse/inventory', icon: FileText },
          ]
        },
        {
          name: 'Export Verification',
          path: '/exports',
          icon: Package,
          children: [
            { name: 'Pending ECX Verification', path: '/exports/pending', icon: Package, filter: 'ECX_PENDING', badge: badgeCounts.ECX_PENDING },
            { name: 'ECX Verified', path: '/exports/verified', icon: CheckCircle, filter: 'ECX_VERIFIED', badge: badgeCounts.ECX_VERIFIED },
            { name: 'ECX Rejected', path: '/exports/rejected', icon: X, filter: 'ECX_REJECTED', badge: badgeCounts.ECX_REJECTED },
          ]
        },
      ];
    }

    // ECTA - Ethiopian Coffee & Tea Authority (consortium member)
    if (orgLower === 'ecta') {
      return [
        {
          name: 'Pre-Registration Oversight',
          path: '/preregistration',
          icon: UserCheck,
          children: [
            { name: 'Pending Applications', path: '/preregistration/pending', icon: FileText, filter: 'PREREG_PENDING', badge: badgeCounts.PREREG_PENDING },
            { name: 'Under Review', path: '/preregistration/review', icon: FileCheck, filter: 'PREREG_REVIEW', badge: badgeCounts.PREREG_REVIEW },
            { name: 'Approved Applications', path: '/preregistration/approved', icon: CheckCircle, filter: 'PREREG_APPROVED', badge: badgeCounts.PREREG_APPROVED },
            { name: 'Rejected Applications', path: '/preregistration/rejected', icon: X, filter: 'PREREG_REJECTED', badge: badgeCounts.PREREG_REJECTED },
          ]
        },
        {
          name: 'License Management',
          path: '/licenses',
          icon: Award,
          children: [
            { name: 'License Applications', path: '/licenses/applications', icon: FileText, filter: 'LICENSE_PENDING', badge: badgeCounts.LICENSE_PENDING },
            { name: 'Active Licenses', path: '/licenses/active', icon: Award, filter: 'LICENSE_ACTIVE', badge: badgeCounts.LICENSE_ACTIVE },
            { name: 'Expired Licenses', path: '/licenses/expired', icon: X, filter: 'LICENSE_EXPIRED', badge: badgeCounts.LICENSE_EXPIRED },
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
            { name: 'Pending Contracts', path: '/contracts/pending', icon: FileText, filter: 'CONTRACT_PENDING', badge: badgeCounts.CONTRACT_PENDING },
            { name: 'Approved Contracts', path: '/contracts/approved', icon: CheckCircle, filter: 'CONTRACT_APPROVED', badge: badgeCounts.CONTRACT_APPROVED },
            { name: 'Contract Templates', path: '/contracts/templates', icon: FileText },
            { name: 'Contract History', path: '/contracts/history', icon: FileText },
          ]
        },
        {
          name: 'Regulatory Oversight',
          path: '/regulatory',
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
        {
          name: 'Customs Clearance',
          path: '/customs',
          icon: ShieldCheck,
          children: [
            { name: 'Pending Clearance', path: '/customs/pending', icon: ShieldCheck, filter: 'CUSTOMS_PENDING', badge: badgeCounts.CUSTOMS_PENDING },
            { name: 'Under Inspection', path: '/customs/inspection', icon: FileCheck, filter: 'CUSTOMS_INSPECTION', badge: badgeCounts.CUSTOMS_INSPECTION },
            { name: 'Cleared Exports', path: '/customs/cleared', icon: CheckCircle, filter: 'CUSTOMS_CLEARED', badge: badgeCounts.CUSTOMS_CLEARED },
            { name: 'Rejected/Held', path: '/customs/rejected', icon: X, filter: 'CUSTOMS_REJECTED', badge: badgeCounts.CUSTOMS_REJECTED },
          ]
        },
        {
          name: 'Documentation',
          path: '/documents',
          icon: FileText,
          children: [
            { name: 'Export Documentation', path: '/documents/export', icon: FileText },
            { name: 'Compliance Certificates', path: '/documents/compliance', icon: Award },
            { name: 'Customs Declarations', path: '/documents/declarations', icon: FileCheck },
            { name: 'Document Templates', path: '/documents/templates', icon: FileText },
          ]
        },
        {
          name: 'Border Control',
          path: '/border',
          icon: ShieldCheck,
          children: [
            { name: 'Border Checkpoints', path: '/border/checkpoints', icon: ShieldCheck },
            { name: 'Security Screening', path: '/border/security', icon: ShieldCheck },
            { name: 'Compliance Monitoring', path: '/border/compliance', icon: FileCheck },
            { name: 'Border Reports', path: '/border/reports', icon: FileText },
          ]
        },
        {
          name: 'Administration',
          path: '/admin',
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
        {
          name: 'Shipment Management',
          path: '/shipments',
          icon: Ship,
          children: [
            { name: 'Pending Shipments', path: '/shipments/pending', icon: Ship, filter: 'SHIPMENT_PENDING', badge: badgeCounts.SHIPMENT_PENDING },
            { name: 'Scheduled Shipments', path: '/shipments/scheduled', icon: Ship, filter: 'SHIPMENT_SCHEDULED', badge: badgeCounts.SHIPMENT_SCHEDULED },
            { name: 'In Transit', path: '/shipments/transit', icon: Ship, filter: 'SHIPMENT_TRANSIT', badge: badgeCounts.SHIPMENT_TRANSIT },
            { name: 'Delivered', path: '/shipments/delivered', icon: CheckCircle, filter: 'SHIPMENT_DELIVERED', badge: badgeCounts.SHIPMENT_DELIVERED },
          ]
        },
        {
          name: 'Vessel Operations',
          path: '/vessels',
          icon: Ship,
          children: [
            { name: 'Fleet Management', path: '/vessels/fleet', icon: Ship },
            { name: 'Vessel Scheduling', path: '/vessels/schedule', icon: Ship },
            { name: 'Maintenance', path: '/vessels/maintenance', icon: Settings },
            { name: 'Vessel Reports', path: '/vessels/reports', icon: FileText },
          ]
        },
        {
          name: 'Logistics Coordination',
          path: '/logistics',
          icon: Package,
          children: [
            { name: 'Route Planning', path: '/logistics/routes', icon: Package },
            { name: 'Cargo Tracking', path: '/logistics/tracking', icon: Package },
            { name: 'Port Operations', path: '/logistics/ports', icon: Building },
            { name: 'Delivery Confirmation', path: '/logistics/delivery', icon: CheckCircle },
          ]
        },
        {
          name: 'Administration',
          path: '/admin',
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

  // Route guard: when in Exporter Portal, restrict to exporter-related routes only
  useEffect(() => {
    const orgLower = (org || user?.organizationId || '').toLowerCase();
    const userRole = user?.role?.toLowerCase();
    if (orgLower.includes('exporter') && userRole === 'exporter') {
      const forbiddenPrefixes = [
        '/banking',
        '/fx',
        '/monetary',
        '/contracts',
        '/licenses',
        '/lots',
        '/trading',
        '/warehouse',
        '/vessels',
        '/logistics',
        '/customs',
        '/documents',
        '/admin',
        '/blockchain',
        '/gateway',
        '/regulatory',
        '/border'
      ];
      const path = location.pathname.toLowerCase();
      if (forbiddenPrefixes.some(prefix => path.startsWith(prefix))) {
        navigate('/exports', { replace: true });
      }
    }
  }, [location.pathname, org, user, navigate]);

  const isActive = (item: NavigationItem): boolean => {
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

  const handleNavClick = (item: NavigationItem): void => {
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

  // Calculate drawer width based on longest text
  const calculateDrawerWidth = useMemo(() => {
    if (collapsed) return collapsedWidth;
    // Use fixed width for professional, consistent layout
    return baseDrawerWidth;
  }, [collapsed]);

  const drawerWidth = calculateDrawerWidth;

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
            {/* Notification Center */}
            <NotificationCenter
              onPreferencesClick={() => setPreferencesOpen(true)}
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
                sx={{
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

          {/* Notification Preferences Dialog */}
          <NotificationPreferencesDialog
            open={preferencesOpen}
            onClose={() => setPreferencesOpen(false)}
          />
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
          drawerWidth={drawerWidth}
          open
        >
          {drawer}
        </StyledDrawer>
      )}

      {/* Main Content */}
      <Main open={!mobileOpen} collapsed={collapsed} drawerWidth={drawerWidth}>
        <ContentWrapper>
          <Outlet />
        </ContentWrapper>
      </Main>
    </Box>
  );
};

export default Layout;
