/**
 * ECTA Pre-Registration Management Dashboard
 * For ECTA staff to manage exporter applications and approvals
 */

import React, { useState, useEffect } from 'react';
import { CommonPageProps } from '../types';
<<<<<<< HEAD
import { useQuery } from '@tanstack/react-query';
=======
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
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
<<<<<<< HEAD
import { ModernStatCard } from '../components/ModernUIKit';

interface ECTAPreRegistrationManagementProps extends CommonPageProps { }
=======

interface ECTAPreRegistrationManagementProps extends CommonPageProps {}
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665

const ECTAPreRegistrationManagement = ({ user, org }: ECTAPreRegistrationManagementProps): JSX.Element => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

<<<<<<< HEAD
=======
  // Data states
  const [pendingProfiles, setPendingProfiles] = useState([]);
  const [pendingLaboratories, setPendingLaboratories] = useState([]);
  const [pendingCompetence, setPendingCompetence] = useState([]);
  const [pendingLicenses, setPendingLicenses] = useState([]);
  const [allExporters, setAllExporters] = useState([]);

>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
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

<<<<<<< HEAD
  const location = window.location;

  useEffect(() => {
    // Sync tab with URL
    const path = location.pathname;
    if (path.includes('/laboratories')) setActiveTab(1);
    else if (path.includes('/tasters')) setActiveTab(2);
    else if (path.includes('/competence')) setActiveTab(3);
    else if (path.includes('/licenses')) setActiveTab(4);
    else if (path.includes('/approved')) setActiveTab(5);
    else setActiveTab(0);
  }, [location.pathname]);

  // React Query Fetch Function
  const fetchData = async () => {
    console.log('Fetching data for tab:', activeTab);
=======
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
    try {
      switch (activeTab) {
        case 0:
          const profiles = await ectaPreRegistrationService.getPendingApplications();
<<<<<<< HEAD
          return Array.isArray(profiles) ? profiles : profiles?.data || [];
        case 1:
          const labs = await ectaPreRegistrationService.getPendingLaboratories();
          return Array.isArray(labs) ? labs : labs?.data || [];
        case 2:
          const tasters = await ectaPreRegistrationService.getPendingTasters();
          return Array.isArray(tasters) ? tasters : tasters?.data || [];
        case 3:
          const competence = await ectaPreRegistrationService.getPendingCompetenceCertificates();
          return Array.isArray(competence) ? competence : competence?.data || [];
        case 4:
          const licenses = await ectaPreRegistrationService.getPendingLicenses();
          return Array.isArray(licenses) ? licenses : licenses?.data || [];
        case 5:
          const exporters = await ectaPreRegistrationService.getAllExporters();
          return Array.isArray(exporters) ? exporters : exporters?.data || [];
        default:
          return [];
      }
    } catch (e) {
      console.error('Fetch error:', e);
      throw e;
    }
  };

  const { data: tableData, isLoading, error: queryError, refetch } = useQuery({
    queryKey: ['ecta-data', activeTab],
    queryFn: fetchData,
    refetchInterval: 5000,
  });

  const { data: globalStats } = useQuery({
    queryKey: ['ecta', 'global-stats'],
    queryFn: async () => {
      const res = await ectaPreRegistrationService.getGlobalStats();
      return res?.data || { exporters: { total: 0, pending: 0 }, licenses: { total: 0, pending: 0 } };
    },
    refetchInterval: 30000
  });

  // Handle Query Errors
  useEffect(() => {
    if (queryError) {
      setError((queryError as any).response?.data?.message || 'Failed to load data');
    }
  }, [queryError]);

  // Derived state
  const pendingProfiles = activeTab === 0 ? tableData || [] : [];
  const pendingLaboratories = activeTab === 1 ? tableData || [] : [];
  const pendingTasters = activeTab === 2 ? tableData || [] : [];
  const pendingCompetence = activeTab === 3 ? tableData || [] : [];
  const pendingLicenses = activeTab === 4 ? tableData || [] : [];
  const allExporters = activeTab === 5 ? tableData || [] : [];

=======
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

>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
  const handleApproveProfile = async (exporterId) => {
    setLoading(true);
    setError(null);

    try {
      await ectaPreRegistrationService.approveExporter(exporterId);
      setSuccess('Exporter profile approved successfully');
<<<<<<< HEAD
      refetch(); // Use refetch instead of loadData
=======
      loadData();
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
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
<<<<<<< HEAD
      refetch();
=======
      loadData();
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
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
<<<<<<< HEAD
      refetch();
=======
      loadData();
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
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
<<<<<<< HEAD
      refetch();
=======
      loadData();
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
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
<<<<<<< HEAD
      refetch();
=======
      loadData();
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
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

<<<<<<< HEAD
  const handleVerifyTaster = async (tasterId) => {
    setLoading(true);
    setError(null);

    try {
      await ectaPreRegistrationService.verifyTaster(tasterId);
      setSuccess('Taster verified successfully');
      refetch();
      setDialogOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify taster');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectTaster = async (tasterId) => {
    if (!rejectReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await ectaPreRegistrationService.rejectTaster(tasterId, rejectReason);
      setSuccess('Taster verification rejected');
      refetch();
      setDialogOpen(false);
      setRejectReason('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject taster');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectCompetence = async (exporterId) => {
    if (!rejectReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await ectaPreRegistrationService.rejectCompetenceCertificate(exporterId, rejectReason);
      setSuccess('Competence certificate application rejected');
      refetch();
      setDialogOpen(false);
      setRejectReason('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject competence certificate');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectLicense = async (exporterId) => {
    if (!rejectReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await ectaPreRegistrationService.rejectExportLicense(exporterId, rejectReason);
      setSuccess('Export license application rejected');
      refetch();
      setDialogOpen(false);
      setRejectReason('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject export license');
    } finally {
      setLoading(false);
    }
  };

=======
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
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
<<<<<<< HEAD
            <TableRow key={profile.exporter_id}>
=======
            <TableRow key={profile.id}>
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
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
<<<<<<< HEAD
                    onClick={() => handleApproveProfile(profile.exporter_id)}
=======
                    onClick={() => handleApproveProfile(profile.id)}
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
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

<<<<<<< HEAD
  const renderPendingTasters = () => (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Taster Name</TableCell>
            <TableCell>Exporter</TableCell>
            <TableCell>Certificate Number</TableCell>
            <TableCell>Qualification Level</TableCell>
            <TableCell>Exclusive Employee</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {pendingTasters.map((taster) => (
            <TableRow key={taster.id}>
              <TableCell>{taster.fullName}</TableCell>
              <TableCell>{taster.exporterName}</TableCell>
              <TableCell>{taster.proficiencyCertificateNumber}</TableCell>
              <TableCell>{taster.qualificationLevel}</TableCell>
              <TableCell>
                {taster.isExclusiveEmployee ? (
                  <Chip label="Yes" color="success" size="small" />
                ) : (
                  <Chip label="No" color="warning" size="small" />
                )}
              </TableCell>
              <TableCell>
                <Tooltip title="Verify">
                  <IconButton
                    size="small"
                    color="success"
                    onClick={() => handleVerifyTaster(taster.id)}
                  >
                    <CheckCircle />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Reject">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => openDialog(taster, 'reject-taster')}
                  >
                    <Cancel />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
          {pendingTasters.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} align="center">
                No pending taster verifications
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

=======
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
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
<<<<<<< HEAD
                  sx={{ mr: 1 }}
                >
                  Issue Certificate
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<Cancel />}
                  onClick={() => openDialog(item, 'reject-competence')}
                >
                  Reject
                </Button>
=======
                >
                  Issue Certificate
                </Button>
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
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
<<<<<<< HEAD
                  sx={{ mr: 1 }}
                >
                  Issue License
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<Cancel />}
                  onClick={() => openDialog(item, 'reject-license')}
                >
                  Reject
                </Button>
=======
                >
                  Issue License
                </Button>
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
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

<<<<<<< HEAD
    if (dialogType === 'reject-taster') {
      return (
        <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Reject Taster Verification</DialogTitle>
          <DialogContent>
            <Typography variant="body2" paragraph>
              Rejecting: <strong>{selectedItem?.fullName}</strong>
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
              onClick={() => handleRejectTaster(selectedItem?.id)}
              disabled={loading || !rejectReason.trim()}
            >
              {loading ? <CircularProgress size={24} /> : 'Reject'}
            </Button>
          </DialogActions>
        </Dialog>
      );
    }

    if (dialogType === 'reject-competence') {
      return (
        <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Reject Competence Certificate Application</DialogTitle>
          <DialogContent>
            <Typography variant="body2" paragraph>
              Rejecting application for: <strong>{selectedItem?.businessName}</strong>
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
              onClick={() => handleRejectCompetence(selectedItem?.exporterId)}
              disabled={loading || !rejectReason.trim()}
            >
              {loading ? <CircularProgress size={24} /> : 'Reject'}
            </Button>
          </DialogActions>
        </Dialog>
      );
    }

    if (dialogType === 'reject-license') {
      return (
        <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Reject Export License Application</DialogTitle>
          <DialogContent>
            <Typography variant="body2" paragraph>
              Rejecting application for: <strong>{selectedItem?.businessName}</strong>
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
              onClick={() => handleRejectLicense(selectedItem?.exporterId)}
              disabled={loading || !rejectReason.trim()}
            >
              {loading ? <CircularProgress size={24} /> : 'Reject'}
            </Button>
          </DialogActions>
        </Dialog>
      );
    }

=======
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
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
<<<<<<< HEAD
            onClick={() => refetch()}
            disabled={isLoading || loading}
=======
            onClick={loadData}
            disabled={loading}
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
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

<<<<<<< HEAD
        {/* Global Stats Grid */}
        {globalStats && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <ModernStatCard
                title="Total Exporters"
                value={globalStats.exporters?.total || 0}
                icon={<Business />}
                color="primary"
                subtitle="Registered entities"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <ModernStatCard
                title="Pending Approvals"
                value={globalStats.exporters?.pending || 0}
                icon={<VerifiedUser />}
                color="warning"
                subtitle="New registrations"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <ModernStatCard
                title="Active Licenses"
                value={globalStats.licenses?.total || 0}
                icon={<Description />}
                color="success"
                subtitle="Issued licenses"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <ModernStatCard
                title="Pending Licenses"
                value={globalStats.licenses?.pending || 0}
                icon={<Description />}
                color="info"
                subtitle="Awaiting issuance"
              />
            </Grid>
          </Grid>
        )}

        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
          <Tab icon={<Business />} label="Pending Profiles" />
          <Tab icon={<Science />} label="Pending Labs" />
          <Tab icon={<VerifiedUser />} label="Pending Tasters" />
=======
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
          <Tab icon={<Business />} label="Pending Profiles" />
          <Tab icon={<Science />} label="Pending Labs" />
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
          <Tab icon={<VerifiedUser />} label="Pending Competence" />
          <Tab icon={<Description />} label="Pending Licenses" />
          <Tab icon={<CheckCircle />} label="All Exporters" />
        </Tabs>

<<<<<<< HEAD
        {(isLoading || loading) && !tableData && (
=======
        {loading && (
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        )}

<<<<<<< HEAD
        {(!isLoading && !loading) || tableData ? (
          <>
            {activeTab === 0 && renderPendingProfiles()}
            {activeTab === 1 && renderPendingLaboratories()}
            {activeTab === 2 && renderPendingTasters()}
            {activeTab === 3 && renderPendingCompetence()}
            {activeTab === 4 && renderPendingLicenses()}
            {activeTab === 5 && renderAllExporters()}
          </>
        ) : null}
=======
        {!loading && (
          <>
            {activeTab === 0 && renderPendingProfiles()}
            {activeTab === 1 && renderPendingLaboratories()}
            {activeTab === 2 && renderPendingCompetence()}
            {activeTab === 3 && renderPendingLicenses()}
            {activeTab === 4 && renderAllExporters()}
          </>
        )}
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665

        {renderDialog()}
      </ManagementPaper>
    </PageContainer>
  );
};

export default ECTAPreRegistrationManagement;