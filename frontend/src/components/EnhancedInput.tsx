import { TextField as MuiTextField, TextFieldProps as MuiTextFieldProps } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { forwardRef, useState } from 'react';
import { inputFocus, transition, borderRadius, spacing } from '../utils/designSystem';

interface EnhancedInputProps extends MuiTextFieldProps {
    /**
     * Show success state
     */
    success?: boolean;
    /**
     * Enable glow effect on focus
     * @default true
     */
    enableFocusGlow?: boolean;
}

/**
 * Enhanced Input Component with Professional Focus States
 * 
 * Features:
 * - Smooth focus glow animation
 * - Success state styling
 * - Consistent border radius
 * - Clear error/success feedback
 */
const EnhancedInput = forwardRef<HTMLDivElement, EnhancedInputProps>(
    ({ success, enableFocusGlow = true, sx, ...props }, ref) => {
        const theme = useTheme();
        const [isFocused, setIsFocused] = useState(false);

        return (
            <MuiTextField
                ref={ref}
                {...props}
                onFocus={(e) => {
                    setIsFocused(true);
                    props.onFocus?.(e);
                }}
                onBlur={(e) => {
                    setIsFocused(false);
                    props.onBlur?.(e);
                }}
                sx={{
                    '& .MuiOutlinedInput-root': {
                        borderRadius: borderRadius.md,
                        transition: transition.all,
                        ...(enableFocusGlow &&
                            isFocused && {
                            ...inputFocus(theme),
                        }),
                        ...(success && {
                            '& fieldset': {
                                borderColor: theme.palette.success.main,
                            },
                            '&:hover fieldset': {
                                borderColor: theme.palette.success.dark,
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: theme.palette.success.main,
                                boxShadow: `0 0 0 3px ${theme.palette.success.main}20`,
                            },
                        }),
                    },
                    '& .MuiInputLabel-root': {
                        ...(success && {
                            color: theme.palette.success.main,
                            '&.Mui-focused': {
                                color: theme.palette.success.main,
                            },
                        }),
                    },
                    '& .MuiFormHelperText-root': {
                        marginLeft: spacing.xs,
                        marginTop: spacing.xs,
                        ...(success && {
                            color: theme.palette.success.main,
                        }),
                    },
                    ...sx,
                }}
            />
        );
    }
);

EnhancedInput.displayName = 'EnhancedInput';

export default EnhancedInput;
