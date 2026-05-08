/**
 * Unified Spacing & Design System Utilities
 * Professional spacing, shadows, and animation constants for consistent UI
 */

import { Theme } from '@mui/material/styles';

/**
 * Standardized spacing scale
 * Use these instead of arbitrary values for consistency
 */
export const spacing = {
    xs: 4,    // 4px
    sm: 8,    // 8px
    md: 16,   // 16px
    lg: 24,   // 24px
    xl: 32,   // 32px
    xxl: 48,  // 48px
    xxxl: 64, // 64px
} as const;

/**
 * Card spacing standards
 */
export const cardSpacing = {
    padding: spacing.lg,           // 24px standard card padding
    paddingCompact: spacing.md,    // 16px compact card padding
    gap: spacing.md,               // 16px gap between card elements
    margin: spacing.md,            // 16px margin between cards
} as const;

/**
 * Border radius standards
 */
export const borderRadius = {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
    round: '50%',
} as const;

/**
 * Animation durations (in milliseconds)
 */
export const duration = {
    fast: 150,
    normal: 250,
    slow: 350,
    slower: 500,
} as const;

/**
 * Animation easing functions
 */
export const easing = {
    // Material Design standard easing
    standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    // Accelerate (starts slow, ends fast)
    accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)',
    // Decelerate (starts fast, ends slow)
    decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
    // Sharp (quick and decisive)
    sharp: 'cubic-bezier(0.4, 0.0, 0.6, 1)',
    // Smooth (very smooth, premium feel)
    smooth: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
} as const;

/**
 * Shadow elevation system
 */
export const shadows = {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    xxl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
} as const;

/**
 * Hover shadow elevations
 */
export const hoverShadows = {
    card: '0 12px 24px -4px rgba(0, 0, 0, 0.12), 0 8px 16px -4px rgba(0, 0, 0, 0.08)',
    button: '0 8px 16px -4px rgba(0, 0, 0, 0.15)',
    elevated: '0 20px 40px -8px rgba(0, 0, 0, 0.2)',
} as const;

/**
 * Standard transition for smooth interactions
 */
export const transition = {
    all: `all ${duration.normal}ms ${easing.smooth}`,
    transform: `transform ${duration.fast}ms ${easing.smooth}`,
    opacity: `opacity ${duration.fast}ms ${easing.smooth}`,
    shadow: `box-shadow ${duration.normal}ms ${easing.smooth}`,
    colors: `background-color ${duration.normal}ms ${easing.smooth}, color ${duration.normal}ms ${easing.smooth}, border-color ${duration.normal}ms ${easing.smooth}`,
} as const;

/**
 * Micro-interaction styles for buttons
 */
export const buttonInteractions = {
    hover: {
        transform: 'translateY(-2px)',
        boxShadow: hoverShadows.button,
    },
    active: {
        transform: 'translateY(0)',
    },
    disabled: {
        opacity: 0.5,
        cursor: 'not-allowed',
    },
} as const;

/**
 * Card interaction styles
 */
export const cardInteractions = {
    hover: {
        transform: 'translateY(-4px)',
        boxShadow: hoverShadows.card,
    },
    clickable: {
        cursor: 'pointer',
        transition: transition.all,
    },
} as const;

/**
 * Input focus styles
 */
export const inputFocus = (theme: Theme) => ({
    outline: 'none',
    borderColor: theme.palette.primary.main,
    boxShadow: `0 0 0 3px ${theme.palette.primary.main}20`,
    transition: `border-color ${duration.fast}ms ${easing.smooth}, box-shadow ${duration.fast}ms ${easing.smooth}`,
});

/**
 * Shimmer animation for loading skeletons
 */
export const shimmerAnimation = {
    '@keyframes shimmer': {
        '0%': {
            backgroundPosition: '-1000px 0',
        },
        '100%': {
            backgroundPosition: '1000px 0',
        },
    },
    animation: 'shimmer 2s infinite linear',
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '1000px 100%',
} as const;

/**
 * Pulse animation for live indicators
 */
export const pulseAnimation = {
    '@keyframes pulse': {
        '0%, 100%': {
            opacity: 1,
        },
        '50%': {
            opacity: 0.5,
        },
    },
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
} as const;

/**
 * Fade in animation
 */
export const fadeIn = {
    '@keyframes fadeIn': {
        from: {
            opacity: 0,
            transform: 'translateY(10px)',
        },
        to: {
            opacity: 1,
            transform: 'translateY(0)',
        },
    },
    animation: `fadeIn ${duration.normal}ms ${easing.smooth}`,
} as const;

/**
 * Slide in from right animation
 */
export const slideInRight = {
    '@keyframes slideInRight': {
        from: {
            opacity: 0,
            transform: 'translateX(20px)',
        },
        to: {
            opacity: 1,
            transform: 'translateX(0)',
        },
    },
    animation: `slideInRight ${duration.normal}ms ${easing.smooth}`,
} as const;

/**
 * Typography scale
 */
export const typography = {
    lineHeight: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.75,
        loose: 2,
    },
    letterSpacing: {
        tighter: '-0.05em',
        tight: '-0.025em',
        normal: '0',
        wide: '0.025em',
        wider: '0.05em',
        widest: '0.1em',
    },
} as const;

/**
 * Z-index scale for layering
 */
export const zIndex = {
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    fixed: 1200,
    modalBackdrop: 1300,
    modal: 1400,
    popover: 1500,
    tooltip: 1600,
} as const;

/**
 * Responsive breakpoint helpers
 */
export const breakpoints = {
    xs: 0,
    sm: 600,
    md: 960,
    lg: 1280,
    xl: 1920,
} as const;

/**
 * Common gradient backgrounds
 */
export const gradients = {
    primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    info: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    subtle: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
} as const;

/**
 * Glass morphism effect
 */
export const glassMorphism = {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
} as const;

/**
 * Utility function to create consistent card styles
 */
export const createCardStyle = (theme: Theme, elevated = false) => ({
    padding: cardSpacing.padding,
    borderRadius: borderRadius.lg,
    backgroundColor: theme.palette.background.paper,
    boxShadow: elevated ? shadows.md : shadows.sm,
    transition: transition.all,
    '&:hover': elevated ? cardInteractions.hover : {},
});

/**
 * Utility function to create consistent button styles
 */
export const createButtonStyle = (theme: Theme) => ({
    borderRadius: borderRadius.md,
    padding: `${spacing.sm}px ${spacing.lg}px`,
    fontWeight: 600,
    textTransform: 'none' as const,
    transition: transition.all,
    '&:hover': buttonInteractions.hover,
    '&:active': buttonInteractions.active,
    '&:disabled': buttonInteractions.disabled,
});

export default {
    spacing,
    cardSpacing,
    borderRadius,
    duration,
    easing,
    shadows,
    hoverShadows,
    transition,
    buttonInteractions,
    cardInteractions,
    inputFocus,
    shimmerAnimation,
    pulseAnimation,
    fadeIn,
    slideInRight,
    typography,
    zIndex,
    breakpoints,
    gradients,
    glassMorphism,
    createCardStyle,
    createButtonStyle,
};
