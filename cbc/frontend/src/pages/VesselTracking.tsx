import { useState } from 'react';
import { Ship, Plus, RefreshCw, Eye, Search, Navigation, Clock, Anchor, Globe } from 'lucide-react';
import {
    Box, Button, Card, CardContent, Chip, Dialog, DialogContent, DialogTitle, DialogActions,
    Grid, IconButton, InputAdornment, LinearProgress, MenuItem, Select, Stack, Step, StepLabel,
    Stepper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField,
    Typography, useTheme, Alert, Divider, Tooltip, FormControl, InputLabel, Paper,
} from '@mui/material';
import { DashboardContainer, PulseChip } from './Dashboard.styles';
import { ModernStatCard, ModernSectionHeader, ModernEmptyState } from '../components/ModernUIKit';
import { vesselService, type Vessel } from '../services/logisticsService';

interface VesselTrackingProps { user: any; org: string | null; }
const VESSEL_STATUSES = ['scheduled', 'departed', 'in_transit', 'arrived'];

const VesselTracking = ({ user, org }: VesselTrackingProps): JSX.Element => {
    const theme = useTheme();
    const [vessels, setVessels] = useState<Vessel[]>([]);
    const [loading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);
    const [createForm, setCreateForm] = useState({ vesselName: '', imoNumber: '', voyageNumber: '', shippingLine: '', departurePort: '', departurePortCode: '', arrivalPort: '', arrivalPortCode: '', scheduledDeparture: '', estimatedArrival: '' });
    const [createLoading, setCreateLoading] = useState(false);
    const [locationOpen, setLocationOpen] = useState(false);
    const [locationForm, setLocationForm] = useState({ latitude: '', longitude: '', port: '', speed: '', heading: '' });
    const [locationLoading, setLocationLoading] = useState(false);
    const [statusOpen, setStatusOpen] = useState(false);
    const [statusForm, setStatusForm] = useState({ status: '' });
    const [statusLoading, setStatusLoading] = useState(false);

    const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(null), 4000); };

    const handleCreateVessel = async () => {
        setCreateLoading(true);
        try {
            const result = await vesselService.createVessel({ ...createForm, scheduledDeparture: createForm.scheduledDeparture ? new Date(createForm.scheduledDeparture).toISOString() : undefined, estimatedArrival: createForm.estimatedArrival ? new Date(createForm.estimatedArrival).toISOString() : undefined });
            const parsed = typeof result === 'string' ? JSON.parse(result) : result;
            setVessels(prev => [...prev, parsed]);
            setCreateOpen(false);
            showSuccess('Vessel created successfully!');
        } catch (err: any) { setError(err.message || 'Failed to create vessel'); }
        finally { setCreateLoading(false); }
    };

    const handleLocationUpdate = async () => {
        if (!selectedVessel?.vesselId) return;
        setLocationLoading(true);
        try {
            await vesselService.updateLocation(selectedVessel.vesselId, { latitude: parseFloat(locationForm.latitude), longitude: parseFloat(locationForm.longitude), port: locationForm.port || undefined, speed: locationForm.speed ? parseFloat(locationForm.speed) : undefined, heading: locationForm.heading ? parseFloat(locationForm.heading) : undefined });
            setLocationOpen(false);
            showSuccess('Vessel location updated!');
        } catch (err: any) { setError(err.message || 'Failed to update location'); }
        finally { setLocationLoading(false); }
    };

    const handleStatusUpdate = async () => {
        if (!selectedVessel?.vesselId) return;
        setStatusLoading(true);
        try {
            await vesselService.updateStatus(selectedVessel.vesselId, { status: statusForm.status });
            setStatusOpen(false);
            showSuccess('Vessel status updated!');
        } catch (err: any) { setError(err.message || 'Failed to update status'); }
        finally { setStatusLoading(false); }
    };

    const getStatusColor = (s: string): 'default' | 'primary' | 'info' | 'success' | 'warning' => ({ scheduled: 'info' as const, departed: 'primary' as const, in_transit: 'warning' as const, arrived: 'success' as const }[s] || 'default');
    const filteredVessels = vessels.filter(v => { const ms = !searchTerm || v.vesselName?.toLowerCase().includes(searchTerm.toLowerCase()) || v.imoNumber?.toLowerCase().includes(searchTerm.toLowerCase()); const mf = statusFilter === 'all' || v.status === statusFilter; return ms && mf; });

    const stats = { total: vessels.length, scheduled: vessels.filter(v => v.status === 'scheduled').length, inTransit: vessels.filter(v => v.status === 'departed' || v.status === 'in_transit').length, arrived: vessels.filter(v => v.status === 'arrived').length };

    return (
        <DashboardContainer className={`organization-${org || 'shipping-line'}`}>
            <ModernSectionHeader title="Vessel Tracking" subtitle="Create, monitor, and track vessels across voyages."
                action={<Stack direction="row" spacing={1} alignItems="center"><PulseChip label="PHASE 4" size="small" color="primary" /><Button variant="contained" startIcon={<Plus size={18} />} onClick={() => setCreateOpen(true)} sx={{ borderRadius: 2 }}>Register Vessel</Button></Stack>} />

            {successMsg && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{successMsg}</Alert>}
            {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>{error}</Alert>}

            <Grid container spacing={3} sx={{ mb: 4 }}>
                {[
                    { title: 'Total Vessels', value: stats.total, icon: <Ship size={24} />, color: 'info' as const },
                    { title: 'Scheduled', value: stats.scheduled, icon: <Clock size={24} />, color: 'warning' as const },
                    { title: 'In Transit', value: stats.inTransit, icon: <Navigation size={24} />, color: 'primary' as const },
                    { title: 'Arrived', value: stats.arrived, icon: <Anchor size={24} />, color: 'success' as const },
                ].map((stat, i) => (
                    <Grid item xs={12} sm={6} md={3} key={i}><ModernStatCard {...stat} trend={{ value: 0, direction: 'neutral' as const }} subtitle="" /></Grid>
                ))}
            </Grid>

            <Card sx={{ borderRadius: 4, boxShadow: theme.shadows[3] }}>
                <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={6}><Typography variant="h6" fontWeight={700}>Vessel Fleet</Typography></Grid>
                        <Grid item xs={12} md={3}><TextField fullWidth size="small" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><Search size={18} /></InputAdornment> }} /></Grid>
                        <Grid item xs={12} md={3}><Select fullWidth size="small" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><MenuItem value="all">All Status</MenuItem>{VESSEL_STATUSES.map(s => <MenuItem key={s} value={s}>{s.replace(/_/g, ' ').toUpperCase()}</MenuItem>)}</Select></Grid>
                    </Grid>
                </Box>
                <CardContent sx={{ p: 0 }}>
                    {loading ? <LinearProgress /> : (
                        <TableContainer>
                            <Table stickyHeader>
                                <TableHead><TableRow><TableCell>Vessel</TableCell><TableCell>IMO</TableCell><TableCell>Voyage</TableCell><TableCell>Line</TableCell><TableCell>Route</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
                                <TableBody>
                                    {filteredVessels.map(v => (
                                        <TableRow key={v.vesselId || v.imoNumber} hover>
                                            <TableCell sx={{ fontWeight: 600 }}>{v.vesselName}</TableCell>
                                            <TableCell sx={{ fontFamily: 'monospace' }}>{v.imoNumber}</TableCell>
                                            <TableCell>{v.voyageNumber}</TableCell>
                                            <TableCell>{v.shippingLine}</TableCell>
                                            <TableCell><Stack direction="row" spacing={0.5} alignItems="center"><Typography variant="body2">{v.departurePort}</Typography><Navigation size={12} /><Typography variant="body2">{v.arrivalPort}</Typography></Stack></TableCell>
                                            <TableCell><Chip label={(v.status || 'scheduled').replace(/_/g, ' ').toUpperCase()} color={getStatusColor(v.status || 'scheduled')} size="small" sx={{ fontWeight: 600 }} /></TableCell>
                                            <TableCell align="right">
                                                <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                                    <Tooltip title="Details"><IconButton size="small" onClick={() => { setSelectedVessel(v); setDetailOpen(true); }}><Eye size={16} /></IconButton></Tooltip>
                                                    <Tooltip title="Location"><IconButton size="small" color="info" onClick={() => { setSelectedVessel(v); setLocationOpen(true); }}><Globe size={16} /></IconButton></Tooltip>
                                                    <Tooltip title="Status"><IconButton size="small" color="primary" onClick={() => { setSelectedVessel(v); setStatusOpen(true); }}><RefreshCw size={16} /></IconButton></Tooltip>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {filteredVessels.length === 0 && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}><ModernEmptyState title="No Vessels" description="Register a vessel to begin." icon={<Ship />} /></TableCell></TableRow>}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </CardContent>
            </Card>

            {/* Create Vessel */}
            <Dialog open={createOpen} onClose={() => !createLoading && setCreateOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Register New Vessel</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <Grid container spacing={2}><Grid item xs={6}><TextField label="Vessel Name" fullWidth value={createForm.vesselName} onChange={e => setCreateForm({ ...createForm, vesselName: e.target.value })} required /></Grid><Grid item xs={6}><TextField label="IMO Number" fullWidth value={createForm.imoNumber} onChange={e => setCreateForm({ ...createForm, imoNumber: e.target.value })} required /></Grid></Grid>
                        <Grid container spacing={2}><Grid item xs={6}><TextField label="Voyage Number" fullWidth value={createForm.voyageNumber} onChange={e => setCreateForm({ ...createForm, voyageNumber: e.target.value })} required /></Grid><Grid item xs={6}><TextField label="Shipping Line" fullWidth value={createForm.shippingLine} onChange={e => setCreateForm({ ...createForm, shippingLine: e.target.value })} required /></Grid></Grid>
                        <Divider><Typography variant="caption" color="text.secondary">Route</Typography></Divider>
                        <Grid container spacing={2}><Grid item xs={6}><TextField label="Departure Port" fullWidth value={createForm.departurePort} onChange={e => setCreateForm({ ...createForm, departurePort: e.target.value })} required /></Grid><Grid item xs={6}><TextField label="Arrival Port" fullWidth value={createForm.arrivalPort} onChange={e => setCreateForm({ ...createForm, arrivalPort: e.target.value })} required /></Grid></Grid>
                        <Grid container spacing={2}><Grid item xs={6}><TextField label="Scheduled Departure" type="datetime-local" fullWidth InputLabelProps={{ shrink: true }} value={createForm.scheduledDeparture} onChange={e => setCreateForm({ ...createForm, scheduledDeparture: e.target.value })} /></Grid><Grid item xs={6}><TextField label="Estimated Arrival" type="datetime-local" fullWidth InputLabelProps={{ shrink: true }} value={createForm.estimatedArrival} onChange={e => setCreateForm({ ...createForm, estimatedArrival: e.target.value })} /></Grid></Grid>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}><Button onClick={() => setCreateOpen(false)} disabled={createLoading}>Cancel</Button><Button variant="contained" onClick={handleCreateVessel} disabled={createLoading || !createForm.vesselName || !createForm.imoNumber}>{createLoading ? 'Creating...' : 'Register Vessel'}</Button></DialogActions>
            </Dialog>

            {/* Location Update */}
            <Dialog open={locationOpen} onClose={() => !locationLoading && setLocationOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Update Location — {selectedVessel?.vesselName}</DialogTitle>
                <DialogContent><Stack spacing={2} sx={{ mt: 1 }}><Grid container spacing={2}><Grid item xs={6}><TextField label="Latitude" fullWidth type="number" value={locationForm.latitude} onChange={e => setLocationForm({ ...locationForm, latitude: e.target.value })} required /></Grid><Grid item xs={6}><TextField label="Longitude" fullWidth type="number" value={locationForm.longitude} onChange={e => setLocationForm({ ...locationForm, longitude: e.target.value })} required /></Grid></Grid><TextField label="Port" fullWidth value={locationForm.port} onChange={e => setLocationForm({ ...locationForm, port: e.target.value })} /></Stack></DialogContent>
                <DialogActions sx={{ p: 2 }}><Button onClick={() => setLocationOpen(false)} disabled={locationLoading}>Cancel</Button><Button variant="contained" onClick={handleLocationUpdate} disabled={locationLoading || !locationForm.latitude || !locationForm.longitude}>{locationLoading ? 'Updating...' : 'Update Location'}</Button></DialogActions>
            </Dialog>

            {/* Status Update */}
            <Dialog open={statusOpen} onClose={() => !statusLoading && setStatusOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Update Status — {selectedVessel?.vesselName}</DialogTitle>
                <DialogContent><Stack spacing={2} sx={{ mt: 1 }}><FormControl fullWidth><InputLabel>New Status</InputLabel><Select value={statusForm.status} label="New Status" onChange={e => setStatusForm({ status: e.target.value })}>{VESSEL_STATUSES.map(s => <MenuItem key={s} value={s}>{s.replace(/_/g, ' ').toUpperCase()}</MenuItem>)}</Select></FormControl></Stack></DialogContent>
                <DialogActions sx={{ p: 2 }}><Button onClick={() => setStatusOpen(false)} disabled={statusLoading}>Cancel</Button><Button variant="contained" onClick={handleStatusUpdate} disabled={statusLoading || !statusForm.status}>{statusLoading ? 'Updating...' : 'Update Status'}</Button></DialogActions>
            </Dialog>

            {/* Detail Dialog */}
            <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}><Stack direction="row" alignItems="center" spacing={1}><Ship size={24} color={theme.palette.primary.main} /><span>{selectedVessel?.vesselName} — Voyage {selectedVessel?.voyageNumber}</span></Stack></DialogTitle>
                <DialogContent>
                    {selectedVessel && (
                        <Stack spacing={3} sx={{ mt: 1 }}>
                            <Stepper activeStep={VESSEL_STATUSES.indexOf(selectedVessel.status || 'scheduled')} alternativeLabel>{VESSEL_STATUSES.map(l => <Step key={l}><StepLabel>{l.replace(/_/g, ' ').toUpperCase()}</StepLabel></Step>)}</Stepper>
                            <Divider />
                            <Grid container spacing={2}>
                                <Grid item xs={4}><Typography variant="caption" color="text.secondary">Vessel</Typography><Typography fontWeight={600}>{selectedVessel.vesselName}</Typography></Grid>
                                <Grid item xs={4}><Typography variant="caption" color="text.secondary">IMO</Typography><Typography fontWeight={600}>{selectedVessel.imoNumber}</Typography></Grid>
                                <Grid item xs={4}><Typography variant="caption" color="text.secondary">Line</Typography><Typography>{selectedVessel.shippingLine}</Typography></Grid>
                                <Grid item xs={4}><Typography variant="caption" color="text.secondary">Departure</Typography><Typography>{selectedVessel.departurePort}</Typography></Grid>
                                <Grid item xs={4}><Typography variant="caption" color="text.secondary">Arrival</Typography><Typography>{selectedVessel.arrivalPort}</Typography></Grid>
                                <Grid item xs={4}><Typography variant="caption" color="text.secondary">Status</Typography><Chip label={(selectedVessel.status || 'scheduled').replace(/_/g, ' ').toUpperCase()} color={getStatusColor(selectedVessel.status || 'scheduled')} size="small" /></Grid>
                            </Grid>
                            {selectedVessel.locationHistory && selectedVessel.locationHistory.length > 0 && (
                                <><Divider /><Typography variant="subtitle2" fontWeight={700}>Location History</Typography><TableContainer component={Paper} variant="outlined"><Table size="small"><TableHead><TableRow><TableCell>Port</TableCell><TableCell>Coordinates</TableCell><TableCell>Time</TableCell></TableRow></TableHead><TableBody>{selectedVessel.locationHistory.map((loc, i) => (<TableRow key={i}><TableCell>{loc.port || '—'}</TableCell><TableCell sx={{ fontFamily: 'monospace' }}>{loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}</TableCell><TableCell>{new Date(loc.timestamp).toLocaleString()}</TableCell></TableRow>))}</TableBody></Table></TableContainer></>
                            )}
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}><Button onClick={() => setDetailOpen(false)}>Close</Button></DialogActions>
            </Dialog>
        </DashboardContainer>
    );
};

export default VesselTracking;
