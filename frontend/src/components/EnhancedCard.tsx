import { Card as MuiCard, CardProps as MuiCardProps } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { forwardRef, ReactNode } from 'react';
import {
    createCardStyle,
    cardInteractions,
    transition,
    borderRadius,
    cardSpacing,
    shadows,
    hoverShadows,
} from '../utils/designSystem';

interface EnhancedCardProps extends Omit<MuiCardProps, 'onClick'> {
    /**
     * Enable hover elevation effect
     * @default false
     */
    hoverable?: boolean;
    /**
     * Make card clickable
     */
    onClick?: () => void;
    /**
     * Card elevation level
     * @default 'low'
     */
    elevation?: 'none' | 'low' | 'medium' | 'high';
    /**
     * Enable glass morphism effect
     * @default false
     */
    glassMorphism?: boolean;
    /**
     * Custom border radius
     */
    customBorderRadius?: number;
    children: ReactNode;
}

/**
 * Enhanced Card Component with Professional Interactions
 * 
 * Features:
 * - Smooth hover lift animation
 * - Configurable elevation levels
 * - Glass morphism effect option
 * - Consistent padding and spacing
 * - Clickable variant with cursor pointer
 */
const EnhancedCard = forwardRef<HTMLDivElement, EnhancedCardProps>(
    (
        {
            hoverable = false,
            onClick,
            elevation = 'low',
            glassMorphism = false,
            customBorderRadius,
            children,
            sx,
            ...props
        },
        ref
    ) => {
        const theme = useTheme();

        const getElevation = () => {
            switch (elevation) {
                case 'none':
                    return shadows.none;
                case 'medium':
                    return shadows.md;
                case 'high':
                    return shadows.lg;
                default:
                    return shadows.sm;
            }
        };

        const isInteractive = hoverable || !!onClick;

        return (
            <MuiCard
                ref={ref}
                onClick={onClick}
                {...props}
                sx={{
                    padding: cardSpacing.padding,
                    borderRadius: customBorderRadius || borderRadius.lg,
                    backgroundColor: glassMorphism
                        ? 'rgba(255, 255, 255, 0.1)'
                        : theme.palette.background.paper,
                    backdropFilter: glassMorphism ? 'blur(10px)' : 'none',
                    WebkitBackdropFilter: glassMorphism ? 'blur(10px)' : 'none',
                    border: glassMorphism
                        ? '1px solid rgba(255, 255, 255, 0.2)'
                        : `1px solid ${theme.palette.divider}`,
                    boxShadow: getElevation(),
                    transition: transition.all,
                    cursor: onClick ? 'pointer' : 'default',
                    ...(isInteractive && {
                        '&:hover': {
                            ...cardInteractions.hover,
                            boxShadow: hoverShadows.card,
                        },
                    }),
                    ...sx,
                }}
            >
                {children}
            </MuiCard>
        );
    }
);

EnhancedCard.displayName = 'EnhancedCard';

export default EnhancedCard;
