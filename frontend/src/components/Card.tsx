import { styled } from '@mui/material/styles';
import { Card as MuiCard, CardHeader, CardContent, CardActions, Typography, Box, IconButton } from '@mui/material';
import { forwardRef } from 'react';

// Styled MUI Card with custom variants
const StyledCard = styled(MuiCard, {
  shouldForwardProp: (prop) => 
    !['interactive', 'variant', 'compact'].includes(prop),
})(({ theme, variant, interactive, compact }) => ({
  background: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius * 1.5,
  overflow: 'hidden',
  transition: theme.transitions.create(['all'], {
    duration: theme.transitions.duration.standard,
  }),
  boxShadow: theme.shadows[2],

  '&:hover': {
    borderColor: theme.palette.primary.main,
    boxShadow: theme.shadows[4],
    transform: 'translateY(-2px)',
  },

  '&:focus-within': {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: 2,
  },

  // Variants
  ...(variant === 'elevated' && {
    boxShadow: theme.shadows[5],
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: theme.shadows[6],
    },
  }),

  ...(variant === 'highlight' && {
    borderColor: theme.palette.primary.main,
    boxShadow: theme.shadows[4],
  }),

  // Interactive
  ...(interactive && {
    cursor: 'pointer',
    '&:active': {
      transform: 'scale(0.98)',
    },
  }),

  // Compact
  ...(compact && {
    '& .MuiCardHeader-root': {
      padding: theme.spacing(2),
    },
    '& .MuiCardContent-root': {
      padding: theme.spacing(2),
    },
  }),

  // Responsive
  [theme.breakpoints.down('sm')]: {
    '& .MuiCardHeader-root': {
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: theme.spacing(2),
    },
    '& .MuiCardActions-root': {
      width: '100%',
      justifyContent: 'flex-end',
    },
  },
}));

// Styled icon wrapper
const IconWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 48,
  height: 48,
  borderRadius: theme.shape.borderRadius,
  background: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  flexShrink: 0,
}));

// Styled header content wrapper
const HeaderContent = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  flex: 1,
}));

// Main Card component
const Card = forwardRef(({
  children,
  title,
  subtitle,
  icon,
  actions,
  variant = 'default',
  compact = false,
  interactive = false,
  onClick,
  ...props
}, ref) => {
  const hasHeader = title || subtitle || icon || actions;

  return (
    <StyledCard
      ref={ref}
      variant={variant}
      interactive={interactive}
      compact={compact}
      onClick={interactive ? onClick : undefined}
      {...props}
    >
      {hasHeader && (
        <CardHeader
          avatar={icon && <IconWrapper>{icon}</IconWrapper>}
          action={actions && (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {actions}
            </Box>
          )}
          title={
            title && (
              <Typography
                variant="h6"
                component="h3"
                sx={{
                  fontWeight: 700,
                  color: 'primary.main',
                }}
              >
                {title}
              </Typography>
            )
          }
          subheader={
            subtitle && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                {subtitle}
              </Typography>
            )
          }
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            background: 'background.paper',
          }}
        />
      )}
      <CardContent>
        {children}
      </CardContent>
    </StyledCard>
  );
});

Card.displayName = 'Card';

export default Card;
