import { Box, Breadcrumbs as MuiBreadcrumbs, Typography, Link } from '@mui/material';
import { useLocation, Link as RouterLink } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { spacing, borderRadius, fadeIn } from '../utils/designSystem';
import { useTheme } from '@mui/material/styles';

interface BreadcrumbItem {
    label: string;
    path?: string;
    icon?: React.ReactNode;
}

interface BreadcrumbsProps {
    /**
     * Custom breadcrumb items (overrides auto-generated)
     */
    items?: BreadcrumbItem[];
    /**
     * Show home icon
     * @default true
     */
    showHome?: boolean;
    /**
     * Max items to display before collapsing
     * @default 4
     */
    maxItems?: number;
}

/**
 * Professional Breadcrumb Navigation Component
 * 
 * Features:
 * - Auto-generates breadcrumbs from current route
 * - Custom breadcrumb items support
 * - Home icon navigation
 * - Smooth hover effects
 * - Responsive collapse for long paths
 */
const Breadcrumbs = ({ items, showHome = true, maxItems = 4 }: BreadcrumbsProps) => {
    const location = useLocation();
    const theme = useTheme();

    // Auto-generate breadcrumbs from path if items not provided
    const getBreadcrumbs = (): BreadcrumbItem[] => {
        if (items) return items;

        const pathnames = location.pathname.split('/').filter((x) => x);

        const breadcrumbs: BreadcrumbItem[] = [];

        // Add home
        if (showHome) {
            breadcrumbs.push({
                label: 'Home',
                path: '/',
                icon: <Home size={16} />,
            });
        }

        // Add path segments
        pathnames.forEach((segment, index) => {
            const path = `/${pathnames.slice(0, index + 1).join('/')}`;
            const label = segment
                .split('-')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');

            breadcrumbs.push({
                label,
                path: index === pathnames.length - 1 ? undefined : path, // Last item is not a link
            });
        });

        return breadcrumbs;
    };

    const breadcrumbs = getBreadcrumbs();

    if (breadcrumbs.length <= 1) {
        return null; // Don't show breadcrumbs on home page
    }

    return (
        <Box
            sx={{
                mb: spacing.lg,
                ...fadeIn,
            }}
        >
            <MuiBreadcrumbs
                maxItems={maxItems}
                separator={<ChevronRight size={16} color={theme.palette.text.disabled} />}
                aria-label="breadcrumb"
                sx={{
                    '& .MuiBreadcrumbs-separator': {
                        mx: spacing.xs,
                    },
                }}
            >
                {breadcrumbs.map((crumb, index) => {
                    const isLast = index === breadcrumbs.length - 1;

                    if (isLast) {
                        return (
                            <Box
                                key={crumb.label}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: spacing.xs,
                                }}
                            >
                                {crumb.icon}
                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: theme.palette.text.primary,
                                        fontWeight: 600,
                                    }}
                                >
                                    {crumb.label}
                                </Typography>
                            </Box>
                        );
                    }

                    return (
                        <Link
                            key={crumb.label}
                            component={RouterLink}
                            to={crumb.path || '#'}
                            underline="hover"
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: spacing.xs,
                                color: theme.palette.text.secondary,
                                textDecoration: 'none',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                padding: `${spacing.xs}px ${spacing.sm}px`,
                                borderRadius: borderRadius.sm,
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    color: theme.palette.primary.main,
                                    backgroundColor: theme.palette.action.hover,
                                    textDecoration: 'none',
                                },
                            }}
                        >
                            {crumb.icon}
                            {crumb.label}
                        </Link>
                    );
                })}
            </MuiBreadcrumbs>
        </Box>
    );
};

export default Breadcrumbs;
