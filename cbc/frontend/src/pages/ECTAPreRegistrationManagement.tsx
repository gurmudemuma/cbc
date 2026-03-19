/**
 * ECTA Pre-Registration Management Dashboard
 * For ECTA staff to manage exporter applications and approvals
 */

import React, { useState, useEffect } from 'react';
import { CommonPageProps } from '../types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
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
  Download,
} from '@mui/icons-material';
import ectaPreRegistrationService from '../services/ectaPreRegistration';
import * as ectaService from '../services/ecta.service';
import { PageContainer, ManagementPaper } from './ECTAPreRegistrationManagement.styles';
import { ModernStatCard } from '../components/ModernUIKit';

interface ECTAPreRegistrationManagementProps extends CommonPageProps { }

const ECTAPreRegistrationManagement = ({ user, org }: ECTAPreRegistrationManagementProps): JSX.Element => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Dialog states
  const [selectedItem, setSelectedItem] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [certificateData, setCertificateData] = useState({
    certificateNumber: '',
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    laboratoryId: '',
    tasterId: '',
  });
  const [availableLaboratories, setAvailableLaboratories] = useState([]);
  const [availableTasters, setAvailableTasters] = useState([]);
  const [downloading, setDownloading] = useState<string | null>(null);

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
    try {
      switch (activeTab) {
        case 0:
          const profiles = await ectaPreRegistrationService.getPendingApplications();
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

  // Helper function to refresh both table data and global stats
  const refreshAllData = () => {
    refetch(); // Refresh current tab data
    queryClient.invalidateQueries({ queryKey: ['ecta', 'global-stats'] }); // Refresh dashboard stats
  };

  const handleApproveProfile = async (exporterId) => {
    setLoading(true);
    setError(null);

    try {
      await ectaPreRegistrationService.approveExporter(exporterId);
      setSuccess('Exporter profile approved successfully');
      refreshAllData();
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
      refreshAllData();
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
      refreshAllData();
      setDialogOpen(false);
      setCertificateData({
        certificateNumber: '',
        issueDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        laboratoryId: '',
        tasterId: '',
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
      refreshAllData();
      setDialogOpen(false);
      setCertificateData({
        certificateNumber: '',
        issueDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        laboratoryId: '',
        tasterId: '',
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
      refreshAllData();
      setDialogOpen(false);
      setCertificateData({
        certificateNumber: '',
        issueDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        laboratoryId: '',
        tasterId: '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to issue license');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTaster = async (tasterId) => {
    setLoading(true);
    setError(null);

    try {
      await ectaPreRegistrationService.verifyTaster(tasterId);
      setSuccess('Taster verified successfully');
      refreshAllData();
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
      refreshAllData();
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
      refreshAllData();
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
      refreshAllData();
      setDialogOpen(false);
      setRejectReason('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject export license');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCompetenceCertificate = async (certificateId: string) => {
    try {
      setDownloading(certificateId);
      await ectaService.downloadCompetenceCertificate(certificateId);
      setSuccess('Certificate downloaded successfully');
    } catch (err) {
      if (err.response?.status === 403) {
        setError('You do not have permission to download this certificate');
      } else if (err.response?.status === 404) {
        setError('Certificate not found or PDF not generated yet');
      } else {
        setError('Failed to download certificate. Please try again.');
      }
      console.error('Download error:', err);
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadExportLicense = async (licenseId: string) => {
    try {
      setDownloading(licenseId);
      await ectaService.downloadExportLicense(licenseId);
      setSuccess('License downloaded successfully');
    } catch (err) {
      if (err.response?.status === 403) {
        setError('You do not have permission to download this license');
      } else if (err.response?.status === 404) {
        setError('License not found or PDF not generated yet');
      } else {
        setError('Failed to download license. Please try again.');
      }
      console.error('Download error:', err);
    } finally {
      setDownloading(null);
    }
  };

  const openDialog = async (item, type) => {
    setSelectedItem(item);
    setDialogType(type);
    setDialogOpen(true);

    // Fetch laboratories and tasters for competence certificate dialog
    if (type === 'issue-competence' && item?.exporterId) {
      try {
        const [labsResponse, tastersResponse] = await Promise.all([
          ectaPreRegistrationService.getExporterLaboratories(item.exporterId),
          ectaPreRegistrationService.getExporterTasters(item.exporterId),
        ]);
        
        setAvailableLaboratories(labsResponse?.data || []);
        setAvailableTasters(tastersResponse?.data || []);
      } catch (err) {
        console.error('Failed to fetch laboratories/tasters:', err);
        setError('Failed to load laboratories and tasters');
      }
    }
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
      laboratoryId: '',
      tasterId: '',
    });
    setAvailableLaboratories([]);
    setAvailableTasters([]);
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
            <TableCell>Certificate</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(pendingProfiles || []).filter(profile => profile && profile.exporter_id).map((profile) => (
            <TableRow key={profile.exporter_id}>
              <TableCell>{profile.businessName || profile.companyName || 'N/A'}</TableCell>
              <TableCell>{profile.tin || 'N/A'}</TableCell>
              <TableCell>{profile.businessType || 'N/A'}</TableCell>
              <TableCell>{profile.minimumCapital?.toLocaleString() || '0'}</TableCell>
              <TableCell>{getStatusChip(profile.status)}</TableCell>
              <TableCell>
                {profile.status === 'ACTIVE' && profile.approvalCertificateId ? (
                  <Tooltip title="Download Approval Certificate">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleDownloadCompetenceCertificate(profile.approvalCertificateId)}
                      disabled={downloading === profile.approvalCertificateId}
                    >
                      {downloading === profile.approvalCertificateId ? (
                        <CircularProgress size={20} />
                      ) : (
                        <Download />
                      )}
                    </IconButton>
                  </Tooltip>
                ) : profile.status === 'ACTIVE' ? (
                  <Chip label="PDF Pending" size="small" color="warning" />
                ) : (
                  <Chip label="Not Approved" size="small" color="default" />
                )}
              </TableCell>
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
                    onClick={() => handleApproveProfile(profile.exporter_id)}
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
              <TableCell colSpan={7} align="center">
                No exporter applications found
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
            <TableCell>Certificate</TableCell>
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
                {lab.certificationNumber && lab.certificateId ? (
                  <Tooltip title="Download Certification">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleDownloadCompetenceCertificate(lab.certificateId)}
                      disabled={downloading === lab.certificateId}
                    >
                      {downloading === lab.certificateId ? (
                        <CircularProgress size={20} />
                      ) : (
                        <Download />
                      )}
                    </IconButton>
                  </Tooltip>
                ) : lab.certificationNumber ? (
                  <Chip label="PDF Pending" size="small" color="warning" />
                ) : (
                  <Chip label="Not Certified" size="small" color="default" />
                )}
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
              <TableCell colSpan={6} align="center">
                No laboratory certifications found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

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
            <TableCell>Verification</TableCell>
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
                {taster.verificationStatus === 'VERIFIED' && taster.verificationCertificateId ? (
                  <Tooltip title="Download Verification">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleDownloadCompetenceCertificate(taster.verificationCertificateId)}
                      disabled={downloading === taster.verificationCertificateId}
                    >
                      {downloading === taster.verificationCertificateId ? (
                        <CircularProgress size={20} />
                      ) : (
                        <Download />
                      )}
                    </IconButton>
                  </Tooltip>
                ) : taster.verificationStatus === 'VERIFIED' ? (
                  <Chip label="PDF Pending" size="small" color="warning" />
                ) : (
                  <Chip label="Not Verified" size="small" color="default" />
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
              <TableCell colSpan={7} align="center">
                No taster verifications found
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
            <TableCell>Certificate</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(pendingCompetence || []).filter(item => item && item.exporterId).map((item) => (
            <TableRow key={item.exporterId}>
              <TableCell>{item.businessName || item.companyName || 'N/A'}</TableCell>
              <TableCell>{item.businessType || 'N/A'}</TableCell>
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
                {item.certificateId && item.filePath ? (
                  <Tooltip title="Download Certificate">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleDownloadCompetenceCertificate(item.certificateId)}
                      disabled={downloading === item.certificateId}
                    >
                      {downloading === item.certificateId ? (
                        <CircularProgress size={20} />
                      ) : (
                        <Download />
                      )}
                    </IconButton>
                  </Tooltip>
                ) : item.certificateId ? (
                  <Chip label="PDF Pending" size="small" color="warning" />
                ) : (
                  <Chip label="Not Issued" size="small" color="default" />
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
              </TableCell>
            </TableRow>
          ))}
          {pendingCompetence.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} align="center">
                No competence certificate applications found
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
            <TableCell>License</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(pendingLicenses || []).filter(item => item && item.exporterId).map((item) => (
            <TableRow key={item.exporterId}>
              <TableCell>{item.businessName || item.companyName || 'N/A'}</TableCell>
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
              <TableCell>{item.applicationDate ? new Date(item.applicationDate).toLocaleDateString() : 'N/A'}</TableCell>
              <TableCell>
                {item.licenseId && item.filePath ? (
                  <Tooltip title="Download License">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleDownloadExportLicense(item.licenseId)}
                      disabled={downloading === item.licenseId}
                    >
                      {downloading === item.licenseId ? (
                        <CircularProgress size={20} />
                      ) : (
                        <Download />
                      )}
                    </IconButton>
                  </Tooltip>
                ) : item.licenseId ? (
                  <Chip label="PDF Pending" size="small" color="warning" />
                ) : (
                  <Chip label="Not Issued" size="small" color="default" />
                )}
              </TableCell>
              <TableCell>
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  startIcon={<Description />}
                  onClick={() => openDialog(item, 'issue-license')}
                  disabled={!item.hasCompetenceCertificate || !item.capitalVerified}
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
              </TableCell>
            </TableRow>
          ))}
          {pendingLicenses.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} align="center">
                No export license applications found
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
            <TableCell sx={{ minWidth: 200 }}>Business Name</TableCell>
            <TableCell>TIN</TableCell>
            <TableCell>Business Type</TableCell>
            <TableCell>Profile Status</TableCell>
            <TableCell align="center">Laboratory</TableCell>
            <TableCell align="center">Competence</TableCell>
            <TableCell align="center">License</TableCell>
            <TableCell align="center">Qualified</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {allExporters.map((exporter) => (
            <TableRow key={exporter.id}>
              <TableCell sx={{ fontWeight: 500 }}>
                {exporter.businessName || exporter.business_name || 'N/A'}
              </TableCell>
              <TableCell>{exporter.tin || 'N/A'}</TableCell>
              <TableCell>{exporter.businessType || exporter.business_type || 'N/A'}</TableCell>
              <TableCell>{getStatusChip(exporter.status)}</TableCell>
              <TableCell align="center">
                {exporter.laboratoryCertified || exporter.laboratory_certified ? (
                  <Tooltip title="Laboratory Certified">
                    <CheckCircle color="success" fontSize="small" />
                  </Tooltip>
                ) : (
                  <Tooltip title="Laboratory Not Certified">
                    <Cancel color="error" fontSize="small" />
                  </Tooltip>
                )}
              </TableCell>
              <TableCell align="center">
                {exporter.hasCompetenceCertificate || exporter.has_competence_certificate ? (
                  <Tooltip title="Competence Certificate Issued">
                    <CheckCircle color="success" fontSize="small" />
                  </Tooltip>
                ) : (
                  <Tooltip title="No Competence Certificate">
                    <Cancel color="error" fontSize="small" />
                  </Tooltip>
                )}
              </TableCell>
              <TableCell align="center">
                {exporter.hasExportLicense || exporter.has_export_license ? (
                  <Tooltip title="Export License Issued">
                    <CheckCircle color="success" fontSize="small" />
                  </Tooltip>
                ) : (
                  <Tooltip title="No Export License">
                    <Cancel color="error" fontSize="small" />
                  </Tooltip>
                )}
              </TableCell>
              <TableCell align="center">
                {exporter.isQualified || exporter.is_qualified ? (
                  <Chip label="Qualified" color="success" size="small" />
                ) : (
                  <Chip label="Not Qualified" color="default" size="small" />
                )}
              </TableCell>
              <TableCell align="center">
                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', alignItems: 'center' }}>
                  {/* View Details */}
                  <Tooltip title="View Details">
                    <IconButton 
                      size="small" 
                      onClick={() => openDialog(exporter, 'view-profile')}
                    >
                      <Visibility fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  
                  {/* Download Competence Certificate - only show if certificate exists AND has PDF */}
                  {(exporter.competenceCertificateId || exporter.competence_certificate_id) && 
                   (exporter.competenceCertificateFilePath || exporter.competence_certificate_file_path) ? (
                    <Tooltip title="Download Competence Certificate">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleDownloadCompetenceCertificate(
                          exporter.competenceCertificateId || exporter.competence_certificate_id
                        )}
                        disabled={downloading === (exporter.competenceCertificateId || exporter.competence_certificate_id)}
                      >
                        {downloading === (exporter.competenceCertificateId || exporter.competence_certificate_id) ? (
                          <CircularProgress size={16} />
                        ) : (
                          <Download fontSize="small" />
                        )}
                      </IconButton>
                    </Tooltip>
                  ) : null}
                  
                  {/* Download Export License - only show if license exists AND has PDF */}
                  {(exporter.exportLicenseId || exporter.export_license_id) && 
                   (exporter.exportLicenseFilePath || exporter.export_license_file_path) ? (
                    <Tooltip title="Download Export License">
                      <IconButton
                        size="small"
                        color="secondary"
                        onClick={() => handleDownloadExportLicense(
                          exporter.exportLicenseId || exporter.export_license_id
                        )}
                        disabled={downloading === (exporter.exportLicenseId || exporter.export_license_id)}
                      >
                        {downloading === (exporter.exportLicenseId || exporter.export_license_id) ? (
                          <CircularProgress size={16} />
                        ) : (
                          <Description fontSize="small" />
                        )}
                      </IconButton>
                    </Tooltip>
                  ) : null}
                </Box>
              </TableCell>
            </TableRow>
          ))}
          {allExporters.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} align="center">
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
              Rejecting: <strong>{selectedItem?.businessName || selectedItem?.companyName || 'N/A'}</strong>
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
              Rejecting application for: <strong>{selectedItem?.businessName || selectedItem?.companyName || 'N/A'}</strong>
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
              Rejecting application for: <strong>{selectedItem?.businessName || selectedItem?.companyName || 'N/A'}</strong>
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
              
              {/* Laboratory and Taster selection for competence certificate */}
              {dialogType === 'issue-competence' && (
                <>
                  <Grid item xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Laboratory</InputLabel>
                      <Select
                        value={certificateData.laboratoryId}
                        onChange={(e) => setCertificateData({ ...certificateData, laboratoryId: e.target.value })}
                        label="Laboratory"
                      >
                        {availableLaboratories.length === 0 && (
                          <MenuItem value="" disabled>
                            No certified laboratories found
                          </MenuItem>
                        )}
                        {availableLaboratories.map((lab) => (
                          <MenuItem key={lab.laboratory_id} value={lab.laboratory_id}>
                            {lab.laboratory_name} - {lab.city}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Taster</InputLabel>
                      <Select
                        value={certificateData.tasterId}
                        onChange={(e) => setCertificateData({ ...certificateData, tasterId: e.target.value })}
                        label="Taster"
                      >
                        {availableTasters.length === 0 && (
                          <MenuItem value="" disabled>
                            No verified tasters found
                          </MenuItem>
                        )}
                        {availableTasters.map((taster) => (
                          <MenuItem key={taster.taster_id} value={taster.taster_id}>
                            {taster.full_name} - {taster.qualification_level}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </>
              )}
              
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
              disabled={
                loading || 
                !certificateData.certificateNumber || 
                !certificateData.expiryDate ||
                (dialogType === 'issue-competence' && (!certificateData.laboratoryId || !certificateData.tasterId))
              }
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
                <Typography>{selectedItem?.businessName || selectedItem?.companyName || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">TIN:</Typography>
                <Typography>{selectedItem?.tin || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Registration Number:</Typography>
                <Typography>{selectedItem?.registrationNumber || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Business Type:</Typography>
                <Typography>{selectedItem?.businessType || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Capital (ETB):</Typography>
                <Typography>{selectedItem?.minimumCapital?.toLocaleString() || '0'}</Typography>
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
            onClick={() => refreshAllData()}
            disabled={isLoading || loading}
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
                subtitle="Awaiting approval"
              />
            </Grid>
          </Grid>
        )}

        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
          <Tab icon={<Business />} label="Exporter Profiles" />
          <Tab icon={<Science />} label="Laboratories" />
          <Tab icon={<VerifiedUser />} label="Coffee Tasters" />
          <Tab icon={<VerifiedUser />} label="Competence Certificates" />
          <Tab icon={<Description />} label="Export Licenses" />
          <Tab icon={<CheckCircle />} label="All Exporters" />
        </Tabs>

        {(isLoading || loading) && !tableData && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        )}

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

        {renderDialog()}
      </ManagementPaper>
    </PageContainer>
  );
};

export default ECTAPreRegistrationManagement;
