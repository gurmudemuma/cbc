import { forwardRef, useState, MouseEvent } from 'react';
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

interface ActionButtonProps extends Omit<ButtonProps, 'variant' | 'color'> {
  children: React.ReactNode;
  icon?: React.ReactNode;
  tooltip?: string;
  loading?: boolean;
  confirmTitle?: string;
  confirmMessage?: string;
  onClick?: (event?: MouseEvent<HTMLButtonElement>) => void;
  variant?: 'contained' | 'outlined' | 'text' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  color?: 'primary' | 'secondary' | 'error' | 'success' | 'info' | 'warning';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  disabled?: boolean;
}

// Styled button with enhanced features
const StyledActionButton = styled(Button, {
  shouldForwardProp: (prop: string) => !['loading'].includes(prop),
})<{ loading?: boolean }>(({ theme }) => ({
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
  '&.fullWidth': {
    width: '100%',
  },

  // Size variants
  '&.size-small': {
    padding: theme.spacing(0.75, 2),
    fontSize: '0.875rem',
  },
  '&.size-medium': {
    padding: theme.spacing(1.25, 3),
    fontSize: '1rem',
  },
  '&.size-large': {
    padding: theme.spacing(2.25, 4),
    fontSize: '1.125rem',
  },

  // Gradient backgrounds for primary actions
  '&.variant-contained.color-primary': {
    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
    '&:hover': {
      background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
    },
  },

  // Error/destructive actions
  '&.variant-contained.color-error': {
    background: `linear-gradient(135deg, ${theme.palette.error.dark} 0%, ${theme.palette.error.main} 100%)`,
    '&:hover': {
      background: `linear-gradient(135deg, ${theme.palette.error.dark} 0%, ${theme.palette.error.light} 100%)`,
    },
  },

  // Success actions
  '&.variant-contained.color-success': {
    background: `linear-gradient(135deg, ${theme.palette.success.dark} 0%, ${theme.palette.success.main} 100%)`,
    '&:hover': {
      background: `linear-gradient(135deg, ${theme.palette.success.dark} 0%, ${theme.palette.success.light} 100%)`,
    },
  },
}));

// Loading spinner component
const LoadingSpinner = styled(CircularProgress)(() => ({
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
  const muiVariant: 'contained' | 'outlined' | 'text' = (
    variant === 'primary' || variant === 'secondary' || variant === 'danger' || variant === 'success'
      ? 'contained'
      : variant === 'outline'
        ? 'outlined'
        : variant === 'ghost'
          ? 'text'
          : variant
  ) as 'contained' | 'outlined' | 'text';

  // Map old variant names to MUI colors
  const muiColor: 'primary' | 'secondary' | 'error' | 'success' | 'info' | 'warning' = (
    variant === 'danger'
      ? 'error'
      : variant === 'success'
        ? 'success'
        : variant === 'outline' || variant === 'ghost'
          ? 'primary'
          : color
  ) as 'primary' | 'secondary' | 'error' | 'success' | 'info' | 'warning';

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (confirmMessage || confirmTitle) {
      setConfirmOpen(true);
    } else if (onClick) {
      onClick(event);
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
      startIcon={!loading && icon ? icon : undefined}
      onClick={handleClick}
      disabled={disabled || loading}
      className={[
        loading ? 'loading' : '',
        fullWidth ? 'fullWidth' : '',
        `size-${size}`,
        `variant-${muiVariant}`,
        `color-${muiColor}`,
      ].filter(Boolean).join(' ')}
      loading={loading}
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
export const PrimaryButton = forwardRef<HTMLButtonElement, Omit<ActionButtonProps, 'variant' | 'color'>>((props, ref) => (
  <ActionButton ref={ref} variant="contained" color="primary" {...props} />
));
PrimaryButton.displayName = 'PrimaryButton';

export const SecondaryButton = forwardRef<HTMLButtonElement, Omit<ActionButtonProps, 'variant' | 'color'>>((props, ref) => (
  <ActionButton ref={ref} variant="outlined" color="primary" {...props} />
));
SecondaryButton.displayName = 'SecondaryButton';

export const DangerButton = forwardRef<HTMLButtonElement, Omit<ActionButtonProps, 'variant' | 'color' | 'confirmTitle' | 'confirmMessage'>>((props, ref) => (
  <ActionButton
    ref={ref}
    variant="contained"
    color="error"
    confirmTitle="Confirm Deletion"
    confirmMessage="This action cannot be undone. Are you sure you want to continue?"
    {...props}
  />
));
DangerButton.displayName = 'DangerButton';

export const SuccessButton = forwardRef<HTMLButtonElement, Omit<ActionButtonProps, 'variant' | 'color'>>((props, ref) => (
  <ActionButton ref={ref} variant="contained" color="success" {...props} />
));
SuccessButton.displayName = 'SuccessButton';

export const TextButton = forwardRef<HTMLButtonElement, Omit<ActionButtonProps, 'variant' | 'color'>>((props, ref) => (
  <ActionButton ref={ref} variant="text" color="primary" {...props} />
));
TextButton.displayName = 'TextButton';

export default ActionButton;
