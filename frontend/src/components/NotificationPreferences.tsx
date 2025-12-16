import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  Stack,
  Typography,
  Box,
  Alert,
  AlertTitle,
  TextField,
  CircularProgress,
  Button,
} from '@mui/material';
import { Mail, Bell, CheckCircle, AlertCircle, Clock, Info } from 'lucide-react';
import apiClient from '../services/api';

interface NotificationPreferences {
  userId: string;
  emailNotifications: boolean;
  inAppNotifications: boolean;
  notifyOnApproval: boolean;
  notifyOnRejection: boolean;
  notifyOnPending: boolean;
  notifyOnCompletion: boolean;
  emailAddress?: string;
}

interface NotificationPreferencesProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Notification Preferences Dialog
 * Allows users to customize notification settings
 */
export const NotificationPreferencesDialog = ({
  open,
  onClose,
}: NotificationPreferencesProps) => {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      fetchPreferences();
    }
  }, [open]);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/api/notifications/preferences');
      setPreferences(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch preferences');
      console.error('Error fetching preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: boolean | string) => {
    if (preferences) {
      setPreferences({
        ...preferences,
        [key]: value,
      });
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      await apiClient.put('/api/notifications/preferences', preferences);
      setSuccess(true);

      // Close dialog after 2 seconds
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save preferences');
      console.error('Error saving preferences:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Notification Preferences</DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">
            <AlertTitle>Error</AlertTitle>
            {error}
          </Alert>
        ) : success ? (
          <Alert severity="success">
            <AlertTitle>Success</AlertTitle>
            Your preferences have been saved successfully.
          </Alert>
        ) : preferences ? (
          <Stack spacing={3}>
            {/* General Settings */}
            <Box>
              <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 2 }}>
                General Settings
              </Typography>
              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.inAppNotifications}
                      onChange={(e) =>
                        handlePreferenceChange('inAppNotifications', e.target.checked)
                      }
                    />
                  }
                  label={
                    <Stack spacing={0.5}>
                      <Typography variant="body2" fontWeight="500">
                        In-App Notifications
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Receive notifications within the application
                      </Typography>
                    </Stack>
                  }
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.emailNotifications}
                      onChange={(e) =>
                        handlePreferenceChange('emailNotifications', e.target.checked)
                      }
                    />
                  }
                  label={
                    <Stack spacing={0.5}>
                      <Typography variant="body2" fontWeight="500">
                        Email Notifications
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Receive notifications via email
                      </Typography>
                    </Stack>
                  }
                />
              </Stack>
            </Box>

            {/* Notification Types */}
            <Box>
              <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 2 }}>
                Notification Types
              </Typography>
              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.notifyOnApproval}
                      onChange={(e) =>
                        handlePreferenceChange('notifyOnApproval', e.target.checked)
                      }
                    />
                  }
                  label={
                    <Stack spacing={0.5}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <CheckCircle size={16} color="#4caf50" />
                        <Typography variant="body2" fontWeight="500">
                          Approvals
                        </Typography>
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        Notify when export is approved
                      </Typography>
                    </Stack>
                  }
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.notifyOnRejection}
                      onChange={(e) =>
                        handlePreferenceChange('notifyOnRejection', e.target.checked)
                      }
                    />
                  }
                  label={
                    <Stack spacing={0.5}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <AlertCircle size={16} color="#f44336" />
                        <Typography variant="body2" fontWeight="500">
                          Rejections
                        </Typography>
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        Notify when export is rejected
                      </Typography>
                    </Stack>
                  }
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.notifyOnPending}
                      onChange={(e) =>
                        handlePreferenceChange('notifyOnPending', e.target.checked)
                      }
                    />
                  }
                  label={
                    <Stack spacing={0.5}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Clock size={16} color="#ff9800" />
                        <Typography variant="body2" fontWeight="500">
                          Pending Actions
                        </Typography>
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        Notify when action is required
                      </Typography>
                    </Stack>
                  }
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.notifyOnCompletion}
                      onChange={(e) =>
                        handlePreferenceChange('notifyOnCompletion', e.target.checked)
                      }
                    />
                  }
                  label={
                    <Stack spacing={0.5}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <CheckCircle size={16} color="#2196f3" />
                        <Typography variant="body2" fontWeight="500">
                          Completion
                        </Typography>
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        Notify when export is completed
                      </Typography>
                    </Stack>
                  }
                />
              </Stack>
            </Box>

            {/* Email Address */}
            {preferences.emailNotifications && (
              <Box>
                <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 2 }}>
                  Email Address
                </Typography>
                <TextField
                  fullWidth
                  type="email"
                  label="Email Address"
                  value={preferences.emailAddress || ''}
                  onChange={(e) => handlePreferenceChange('emailAddress', e.target.value)}
                  placeholder="your.email@example.com"
                  size="small"
                  helperText="Notifications will be sent to this email address"
                />
              </Box>
            )}

            {/* Info Box */}
            <Alert severity="info" icon={<Info size={20} />}>
              <AlertTitle>Notification Frequency</AlertTitle>
              Notifications are sent in real-time when events occur. You can disable specific
              notification types above.
            </Alert>
          </Stack>
        ) : null}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading || saving}
          startIcon={saving ? <CircularProgress size={20} /> : undefined}
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NotificationPreferencesDialog;
