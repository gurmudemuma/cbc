import { useState } from 'react';
import { FileText, Plus, Eye, Search, Truck, ClipboardCheck, Shield, Send } from 'lucide-react';
import {
    Box, Button, Card, CardContent, Chip, Dialog, DialogContent, DialogTitle, DialogActions,
    Grid, IconButton, InputAdornment, LinearProgress, MenuItem, Select, Stack, Tab, Tabs,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField,
    Typography, useTheme, Alert, Divider, Tooltip, FormControl, InputLabel, Paper,
} from '@mui/material';
import { DashboardContainer, PulseChip } from './Dashboard.styles';
import { ModernStatCard, ModernSectionHeader, ModernEmptyState } from '../components/ModernUIKit';
import { shippingService, fumigationService, type ShippingInstruction, type BillOfLading, type FumigationCertificate } from '../services/logisticsService';

interface ShippingDocumentsProps { user: any; org: string | null; }

const ShippingDocuments = ({ user, org }: ShippingDocumentsProps): JSX.Element => {
    const theme = useTheme();
    const [activeTab, setActiveTab] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [instructions, setInstructions] = useState<ShippingInstruction[]>([]);
    const [bols, setBols] = useState<BillOfLading[]>([]);
    const [fumigations, setFumigations] = useState<FumigationCertificate[]>([]);

    // Shipping Instructions form
    const [siOpen, setSiOpen] = useState(false);
    const [siForm, setSiForm] = useState({ shipmentId: '', shippingLine: '', bookingNumber: '', containerType: '40ft', containerCount: '1', portOfLoading: '', portOfDischarge: '', finalDestination: '', cargoDescription: 'Coffee beans', grossWeight: '', netWeight: '' });
    const [siLoading, setSiLoading] = useState(false);

    // B/L form
    const [blOpen, setBlOpen] = useState(false);
    const [blForm, setBlForm] = useState({ shipmentId: '', instructionId: '', shipperName: '', shipperAddress: '', shipperCountry: 'Ethiopia', consigneeName: '', consigneeAddress: '', consigneeCountry: '', vesselName: '', voyageNumber: '', portOfLoading: '', portOfDischarge: '', containerNumber: '', sealNumber: '', packages: '', description: 'Coffee beans in jute bags', grossWeight: '', freightTerms: 'prepaid', blType: 'original', issuedBy: '' });
    const [blLoading, setBlLoading] = useState(false);

    // Fumigation form
    const [fumOpen, setFumOpen] = useState(false);
    const [fumForm, setFumForm] = useState({ shipmentId: '', containerId: '', fumigationType: 'methyl_bromide', issuingCompany: '', companyLicense: '' });
    const [fumLoading, setFumLoading] = useState(false);

    // Detail dialog
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailData, setDetailData] = useState<any>(null);
    const [detailType, setDetailType] = useState<string>('');

    const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(null), 4000); };

    const handleCreateSI = async () => {
        setSiLoading(true);
        try {
            const result = await shippingService.createInstructions({ ...siForm, containerCount: parseInt(siForm.containerCount), grossWeight: parseFloat(siForm.grossWeight), netWeight: siForm.netWeight ? parseFloat(siForm.netWeight) : undefined, exporterId: user?.exporterId || user?.username });
            const parsed = typeof result === 'string' ? JSON.parse(result) : result;
            setInstructions(prev => [...prev, parsed]);
            setSiOpen(false);
            showSuccess('Shipping instructions created!');
        } catch (err: any) { setError(err.message); }
        finally { setSiLoading(false); }
    };

    const handleCreateBL = async () => {
        setBlLoading(true);
        try {
            const blData: Partial<BillOfLading> = {
                shipmentId: blForm.shipmentId, instructionId: blForm.instructionId, blType: blForm.blType,
                shipper: { name: blForm.shipperName, address: blForm.shipperAddress, country: blForm.shipperCountry, contact: '' },
                consignee: { name: blForm.consigneeName, address: blForm.consigneeAddress, country: blForm.consigneeCountry, contact: '' },
                vesselName: blForm.vesselName, voyageNumber: blForm.voyageNumber,
                portOfLoading: blForm.portOfLoading, portOfDischarge: blForm.portOfDischarge,
                containers: [{ containerNumber: blForm.containerNumber, sealNumber: blForm.sealNumber, numberOfPackages: parseInt(blForm.packages) || 320, description: blForm.description, grossWeight: parseFloat(blForm.grossWeight) || 20000 }],
                freightTerms: blForm.freightTerms, numberOfOriginals: 3, issuedBy: blForm.issuedBy,
            };
            const result = await shippingService.generateBillOfLading(blData);
            const parsed = typeof result === 'string' ? JSON.parse(result) : result;
            setBols(prev => [...prev, parsed]);
            setBlOpen(false);
            showSuccess('Bill of Lading generated!');
        } catch (err: any) { setError(err.message); }
        finally { setBlLoading(false); }
    };

    const handleRequestFumigation = async () => {
        setFumLoading(true);
        try {
            const result = await fumigationService.requestFumigation(fumForm);
            const parsed = typeof result === 'string' ? JSON.parse(result) : result;
            setFumigations(prev => [...prev, parsed]);
            setFumOpen(false);
            showSuccess('Fumigation requested!');
        } catch (err: any) { setError(err.message); }
        finally { setFumLoading(false); }
    };

    const getStatusColor = (s: string): 'default' | 'primary' | 'info' | 'success' | 'warning' => ({ draft: 'default' as const, pending: 'info' as const, confirmed: 'success' as const, issued: 'success' as const, requested: 'warning' as const, created: 'info' as const }[s] || 'primary');

    const stats = { si: instructions.length, bl: bols.length, fum: fumigations.length, total: instructions.length + bols.length + fumigations.length };

    return (
        <DashboardContainer className={`organization-${org || 'shipping-line'}`}>
            <ModernSectionHeader title="Shipping Documents" subtitle="Manage shipping instructions, bills of lading, and fumigation certificates."
                action={<Stack direction="row" spacing={1} alignItems="center"><PulseChip label="PHASE 4" size="small" color="primary" /></Stack>} />

            {successMsg && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{successMsg}</Alert>}
            {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>{error}</Alert>}

            <Grid container spacing={3} sx={{ mb: 4 }}>
                {[
                    { title: 'Shipping Instructions', value: stats.si, icon: <FileText size={24} />, color: 'info' as const },
                    { title: 'Bills of Lading', value: stats.bl, icon: <ClipboardCheck size={24} />, color: 'primary' as const },
                    { title: 'Fumigation Certs', value: stats.fum, icon: <Shield size={24} />, color: 'warning' as const },
                    { title: 'Total Documents', value: stats.total, icon: <Truck size={24} />, color: 'success' as const },
                ].map((stat, i) => (
                    <Grid item xs={12} sm={6} md={3} key={i}><ModernStatCard {...stat} trend={{ value: 0, direction: 'neutral' as const }} subtitle="" /></Grid>
                ))}
            </Grid>

            <Card sx={{ borderRadius: 4, boxShadow: theme.shadows[3] }}>
                <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ px: 3, pt: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
                    <Tab label="Shipping Instructions" icon={<FileText size={16} />} iconPosition="start" />
                    <Tab label="Bill of Lading" icon={<ClipboardCheck size={16} />} iconPosition="start" />
                    <Tab label="Fumigation Certificates" icon={<Shield size={16} />} iconPosition="start" />
                </Tabs>

                <CardContent>
                    {/* Tab 0: Shipping Instructions */}
                    {activeTab === 0 && (
                        <>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                                <Typography variant="subtitle1" fontWeight={600}>Shipping Instructions</Typography>
                                <Button variant="contained" size="small" startIcon={<Plus size={16} />} onClick={() => setSiOpen(true)}>Create Instructions</Button>
                            </Stack>
                            <TableContainer><Table>
                                <TableHead><TableRow><TableCell>ID</TableCell><TableCell>Shipment</TableCell><TableCell>Shipping Line</TableCell><TableCell>Booking</TableCell><TableCell>Route</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
                                <TableBody>
                                    {instructions.map(si => (
                                        <TableRow key={si.instructionId} hover>
                                            <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{si.instructionId}</TableCell>
                                            <TableCell>{si.shipmentId}</TableCell>
                                            <TableCell>{si.shippingLine}</TableCell>
                                            <TableCell>{si.bookingNumber}</TableCell>
                                            <TableCell>{si.portOfLoading} → {si.portOfDischarge}</TableCell>
                                            <TableCell><Chip label={(si.status || 'created').toUpperCase()} color={getStatusColor(si.status || 'created')} size="small" /></TableCell>
                                            <TableCell align="right"><Tooltip title="View"><IconButton size="small" onClick={() => { setDetailData(si); setDetailType('si'); setDetailOpen(true); }}><Eye size={16} /></IconButton></Tooltip></TableCell>
                                        </TableRow>
                                    ))}
                                    {instructions.length === 0 && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><ModernEmptyState title="No Instructions" description="Create shipping instructions." icon={<FileText />} /></TableCell></TableRow>}
                                </TableBody>
                            </Table></TableContainer>
                        </>
                    )}

                    {/* Tab 1: Bills of Lading */}
                    {activeTab === 1 && (
                        <>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                                <Typography variant="subtitle1" fontWeight={600}>Bills of Lading</Typography>
                                <Button variant="contained" size="small" startIcon={<Plus size={16} />} onClick={() => setBlOpen(true)}>Generate B/L</Button>
                            </Stack>
                            <TableContainer><Table>
                                <TableHead><TableRow><TableCell>B/L Number</TableCell><TableCell>Shipment</TableCell><TableCell>Vessel</TableCell><TableCell>Route</TableCell><TableCell>Type</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
                                <TableBody>
                                    {bols.map(bl => (
                                        <TableRow key={bl.blNumber} hover>
                                            <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{bl.blNumber}</TableCell>
                                            <TableCell>{bl.shipmentId}</TableCell>
                                            <TableCell>{bl.vesselName}</TableCell>
                                            <TableCell>{bl.portOfLoading} → {bl.portOfDischarge}</TableCell>
                                            <TableCell>{bl.blType?.toUpperCase()}</TableCell>
                                            <TableCell><Chip label={(bl.status || 'issued').toUpperCase()} color={getStatusColor(bl.status || 'issued')} size="small" /></TableCell>
                                            <TableCell align="right"><Tooltip title="View"><IconButton size="small" onClick={() => { setDetailData(bl); setDetailType('bl'); setDetailOpen(true); }}><Eye size={16} /></IconButton></Tooltip></TableCell>
                                        </TableRow>
                                    ))}
                                    {bols.length === 0 && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><ModernEmptyState title="No Bills of Lading" description="Generate a B/L." icon={<ClipboardCheck />} /></TableCell></TableRow>}
                                </TableBody>
                            </Table></TableContainer>
                        </>
                    )}

                    {/* Tab 2: Fumigation */}
                    {activeTab === 2 && (
                        <>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                                <Typography variant="subtitle1" fontWeight={600}>Fumigation Certificates</Typography>
                                <Button variant="contained" size="small" startIcon={<Plus size={16} />} onClick={() => setFumOpen(true)}>Request Fumigation</Button>
                            </Stack>
                            <TableContainer><Table>
                                <TableHead><TableRow><TableCell>ID</TableCell><TableCell>Shipment</TableCell><TableCell>Container</TableCell><TableCell>Type</TableCell><TableCell>Company</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
                                <TableBody>
                                    {fumigations.map(f => (
                                        <TableRow key={f.fumigationId} hover>
                                            <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{f.fumigationId}</TableCell>
                                            <TableCell>{f.shipmentId}</TableCell>
                                            <TableCell>{f.containerId}</TableCell>
                                            <TableCell>{f.fumigationType?.replace(/_/g, ' ')}</TableCell>
                                            <TableCell>{f.issuingCompany}</TableCell>
                                            <TableCell><Chip label={(f.status || 'requested').toUpperCase()} color={getStatusColor(f.status || 'requested')} size="small" /></TableCell>
                                            <TableCell align="right"><Tooltip title="View"><IconButton size="small" onClick={() => { setDetailData(f); setDetailType('fum'); setDetailOpen(true); }}><Eye size={16} /></IconButton></Tooltip></TableCell>
                                        </TableRow>
                                    ))}
                                    {fumigations.length === 0 && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><ModernEmptyState title="No Certificates" description="Request a fumigation." icon={<Shield />} /></TableCell></TableRow>}
                                </TableBody>
                            </Table></TableContainer>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* SI Dialog */}
            <Dialog open={siOpen} onClose={() => !siLoading && setSiOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Create Shipping Instructions</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <Grid container spacing={2}><Grid item xs={6}><TextField label="Shipment ID" fullWidth value={siForm.shipmentId} onChange={e => setSiForm({ ...siForm, shipmentId: e.target.value })} required /></Grid><Grid item xs={6}><TextField label="Shipping Line" fullWidth value={siForm.shippingLine} onChange={e => setSiForm({ ...siForm, shippingLine: e.target.value })} required /></Grid></Grid>
                        <Grid container spacing={2}><Grid item xs={6}><TextField label="Booking Number" fullWidth value={siForm.bookingNumber} onChange={e => setSiForm({ ...siForm, bookingNumber: e.target.value })} required /></Grid><Grid item xs={3}><TextField label="Container Type" fullWidth value={siForm.containerType} onChange={e => setSiForm({ ...siForm, containerType: e.target.value })} /></Grid><Grid item xs={3}><TextField label="Count" fullWidth type="number" value={siForm.containerCount} onChange={e => setSiForm({ ...siForm, containerCount: e.target.value })} /></Grid></Grid>
                        <Divider><Typography variant="caption">Route</Typography></Divider>
                        <Grid container spacing={2}><Grid item xs={4}><TextField label="Port of Loading" fullWidth value={siForm.portOfLoading} onChange={e => setSiForm({ ...siForm, portOfLoading: e.target.value })} required /></Grid><Grid item xs={4}><TextField label="Port of Discharge" fullWidth value={siForm.portOfDischarge} onChange={e => setSiForm({ ...siForm, portOfDischarge: e.target.value })} required /></Grid><Grid item xs={4}><TextField label="Final Destination" fullWidth value={siForm.finalDestination} onChange={e => setSiForm({ ...siForm, finalDestination: e.target.value })} /></Grid></Grid>
                        <Divider><Typography variant="caption">Cargo</Typography></Divider>
                        <Grid container spacing={2}><Grid item xs={4}><TextField label="Cargo Description" fullWidth value={siForm.cargoDescription} onChange={e => setSiForm({ ...siForm, cargoDescription: e.target.value })} /></Grid><Grid item xs={4}><TextField label="Gross Weight (kg)" fullWidth type="number" value={siForm.grossWeight} onChange={e => setSiForm({ ...siForm, grossWeight: e.target.value })} /></Grid><Grid item xs={4}><TextField label="Net Weight (kg)" fullWidth type="number" value={siForm.netWeight} onChange={e => setSiForm({ ...siForm, netWeight: e.target.value })} /></Grid></Grid>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}><Button onClick={() => setSiOpen(false)} disabled={siLoading}>Cancel</Button><Button variant="contained" onClick={handleCreateSI} disabled={siLoading || !siForm.shipmentId || !siForm.shippingLine}>{siLoading ? 'Creating...' : 'Create Instructions'}</Button></DialogActions>
            </Dialog>

            {/* B/L Dialog */}
            <Dialog open={blOpen} onClose={() => !blLoading && setBlOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Generate Bill of Lading</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <Grid container spacing={2}><Grid item xs={6}><TextField label="Shipment ID" fullWidth value={blForm.shipmentId} onChange={e => setBlForm({ ...blForm, shipmentId: e.target.value })} required /></Grid><Grid item xs={6}><TextField label="Instruction ID" fullWidth value={blForm.instructionId} onChange={e => setBlForm({ ...blForm, instructionId: e.target.value })} required /></Grid></Grid>
                        <Divider><Typography variant="caption">Shipper</Typography></Divider>
                        <Grid container spacing={2}><Grid item xs={6}><TextField label="Name" fullWidth value={blForm.shipperName} onChange={e => setBlForm({ ...blForm, shipperName: e.target.value })} required /></Grid><Grid item xs={6}><TextField label="Address" fullWidth value={blForm.shipperAddress} onChange={e => setBlForm({ ...blForm, shipperAddress: e.target.value })} /></Grid></Grid>
                        <Divider><Typography variant="caption">Consignee</Typography></Divider>
                        <Grid container spacing={2}><Grid item xs={4}><TextField label="Name" fullWidth value={blForm.consigneeName} onChange={e => setBlForm({ ...blForm, consigneeName: e.target.value })} required /></Grid><Grid item xs={4}><TextField label="Address" fullWidth value={blForm.consigneeAddress} onChange={e => setBlForm({ ...blForm, consigneeAddress: e.target.value })} /></Grid><Grid item xs={4}><TextField label="Country" fullWidth value={blForm.consigneeCountry} onChange={e => setBlForm({ ...blForm, consigneeCountry: e.target.value })} /></Grid></Grid>
                        <Divider><Typography variant="caption">Vessel & Route</Typography></Divider>
                        <Grid container spacing={2}><Grid item xs={4}><TextField label="Vessel Name" fullWidth value={blForm.vesselName} onChange={e => setBlForm({ ...blForm, vesselName: e.target.value })} /></Grid><Grid item xs={4}><TextField label="Port of Loading" fullWidth value={blForm.portOfLoading} onChange={e => setBlForm({ ...blForm, portOfLoading: e.target.value })} /></Grid><Grid item xs={4}><TextField label="Port of Discharge" fullWidth value={blForm.portOfDischarge} onChange={e => setBlForm({ ...blForm, portOfDischarge: e.target.value })} /></Grid></Grid>
                        <Divider><Typography variant="caption">Container</Typography></Divider>
                        <Grid container spacing={2}><Grid item xs={4}><TextField label="Container #" fullWidth value={blForm.containerNumber} onChange={e => setBlForm({ ...blForm, containerNumber: e.target.value })} /></Grid><Grid item xs={4}><TextField label="Seal #" fullWidth value={blForm.sealNumber} onChange={e => setBlForm({ ...blForm, sealNumber: e.target.value })} /></Grid><Grid item xs={4}><TextField label="Gross Weight" fullWidth type="number" value={blForm.grossWeight} onChange={e => setBlForm({ ...blForm, grossWeight: e.target.value })} /></Grid></Grid>
                        <Grid container spacing={2}><Grid item xs={4}><FormControl fullWidth><InputLabel>Freight Terms</InputLabel><Select value={blForm.freightTerms} label="Freight Terms" onChange={e => setBlForm({ ...blForm, freightTerms: e.target.value })}><MenuItem value="prepaid">Prepaid</MenuItem><MenuItem value="collect">Collect</MenuItem></Select></FormControl></Grid><Grid item xs={4}><FormControl fullWidth><InputLabel>B/L Type</InputLabel><Select value={blForm.blType} label="B/L Type" onChange={e => setBlForm({ ...blForm, blType: e.target.value })}><MenuItem value="original">Original</MenuItem><MenuItem value="copy">Copy</MenuItem><MenuItem value="seaway">Seaway Bill</MenuItem></Select></FormControl></Grid><Grid item xs={4}><TextField label="Issued By" fullWidth value={blForm.issuedBy} onChange={e => setBlForm({ ...blForm, issuedBy: e.target.value })} /></Grid></Grid>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}><Button onClick={() => setBlOpen(false)} disabled={blLoading}>Cancel</Button><Button variant="contained" onClick={handleCreateBL} disabled={blLoading || !blForm.shipmentId || !blForm.instructionId}>{blLoading ? 'Generating...' : 'Generate B/L'}</Button></DialogActions>
            </Dialog>

            {/* Fumigation Dialog */}
            <Dialog open={fumOpen} onClose={() => !fumLoading && setFumOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Request Fumigation</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField label="Shipment ID" fullWidth value={fumForm.shipmentId} onChange={e => setFumForm({ ...fumForm, shipmentId: e.target.value })} required />
                        <TextField label="Container ID" fullWidth value={fumForm.containerId} onChange={e => setFumForm({ ...fumForm, containerId: e.target.value })} required />
                        <FormControl fullWidth><InputLabel>Fumigation Type</InputLabel><Select value={fumForm.fumigationType} label="Fumigation Type" onChange={e => setFumForm({ ...fumForm, fumigationType: e.target.value })}><MenuItem value="methyl_bromide">Methyl Bromide</MenuItem><MenuItem value="phosphine">Phosphine</MenuItem><MenuItem value="heat_treatment">Heat Treatment</MenuItem></Select></FormControl>
                        <TextField label="Issuing Company" fullWidth value={fumForm.issuingCompany} onChange={e => setFumForm({ ...fumForm, issuingCompany: e.target.value })} required />
                        <TextField label="Company License" fullWidth value={fumForm.companyLicense} onChange={e => setFumForm({ ...fumForm, companyLicense: e.target.value })} required />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}><Button onClick={() => setFumOpen(false)} disabled={fumLoading}>Cancel</Button><Button variant="contained" onClick={handleRequestFumigation} disabled={fumLoading || !fumForm.shipmentId || !fumForm.containerId}>{fumLoading ? 'Requesting...' : 'Request Fumigation'}</Button></DialogActions>
            </Dialog>

            {/* Detail Dialog */}
            <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>{detailType === 'si' ? 'Shipping Instruction Details' : detailType === 'bl' ? 'Bill of Lading Details' : 'Fumigation Certificate Details'}</DialogTitle>
                <DialogContent>
                    {detailData && (
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            <Paper variant="outlined" sx={{ p: 2 }}>
                                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                    {JSON.stringify(detailData, null, 2)}
                                </pre>
                            </Paper>
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}><Button onClick={() => setDetailOpen(false)}>Close</Button></DialogActions>
            </Dialog>
        </DashboardContainer>
    );
};

export default ShippingDocuments;
