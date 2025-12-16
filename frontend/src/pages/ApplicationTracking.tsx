// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  FileText,
  Eye,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { motion } from 'framer-motion';
import exporterService from '../services/exporterService';

const ApplicationTracking = ({ user, org }) => {
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadApplications = async () => {
      setLoading(true);
      try {
        const applicationsData = await exporterService.getApplications();
        setApplications(applicationsData);
      } catch (error) {
        console.error('Error loading applications:', error);
        // Fallback to empty array on error
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };

    loadApplications();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return 'success';
      case 'UNDER_REVIEW': return 'warning';
      case 'PENDING': return 'info';
      case 'REJECTED': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle size={20} />;
      case 'UNDER_REVIEW': return <Clock size={20} />;
      case 'PENDING': return <AlertCircle size={20} />;
      case 'REJECTED': return <XCircle size={20} />;
      default: return <FileText size={20} />;
    }
  };

  const handleViewDetails = (application) => {
    setSelectedApplication(application);
    setDetailsOpen(true);
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const applicationsData = await exporterService.getApplications();
      setApplications(applicationsData);
    } catch (error) {
      console.error('Error refreshing applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getApplicationCounts = () => {
    return {
      total: applications.length,
      pending: applications.filter(app => app.status === 'PENDING').length,
      underReview: applications.filter(app => app.status === 'UNDER_REVIEW').length,
      approved: applications.filter(app => app.status === 'APPROVED').length,
      rejected: applications.filter(app => app.status === 'REJECTED').length,
    };
  };

  const counts = getApplicationCounts();

  return (
    <Box sx={{ p: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
            Application Tracking
          </Typography>
          <Button
            variant="outlined"
            startIcon={<span><RefreshCw size={20} /></span>}
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary" gutterBottom>
                  {counts.total}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Applications
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="info.main" gutterBottom>
                  {counts.pending}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main" gutterBottom>
                  {counts.underReview}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Under Review
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main" gutterBottom>
                  {counts.approved}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Approved
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="error.main" gutterBottom>
                  {counts.rejected}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Rejected
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Applications Table */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              My Applications
            </Typography>
            
            {loading ? (
              <LinearProgress sx={{ mb: 2 }} />
            ) : null}

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Application ID</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Submitted Date</TableCell>
                    <TableCell>Progress</TableCell>
                    <TableCell>Reviewer</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {applications.map((application) => (
                    <TableRow key={application.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {application.id}
                        </Typography>
                      </TableCell>
                      <TableCell>{application.type}</TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(application.status)}
                          label={application.status.replace('_', ' ')}
                          color={getStatusColor(application.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{application.submittedDate}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={application.progress}
                            sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            {application.progress}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {application.reviewer || 'Not assigned'}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetails(application)}
                          >
                            <span><Eye size={18} /></span>
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Download Documents">
                          <IconButton size="small">
                            <span><Download size={18} /></span>
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {applications.length === 0 && !loading && (
              <Alert severity="info" sx={{ mt: 2 }}>
                No applications found. Start your pre-registration process to see your applications here.
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Application Details Dialog */}
        <Dialog
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Application Details - {selectedApplication?.id}
          </DialogTitle>
          <DialogContent>
            {selectedApplication && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Application Type
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedApplication.type}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Status
                  </Typography>
                  <Chip
                    icon={getStatusIcon(selectedApplication.status)}
                    label={selectedApplication.status.replace('_', ' ')}
                    color={getStatusColor(selectedApplication.status)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Submitted Date
                  </Typography>
                  <Typography variant="body1">
                    {selectedApplication.submittedDate}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Reviewed Date
                  </Typography>
                  <Typography variant="body1">
                    {selectedApplication.reviewedDate || 'Not reviewed yet'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Submitted Documents
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {selectedApplication.documents.map((doc, index) => (
                      <Chip key={index} label={doc} variant="outlined" size="small" />
                    ))}
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Comments
                  </Typography>
                  <Typography variant="body1">
                    {selectedApplication.comments}
                  </Typography>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </motion.div>
    </Box>
  );
};

export default ApplicationTracking;
