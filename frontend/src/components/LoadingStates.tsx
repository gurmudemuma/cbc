/**
 * Loading States - Skeleton screens, spinners, and progress indicators
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Skeleton,
  CircularProgress,
  LinearProgress,
  Stack,
  useTheme,
  alpha,
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Skeleton Loader
const SkeletonContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
}));

interface SkeletonLoaderProps {
  count?: number;
  height?: number;
  width?: string | number;
  variant?: 'text' | 'rectangular' | 'circular';
  animation?: 'pulse' | 'wave';
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  count = 3,
  height = 60,
  width = '100%',
  variant = 'rectangular',
  animation = 'pulse',
}) => {
  return (
    <SkeletonContainer>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          variant={variant}
          width={width}
          height={height}
          animation={animation}
          sx={{ borderRadius: 2 }}
        />
      ))}
    </SkeletonContainer>
  );
};

// Loading Spinner
interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  thickness?: number;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = 'primary',
  thickness = 4,
}) => {
  const sizeMap = {
    small: 32,
    medium: 48,
    large: 64,
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    >
      <CircularProgress
        size={sizeMap[size]}
        color={color}
        thickness={thickness}
      />
    </motion.div>
  );
};

// Shimmer Effect
const ShimmerContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  overflow: 'hidden',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.action.hover, 0.5),
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    transform: 'translateX(-100%)',
    background: `linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0,
      rgba(255, 255, 255, 0.2) 20%,
      rgba(255, 255, 255, 0.5) 60%,
      rgba(255, 255, 255, 0)
    )`,
    animation: 'shimmer 2s infinite',
  },
  '@keyframes shimmer': {
    '100%': {
      transform: 'translateX(100%)',
    },
  },
}));

interface ShimmerProps {
  width?: string | number;
  height?: string | number;
  count?: number;
}

export const Shimmer: React.FC<ShimmerProps> = ({
  width = '100%',
  height = 20,
  count = 1,
}) => {
  return (
    <Stack spacing={1}>
      {Array.from({ length: count }).map((_, i) => (
        <ShimmerContainer key={i} sx={{ width, height }} />
      ))}
    </Stack>
  );
};

// Progress Indicator
interface ProgressIndicatorProps {
  value: number;
  label?: string;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  showLabel?: boolean;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  value,
  label,
  color = 'primary',
  showLabel = true,
}) => {
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        {label && <Box sx={{ fontSize: '0.875rem', fontWeight: 500 }}>{label}</Box>}
        {showLabel && <Box sx={{ fontSize: '0.875rem', fontWeight: 600 }}>{value}%</Box>}
      </Stack>
      <LinearProgress
        variant="determinate"
        value={value}
        color={color}
        sx={{
          height: 8,
          borderRadius: 4,
          backgroundColor: alpha('#000', 0.1),
        }}
      />
    </Box>
  );
};

// Pulse Animation
const PulseBox = styled(motion.div)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
}));

interface PulseProps {
  width?: string | number;
  height?: string | number;
  children?: React.ReactNode;
}

export const Pulse: React.FC<PulseProps> = ({ width = '100%', height = 100, children }) => {
  return (
    <PulseBox
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 2, repeat: Infinity }}
      style={{ width, height }}
    >
      {children}
    </PulseBox>
  );
};

// Table Skeleton
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 5,
}) => {
  return (
    <Stack spacing={1}>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <Stack key={rowIdx} direction="row" spacing={1}>
          {Array.from({ length: columns }).map((_, colIdx) => (
            <Skeleton
              key={colIdx}
              variant="rectangular"
              width="100%"
              height={40}
              sx={{ borderRadius: 1 }}
            />
          ))}
        </Stack>
      ))}
    </Stack>
  );
};

// Card Skeleton
export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <Stack spacing={2}>
      {Array.from({ length: count }).map((_, i) => (
        <Box key={i} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <Skeleton variant="text" width="60%" height={24} sx={{ mb: 1 }} />
          <Skeleton variant="text" width="100%" height={16} sx={{ mb: 1 }} />
          <Skeleton variant="text" width="80%" height={16} />
        </Box>
      ))}
    </Stack>
  );
};

export default {
  SkeletonLoader,
  LoadingSpinner,
  Shimmer,
  ProgressIndicator,
  Pulse,
  TableSkeleton,
  CardSkeleton,
};
