import { Snackbar, Alert, AlertTitle } from '@mui/material';
import { CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface ToastProps {
  open: boolean;
  onClose: () => void;
  severity: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  autoHideDuration?: number;
}

const iconMap = {
  success: <span><CheckCircle size={20} /></span>,
  error: <span><AlertCircle size={20} /></span>,
  warning: <span><AlertTriangle size={20} /></span>,
  info: <span><Info size={20} /></span>,
};

const Toast = ({
  open,
  onClose,
  severity,
  title,
  message,
  autoHideDuration = 6000,
}: ToastProps) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant="filled"
        icon={iconMap[severity]}
        sx={{
          minWidth: 300,
          boxShadow: 3,
        }}
      >
        {title && <AlertTitle>{title}</AlertTitle>}
        {message}
      </Alert>
    </Snackbar>
  );
};

export default Toast;
