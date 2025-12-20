/**
 * Modern UI Kit - Reusable Components for Professional Design
 * Provides modern, accessible, and responsive UI components
 */

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Chip,
  LinearProgress,
  useTheme,
  alpha,
  styled,
  Tooltip,
  IconButton,
} from '@mui/material';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock } from 'lucide-react';

// ============================================================================
// STAT CARD - Modern Statistics Display
// ============================================================================

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  onClick?: () => void;
}

export const ModernStatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'primary',
  onClick,
}) => {
  const theme = useTheme();

  const colorMap = {
    primary: theme.palette.primary.main,
    secondary: theme.palette.secondary.main,
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        onClick={onClick}
        sx={{
          cursor: onClick ? 'pointer' : 'default',
          height: '100%',
          background: `linear-gradient(135deg, ${alpha(colorMap[color], 0.05)}, ${alpha(colorMap[color], 0.02)})`,
          border: `1px solid ${alpha(colorMap[color], 0.1)}`,
          transition: 'all 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          '&:hover': {
            boxShadow: `0 12px 24px ${alpha(colorMap[color], 0.15)}`,
            borderColor: alpha(colorMap[color], 0.2),
          },
        }}
      >
        <CardContent>
          <Stack spacing={2}>
            {/* Header with Icon */}
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  {title}
                </Typography>
              </Box>
              {icon && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    background: alpha(colorMap[color], 0.1),
                    color: colorMap[color],
                  }}
                >
                  {icon}
                </Box>
              )}
            </Stack>

            {/* Value */}
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: colorMap[color],
                  mb: 0.5,
                }}
              >
                {value}
              </Typography>
              {subtitle && (
                <Typography variant="caption" color="text.secondary">
                  {subtitle}
                </Typography>
              )}
            </Box>

            {/* Trend */}
            {trend && (
              <Stack direction="row" alignItems="center" spacing={0.5}>
                {trend.direction === 'up' && (
                  <>
                    <TrendingUp size={14} style={{ color: '#10B981' }} />
                    <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 600 }}>
                      +{trend.value}%
                    </Typography>
                  </>
                )}
                {trend.direction === 'down' && (
                  <>
                    <TrendingDown size={14} style={{ color: '#EF4444' }} />
                    <Typography variant="caption" sx={{ color: '#EF4444', fontWeight: 600 }}>
                      -{trend.value}%
                    </Typography>
                  </>
                )}
                {trend.direction === 'neutral' && (
                  <Typography variant="caption" color="text.secondary">
                    No change
                  </Typography>
                )}
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// ============================================================================
// PROGRESS CARD - Modern Progress Display
// ============================================================================

interface ProgressCardProps {
  title: string;
  value: number;
  max?: number;
  label?: string;
  color?: 'success' | 'warning' | 'error' | 'info' | 'primary';
  showPercentage?: boolean;
}

export const ModernProgressCard: React.FC<ProgressCardProps> = ({
  title,
  value,
  max = 100,
  label,
  color = 'primary',
  showPercentage = true,
}) => {
  const theme = useTheme();
  const percentage = (value / max) * 100;

  const colorMap = {
    primary: theme.palette.primary.main,
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  };

  return (
    <Card
      sx={{
        background: `linear-gradient(135deg, ${alpha(colorMap[color], 0.05)}, ${alpha(colorMap[color], 0.02)})`,
        border: `1px solid ${alpha(colorMap[color], 0.1)}`,
      }}
    >
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
            {showPercentage && (
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  color: colorMap[color],
                  background: alpha(colorMap[color], 0.1),
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1,
                }}
              >
                {Math.round(percentage)}%
              </Typography>
            )}
          </Stack>

          <Box>
            <LinearProgress
              variant="determinate"
              value={percentage}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: alpha(colorMap[color], 0.1),
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  background: `linear-gradient(90deg, ${colorMap[color]}, ${alpha(colorMap[color], 0.7)})`,
                },
              }}
            />
          </Box>

          {label && (
            <Typography variant="caption" color="text.secondary">
              {label}
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// STATUS BADGE - Modern Status Indicator
// ============================================================================

interface StatusBadgeProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'pending';
  label: string;
  size?: 'small' | 'medium' | 'large';
}

export const ModernStatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'medium',
}) => {
  const statusConfig = {
    success: {
      bg: 'rgba(16, 185, 129, 0.1)',
      color: '#10B981',
      icon: <CheckCircle size={14} />,
    },
    warning: {
      bg: 'rgba(245, 158, 11, 0.1)',
      color: '#F59E0B',
      icon: <AlertCircle size={14} />,
    },
    error: {
      bg: 'rgba(239, 68, 68, 0.1)',
      color: '#EF4444',
      icon: <AlertCircle size={14} />,
    },
    info: {
      bg: 'rgba(59, 130, 246, 0.1)',
      color: '#3B82F6',
      icon: <Clock size={14} />,
    },
    pending: {
      bg: 'rgba(107, 114, 128, 0.1)',
      color: '#6B7280',
      icon: <Clock size={14} />,
    },
  };

  const config = statusConfig[status];

  const sizeMap = {
    small: { px: 1, py: 0.5, fontSize: '0.75rem' },
    medium: { px: 1.5, py: 0.75, fontSize: '0.875rem' },
    large: { px: 2, py: 1, fontSize: '1rem' },
  };

  const sizeConfig = sizeMap[size];

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        px: sizeConfig.px,
        py: sizeConfig.py,
        borderRadius: 2,
        background: config.bg,
        color: config.color,
        fontWeight: 600,
        fontSize: sizeConfig.fontSize,
        transition: 'all 200ms ease',
        '&:hover': {
          transform: 'scale(1.05)',
        },
      }}
    >
      {config.icon}
      {label}
    </Box>
  );
};

// ============================================================================
// EMPTY STATE - Modern Empty State Display
// ============================================================================

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const ModernEmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 3,
        textAlign: 'center',
      }}
    >
      {icon && (
        <Box sx={{ mb: 2, opacity: 0.5 }}>
          {icon}
        </Box>
      )}
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
          {description}
        </Typography>
      )}
      {action && (
        <Button variant="contained" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </Box>
  );
};

// ============================================================================
// FEATURE CARD - Modern Feature Showcase
// ============================================================================

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick?: () => void;
}

export const ModernFeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  onClick,
}) => {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        onClick={onClick}
        sx={{
          cursor: onClick ? 'pointer' : 'default',
          height: '100%',
          transition: 'all 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          '&:hover': {
            boxShadow: '0 12px 24px rgba(0, 0, 0, 0.1)',
          },
        }}
      >
        <CardContent>
          <Stack spacing={2}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 56,
                height: 56,
                borderRadius: 2,
                background: 'linear-gradient(135deg, rgba(66, 66, 66, 0.1), rgba(66, 66, 66, 0.05))',
              }}
            >
              {icon}
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                {title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {description}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// ============================================================================
// METRIC DISPLAY - Modern Metric Showcase
// ============================================================================

interface MetricDisplayProps {
  label: string;
  value: string | number;
  unit?: string;
  change?: number;
  icon?: React.ReactNode;
}

export const ModernMetricDisplay: React.FC<MetricDisplayProps> = ({
  label,
  value,
  unit,
  change,
  icon,
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        background: alpha(theme.palette.primary.main, 0.05),
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
      }}
    >
      <Stack spacing={1}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            {label}
          </Typography>
          {icon && <Box sx={{ opacity: 0.6 }}>{icon}</Box>}
        </Stack>
        <Stack direction="row" alignItems="baseline" spacing={0.5}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {value}
          </Typography>
          {unit && (
            <Typography variant="caption" color="text.secondary">
              {unit}
            </Typography>
          )}
        </Stack>
        {change !== undefined && (
          <Stack direction="row" alignItems="center" spacing={0.5}>
            {change > 0 ? (
              <>
                <TrendingUp size={12} style={{ color: '#10B981' }} />
                <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 600 }}>
                  +{change}%
                </Typography>
              </>
            ) : (
              <>
                <TrendingDown size={12} style={{ color: '#EF4444' }} />
                <Typography variant="caption" sx={{ color: '#EF4444', fontWeight: 600 }}>
                  {change}%
                </Typography>
              </>
            )}
          </Stack>
        )}
      </Stack>
    </Box>
  );
};

// ============================================================================
// SECTION HEADER - Modern Section Header
// ============================================================================

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const ModernSectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  action,
}) => {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="flex-start"
      sx={{ mb: 3 }}
    >
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: subtitle ? 0.5 : 0 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      {action && <Box>{action}</Box>}
    </Stack>
  );
};

export default {
  ModernStatCard,
  ModernProgressCard,
  ModernStatusBadge,
  ModernEmptyState,
  ModernFeatureCard,
  ModernMetricDisplay,
  ModernSectionHeader,
};
