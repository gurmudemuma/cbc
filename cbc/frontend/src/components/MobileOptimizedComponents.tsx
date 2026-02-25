import React from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  useTheme,
  useMediaQuery,
  SwipeableDrawer,
  Fab,
  Stack,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import { ChevronRight, Menu, X } from 'lucide-react';

/**
 * Mobile-optimized button with touch feedback
 */
export const MobileButton: React.FC<React.ComponentProps<typeof Button>> = (props) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <motion.div
      whileHover={!isMobile ? { scale: 1.05 } : {}}
      whileTap={{ scale: 0.95 }}
      style={{ width: '100%' }}
    >
      <Button
        {...props}
        sx={{
          ...props.sx,
          minHeight: isMobile ? 48 : 40,
          fontSize: isMobile ? '1rem' : '0.875rem',
          fontWeight: 600,
          borderRadius: isMobile ? 2 : 1,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          touchAction: 'manipulation',
        }}
        fullWidth={isMobile}
      />
    </motion.div>
  );
};

/**
 * Mobile-optimized card with swipe support
 */
export interface MobileCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  actions?: React.ReactNode;
}

export const MobileCard: React.FC<MobileCardProps> = ({
  title,
  subtitle,
  children,
  onSwipeLeft,
  onSwipeRight,
  actions,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={!isMobile ? { y: -4 } : {}}
      whileTap={{ scale: 0.98 }}
      drag={isMobile ? 'x' : false}
      dragElastic={0.2}
      onDragEnd={(event, info) => {
        if (isMobile) {
          if (info.offset.x > 50 && onSwipeRight) onSwipeRight();
          if (info.offset.x < -50 && onSwipeLeft) onSwipeLeft();
        }
      }}
      style={{ touchAction: 'pan-y' }}
    >
      <Card
        sx={{
          borderRadius: isMobile ? 2 : 1,
          boxShadow: theme.shadows[1],
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: theme.shadows[4],
          },
        }}
      >
        <CardContent sx={{ p: isMobile ? 2 : 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: isMobile ? '1.1rem' : '1rem' }}>
                {title}
              </Typography>
              {subtitle && (
                <Typography variant="caption" color="text.secondary">
                  {subtitle}
                </Typography>
              )}
            </Box>
            {actions && <Box>{actions}</Box>}
          </Box>
          <Box sx={{ mt: 1.5 }}>{children}</Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

/**
 * Mobile-optimized bottom sheet drawer
 */
export interface MobileBottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
  open,
  onClose,
  title,
  children,
  actions,
}) => {
  const theme = useTheme();

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={() => {}}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          maxHeight: '90vh',
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        {/* Handle bar */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mb: 2,
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: theme.palette.divider,
            }}
          />
        </Box>

        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <IconButton onClick={onClose} size="small">
              <X size={20} />
            </IconButton>
          </motion.div>
        </Box>

        {/* Content */}
        <Box sx={{ mb: 2 }}>{children}</Box>

        {/* Actions */}
        {actions && <Box sx={{ display: 'flex', gap: 1 }}>{actions}</Box>}
      </Box>
    </SwipeableDrawer>
  );
};

/**
 * Mobile-optimized floating action button
 */
export interface MobileFabProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
}

export const MobileFab: React.FC<MobileFabProps> = ({
  icon,
  label,
  onClick,
  color = 'primary',
  position = 'bottom-right',
}) => {
  const getPosition = () => {
    switch (position) {
      case 'bottom-left':
        return { bottom: 24, left: 24 };
      case 'bottom-center':
        return { bottom: 24, left: '50%', transform: 'translateX(-50%)' };
      default:
        return { bottom: 24, right: 24 };
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      style={{
        position: 'fixed',
        ...getPosition(),
        zIndex: 1000,
      }}
    >
      <Tooltip title={label}>
        <Fab
          color={color}
          onClick={onClick}
          sx={{
            boxShadow: 4,
            '&:hover': {
              boxShadow: 8,
            },
          }}
        >
          {icon}
        </Fab>
      </Tooltip>
    </motion.div>
  );
};

/**
 * Mobile-optimized list item with swipe actions
 */
export interface MobileListItemProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  actions?: React.ReactNode;
}

export const MobileListItem: React.FC<MobileListItemProps> = ({
  title,
  subtitle,
  icon,
  onClick,
  onSwipeLeft,
  onSwipeRight,
  actions,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <motion.div
      drag={isMobile ? 'x' : false}
      dragElastic={0.2}
      onDragEnd={(event, info) => {
        if (isMobile) {
          if (info.offset.x > 50 && onSwipeRight) onSwipeRight();
          if (info.offset.x < -50 && onSwipeLeft) onSwipeLeft();
        }
      }}
      whileHover={!isMobile ? { x: 4 } : {}}
      whileTap={{ scale: 0.98 }}
      style={{ touchAction: 'pan-y' }}
    >
      <Box
        onClick={onClick}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          p: 2,
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
          cursor: onClick ? 'pointer' : 'default',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          mb: 1,
          '&:hover': {
            backgroundColor: 'action.hover',
            borderColor: 'primary.main',
          },
        }}
      >
        {icon && <Box sx={{ display: 'flex', alignItems: 'center' }}>{icon}</Box>}
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        {actions ? (
          <Box>{actions}</Box>
        ) : (
          <ChevronRight size={20} color={theme.palette.text.secondary} />
        )}
      </Box>
    </motion.div>
  );
};

/**
 * Mobile-optimized tab navigation
 */
export interface MobileTabsProps {
  tabs: Array<{ label: string; icon?: React.ReactNode; id: string }>;
  activeTab: string;
  onChange: (tabId: string) => void;
}

export const MobileTabs: React.FC<MobileTabsProps> = ({ tabs, activeTab, onChange }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        overflowX: 'auto',
        pb: 1,
        mb: 2,
        '&::-webkit-scrollbar': {
          height: 4,
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: theme.palette.divider,
          borderRadius: 2,
        },
      }}
    >
      {tabs.map(tab => (
        <motion.div
          key={tab.id}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Chip
            icon={tab.icon as React.ReactElement}
            label={tab.label}
            onClick={() => onChange(tab.id)}
            variant={activeTab === tab.id ? 'filled' : 'outlined'}
            color={activeTab === tab.id ? 'primary' : 'default'}
            sx={{
              minHeight: 40,
              fontSize: '0.875rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          />
        </motion.div>
      ))}
    </Box>
  );
};

/**
 * Mobile-optimized touch-friendly spacing
 */
export const MOBILE_TOUCH_TARGET_SIZE = 48; // 48px minimum for touch targets
export const MOBILE_SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};
