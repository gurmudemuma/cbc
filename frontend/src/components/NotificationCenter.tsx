/**
 * Notification Center - Enterprise notification management UI
 * Displays notification history, allows filtering and management
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Badge,
  IconButton,
  Popover,
  Stack,
  Typography,
  Chip,
  Button,
  Divider,
  useTheme,
  alpha,
  Tooltip,
} from '@mui/material';
import {
  Bell,
  X,
  CheckCircle,
  AlertCircle,
  Info,
  AlertTriangle,
  Trash2,
  Check,
} from 'lucide-react';
import { notificationService, Notification, NotificationState } from '../services/notificationService';
import { styled } from '@mui/material/styles';

const NotificationItem = styled(motion.div)(({ theme }) => ({
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  cursor: 'pointer',
  transition: 'all 200ms ease',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.05),
  },
  '&.unread': {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    borderLeft: `4px solid ${theme.palette.primary.main}`,
  },
}));

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'success':
      return <CheckCircle size={20} style={{ color: '#10B981' }} />;
    case 'error':
      return <AlertCircle size={20} style={{ color: '#EF4444' }} />;
    case 'warning':
      return <AlertTriangle size={20} style={{ color: '#F59E0B' }} />;
    case 'info':
    default:
      return <Info size={20} style={{ color: '#3B82F6' }} />;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'success':
      return 'success';
    case 'error':
      return 'error';
    case 'warning':
      return 'warning';
    case 'info':
    default:
      return 'info';
  }
};

const NotificationCenter: React.FC = () => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [state, setState] = useState<NotificationState>(notificationService.getState());
  const [filter, setFilter] = useState<'all' | 'unread' | 'success' | 'error' | 'warning' | 'info'>('all');

  useEffect(() => {
    const unsubscribe = notificationService.subscribe((newState) => {
      setState(newState);
    });
    return unsubscribe;
  }, []);

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    notificationService.markAsRead(id);
  };

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    notificationService.remove(id);
  };

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead();
  };

  const handleClearAll = () => {
    notificationService.clearAll();
  };

  const filteredNotifications = state.notifications.filter((notif) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notif.read;
    return notif.type === filter;
  });

  const open = Boolean(anchorEl);

  return (
    <>
      {/* Notification Bell Button */}
      <Tooltip title="Notifications">
        <IconButton
          onClick={handleOpen}
          sx={{
            position: 'relative',
            color: state.unreadCount > 0 ? 'error.main' : 'text.primary',
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
            },
          }}
        >
          <Badge badgeContent={state.unreadCount} color="error">
            <Bell size={24} />
          </Badge>
        </IconButton>
      </Tooltip>

      {/* Notification Popover */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            width: 420,
            maxHeight: 600,
            borderRadius: 2,
            boxShadow: theme.shadows[8],
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: alpha(theme.palette.primary.main, 0.02),
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Notifications
          </Typography>
          <Stack direction="row" spacing={1}>
            {state.unreadCount > 0 && (
              <Tooltip title="Mark all as read">
                <IconButton
                  size="small"
                  onClick={handleMarkAllAsRead}
                  sx={{ color: 'primary.main' }}
                >
                  <Check size={18} />
                </IconButton>
              </Tooltip>
            )}
            <IconButton size="small" onClick={handleClose}>
              <X size={18} />
            </IconButton>
          </Stack>
        </Box>

        {/* Filter Chips */}
        <Box sx={{ p: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap', borderBottom: `1px solid ${theme.palette.divider}` }}>
          {(['all', 'unread', 'success', 'error', 'warning', 'info'] as const).map((f) => (
            <Chip
              key={f}
              label={f.charAt(0).toUpperCase() + f.slice(1)}
              size="small"
              onClick={() => setFilter(f)}
              variant={filter === f ? 'filled' : 'outlined'}
              color={filter === f ? 'primary' : 'default'}
              sx={{ cursor: 'pointer' }}
            />
          ))}
        </Box>

        {/* Notifications List */}
        <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
          <AnimatePresence>
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notif, index) => (
                <NotificationItem
                  key={notif.id}
                  className={!notif.read ? 'unread' : ''}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleMarkAsRead(notif.id, {} as any)}
                >
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    {/* Icon */}
                    <Box sx={{ mt: 0.5, flexShrink: 0 }}>
                      {getNotificationIcon(notif.type)}
                    </Box>

                    {/* Content */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: 600,
                              color: !notif.read ? 'text.primary' : 'text.secondary',
                            }}
                          >
                            {notif.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 0.5, wordBreak: 'break-word' }}
                          >
                            {notif.message}
                          </Typography>
                          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(notif.timestamp).toLocaleTimeString()}
                            </Typography>
                            {notif.action && (
                              <Button
                                size="small"
                                variant="text"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  notif.action?.onClick();
                                }}
                                sx={{ p: 0, minHeight: 'auto' }}
                              >
                                {notif.action.label}
                              </Button>
                            )}
                          </Stack>
                        </Box>

                        {/* Actions */}
                        <Tooltip title="Remove">
                          <IconButton
                            size="small"
                            onClick={(e) => handleRemove(notif.id, e)}
                            sx={{ color: 'text.secondary' }}
                          >
                            <X size={16} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Box>
                  </Stack>
                </NotificationItem>
              ))
            ) : (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Bell size={48} style={{ color: '#9E9E9E', marginBottom: 16, opacity: 0.5 }} />
                <Typography color="text.secondary">
                  {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
                </Typography>
              </Box>
            )}
          </AnimatePresence>
        </Box>

        {/* Footer */}
        {state.notifications.length > 0 && (
          <Box
            sx={{
              p: 1.5,
              borderTop: `1px solid ${theme.palette.divider}`,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <Button
              size="small"
              onClick={handleClearAll}
              sx={{ color: 'error.main' }}
            >
              Clear All
            </Button>
          </Box>
        )}
      </Popover>
    </>
  );
};

export default NotificationCenter;
