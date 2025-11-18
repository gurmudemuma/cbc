import { useEffect, useState } from 'react';
import { Users, Plus, Shield, Ban, CheckCircle } from 'lucide-react';
import apiClient, { setApiBaseUrl } from '../services/api';
import { API_ENDPOINTS } from '../config/api.config';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Stack,
  TextField,
  Typography,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
} from '@mui/material';

const DEFAULT_COMMERCIAL_BANK_ORG = 'COMMERCIAL-BANK-001';

const UserManagement = ({ user }) => {
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setApiBaseUrl(API_ENDPOINTS.nbRegulatory);
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await apiClient.get(`/api/portal/users`, {
        params: { organizationId: DEFAULT_COMMERCIAL_BANK_ORG },
      });
      setUsers(res.data.data || []);
    } catch (e) {
      setUsers([]);
    }
  };

  const createUser = async () => {
    try {
      setLoading(true);
      await apiClient.post('/api/portal/users', {
        username: form.username,
        email: form.email,
        password: form.password,
        organizationId: DEFAULT_COMMERCIAL_BANK_ORG,
        role: 'exporter',
      });
      setOpen(false);
      setForm({ username: '', email: '', password: '' });
      fetchUsers();
    } catch (e) {
      alert('Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id, isActive) => {
    try {
      const path = isActive ? 'deactivate' : 'activate';
      await apiClient.patch(`/api/portal/users/${id}/${path}`);
      fetchUsers();
    } catch (e) {
      alert('Failed to update user');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={9}>
          <Typography variant="h4">Exporter Portal Users</Typography>
          <Typography variant="subtitle1" sx={{ mb: 3 }}>
            Managed by National Bank
          </Typography>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" spacing={1} alignItems="center">
                  <Users size={20} />
                  <Typography variant="h6">Users</Typography>
                  <Chip label={`${users.length} users`} size="small" />
                </Stack>
                <Button variant="contained" startIcon={<Plus />} onClick={() => setOpen(true)}>
                  New User
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Username</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Organization</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id} hover>
                      <TableCell>{u.username}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{u.organizationId}</TableCell>
                      <TableCell>{u.role}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          color={u.isActive ? 'success' : 'default'}
                          icon={u.isActive ? <CheckCircle size={14} /> : undefined}
                          label={u.isActive ? 'Active' : 'Inactive'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button
                            size="small"
                            variant="outlined"
                            color={u.isActive ? 'error' : 'success'}
                            startIcon={u.isActive ? <Ban size={14} /> : <Shield size={14} />}
                            onClick={() => toggleActive(u.id, u.isActive)}
                          >
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography color="text.secondary">No users found</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Notes
              </Typography>
              <Stack spacing={1}>
                <Typography variant="body2">- These users are off-chain (PostgreSQL)</Typography>
                <Typography variant="body2">- Access to Exporter Portal only</Typography>
                <Typography variant="body2">- Does not affect node identities</Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Exporter Portal User</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Username"
              fullWidth
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            onClick={createUser}
            variant="contained"
            disabled={loading || !form.username || !form.email || !form.password}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;
