import { useState } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Stack,
  Box,
  Chip,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import {
  FileText,
  Download,
  Calendar,
  BarChart3,
  TrendingUp,
  Package,
  DollarSign,
  Award,
  Ship,
} from 'lucide-react';
import { ModernSectionHeader } from '../components/ModernUIKit';

interface ReportsProps {
  user: any;
  org: string | null;
}

const Reports = ({ user, org }: ReportsProps): JSX.Element => {
  const [reportType, setReportType] = useState('');
  const [dateRange, setDateRange] = useState('last30days');

  const orgLower = (org || '').toLowerCase();

  // Define available reports based on organization
  const getAvailableReports = () => {
    const reports = [];

    // Exporter reports
    if (orgLower.includes('exporter')) {
      reports.push(
        { id: 'my-exports', name: 'My Export Requests', icon: <Package size={20} />, description: 'All your export requests and their status' },
        { id: 'export-summary', name: 'Export Summary', icon: <BarChart3 size={20} />, description: 'Summary of exports by status and value' },
        { id: 'financial-summary', name: 'Financial Summary', icon: <DollarSign size={20} />, description: 'Revenue and payment tracking' }
      );
    }

    // Commercial Bank reports
    if (orgLower.includes('commercial') || orgLower.includes('bank')) {
      reports.push(
        { id: 'banking-documents', name: 'Banking Documents Report', icon: <FileText size={20} />, description: 'Document verification status' },
        { id: 'compliance', name: 'Compliance Report', icon: <Award size={20} />, description: 'Banking compliance and regulatory status' },
        { id: 'transaction-volume', name: 'Transaction Volume', icon: <TrendingUp size={20} />, description: 'Export transaction volumes and trends' }
      );
    }

    // National Bank reports
    if (orgLower.includes('national') || orgLower.includes('banker')) {
      reports.push(
        { id: 'fx-approvals', name: 'FX Approval Report', icon: <DollarSign size={20} />, description: 'Foreign exchange approval statistics' },
        { id: 'compliance', name: 'Regulatory Compliance', icon: <Award size={20} />, description: 'Compliance monitoring and audit trail' },
        { id: 'monetary-policy', name: 'Monetary Policy Impact', icon: <TrendingUp size={20} />, description: 'Impact analysis of monetary policies' }
      );
    }

    // ECTA reports
    if (orgLower === 'ecta') {
      reports.push(
        { id: 'quality-certifications', name: 'Quality Certifications', icon: <Award size={20} />, description: 'Quality certification statistics' },
        { id: 'license-status', name: 'License Status Report', icon: <FileText size={20} />, description: 'Export license status and renewals' },
        { id: 'contract-approvals', name: 'Contract Approvals', icon: <FileText size={20} />, description: 'Contract approval statistics' }
      );
    }

    // Customs reports
    if (orgLower.includes('custom')) {
      reports.push(
        { id: 'customs-clearance', name: 'Customs Clearance Report', icon: <FileText size={20} />, description: 'Clearance processing statistics' },
        { id: 'inspection-results', name: 'Inspection Results', icon: <Award size={20} />, description: 'Inspection outcomes and compliance' },
        { id: 'border-activity', name: 'Border Activity', icon: <TrendingUp size={20} />, description: 'Border checkpoint activity' }
      );
    }

    // Shipping Line reports
    if (orgLower.includes('shipping')) {
      reports.push(
        { id: 'shipment-tracking', name: 'Shipment Tracking Report', icon: <Ship size={20} />, description: 'Shipment status and delivery times' },
        { id: 'vessel-utilization', name: 'Vessel Utilization', icon: <BarChart3 size={20} />, description: 'Fleet utilization and efficiency' },
        { id: 'logistics-performance', name: 'Logistics Performance', icon: <TrendingUp size={20} />, description: 'Delivery performance metrics' }
      );
    }

    // Default reports for all users
    if (reports.length === 0) {
      reports.push(
        { id: 'export-overview', name: 'Export Overview', icon: <Package size={20} />, description: 'General export statistics' },
        { id: 'system-activity', name: 'System Activity', icon: <BarChart3 size={20} />, description: 'System usage and activity' }
      );
    }

    return reports;
  };

  const availableReports = getAvailableReports();

  const handleGenerateReport = () => {
    if (!reportType) {
      alert('Please select a report type');
      return;
    }

    // In a real implementation, this would call an API to generate the report
    alert(`Generating ${reportType} report for ${dateRange}...\n\nThis feature will be implemented to download PDF/Excel reports.`);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <ModernSectionHeader
        title="Reports & Analytics"
        subtitle="Generate comprehensive reports for your organization"
      />

      <Grid container spacing={3}>
        {/* Report Configuration */}
        <Grid xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Report Configuration
              </Typography>

              <Stack spacing={3} sx={{ mt: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Report Type</InputLabel>
                  <Select
                    value={reportType}
                    label="Report Type"
                    onChange={(e) => setReportType(e.target.value)}
                  >
                    {availableReports.map((report) => (
                      <MenuItem key={report.id} value={report.id}>
                        {report.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Date Range</InputLabel>
                  <Select
                    value={dateRange}
                    label="Date Range"
                    onChange={(e) => setDateRange(e.target.value)}
                  >
                    <MenuItem value="today">Today</MenuItem>
                    <MenuItem value="last7days">Last 7 Days</MenuItem>
                    <MenuItem value="last30days">Last 30 Days</MenuItem>
                    <MenuItem value="last90days">Last 90 Days</MenuItem>
                    <MenuItem value="thisyear">This Year</MenuItem>
                    <MenuItem value="custom">Custom Range</MenuItem>
                  </Select>
                </FormControl>

                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<Download />}
                  onClick={handleGenerateReport}
                  disabled={!reportType}
                >
                  Generate Report
                </Button>

                <Alert severity="info" icon={<Calendar size={16} />}>
                  Reports are generated in real-time from blockchain data
                </Alert>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Available Reports */}
        <Grid xs={12} md={8}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            Available Reports
          </Typography>

          <Grid container spacing={2}>
            {availableReports.map((report) => (
              <Grid xs={12} sm={6} key={report.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                  onClick={() => setReportType(report.id)}
                >
                  <CardContent>
                    <Stack direction="row" spacing={2} alignItems="flex-start">
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: 'primary.main',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {report.icon}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {report.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {report.description}
                        </Typography>
                        {reportType === report.id && (
                          <Chip
                            label="Selected"
                            size="small"
                            color="primary"
                            sx={{ mt: 1 }}
                          />
                        )}
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Alert severity="success" sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Export Formats Available
            </Typography>
            <Typography variant="body2">
              Reports can be exported as PDF, Excel (XLSX), or CSV formats
            </Typography>
          </Alert>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Reports;
