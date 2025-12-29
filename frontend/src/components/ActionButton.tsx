import { forwardRef, useState } from 'react';
import { styled } from '@mui/material/styles';
import {
  Button,
  ButtonProps,
  CircularProgress,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { AlertTriangle } from 'lucide-react';

interface ActionButtonProps extends Omit<ButtonProps, 'color'> {
  children?: React.ReactNode;
  icon?: React.ReactNode;
  tooltip?: string;
  loading?: boolean;
  confirmTitle?: string;
  confirmMessage?: string;
  onClick?: () => void;
  color?: 'primary' | 'secondary' | 'error' | 'success' | 'info' | 'warning' | 'inherit';
}

// Styled button with enhanced features
const StyledActionButton = styled(Button)<ButtonProps & { loading?: boolean }>(({ theme, variant, color, size, fullWidth }) => ({
  // Consistent sizing
  minWidth: 100,
  padding: theme.spacing(1, 2),
  fontWeight: 500,
  transition: theme.transitions.create(['all'], {
    duration: theme.transitions.duration.shortest,
  }),
  
  // Better mobile touch targets (44px minimum for iOS)
  [theme.breakpoints.down('sm')]: {
    minHeight: 44,
    fontSize: '0.9rem',
    padding: theme.spacing(1.25, 2),
  },
  
  // Loading state
  '&.loading': {
    pointerEvents: 'none',
    opacity: 0.7,
  },

  // Enhanced hover effects
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: theme.shadows[2],
  },

  '&:active': {
    transform: 'translateY(0)',
  },

  // Full width
  ...(fullWidth && {
    width: '100%',
  }),

  // Size variants
  ...(size === 'small' && {
    padding: theme.spacing(0.75, 2),
    fontSize: '0.875rem',
  }),
  ...(size === 'medium' && {
    padding: theme.spacing(1.25, 3),
    fontSize: '1rem',
  }),
  ...(size === 'large' && {
    padding: theme.spacing(2.25, 4),
    fontSize: '1.125rem',
  }),

  // Gradient backgrounds for primary actions
  ...(variant === 'contained' && color === 'primary' && {
    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
    '&:hover': {
      background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
    },
  }),

  // Error/destructive actions
  ...(variant === 'contained' && color === 'error' && {
    background: `linear-gradient(135deg, ${theme.palette.error.dark} 0%, ${theme.palette.error.main} 100%)`,
    '&:hover': {
      background: `linear-gradient(135deg, ${theme.palette.error.dark} 0%, ${theme.palette.error.light} 100%)`,
    },
  }),

  // Success actions
  ...(variant === 'contained' && color === 'success' && {
    background: `linear-gradient(135deg, ${theme.palette.success.dark} 0%, ${theme.palette.success.main} 100%)`,
    '&:hover': {
      background: `linear-gradient(135deg, ${theme.palette.success.dark} 0%, ${theme.palette.success.light} 100%)`,
    },
  }),
}));

// Loading spinner component
const LoadingSpinner = styled(CircularProgress)(({ theme }) => ({
  color: 'inherit',
}));

/**
 * Enhanced Action Button Component
 * 
 * Features:
 * - Loading states with spinner
 * - Confirmation dialogs for destructive actions
 * - Tooltips for better UX
 * - Mobile-optimized touch targets
 * - Gradient backgrounds for primary actions
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Button text/content
 * @param {React.ReactNode} props.icon - Icon component to display
 * @param {string} props.tooltip - Tooltip text
 * @param {boolean} props.loading - Loading state
 * @param {string} props.confirmTitle - Confirmation dialog title
 * @param {string} props.confirmMessage - Confirmation dialog message
 * @param {Function} props.onClick - Click handler
 * @param {string} props.variant - Button variant (contained, outlined, text)
 * @param {string} props.color - Button color (primary, secondary, error, success, etc.)
 * @param {string} props.size - Button size (small, medium, large)
 * @param {boolean} props.fullWidth - Full width button
 * @param {boolean} props.disabled - Disabled state
 */
const ActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(({
  children,
  icon,
  tooltip,
  loading = false,
  confirmTitle,
  confirmMessage,
  onClick,
  variant = 'contained',
  color = 'primary',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  ...props
}, ref) => {
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Map old variant names to MUI variants
  const muiVariant = {
    primary: 'contained',
    secondary: 'contained',
    outline: 'outlined',
    ghost: 'text',
    danger: 'contained',
    success: 'contained',
  }[variant] || variant;

  // Map old variant names to MUI colors
  const muiColor = {
    primary: 'primary',
    secondary: 'secondary',
    outline: 'primary',
    ghost: 'primary',
    danger: 'error',
    success: 'success',
  }[variant] || color;

  const handleClick = () => {
    if (confirmMessage || confirmTitle) {
      setConfirmOpen(true);
    } else if (onClick) {
      onClick();
    }
  };

  const handleConfirm = () => {
    setConfirmOpen(false);
    if (onClick) {
      onClick();
    }
  };

  const handleCancel = () => {
    setConfirmOpen(false);
  };

  const button = (
    <StyledActionButton
      ref={ref}
      variant={muiVariant}
      color={muiColor}
      size={size}
      fullWidth={fullWidth}
      startIcon={!loading && icon}
      onClick={handleClick}
      disabled={disabled || loading}
      className={loading ? 'loading' : ''}
      {...props}
    >
      {loading ? (
        <>
          <LoadingSpinner size={size === 'small' ? 16 : size === 'large' ? 24 : 20} />
          <span style={{ marginLeft: 8 }}>
            {typeof children === 'string' ? `${children}...` : children}
          </span>
        </>
      ) : (
        children
      )}
    </StyledActionButton>
  );

  return (
    <>
      {tooltip && !disabled ? (
        <Tooltip title={tooltip} arrow placement="top">
          {button}
        </Tooltip>
      ) : (
        button
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmOpen}
        onClose={handleCancel}
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        <DialogTitle id="confirm-dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {color === 'error' && <AlertTriangle size={20} color="#d32f2f" />}
          {confirmTitle || 'Confirm Action'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-dialog-description">
            {confirmMessage || 'Are you sure you want to perform this action?'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleConfirm} color={color} variant="contained" autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
});

ActionButton.displayName = 'ActionButton';

// Export variants for convenience
export const PrimaryButton = (props: ActionButtonProps) => (
  <ActionButton variant="contained" color="primary" {...props} />
);

export const SecondaryButton = (props: ActionButtonProps) => (
  <ActionButton variant="outlined" color="primary" {...props} />
);

export const DangerButton = (props) => (
  <ActionButton 
    variant="contained" 
    color="error" 
    confirmTitle="Confirm Deletion"
    confirmMessage="This action cannot be undone. Are you sure you want to continue?"
    {...props} 
  />
);

export const SuccessButton = (props) => (
  <ActionButton variant="contained" color="success" {...props} />
);

export const TextButton = (props) => (
  <ActionButton variant="text" color="primary" {...props} />
);

export default ActionButton;
