import { useState, useEffect } from 'react';
import {
  Box,
  IconButton,
  Badge,
  Popover,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  Typography,
  Stack,
  Button,
  Chip,
  CircularProgress,
  Alert,
  AlertTitle,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Bell,
  CheckCircle,
  AlertCircle,
  Clock,
  Info,
  Trash2,
  MoreVertical,
  Settings,
} from 'lucide-react';
import apiClient from '../services/api';

interface Notification {
  id: string;
  userId: string;
  exportId: string;
  type: 'APPROVED' | 'REJECTED' | 'PENDING' | 'COMPLETED' | 'ACTION_REQUIRED' | 'INFO';
  title: string;
  message: string;
  actor: string;
  actorRole: string;
  timestamp: string;
  read: boolean;
  actionRequired?: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

interface NotificationCenterProps {
  onNotificationClick?: (notification: Notification) => void;
  onPreferencesClick?: () => void;
}

/**
 * Notification Center Component
 * Displays user notifications with real-time updates
 */
export const NotificationCenter = ({
  onNotificationClick,
  onPreferencesClick,
}: NotificationCenterProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  const open = Boolean(anchorEl);
  const menuOpen = Boolean(menuAnchorEl);

  useEffect(() => {
    // Fetch notifications on component mount
    fetchNotifications();
    
    // Poll for new notifications every 10 seconds
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/notifications');
      setNotifications(response.data.data || []);

      const unreadResponse = await apiClient.get('/api/notifications/unread');
      setUnreadCount(unreadResponse.data.count || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, notification: Notification) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedNotification(notification);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await apiClient.post(`/api/notifications/${notificationId}/read`);
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiClient.post('/api/notifications/read-all');
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await apiClient.delete(`/api/notifications/${notificationId}`);
      fetchNotifications();
      handleMenuClose();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleClearAll = async () => {
    try {
      await apiClient.post('/api/notifications/clear-all');
      fetchNotifications();
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'APPROVED':
        return <span><CheckCircle size={20} color="#4caf50" /></span>;
      case 'REJECTED':
        return <span><AlertCircle size={20} color="#f44336" /></span>;
      case 'ACTION_REQUIRED':
        return <span><AlertCircle size={20} color="#ff9800" /></span>;
      case 'COMPLETED':
        return <span><CheckCircle size={20} color="#2196f3" /></span>;
      case 'PENDING':
        return <span><Clock size={20} color="#ff9800" /></span>;
      default:
        return <span><Info size={20} color="#9e9e9e" /></span>;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'error';
      case 'ACTION_REQUIRED':
        return 'warning';
      case 'COMPLETED':
        return 'info';
      case 'PENDING':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      {/* Notification Bell Icon */}
      <IconButton
        onClick={handleOpen}
        sx={{
          position: 'relative',
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <Bell size={20} />
        </Badge>
      </IconButton>

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
            width: 400,
            maxHeight: 600,
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6" fontWeight="700">
              Notifications
            </Typography>
            <Stack direction="row" spacing={1}>
              {unreadCount > 0 && (
                <Button
                  size="small"
                  onClick={handleMarkAllAsRead}
                  sx={{ fontSize: '0.75rem' }}
                >
                  Mark all read
                </Button>
              )}
              <IconButton
                size="small"
                onClick={onPreferencesClick}
                title="Notification preferences"
              >
                <Settings size={16} />
              </IconButton>
            </Stack>
          </Stack>

          <Divider sx={{ mb: 2 }} />

          {/* Notifications List */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : notifications.length === 0 ? (
            <Alert severity="info">
              <AlertTitle>No Notifications</AlertTitle>
              You're all caught up! No new notifications.
            </Alert>
          ) : (
            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
              {notifications.map((notification, index) => (
                <Box key={notification.id}>
                  <ListItem
                    disablePadding
                    sx={{
                      bgcolor: notification.read ? 'transparent' : 'action.hover',
                      borderRadius: 1,
                      mb: 1,
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={(e) => handleMenuOpen(e, notification)}
                      >
                        <MoreVertical size={16} />
                      </IconButton>
                    }
                  >
                    <ListItemButton
                      onClick={() => handleNotificationClick(notification)}
                      sx={{ py: 1.5 }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        {getNotificationIcon(notification.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography
                              variant="body2"
                              fontWeight={notification.read ? 400 : 600}
                              sx={{ flex: 1 }}
                            >
                              {notification.title}
                            </Typography>
                            {!notification.read && (
                              <Box
                                sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  bgcolor: 'primary.main',
                                }}
                              />
                            )}
                          </Stack>
                        }
                        secondary={
                          <Stack spacing={0.5}>
                            <Typography variant="caption" color="text.secondary">
                              {notification.message}
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip
                                label={notification.type}
                                size="small"
                                color={getNotificationColor(notification.type) as any}
                                variant="outlined"
                                sx={{ height: 20, fontSize: '0.65rem' }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                {formatTime(notification.timestamp)}
                              </Typography>
                            </Stack>
                          </Stack>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                  {index < notifications.length - 1 && <Divider sx={{ my: 0.5 }} />}
                </Box>
              ))}
            </List>
          )}

          {/* Footer */}
          {notifications.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Button
                fullWidth
                size="small"
                onClick={handleClearAll}
                startIcon={<Trash2 size={16} />}
                color="error"
              >
                Clear All
              </Button>
            </>
          )}
        </Box>
      </Popover>

      {/* Notification Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
      >
        {!selectedNotification?.read && (
          <MenuItem onClick={() => {
            if (selectedNotification) {
              handleMarkAsRead(selectedNotification.id);
            }
            handleMenuClose();
          }}>
            Mark as read
          </MenuItem>
        )}
        <MenuItem onClick={() => {
          if (selectedNotification) {
            handleDelete(selectedNotification.id);
          }
        }}>
          Delete
        </MenuItem>
      </Menu>
    </>
  );
};

export default NotificationCenter;
