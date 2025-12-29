import { Button as MuiButton, ButtonProps as MuiButtonProps } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { forwardRef } from 'react';
import {
    createButtonStyle,
    buttonInteractions,
    transition,
    borderRadius,
    spacing,
} from '../utils/designSystem';

interface EnhancedButtonProps extends MuiButtonProps {
    /**
     * Enable hover lift effect
     * @default true
     */
    enableHoverLift?: boolean;
    /**
     * Enable ripple effect
     * @default true
     */
    disableRipple?: boolean;
}

/**
 * Enhanced Button Component with Professional Micro-Interactions
 * 
 * Features:
 * - Smooth hover lift animation
 * - Shadow elevation on hover
 * - Active state feedback
 * - Consistent styling across the app
 */
const EnhancedButton = forwardRef<HTMLButtonElement, EnhancedButtonProps>(
    ({ enableHoverLift = true, children, sx, ...props }, ref) => {
        const theme = useTheme();

        return (
            <MuiButton
                ref={ref}
                {...props}
                sx={{
                    ...createButtonStyle(theme),
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: borderRadius.md,
                    px: spacing.lg,
                    py: spacing.sm,
                    transition: transition.all,
                    ...(enableHoverLift && {
                        '&:hover:not(:disabled)': {
                            ...buttonInteractions.hover,
                        },
                        '&:active:not(:disabled)': {
                            ...buttonInteractions.active,
                        },
                    }),
                    '&:disabled': {
                        ...buttonInteractions.disabled,
                    },
                    ...sx,
                }}
            >
                {children}
            </MuiButton>
        );
    }
);

EnhancedButton.displayName = 'EnhancedButton';

export default EnhancedButton;
