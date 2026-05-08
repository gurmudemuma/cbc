import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Box, useTheme } from '@mui/material';

/**
 * Page transition animations
 */
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: 'easeIn',
    },
  },
};

/**
 * Stagger container for animating children
 */
export const staggerContainerVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

/**
 * Stagger item for children of stagger container
 */
export const staggerItemVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: 'easeIn',
    },
  },
};

/**
 * Slide in from left animation
 */
export const slideInLeftVariants: Variants = {
  initial: { opacity: 0, x: -100 },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    x: -100,
    transition: {
      duration: 0.3,
      ease: 'easeIn',
    },
  },
};

/**
 * Slide in from right animation
 */
export const slideInRightVariants: Variants = {
  initial: { opacity: 0, x: 100 },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    x: 100,
    transition: {
      duration: 0.3,
      ease: 'easeIn',
    },
  },
};

/**
 * Scale and fade animation
 */
export const scaleInVariants: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: {
      duration: 0.3,
      ease: 'easeIn',
    },
  },
};

/**
 * Bounce animation
 */
export const bounceVariants: Variants = {
  initial: { y: 0 },
  animate: {
    y: [-10, 0, -5, 0],
    transition: {
      duration: 0.6,
      ease: 'easeInOut',
      repeat: Infinity,
      repeatDelay: 2,
    },
  },
};

/**
 * Pulse animation
 */
export const pulseVariants: Variants = {
  animate: {
    opacity: [1, 0.5, 1],
    transition: {
      duration: 2,
      ease: 'easeInOut',
      repeat: Infinity,
    },
  },
};

/**
 * Rotate animation
 */
export const rotateVariants: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 2,
      ease: 'linear',
      repeat: Infinity,
    },
  },
};

/**
 * Shimmer loading animation
 */
export const shimmerVariants: Variants = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
    transition: {
      duration: 2,
      ease: 'linear',
      repeat: Infinity,
    },
  },
};

/**
 * Animated page wrapper
 */
export interface AnimatedPageProps {
  children: React.ReactNode;
  variant?: keyof typeof pageVariants;
}

export const AnimatedPage: React.FC<AnimatedPageProps> = ({ children, variant = 'animate' }) => {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
    >
      {children}
    </motion.div>
  );
};

/**
 * Animated container with stagger effect
 */
export interface AnimatedContainerProps {
  children: React.ReactNode;
  delay?: number;
}

export const AnimatedContainer: React.FC<AnimatedContainerProps> = ({ children, delay = 0 }) => {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={staggerContainerVariants}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </motion.div>
  );
};

/**
 * Animated item for use within AnimatedContainer
 */
export interface AnimatedItemProps {
  children: React.ReactNode;
}

export const AnimatedItem: React.FC<AnimatedItemProps> = ({ children }) => {
  return (
    <motion.div variants={staggerItemVariants}>
      {children}
    </motion.div>
  );
};

/**
 * Micro-interaction: Button press effect
 */
export interface MicroInteractionButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
}

export const MicroInteractionButton: React.FC<MicroInteractionButtonProps> = ({ children, onClick }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      {children}
    </motion.div>
  );
};

/**
 * Animated success checkmark
 */
export const AnimatedCheckmark: React.FC = () => {
  const theme = useTheme();

  return (
    <motion.svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
    >
      <motion.circle
        cx="32"
        cy="32"
        r="30"
        fill="none"
        stroke={theme.palette.success.main}
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      />
      <motion.path
        d="M 20 32 L 28 40 L 44 24"
        fill="none"
        stroke={theme.palette.success.main}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, ease: 'easeInOut', delay: 0.2 }}
      />
    </motion.svg>
  );
};

/**
 * Animated error X mark
 */
export const AnimatedErrorMark: React.FC = () => {
  const theme = useTheme();

  return (
    <motion.svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
    >
      <motion.circle
        cx="32"
        cy="32"
        r="30"
        fill="none"
        stroke={theme.palette.error.main}
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      />
      <motion.path
        d="M 22 22 L 42 42"
        fill="none"
        stroke={theme.palette.error.main}
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, ease: 'easeInOut', delay: 0.2 }}
      />
      <motion.path
        d="M 42 22 L 22 42"
        fill="none"
        stroke={theme.palette.error.main}
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, ease: 'easeInOut', delay: 0.2 }}
      />
    </motion.svg>
  );
};

/**
 * Animated loading dots
 */
export const AnimatedLoadingDots: React.FC = () => {
  const theme = useTheme();

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          animate={{ y: [0, -10, 0] }}
          transition={{
            duration: 0.6,
            ease: 'easeInOut',
            repeat: Infinity,
            delay: i * 0.1,
          }}
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: theme.palette.primary.main,
          }}
        />
      ))}
    </Box>
  );
};

/**
 * Animated progress bar
 */
export interface AnimatedProgressBarProps {
  progress: number;
  color?: string;
}

export const AnimatedProgressBar: React.FC<AnimatedProgressBarProps> = ({ progress, color = '#8e24aa' }) => {
  return (
    <Box
      sx={{
        width: '100%',
        height: 4,
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          height: '100%',
          backgroundColor: color,
          borderRadius: 2,
        }}
      />
    </Box>
  );
};

/**
 * Animated counter
 */
export interface AnimatedCounterProps {
  from: number;
  to: number;
  duration?: number;
  format?: (value: number) => string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  from,
  to,
  duration = 1,
  format = (v) => Math.round(v).toString(),
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.span>
        {/* Using a custom hook would be better, but this is a simple implementation */}
        {format(to)}
      </motion.span>
    </motion.div>
  );
};

/**
 * Animated tooltip
 */
export interface AnimatedTooltipProps {
  children: React.ReactNode;
  content: string;
}

export const AnimatedTooltip: React.FC<AnimatedTooltipProps> = ({ children, content }) => {
  const [isVisible, setIsVisible] = React.useState(false);

  return (
    <Box sx={{ position: 'relative', display: 'inline-block' }}>
      <Box
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </Box>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute',
              bottom: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginBottom: 8,
              backgroundColor: '#333',
              color: '#fff',
              padding: '8px 12px',
              borderRadius: 4,
              fontSize: '0.875rem',
              whiteSpace: 'nowrap',
              zIndex: 1000,
            }}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};
