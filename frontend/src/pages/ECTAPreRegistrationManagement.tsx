/**
 * ECTA Pre-Registration Management Dashboard
 * For ECTA staff to manage exporter applications and approvals
 */

import React, { useState, useEffect } from 'react';
import { CommonPageProps } from '../types';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Grid,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Visibility,
  Business,
  Science,
  VerifiedUser,
  Description,
  Refresh,
} from '@mui/icons-material';
import ectaPreRegistrationService from '../services/ectaPreRegistration';
import { PageContainer, ManagementPaper } from './ECTAPreRegistrationManagement.styles';

interface ECTAPreRegistrationManagementProps extends CommonPageProps {}

const ECTAPreRegistrationManagement = ({ user, org }: ECTAPreRegistrationManagementProps): JSX.Element => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Data states
  const [pendingProfiles, setPendingProfiles] = useState([]);
  const [pendingLaboratories, setPendingLaboratories] = useState([]);
  const [pendingCompetence, setPendingCompetence] = useState([]);
  const [pendingLicenses, setPendingLicenses] = useState([]);
  const [allExporters, setAllExporters] = useState([]);

  // Dialog states
  const [selectedItem, setSelectedItem] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [certificateData, setCertificateData] = useState({
    certificateNumber: '',
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      switch (activeTab) {
        case 0:
          const profiles = await ectaPreRegistrationService.getPendingApplications();
          setPendingProfiles(Array.isArray(profiles) ? profiles : profiles?.data || []);
          break;
        case 1:
          const labs = await ectaPreRegistrationService.getPendingLaboratories();
          setPendingLaboratories(Array.isArray(labs) ? labs : labs?.data || []);
          break;
        case 2:
          const competence = await ectaPreRegistrationService.getPendingCompetenceCertificates();
          setPendingCompetence(Array.isArray(competence) ? competence : competence?.data || []);
          break;
        case 3:
          const licenses = await ectaPreRegistrationService.getPendingLicenses();
          setPendingLicenses(Array.isArray(licenses) ? licenses : licenses?.data || []);
          break;
        case 4:
          const exporters = await ectaPreRegistrationService.getAllExporters();
          setAllExporters(Array.isArray(exporters) ? exporters : exporters?.data || []);
          break;
        default:
          break;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveProfile = async (exporterId) => {
    setLoading(true);
    setError(null);

    try {
      await ectaPreRegistrationService.approveExporter(exporterId);
      setSuccess('Exporter profile approved successfully');
      loadData();
      setDialogOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve profile');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectProfile = async (exporterId) => {
    if (!rejectReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await ectaPreRegistrationService.rejectExporter(exporterId, rejectReason);
      setSuccess('Exporter profile rejected');
      loadData();
      setDialogOpen(false);
      setRejectReason('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCertifyLaboratory = async (laboratoryId) => {
    setLoading(true);
    setError(null);

    try {
      await ectaPreRegistrationService.certifyLaboratory(laboratoryId, certificateData);
      setSuccess('Laboratory certified successfully');
      loadData();
      setDialogOpen(false);
      setCertificateData({
        certificateNumber: '',
        issueDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to certify laboratory');
    } finally {
      setLoading(false);
    }
  };

  const handleIssueCompetence = async (exporterId) => {
    setLoading(true);
    setError(null);

    try {
      await ectaPreRegistrationService.issueCompetenceCertificate(exporterId, certificateData);
      setSuccess('Competence certificate issued successfully');
      loadData();
      setDialogOpen(false);
      setCertificateData({
        certificateNumber: '',
        issueDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to issue certificate');
    } finally {
      setLoading(false);
    }
  };

  const handleIssueLicense = async (exporterId) => {
    setLoading(true);
    setError(null);

    try {
      await ectaPreRegistrationService.issueExportLicense(exporterId, certificateData);
      setSuccess('Export license issued successfully');
      loadData();
      setDialogOpen(false);
      setCertificateData({
        certificateNumber: '',
        issueDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to issue license');
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (item, type) => {
    setSelectedItem(item);
    setDialogType(type);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedItem(null);
    setDialogType('');
    setRejectReason('');
    setCertificateData({
      certificateNumber: '',
      issueDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
    });
  };

  const getStatusChip = (status) => {
    const statusColors = {
      PENDING: 'warning',
      ACTIVE: 'success',
      REJECTED: 'error',
      SUSPENDED: 'default',
    };

    return (
      <Chip
        label={status}
        color={statusColors[status] || 'default'}
        size="small"
      />
    );
  };

  const renderPendingProfiles = () => (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Business Name</TableCell>
            <TableCell>TIN</TableCell>
            <TableCell>Business Type</TableCell>
            <TableCell>Capital (ETB)</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(pendingProfiles || []).map((profile) => (
            <TableRow key={profile.id}>
              <TableCell>{profile.businessName}</TableCell>
              <TableCell>{profile.tin}</TableCell>
              <TableCell>{profile.businessType}</TableCell>
              <TableCell>{profile.minimumCapital?.toLocaleString()}</TableCell>
              <TableCell>{getStatusChip(profile.status)}</TableCell>
              <TableCell>
                <Tooltip title="View Details">
                  <IconButton size="small" onClick={() => openDialog(profile, 'view-profile')}>
                    <Visibility />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Approve">
                  <IconButton
                    size="small"
                    color="success"
                    onClick={() => handleApproveProfile(profile.id)}
                  >
                    <CheckCircle />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Reject">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => openDialog(profile, 'reject-profile')}
                  >
                    <Cancel />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
          {(!pendingProfiles || pendingProfiles.length === 0) && (
            <TableRow>
              <TableCell colSpan={6} align="center">
                No pending applications
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderPendingLaboratories = () => (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Laboratory Name</TableCell>
            <TableCell>Exporter</TableCell>
            <TableCell>City</TableCell>
            <TableCell>Facilities</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {pendingLaboratories.map((lab) => (
            <TableRow key={lab.id}>
              <TableCell>{lab.laboratoryName}</TableCell>
              <TableCell>{lab.exporterName}</TableCell>
              <TableCell>{lab.city}</TableCell>
              <TableCell>
                {lab.hasRoastingFacility && <Chip label="Roasting" size="small" sx={{ mr: 0.5 }} />}
                {lab.hasCuppingRoom && <Chip label="Cupping" size="small" sx={{ mr: 0.5 }} />}
                {lab.hasSampleStorage && <Chip label="Storage" size="small" />}
              </TableCell>
              <TableCell>
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircle />}
                  onClick={() => openDialog(lab, 'certify-lab')}
                >
                  Certify
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {pendingLaboratories.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} align="center">
                No pending laboratory certifications
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderPendingCompetence = () => (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Exporter</TableCell>
            <TableCell>Business Type</TableCell>
            <TableCell>Laboratory</TableCell>
            <TableCell>Taster</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {pendingCompetence.map((item) => (
            <TableRow key={item.exporterId}>
              <TableCell>{item.businessName}</TableCell>
              <TableCell>{item.businessType}</TableCell>
              <TableCell>
                {item.laboratoryCertified ? (
                  <Chip label="Certified" color="success" size="small" />
                ) : (
                  <Chip label="Not Certified" color="error" size="small" />
                )}
              </TableCell>
              <TableCell>
                {item.tasterVerified ? (
                  <Chip label="Verified" color="success" size="small" />
                ) : (
                  <Chip label="Not Verified" color="error" size="small" />
                )}
              </TableCell>
              <TableCell>
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  startIcon={<VerifiedUser />}
                  onClick={() => openDialog(item, 'issue-competence')}
                  disabled={!item.laboratoryCertified || !item.tasterVerified}
                >
                  Issue Certificate
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {pendingCompetence.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} align="center">
                No pending competence certificate applications
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderPendingLicenses = () => (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Exporter</TableCell>
            <TableCell>Competence Cert</TableCell>
            <TableCell>Capital Verified</TableCell>
            <TableCell>Application Date</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {pendingLicenses.map((item) => (
            <TableRow key={item.exporterId}>
              <TableCell>{item.businessName}</TableCell>
              <TableCell>
                {item.hasCompetenceCertificate ? (
                  <Chip label="Valid" color="success" size="small" />
                ) : (
                  <Chip label="Missing" color="error" size="small" />
                )}
              </TableCell>
              <TableCell>
                {item.capitalVerified ? (
                  <Chip label="Verified" color="success" size="small" />
                ) : (
                  <Chip label="Not Verified" color="warning" size="small" />
                )}
              </TableCell>
              <TableCell>{new Date(item.applicationDate).toLocaleDateString()}</TableCell>
              <TableCell>
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  startIcon={<Description />}
                  onClick={() => openDialog(item, 'issue-license')}
                  disabled={!item.hasCompetenceCertificate || !item.capitalVerified}
                >
                  Issue License
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {pendingLicenses.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} align="center">
                No pending export license applications
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderAllExporters = () => (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Business Name</TableCell>
            <TableCell>TIN</TableCell>
            <TableCell>Profile Status</TableCell>
            <TableCell>Laboratory</TableCell>
            <TableCell>Competence</TableCell>
            <TableCell>License</TableCell>
            <TableCell>Qualified</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {allExporters.map((exporter) => (
            <TableRow key={exporter.id}>
              <TableCell>{exporter.businessName}</TableCell>
              <TableCell>{exporter.tin}</TableCell>
              <TableCell>{getStatusChip(exporter.status)}</TableCell>
              <TableCell>
                {exporter.laboratoryCertified ? (
                  <CheckCircle color="success" fontSize="small" />
                ) : (
                  <Cancel color="error" fontSize="small" />
                )}
              </TableCell>
              <TableCell>
                {exporter.hasCompetenceCertificate ? (
                  <CheckCircle color="success" fontSize="small" />
                ) : (
                  <Cancel color="error" fontSize="small" />
                )}
              </TableCell>
              <TableCell>
                {exporter.hasExportLicense ? (
                  <CheckCircle color="success" fontSize="small" />
                ) : (
                  <Cancel color="error" fontSize="small" />
                )}
              </TableCell>
              <TableCell>
                {exporter.isQualified ? (
                  <Chip label="Qualified" color="success" size="small" />
                ) : (
                  <Chip label="Not Qualified" color="default" size="small" />
                )}
              </TableCell>
            </TableRow>
          ))}
          {allExporters.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} align="center">
                No exporters registered
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderDialog = () => {
    if (dialogType === 'reject-profile') {
      return (
        <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Reject Exporter Profile</DialogTitle>
          <DialogContent>
            <Typography variant="body2" paragraph>
              Rejecting: <strong>{selectedItem?.businessName}</strong>
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Reason for Rejection"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={closeDialog}>Cancel</Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => handleRejectProfile(selectedItem?.id)}
              disabled={loading || !rejectReason.trim()}
            >
              {loading ? <CircularProgress size={24} /> : 'Reject'}
            </Button>
          </DialogActions>
        </Dialog>
      );
    }

    if (dialogType === 'certify-lab' || dialogType === 'issue-competence' || dialogType === 'issue-license') {
      const titles = {
        'certify-lab': 'Certify Laboratory',
        'issue-competence': 'Issue Competence Certificate',
        'issue-license': 'Issue Export License',
      };

      const handlers = {
        'certify-lab': () => handleCertifyLaboratory(selectedItem?.id),
        'issue-competence': () => handleIssueCompetence(selectedItem?.exporterId),
        'issue-license': () => handleIssueLicense(selectedItem?.exporterId),
      };

      return (
        <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
          <DialogTitle>{titles[dialogType]}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Certificate/License Number"
                  value={certificateData.certificateNumber}
                  onChange={(e) => setCertificateData({ ...certificateData, certificateNumber: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Issue Date"
                  type="date"
                  value={certificateData.issueDate}
                  onChange={(e) => setCertificateData({ ...certificateData, issueDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Expiry Date"
                  type="date"
                  value={certificateData.expiryDate}
                  onChange={(e) => setCertificateData({ ...certificateData, expiryDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeDialog}>Cancel</Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handlers[dialogType]}
              disabled={loading || !certificateData.certificateNumber || !certificateData.expiryDate}
            >
              {loading ? <CircularProgress size={24} /> : 'Issue'}
            </Button>
          </DialogActions>
        </Dialog>
      );
    }

    if (dialogType === 'view-profile' && selectedItem) {
      return (
        <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="md" fullWidth>
          <DialogTitle>Exporter Profile Details</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Business Name:</Typography>
                <Typography>{selectedItem.businessName}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">TIN:</Typography>
                <Typography>{selectedItem.tin}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Registration Number:</Typography>
                <Typography>{selectedItem.registrationNumber}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Business Type:</Typography>
                <Typography>{selectedItem.businessType}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Capital (ETB):</Typography>
                <Typography>{selectedItem.minimumCapital?.toLocaleString()}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Status:</Typography>
                <Typography>{selectedItem.status}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Address:</Typography>
                <Typography>{selectedItem.officeAddress}, {selectedItem.city}, {selectedItem.region}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Contact Person:</Typography>
                <Typography>{selectedItem.contactPerson}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Email:</Typography>
                <Typography>{selectedItem.email}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Phone:</Typography>
                <Typography>{selectedItem.phone}</Typography>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeDialog}>Close</Button>
          </DialogActions>
        </Dialog>
      );
    }

    return null;
  };

  return (
    <PageContainer>
      <ManagementPaper elevation={3}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">
            ECTA Pre-Registration Management
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadData}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
          <Tab icon={<Business />} label="Pending Profiles" />
          <Tab icon={<Science />} label="Pending Labs" />
          <Tab icon={<VerifiedUser />} label="Pending Competence" />
          <Tab icon={<Description />} label="Pending Licenses" />
          <Tab icon={<CheckCircle />} label="All Exporters" />
        </Tabs>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && (
          <>
            {activeTab === 0 && renderPendingProfiles()}
            {activeTab === 1 && renderPendingLaboratories()}
            {activeTab === 2 && renderPendingCompetence()}
            {activeTab === 3 && renderPendingLicenses()}
            {activeTab === 4 && renderAllExporters()}
          </>
        )}

        {renderDialog()}
      </ManagementPaper>
    </PageContainer>
  );
};

export default ECTAPreRegistrationManagement;