import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Chip,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Alert,
  Divider,
} from '@mui/material';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  Building2,
  Package,
  Calendar,
  User,
} from 'lucide-react';

interface ESWStatusTrackerProps {
  submission: any;
}

const ESWStatusTracker = ({ submission }: ESWStatusTrackerProps): JSX.Element => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'error';
      case 'PENDING':
      case 'UNDER_REVIEW':
        return 'warning';
      case 'INFO_REQUIRED':
        return 'info';
      case 'NOT_APPLICABLE':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle size={20} color="green" />;
      case 'REJECTED':
        return <XCircle size={20} color="red" />;
      case 'PENDING':
      case 'UNDER_REVIEW':
        return <Clock size={20} color="orange" />;
      case 'INFO_REQUIRED':
        return <AlertCircle size={20} color="blue" />;
      default:
        return <Clock size={20} color="gray" />;
    }
  };

  const formatDate = (date: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateProgress = () => {
    if (!submission.agencyApprovals) return 0;
    const total = submission.agencyApprovals.length;
    const completed = submission.agencyApprovals.filter(
      (a: any) => a.status === 'APPROVED' || a.status === 'REJECTED' || a.status === 'NOT_APPLICABLE'
    ).length;
    return (completed / total) * 100;
  };

  const getOverallStatus = () => {
    if (!submission.agencyApprovals) return 'PENDING';
    
    const hasRejected = submission.agencyApprovals.some((a: any) => a.status === 'REJECTED');
    if (hasRejected) return 'REJECTED';

    const hasInfoRequired = submission.agencyApprovals.some((a: any) => a.status === 'INFO_REQUIRED');
    if (hasInfoRequired) return 'INFO_REQUIRED';

    const allCompleted = submission.agencyApprovals.every(
      (a: any) => a.status === 'APPROVED' || a.status === 'NOT_APPLICABLE'
    );
    if (allCompleted) return 'APPROVED';

    return 'UNDER_REVIEW';
  };

  const overallStatus = getOverallStatus();
  const progress = calculateProgress();

  return (
    <Box>
      {/* Header with Overall Status */}
      <Card sx={{ mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h6">ESW Reference Number</Typography>
              <Typography variant="h4">{submission.eswReferenceNumber}</Typography>
            </Grid>
            <Grid item xs={12} md={6} sx={{ textAlign: { md: 'right' } }}>
              <Typography variant="body2">Overall Status</Typography>
              <Chip
                label={overallStatus.replace(/_/g, ' ')}
                color={getStatusColor(overallStatus)}
                size="large"
                sx={{ mt: 1, fontSize: '1rem', fontWeight: 'bold' }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Progress Bar */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="textSecondary">
              Agency Approval Progress
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {Math.round(progress)}%
            </Typography>
          </Box>
          <LinearProgress variant="determinate" value={progress} sx={{ height: 10, borderRadius: 5 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="caption">
              {submission.approvedAgencies?.length || 0} Approved
            </Typography>
            <Typography variant="caption">
              {submission.pendingAgencies?.length || 0} Pending
            </Typography>
            <Typography variant="caption">
              {submission.rejectedAgencies?.length || 0} Rejected
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Export Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Package size={20} /> Export Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">
                    Export ID
                  </Typography>
                  <Typography variant="body2">{submission.export?.exportId || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">
                    Exporter
                  </Typography>
                  <Typography variant="body2">{submission.export?.exporterName || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">
                    Coffee Type
                  </Typography>
                  <Typography variant="body2">{submission.export?.coffeeType || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">
                    Quantity
                  </Typography>
                  <Typography variant="body2">
                    {submission.export?.quantity?.toLocaleString() || 'N/A'} kg
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">
                    Destination
                  </Typography>
                  <Typography variant="body2">{submission.export?.destinationCountry || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">
                    Submitted Date
                  </Typography>
                  <Typography variant="body2">{formatDate(submission.submittedAt)}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Submission Details */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FileText size={20} /> Submission Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">
                    Submitted By
                  </Typography>
                  <Typography variant="body2">{submission.submittedBy || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">
                    Status
                  </Typography>
                  <Chip
                    label={submission.status?.replace(/_/g, ' ')}
                    color={getStatusColor(submission.status)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">
                    Documents
                  </Typography>
                  <Typography variant="body2">{submission.documents?.length || 0} files</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">
                    Certificates
                  </Typography>
                  <Typography variant="body2">{submission.certificates?.length || 0} certs</Typography>
                </Grid>
                {submission.approvedAt && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="textSecondary">
                      Approved Date
                    </Typography>
                    <Typography variant="body2">{formatDate(submission.approvedAt)}</Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Agency Approvals Status */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Building2 size={20} /> Agency Approvals ({submission.agencyApprovals?.length || 0})
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {submission.rejectedAgencies && submission.rejectedAgencies.length > 0 && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  Rejected by: {submission.rejectedAgencies.join(', ')}
                </Alert>
              )}

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Agency</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Reviewed By</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {submission.agencyApprovals?.map((approval: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getStatusIcon(approval.status)}
                            <Typography variant="body2">{approval.agencyName}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label={approval.agencyType} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={approval.status?.replace(/_/g, ' ')}
                            color={getStatusColor(approval.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{approval.approvedBy || '-'}</TableCell>
                        <TableCell>
                          {approval.approvedAt ? formatDate(approval.approvedAt) : '-'}
                        </TableCell>
                        <TableCell>
                          {approval.rejectionReason && (
                            <Typography variant="caption" color="error">
                              {approval.rejectionReason}
                            </Typography>
                          )}
                          {approval.additionalInfoRequest && (
                            <Typography variant="caption" color="info.main">
                              {approval.additionalInfoRequest}
                            </Typography>
                          )}
                          {approval.notes && (
                            <Typography variant="caption">{approval.notes}</Typography>
                          )}
                          {!approval.rejectionReason &&
                            !approval.additionalInfoRequest &&
                            !approval.notes &&
                            '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Documents */}
        {submission.documents && submission.documents.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Documents ({submission.documents.length})
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Type</TableCell>
                        <TableCell>File Name</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {submission.documents.map((doc: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{doc.documentType?.replace(/_/g, ' ')}</TableCell>
                          <TableCell>{doc.fileName || doc.documentName}</TableCell>
                          <TableCell>
                            <Chip
                              label={doc.status || 'PENDING'}
                              color={getStatusColor(doc.status || 'PENDING')}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Certificates */}
        {submission.certificates && submission.certificates.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Certificates ({submission.certificates.length})
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Type</TableCell>
                        <TableCell>Certificate Number</TableCell>
                        <TableCell>Issued By</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {submission.certificates.map((cert: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{cert.certificateType?.replace(/_/g, ' ')}</TableCell>
                          <TableCell>{cert.certificateNumber}</TableCell>
                          <TableCell>{cert.issuedBy || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default ESWStatusTracker;
