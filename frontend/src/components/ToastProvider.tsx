import { Snackbar, Alert, AlertProps, Slide, SlideProps } from '@mui/material';
import { SyntheticEvent, createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';
import { borderRadius, spacing, slideInRight } from '../utils/designSystem';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType, duration?: number) => void;
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * Hook to access toast notifications
 */
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};

function SlideTransition(props: SlideProps) {
    return <Slide {...props} direction="left" />;
}

interface ToastProviderProps {
    children: ReactNode;
}

/**
 * Professional Toast Notification Provider
 * 
 * Features:
 * - Smooth slide-in animations
 * - Auto-dismiss with configurable duration
 * - Multiple toast types (success, error, warning, info)
 * - Custom icons for each type
 * - Stacking support
 */
export const ToastProvider = ({ children }: ToastProviderProps) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info', duration = 6000) => {
        const id = `toast-${Date.now()}-${Math.random()}`;
        const newToast: Toast = { id, message, type, duration };

        setToasts((prev) => [...prev, newToast]);

        // Auto-dismiss
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
    }, []);

    const success = useCallback((message: string, duration?: number) => {
        showToast(message, 'success', duration);
    }, [showToast]);

    const error = useCallback((message: string, duration?: number) => {
        showToast(message, 'error', duration);
    }, [showToast]);

    const warning = useCallback((message: string, duration?: number) => {
        showToast(message, 'warning', duration);
    }, [showToast]);

    const info = useCallback((message: string, duration?: number) => {
        showToast(message, 'info', duration);
    }, [showToast]);

    const handleClose = (id: string) => (_event?: SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    const getIcon = (type: ToastType) => {
        const iconProps = { size: 20, strokeWidth: 2.5 };
        switch (type) {
            case 'success':
                return <CheckCircle {...iconProps} />;
            case 'error':
                return <XCircle {...iconProps} />;
            case 'warning':
                return <AlertCircle {...iconProps} />;
            case 'info':
                return <Info {...iconProps} />;
        }
    };

    const getSeverity = (type: ToastType): AlertProps['severity'] => {
        return type;
    };

    return (
        <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
            {children}
            {toasts.map((toast, index) => (
                <Snackbar
                    key={toast.id}
                    open={true}
                    autoHideDuration={toast.duration}
                    onClose={handleClose(toast.id)}
                    TransitionComponent={SlideTransition}
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                    sx={{
                        top: `${24 + index * 72}px !important`,
                        ...slideInRight,
                    }}
                >
                    <Alert
                        onClose={handleClose(toast.id)}
                        severity={getSeverity(toast.type)}
                        icon={getIcon(toast.type)}
                        variant="filled"
                        sx={{
                            width: '100%',
                            minWidth: 300,
                            maxWidth: 500,
                            borderRadius: borderRadius.md,
                            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                            fontWeight: 500,
                            '& .MuiAlert-icon': {
                                alignItems: 'center',
                            },
                            '& .MuiAlert-message': {
                                padding: `${spacing.xs}px 0`,
                            },
                        }}
                    >
                        {toast.message}
                    </Alert>
                </Snackbar>
            ))}
        </ToastContext.Provider>
    );
};

export default ToastProvider;
