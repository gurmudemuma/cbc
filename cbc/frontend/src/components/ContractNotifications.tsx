/**
 * Contract Notifications Component
 * Displays sales contract notifications for network members
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Badge,
  IconButton,
  Popover,
  Stack,
  Typography,
  Button,
  Divider,
  useTheme,
  alpha,
  Tooltip,
  Chip,
  CircularProgress,
} from '@mui/material';
import { Bell, FileText, CheckCircle2, Clock } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api.config';

interface ContractNotification {
  notification_id: string;
  ecta_reference_number: string;
  exporter_name: string;
  notification_status: 'SENT' | 'READ' | 'ACKNOWLEDGED';
  notification_message: string;
  created_at: string;
  read_at?: string;
}

const ContractNotifications: React.FC = () => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [notifications, setNotifications] = useState<ContractNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/network/notifications/contracts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.data.success) {
        setNotifications(response.data.data);
        const unread = response.data.data.filter((n: ContractNotification) => n.notification_status === 'SENT').length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Error fetching contract notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    fetchNotifications(); // Refresh when opening
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_BASE_URL}/api/network/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchNotifications(); // Refresh list
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleViewContract = (referenceNumber: string) => {
    // Navigate to contract verification page
    window.location.href = `/sales-contract-verification?ref=${referenceNumber}`;
  };

  const open = Boolean(anchorEl);

  return (
    <>
      {/* Notification Bell Button */}
      <Tooltip title="Contract Notifications">
        <IconButton
          onClick={handleOpen}
          sx={{
            position: 'relative',
            color: unreadCount > 0 ? 'error.main' : 'text.primary',
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
            },
          }}
        >
          <Badge badgeContent={unreadCount} color="error">
            <FileText size={24} />
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
            mt: 1,
            boxShadow: theme.shadows[8],
            borderRadius: 2,
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: 'white',
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1}>
              <FileText size={20} />
              <Typography variant="h6" fontWeight={600}>
                Contract Notifications
              </Typography>
            </Stack>
            <Chip
              label={`${unreadCount} New`}
              size="small"
              sx={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                fontWeight: 600,
              }}
            />
          </Stack>
        </Box>

        {/* Notifications List */}
        <Box sx={{ maxHeight: 450, overflow: 'auto' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : notifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <FileText size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
              <Typography variant="body2" color="text.secondary">
                No contract notifications yet
              </Typography>
            </Box>
          ) : (
            <Stack divider={<Divider />}>
              {notifications.map((notification) => (
                <Box
                  key={notification.notification_id}
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    transition: 'all 200ms ease',
                    backgroundColor:
                      notification.notification_status === 'SENT'
                        ? alpha(theme.palette.primary.main, 0.08)
                        : 'transparent',
                    borderLeft:
                      notification.notification_status === 'SENT'
                        ? `4px solid ${theme.palette.primary.main}`
                        : 'none',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    },
                  }}
                  onClick={() => handleViewContract(notification.ecta_reference_number)}
                >
                  <Stack spacing={1}>
                    {/* Header */}
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <FileText size={16} color={theme.palette.primary.main} />
                        <Typography variant="subtitle2" fontWeight={600}>
                          New Sales Contract
                        </Typography>
                      </Stack>
                      {notification.notification_status === 'SENT' && (
                        <Chip
                          label="New"
                          size="small"
                          color="primary"
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      )}
                    </Stack>

                    {/* Reference Number */}
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color="primary"
                      sx={{ fontFamily: 'monospace' }}
                    >
                      {notification.ecta_reference_number}
                    </Typography>

                    {/* Exporter Name */}
                    <Typography variant="body2" color="text.secondary">
                      Exporter: {notification.exporter_name}
                    </Typography>

                    {/* Message */}
                    <Typography variant="body2" color="text.secondary">
                      {notification.notification_message}
                    </Typography>

                    {/* Footer */}
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 1 }}>
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Clock size={12} />
                        <Typography variant="caption" color="text.secondary">
                          {new Date(notification.created_at).toLocaleString()}
                        </Typography>
                      </Stack>
                      {notification.notification_status === 'SENT' && (
                        <Button
                          size="small"
                          startIcon={<CheckCircle2 size={14} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification.notification_id);
                          }}
                          sx={{ fontSize: '0.7rem' }}
                        >
                          Mark Read
                        </Button>
                      )}
                    </Stack>
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </Box>

        {/* Footer */}
        {notifications.length > 0 && (
          <Box
            sx={{
              p: 1.5,
              borderTop: `1px solid ${theme.palette.divider}`,
              textAlign: 'center',
            }}
          >
            <Button
              size="small"
              onClick={() => {
                window.location.href = '/sales-contract-verification';
              }}
              sx={{ fontSize: '0.8rem' }}
            >
              View All Contracts
            </Button>
          </Box>
        )}
      </Popover>
    </>
  );
};

export default ContractNotifications;
