import { Box, Typography, Button, Stack } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
    Package,
    FileText,
    Search,
    Inbox,
    AlertCircle,
    CheckCircle,
    XCircle,
    Clock,
    Users,
    Database,
    TrendingUp,
    LucideIcon,
} from 'lucide-react';
import { spacing, borderRadius, fadeIn } from '../utils/designSystem';

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
        variant?: 'contained' | 'outlined' | 'text';
    };
    type?: 'default' | 'search' | 'error' | 'success' | 'info' | 'warning';
    size?: 'small' | 'medium' | 'large';
}

/**
 * Professional Empty State Component
 * Shows when there's no data to display with helpful messaging and actions
 */
const EmptyState = ({
    icon: CustomIcon,
    title,
    description,
    action,
    type = 'default',
    size = 'medium',
}: EmptyStateProps) => {
    const theme = useTheme();

    // Icon mapping based on type
    const getIcon = () => {
        if (CustomIcon) return CustomIcon;

        switch (type) {
            case 'search':
                return Search;
            case 'error':
                return XCircle;
            case 'success':
                return CheckCircle;
            case 'warning':
                return AlertCircle;
            case 'info':
                return Clock;
            default:
                return Inbox;
        }
    };

    // Color mapping based on type
    const getColor = () => {
        switch (type) {
            case 'error':
                return theme.palette.error.main;
            case 'success':
                return theme.palette.success.main;
            case 'warning':
                return theme.palette.warning.main;
            case 'info':
                return theme.palette.info.main;
            default:
                return theme.palette.text.disabled;
        }
    };

    // Size mapping
    const getSizes = () => {
        switch (size) {
            case 'small':
                return { icon: 40, padding: spacing.xl };
            case 'large':
                return { icon: 80, padding: spacing.xxxl };
            default:
                return { icon: 64, padding: spacing.xxl };
        }
    };

    const Icon = getIcon();
    const color = getColor();
    const sizes = getSizes();

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                py: sizes.padding,
                px: spacing.lg,
                ...fadeIn,
            }}
        >
            {/* Icon with background circle */}
            <Box
                sx={{
                    width: sizes.icon + 32,
                    height: sizes.icon + 32,
                    borderRadius: borderRadius.round,
                    backgroundColor: `${color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: spacing.lg,
                    position: 'relative',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        inset: -8,
                        borderRadius: borderRadius.round,
                        background: `${color}08`,
                    },
                }}
            >
                <Icon size={sizes.icon} color={color} strokeWidth={1.5} />
            </Box>

            {/* Title */}
            <Typography
                variant={size === 'large' ? 'h4' : size === 'small' ? 'h6' : 'h5'}
                sx={{
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    mb: spacing.sm,
                    letterSpacing: '-0.025em',
                }}
            >
                {title}
            </Typography>

            {/* Description */}
            {description && (
                <Typography
                    variant="body2"
                    sx={{
                        color: theme.palette.text.secondary,
                        maxWidth: 480,
                        mb: action ? spacing.lg : 0,
                        lineHeight: 1.6,
                    }}
                >
                    {description}
                </Typography>
            )}

            {/* Action button */}
            {action && (
                <Button
                    variant={action.variant || 'contained'}
                    onClick={action.onClick}
                    sx={{
                        mt: spacing.md,
                        borderRadius: borderRadius.md,
                        textTransform: 'none',
                        fontWeight: 600,
                        px: spacing.lg,
                        py: spacing.sm,
                    }}
                >
                    {action.label}
                </Button>
            )}
        </Box>
    );
};

/**
 * Preset empty states for common scenarios
 */
export const NoDataEmptyState = ({ onAction }: { onAction?: () => void }) => (
    <EmptyState
        icon={Database}
        title="No Data Available"
        description="There's no data to display at the moment. Try adjusting your filters or check back later."
        type="default"
    />
);

export const NoSearchResultsEmptyState = ({ searchTerm, onClear }: { searchTerm?: string; onClear?: () => void }) => (
    <EmptyState
        icon={Search}
        title="No Results Found"
        description={
            searchTerm
                ? `We couldn't find any results for "${searchTerm}". Try different keywords or clear your search.`
                : "We couldn't find any results. Try different search terms."
        }
        type="search"
        action={onClear ? { label: 'Clear Search', onClick: onClear, variant: 'outlined' } : undefined}
    />
);

export const NoExportsEmptyState = ({ onCreate }: { onCreate?: () => void }) => (
    <EmptyState
        icon={Package}
        title="No Export Requests Yet"
        description="Get started by creating your first export request. Track your coffee exports from creation to delivery."
        type="info"
        action={onCreate ? { label: 'Create Export Request', onClick: onCreate } : undefined}
        size="large"
    />
);

export const NoPendingItemsEmptyState = () => (
    <EmptyState
        icon={CheckCircle}
        title="All Caught Up!"
        description="You have no pending items at the moment. Great job staying on top of things!"
        type="success"
    />
);

export const ErrorEmptyState = ({ onRetry }: { onRetry?: () => void }) => (
    <EmptyState
        icon={AlertCircle}
        title="Something Went Wrong"
        description="We encountered an error while loading the data. Please try again."
        type="error"
        action={onRetry ? { label: 'Try Again', onClick: onRetry, variant: 'contained' } : undefined}
    />
);

export default EmptyState;
