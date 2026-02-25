import { useState, useEffect, useCallback } from 'react';
import { Package, MapPin, Lock, Plus, RefreshCw, Eye, Search, Anchor, ChevronRight } from 'lucide-react';
import {
    Box, Button, Card, CardContent, Chip, Dialog, DialogContent, DialogTitle, DialogActions,
    Grid, IconButton, InputAdornment, LinearProgress, MenuItem, Paper, Select, Stack, Step,
    StepLabel, Stepper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TextField, Typography, useTheme, Alert, Divider, Tooltip, FormControl, InputLabel,
} from '@mui/material';
import { DashboardContainer, PulseChip } from './Dashboard.styles';
import { ModernStatCard, ModernSectionHeader, ModernEmptyState } from '../components/ModernUIKit';
import { containerService, type Container } from '../services/logisticsService';

interface ContainerTrackingProps {
    user: any;
    org: string | null;
}

const CONTAINER_STATUSES = ['assigned', 'loaded', 'sealed', 'on_vessel', 'departed', 'in_transit', 'arrived', 'delivered'];
const CONTAINER_TYPES = ['dry', 'reefer', 'open_top', 'flat_rack', 'tank'];
const CONTAINER_SIZES = ['20ft', '40ft', '40ft_hc', '45ft'];

const ContainerTracking = ({ user, org }: ContainerTrackingProps): JSX.Element => {
    const theme = useTheme();
    const [containers, setContainers] = useState<Container[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);

    // Assign container dialog
    const [assignOpen, setAssignOpen] = useState(false);
    const [assignForm, setAssignForm] = useState({ shipmentId: '', containerNumber: '', containerType: 'dry', size: '40ft', currentLocation: '' });
    const [assignLoading, setAssignLoading] = useState(false);

    // Seal container dialog
    const [sealOpen, setSealOpen] = useState(false);
    const [sealForm, setSealForm] = useState({ sealNumber: '', sealType: 'bolt', sealedBy: '' });
    const [sealLoading, setSealLoading] = useState(false);

    // Status update dialog
    const [statusOpen, setStatusOpen] = useState(false);
    const [statusForm, setStatusForm] = useState({ status: '', location: '', remarks: '' });
    const [statusLoading, setStatusLoading] = useState(false);

    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const handleAssignContainer = async () => {
        setAssignLoading(true);
        try {
            const result = await containerService.assignContainer(assignForm);
            const parsed = typeof result === 'string' ? JSON.parse(result) : result;
            setContainers(prev => [...prev, parsed]);
            setAssignOpen(false);
            setAssignForm({ shipmentId: '', containerNumber: '', containerType: 'dry', size: '40ft', currentLocation: '' });
            setSuccessMsg('Container assigned successfully!');
            setTimeout(() => setSuccessMsg(null), 4000);
        } catch (err: any) {
            setError(err.message || 'Failed to assign container');
        } finally {
            setAssignLoading(false);
        }
    };

    const handleSealContainer = async () => {
        if (!selectedContainer?.containerId) return;
        setSealLoading(true);
        try {
            await containerService.sealContainer(selectedContainer.containerId, {
                sealNumber: sealForm.sealNumber,
                sealType: sealForm.sealType,
                sealedBy: sealForm.sealedBy || user?.username,
            });
            setSealOpen(false);
            setSealForm({ sealNumber: '', sealType: 'bolt', sealedBy: '' });
            setSuccessMsg('Container sealed successfully!');
            setTimeout(() => setSuccessMsg(null), 4000);
        } catch (err: any) {
            setError(err.message || 'Failed to seal container');
        } finally {
            setSealLoading(false);
        }
    };

    const handleStatusUpdate = async () => {
        if (!selectedContainer?.containerId) return;
        setStatusLoading(true);
        try {
            await containerService.updateStatus(selectedContainer.containerId, {
                status: statusForm.status,
                location: statusForm.location,
                remarks: statusForm.remarks,
            });
            setStatusOpen(false);
            setStatusForm({ status: '', location: '', remarks: '' });
            setSuccessMsg('Container status updated!');
            setTimeout(() => setSuccessMsg(null), 4000);
        } catch (err: any) {
            setError(err.message || 'Failed to update status');
        } finally {
            setStatusLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        const map: Record<string, 'default' | 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error'> = {
            assigned: 'info', loaded: 'primary', sealed: 'warning', on_vessel: 'secondary',
            departed: 'primary', in_transit: 'info', arrived: 'success', delivered: 'success',
        };
        return map[status] || 'default';
    };

    const getStatusStep = (status: string) => CONTAINER_STATUSES.indexOf(status);

    const filteredContainers = containers.filter(c => {
        const matchesSearch = !searchTerm || c.containerNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.shipmentId?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const stats = {
        total: containers.length,
        assigned: containers.filter(c => c.status === 'assigned').length,
        inTransit: containers.filter(c => ['on_vessel', 'departed', 'in_transit'].includes(c.status || '')).length,
        delivered: containers.filter(c => c.status === 'delivered' || c.status === 'arrived').length,
    };

    const statCards = [
        { title: 'Total Containers', value: stats.total, icon: <Package size={24} />, color: 'info' as const, trend: { value: 0, direction: 'neutral' as const }, subtitle: 'All containers' },
        { title: 'Assigned', value: stats.assigned, icon: <Plus size={24} />, color: 'warning' as const, trend: { value: 0, direction: 'neutral' as const }, subtitle: 'Awaiting loading' },
        { title: 'In Transit', value: stats.inTransit, icon: <Anchor size={24} />, color: 'primary' as const, trend: { value: 0, direction: 'neutral' as const }, subtitle: 'On vessel' },
        { title: 'Delivered', value: stats.delivered, icon: <MapPin size={24} />, color: 'success' as const, trend: { value: 0, direction: 'neutral' as const }, subtitle: 'Arrived at destination' },
    ];

    return (
        <DashboardContainer className={`organization-${org || 'shipping-line'}`}>
            <ModernSectionHeader
                title="Container Tracking"
                subtitle="Assign, seal, and track containers throughout the export journey."
                action={
                    <Stack direction="row" spacing={1} alignItems="center">
                        <PulseChip label="PHASE 4" size="small" color="primary" />
                        <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => setAssignOpen(true)} sx={{ borderRadius: 2 }}>
                            Assign Container
                        </Button>
                    </Stack>
                }
            />

            {successMsg && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{successMsg}</Alert>}
            {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>{error}</Alert>}

            <Grid container spacing={3} sx={{ mb: 4 }}>
                {statCards.map((stat, i) => (
                    <Grid item xs={12} sm={6} md={3} key={i}><ModernStatCard {...stat} /></Grid>
                ))}
            </Grid>

            <Card sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: theme.shadows[3] }}>
                <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={6}><Typography variant="h6" fontWeight={700}>Container Registry</Typography></Grid>
                        <Grid item xs={12} md={3}>
                            <TextField fullWidth size="small" placeholder="Search containers..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                InputProps={{ startAdornment: <InputAdornment position="start"><Search size={18} /></InputAdornment> }} />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Select fullWidth size="small" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                                <MenuItem value="all">All Status</MenuItem>
                                {CONTAINER_STATUSES.map(s => <MenuItem key={s} value={s}>{s.replace(/_/g, ' ').toUpperCase()}</MenuItem>)}
                            </Select>
                        </Grid>
                    </Grid>
                </Box>
                <CardContent sx={{ p: 0 }}>
                    {loading ? <LinearProgress /> : (
                        <TableContainer sx={{ maxHeight: 600 }}>
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Container #</TableCell>
                                        <TableCell>Shipment</TableCell>
                                        <TableCell>Type / Size</TableCell>
                                        <TableCell>Seal</TableCell>
                                        <TableCell>Location</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredContainers.map(c => (
                                        <TableRow key={c.containerId || c.containerNumber} hover>
                                            <TableCell sx={{ fontWeight: 600, fontFamily: 'monospace' }}>{c.containerNumber}</TableCell>
                                            <TableCell>{c.shipmentId}</TableCell>
                                            <TableCell>{c.containerType} / {c.size || '40ft'}</TableCell>
                                            <TableCell>{c.sealNumber ? <Chip label={c.sealNumber} size="small" icon={<Lock size={12} />} /> : '—'}</TableCell>
                                            <TableCell>
                                                <Stack direction="row" alignItems="center" spacing={0.5}>
                                                    <MapPin size={14} color={theme.palette.text.secondary} />
                                                    <Typography variant="body2">{c.currentLocation || 'Unknown'}</Typography>
                                                </Stack>
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={(c.status || 'assigned').replace(/_/g, ' ').toUpperCase()} color={getStatusColor(c.status || 'assigned')} size="small" sx={{ fontWeight: 600, borderRadius: 2 }} />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                                    <Tooltip title="View Details">
                                                        <IconButton size="small" onClick={() => { setSelectedContainer(c); setDetailOpen(true); }}><Eye size={16} /></IconButton>
                                                    </Tooltip>
                                                    {!c.sealNumber && (
                                                        <Tooltip title="Seal Container">
                                                            <IconButton size="small" color="warning" onClick={() => { setSelectedContainer(c); setSealOpen(true); }}><Lock size={16} /></IconButton>
                                                        </Tooltip>
                                                    )}
                                                    <Tooltip title="Update Status">
                                                        <IconButton size="small" color="primary" onClick={() => { setSelectedContainer(c); setStatusOpen(true); }}><RefreshCw size={16} /></IconButton>
                                                    </Tooltip>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {filteredContainers.length === 0 && (
                                        <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                                            <ModernEmptyState title="No Containers Found" description="Assign a container to get started." icon={<Package />} />
                                        </TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </CardContent>
            </Card>

            {/* Assign Container Dialog */}
            <Dialog open={assignOpen} onClose={() => !assignLoading && setAssignOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Assign Container to Shipment</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField label="Shipment ID" fullWidth value={assignForm.shipmentId} onChange={e => setAssignForm({ ...assignForm, shipmentId: e.target.value })} required />
                        <TextField label="Container Number" fullWidth value={assignForm.containerNumber} onChange={e => setAssignForm({ ...assignForm, containerNumber: e.target.value })} required placeholder="e.g. MSKU1234567" />
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Type</InputLabel>
                                    <Select value={assignForm.containerType} label="Type" onChange={e => setAssignForm({ ...assignForm, containerType: e.target.value })}>
                                        {CONTAINER_TYPES.map(t => <MenuItem key={t} value={t}>{t.replace(/_/g, ' ').toUpperCase()}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Size</InputLabel>
                                    <Select value={assignForm.size} label="Size" onChange={e => setAssignForm({ ...assignForm, size: e.target.value })}>
                                        {CONTAINER_SIZES.map(s => <MenuItem key={s} value={s}>{s.toUpperCase()}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                        <TextField label="Current Location" fullWidth value={assignForm.currentLocation} onChange={e => setAssignForm({ ...assignForm, currentLocation: e.target.value })} placeholder="e.g. Warehouse A, Addis Ababa" />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setAssignOpen(false)} disabled={assignLoading}>Cancel</Button>
                    <Button variant="contained" onClick={handleAssignContainer} disabled={assignLoading || !assignForm.shipmentId || !assignForm.containerNumber}>
                        {assignLoading ? 'Assigning...' : 'Assign Container'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Seal Container Dialog */}
            <Dialog open={sealOpen} onClose={() => !sealLoading && setSealOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Seal Container — {selectedContainer?.containerNumber}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField label="Seal Number" fullWidth value={sealForm.sealNumber} onChange={e => setSealForm({ ...sealForm, sealNumber: e.target.value })} required placeholder="e.g. SEAL-001234" />
                        <FormControl fullWidth>
                            <InputLabel>Seal Type</InputLabel>
                            <Select value={sealForm.sealType} label="Seal Type" onChange={e => setSealForm({ ...sealForm, sealType: e.target.value })}>
                                <MenuItem value="bolt">Bolt Seal</MenuItem>
                                <MenuItem value="cable">Cable Seal</MenuItem>
                                <MenuItem value="padlock">Padlock Seal</MenuItem>
                                <MenuItem value="barrier">Barrier Seal</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField label="Sealed By" fullWidth value={sealForm.sealedBy || user?.username} onChange={e => setSealForm({ ...sealForm, sealedBy: e.target.value })} />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setSealOpen(false)} disabled={sealLoading}>Cancel</Button>
                    <Button variant="contained" color="warning" onClick={handleSealContainer} disabled={sealLoading || !sealForm.sealNumber}>
                        {sealLoading ? 'Sealing...' : 'Seal Container'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Status Update Dialog */}
            <Dialog open={statusOpen} onClose={() => !statusLoading && setStatusOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Update Status — {selectedContainer?.containerNumber}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <FormControl fullWidth>
                            <InputLabel>New Status</InputLabel>
                            <Select value={statusForm.status} label="New Status" onChange={e => setStatusForm({ ...statusForm, status: e.target.value })}>
                                {CONTAINER_STATUSES.map(s => <MenuItem key={s} value={s}>{s.replace(/_/g, ' ').toUpperCase()}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <TextField label="Location" fullWidth value={statusForm.location} onChange={e => setStatusForm({ ...statusForm, location: e.target.value })} placeholder="e.g. Djibouti Port" />
                        <TextField label="Remarks" fullWidth multiline rows={2} value={statusForm.remarks} onChange={e => setStatusForm({ ...statusForm, remarks: e.target.value })} />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setStatusOpen(false)} disabled={statusLoading}>Cancel</Button>
                    <Button variant="contained" onClick={handleStatusUpdate} disabled={statusLoading || !statusForm.status || !statusForm.location}>
                        {statusLoading ? 'Updating...' : 'Update Status'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Container Detail Dialog */}
            <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Package size={24} color={theme.palette.primary.main} />
                        <span>Container Details — {selectedContainer?.containerNumber}</span>
                    </Stack>
                </DialogTitle>
                <DialogContent>
                    {selectedContainer && (
                        <Stack spacing={3} sx={{ mt: 1 }}>
                            <Stepper activeStep={getStatusStep(selectedContainer.status || 'assigned')} alternativeLabel>
                                {CONTAINER_STATUSES.map(label => (
                                    <Step key={label}><StepLabel>{label.replace(/_/g, ' ').toUpperCase()}</StepLabel></Step>
                                ))}
                            </Stepper>
                            <Divider />
                            <Grid container spacing={2}>
                                <Grid item xs={6}><Typography variant="caption" color="text.secondary">Container #</Typography><Typography fontWeight={600}>{selectedContainer.containerNumber}</Typography></Grid>
                                <Grid item xs={6}><Typography variant="caption" color="text.secondary">Shipment</Typography><Typography fontWeight={600}>{selectedContainer.shipmentId}</Typography></Grid>
                                <Grid item xs={6}><Typography variant="caption" color="text.secondary">Type / Size</Typography><Typography>{selectedContainer.containerType} / {selectedContainer.size || '40ft'}</Typography></Grid>
                                <Grid item xs={6}><Typography variant="caption" color="text.secondary">Status</Typography><Chip label={(selectedContainer.status || 'assigned').replace(/_/g, ' ').toUpperCase()} color={getStatusColor(selectedContainer.status || 'assigned')} size="small" /></Grid>
                                <Grid item xs={6}><Typography variant="caption" color="text.secondary">Seal Number</Typography><Typography>{selectedContainer.sealNumber || '—'}</Typography></Grid>
                                <Grid item xs={6}><Typography variant="caption" color="text.secondary">Current Location</Typography><Typography>{selectedContainer.currentLocation || '—'}</Typography></Grid>
                            </Grid>
                            {selectedContainer.statusHistory && selectedContainer.statusHistory.length > 0 && (
                                <>
                                    <Divider />
                                    <Typography variant="subtitle2" fontWeight={700}>Status History</Typography>
                                    <TableContainer component={Paper} variant="outlined">
                                        <Table size="small">
                                            <TableHead><TableRow><TableCell>Status</TableCell><TableCell>Location</TableCell><TableCell>Time</TableCell><TableCell>Remarks</TableCell></TableRow></TableHead>
                                            <TableBody>
                                                {selectedContainer.statusHistory.map((h, i) => (
                                                    <TableRow key={i}>
                                                        <TableCell><Chip label={h.status.replace(/_/g, ' ').toUpperCase()} size="small" /></TableCell>
                                                        <TableCell>{h.location}</TableCell>
                                                        <TableCell>{new Date(h.timestamp).toLocaleString()}</TableCell>
                                                        <TableCell>{h.remarks || '—'}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </>
                            )}
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDetailOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </DashboardContainer>
    );
};

export default ContainerTracking;
